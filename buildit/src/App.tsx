import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { CommandPalette } from './components/CommandPalette';
import { DashboardOverview } from './components/DashboardOverview';
import { ControlsAndChecksView } from './components/ControlsAndChecksView';
import { PoliciesView } from './components/PoliciesView';
import { QuestionnaireView } from './components/QuestionnaireView';
import { VcisoWorkspaceView } from './components/VcisoWorkspaceView';
import { AuditorExportView } from './components/AuditorExportView';
import { AuditLogDrawer } from './components/AuditLogDrawer';
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
} from './types/compliance';
import {
  fetchTenants,
  fetchTenantState,
  runAutomatedChecks,
  remediateCheck,
  approvePolicy,
  updatePolicyContent,
  generatePolicyWithAI,
  autofillQuestionnaireWithAI,
  approveQuestionnaireItem,
  generateLeadershipReportWithAI,
  approveLeadershipReport,
  addRisk,
  updateTaskStatus,
  addRoadmapTask,
  updateMilestoneStatus,
  addMilestone
} from './utils/api';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>('org-healthbridge');
  const [activeRole, setActiveRole] = useState<UserRole>('client_admin');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeSubTab, setActiveSubTab] = useState<'risks' | 'roadmap' | 'timeline' | 'report' | 'multiclient'>('risks');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Tenant state data
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [checks, setChecks] = useState<AutomatedCheck[]>([]);
  const [evidenceStore, setEvidenceStore] = useState<EvidenceRecord[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [questionnaire, setQuestionnaire] = useState<SecurityQuestionnaire | null>(null);
  const [risks, setRisks] = useState<RiskEntry[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapTask[]>([]);
  const [leadershipReport, setLeadershipReport] = useState<LeadershipReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [milestones, setMilestones] = useState<ComplianceMilestone[]>([]);
  const [scores, setScores] = useState({
    isoScore: 82,
    nistScore: 88,
    isoPassed: 10,
    isoTotal: 12,
    nistPassed: 7,
    nistTotal: 8
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<AutomatedCheck | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load organizations on startup
  useEffect(() => {
    async function loadInitial() {
      try {
        const tenantsRes = await fetchTenants();
        if (tenantsRes.tenants) {
          const orgs = tenantsRes.tenants.map((t: any) => t.organization);
          setOrganizations(orgs);
          if (orgs.length > 0 && !activeOrgId) {
            setActiveOrgId(orgs[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load tenants:', err);
      }
    }
    loadInitial();
  }, []);

  // Load tenant specific data whenever activeOrgId changes
  useEffect(() => {
    async function loadTenantData() {
      if (!activeOrgId) return;
      setIsLoading(true);
      try {
        const data = await fetchTenantState(activeOrgId);
        setControls(data.controls || []);
        setChecks(data.checks || []);
        setEvidenceStore(data.evidenceStore || []);
        setPolicies(data.policies || []);
        setQuestionnaire(data.questionnaire || null);
        setRisks(data.risks || []);
        setRoadmap(data.roadmap || []);
        setLeadershipReport(data.leadershipReport || null);
        setAuditLogs(data.auditLogs || []);
        setMilestones(data.milestones || []);
        if (data.scores) setScores(data.scores);
      } catch (err) {
        console.error('Failed to load tenant state:', err);
        showToast('Error loading tenant data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadTenantData();
  }, [activeOrgId]);

  // Handler: Run automated checks
  const handleRunChecks = async () => {
    setIsRunningChecks(true);
    try {
      const res = await runAutomatedChecks(activeOrgId, activeRole === 'vciso' ? 'Marcus Vance (vCISO)' : 'Elena Rostova (CTO)', activeRole);
      if (res.checks) setChecks(res.checks);
      if (res.scores) setScores(res.scores);
      // Reload fresh tenant state to pick up new evidence records and audit entries
      const fresh = await fetchTenantState(activeOrgId);
      setEvidenceStore(fresh.evidenceStore || []);
      setAuditLogs(fresh.auditLogs || []);
      showToast(res.message || 'Automated checks completed. Hashes verified.');
    } catch (err) {
      console.error(err);
      showToast('Failed to run checks', 'error');
    } finally {
      setIsRunningChecks(false);
    }
  };

  // Handler: Remediate check
  const handleRemediateCheck = async (checkId: string) => {
    try {
      const res = await remediateCheck(activeOrgId, checkId, activeRole === 'vciso' ? 'Marcus Vance (vCISO)' : 'Elena Rostova (CTO)', activeRole);
      showToast(res.message);
      // Refresh state
      const fresh = await fetchTenantState(activeOrgId);
      setChecks(fresh.checks || []);
      setControls(fresh.controls || []);
      setScores(fresh.scores || scores);
      setEvidenceStore(fresh.evidenceStore || []);
      setAuditLogs(fresh.auditLogs || []);
      setRoadmap(fresh.roadmap || []);
      setRisks(fresh.risks || []);
      if (selectedCheck && (selectedCheck.id === checkId || selectedCheck.code === checkId)) {
        const updated = (fresh.checks || []).find((c: AutomatedCheck) => c.id === checkId || c.code === checkId);
        if (updated) setSelectedCheck(updated);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to remediate check', 'error');
    }
  };

  // Handler: Approve Policy
  const handleApprovePolicy = async (policyId: string) => {
    try {
      const res = await approvePolicy(activeOrgId, policyId, 'Elena Rostova (CTO)', activeRole);
      showToast(`Policy ${res.policy.code} v${res.policy.version} approved.`);
      const fresh = await fetchTenantState(activeOrgId);
      setPolicies(fresh.policies || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to approve policy', 'error');
    }
  };

  // Handler: Update Policy Content
  const handleUpdatePolicy = async (policyId: string, content: string) => {
    try {
      await updatePolicyContent(activeOrgId, policyId, content, 'Marcus Vance (vCISO)', activeRole);
      showToast('Policy updated. Status set to Under Review.');
      const fresh = await fetchTenantState(activeOrgId);
      setPolicies(fresh.policies || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to save policy', 'error');
    }
  };

  // Handler: Generate Policy with AI
  const handleGeneratePolicyAI = async (policyType: string, notes: string) => {
    try {
      showToast('Drafting policy with Gemini AI...', 'info');
      const res = await generatePolicyWithAI(activeOrgId, policyType, { notes }, 'Marcus Vance (vCISO)');
      showToast(res.message || 'Policy drafted successfully.');
      const fresh = await fetchTenantState(activeOrgId);
      setPolicies(fresh.policies || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate policy with AI', 'error');
    }
  };

  // Handler: AI Autofill Questionnaire
  const handleAutofillQuestionnaire = async () => {
    try {
      showToast('Analyzing evidence and synthesizing answers with citations...', 'info');
      const res = await autofillQuestionnaireWithAI(activeOrgId, 'Marcus Vance (vCISO)');
      showToast(res.message || 'Questionnaire autofilled with citations.');
      const fresh = await fetchTenantState(activeOrgId);
      setQuestionnaire(fresh.questionnaire || null);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to autofill questionnaire', 'error');
    }
  };

  // Handler: Approve Questionnaire Answer
  const handleApproveQuestionnaireItem = async (itemId: string, notes: string) => {
    try {
      await approveQuestionnaireItem(activeOrgId, itemId, notes, 'Elena Rostova (CTO)', activeRole);
      showToast('Question answer verified and approved.');
      const fresh = await fetchTenantState(activeOrgId);
      setQuestionnaire(fresh.questionnaire || null);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to approve answer', 'error');
    }
  };

  // Handler: Add Risk
  const handleAddRisk = async (riskData: any) => {
    try {
      await addRisk(activeOrgId, riskData, 'Marcus Vance (vCISO)');
      showToast('New risk logged in tenant register.');
      const fresh = await fetchTenantState(activeOrgId);
      setRisks(fresh.risks || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to add risk', 'error');
    }
  };

  // Handler: Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await updateTaskStatus(activeOrgId, taskId, status, 'Elena Rostova (CTO)');
      showToast(`Task status updated to ${status}.`);
      const fresh = await fetchTenantState(activeOrgId);
      setRoadmap(fresh.roadmap || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to update task', 'error');
    }
  };

  // Handler: Add Roadmap Task
  const handleAddRoadmapTask = async (taskData: any) => {
    try {
      await addRoadmapTask(activeOrgId, taskData, 'Marcus Vance (vCISO)');
      showToast('Task added to 90-day roadmap.');
      const fresh = await fetchTenantState(activeOrgId);
      setRoadmap(fresh.roadmap || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to add task', 'error');
    }
  };

  // Handler: AI Leadership Report
  const handleGenerateReportAI = async (quarter: string) => {
    try {
      showToast('Drafting executive leadership report with Gemini AI...', 'info');
      const res = await generateLeadershipReportWithAI(activeOrgId, quarter, 'Marcus Vance (vCISO)');
      showToast('Quarterly report generated.');
      setLeadershipReport(res.report);
      const fresh = await fetchTenantState(activeOrgId);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate report', 'error');
    }
  };

  // Handler: Approve Leadership Report
  const handleApproveReport = async (notes: string) => {
    try {
      await approveLeadershipReport(activeOrgId, 'Marcus Vance (vCISO)', notes);
      showToast('Leadership report approved and finalized.');
      const fresh = await fetchTenantState(activeOrgId);
      setLeadershipReport(fresh.leadershipReport || null);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to approve report', 'error');
    }
  };

  // Handler: Update Milestone Status
  const handleUpdateMilestoneStatus = async (milestoneId: string, status: string) => {
    try {
      await updateMilestoneStatus(
        activeOrgId,
        milestoneId,
        status,
        activeRole === 'vciso' ? 'Marcus Vance (vCISO)' : 'Elena Rostova (CTO)',
        activeRole
      );
      showToast(`Milestone status updated to ${status}.`);
      const fresh = await fetchTenantState(activeOrgId);
      setMilestones(fresh.milestones || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to update milestone status', 'error');
    }
  };

  // Handler: Add Milestone
  const handleAddMilestone = async (milestoneData: any) => {
    try {
      await addMilestone(activeOrgId, milestoneData, 'Marcus Vance (vCISO)');
      showToast('New deadline added to compliance timeline.');
      const fresh = await fetchTenantState(activeOrgId);
      setMilestones(fresh.milestones || []);
      setAuditLogs(fresh.auditLogs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to add milestone', 'error');
    }
  };

  const currentOrg = organizations.find((o) => o.id === activeOrgId) || {
    id: 'org-healthbridge',
    name: 'HealthBridge Technologies',
    industry: 'Healthcare SaaS & Telehealth',
    employeeCount: 52,
    cloudProviders: ['Microsoft 365 / Entra ID', 'GitHub Enterprise'],
    primaryContact: 'elena.rostova@healthbridge.io',
    vcisoLead: 'Marcus Vance, CISSP, CISA',
    targetFrameworks: ['ISO/IEC 27001:2022', 'NIST CSF 2.0']
  };

  // Global shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const failingChecksCount = checks.filter((c) => c.status === 'failed').length;
  const isAuditor = activeRole === 'auditor';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Enterprise Left Navigation Sidebar */}
      <Sidebar
        organizations={organizations}
        activeOrgId={activeOrgId}
        onSelectOrg={(id) => {
          setActiveOrgId(id);
          showToast(`Switched active context to ${organizations.find(o => o.id === id)?.name || id}`, 'info');
        }}
        activeRole={activeRole}
        onSelectRole={(r) => {
          setActiveRole(r);
          showToast(`Switched active role to ${r.replace('_', ' ')}`, 'info');
        }}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onSelectTab={(tab, subTab) => {
          setActiveTab(tab);
          if (subTab) setActiveSubTab(subTab as any);
        }}
        failingChecksCount={failingChecksCount}
        onOpenAuditLogs={() => setIsAuditDrawerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Contextual Top Bar Contract */}
        <TopHeader
          organization={currentOrg}
          activeRole={activeRole}
          activeTab={activeTab}
          activeSubTab={activeSubTab}
          onRunChecks={handleRunChecks}
          isRunningChecks={isRunningChecks}
          onOpenAuditLogs={() => setIsAuditDrawerOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onNavigateTab={(tab, subTab) => {
            setActiveTab(tab);
            if (subTab) setActiveSubTab(subTab as any);
          }}
          failingChecksCount={failingChecksCount}
        />

        {/* Auditor Read-Only Notice Bar */}
        {isAuditor && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-6 text-center text-xs text-amber-900 font-medium">
            <strong>Auditor Mode Active:</strong> System is in read-only verification mode with direct access to cryptographic evidence trails and exportable dossier records.
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading organization compliance context...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <DashboardOverview
                  organization={currentOrg}
                  scores={scores}
                  controls={controls}
                  checks={checks}
                  evidenceStore={evidenceStore}
                  milestones={milestones}
                  onUpdateMilestoneStatus={handleUpdateMilestoneStatus}
                  onAddMilestone={handleAddMilestone}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                  }}
                  onInspectCheck={(chk) => {
                    setSelectedCheck(chk);
                    setActiveTab('checks');
                  }}
                  onRemediateCheck={handleRemediateCheck}
                  onRunChecks={handleRunChecks}
                  isRunningChecks={isRunningChecks}
                  isAuditor={isAuditor}
                  activeRole={activeRole}
                />
              )}

              {activeTab === 'checks' && (
                <ControlsAndChecksView
                  checks={checks}
                  controls={controls}
                  evidenceStore={evidenceStore}
                  onRemediateCheck={handleRemediateCheck}
                  onRunChecks={handleRunChecks}
                  isRunningChecks={isRunningChecks}
                  isAuditor={isAuditor}
                  selectedCheck={selectedCheck}
                  setSelectedCheck={setSelectedCheck}
                />
              )}

              {activeTab === 'policies' && (
                <PoliciesView
                  policies={policies}
                  onApprovePolicy={handleApprovePolicy}
                  onUpdatePolicy={handleUpdatePolicy}
                  onGeneratePolicyAI={handleGeneratePolicyAI}
                  activeRole={activeRole}
                  isAuditor={isAuditor}
                />
              )}

              {activeTab === 'questionnaires' && questionnaire && (
                <QuestionnaireView
                  questionnaire={questionnaire}
                  onAutofillAI={handleAutofillQuestionnaire}
                  onApproveItem={handleApproveQuestionnaireItem}
                  isAuditor={isAuditor}
                  activeRole={activeRole}
                />
              )}

              {activeTab === 'vciso' && leadershipReport && (
                <VcisoWorkspaceView
                  organization={currentOrg}
                  allOrganizations={organizations}
                  activeOrgId={activeOrgId}
                  onSelectOrg={(id) => setActiveOrgId(id)}
                  risks={risks}
                  roadmap={roadmap}
                  leadershipReport={leadershipReport}
                  milestones={milestones}
                  onUpdateMilestoneStatus={handleUpdateMilestoneStatus}
                  onAddMilestone={handleAddMilestone}
                  onAddRisk={handleAddRisk}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onAddTask={handleAddRoadmapTask}
                  onGenerateReportAI={handleGenerateReportAI}
                  onApproveReport={handleApproveReport}
                  isAuditor={isAuditor}
                  activeRole={activeRole}
                  isoScore={scores.isoScore}
                  nistScore={scores.nistScore}
                  activeSubTab={activeSubTab}
                  onChangeSubTab={setActiveSubTab}
                />
              )}

              {activeTab === 'auditor' && (
                <AuditorExportView
                  organization={currentOrg}
                  controls={controls}
                  checks={checks}
                  policies={policies}
                  isoScore={scores.isoScore}
                  nistScore={scores.nistScore}
                />
              )}
            </>
          )}
        </main>

        {/* Quiet Enterprise Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-3.5 px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SecuraVantage</span>
            <span aria-hidden="true">·</span>
            <span>Continuous ISO 27001 & NIST CSF 2.0 Automation</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>Active Tenant: {currentOrg.name}</span>
            <span aria-hidden="true">·</span>
            <span>SHA-256 Engine Verified</span>
          </div>
        </footer>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        checks={checks}
        policies={policies}
        risks={risks}
        onSelectCheck={(chk) => {
          setSelectedCheck(chk);
          setActiveTab('checks');
        }}
        onNavigateTab={(tab, subTab) => {
          setActiveTab(tab);
          if (subTab) setActiveSubTab(subTab as any);
        }}
        onRunChecks={handleRunChecks}
        activeRole={activeRole}
      />

      {/* Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        auditLogs={auditLogs}
        organizationName={currentOrg.name}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-3 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
