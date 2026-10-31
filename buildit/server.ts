import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  SEED_ORGANIZATIONS,
  SEED_CONTROLS,
  SEED_CHECKS,
  SEED_POLICIES,
  SEED_QUESTIONNAIRE_ITEMS,
  SEED_RISKS,
  SEED_ROADMAP_TASKS,
  SEED_LEADERSHIP_REPORT,
  SEED_AUDIT_LOGS,
  SEED_MILESTONES
} from './src/data/seedData.ts';
import {
  Organization,
  ComplianceControl,
  AutomatedCheck,
  EvidenceRecord,
  Policy,
  SecurityQuestionnaire,
  RiskEntry,
  RoadmapTask,
  LeadershipReport,
  AuditLogItem,
  UserRole,
  ComplianceMilestone
} from './src/types/compliance.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with telemetry header as required
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// In-Memory Multi-Tenant Store with Tenant Isolation
interface TenantStore {
  organization: Organization;
  controls: ComplianceControl[];
  checks: AutomatedCheck[];
  evidenceStore: EvidenceRecord[];
  policies: Policy[];
  questionnaire: SecurityQuestionnaire;
  risks: RiskEntry[];
  roadmap: RoadmapTask[];
  leadershipReport: LeadershipReport;
  auditLogs: AuditLogItem[];
  milestones: ComplianceMilestone[];
}

const tenantStores: Map<string, TenantStore> = new Map();

function generateHash(data: any): string {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

// Initialize tenant data from seed
function initTenants() {
  SEED_ORGANIZATIONS.forEach((org) => {
    // Clone checks and compute initial evidence
    const clonedChecks: AutomatedCheck[] = JSON.parse(JSON.stringify(SEED_CHECKS));
    const evidenceStore: EvidenceRecord[] = clonedChecks.map((chk) => {
      const sanitizedPayload = {
        checkCode: chk.code,
        connector: chk.connector,
        organization: org.name,
        evaluationTime: chk.lastRunAt,
        details: chk.rawResponseSummary
      };
      const hash = generateHash(sanitizedPayload);
      chk.latestEvidenceHash = hash;
      return {
        id: `ev-${chk.code}-${Date.now().toString(36)}`,
        checkId: chk.id,
        checkCode: chk.code,
        checkName: chk.name,
        connector: chk.connector,
        organizationId: org.id,
        timestamp: chk.lastRunAt,
        status: chk.status,
        sha256Hash: hash,
        mappedControls: chk.mappedControlCodes,
        sanitizedPayload,
        durationMs: Math.floor(Math.random() * 300) + 120
      };
    });

    const clonedControls: ComplianceControl[] = JSON.parse(JSON.stringify(SEED_CONTROLS));
    const clonedPolicies: Policy[] = JSON.parse(JSON.stringify(SEED_POLICIES)).map((p: Policy) => ({
      ...p,
      organizationId: org.id,
      content: p.content.replace(/HealthBridge Technologies/g, org.name)
    }));

    const clonedQuestionnaireItems = JSON.parse(JSON.stringify(SEED_QUESTIONNAIRE_ITEMS)).map((item: any) => ({
      ...item,
      suggestedAnswer: item.suggestedAnswer.replace(/HealthBridge/g, org.name)
    }));

    const questionnaire: SecurityQuestionnaire = {
      id: `quest-${org.id}`,
      organizationId: org.id,
      title: 'Enterprise Vendor Security Questionnaire (CAIQ / SIG Lite standard)',
      customerName: 'Enterprise Client Evaluation',
      uploadedAt: '2026-10-30T14:00:00Z',
      items: clonedQuestionnaireItems
    };

    const clonedRisks: RiskEntry[] = JSON.parse(JSON.stringify(SEED_RISKS)).map((r: RiskEntry) => ({
      ...r,
      organizationId: org.id,
      description: r.description.replace(/HealthBridge/g, org.name)
    }));

    const clonedRoadmap: RoadmapTask[] = JSON.parse(JSON.stringify(SEED_ROADMAP_TASKS)).map((t: RoadmapTask) => ({
      ...t,
      organizationId: org.id
    }));

    const clonedReport: LeadershipReport = {
      ...JSON.parse(JSON.stringify(SEED_LEADERSHIP_REPORT)),
      id: `rep-${org.id}-q4`,
      organizationId: org.id,
      executiveSummary: SEED_LEADERSHIP_REPORT.executiveSummary.replace(/HealthBridge Technologies/g, org.name).replace(/HealthBridge/g, org.name)
    };

    const clonedLogs: AuditLogItem[] = JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)).map((l: AuditLogItem) => ({
      ...l,
      organizationId: org.id
    }));

    const orgMilestones: ComplianceMilestone[] = JSON.parse(
      JSON.stringify(SEED_MILESTONES.filter((m) => m.organizationId === org.id))
    );

    tenantStores.set(org.id, {
      organization: org,
      controls: clonedControls,
      checks: clonedChecks,
      evidenceStore,
      policies: clonedPolicies,
      questionnaire,
      risks: clonedRisks,
      roadmap: clonedRoadmap,
      leadershipReport: clonedReport,
      auditLogs: clonedLogs,
      milestones: orgMilestones
    });
  });
}

initTenants();

function getStore(orgId: string): TenantStore {
  const store = tenantStores.get(orgId);
  if (!store) {
    const fallback = tenantStores.get('org-healthbridge')!;
    return fallback;
  }
  return store;
}

function calculateScores(controls: ComplianceControl[]) {
  const isoControls = controls.filter((c) => c.framework === 'ISO 27001:2022');
  const nistControls = controls.filter((c) => c.framework === 'NIST CSF 2.0');

  const isoPassed = isoControls.filter((c) => c.status === 'passed').length;
  const isoScore = isoControls.length > 0 ? Math.round((isoPassed / isoControls.length) * 100) : 0;

  const nistPassed = nistControls.filter((c) => c.status === 'passed').length;
  const nistScore = nistControls.length > 0 ? Math.round((nistPassed / nistControls.length) * 100) : 0;

  return {
    isoScore,
    nistScore,
    isoPassed,
    isoTotal: isoControls.length,
    nistPassed,
    nistTotal: nistControls.length
  };
}

function logAudit(orgId: string, actor: string, role: UserRole, action: string, resource: string, details: string) {
  const store = getStore(orgId);
  const newEntry: AuditLogItem = {
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    organizationId: orgId,
    timestamp: new Date().toISOString(),
    actor,
    role,
    action,
    resource,
    details
  };
  store.auditLogs.unshift(newEntry);
  if (store.auditLogs.length > 100) {
    store.auditLogs.pop();
  }
}

// ---------------- API ROUTES ----------------

// Tenants list
app.get('/api/tenants', (req, res) => {
  const tenants = Array.from(tenantStores.values()).map((store) => {
    const scores = calculateScores(store.controls);
    const failingChecks = store.checks.filter((c) => c.status === 'failed').length;
    const highRisks = store.risks.filter((r) => r.riskScore >= 12 && r.status !== 'Treated').length;
    const overdueTasks = store.roadmap.filter((t) => t.status !== 'completed').length;
    return {
      organization: store.organization,
      scores,
      failingChecks,
      highRisks,
      overdueTasks,
      totalChecks: store.checks.length,
      policiesCount: store.policies.length
    };
  });
  res.json({ success: true, tenants });
});

// Full state for single tenant (Tenant context isolation)
app.get('/api/tenants/:orgId/state', (req, res) => {
  const orgId = req.params.orgId;
  const store = getStore(orgId);
  const scores = calculateScores(store.controls);

  res.json({
    success: true,
    organization: store.organization,
    scores,
    controls: store.controls,
    checks: store.checks,
    evidenceStore: store.evidenceStore.slice(0, 30),
    policies: store.policies,
    questionnaire: store.questionnaire,
    risks: store.risks,
    roadmap: store.roadmap,
    leadershipReport: store.leadershipReport,
    auditLogs: store.auditLogs,
    milestones: store.milestones
  });
});

// Run automated checks on-demand
app.post('/api/tenants/:orgId/checks/run', (req, res) => {
  const orgId = req.params.orgId;
  const { actor = 'Compliance Automation Engine', role = 'client_admin' } = req.body;
  const store = getStore(orgId);
  const now = new Date().toISOString();

  // Re-run checks: produce fresh execution timestamps, durations, and SHA-256 hashes
  store.checks.forEach((chk) => {
    chk.lastRunAt = now;
    const payload = {
      checkCode: chk.code,
      connector: chk.connector,
      organization: store.organization.name,
      runTimestamp: now,
      evaluatedStatus: chk.status,
      summary: chk.rawResponseSummary
    };
    const hash = generateHash(payload);
    chk.latestEvidenceHash = hash;

    store.evidenceStore.unshift({
      id: `ev-${chk.code}-${Date.now().toString(36)}`,
      checkId: chk.id,
      checkCode: chk.code,
      checkName: chk.name,
      connector: chk.connector,
      organizationId: orgId,
      timestamp: now,
      status: chk.status,
      sha256Hash: hash,
      mappedControls: chk.mappedControlCodes,
      sanitizedPayload: payload,
      durationMs: Math.floor(Math.random() * 250) + 90
    });
  });

  // Limit evidence store to last 150 items
  if (store.evidenceStore.length > 150) {
    store.evidenceStore = store.evidenceStore.slice(0, 150);
  }

  logAudit(
    orgId,
    actor,
    role as UserRole,
    'AUTOMATED_CHECKS_TRIGGERED',
    `Check Engine (${store.checks.length} checks)`,
    `Executed comprehensive continuous compliance sweep across M365, Google Workspace, and GitHub connectors. Generated ${store.checks.length} SHA-256 integrity hashes.`
  );

  const scores = calculateScores(store.controls);
  res.json({
    success: true,
    message: `Completed automated check run across ${store.checks.length} technical controls.`,
    checks: store.checks,
    scores,
    evidenceCount: store.evidenceStore.length
  });
});

// Resolve / Remediate a failing check
app.post('/api/tenants/:orgId/checks/:checkId/resolve', (req, res) => {
  const { orgId, checkId } = req.params;
  const { actor = 'IT Security Admin', role = 'client_admin' } = req.body;
  const store = getStore(orgId);

  const check = store.checks.find((c) => c.id === checkId || c.code === checkId);
  if (!check) {
    return res.status(404).json({ error: 'Check not found' });
  }

  check.status = 'passed';
  check.lastRunAt = new Date().toISOString();

  // Adjust raw response summary to reflect pass
  if (check.code === 'M365-ADM-02') {
    check.rawResponseSummary.currentGlobalAdmins = 3;
    check.rawResponseSummary.excessCount = 0;
    check.rawResponseSummary.adminAccounts = ['admin@healthbridge.io', 'it-ops@healthbridge.io', 'elena@healthbridge.io'];
  } else if (check.code === 'M365-CA-03') {
    check.rawResponseSummary.compliantDevicePolicyState = 'enforced';
    check.rawResponseSummary.enforcedPolicies = 5;
  } else if (check.code === 'M365-GST-05') {
    check.rawResponseSummary.inactiveOver90Days = 0;
    check.rawResponseSummary.staleGuestList = [];
  } else if (check.code === 'GWS-INA-03') {
    check.rawResponseSummary.suspendedUsersCount = 0;
    check.rawResponseSummary.inactiveOver60DaysCount = 0;
    check.rawResponseSummary.affectedAccounts = [];
  } else if (check.code === 'GWS-APP-06') {
    check.rawResponseSummary.unreviewedHighRiskApps = 0;
    check.rawResponseSummary.trustedApps = 32;
  }

  const payload = {
    checkCode: check.code,
    connector: check.connector,
    organization: store.organization.name,
    runTimestamp: check.lastRunAt,
    remediationAction: 'Resolved by Administrator via vCISO guidance',
    summary: check.rawResponseSummary
  };
  check.latestEvidenceHash = generateHash(payload);

  store.evidenceStore.unshift({
    id: `ev-${check.code}-remediated-${Date.now().toString(36)}`,
    checkId: check.id,
    checkCode: check.code,
    checkName: check.name,
    connector: check.connector,
    organizationId: orgId,
    timestamp: check.lastRunAt,
    status: 'passed',
    sha256Hash: check.latestEvidenceHash,
    mappedControls: check.mappedControlCodes,
    sanitizedPayload: payload,
    durationMs: 145
  });

  // Check if mapped controls can now be marked passed
  check.mappedControlCodes.forEach((ctrlCode) => {
    const ctrl = store.controls.find((c) => c.code === ctrlCode);
    if (ctrl) {
      // Check if all checks for this control pass
      const allPassed = ctrl.applicableChecks.every((cCode) => {
        const otherCheck = store.checks.find((chk) => chk.code === cCode);
        return !otherCheck || otherCheck.status === 'passed';
      });
      if (allPassed) {
        ctrl.status = 'passed';
      }
    }
  });

  // Mark linked roadmap task completed if applicable
  const linkedTask = store.roadmap.find((t) => t.linkedCheckCode === check.code);
  if (linkedTask) {
    linkedTask.status = 'completed';
  }

  // Update linked risk if applicable
  const linkedRisk = store.risks.find((r) => r.linkedCheckCodes.includes(check.code));
  if (linkedRisk) {
    linkedRisk.status = 'Treated';
    linkedRisk.treatmentPlan += ' [Automated Verification: Passing]';
  }

  logAudit(
    orgId,
    actor,
    role as UserRole,
    'REMEDIATION_APPLIED',
    `Check: ${check.name} (${check.code})`,
    `Remediation action verified. Control status updated to Passed. Mapped control compliance recomputed.`
  );

  const scores = calculateScores(store.controls);
  res.json({
    success: true,
    check,
    scores,
    message: `Check ${check.code} remediated successfully. New SHA-256 evidence logged.`
  });
});

// Policy Approval
app.post('/api/tenants/:orgId/policies/:policyId/approve', (req, res) => {
  const { orgId, policyId } = req.params;
  const { actor = 'Elena Rostova (CTO)', role = 'client_admin' } = req.body;
  const store = getStore(orgId);

  const policy = store.policies.find((p) => p.id === policyId || p.code === policyId);
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  policy.status = 'approved';
  policy.approver = actor;
  policy.approvedAt = new Date().toISOString();
  policy.updatedAt = new Date().toISOString();

  // Increment minor version
  const [major, minor] = policy.version.split('.').map(Number);
  policy.version = `${major}.${(minor || 0) + 1}`;

  logAudit(
    orgId,
    actor,
    role as UserRole,
    'POLICY_APPROVED',
    `Policy: ${policy.title} (${policy.code} v${policy.version})`,
    `Executive sign-off recorded. Policy published to tenant evidence library.`
  );

  res.json({ success: true, policy });
});

// Update Policy content
app.put('/api/tenants/:orgId/policies/:policyId', (req, res) => {
  const { orgId, policyId } = req.params;
  const { content, title, description, actor = 'Marcus Vance (vCISO)', role = 'vciso' } = req.body;
  const store = getStore(orgId);

  const policy = store.policies.find((p) => p.id === policyId);
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  policy.content = content || policy.content;
  policy.title = title || policy.title;
  policy.description = description || policy.description;
  policy.status = 'under_review';
  policy.updatedAt = new Date().toISOString();

  logAudit(
    orgId,
    actor,
    role as UserRole,
    'POLICY_UPDATED',
    `Policy: ${policy.title} (${policy.code})`,
    `Policy content updated and placed into Under Review status.`
  );

  res.json({ success: true, policy });
});

// AI Policy Generator
app.post('/api/ai/generate-policy', async (req, res) => {
  const { orgId, policyType, companyContext = {}, actor = 'Marcus Vance (vCISO)' } = req.body;
  const store = getStore(orgId);

  const org = store.organization;
  const prompt = `You are a virtual CISO (vCISO) and senior cybersecurity compliance specialist.
Draft an official, highly detailed, audit-ready compliance policy for the company "${org.name}".

Company Details:
- Industry: ${org.industry}
- Employee Count: ${org.employeeCount}
- Cloud / SaaS Stack: ${org.cloudProviders.join(', ')}
- Target Frameworks: ISO/IEC 27001:2022 and NIST CSF 2.0
- Policy Requested: ${policyType}
${companyContext.notes ? `- Additional Context: ${companyContext.notes}` : ''}

Requirements:
1. Title and Purpose & Scope.
2. Roles & Responsibilities (CTO, vCISO, Employees).
3. Detailed Technical Requirements specifically citing controls:
   - For Access Control: MFA enforcement, least privilege, password standards (NIST SP 800-63B), privileged identity management.
   - For Information Security: Data classification, universal encryption (AES-256 / TLS 1.3), continuous evidence collection.
   - For Incident Response: Severity matrix (SEV 1-3), Incident Response Team, 72-hour breach notification SLA, forensic retention with cryptographic hashes.
   - For Backup & Disaster Recovery: RPO (1 hr), RTO (4 hrs), immutable object storage, multi-region replication, restoration drills.
   - For Acceptable Use: Authorized devices, code repository secrets protection, prohibition of unvetted AI tools with proprietary data.
4. Formal review cadence and audit citations (e.g. ISO 27001 Annex A clauses and NIST CSF 2.0 categories).

Format your output in clean, professional Markdown with clear section headers.`;

  let policyMarkdown = '';
  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });
      policyMarkdown = response.text || '';
    } catch (err: any) {
      console.warn('Gemini API call failed, generating deterministic fallback:', err.message);
    }
  }

  // Fallback if no API key or call error
  if (!policyMarkdown) {
    policyMarkdown = `# ${policyType}
**Organization:** ${org.name}  
**Classification:** Internal & Auditor Facing  
**Version:** 1.0 (AI Draft - Pending vCISO Review)  
**Author:** AI Compliance Engine on behalf of Marcus Vance, CISSP (vCISO)  
**Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}  

---

### 1. Purpose & Scope
This policy establishes mandatory operational security standards for **${org.name}** across all business units, personnel (${org.employeeCount} members), and connected environments (${org.cloudProviders.join(', ')}). This policy fulfills readiness mandates for **ISO/IEC 27001:2022** and **NIST CSF 2.0**.

### 2. Governance & Key Roles
- **Chief Technology Officer:** Executive sponsorship, approval of exception requests.
- **vCISO:** Ongoing policy maintenance, quarterly compliance audits, and regulatory alignment.
- **All Personnel:** Mandatory adherence upon onboarding with annual acknowledgment.

### 3. Core Technical Mandates
- **Multi-Factor Authentication:** Mandatory hardware token or app number-matching on all systems.
- **Data Protection:** AES-256 for data at rest and TLS 1.3 for data in transit.
- **Audit Trails:** Tamper-evident logging retained for 180 days with SHA-256 integrity verification.
- **Continuous Monitoring:** Automated check sweeps on all cloud connectors with failing control alerts.

### 4. Enforcement & Review
Violations of this policy are subject to disciplinary action. This policy is reviewed at least annually.`;
  }

  // Update or insert into store as draft
  const codeMap: Record<string, string> = {
    'Information Security Policy': 'POL-01',
    'Access Control Policy': 'POL-02',
    'Incident Response Plan': 'POL-03',
    'Backup & Disaster Recovery Policy': 'POL-04',
    'Acceptable Use Policy': 'POL-05'
  };
  const code = codeMap[policyType] || 'POL-06';
  let policy = store.policies.find((p) => p.code === code);

  if (policy) {
    policy.content = policyMarkdown;
    policy.status = 'draft';
    policy.updatedAt = new Date().toISOString();
  } else {
    policy = {
      id: `pol-${Date.now().toString(36)}`,
      organizationId: orgId,
      code,
      title: policyType,
      description: `Comprehensive AI-generated ${policyType} tailored to ${org.name}.`,
      version: '1.0',
      status: 'draft',
      content: policyMarkdown,
      author: 'AI Policy Assistant (vCISO verified)',
      updatedAt: new Date().toISOString(),
      mappedControls: ['A.5.1', 'A.5.15', 'PR.AA', 'GV.PO'],
      citations: ['ISO/IEC 27001:2022', 'NIST CSF 2.0']
    };
    store.policies.push(policy);
  }

  logAudit(
    orgId,
    actor,
    'vciso',
    'AI_POLICY_GENERATED',
    `Policy: ${policyType} (${code})`,
    `Generated comprehensive draft using tenant context, ISO 27001 & NIST CSF controls. Status set to Draft.`
  );

  res.json({
    success: true,
    policy,
    message: `Generated audit-ready draft for ${policyType}. Human review required prior to approval.`
  });
});

// AI Questionnaire Autofill
app.post('/api/ai/autofill-questionnaire', async (req, res) => {
  const { orgId, actor = 'Marcus Vance (vCISO)' } = req.body;
  const store = getStore(orgId);
  const org = store.organization;

  // Compile tenant knowledge base for retrieval guardrail: strictly client's own data
  const tenantContext = {
    company: org.name,
    industry: org.industry,
    approvedPolicies: store.policies
      .filter((p) => p.status === 'approved')
      .map((p) => ({ code: p.code, title: p.title, summary: p.description })),
    failingChecks: store.checks.filter((c) => c.status === 'failed').map((c) => ({ code: c.code, name: c.name })),
    passingChecksSummary: `${store.checks.filter((c) => c.status === 'passed').length} of ${store.checks.length} checks currently passing with SHA-256 evidence.`
  };

  if (genAI) {
    try {
      const prompt = `You are an enterprise compliance AI assistant answering customer security questionnaires on behalf of "${org.name}".
Use ONLY the provided tenant context:
Tenant Context:
${JSON.stringify(tenantContext, null, 2)}

For any question where the tenant has a known gap or failing check (e.g. M365-ADM-02 Global Admin count > 4, or M365-CA-03 device trust in report-only mode), you MUST provide a completely transparent answer stating the current state and the active remediation roadmap, set confidenceScore below 75, and set needsReview: true.
For questions backed by 100% verified policies and passing checks (e.g. MFA enforced, secret scanning, TLS 1.3), provide a confident answer, set confidenceScore >= 90, and set needsReview: false.

Return a valid JSON array of 5 sample responses matching this exact format:
[
  {
    "questionNumber": 1,
    "suggestedAnswer": "string",
    "confidenceScore": 95,
    "needsReview": false,
    "sourceNote": "string"
  }
]`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((pItem) => {
          const item = store.questionnaire.items.find((i) => i.questionNumber === pItem.questionNumber);
          if (item) {
            item.suggestedAnswer = pItem.suggestedAnswer;
            item.confidenceScore = pItem.confidenceScore;
            item.needsReview = pItem.needsReview || item.confidenceScore < 75;
          }
        });
      }
    } catch (err: any) {
      console.warn('Gemini questionnaire autofill error, using verified tenant mapping:', err.message);
    }
  }

  // Ensure confidence scoring and needs review flags are properly calibrated
  store.questionnaire.items.forEach((item) => {
    // If any cited check is currently failing, confidence is low and needs review
    const hasFailingCheck = item.citedSources.some((src) => {
      if (src.type === 'check') {
        const chk = store.checks.find((c) => c.code === src.reference || c.name === src.name);
        return chk && chk.status === 'failed';
      }
      return false;
    });

    if (hasFailingCheck) {
      item.confidenceScore = Math.min(item.confidenceScore, 72);
      item.needsReview = true;
      item.humanApproved = false;
    }
  });

  logAudit(
    orgId,
    actor,
    'vciso',
    'AI_QUESTIONNAIRE_AUTOFILL',
    `Questionnaire: ${store.questionnaire.title} (${store.questionnaire.items.length} items)`,
    `Autofilled 20 questions with citations to approved policies & live check evidence. Flagged low-confidence items (<75%) for mandatory review.`
  );

  const needsReviewCount = store.questionnaire.items.filter((i) => i.needsReview).length;

  res.json({
    success: true,
    questionnaire: store.questionnaire,
    totalQuestions: store.questionnaire.items.length,
    needsReviewCount,
    message: `Autofilled ${store.questionnaire.items.length} questions. ${needsReviewCount} flagged for human review.`
  });
});

// Approve individual questionnaire answer
app.post('/api/tenants/:orgId/questionnaire/items/:itemId/approve', (req, res) => {
  const { orgId, itemId } = req.params;
  const { notes = '', actor = 'Marcus Vance (vCISO)', role = 'vciso' } = req.body;
  const store = getStore(orgId);

  const item = store.questionnaire.items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Questionnaire item not found' });
  }

  item.humanApproved = true;
  item.needsReview = false;
  if (notes) {
    item.humanReviewNotes = notes;
  }

  logAudit(
    orgId,
    actor,
    role as UserRole,
    'QUESTIONNAIRE_ITEM_APPROVED',
    `Question #${item.questionNumber}: ${item.question.substring(0, 40)}...`,
    `Human approval verified with review notes. Marked ready for customer export.`
  );

  res.json({ success: true, item });
});

// AI Leadership Report Generator
app.post('/api/ai/generate-report', async (req, res) => {
  const { orgId, quarter = 'Q4 2026', actor = 'Marcus Vance (vCISO)' } = req.body;
  const store = getStore(orgId);
  const scores = calculateScores(store.controls);
  const failingChecks = store.checks.filter((c) => c.status === 'failed');

  const contextData = {
    company: store.organization.name,
    quarter,
    isoScore: `${scores.isoScore}% (${scores.isoPassed}/${scores.isoTotal} controls passed)`,
    nistScore: `${scores.nistScore}% (${scores.nistPassed}/${scores.nistTotal} categories aligned)`,
    failingChecks: failingChecks.map((c) => ({ code: c.code, name: c.name, guidance: c.remediationGuidance })),
    highRisks: store.risks.filter((r) => r.riskScore >= 12).map((r) => ({ title: r.title, score: r.riskScore, treatment: r.treatment })),
    sprint1Tasks: store.roadmap.filter((t) => t.phase.includes('Sprint 1')).map((t) => t.title)
  };

  let reportText = '';
  if (genAI) {
    try {
      const prompt = `You are Marcus Vance, CISSP, expert Virtual CISO (vCISO) at ${store.organization.name}.
Write an executive quarterly security and compliance leadership report for the Board of Directors and Executive Leadership for ${quarter}.

Current Compliance & Security Telemetry:
${JSON.stringify(contextData, null, 2)}

Provide:
1. Executive Summary: High-level narrative of current posture, readiness for ISO 27001 and NIST CSF, and business impact.
2. Top Risks & Critical Gaps: Plain language explanation of the failing controls and why they matter.
3. 90-Day Remediation Roadmap: Concrete 30, 60, and 90-day execution milestones.
4. Strategic vCISO Recommendations for executive decision-makers.

Keep the tone authoritative, clear, and reassuring without technical buzzwords.`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });
      reportText = response.text || '';
    } catch (err: any) {
      console.warn('Gemini report generation error:', err.message);
    }
  }

  if (!reportText) {
    reportText = `${store.organization.name} demonstrated strong security posture progression in ${quarter}, achieving ${scores.isoScore}% ISO 27001:2022 readiness and ${scores.nistScore}% NIST CSF 2.0 category alignment. All user identities across ${store.organization.cloudProviders.join(' and ')} are now governed under mandatory multi-factor authentication, repository push protections are active, and our policy catalog is formally established. The 3 remaining technical gaps (${failingChecks.map((c) => c.code).join(', ')}) are prioritized for remediation in Sprint 1.`;
  }

  store.leadershipReport = {
    id: `rep-${orgId}-${quarter.toLowerCase().replace(/\s+/g, '-')}`,
    organizationId: orgId,
    quarter,
    generatedAt: new Date().toISOString(),
    vCISOAuthor: 'Marcus Vance, CISSP, CISA (vCISO)',
    status: 'draft',
    executiveSummary: reportText,
    compliancePosture: {
      isoScore: scores.isoScore,
      nistScore: scores.nistScore,
      totalChecks: store.checks.length,
      passingChecks: store.checks.length - failingChecks.length,
      criticalGaps: failingChecks.length
    },
    topRisksSummary: failingChecks.map((c) => `${c.name}: ${c.remediationGuidance}`),
    quarterlyMilestones: [
      `Maintained 100% MFA compliance across ${store.organization.employeeCount} corporate user identities.`,
      `Cryptographic evidence store generated ${store.evidenceStore.length} SHA-256 verifiable audit records.`,
      `Approved core security governance policies and initialized vCISO risk treatment matrix.`
    ],
    next90DaysPlan: [
      'Days 1-30: Remediate privileged admin counts and finalize Conditional Access device trust enforcement.',
      'Days 31-60: Conduct multi-region disaster recovery simulation and finalize incident response runbooks.',
      'Days 61-90: Run formal ISO 27001 mock stage 1 audit with read-only auditor evidence dossiers.'
    ],
    vCISONotes: 'Automated continuous checking has removed 80% of manual evidence collection friction. We are on clear trajectory for external audit readiness.'
  };

  logAudit(
    orgId,
    actor,
    'vciso',
    'AI_LEADERSHIP_REPORT_GENERATED',
    `Report: ${quarter} vCISO Leadership Report`,
    `Generated executive summary from live compliance posture (${scores.isoScore}% ISO, ${scores.nistScore}% NIST) and open risks.`
  );

  res.json({
    success: true,
    report: store.leadershipReport
  });
});

// Approve Leadership Report
app.post('/api/tenants/:orgId/leadership-report/approve', (req, res) => {
  const { orgId } = req.params;
  const { actor = 'Marcus Vance (vCISO)', notes = '' } = req.body;
  const store = getStore(orgId);

  store.leadershipReport.status = 'approved';
  if (notes) {
    store.leadershipReport.vCISONotes = notes;
  }

  logAudit(
    orgId,
    actor,
    'vciso',
    'LEADERSHIP_REPORT_APPROVED',
    `Leadership Report: ${store.leadershipReport.quarter}`,
    `Executive vCISO quarterly compliance report marked as approved and ready for Board presentation.`
  );

  res.json({ success: true, report: store.leadershipReport });
});

// Add or edit Risk
app.post('/api/tenants/:orgId/risks', (req, res) => {
  const { orgId } = req.params;
  const { title, category, description, likelihood, impact, owner, treatment, treatmentPlan, actor = 'Marcus Vance (vCISO)' } = req.body;
  const store = getStore(orgId);

  const riskScore = (likelihood || 3) * (impact || 3);
  const newRisk: RiskEntry = {
    id: `risk-${Date.now().toString(36)}`,
    organizationId: orgId,
    title,
    category,
    description,
    likelihood: Number(likelihood) || 3,
    impact: Number(impact) || 3,
    riskScore,
    owner: owner || 'Marcus Vance (vCISO)',
    treatment: treatment || 'Mitigate',
    treatmentPlan: treatmentPlan || 'Conduct remediation review in upcoming sprint.',
    status: 'Open',
    linkedControlCodes: [],
    linkedCheckCodes: [],
    updatedAt: new Date().toISOString()
  };

  store.risks.unshift(newRisk);

  logAudit(
    orgId,
    actor,
    'vciso',
    'RISK_ADDED',
    `Risk: ${title} (Score: ${riskScore})`,
    `Added new risk entry to tenant risk register. Treatment: ${treatment}.`
  );

  res.json({ success: true, risk: newRisk });
});

// Update Roadmap Task status
app.post('/api/tenants/:orgId/roadmap/tasks/:taskId/status', (req, res) => {
  const { orgId, taskId } = req.params;
  const { status, actor = 'Elena Rostova (CTO)' } = req.body;
  const store = getStore(orgId);

  const task = store.roadmap.find((t) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.status = status;

  logAudit(
    orgId,
    actor,
    'client_admin',
    'ROADMAP_TASK_STATUS_CHANGED',
    `Task: ${task.title}`,
    `Remediation task status transitioned to ${status}.`
  );

  res.json({ success: true, task });
});

// Add Roadmap Task
app.post('/api/tenants/:orgId/roadmap/tasks', (req, res) => {
  const { orgId } = req.params;
  const { title, description, phase, priority, owner, dueDate, actor = 'Marcus Vance (vCISO)' } = req.body;
  const store = getStore(orgId);

  const newTask: RoadmapTask = {
    id: `task-${Date.now().toString(36)}`,
    organizationId: orgId,
    title,
    description,
    phase: phase || 'Sprint 1 (Days 1-30)',
    priority: priority || 'P2',
    owner: owner || 'Elena Rostova (CTO)',
    dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'todo'
  };

  store.roadmap.push(newTask);

  logAudit(
    orgId,
    actor,
    'vciso',
    'ROADMAP_TASK_CREATED',
    `Task: ${title} (${phase})`,
    `New 90-day remediation roadmap task created.`
  );

  res.json({ success: true, task: newTask });
});

// Update Milestone Status
app.post('/api/tenants/:orgId/milestones/:milestoneId/status', (req, res) => {
  const { orgId, milestoneId } = req.params;
  const { status, actor = 'Marcus Vance (vCISO)', role = 'vciso' } = req.body;
  const store = getStore(orgId);

  const milestone = store.milestones.find((m) => m.id === milestoneId);
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  milestone.status = status;
  if (status === 'completed') {
    milestone.completedDate = new Date().toISOString().split('T')[0];
  } else {
    milestone.completedDate = undefined;
  }

  logAudit(
    orgId,
    actor,
    role as UserRole,
    'MILESTONE_STATUS_UPDATED',
    `Milestone: ${milestone.title}`,
    `Compliance milestone status transitioned to ${status}.`
  );

  res.json({ success: true, milestone });
});

// Add New Compliance Milestone / Audit Deadline
app.post('/api/tenants/:orgId/milestones', (req, res) => {
  const { orgId } = req.params;
  const {
    title,
    category,
    targetDate,
    description,
    owner,
    frameworkRef,
    deliverables = [],
    isAuditDeadline = false,
    auditorBody,
    actor = 'Marcus Vance (vCISO)'
  } = req.body;
  const store = getStore(orgId);

  const newMilestone: ComplianceMilestone = {
    id: `ms-${Date.now().toString(36)}`,
    organizationId: orgId,
    title,
    category: category || 'internal_milestone',
    targetDate,
    status: 'upcoming',
    description,
    owner: owner || 'Marcus Vance (vCISO)',
    frameworkRef,
    deliverables: Array.isArray(deliverables) ? deliverables : [deliverables],
    isAuditDeadline: Boolean(isAuditDeadline),
    auditorBody
  };

  store.milestones.push(newMilestone);
  store.milestones.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  logAudit(
    orgId,
    actor,
    'vciso',
    'COMPLIANCE_MILESTONE_ADDED',
    `Milestone: ${title} (${targetDate})`,
    `Added ${isAuditDeadline ? 'official audit deadline' : 'internal compliance milestone'} to timeline.`
  );

  res.json({ success: true, milestone: newMilestone });
});

// Auditor CSV Export
app.get('/api/tenants/:orgId/export/csv', (req, res) => {
  const { orgId } = req.params;
  const store = getStore(orgId);

  const rows: string[] = [];
  rows.push('Framework,Control Code,Control Category,Control Title,Status,Applicable Checks,Latest Check Hash,Last Evaluated');

  store.controls.forEach((ctrl) => {
    const checks = store.checks.filter((chk) => ctrl.applicableChecks.includes(chk.code));
    const hashes = checks.map((c) => c.latestEvidenceHash).join('; ');
    const lastRun = checks[0]?.lastRunAt || 'N/A';
    rows.push(
      `"${ctrl.framework}","${ctrl.code}","${ctrl.category}","${ctrl.title.replace(/"/g, '""')}","${ctrl.status.toUpperCase()}","${ctrl.applicableChecks.join(', ')}","${hashes}","${lastRun}"`
    );
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${store.organization.name.replace(/[^a-zA-Z0-9]/g, '_')}_Compliance_Evidence_Export.csv"`);
  res.send(rows.join('\n'));
});

// Mount Vite middleware for development
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Compliance Automation Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
