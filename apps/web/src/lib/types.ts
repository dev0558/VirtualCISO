export type Role = "client_admin" | "vciso" | "auditor";
export type CheckStatus = "passed" | "failed" | "warning" | "skipped" | "not_run" | "not_connected";
export type ControlStatus = "passed" | "failed" | "in_progress" | "manual_verification";
export type Severity = "critical" | "high" | "medium" | "low";
export type ConnectorType = "m365" | "google_workspace" | "github";

export interface Org {
  id: string; slug: string; name: string; industry: string; employeeCount: number;
  primaryContact: string; vcisoLead: string; isDemo: boolean; targetFrameworks: string[];
  profile: Record<string, string | number | boolean>; role?: Role;
}
export interface Me { user: { id: string; email: string; fullName: string; mfaEnabled: boolean }; organizations: Org[] }
export interface Scores { isoScore: number; nistScore: number; isoPassed: number; isoTotal: number; nistPassed: number; nistTotal: number }
export interface Control {
  id: string; framework: string; frameworkCode: "iso27001" | "nistcsf"; code: string; category: string; title: string;
  description: string; status: ControlStatus; applicableChecks: string[]; policies: string[]; evidenceSource: string;
}
export interface Check {
  id: string; code: string; name: string; connector: ConnectorType; category: string; severity: Severity;
  description: string; mappedControlCodes: string[]; status: CheckStatus; lastRunAt: string | null;
  latestEvidenceHash: string | null; remediationGuidance: string; observed: Record<string, unknown>; rule: unknown;
}
export interface Integration {
  id: string; type: ConnectorType; mode: "live" | "demo"; status: string; accountIdentifier: string;
  lastSyncedAt: string | null; lastError: string | null; totalChecks: number; failingChecks: number;
}
export interface Evidence {
  id: string; checkCode: string; checkName: string; connector: ConnectorType; timestamp: string; status: CheckStatus;
  sha256Hash: string; objectKey: string | null; sanitizedPayload: Record<string, unknown>; durationMs: number;
}
export interface Citation { type: string; reference: string; name: string }
export interface Policy {
  id: string; code: string; templateKey: string; title: string; description: string; mappedControls: string[];
  version: string; status: "not_started" | "draft" | "under_review" | "approved" | "superseded"; content: string;
  author: string; aiGenerated: boolean; confidence: number | null; citations: Citation[]; approver: string | null;
  approvedAt: string | null; approvedVersion: string | null; updatedAt: string | null;
  versions: { id: string; version: string; status: string; author: string; createdAt: string; approver: string | null; aiGenerated: boolean }[];
}
export interface AnswerItem {
  id: string; questionNumber: number; category: string; question: string; suggestedAnswer: string;
  confidenceScore: number; needsReview: boolean; citedSources: Citation[]; humanApproved: boolean;
  humanReviewNotes: string | null; approvedBy: string | null;
}
export interface Questionnaire {
  id: string; title: string; customerName: string; sourceFilename: string; uploadedAt: string; completedAt: string | null;
  items: AnswerItem[];
}
export interface Risk {
  id: string; title: string; category: string; description: string; likelihood: number; impact: number; riskScore: number;
  owner: string; treatment: string; treatmentPlan: string; status: string; linkedControlCodes: string[];
  linkedCheckCodes: string[]; updatedAt: string;
}
export interface Task {
  id: string; title: string; description: string; phase: string; priority: "P1" | "P2" | "P3"; owner: string;
  dueDate: string; status: "todo" | "in_progress" | "completed"; source: string; linkedCheckCode: string | null;
  linkedRiskId: string | null; overdue: boolean;
}
export interface Report {
  id: string; quarter: string; generatedAt: string; vCISOAuthor: string; status: "draft" | "approved"; aiGenerated: boolean;
  executiveSummary: string;
  compliancePosture: { isoScore: number; nistScore: number; totalChecks: number; passingChecks: number; criticalGaps: number };
  topRisksSummary: string[]; quarterlyMilestones: string[]; next90DaysPlan: string[]; citations: Citation[];
  vCISONotes: string; approvedBy: string | null; approvedAt: string | null;
}
export interface Milestone {
  id: string; title: string; category: string; targetDate: string; completedDate: string | null;
  status: "completed" | "in_progress" | "upcoming" | "overdue"; description: string; owner: string;
  frameworkRef: string | null; deliverables: string[]; isAuditDeadline: boolean; auditorBody: string | null;
}
export interface CalendarEvent {
  id: string; title: string; category: "audit" | "policy_review" | "training"; date: string; time?: string; duration?: string;
  owner: string; frameworkRef?: string; recurrence: string; status: string; description: string; deliverables?: string[];
}
export interface AuditLogItem { id: string; timestamp: string; actor: string; role: Role; action: string; resource: string; details: string }
export interface OrgState {
  organization: Org; scores: Scores; controls: Control[]; checks: Check[]; integrations: Integration[];
  evidenceStore: Evidence[]; policies: Policy[]; questionnaires: Questionnaire[]; risks: Risk[]; roadmap: Task[];
  leadershipReport: Report | null; milestones: Milestone[]; calendarEvents: CalendarEvent[]; auditLogs: AuditLogItem[];
  runHistory: { id: string; startedAt: string; trigger: string; counts: Record<string, number> }[];
}
export interface OrgOverview extends Org {
  scores: Scores; openRisks: number; highRisks: number; overdueTasks: number; failingChecks: number; lastRunAt: string | null;
}
