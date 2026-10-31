export type UserRole = 'client_admin' | 'vciso' | 'auditor';

export interface Organization {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  cloudProviders: string[];
  primaryContact: string;
  vcisoLead: string;
  targetFrameworks: ('ISO/IEC 27001:2022' | 'NIST CSF 2.0')[];
}

export type ConnectorType = 'm365' | 'google_workspace' | 'github';
export type ConnectorStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface IntegrationConnector {
  id: string;
  name: string;
  type: ConnectorType;
  status: ConnectorStatus;
  lastSyncedAt: string;
  accountIdentifier: string;
  readOnlyScopes: string[];
  totalChecks: number;
  failingChecks: number;
}

export interface ComplianceControl {
  id: string;
  framework: 'ISO 27001:2022' | 'NIST CSF 2.0';
  code: string;
  category: string;
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'in_progress' | 'manual_verification';
  applicableChecks: string[];
}

export type CheckStatus = 'passed' | 'failed' | 'warning' | 'skipped';

export interface AutomatedCheck {
  id: string;
  code: string;
  name: string;
  connector: ConnectorType;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  mappedControlCodes: string[];
  status: CheckStatus;
  lastRunAt: string;
  latestEvidenceHash: string;
  remediationGuidance: string;
  rawResponseSummary: Record<string, any>;
}

export interface EvidenceRecord {
  id: string;
  checkId: string;
  checkCode: string;
  checkName: string;
  connector: ConnectorType;
  organizationId: string;
  timestamp: string;
  status: CheckStatus;
  sha256Hash: string;
  mappedControls: string[];
  sanitizedPayload: Record<string, any>;
  durationMs: number;
}

export type PolicyStatus = 'draft' | 'under_review' | 'approved';

export interface Policy {
  id: string;
  organizationId: string;
  code: string; // e.g. POL-01
  title: string;
  description: string;
  version: string; // e.g. 1.0, 1.1
  status: PolicyStatus;
  content: string; // Markdown document
  author: string;
  approver?: string;
  approvedAt?: string;
  updatedAt: string;
  mappedControls: string[];
  citations: string[];
}

export interface QuestionnaireAnswer {
  id: string;
  questionNumber: number;
  category: string;
  question: string;
  suggestedAnswer: string;
  confidenceScore: number; // 0 - 100
  needsReview: boolean;
  citedSources: {
    type: 'policy' | 'check' | 'control';
    name: string;
    reference: string;
  }[];
  humanApproved: boolean;
  humanReviewNotes?: string;
}

export interface SecurityQuestionnaire {
  id: string;
  organizationId: string;
  title: string;
  customerName: string;
  uploadedAt: string;
  completedAt?: string;
  items: QuestionnaireAnswer[];
}

export interface RiskEntry {
  id: string;
  organizationId: string;
  title: string;
  category: 'Privileged Access' | 'Access & Identity' | 'Infrastructure & Data' | 'Application & Code' | 'Governance & Third-Party' | 'Operational Continuity';
  description: string;
  likelihood: number; // 1 to 5
  impact: number; // 1 to 5
  riskScore: number; // likelihood * impact (1 to 25)
  owner: string;
  treatment: 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid';
  treatmentPlan: string;
  status: 'Open' | 'In Progress' | 'Treated' | 'Accepted';
  linkedControlCodes: string[];
  linkedCheckCodes: string[];
  updatedAt: string;
}

export interface RoadmapTask {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  phase: 'Sprint 1 (Days 1-30)' | 'Sprint 2 (Days 31-60)' | 'Sprint 3 (Days 61-90)';
  priority: 'P1' | 'P2' | 'P3';
  owner: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'completed';
  linkedCheckCode?: string;
  linkedRiskId?: string;
}

export interface LeadershipReport {
  id: string;
  organizationId: string;
  quarter: string; // e.g. "Q4 2026"
  generatedAt: string;
  vCISOAuthor: string;
  status: 'draft' | 'approved';
  executiveSummary: string;
  compliancePosture: {
    isoScore: number;
    nistScore: number;
    totalChecks: number;
    passingChecks: number;
    criticalGaps: number;
  };
  topRisksSummary: string[];
  quarterlyMilestones: string[];
  next90DaysPlan: string[];
  vCISONotes: string;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  resource: string;
  details: string;
}

export type MilestoneType = 'audit_deadline' | 'internal_milestone' | 'policy_governance' | 'technical_verification';
export type MilestoneStatus = 'completed' | 'in_progress' | 'upcoming' | 'overdue';

export interface ComplianceMilestone {
  id: string;
  organizationId: string;
  title: string;
  category: MilestoneType;
  targetDate: string; // YYYY-MM-DD
  completedDate?: string;
  status: MilestoneStatus;
  description: string;
  owner: string;
  frameworkRef?: string;
  deliverables: string[];
  isAuditDeadline: boolean;
  auditorBody?: string;
}

export type CalendarEventCategory = 'audit' | 'policy_review' | 'training';
export type CalendarEventRecurrence = 'Quarterly' | 'Annual' | 'Semi-Annual' | 'Bi-Monthly' | 'Monthly' | 'One-Time';

export interface ComplianceCalendarEvent {
  id: string;
  organizationId: string;
  title: string;
  category: CalendarEventCategory;
  date: string; // YYYY-MM-DD
  time?: string;
  duration?: string;
  owner: string;
  ownerRole?: string;
  frameworkRef?: string;
  recurrence: CalendarEventRecurrence;
  status: 'upcoming' | 'in_progress' | 'completed' | 'urgent';
  description: string;
  deliverables?: string[];
  mandatoryForRoles?: string[];
  auditorBody?: string;
  policyCode?: string;
}
