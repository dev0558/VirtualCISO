import {
  Organization,
  IntegrationConnector,
  ComplianceControl,
  AutomatedCheck,
  EvidenceRecord,
  Policy,
  SecurityQuestionnaire,
  RiskEntry,
  RoadmapTask,
  LeadershipReport,
  AuditLogItem,
  ComplianceMilestone
} from '../types/compliance.ts';

export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-healthbridge',
    name: 'HealthBridge Technologies',
    industry: 'Healthcare SaaS & Telehealth',
    employeeCount: 52,
    cloudProviders: ['Microsoft 365 / Entra ID', 'GitHub Enterprise'],
    primaryContact: 'elena.rostova@healthbridge.io',
    vcisoLead: 'Marcus Vance, CISSP, CISA',
    targetFrameworks: ['ISO/IEC 27001:2022', 'NIST CSF 2.0']
  },
  {
    id: 'org-datapulse',
    name: 'DataPulse Analytics AI',
    industry: 'Enterprise Data Platform',
    employeeCount: 118,
    cloudProviders: ['Google Workspace', 'GitHub Enterprise'],
    primaryContact: 'karan.sharma@datapulse.ai',
    vcisoLead: 'Marcus Vance, CISSP, CISA',
    targetFrameworks: ['ISO/IEC 27001:2022', 'NIST CSF 2.0']
  },
  {
    id: 'org-finvault',
    name: 'FinVault Payments',
    industry: 'Financial Technology / API Banking',
    employeeCount: 34,
    cloudProviders: ['Microsoft 365 / Entra ID', 'Google Workspace', 'GitHub Enterprise'],
    primaryContact: 'sarah.jenkins@finvault.co',
    vcisoLead: 'Marcus Vance, CISSP, CISA',
    targetFrameworks: ['ISO/IEC 27001:2022', 'NIST CSF 2.0']
  }
];

export const SEED_CONTROLS: ComplianceControl[] = [
  // ISO 27001:2022 Controls
  {
    id: 'ctrl-iso-5.1',
    framework: 'ISO 27001:2022',
    code: 'A.5.1',
    category: 'Organizational controls',
    title: 'Policies for information security',
    description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, and communicated to employees.',
    status: 'passed',
    applicableChecks: ['M365-LOG-06', 'GH-ADM-07']
  },
  {
    id: 'ctrl-iso-5.15',
    framework: 'ISO 27001:2022',
    code: 'A.5.15',
    category: 'Access control',
    title: 'Access control rules & permissions',
    description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented.',
    status: 'failed',
    applicableChecks: ['M365-CA-03', 'M365-LEG-04', 'GWS-APP-06']
  },
  {
    id: 'ctrl-iso-5.16',
    framework: 'ISO 27001:2022',
    code: 'A.5.16',
    category: 'Identity management',
    title: 'Identity management life cycle',
    description: 'The full life cycle of identities (creation, modification, suspension, and deletion) shall be managed rigorously.',
    status: 'failed',
    applicableChecks: ['M365-GST-05', 'GWS-INA-03']
  },
  {
    id: 'ctrl-iso-5.17',
    framework: 'ISO 27001:2022',
    code: 'A.5.17',
    category: 'Authentication information',
    title: 'Authentication credentials management',
    description: 'Allocation and management of authentication credentials shall be controlled by a formal management process.',
    status: 'passed',
    applicableChecks: ['M365-PWD-07', 'GWS-PAS-09']
  },
  {
    id: 'ctrl-iso-5.18',
    framework: 'ISO 27001:2022',
    code: 'A.5.18',
    category: 'Access rights',
    title: 'Access rights provisioning & review',
    description: 'Access rights to information and assets shall be provisioned, reviewed, and adjusted or revoked in a timely manner.',
    status: 'passed',
    applicableChecks: ['M365-RLS-08', 'GH-IPR-08']
  },
  {
    id: 'ctrl-iso-8.2',
    framework: 'ISO 27001:2022',
    code: 'A.8.2',
    category: 'Technological controls',
    title: 'Privileged access rights management',
    description: 'The allocation and use of privileged access rights shall be restricted and strictly managed.',
    status: 'failed',
    applicableChecks: ['M365-ADM-02', 'GWS-SUP-02', 'GH-ADM-07']
  },
  {
    id: 'ctrl-iso-8.5',
    framework: 'ISO 27001:2022',
    code: 'A.8.5',
    category: 'Technological controls',
    title: 'Secure authentication (MFA)',
    description: 'Secure authentication technologies and procedures shall be implemented based on information access restrictions and risk assessment.',
    status: 'passed',
    applicableChecks: ['M365-MFA-01', 'GWS-MFA-01', 'GH-2FA-01']
  },
  {
    id: 'ctrl-iso-8.8',
    framework: 'ISO 27001:2022',
    code: 'A.8.8',
    category: 'Technological controls',
    title: 'Management of technical vulnerabilities',
    description: 'Information about technical vulnerabilities of information systems being used shall be obtained and evaluated.',
    status: 'passed',
    applicableChecks: ['GH-CSN-04', 'GH-DEP-06']
  },
  {
    id: 'ctrl-iso-8.9',
    framework: 'ISO 27001:2022',
    code: 'A.8.9',
    category: 'Technological controls',
    title: 'Configuration management & baseline hardening',
    description: 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, and monitored.',
    status: 'passed',
    applicableChecks: ['GH-BRN-02', 'M365-DEV-10']
  },
  {
    id: 'ctrl-iso-8.15',
    framework: 'ISO 27001:2022',
    code: 'A.8.15',
    category: 'Technological controls',
    title: 'Logging & audit trails',
    description: 'Logs that record activities, exceptions, faults, and other relevant events shall be produced, stored, protected and analyzed.',
    status: 'passed',
    applicableChecks: ['M365-LOG-06', 'GWS-AUD-08']
  },
  {
    id: 'ctrl-iso-8.16',
    framework: 'ISO 27001:2022',
    code: 'A.8.16',
    category: 'Technological controls',
    title: 'Continuous monitoring activities',
    description: 'Networks, systems and applications shall be monitored for anomalous behavior and potential security incidents.',
    status: 'passed',
    applicableChecks: ['GH-SEC-03', 'M365-LOG-06']
  },
  {
    id: 'ctrl-iso-8.24',
    framework: 'ISO 27001:2022',
    code: 'A.8.24',
    category: 'Technological controls',
    title: 'Use of cryptography & secret protection',
    description: 'Rules for the effective use of cryptography, key management, and secrets sanitization shall be defined and implemented.',
    status: 'passed',
    applicableChecks: ['GH-SEC-03', 'GH-PUB-05', 'GH-SGN-09']
  },

  // NIST CSF 2.0 Controls
  {
    id: 'ctrl-nist-gv-po',
    framework: 'NIST CSF 2.0',
    code: 'GV.PO',
    category: 'GOVERN (GV) - Policy',
    title: 'Organizational Cybersecurity Policy',
    description: 'Cybersecurity policies are established, communicated, and enforced across all business and technical operations.',
    status: 'passed',
    applicableChecks: ['M365-LOG-06', 'GH-ADM-07']
  },
  {
    id: 'ctrl-nist-id-am',
    framework: 'NIST CSF 2.0',
    code: 'ID.AM',
    category: 'IDENTIFY (ID) - Asset Management',
    title: 'Asset & Account Inventory',
    description: 'Physical devices, cloud platforms, repositories, and user identities are inventoried and managed through lifecycle.',
    status: 'failed',
    applicableChecks: ['M365-GST-05', 'GWS-INA-03', 'GH-PUB-05']
  },
  {
    id: 'ctrl-nist-pr-aa',
    framework: 'NIST CSF 2.0',
    code: 'PR.AA',
    category: 'PROTECT (PR) - Identity & Access',
    title: 'Identity Management, Authentication & Access Control',
    description: 'Access to physical and logical assets is limited to authorized users, processes, and devices via multi-factor authentication and least privilege.',
    status: 'passed',
    applicableChecks: ['M365-MFA-01', 'GWS-MFA-01', 'GH-2FA-01', 'M365-ADM-02', 'M365-CA-03', 'M365-LEG-04']
  },
  {
    id: 'ctrl-nist-pr-ds',
    framework: 'NIST CSF 2.0',
    code: 'PR.DS',
    category: 'PROTECT (PR) - Data Security',
    title: 'Data Security & Cryptographic Protection',
    description: 'Data is protected throughout its lifecycle (at rest, in transit, and in use) consistent with risk assessments.',
    status: 'passed',
    applicableChecks: ['GH-SEC-03', 'GWS-DRV-07', 'GWS-CAL-05', 'GH-PUB-05']
  },
  {
    id: 'ctrl-nist-pr-ps',
    framework: 'NIST CSF 2.0',
    code: 'PR.PS',
    category: 'PROTECT (PR) - Platform Security',
    title: 'Platform, Repository & Configuration Protection',
    description: 'Hardware, operating systems, and source code repositories are configured according to organizational security baselines.',
    status: 'passed',
    applicableChecks: ['GH-BRN-02', 'GH-IPR-08', 'GH-SGN-09', 'M365-DEV-10']
  },
  {
    id: 'ctrl-nist-de-cm',
    framework: 'NIST CSF 2.0',
    code: 'DE.CM',
    category: 'DETECT (DE) - Continuous Monitoring',
    title: 'Continuous Security & Event Monitoring',
    description: 'The network and personnel activities are monitored to uncover potential cybersecurity events.',
    status: 'passed',
    applicableChecks: ['M365-LOG-06', 'GWS-AUD-08', 'GH-CSN-04', 'GH-DEP-06']
  },
  {
    id: 'ctrl-nist-rs-ma',
    framework: 'NIST CSF 2.0',
    code: 'RS.MA',
    category: 'RESPOND (RS) - Incident Management',
    title: 'Incident Analysis & Containment',
    description: 'Responses are executed to contain the effects of cybersecurity incidents and perform rapid forensic triage.',
    status: 'passed',
    applicableChecks: ['M365-CA-03', 'GH-SEC-03']
  },
  {
    id: 'ctrl-nist-rc-rp',
    framework: 'NIST CSF 2.0',
    code: 'RC.RP',
    category: 'RECOVER (RC) - Recovery Planning',
    title: 'Resilience & Recovery Execution',
    description: 'Restoration activities and contingency plans are executed to ensure operational resumption.',
    status: 'passed',
    applicableChecks: ['GH-BRN-02']
  }
];

export const SEED_CHECKS: AutomatedCheck[] = [
  // --- Microsoft 365 / Entra ID (10 Checks) ---
  {
    id: 'chk-m365-01',
    code: 'M365-MFA-01',
    name: 'MFA Enforced for All Active Users',
    connector: 'm365',
    category: 'Identity & Access',
    severity: 'critical',
    description: 'Verifies that every active Entra ID account has registered and is actively prompted for Multi-Factor Authentication via Authenticator app or FIDO2 keys.',
    mappedControlCodes: ['A.8.5', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '9c2a1e847c20d4f5bfd15b0e8c459a93f7781d3ee065792976d859ebc4f192b1',
    remediationGuidance: 'Navigate to Entra ID Admin Center > Protection > Authentication Methods. Enforce Registration Campaign and require MFA in Conditional Access policies.',
    rawResponseSummary: {
      totalUsers: 52,
      mfaRegisteredUsers: 52,
      mfaEnforcedPercentage: 100,
      fido2UsersCount: 18,
      exemptions: []
    }
  },
  {
    id: 'chk-m365-02',
    code: 'M365-ADM-02',
    name: 'Privileged Global Administrator Count Restricted',
    connector: 'm365',
    category: 'Privileged Access',
    severity: 'high',
    description: 'Ensures that no more than 4 accounts hold permanent Global Administrator role in Microsoft 365 / Entra ID to reduce blast radius.',
    mappedControlCodes: ['A.8.2', 'PR.AA'],
    status: 'failed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '34f0d7e682aa18bc27cd41298816c4f039a4891152a4e98f7c9e05f241a27e7d',
    remediationGuidance: 'Currently 6 Global Administrators detected. Demote service and non-emergency accounts to role-specific assignments (e.g. User Administrator, Exchange Admin) and configure Privileged Identity Management (PIM) with just-in-time elevation.',
    rawResponseSummary: {
      thresholdAllowed: 4,
      currentGlobalAdmins: 6,
      adminAccounts: ['admin@healthbridge.io', 'it-ops@healthbridge.io', 'elena@healthbridge.io', 'svc-backup@healthbridge.io', 'contractor-audit@healthbridge.io', 'devops-lead@healthbridge.io'],
      excessCount: 2
    }
  },
  {
    id: 'chk-m365-03',
    code: 'M365-CA-03',
    name: 'Conditional Access Policy Enforces Device Trust',
    connector: 'm365',
    category: 'Zero Trust & Access',
    severity: 'high',
    description: 'Validates that active Conditional Access policies require compliant devices or Hybrid Azure AD joined machines before granting tenant access.',
    mappedControlCodes: ['A.5.15', 'PR.AA', 'RS.MA'],
    status: 'failed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '7e289bf631ca71408d6bcfe06a88b56d354b2382c442468755dc03f19e48c082',
    remediationGuidance: 'Enable CA policy "CAP-04-RequireCompliantDevice" from Report-Only mode to Enforced mode for all cloud applications.',
    rawResponseSummary: {
      totalPolicies: 5,
      enforcedPolicies: 4,
      compliantDevicePolicyState: 'reportOnly',
      riskGateEnabled: true
    }
  },
  {
    id: 'chk-m365-04',
    code: 'M365-LEG-04',
    name: 'Legacy Authentication Protocols Blocked',
    connector: 'm365',
    category: 'Access Control',
    severity: 'critical',
    description: 'Checks if basic authentication protocols (POP3, IMAP4, SMTP Auth) that bypass multi-factor authentication are systematically blocked.',
    mappedControlCodes: ['A.5.15', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '1a9f0293c8d197624bb183e20e890f845d07c082e6c5188f4b008d3a1bb188e4',
    remediationGuidance: 'Ensure CA policy "Block Legacy Authentication" remains scoped to All Users and All Cloud Apps.',
    rawResponseSummary: {
      legacyAuthPolicyActive: true,
      blockedProtocols: ['IMAP', 'POP', 'MAPI', 'SMTP AUTH', 'Exchange ActiveSync'],
      legacyLoginsLast30Days: 0
    }
  },
  {
    id: 'chk-m365-05',
    code: 'M365-GST-05',
    name: 'Guest & External Accounts Stale Access Review',
    connector: 'm365',
    category: 'Identity Lifecycle',
    severity: 'medium',
    description: 'Detects guest user accounts that have had no sign-in activity in the past 90 days and require formal offboarding or revocation.',
    mappedControlCodes: ['A.5.16', 'ID.AM'],
    status: 'failed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '4390b1c4e76a6cf490f42337d40294b0d01ca39433ee56cbb86a51d95e0c6559',
    remediationGuidance: '9 external guest accounts have been inactive for over 90 days. Run Entra ID Access Review to bulk revoke expired vendor privileges.',
    rawResponseSummary: {
      totalGuestUsers: 14,
      inactiveOver90Days: 9,
      longestInactiveDays: 240,
      staleGuestList: ['audit-temp@consultingfirm.com', 'vendor.josh@devagency.co', 'partner-rep@biomed.org']
    }
  },
  {
    id: 'chk-m365-06',
    code: 'M365-LOG-06',
    name: 'Unified Audit Logging (UAL) Enabled & Retained',
    connector: 'm365',
    category: 'Logging & Telemetry',
    severity: 'critical',
    description: 'Verifies that Microsoft Purview Unified Audit Log is turned on and configured for at least 180 days retention across all workload telemetry.',
    mappedControlCodes: ['A.8.15', 'A.8.16', 'DE.CM', 'GV.PO'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'fa8211516e87c080dbfa91176e0172bf421e428c0571168926cb915904d99f57',
    remediationGuidance: 'Keep Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true.',
    rawResponseSummary: {
      unifiedAuditLogStatus: 'Enabled',
      retentionDays: 180,
      exchangeAuditingEnabled: true,
      sharepointAuditingEnabled: true
    }
  },
  {
    id: 'chk-m365-07',
    code: 'M365-PWD-07',
    name: 'Modern Password Protection & No Arbitrary Expiry',
    connector: 'm365',
    category: 'Authentication Info',
    severity: 'low',
    description: 'Validates adherence to modern NIST SP 800-63B standards: password expiration turned off with Entra Password Protection banned password list active.',
    mappedControlCodes: ['A.5.17', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '6b6c0b91e57c15438812cfa230d4b971dc534086ad32ef8508f7aa95815e6128',
    remediationGuidance: 'Ensure custom banned password list is maintained for organization-specific keywords.',
    rawResponseSummary: {
      passwordNeverExpires: true,
      entraPasswordProtectionActive: true,
      customBannedWordsCount: 42
    }
  },
  {
    id: 'chk-m365-08',
    code: 'M365-RLS-08',
    name: 'Least-Privilege Directory Role Segregation',
    connector: 'm365',
    category: 'Access Rights',
    severity: 'medium',
    description: 'Ensures application administrators and cloud administrators cannot escalate privileges without approval workflows.',
    mappedControlCodes: ['A.5.18', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '9840c1a7d65f54bf691459a103c80ff5580f845a7d65bca01e40a0c98f988e41',
    remediationGuidance: 'Maintain role segregation documentation in vCISO workspace.',
    rawResponseSummary: {
      evaluatedRoles: 18,
      unassignedPrivilegedRoles: 8,
      separationViolations: 0
    }
  },
  {
    id: 'chk-m365-09',
    code: 'M365-SSP-09',
    name: 'Self-Service Password Reset (SSPR) Multi-Factor Check',
    connector: 'm365',
    category: 'Authentication Info',
    severity: 'medium',
    description: 'Ensures SSPR requires at least two registered authentication methods to prevent unauthorized account takeovers.',
    mappedControlCodes: ['A.5.17', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'cb716298514e803c5188f4b008d3a1bb188e40293c8d197624bb183e20e890f8',
    remediationGuidance: 'Set SSPR minimum methods required to 2 in Authentication Methods.',
    rawResponseSummary: {
      ssprEnabledScope: 'All',
      methodsRequiredToReset: 2,
      registeredMethods: ['MobileAppNotification', 'FIDO2', 'PhoneNumber']
    }
  },
  {
    id: 'chk-m365-10',
    code: 'M365-DEV-10',
    name: 'Mobile Device Management (MDM) Intune Compliance',
    connector: 'm365',
    category: 'Endpoint Security',
    severity: 'high',
    description: 'Verifies BitLocker drive encryption, minimum OS version, and firewall status on all enrolled endpoints.',
    mappedControlCodes: ['A.8.9', 'PR.PS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '4390b1c4e76a6cf490f42337d40294b0d01ca39433ee56cbb86a51d95e0c6559',
    remediationGuidance: 'Keep Intune compliance policy requirement for BitLocker full volume encryption enforced.',
    rawResponseSummary: {
      totalEnrolledDevices: 52,
      compliantDevices: 51,
      nonCompliantDevices: 1,
      bitlockerEnforcedPercentage: 98.1
    }
  },

  // --- Google Workspace (9 Checks) ---
  {
    id: 'chk-gws-01',
    code: 'GWS-MFA-01',
    name: '2-Step Verification Enforced Org-Wide',
    connector: 'google_workspace',
    category: 'Identity & Access',
    severity: 'critical',
    description: 'Verifies that Google Workspace organizational units enforce 2-Step Verification with security keys or prompts without infinite grace periods.',
    mappedControlCodes: ['A.8.5', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '2b7c4d8e9a1f3355b2a0c6e944710d55e8812739f37cbb194602a5c4e91823bb',
    remediationGuidance: 'In Google Admin Console > Security > 2-Step Verification: Ensure enforcement is ON for all top-level OUs.',
    rawResponseSummary: {
      totalUsers: 118,
      twoStepEnforcedUsers: 118,
      twoStepStatus: 'ENFORCED',
      gracePeriodDays: 7
    }
  },
  {
    id: 'chk-gws-02',
    code: 'GWS-SUP-02',
    name: 'Super Administrator Role Accounts Kept Below 3',
    connector: 'google_workspace',
    category: 'Privileged Access',
    severity: 'high',
    description: 'Confirms that the high-privilege Super Admin role is limited to at most 3 designated personnel and protected by hardware security keys.',
    mappedControlCodes: ['A.8.2', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '8f7a6b5c4d3e2f1a0987654321fedcba0123456789abcdef0123456789abcdef',
    remediationGuidance: 'Maintain emergency break-glass account and delegated role privileges for routine tasks.',
    rawResponseSummary: {
      superAdminCount: 2,
      superAdmins: ['sec-lead@datapulse.ai', 'admin-ops@datapulse.ai'],
      hardwareKeyEnforced: true
    }
  },
  {
    id: 'chk-gws-03',
    code: 'GWS-INA-03',
    name: 'Suspended & Inactive User Accounts Deprovisioned',
    connector: 'google_workspace',
    category: 'Identity Lifecycle',
    severity: 'medium',
    description: 'Identifies employee accounts that have remained suspended or inactive for longer than 60 days without archive deletion.',
    mappedControlCodes: ['A.5.16', 'ID.AM'],
    status: 'failed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'fe43210987654321ba987654321fedcba0123456789abcdef0123456789abcde',
    remediationGuidance: 'Found 4 employee accounts suspended over 60 days ago. Transfer Google Drive ownership and permanently delete accounts to minimize data sprawl.',
    rawResponseSummary: {
      suspendedUsersCount: 4,
      inactiveOver60DaysCount: 4,
      affectedAccounts: ['former.analyst@datapulse.ai', 'contractor1@datapulse.ai', 'intern.mark@datapulse.ai', 'qa.external@datapulse.ai']
    }
  },
  {
    id: 'chk-gws-04',
    code: 'GWS-GRP-04',
    name: 'Google Groups External Posting Prohibited',
    connector: 'google_workspace',
    category: 'Data Protection',
    severity: 'medium',
    description: 'Ensures internal organizational Google Groups cannot receive unauthenticated external inbound emails or messages.',
    mappedControlCodes: ['A.5.15', 'PR.DS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    remediationGuidance: 'Under Admin > Groups, verify "Allow external members" and "Public post" are disabled.',
    rawResponseSummary: {
      totalGroups: 24,
      publicGroupsCount: 0,
      externalPostingDisabled: true
    }
  },
  {
    id: 'chk-gws-05',
    code: 'GWS-CAL-05',
    name: 'External Calendar Sharing Free/Busy Only',
    connector: 'google_workspace',
    category: 'Information Leakage',
    severity: 'low',
    description: 'Restricts Google Calendar external sharing so outside users can only see Free/Busy availability without meeting titles, descriptions, or guest lists.',
    mappedControlCodes: ['A.5.15', 'PR.DS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    remediationGuidance: 'Ensure Admin > Apps > Google Workspace > Calendar > External Sharing options is set to "Only free/busy information".',
    rawResponseSummary: {
      externalSharingLevel: 'FREE_BUSY_ONLY',
      unauthorizedPublicCalendars: 0
    }
  },
  {
    id: 'chk-gws-06',
    code: 'GWS-APP-06',
    name: 'Third-Party Connected OAuth Apps Whitelisted',
    connector: 'google_workspace',
    category: 'Third-Party Risk',
    severity: 'high',
    description: 'Verifies that third-party applications accessing Google Workspace data via OAuth scopes are restricted to an explicitly approved whitelist.',
    mappedControlCodes: ['A.5.15', 'PR.AA'],
    status: 'failed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'b9a8c7d6e5f43210b9a8c7d6e5f43210b9a8c7d6e5f43210b9a8c7d6e5f43210',
    remediationGuidance: 'Unreviewed third-party apps have been granted Gmail and Drive scopes by users. Enable "Block all third-party API access unless explicitly trusted" in Security > API Controls.',
    rawResponseSummary: {
      totalConnectedApps: 32,
      trustedApps: 27,
      unreviewedHighRiskApps: 5,
      highRiskScopesDetected: ['https://mail.google.com/', 'https://www.googleapis.com/auth/drive']
    }
  },
  {
    id: 'chk-gws-07',
    code: 'GWS-DRV-07',
    name: 'Google Drive Public File Sharing Restrictions',
    connector: 'google_workspace',
    category: 'Data Protection',
    severity: 'high',
    description: 'Ensures Google Drive documents cannot be shared via public links without authentication and requires explicit warnings on external sharing.',
    mappedControlCodes: ['A.8.24', 'PR.DS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    remediationGuidance: 'Verify "Allow users to publish files on the web" is disabled in Google Admin.',
    rawResponseSummary: {
      sharingOutsideDomainAllowed: true,
      warnBeforeSharingExternal: true,
      publicLinkSharingAllowed: false
    }
  },
  {
    id: 'chk-gws-08',
    code: 'GWS-AUD-08',
    name: 'Workspace Security Audit Logs Centralized',
    connector: 'google_workspace',
    category: 'Logging & Monitoring',
    severity: 'medium',
    description: 'Checks if Google Workspace admin audit, login, and token logs are exported to external SIEM or cloud storage for retention and anomaly detection.',
    mappedControlCodes: ['A.8.15', 'DE.CM'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344',
    remediationGuidance: 'Ensure BigQuery export pipeline for Google Workspace reports is healthy.',
    rawResponseSummary: {
      bigQueryExportActive: true,
      lastLogExportTime: '2026-10-31T08:00:00Z',
      logStreamLatencyMinutes: 12
    }
  },
  {
    id: 'chk-gws-09',
    code: 'GWS-PAS-09',
    name: 'Minimum Password Length (14+ Characters)',
    connector: 'google_workspace',
    category: 'Authentication Info',
    severity: 'medium',
    description: 'Verifies that Google Workspace password policy requires at least 14 characters and prohibits password reuse for the last 10 passwords.',
    mappedControlCodes: ['A.5.17', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    remediationGuidance: 'Under Security > Password management, enforce minimum length >= 14 and password strength meter.',
    rawResponseSummary: {
      minimumPasswordLength: 14,
      requireStrongPassword: true,
      disallowReuseCount: 10
    }
  },

  // --- GitHub Enterprise / Cloud (9 Checks) ---
  {
    id: 'chk-gh-01',
    code: 'GH-2FA-01',
    name: 'Organization-Wide Two-Factor Authentication (2FA)',
    connector: 'github',
    category: 'Identity & Access',
    severity: 'critical',
    description: 'Requires all members, outside collaborators, and bots in the GitHub organization to have 2FA enabled before accessing source repositories.',
    mappedControlCodes: ['A.8.5', 'PR.AA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'a3d2c1b09876543210fedcba9876543210fedcba9876543210fedcba98765432',
    remediationGuidance: 'Navigate to Organization Settings > Security > Two-factor authentication and check "Require two-factor authentication for everyone in the organization".',
    rawResponseSummary: {
      twoFactorRequirementEnforced: true,
      membersCompliant: 38,
      membersNonCompliant: 0,
      outsideCollaboratorsCompliant: 4
    }
  },
  {
    id: 'chk-gh-02',
    code: 'GH-BRN-02',
    name: 'Branch Protection Enforced on Default Branch',
    connector: 'github',
    category: 'Configuration Management',
    severity: 'critical',
    description: 'Checks that "main" and "production" branches across all repositories have branch protection rules requiring pull request reviews and status checks.',
    mappedControlCodes: ['A.8.9', 'PR.PS', 'RC.RP'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '87654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0',
    remediationGuidance: 'Ensure all repositories prevent direct force-pushes and require CI test passage.',
    rawResponseSummary: {
      totalRepositories: 16,
      protectedDefaultBranches: 16,
      requireLinearHistory: true,
      enforceAdminsIncluded: true
    }
  },
  {
    id: 'chk-gh-03',
    code: 'GH-SEC-03',
    name: 'Secret Scanning & Push Protection Enabled',
    connector: 'github',
    category: 'Secret Protection',
    severity: 'critical',
    description: 'Verifies that GitHub Secret Scanning and Secret Scanning Push Protection are activated across all repositories to prevent token leaks.',
    mappedControlCodes: ['A.8.16', 'A.8.24', 'PR.DS', 'RS.MA'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    remediationGuidance: 'In Organization Settings > Code security and analysis, turn on "Secret scanning" and "Push protection" for all current and future repositories.',
    rawResponseSummary: {
      secretScanningEnabled: true,
      pushProtectionEnabled: true,
      detectedUnresolvedAlerts: 0,
      scannedRepos: 16
    }
  },
  {
    id: 'chk-gh-04',
    code: 'GH-CSN-04',
    name: 'Static Code Scanning (SAST / CodeQL) Active',
    connector: 'github',
    category: 'Vulnerability Management',
    severity: 'high',
    description: 'Checks whether CodeQL or third-party SAST tooling runs automated static analysis on pull requests before code merges.',
    mappedControlCodes: ['A.8.8', 'DE.CM'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    remediationGuidance: 'Enable CodeQL default setup in repository Settings > Code security.',
    rawResponseSummary: {
      codeScanningEnabledRepos: 16,
      criticalVulnerabilitiesFound: 0,
      highVulnerabilitiesFound: 1
    }
  },
  {
    id: 'chk-gh-05',
    code: 'GH-PUB-05',
    name: 'No Public Repositories with Sensitive Naming',
    connector: 'github',
    category: 'Information Leakage',
    severity: 'high',
    description: 'Scans organization repositories to ensure no public repositories contain sensitive keywords (e.g. backend, internal, database, secret, client).',
    mappedControlCodes: ['A.8.24', 'ID.AM', 'PR.DS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    remediationGuidance: 'Restricted repository creation policy enforced so only organization owners can publish public repositories.',
    rawResponseSummary: {
      totalPublicRepos: 1, // open source sdk
      publicRepoNames: ['healthbridge-client-sdk'],
      flaggedSensitiveRepos: 0
    }
  },
  {
    id: 'chk-gh-06',
    code: 'GH-DEP-06',
    name: 'Dependabot Security & Automated Version Updates',
    connector: 'github',
    category: 'Vulnerability Management',
    severity: 'medium',
    description: 'Ensures Dependabot alerts and automated security pull requests are active for CVE patching in package manifests.',
    mappedControlCodes: ['A.8.8', 'DE.CM'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
    remediationGuidance: 'Review and merge open Dependabot security pull requests within 14 days of publication.',
    rawResponseSummary: {
      dependabotAlertsEnabled: true,
      dependabotSecurityUpdatesEnabled: true,
      openCriticalAlerts: 0,
      openHighAlerts: 2
    }
  },
  {
    id: 'chk-gh-07',
    code: 'GH-ADM-07',
    name: 'GitHub Organization Owners Limited & Audited',
    connector: 'github',
    category: 'Privileged Access',
    severity: 'medium',
    description: 'Restricts the number of GitHub organization owners to at most 3 trusted staff members to prevent unauthorized permission changes.',
    mappedControlCodes: ['A.5.1', 'A.8.2', 'GV.PO'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    remediationGuidance: 'Demote non-administrative engineering team leads from Owner to Member role.',
    rawResponseSummary: {
      ownerCount: 2,
      owners: ['marcus-vciso', 'elena-cto'],
      basePermissions: 'read'
    }
  },
  {
    id: 'chk-gh-08',
    code: 'GH-IPR-08',
    name: 'Peer Code Review Enforced (Minimum 1 Approver)',
    connector: 'github',
    category: 'Access Rights & Change Management',
    severity: 'high',
    description: 'Confirms that branch protection requires at least 1 independent peer code review before any pull request can merge.',
    mappedControlCodes: ['A.5.18', 'PR.PS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: '9900aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
    remediationGuidance: 'In branch protection rules, enforce "Require pull request reviews before merging" with Required Approving Reviews >= 1 and "Dismiss stale pull request approvals when new commits are pushed".',
    rawResponseSummary: {
      enforcedOnAllRepos: true,
      minimumApprovalsRequired: 1,
      dismissStaleReviews: true,
      requireCodeOwners: true
    }
  },
  {
    id: 'chk-gh-09',
    code: 'GH-SGN-09',
    name: 'Cryptographic Commit Signing Verification (GPG/SSH)',
    connector: 'github',
    category: 'Cryptographic Protection',
    severity: 'medium',
    description: 'Verifies that production repository branch protection rules reject unsigned git commits to guarantee author provenance.',
    mappedControlCodes: ['A.8.24', 'PR.PS'],
    status: 'passed',
    lastRunAt: '2026-10-31T08:15:00Z',
    latestEvidenceHash: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
    remediationGuidance: 'Enable "Require signed commits" in branch protection rules for main and release branches.',
    rawResponseSummary: {
      signedCommitsRequired: true,
      lastSignedCommitVerified: true,
      keyAlgorithm: 'ed25519'
    }
  }
];

export const SEED_POLICIES: Policy[] = [
  {
    id: 'pol-01',
    organizationId: 'org-healthbridge',
    code: 'POL-01',
    title: 'Information Security Policy',
    description: 'Overarching security governance, objectives, management commitment, and security roles across HealthBridge Technologies.',
    version: '1.2',
    status: 'approved',
    author: 'Marcus Vance, CISSP (vCISO)',
    approver: 'Elena Rostova (CTO)',
    approvedAt: '2026-10-15T14:30:00Z',
    updatedAt: '2026-10-15T14:30:00Z',
    mappedControls: ['A.5.1', 'A.5.2', 'GV.PO'],
    citations: ['ISO/IEC 27001:2022 Clause 5.2', 'NIST CSF 2.0 GV.PO-01'],
    content: `# Information Security Policy
**Organization:** HealthBridge Technologies  
**Classification:** Internal & Auditor Facing  
**Version:** 1.2  
**Approved by:** Elena Rostova (Chief Technology Officer)  
**Effective Date:** October 15, 2026  

---

### 1. Purpose & Scope
This Information Security Policy establishes executive leadership's commitment to protecting the confidentiality, integrity, and availability of all electronic protected health information (ePHI), customer records, intellectual property, and computing infrastructure operated by HealthBridge Technologies. This policy applies to all full-time employees, contractors, advisors, and cloud services (Microsoft 365, GitHub, production cloud environments).

### 2. Leadership Commitment & Roles
- **Chief Technology Officer (CTO):** Holds ultimate executive accountability for technology risk and compliance posture.
- **Virtual Chief Information Security Officer (vCISO):** Formulates security strategy, maintains the risk register, orchestrates third-party audits, and conducts quarterly reviews.
- **All Personnel:** Mandatory completion of annual security awareness training and adherence to all topic-specific policies.

### 3. Core Security Principles
1. **Zero Trust & Least Privilege:** Default deny on all access requests. Access is granted solely based on verified business necessity.
2. **Multi-Factor Authentication (MFA):** Mandatory across all administrative, corporate, and developer interfaces.
3. **Data Protection by Design:** Universal AES-256 encryption at rest and TLS 1.3 in transit.
4. **Continuous Evidence & Compliance:** Automated continuous monitoring against ISO/IEC 27001:2022 and NIST CSF 2.0 baselines.

### 4. Review Cadence
This policy shall be formally reviewed at least annually or following significant architectural or organizational changes.`
  },
  {
    id: 'pol-02',
    organizationId: 'org-healthbridge',
    code: 'POL-02',
    title: 'Access Control Policy',
    description: 'Rules governing user provisioning, privileged credential management, multi-factor authentication, and quarterly access reviews.',
    version: '1.1',
    status: 'approved',
    author: 'Marcus Vance, CISSP (vCISO)',
    approver: 'Elena Rostova (CTO)',
    approvedAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
    mappedControls: ['A.5.15', 'A.5.16', 'A.5.18', 'A.8.2', 'A.8.5', 'PR.AA'],
    citations: ['ISO/IEC 27001:2022 A.5.15, A.8.2', 'NIST CSF 2.0 PR.AA-01'],
    content: `# Access Control & Identity Management Policy
**Organization:** HealthBridge Technologies  
**Version:** 1.1  
**Status:** Approved  

---

### 1. Identity & Credential Standards
- All corporate accounts must be anchored in Entra ID / Microsoft 365.
- Multi-factor authentication is mandatory without exception. SMS is disallowed for privileged access; FIDO2 WebAuthn or Microsoft Authenticator number-matching is required.
- Passwords must be at least 14 characters in length and checked against compromised credential dictionaries.

### 2. Privileged Access Management
- Permanent Global Administrator assignments must not exceed 4 accounts.
- Administrative accounts must not be used for daily email, web browsing, or routine workstation usage.
- Privileged elevation is monitored with alerts sent to the security channel.

### 3. Access Reviews & Deprovisioning
- Human Resources must notify IT Operations of any termination within 2 hours.
- Access reviews of all privileged roles and external guest collaborators occur every 90 days.
- Inactive accounts (>60 days) are automatically disabled.`
  },
  {
    id: 'pol-03',
    organizationId: 'org-healthbridge',
    code: 'POL-03',
    title: 'Incident Response Plan',
    description: 'Systematic procedures for detection, triage, containment, eradication, recovery, and post-incident regulatory reporting.',
    version: '1.0',
    status: 'under_review',
    author: 'Marcus Vance, CISSP (vCISO)',
    updatedAt: '2026-10-24T16:20:00Z',
    mappedControls: ['A.8.15', 'A.8.16', 'RS.MA', 'DE.CM'],
    citations: ['ISO/IEC 27001:2022 A.5.24 - A.5.28', 'NIST CSF 2.0 RS.MA-01'],
    content: `# Security Incident Response Plan (S-IRP)
**Organization:** HealthBridge Technologies  
**Version:** 1.0 (Draft under review)  

---

### 1. Incident Severity Classification
- **SEV-1 (Critical):** Confirmed compromise of production database, ransomware, or unauthorized exfiltration of customer PHI/PII. Response time < 15 minutes.
- **SEV-2 (High):** Unauthorized administrative account access or credential leak without confirmed exfiltration. Response time < 1 hour.
- **SEV-3 (Medium/Low):** Isolated malware on endpoint or blocked malicious phishing campaign. Response time < 4 hours.

### 2. Incident Response Team (IRT)
- Incident Commander: Virtual CISO (Marcus Vance)
- Technical Lead: Lead DevOps & Engineering (Elena Rostova)
- Legal & Communications: External Legal Counsel

### 3. Containment & Eradication Workflow
1. Isolate affected endpoints or revoke compromised access tokens immediately.
2. Preserve forensic snapshots and audit logs with cryptographic SHA-256 hashes.
3. Notify affected regulatory bodies within 72 hours if statutory thresholds are met.
4. Conduct root-cause post-mortem within 5 business days.`
  },
  {
    id: 'pol-04',
    organizationId: 'org-healthbridge',
    code: 'POL-04',
    title: 'Backup & Disaster Recovery Policy',
    description: 'Backup frequency, encryption, immutable storage, replication, and disaster recovery recovery-point and recovery-time objectives.',
    version: '1.0',
    status: 'draft',
    author: 'Elena Rostova (CTO)',
    updatedAt: '2026-10-28T11:15:00Z',
    mappedControls: ['A.8.13', 'RC.RP', 'PR.DS'],
    citations: ['ISO/IEC 27001:2022 A.8.13', 'NIST CSF 2.0 RC.RP-01'],
    content: `# Backup & Disaster Recovery Policy
**Organization:** HealthBridge Technologies  
**Version:** 1.0 (Draft)  

---

### 1. Objectives
- Recovery Point Objective (RPO): Maximum 1 hour data loss for production transactional databases.
- Recovery Time Objective (RTO): Maximum 4 hours to full operational service restoration.

### 2. Backup Schedules & Protection
- Automated hourly snapshots of databases with daily differential backups.
- Backups are stored in geographically distinct cloud regions with Object Lock (immutability) enabled.
- Backups are encrypted with KMS-managed customer keys (AES-256).

### 3. Testing Cadence
- Quarterly automated restoration drill into staging environment.
- Annual simulated multi-region failover drill overseen by the vCISO.`
  },
  {
    id: 'pol-05',
    organizationId: 'org-healthbridge',
    code: 'POL-05',
    title: 'Acceptable Use Policy',
    description: 'Acceptable and prohibited behavior for corporate computing equipment, software installations, AI tools, and remote work.',
    version: '1.0',
    status: 'approved',
    author: 'Marcus Vance, CISSP (vCISO)',
    approver: 'Elena Rostova (CTO)',
    approvedAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-20T09:00:00Z',
    mappedControls: ['A.5.1', 'A.5.10', 'PR.AA', 'GV.PO'],
    citations: ['ISO/IEC 27001:2022 A.5.10', 'NIST CSF 2.0 GV.PO-02'],
    content: `# Acceptable Use Policy (AUP)
**Organization:** HealthBridge Technologies  
**Version:** 1.0  
**Status:** Approved  

---

### 1. Scope & Guidelines
This policy applies to all personnel utilizing HealthBridge computing hardware, mobile devices, SaaS applications, and network connections.

### 2. Permitted & Prohibited Activities
- **Permitted:** Work-related software development, communication, authorized customer support, and incidental personal browsing.
- **Prohibited:**
  - Pasting proprietary source code, credentials, or customer PHI into unauthorized external public AI chatbots.
  - Disabling corporate antivirus, firewall, or MDM software on company-issued laptops.
  - Installing unapproved peer-to-peer software or torrent clients.
  - Sharing credentials or MFA push approval tokens with colleagues.`
  }
];

export const SEED_QUESTIONNAIRE_ITEMS = [
  {
    id: 'q-01',
    questionNumber: 1,
    category: 'Authentication & Access',
    question: 'Does your organization enforce Multi-Factor Authentication (MFA) for all administrative and user logins?',
    suggestedAnswer: 'Yes. HealthBridge enforces mandatory Multi-Factor Authentication (MFA) across 100% of active Entra ID / Microsoft 365 and GitHub accounts. SMS verification is prohibited for privileged roles; FIDO2 security keys and Microsoft Authenticator number matching are required.',
    confidenceScore: 98,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Access Control Policy § 1', reference: 'POL-02' },
      { type: 'check' as const, name: 'MFA Enforced for All Active Users (100% pass)', reference: 'M365-MFA-01' }
    ],
    humanApproved: true,
    humanReviewNotes: 'Verified live evidence on Oct 31, 2026.'
  },
  {
    id: 'q-02',
    questionNumber: 2,
    category: 'Data Protection & Encryption',
    question: 'What cryptographic encryption standards are utilized to protect customer data at rest and in transit?',
    suggestedAnswer: 'Customer data is encrypted at rest using AES-256 and in transit using TLS 1.3 (TLS 1.2 minimum). Database backups and object storage utilize cloud KMS-managed customer keys with cryptographic integrity hashing.',
    confidenceScore: 94,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Information Security Policy § 3', reference: 'POL-01' },
      { type: 'control' as const, name: 'ISO 27001:2022 A.8.24 Cryptography', reference: 'ctrl-iso-8.24' }
    ],
    humanApproved: true
  },
  {
    id: 'q-03',
    questionNumber: 3,
    category: 'Privileged Access',
    question: 'How many individuals have permanent super-administrator or global administrator access to production systems?',
    suggestedAnswer: 'HealthBridge restricts permanent Global Administrator roles. Currently 6 accounts hold Global Admin privileges in Entra ID, which is undergoing remediation down to 3 accounts via Privileged Identity Management (PIM) just-in-time access in Sprint 1.',
    confidenceScore: 71,
    needsReview: true,
    citedSources: [
      { type: 'check' as const, name: 'Privileged Global Administrator Count Restricted (Failing check: 6 detected, threshold <= 4)', reference: 'M365-ADM-02' },
      { type: 'policy' as const, name: 'Access Control Policy § 2', reference: 'POL-02' }
    ],
    humanApproved: false,
    humanReviewNotes: 'Flagged for vCISO review: remediation roadmap item currently active to reduce from 6 to 3.'
  },
  {
    id: 'q-04',
    questionNumber: 4,
    category: 'Software Development & Repositories',
    question: 'Are code changes subjected to peer review and automated security scanning prior to production deployment?',
    suggestedAnswer: 'Yes. All GitHub repositories enforce branch protection on default branches. Direct commits and force-pushes are blocked. Every pull request requires at least 1 independent peer code review, passing automated CI tests, CodeQL static code analysis, and GitHub secret scanning push protection.',
    confidenceScore: 96,
    needsReview: false,
    citedSources: [
      { type: 'check' as const, name: 'Branch Protection Enforced on Default Branch', reference: 'GH-BRN-02' },
      { type: 'check' as const, name: 'Peer Code Review Enforced (Min 1 Approver)', reference: 'GH-IPR-08' },
      { type: 'check' as const, name: 'Secret Scanning & Push Protection Enabled', reference: 'GH-SEC-03' }
    ],
    humanApproved: true
  },
  {
    id: 'q-05',
    questionNumber: 5,
    category: 'Incident Response & Breach Notification',
    question: 'What is your procedure and SLA for notifying clients in the event of a confirmed security incident or data breach?',
    suggestedAnswer: 'HealthBridge maintains a formal Security Incident Response Plan (S-IRP). In the event of a confirmed breach impacting customer data (SEV-1), clients will be formally notified in writing without unreasonable delay, and no later than 72 hours post-confirmation, accompanied by forensic mitigation details.',
    confidenceScore: 91,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Incident Response Plan § 1 & § 3', reference: 'POL-03' }
    ],
    humanApproved: true
  },
  {
    id: 'q-06',
    questionNumber: 6,
    category: 'Vulnerability Management',
    question: 'How frequently are dependencies and software vulnerabilities scanned and remediated?',
    suggestedAnswer: 'Automated vulnerability scanning is performed continuously. GitHub Dependabot monitors dependencies in real-time and opens automated remediation pull requests. Critical CVE vulnerabilities must be patched within 14 days, and high severity CVEs within 30 days.',
    confidenceScore: 93,
    needsReview: false,
    citedSources: [
      { type: 'check' as const, name: 'Dependabot Security & Automated Updates', reference: 'GH-DEP-06' },
      { type: 'check' as const, name: 'Static Code Scanning (SAST / CodeQL) Active', reference: 'GH-CSN-04' }
    ],
    humanApproved: true
  },
  {
    id: 'q-07',
    questionNumber: 7,
    category: 'Identity Lifecycle',
    question: 'Describe your procedure for offboarding employees and revoking access credentials upon termination.',
    suggestedAnswer: 'Human Resources triggers automated termination workflows. Corporate Entra ID credentials and active sessions are revoked immediately (within 2 hours of departure). Stale external guest accounts are audited every 90 days, though 9 inactive guest accounts are currently queued for bulk purge in Sprint 1.',
    confidenceScore: 68,
    needsReview: true,
    citedSources: [
      { type: 'policy' as const, name: 'Access Control Policy § 3', reference: 'POL-02' },
      { type: 'check' as const, name: 'Guest & External Accounts Stale Access Review (Failing check: 9 inactive guests)', reference: 'M365-GST-05' }
    ],
    humanApproved: false,
    humanReviewNotes: 'Low confidence due to failing check M365-GST-05. Requires vCISO sign-off.'
  },
  {
    id: 'q-08',
    questionNumber: 8,
    category: 'Logging & Monitoring',
    question: 'Are system and administrator activities logged, and where are audit logs retained?',
    suggestedAnswer: 'Yes. Microsoft Purview Unified Audit Logging and Entra ID sign-in telemetry are fully enabled and retained for a minimum of 180 days with tamper-evident protections.',
    confidenceScore: 95,
    needsReview: false,
    citedSources: [
      { type: 'check' as const, name: 'Unified Audit Logging (UAL) Enabled & Retained', reference: 'M365-LOG-06' },
      { type: 'control' as const, name: 'ISO 27001:2022 A.8.15 Logging', reference: 'ctrl-iso-8.15' }
    ],
    humanApproved: true
  },
  {
    id: 'q-09',
    questionNumber: 9,
    category: 'Business Continuity & Disaster Recovery',
    question: 'What are your stated Recovery Point Objective (RPO) and Recovery Time Objective (RTO)?',
    suggestedAnswer: 'Our operational targets are an RPO of 1 hour for transactional databases and an RTO of 4 hours for full platform restoration. Backups are snapshot-automated with multi-region replication.',
    confidenceScore: 89,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Backup & Disaster Recovery Policy § 1', reference: 'POL-04' }
    ],
    humanApproved: true
  },
  {
    id: 'q-10',
    questionNumber: 10,
    category: 'Governance & Security Leadership',
    question: 'Does your organization have a designated Chief Information Security Officer (CISO) or dedicated security lead?',
    suggestedAnswer: 'Yes. HealthBridge retains a dedicated Virtual Chief Information Security Officer (vCISO), Marcus Vance, CISSP, CISA, who oversees our security governance, risk register, quarterly executive reviews, and continuous compliance roadmap.',
    confidenceScore: 99,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Information Security Policy § 2', reference: 'POL-01' }
    ],
    humanApproved: true
  },
  {
    id: 'q-11',
    questionNumber: 11,
    category: 'Device Management',
    question: 'Are company-managed workstations enrolled in an endpoint management solution with mandatory full-disk encryption?',
    suggestedAnswer: 'Yes. Workstations are enrolled in Microsoft Intune MDM. Full-disk encryption (BitLocker for Windows / FileVault for macOS) is enforced org-wide with 98.1% verified compliance.',
    confidenceScore: 92,
    needsReview: false,
    citedSources: [
      { type: 'check' as const, name: 'MDM Intune Compliance', reference: 'M365-DEV-10' }
    ],
    humanApproved: true
  },
  {
    id: 'q-12',
    questionNumber: 12,
    category: 'Data Protection & Encryption',
    question: 'Are database and storage encryption keys managed by the vendor or customer-managed with rotation?',
    suggestedAnswer: 'Cloud storage and databases utilize KMS customer-managed encryption keys with automatic annual rotation policies.',
    confidenceScore: 88,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Information Security Policy § 3', reference: 'POL-01' }
    ],
    humanApproved: true
  },
  {
    id: 'q-13',
    questionNumber: 13,
    category: 'Physical & Environmental Security',
    question: 'Do you operate on-premise physical data centers, or are workloads hosted in certified public cloud facilities?',
    suggestedAnswer: 'HealthBridge is 100% cloud-native. Production systems reside exclusively in certified hyperscaler regions (SOC 2 Type II and ISO 27001 certified). HealthBridge maintains no physical corporate server infrastructure.',
    confidenceScore: 97,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Information Security Policy § 1', reference: 'POL-01' }
    ],
    humanApproved: true
  },
  {
    id: 'q-14',
    questionNumber: 14,
    category: 'Third-Party Risk',
    question: 'How do you evaluate and monitor the security posture of third-party SaaS vendors and sub-processors?',
    suggestedAnswer: 'All third-party vendors must undergo annual security review, review of SOC 2 Type II or ISO 27001 certifications, and execution of Data Processing Agreements (DPAs). Third-party OAuth API scopes are controlled via tenant policies.',
    confidenceScore: 84,
    needsReview: false,
    citedSources: [
      { type: 'control' as const, name: 'NIST CSF 2.0 GV.PO / ISO 27001 A.5.19', reference: 'ctrl-iso-5.1' }
    ],
    humanApproved: true
  },
  {
    id: 'q-15',
    questionNumber: 15,
    category: 'Employee Security Training',
    question: 'Do employees undergo mandatory background checks and security awareness training?',
    suggestedAnswer: 'All new hires undergo criminal background checks prior to employment and complete mandatory security awareness training covering phishing, clean desk practices, and credential hygiene within their first 14 days, followed by annual refreshers.',
    confidenceScore: 90,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Information Security Policy § 2', reference: 'POL-01' },
      { type: 'policy' as const, name: 'Acceptable Use Policy § 1', reference: 'POL-05' }
    ],
    humanApproved: true
  },
  {
    id: 'q-16',
    questionNumber: 16,
    category: 'Access Control',
    question: 'Are legacy protocols such as POP, IMAP, and Basic Authentication disabled?',
    suggestedAnswer: 'Yes. Legacy authentication protocols that lack multi-factor authentication capability are systematically blocked across all Microsoft 365 cloud workloads via Conditional Access.',
    confidenceScore: 99,
    needsReview: false,
    citedSources: [
      { type: 'check' as const, name: 'Legacy Authentication Protocols Blocked', reference: 'M365-LEG-04' }
    ],
    humanApproved: true
  },
  {
    id: 'q-17',
    questionNumber: 17,
    category: 'Software Development & Repositories',
    question: 'How does your organization prevent secrets (API keys, passwords) from being checked into source repositories?',
    suggestedAnswer: 'GitHub Secret Scanning and Push Protection are activated org-wide. If an engineer attempts to commit a high-entropy string or recognized API token, the push is intercepted and blocked at commit time before ingestion.',
    confidenceScore: 98,
    needsReview: false,
    citedSources: [
      { type: 'check' as const, name: 'Secret Scanning & Push Protection Enabled', reference: 'GH-SEC-03' }
    ],
    humanApproved: true
  },
  {
    id: 'q-18',
    questionNumber: 18,
    category: 'Authentication & Access',
    question: 'Is device trust or device health verified before allowing access to internal corporate tools?',
    suggestedAnswer: 'Conditional Access device trust policy is currently in Report-Only mode during user onboarding and is scheduled for strict enforcement blocking in Sprint 1.',
    confidenceScore: 70,
    needsReview: true,
    citedSources: [
      { type: 'check' as const, name: 'Conditional Access Policy Enforces Device Trust (Failing: reportOnly mode)', reference: 'M365-CA-03' }
    ],
    humanApproved: false,
    humanReviewNotes: 'Reported accurately: device trust policy exists but is currently staged in Report-Only mode.'
  },
  {
    id: 'q-19',
    questionNumber: 19,
    category: 'Vulnerability Management',
    question: 'Does your organization conduct independent third-party penetration testing on an annual basis?',
    suggestedAnswer: 'HealthBridge contracts external CREST-accredited penetration testing firms annually. The most recent assessment was conducted in Q2 2026 with all critical and high findings remediated within 30 days.',
    confidenceScore: 86,
    needsReview: false,
    citedSources: [
      { type: 'control' as const, name: 'ISO 27001:2022 A.8.8 Vulnerability Management', reference: 'ctrl-iso-8.8' }
    ],
    humanApproved: true
  },
  {
    id: 'q-20',
    questionNumber: 20,
    category: 'Governance & Security Leadership',
    question: 'Which cybersecurity frameworks is your organization currently aligned with or certified against?',
    suggestedAnswer: 'HealthBridge is actively aligned with ISO/IEC 27001:2022 and NIST CSF 2.0, utilizing continuous compliance automation and a formal vCISO workspace to maintain readiness for our formal Stage 2 audit.',
    confidenceScore: 98,
    needsReview: false,
    citedSources: [
      { type: 'policy' as const, name: 'Information Security Policy § 3', reference: 'POL-01' }
    ],
    humanApproved: true
  }
];

export const SEED_RISKS: RiskEntry[] = [
  {
    id: 'risk-01',
    organizationId: 'org-healthbridge',
    title: 'Excessive Global Administrators in Microsoft 365 Tenant',
    category: 'Privileged Access',
    description: '6 accounts hold permanent Global Admin privileges, exceeding the target threshold of 4. A single compromised credential could grant full tenant takeover.',
    likelihood: 3,
    impact: 5,
    riskScore: 15, // 3 * 5 = 15 (High)
    owner: 'Marcus Vance (vCISO)',
    treatment: 'Mitigate',
    treatmentPlan: 'Demote 3 accounts to role-based access (User Admin, Exchange Admin) and configure Privileged Identity Management (PIM) with approval workflow.',
    status: 'In Progress',
    linkedControlCodes: ['A.8.2', 'PR.AA'],
    linkedCheckCodes: ['M365-ADM-02'],
    updatedAt: '2026-10-31T08:30:00Z'
  },
  {
    id: 'risk-02',
    organizationId: 'org-healthbridge',
    title: 'Device Trust Conditional Access Policy in Report-Only Mode',
    category: 'Access & Identity',
    description: 'Conditional access rules requiring compliant Intune devices are currently not enforced, allowing unmanaged personal devices to access corporate email.',
    likelihood: 4,
    impact: 4,
    riskScore: 16, // 4 * 4 = 16 (High)
    owner: 'Elena Rostova (CTO)',
    treatment: 'Mitigate',
    treatmentPlan: 'Transition CAP-04-RequireCompliantDevice from Report-Only to Enforced mode after completing the 5 remaining contractor laptop enrollments.',
    status: 'In Progress',
    linkedControlCodes: ['A.5.15', 'PR.AA'],
    linkedCheckCodes: ['M365-CA-03'],
    updatedAt: '2026-10-31T08:30:00Z'
  },
  {
    id: 'risk-03',
    organizationId: 'org-healthbridge',
    title: 'Stale External Guest Accounts in Directory',
    category: 'Governance & Third-Party',
    description: '9 external contractor and partner accounts have had zero sign-in activity in 90+ days, presenting dormant attack vectors.',
    likelihood: 3,
    impact: 3,
    riskScore: 9, // 3 * 3 = 9 (Medium)
    owner: 'Elena Rostova (CTO)',
    treatment: 'Mitigate',
    treatmentPlan: 'Execute Entra ID Access Review campaign to automatically revoke guest accounts inactive for >60 days.',
    status: 'Open',
    linkedControlCodes: ['A.5.16', 'ID.AM'],
    linkedCheckCodes: ['M365-GST-05'],
    updatedAt: '2026-10-31T08:30:00Z'
  },
  {
    id: 'risk-04',
    organizationId: 'org-healthbridge',
    title: 'Disaster Recovery Failover Drill Outstanding',
    category: 'Operational Continuity',
    description: 'While hourly automated database backups are functioning with object lock, a formal end-to-end multi-region failover test has not been executed this year.',
    likelihood: 2,
    impact: 4,
    riskScore: 8, // 2 * 4 = 8 (Medium)
    owner: 'Marcus Vance (vCISO)',
    treatment: 'Mitigate',
    treatmentPlan: 'Schedule simulated RDS database failover and application DNS rerouting during scheduled maintenance window.',
    status: 'Open',
    linkedControlCodes: ['A.8.13', 'RC.RP'],
    linkedCheckCodes: [],
    updatedAt: '2026-10-31T08:30:00Z'
  },
  {
    id: 'risk-05',
    organizationId: 'org-healthbridge',
    title: 'Third-Party SaaS Vendor Security Questionnaire Backlog',
    category: 'Governance & Third-Party',
    description: 'Customer enterprise security assessments take an average of 12 business days to complete, risking sales pipeline velocity.',
    likelihood: 4,
    impact: 3,
    riskScore: 12, // 4 * 3 = 12 (Medium)
    owner: 'Marcus Vance (vCISO)',
    treatment: 'Mitigate',
    treatmentPlan: 'Deploy AI Questionnaire Autofill powered by approved policy catalog and automated check evidence to drop turnaround to < 24 hours.',
    status: 'In Progress',
    linkedControlCodes: ['A.5.1', 'GV.PO'],
    linkedCheckCodes: [],
    updatedAt: '2026-10-31T08:30:00Z'
  }
];

export const SEED_ROADMAP_TASKS: RoadmapTask[] = [
  // Sprint 1 (Days 1-30) - Critical Remediation
  {
    id: 'task-01',
    organizationId: 'org-healthbridge',
    title: 'Demote 3 Global Administrators & Configure PIM',
    description: 'Reduce permanent Global Admins from 6 to 3. Assign role-specific delegated permissions (Exchange Admin, User Admin) and activate JIT elevation.',
    phase: 'Sprint 1 (Days 1-30)',
    priority: 'P1',
    owner: 'Elena Rostova (CTO)',
    dueDate: '2026-11-10',
    status: 'in_progress',
    linkedCheckCode: 'M365-ADM-02',
    linkedRiskId: 'risk-01'
  },
  {
    id: 'task-02',
    organizationId: 'org-healthbridge',
    title: 'Enforce Conditional Access Device Trust Policy',
    description: 'Switch CAP-04-RequireCompliantDevice from Report-Only to Enforced mode so only Intune-compliant laptops can access tenant resources.',
    phase: 'Sprint 1 (Days 1-30)',
    priority: 'P1',
    owner: 'Elena Rostova (CTO)',
    dueDate: '2026-11-15',
    status: 'in_progress',
    linkedCheckCode: 'M365-CA-03',
    linkedRiskId: 'risk-02'
  },
  {
    id: 'task-03',
    organizationId: 'org-healthbridge',
    title: 'Bulk Revoke 9 Stale External Guest Accounts',
    description: 'Run Entra ID Access Review to purge dormant guest user invitations inactive for >90 days.',
    phase: 'Sprint 1 (Days 1-30)',
    priority: 'P2',
    owner: 'Elena Rostova (CTO)',
    dueDate: '2026-11-20',
    status: 'todo',
    linkedCheckCode: 'M365-GST-05',
    linkedRiskId: 'risk-03'
  },
  // Sprint 2 (Days 31-60) - Core Controls & Policies
  {
    id: 'task-04',
    organizationId: 'org-healthbridge',
    title: 'Complete and Approve Incident Response Plan',
    description: 'Finalize Version 1.0 of the Incident Response Plan, test escalation phone tree, and obtain executive sign-off.',
    phase: 'Sprint 2 (Days 31-60)',
    priority: 'P1',
    owner: 'Marcus Vance (vCISO)',
    dueDate: '2026-12-05',
    status: 'in_progress',
    linkedRiskId: 'risk-05'
  },
  {
    id: 'task-05',
    organizationId: 'org-healthbridge',
    title: 'Execute Simulated Multi-Region DR Drill',
    description: 'Perform scheduled database failover in staging environment and document recovery time against 4-hour RTO SLA.',
    phase: 'Sprint 2 (Days 31-60)',
    priority: 'P2',
    owner: 'Elena Rostova (CTO)',
    dueDate: '2026-12-18',
    status: 'todo',
    linkedRiskId: 'risk-04'
  },
  // Sprint 3 (Days 61-90) - Operational Maturity & Audit Prep
  {
    id: 'task-06',
    organizationId: 'org-healthbridge',
    title: 'Conduct Mock ISO 27001:2022 Stage 1 Readiness Audit',
    description: 'Simulate auditor walkthrough with read-only access, review evidence hashes, and verify 100% control mapping coverage.',
    phase: 'Sprint 3 (Days 61-90)',
    priority: 'P1',
    owner: 'Marcus Vance (vCISO)',
    dueDate: '2027-01-15',
    status: 'todo'
  },
  {
    id: 'task-07',
    organizationId: 'org-healthbridge',
    title: 'Automate Quarterly Access Review Workflows',
    description: 'Implement recurring quarterly entitlement reviews for all engineering roles and database access groups.',
    phase: 'Sprint 3 (Days 61-90)',
    priority: 'P3',
    owner: 'Elena Rostova (CTO)',
    dueDate: '2027-01-28',
    status: 'todo'
  }
];

export const SEED_LEADERSHIP_REPORT: LeadershipReport = {
  id: 'rep-q4-2026',
  organizationId: 'org-healthbridge',
  quarter: 'Q4 2026',
  generatedAt: '2026-10-31T09:00:00Z',
  vCISOAuthor: 'Marcus Vance, CISSP, CISA (vCISO)',
  status: 'draft',
  executiveSummary: 'HealthBridge Technologies demonstrated strong security posture progression in Q4 2026, achieving 82% ISO 27001:2022 readiness and 88% NIST CSF 2.0 category alignment. Key milestones include 100% MFA deployment org-wide, automated GitHub secret scanning, and the establishment of a formally governed policy catalog. Remediation of 3 failing controls (privileged admin count, conditional access device trust enforcement, and stale guest accounts) is actively scheduled for Sprint 1.',
  compliancePosture: {
    isoScore: 82,
    nistScore: 88,
    totalChecks: 28,
    passingChecks: 25,
    criticalGaps: 3
  },
  topRisksSummary: [
    '6 permanent Global Administrator accounts in Microsoft 365 (Target: <= 4). Demotion and PIM enablement underway.',
    'Conditional Access device-compliance enforcement remains in Report-Only mode during endpoint fleet rollout.',
    '9 dormant guest user accounts exceeding 90 days of inactivity, slated for bulk automated offboarding.'
  ],
  quarterlyMilestones: [
    'Completed 100% MFA enforcement on all 52 active Entra ID and GitHub accounts.',
    'Enabled GitHub push protection and branch rules across all 16 production software repositories.',
    'Drafted and approved 4 core security policies (Information Security, Access Control, Acceptable Use, Backup & DR).'
  ],
  next90DaysPlan: [
    'Month 1: Enforce Conditional Access device trust, demote excess Global Admins, and purge inactive guest credentials.',
    'Month 2: Execute quarterly disaster recovery restoration drill and formalize Incident Response Plan approval.',
    'Month 3: Conduct mock ISO 27001 Stage 1 readiness walkthrough with independent auditor.'
  ],
  vCISONotes: 'The platform automation significantly reduced audit preparation overhead. With Sprint 1 remediations complete, HealthBridge will be primed for official ISO/IEC 27001:2022 Stage 2 certification in early 2027.'
};

export const SEED_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-01',
    organizationId: 'org-healthbridge',
    timestamp: '2026-10-31T08:15:02Z',
    actor: 'Compliance Automation Scheduler',
    role: 'client_admin',
    action: 'CHECK_RUN_SCHEDULED',
    resource: 'Automated Checks Engine (28 checks)',
    details: 'Completed scheduled continuous compliance check run. 25 passed, 3 failed. Evidence hashes recorded.'
  },
  {
    id: 'aud-02',
    organizationId: 'org-healthbridge',
    timestamp: '2026-10-31T08:18:40Z',
    actor: 'Marcus Vance',
    role: 'vciso',
    action: 'RISK_REGISTER_UPDATE',
    resource: 'Risk: Excessive Global Administrators',
    details: 'Updated treatment status to In Progress. Assigned remediation task to Elena Rostova.'
  },
  {
    id: 'aud-03',
    organizationId: 'org-healthbridge',
    timestamp: '2026-10-31T08:45:10Z',
    actor: 'Elena Rostova',
    role: 'client_admin',
    action: 'QUESTIONNAIRE_REVIEW',
    resource: 'Enterprise Vendor Assessment (Question 1, 2, 4)',
    details: 'Approved 3 AI-autofilled questionnaire answers citing POL-01 and M365-MFA-01 check evidence.'
  },
  {
    id: 'aud-04',
    organizationId: 'org-healthbridge',
    timestamp: '2026-10-31T09:00:00Z',
    actor: 'Marcus Vance',
    role: 'vciso',
    action: 'LEADERSHIP_REPORT_DRAFTED',
    resource: 'Q4 2026 Executive vCISO Report',
    details: 'AI drafted quarterly report from latest compliance scores and open roadmap items.'
  }
];

export const SEED_MILESTONES: ComplianceMilestone[] = [
  // HealthBridge Technologies
  {
    id: 'ms-hb-01',
    organizationId: 'org-healthbridge',
    title: 'ISMS Scope & Risk Methodology Baseline',
    category: 'policy_governance',
    targetDate: '2026-09-15',
    completedDate: '2026-09-15',
    status: 'completed',
    description: 'Formal definition of ISMS boundary across all digital health cloud environments, databases, and remote personnel.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'ISO 27001 Clause 4.3 & 6.1',
    deliverables: ['Statement of Applicability (SoA) v0.8', 'Risk Assessment Methodology doc'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-02',
    organizationId: 'org-healthbridge',
    title: 'Cloud Connectors & Evidence Collection Engine',
    category: 'technical_verification',
    targetDate: '2026-10-01',
    completedDate: '2026-10-01',
    status: 'completed',
    description: 'Integration of Microsoft 365, Entra ID, and GitHub Enterprise read-only API connectors with automated SHA-256 evidence hashing.',
    owner: 'Elena Rostova (CTO)',
    frameworkRef: 'ISO 27001 A.8.15 / NIST DE.CM',
    deliverables: ['28 Automated Checks Configured', 'Immutable Evidence Store Initialized'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-03',
    organizationId: 'org-healthbridge',
    title: 'Core Governance Policies Executive Sign-Off',
    category: 'policy_governance',
    targetDate: '2026-10-20',
    completedDate: '2026-10-20',
    status: 'completed',
    description: 'Approval of Information Security, Access Control, Acceptable Use, and Backup & Disaster Recovery policies by executive management.',
    owner: 'Elena Rostova (CTO)',
    frameworkRef: 'ISO 27001 Clause 5.2 / NIST GV.PO',
    deliverables: ['POL-01, POL-02, POL-04, POL-05 Approved', 'Employee Acknowledgment Campaign'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-04',
    organizationId: 'org-healthbridge',
    title: 'Sprint 1 Remediation: Admin Demotion & Conditional Access',
    category: 'technical_verification',
    targetDate: '2026-11-15',
    status: 'in_progress',
    description: 'Reduce Global Administrators in Entra ID from 6 to 3, deploy PIM just-in-time workflows, and enforce device-compliance conditional access.',
    owner: 'Elena Rostova (CTO)',
    frameworkRef: 'ISO 27001 A.8.2 & A.5.15 / NIST PR.AA',
    deliverables: ['Demotion of 3 Global Admins', 'CAP-04 Switched to Enforce Mode'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-05',
    organizationId: 'org-healthbridge',
    title: 'Annual Disaster Recovery Failover Simulation Drill',
    category: 'internal_milestone',
    targetDate: '2026-12-18',
    status: 'upcoming',
    description: 'Simulated cross-region database restore and DNS failover test to validate 1-hour RPO and 4-hour RTO compliance.',
    owner: 'Elena Rostova (CTO)',
    frameworkRef: 'ISO 27001 A.8.13 / NIST RC.RP',
    deliverables: ['DR Exercise Post-Mortem Report', 'RTO/RPO Timing Verification Logs'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-06',
    organizationId: 'org-healthbridge',
    title: 'Internal ISMS Pre-Audit & Management Review Meeting',
    category: 'internal_milestone',
    targetDate: '2027-01-10',
    status: 'upcoming',
    description: 'Independent internal audit review of all 93 Annex A controls and mandatory executive management review per ISO 27001 Clause 9.3.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'ISO 27001 Clause 9.2 & 9.3',
    deliverables: ['Internal Audit Non-Conformity Log', 'Management Review Minutes & Sign-Off'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-07',
    organizationId: 'org-healthbridge',
    title: 'External ISO/IEC 27001:2022 Stage 1 Readiness Audit',
    category: 'audit_deadline',
    targetDate: '2027-01-28',
    status: 'upcoming',
    description: 'Formal Stage 1 desktop audit by external accredited registrar. Review of documentation, ISMS scope, risk register, and policy governance.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'External Audit Stage 1',
    deliverables: ['Auditor-Ready Evidence Package', 'Stage 1 Auditor Report'],
    isAuditDeadline: true,
    auditorBody: 'BSI Group Americas'
  },
  {
    id: 'ms-hb-08',
    organizationId: 'org-healthbridge',
    title: 'Stage 1 Observation & Corrective Action Window',
    category: 'internal_milestone',
    targetDate: '2027-02-25',
    status: 'upcoming',
    description: 'Closeout of any Areas for Concern (AFCs) or documentation updates identified by the Stage 1 external auditor prior to Stage 2.',
    owner: 'Elena Rostova (CTO)',
    frameworkRef: 'Audit Finding Resolution',
    deliverables: ['Corrective Action Plan (CAP)', 'Updated Evidence Dossier'],
    isAuditDeadline: false
  },
  {
    id: 'ms-hb-09',
    organizationId: 'org-healthbridge',
    title: 'External ISO/IEC 27001:2022 Stage 2 Formal Certification Audit',
    category: 'audit_deadline',
    targetDate: '2027-03-20',
    status: 'upcoming',
    description: '3-day comprehensive audit of operational effectiveness, technical checks, live interviews with personnel, and evidence verification.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'Official Certification Stage 2',
    deliverables: ['Formal Certificate of Registration', 'Zero Major Non-Conformities Report'],
    isAuditDeadline: true,
    auditorBody: 'BSI Group Americas'
  },
  {
    id: 'ms-hb-10',
    organizationId: 'org-healthbridge',
    title: 'Annual CREST Penetration Testing & Vendor Due Diligence',
    category: 'audit_deadline',
    targetDate: '2027-05-15',
    status: 'upcoming',
    description: 'Independent blackbox and greybox network and web application penetration test performed by CREST-certified testing firm.',
    owner: 'Elena Rostova (CTO)',
    frameworkRef: 'ISO 27001 A.8.8 / NIST DE.CM',
    deliverables: ['Attestation of Penetration Testing', 'Remediation Verification Letter'],
    isAuditDeadline: true,
    auditorBody: 'Coalfire Security Labs'
  },

  // DataPulse Analytics AI
  {
    id: 'ms-dp-01',
    organizationId: 'org-datapulse',
    title: 'Google Workspace & GitHub Security Baseline',
    category: 'technical_verification',
    targetDate: '2026-10-10',
    completedDate: '2026-10-10',
    status: 'completed',
    description: 'Enforce 2SV on 118 Google Workspace accounts and GitHub organization-wide mandatory two-factor.',
    owner: 'Karan Sharma (SecOps)',
    frameworkRef: 'ISO 27001 A.8.5',
    deliverables: ['100% 2SV Enforced Report', 'GitHub Org Policy Check'],
    isAuditDeadline: false
  },
  {
    id: 'ms-dp-02',
    organizationId: 'org-datapulse',
    title: 'OAuth API Whitelist & Suspended Accounts Purge',
    category: 'technical_verification',
    targetDate: '2026-11-20',
    status: 'in_progress',
    description: 'Block 5 unreviewed high-risk OAuth apps and permanently delete 4 stale suspended accounts exceeding 60 days.',
    owner: 'Karan Sharma (SecOps)',
    frameworkRef: 'ISO 27001 A.5.15 / NIST PR.AA',
    deliverables: ['Clean Google Admin Token Audit', 'Deprovisioning Certificate'],
    isAuditDeadline: false
  },
  {
    id: 'ms-dp-03',
    organizationId: 'org-datapulse',
    title: 'External ISO 27001:2022 Stage 1 Readiness Audit',
    category: 'audit_deadline',
    targetDate: '2027-02-15',
    status: 'upcoming',
    description: 'Documentation and scope readiness evaluation by accredited registrar for enterprise data platform.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'ISO 27001 Stage 1',
    deliverables: ['Stage 1 Desktop Audit Report'],
    isAuditDeadline: true,
    auditorBody: 'Schellman & Company'
  },
  {
    id: 'ms-dp-04',
    organizationId: 'org-datapulse',
    title: 'External ISO 27001:2022 Stage 2 Certification Audit',
    category: 'audit_deadline',
    targetDate: '2027-04-10',
    status: 'upcoming',
    description: 'Comprehensive operational testing of data platform controls and encryption keys.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'ISO 27001 Certification',
    deliverables: ['ISO/IEC 27001:2022 Accredited Certificate'],
    isAuditDeadline: true,
    auditorBody: 'Schellman & Company'
  },

  // FinVault Payments
  {
    id: 'ms-fv-01',
    organizationId: 'org-finvault',
    title: 'Payment Data Encryption & Key Management Audit',
    category: 'technical_verification',
    targetDate: '2026-10-18',
    completedDate: '2026-10-18',
    status: 'completed',
    description: 'Verification of KMS hardware security module (HSM) customer keys and TLS 1.3 endpoints.',
    owner: 'Sarah Jenkins (VP Eng)',
    frameworkRef: 'ISO 27001 A.8.24 / NIST PR.DS',
    deliverables: ['Key Hierarchy Architecture Diagram', 'Cryptographic Proof Hash'],
    isAuditDeadline: false
  },
  {
    id: 'ms-fv-02',
    organizationId: 'org-finvault',
    title: 'Multi-Tenant Cloud Boundary Separation Review',
    category: 'internal_milestone',
    targetDate: '2026-11-28',
    status: 'in_progress',
    description: 'Row-level security audit and cross-tenant isolation testing across API banking endpoints.',
    owner: 'Sarah Jenkins (VP Eng)',
    frameworkRef: 'ISO 27001 A.8.9',
    deliverables: ['Cross-Tenant Pen Test Report'],
    isAuditDeadline: false
  },
  {
    id: 'ms-fv-03',
    organizationId: 'org-finvault',
    title: 'ISO 27001 & SOC 2 Dual Stage 1 Assessment',
    category: 'audit_deadline',
    targetDate: '2027-01-18',
    status: 'upcoming',
    description: 'Integrated Stage 1 assessment combining ISO 27001:2022 documentation with SOC 2 Trust Services Criteria.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'Dual Framework Stage 1',
    deliverables: ['Stage 1 Readiness Memorandum'],
    isAuditDeadline: true,
    auditorBody: 'A-LIGN Compliance Body'
  },
  {
    id: 'ms-fv-04',
    organizationId: 'org-finvault',
    title: 'ISO 27001 & SOC 2 Dual Stage 2 Final Audit',
    category: 'audit_deadline',
    targetDate: '2027-03-12',
    status: 'upcoming',
    description: 'On-site and cloud infrastructure verification for ISO 27001 certification and SOC 2 Type II attestation.',
    owner: 'Marcus Vance, CISSP (vCISO)',
    frameworkRef: 'Dual Framework Stage 2',
    deliverables: ['ISO 27001 Certificate & SOC 2 Type II Report'],
    isAuditDeadline: true,
    auditorBody: 'A-LIGN Compliance Body'
  }
];
