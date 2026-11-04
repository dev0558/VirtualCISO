/** Copy of seed/checks.yaml for the public page (the seed file stays the source of truth). Keep in step when checks change. */
export type MarketingCheck = { name: string; category: string; severity: string; controls: string };

export const CHECKS: Record<"m365" | "google_workspace" | "github", MarketingCheck[]> = {
  m365: [
    { name: "MFA registered for all active users", category: "Identity & Access", severity: "critical", controls: "A.8.5 · A.5.17 · PR.AA" },
    { name: "Global Administrator count restricted (2–4)", category: "Privileged Access", severity: "high", controls: "A.8.2 · A.5.18 · PR.AA" },
    { name: "Conditional Access policies enabled", category: "Identity & Access", severity: "high", controls: "A.5.15 · A.8.5 · PR.AA" },
    { name: "Legacy authentication blocked", category: "Identity & Access", severity: "critical", controls: "A.5.15 · A.8.5 · PR.AA" },
    { name: "No stale guest accounts (90+ days inactive)", category: "Identity Lifecycle", severity: "medium", controls: "A.5.16 · A.5.18 · ID.AM" },
    { name: "Directory audit logging available", category: "Logging & Monitoring", severity: "high", controls: "A.8.15 · A.8.16 · DE.CM" },
    { name: "Passwords do not expire arbitrarily (modern policy)", category: "Authentication", severity: "low", controls: "A.5.17 · PR.AA" },
    { name: "Privileged role segregation (no user with 3+ admin roles)", category: "Privileged Access", severity: "medium", controls: "A.5.18 · A.8.2 · PR.AA" },
    { name: "Phishing-resistant / app-based MFA methods enabled", category: "Authentication", severity: "medium", controls: "A.5.17 · A.8.5 · PR.AA" },
    { name: "Managed devices compliant (≥95%)", category: "Endpoint", severity: "medium", controls: "A.8.9 · PR.PS" },
  ],
  google_workspace: [
    { name: "2-Step Verification enforced for all active users", category: "Identity & Access", severity: "critical", controls: "A.8.5 · A.5.17 · PR.AA" },
    { name: "Super Admin accounts limited (≤3)", category: "Privileged Access", severity: "high", controls: "A.8.2 · PR.AA" },
    { name: "Suspended and inactive (60+ days) accounts deprovisioned", category: "Identity Lifecycle", severity: "medium", controls: "A.5.16 · A.5.18 · ID.AM" },
    { name: "All administrators have 2SV enrolled", category: "Privileged Access", severity: "critical", controls: "A.8.2 · A.8.5 · PR.AA" },
    { name: "Delegated admin role assignments limited (≤5)", category: "Privileged Access", severity: "medium", controls: "A.5.18 · A.8.2 · PR.AA" },
    { name: "No unreviewed high-risk OAuth app grants (30 days)", category: "Third-Party Access", severity: "high", controls: "A.5.15 · A.5.19 · GV.SC · PR.AA" },
    { name: "No suspicious login events (30 days)", category: "Logging & Monitoring", severity: "high", controls: "A.8.16 · DE.CM · DE.AE" },
    { name: "Workspace audit logs accessible", category: "Logging & Monitoring", severity: "medium", controls: "A.8.15 · DE.CM" },
    { name: "No never-used accounts older than 30 days", category: "Identity Lifecycle", severity: "low", controls: "A.5.16 · ID.AM" },
  ],
  github: [
    { name: "Organisation requires two-factor authentication", category: "Identity & Access", severity: "critical", controls: "A.8.5 · A.5.17 · PR.AA" },
    { name: "Branch protection on default branches", category: "Change Management", severity: "high", controls: "A.8.9 · PR.PS · RC.RP" },
    { name: "Secret scanning enabled on all repositories", category: "Secrets Management", severity: "high", controls: "A.8.24 · A.8.16 · PR.DS" },
    { name: "No open critical code scanning alerts", category: "Vulnerability Management", severity: "high", controls: "A.8.8 · DE.CM" },
    { name: "No public repositories with sensitive names", category: "Data Exposure", severity: "critical", controls: "A.8.24 · ID.AM · PR.DS" },
    { name: "Dependabot security updates enabled", category: "Vulnerability Management", severity: "medium", controls: "A.8.8 · DE.CM · GV.SC" },
    { name: "Organisation owners limited (≤3) and base permission read", category: "Privileged Access", severity: "medium", controls: "A.8.2 · A.5.1 · GV.PO · PR.AA" },
    { name: "Pull request review required on default branches", category: "Change Management", severity: "medium", controls: "A.5.18 · A.8.9 · PR.PS" },
    { name: "Outside collaborators limited (≤5)", category: "Third-Party Access", severity: "low", controls: "A.5.19 · A.5.18 · GV.SC" },
  ],
};
