import { ComplianceCalendarEvent } from '../types/compliance';

export const SEED_CALENDAR_EVENTS: ComplianceCalendarEvent[] = [
  // ==========================================
  // 1. UPCOMING QUARTERLY & REGULATORY AUDITS
  // ==========================================
  {
    id: 'cal-audit-01',
    organizationId: 'org-healthbridge',
    title: 'ISO/IEC 27001:2022 Stage 1 Readiness Audit',
    category: 'audit',
    date: '2026-11-18',
    time: '09:00 AM EST',
    duration: 'Full Day (8 hrs)',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO & Engagement Lead',
    frameworkRef: 'ISO/IEC 27001:2022 Stage 1 (Clauses 4-10 & Annex A)',
    recurrence: 'Annual',
    status: 'urgent',
    description: 'Accredited registrar documentation and scope verification audit. Formal review of ISMS governance, scope document, Statement of Applicability (SoA), and risk treatment plans.',
    deliverables: [
      'Approved ISMS Scope Document & Statement of Applicability (SoA v2.1)',
      'Management Review Minutes & Internal Audit Findings Report',
      'Cryptographic Evidence Dossier for Annex A Automated Checks'
    ],
    mandatoryForRoles: ['vCISO Lead', 'Executive Sponsor', 'Compliance Officer', 'Lead DevOps Architect'],
    auditorBody: 'BSI Group (British Standards Institution)'
  },
  {
    id: 'cal-audit-02',
    organizationId: 'org-healthbridge',
    title: 'Cloud Infrastructure Penetration Testing & External Technical Audit',
    category: 'audit',
    date: '2026-11-26',
    time: '10:00 AM EST',
    duration: '3 Days',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO & Head of Security Engineering',
    frameworkRef: 'ISO 27001 A.8.8 / NIST CSF 2.0 PR.IP-12 / SOC 2 CC7.1',
    recurrence: 'Semi-Annual',
    status: 'upcoming',
    description: 'Third-party white-box and grey-box network penetration test of multi-tenant AWS/Azure infrastructure, API gateway endpoints, and Entra ID tenant configurations.',
    deliverables: [
      'Scope Confirmation of Production API Endpoints',
      'Rules of Engagement (RoE) Document Signed',
      'Automated Vulnerability Scan Diff Report'
    ],
    mandatoryForRoles: ['Lead Cloud Architect', 'SecOps Engineer'],
    auditorBody: 'Synack / Bishop Fox Red Team'
  },
  {
    id: 'cal-audit-03',
    organizationId: 'org-healthbridge',
    title: 'Q4 2026 NIST CSF 2.0 Governance Review & Maturity Audit',
    category: 'audit',
    date: '2026-12-12',
    time: '02:00 PM EST',
    duration: '4 hrs',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO',
    frameworkRef: 'NIST CSF 2.0 (GV, ID, PR, DE, RS, RC Functions)',
    recurrence: 'Quarterly',
    status: 'upcoming',
    description: 'Quarterly internal governance audit evaluating the six NIST CSF 2.0 functions with primary emphasis on the new Govern (GV) category, supply chain risk management, and risk appetite alignment.',
    deliverables: [
      'NIST CSF 2.0 Category Maturity Scorecard',
      'Evidence Ledger Sample for Protect (PR) & Respond (RS)',
      'Quarterly Executive Risk Register Presentation'
    ],
    mandatoryForRoles: ['vCISO Lead', 'Client Admin', 'Engineering Lead'],
    auditorBody: 'Internal vCISO Audit Committee'
  },
  {
    id: 'cal-audit-04',
    organizationId: 'org-healthbridge',
    title: 'Annual Third-Party Vendor Security & SOC 2 Report Review',
    category: 'audit',
    date: '2026-12-22',
    time: '11:00 AM EST',
    duration: '3 hrs',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO & Primary Client Contact',
    frameworkRef: 'ISO 27001 A.5.19, A.5.20 / NIST CSF 2.0 GV.SC-06',
    recurrence: 'Annual',
    status: 'upcoming',
    description: 'Review of SOC 2 Type II reports, ISO certificates, and penetration testing summaries for critical sub-processors (AWS, Datadog, Sendgrid, Auth0, GitHub Enterprise).',
    deliverables: [
      'Vendor Risk Assessment Matrix v4',
      'Bridge Letters / Attestations for Expired Periods',
      'Security Exception Approvals'
    ],
    mandatoryForRoles: ['Legal Counsel', 'Procurement', 'CTO'],
    auditorBody: 'HealthBridge Vendor Risk Committee'
  },
  {
    id: 'cal-audit-05',
    organizationId: 'org-healthbridge',
    title: 'ISO/IEC 27001:2022 Stage 2 Final Certification Audit',
    category: 'audit',
    date: '2027-01-14',
    time: '08:30 AM EST',
    duration: '2 Days',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO Lead',
    frameworkRef: 'ISO/IEC 27001:2022 Stage 2 Comprehensive On-Site/Remote Audit',
    recurrence: 'Annual',
    status: 'upcoming',
    description: 'Formal accredited certification body audit evaluating live operational controls, incident response records, continuous automated checks, and personnel compliance interviews.',
    deliverables: [
      'Zero Open Major Non-Conformances',
      'Complete Automated Verification Logs for 93 Annex A Controls',
      'Formal Recommendation for Accredited Certification'
    ],
    mandatoryForRoles: ['vCISO Lead', 'Client Admin', 'CTO', 'All Sampled System Owners'],
    auditorBody: 'BSI Group Lead Auditor Team'
  },
  {
    id: 'cal-audit-06',
    organizationId: 'org-healthbridge',
    title: 'Q1 2027 SOC 2 Type II Surveillance & Observation Kickoff',
    category: 'audit',
    date: '2027-02-02',
    time: '01:00 PM EST',
    duration: '2 hrs',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO',
    frameworkRef: 'AICPA SOC 2 (Security, Availability, Confidentiality)',
    recurrence: 'Quarterly',
    status: 'upcoming',
    description: 'Kickoff meeting with CPA auditor to define population sampling dates, key evidence submission schedules, and automated API evidence sync procedures for the 6-month observation window.',
    deliverables: [
      'Agreed System Description & Control Matrix',
      'Evidence Request List (PBC List) Integration'
    ],
    mandatoryForRoles: ['vCISO', 'Compliance Officer'],
    auditorBody: 'Schellman & Company, CPA'
  },

  // ==========================================
  // 2. POLICY REVIEW DATES & GOVERNANCE CYCLES
  // ==========================================
  {
    id: 'cal-pol-01',
    organizationId: 'org-healthbridge',
    title: 'POL-01: Information Security Policy Annual Recertification',
    category: 'policy_review',
    date: '2026-11-06',
    time: '11:00 AM EST',
    duration: '1.5 hrs',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO',
    frameworkRef: 'ISO 27001 A.5.1 / NIST CSF 2.0 GV.PO-01',
    recurrence: 'Annual',
    status: 'urgent',
    description: 'Mandatory annual executive review and signature of master Information Security Policy, updating AI usage guidelines, remote work standards, and executive approval chains.',
    deliverables: [
      'POL-01 Revision v2.0 Clean & Redlined Copy',
      'Board of Directors / CEO Sign-off Memorandum',
      'Employee Distribution & Acknowledgment Plan'
    ],
    mandatoryForRoles: ['vCISO', 'Executive Leadership', 'CEO'],
    policyCode: 'POL-01'
  },
  {
    id: 'cal-pol-02',
    organizationId: 'org-healthbridge',
    title: 'POL-02: Access Control & MFA Enforcement Policy Semi-Annual Review',
    category: 'policy_review',
    date: '2026-11-20',
    time: '03:00 PM EST',
    duration: '1 hr',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO & Head of SecOps',
    frameworkRef: 'ISO 27001 A.5.15, A.5.16 / NIST CSF 2.0 PR.AA-01, PR.AA-03',
    recurrence: 'Semi-Annual',
    status: 'upcoming',
    description: 'Semi-annual policy calibration verifying strict FIDO2/WebAuthn phishing-resistant MFA thresholds, Just-In-Time (JIT) privileged access windows, and break-glass account governance.',
    deliverables: [
      'Entra ID & Google Workspace Conditional Access Policy Diff',
      'Privileged Role Assignment Audit Sheet (<4 Global Admins)'
    ],
    mandatoryForRoles: ['Identity Admin', 'CTO', 'vCISO'],
    policyCode: 'POL-02'
  },
  {
    id: 'cal-pol-03',
    organizationId: 'org-healthbridge',
    title: 'POL-03: Incident Response Plan (IRP) & Tabletop Protocol Review',
    category: 'policy_review',
    date: '2026-12-04',
    time: '01:30 PM EST',
    duration: '2 hrs',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO',
    frameworkRef: 'ISO 27001 A.5.24 - A.5.28 / NIST CSF 2.0 RS.MA, RS.CO',
    recurrence: 'Quarterly',
    status: 'upcoming',
    description: 'Quarterly update of incident classification severities (SEV-1 to SEV-4), external breach notification timelines (HIPAA 60-day, GDPR 72-hour), and escalation rosters.',
    deliverables: [
      'Updated Emergency Contact Roster & Forensic Retainer SLAs',
      'Ransomware & Cloud Compromise Playbook Revisions',
      'Executive Briefing Summary'
    ],
    mandatoryForRoles: ['Incident Commander', 'Legal Counsel', 'PR Lead', 'vCISO'],
    policyCode: 'POL-03'
  },
  {
    id: 'cal-pol-04',
    organizationId: 'org-healthbridge',
    title: 'POL-04: Cryptography & Key Management Policy Recertification',
    category: 'policy_review',
    date: '2026-12-18',
    time: '02:00 PM EST',
    duration: '1.5 hrs',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO',
    frameworkRef: 'ISO 27001 A.8.24 / NIST CSF 2.0 PR.DS-01, PR.DS-02',
    recurrence: 'Annual',
    status: 'upcoming',
    description: 'Review of cryptographic algorithms, TLS 1.3 enforcement mandates, KMS envelope encryption standards, and AWS KMS / Azure Key Vault key rotation intervals.',
    deliverables: [
      'Approved Cipher Suite Standard v2.0',
      'Automated KMS Key Rotation Audit Log',
      'Deprecation Notice for TLS 1.1 / 1.0 Residual Endpoints'
    ],
    mandatoryForRoles: ['Infrastructure Lead', 'Security Architect'],
    policyCode: 'POL-04'
  },
  {
    id: 'cal-pol-05',
    organizationId: 'org-healthbridge',
    title: 'POL-05: Vulnerability Management & Patching SLA Policy Review',
    category: 'policy_review',
    date: '2027-01-08',
    time: '10:00 AM EST',
    duration: '1 hr',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO',
    frameworkRef: 'ISO 27001 A.8.8 / NIST CSF 2.0 ID.RA-01, PR.IP-12',
    recurrence: 'Semi-Annual',
    status: 'upcoming',
    description: 'Review of SLAs for critical (14-day) and high (30-day) patch cycles across container images, serverless functions, and third-party dependency scanning.',
    deliverables: [
      'SLA Compliance Metrics for Q4 2026',
      'Dependabot / Snyk Rule Thresholds'
    ],
    mandatoryForRoles: ['DevOps Lead', 'Engineering Managers'],
    policyCode: 'POL-05'
  },
  {
    id: 'cal-pol-06',
    organizationId: 'org-healthbridge',
    title: 'POL-06: Business Continuity & Disaster Recovery (BCDR) Policy Review',
    category: 'policy_review',
    date: '2027-01-22',
    time: '02:00 PM EST',
    duration: '2 hrs',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO Lead',
    frameworkRef: 'ISO 27001 A.5.29, A.5.30 / NIST CSF 2.0 RC.RP-01',
    recurrence: 'Annual',
    status: 'upcoming',
    description: 'Annual calibration of Recovery Time Objectives (RTO < 4 hrs) and Recovery Point Objectives (RPO < 15 mins), multi-region database failover, and cold backup integrity verification.',
    deliverables: [
      'BCDR Policy Document v2.3 Signed',
      'Q3 Database Restore Verification Test Log'
    ],
    mandatoryForRoles: ['vCISO', 'Cloud Operations Lead', 'CTO'],
    policyCode: 'POL-06'
  },
  {
    id: 'cal-pol-07',
    organizationId: 'org-healthbridge',
    title: 'POL-07: Third-Party & Supply Chain Risk Management Policy Review',
    category: 'policy_review',
    date: '2027-02-06',
    time: '11:00 AM EST',
    duration: '1.5 hrs',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO & Legal Liaison',
    frameworkRef: 'ISO 27001 A.5.19 - A.5.22 / NIST CSF 2.0 GV.SC-01',
    recurrence: 'Annual',
    status: 'upcoming',
    description: 'Review of vendor onboarding security criteria, sub-processor data processing addenda (DPA), and right-to-audit clauses across SaaS dependencies.',
    deliverables: [
      'Updated Vendor Security Assessment Questionnaire',
      'Critical Vendor Tiering Matrix 2027'
    ],
    mandatoryForRoles: ['Procurement', 'Legal', 'vCISO'],
    policyCode: 'POL-07'
  },

  // ==========================================
  // 3. RECURRING TRAINING DEADLINES
  // ==========================================
  {
    id: 'cal-train-01',
    organizationId: 'org-healthbridge',
    title: 'Q4 Mandatory Company-Wide Phishing Simulation & Awareness Cutoff',
    category: 'training',
    date: '2026-11-14',
    time: '11:59 PM EST',
    duration: 'Cutoff Deadline',
    owner: 'HR & People Operations',
    ownerRole: 'Security Awareness Coordinator',
    frameworkRef: 'ISO 27001 A.6.3 / NIST CSF 2.0 PR.AT-01',
    recurrence: 'Quarterly',
    status: 'urgent',
    description: 'Mandatory quarterly awareness training and simulated spear-phishing click test. Employees who fail must complete micro-learning within 48 hours to maintain email network access.',
    deliverables: [
      '100% Training Completion Report across 52 Employees',
      'Phishing Simulation Failure & Retraining Statistics (<3% click rate target)',
      'Escalation List for Non-Compliant Users'
    ],
    mandatoryForRoles: ['All Full-time Employees', 'Contractors', 'Executives']
  },
  {
    id: 'cal-train-02',
    organizationId: 'org-healthbridge',
    title: 'DevOps & Engineering OWASP Top 10 Secure Coding Recertification',
    category: 'training',
    date: '2026-11-28',
    time: '05:00 PM EST',
    duration: 'Cutoff Deadline',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO & Engineering Manager',
    frameworkRef: 'ISO 27001 A.8.28 / NIST CSF 2.0 PR.AT-02 / SOC 2 CC7.2',
    recurrence: 'Semi-Annual',
    status: 'upcoming',
    description: 'Interactive secure development training covering OWASP Top 10 (Injection, Broken Object Level Auth, Server-Side Request Forgery, Insecure Cryptography) and secret management in CI/CD.',
    deliverables: [
      'Engineering Staff Completion Certificates',
      'Hands-on Lab Exercise Scorecards',
      'GitHub Branch Protection Policy Verification'
    ],
    mandatoryForRoles: ['Software Engineers', 'DevOps Engineers', 'QA Engineers', 'Tech Leads']
  },
  {
    id: 'cal-train-03',
    organizationId: 'org-healthbridge',
    title: 'HIPAA ePHI Security & Healthcare Privacy Annual Recertification',
    category: 'training',
    date: '2026-12-15',
    time: '11:59 PM EST',
    duration: 'Cutoff Deadline',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Compliance Officer & vCISO',
    frameworkRef: 'HIPAA Security Rule 45 CFR § 164.308(a)(5) / NIST CSF 2.0 PR.AT-01',
    recurrence: 'Annual',
    status: 'upcoming',
    description: 'Annual regulatory training covering protected health information (ePHI) handling, minimum necessary rule, patient rights under HIPAA, and immediate breach notification protocols.',
    deliverables: [
      'Individual Attestation Signatures',
      'Regulatory Training Record Ledger for HHS/OCR Audit Defense'
    ],
    mandatoryForRoles: ['All Customer-Facing Staff', 'Engineering Team', 'Support Engineers', 'Management']
  },
  {
    id: 'cal-train-04',
    organizationId: 'org-healthbridge',
    title: 'Executive & Board Social Engineering & BEC Defense Briefing',
    category: 'training',
    date: '2026-12-29',
    time: '04:00 PM EST',
    duration: '1 hr Interactive Session',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO Lead',
    frameworkRef: 'ISO 27001 A.5.4, A.6.3 / NIST CSF 2.0 GV.RR-01, PR.AT-01',
    recurrence: 'Semi-Annual',
    status: 'upcoming',
    description: 'Targeted executive protection briefing covering Business Email Compromise (BEC), CEO impersonation vectors, AI voice deepfake wire fraud defenses, and multi-signature authorization protocols.',
    deliverables: [
      'Executive Defense Playbook Handout',
      'Wire Transfer Out-of-Band Verification Policy Signed'
    ],
    mandatoryForRoles: ['CEO', 'CFO', 'CTO', 'Finance Controllers', 'Board Members']
  },
  {
    id: 'cal-train-05',
    organizationId: 'org-healthbridge',
    title: 'Incident Commander Tabletop Response Drill & Triage Protocol',
    category: 'training',
    date: '2027-01-19',
    time: '02:00 PM EST',
    duration: '3 hrs Simulation Exercise',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'Virtual CISO Lead',
    frameworkRef: 'ISO 27001 A.5.24 / NIST CSF 2.0 RS.MA-02, RS.CO-03',
    recurrence: 'Quarterly',
    status: 'upcoming',
    description: 'Live simulated ransomware and database exfiltration tabletop exercise testing the incident command team, forensic snapshot capture, external counsel coordination, and customer breach notice.',
    deliverables: [
      'Tabletop Exercise After-Action Report (AAR)',
      'Identified Incident Response Gaps & Action Items Log'
    ],
    mandatoryForRoles: ['Primary Incident Commander', 'Secondary Incident Commander', 'Legal Counsel', 'PR Lead']
  },
  {
    id: 'cal-train-06',
    organizationId: 'org-healthbridge',
    title: 'Quarterly Privileged Access & Root Credential Rotation Briefing',
    category: 'training',
    date: '2027-02-12',
    time: '01:00 PM EST',
    duration: '1.5 hrs',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO',
    frameworkRef: 'ISO 27001 A.5.18 / NIST CSF 2.0 PR.AA-05',
    recurrence: 'Quarterly',
    status: 'upcoming',
    description: 'Review of emergency break-glass procedures, SSH certificate authority rotation, and Cloud IAM root credential vaulting practices for all cloud infrastructure custodians.',
    deliverables: [
      'Privileged User Access Recertification Sign-off',
      'Vaulted Emergency Key Rotation Audit Trail'
    ],
    mandatoryForRoles: ['Cloud Administrators', 'DevOps Leads', 'Database Administrators']
  },

  // ==========================================
  // RECENT COMPLETED EVENTS (OCTOBER 2026)
  // ==========================================
  {
    id: 'cal-past-01',
    organizationId: 'org-healthbridge',
    title: 'Q3 2026 Company-Wide Phishing Resilience Exercise',
    category: 'training',
    date: '2026-10-15',
    time: 'Completed',
    duration: 'Cutoff Closed',
    owner: 'HR & People Operations',
    ownerRole: 'Awareness Coordinator',
    frameworkRef: 'ISO 27001 A.6.3 / NIST PR.AT-01',
    recurrence: 'Quarterly',
    status: 'completed',
    description: 'Q3 phishing drill completed with 98.1% pass rate and zero credential submissions across all 52 active staff.',
    deliverables: ['Q3 Awareness Completion Ledger', 'Follow-up Microlearning Roster'],
    mandatoryForRoles: ['All Corporate Staff']
  },
  {
    id: 'cal-past-02',
    organizationId: 'org-healthbridge',
    title: 'POL-08: Remote Work & Mobile Device Management (MDM) Policy Review',
    category: 'policy_review',
    date: '2026-10-22',
    time: 'Completed',
    duration: '1.5 hrs',
    owner: 'Elena Rostova (CTO)',
    ownerRole: 'CTO',
    frameworkRef: 'ISO 27001 A.6.7, A.8.1 / NIST PR.AC',
    recurrence: 'Annual',
    status: 'completed',
    description: 'Approved mandatory BitLocker / FileVault disk encryption and Intune / Workspace device compliance requirement.',
    deliverables: ['POL-08 Version 1.2 Signed', 'MDM Enrollment Audit Record'],
    policyCode: 'POL-08'
  },
  {
    id: 'cal-past-03',
    organizationId: 'org-healthbridge',
    title: 'Q3 2026 Pre-Audit Surveillance Review with vCISO',
    category: 'audit',
    date: '2026-10-28',
    time: 'Completed',
    duration: '3 hrs',
    owner: 'Marcus Vance, CISSP (vCISO)',
    ownerRole: 'vCISO Lead',
    frameworkRef: 'ISO 27001 / NIST CSF 2.0',
    recurrence: 'Quarterly',
    status: 'completed',
    description: 'Executive gap analysis session verifying automated check coverage ahead of Stage 1 external registrar scheduling.',
    deliverables: ['Stage 1 Readiness Assessment Document', 'Corrective Action Plan for Failing Checks'],
    auditorBody: 'vCISO Advisory Practice'
  }
];
