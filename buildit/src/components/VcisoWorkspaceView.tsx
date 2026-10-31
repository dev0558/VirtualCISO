import React, { useState } from 'react';
import {
  ShieldAlert,
  Calendar,
  FileText,
  Users,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  TrendingUp,
  RefreshCw,
  Building2,
  ArrowRight,
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';
import {
  RiskEntry,
  RoadmapTask,
  LeadershipReport,
  Organization,
  UserRole,
  ComplianceMilestone
} from '../types/compliance';
import { ComplianceTimeline } from './ComplianceTimeline';
import { RiskHeatmap } from './RiskHeatmap';

interface VcisoWorkspaceViewProps {
  organization: Organization;
  allOrganizations: Organization[];
  activeOrgId: string;
  onSelectOrg: (id: string) => void;
  risks: RiskEntry[];
  roadmap: RoadmapTask[];
  leadershipReport: LeadershipReport;
  milestones: ComplianceMilestone[];
  onUpdateMilestoneStatus: (milestoneId: string, status: string) => Promise<void>;
  onAddMilestone: (milestoneData: any) => Promise<void>;
  onAddRisk: (riskData: any) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: string) => Promise<void>;
  onAddTask: (taskData: any) => Promise<void>;
  onGenerateReportAI: (quarter: string) => Promise<void>;
  onApproveReport: (notes: string) => Promise<void>;
  isAuditor: boolean;
  activeRole: UserRole;
  isoScore: number;
  nistScore: number;
  activeSubTab?: 'risks' | 'roadmap' | 'timeline' | 'report' | 'multiclient';
  onChangeSubTab?: (subTab: 'risks' | 'roadmap' | 'timeline' | 'report' | 'multiclient') => void;
}

export const VcisoWorkspaceView: React.FC<VcisoWorkspaceViewProps> = ({
  organization,
  allOrganizations,
  activeOrgId,
  onSelectOrg,
  risks,
  roadmap,
  leadershipReport,
  milestones,
  onUpdateMilestoneStatus,
  onAddMilestone,
  onAddRisk,
  onUpdateTaskStatus,
  onAddTask,
  onGenerateReportAI,
  onApproveReport,
  isAuditor,
  activeRole,
  isoScore,
  nistScore,
  activeSubTab: activeSubTabProp,
  onChangeSubTab
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'risks' | 'roadmap' | 'timeline' | 'report' | 'multiclient'>('risks');
  const activeSubTab = activeSubTabProp || internalSubTab;
  const setActiveSubTab = (tab: 'risks' | 'roadmap' | 'timeline' | 'report' | 'multiclient') => {
    setInternalSubTab(tab);
    if (onChangeSubTab) onChangeSubTab(tab);
  };
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isApprovingReport, setIsApprovingReport] = useState(false);
  const [reportQuarter, setReportQuarter] = useState('Q4 2026');
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedRiskBandFilter, setSelectedRiskBandFilter] = useState<string | null>(null);

  // New Risk Form State
  const [newRiskTitle, setNewRiskTitle] = useState('');
  const [newRiskCategory, setNewRiskCategory] = useState<any>('Privileged Access');
  const [newRiskDescription, setNewRiskDescription] = useState('');
  const [newRiskLikelihood, setNewRiskLikelihood] = useState(3);
  const [newRiskImpact, setNewRiskImpact] = useState(4);
  const [newRiskTreatment, setNewRiskTreatment] = useState<any>('Mitigate');
  const [newRiskPlan, setNewRiskPlan] = useState('');

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPhase, setNewTaskPhase] = useState<any>('Sprint 1 (Days 1-30)');
  const [newTaskPriority, setNewTaskPriority] = useState<any>('P1');
  const [newTaskOwner, setNewTaskOwner] = useState(organization.primaryContact);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskTitle) return;
    await onAddRisk({
      title: newRiskTitle,
      category: newRiskCategory,
      description: newRiskDescription,
      likelihood: newRiskLikelihood,
      impact: newRiskImpact,
      treatment: newRiskTreatment,
      treatmentPlan: newRiskPlan
    });
    setShowAddRiskModal(false);
    setNewRiskTitle('');
    setNewRiskDescription('');
    setNewRiskPlan('');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    await onAddTask({
      title: newTaskTitle,
      phase: newTaskPhase,
      priority: newTaskPriority,
      owner: newTaskOwner,
      dueDate: newTaskDueDate
    });
    setShowAddTaskModal(false);
    setNewTaskTitle('');
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await onGenerateReportAI(reportQuarter);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleApproveReport = async () => {
    setIsApprovingReport(true);
    try {
      await onApproveReport('Approved by vCISO executive review.');
    } finally {
      setIsApprovingReport(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredRisks = risks.filter((r) => {
    if (selectedRiskBandFilter === 'Critical') return r.riskScore >= 15;
    if (selectedRiskBandFilter === 'High') return r.riskScore >= 10 && r.riskScore < 15;
    if (selectedRiskBandFilter === 'Medium') return r.riskScore >= 5 && r.riskScore < 10;
    if (selectedRiskBandFilter === 'Low') return r.riskScore < 5;
    if (selectedRiskId) return r.id === selectedRiskId;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Workspace Header & Subtabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Security Leadership Workspace</span>
            <span aria-hidden="true">·</span>
            <span>vCISO: {organization.vcisoLead}</span>
            <span aria-hidden="true">·</span>
            <span>Strategic Advisory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Virtual CISO Workspace
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Risk register, 90-day prioritized remediation roadmap, AI quarterly executive reports, and multi-client fleet oversight.
          </p>
        </div>

        {/* Subtab Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('risks')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'risks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Risk Register ({risks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('roadmap')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'roadmap' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90-Day Roadmap ({roadmap.length})
          </button>
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'timeline' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Timeline ({milestones.length})
          </button>
          <button
            onClick={() => setActiveSubTab('report')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'report' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leadership Report
          </button>
          <button
            onClick={() => setActiveSubTab('multiclient')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'multiclient' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Multi-Client View
          </button>
        </div>
      </div>

      {/* SUBTAB 1: RISK REGISTER */}
      {activeSubTab === 'risks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Organizational Risk Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantified by Likelihood (1-5) × Impact (1-5). High risks automatically seed the 90-day remediation roadmap.
              </p>
            </div>
            {!isAuditor && (
              <button
                onClick={() => setShowAddRiskModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Risk</span>
              </button>
            )}
          </div>

          {/* Visual 5x5 Risk Heatmap Matrix */}
          <RiskHeatmap
            risks={risks}
            selectedRiskId={selectedRiskId}
            onSelectRisk={setSelectedRiskId}
            selectedCategoryFilter={selectedRiskBandFilter}
            onFilterCategory={setSelectedRiskBandFilter}
          />

          {/* Risks Table Header & Filter Bar */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Risk Treatment Ledger ({filteredRisks.length} of {risks.length} items)
              </h3>
              {selectedRiskBandFilter && (
                <p className="text-xs text-indigo-700 font-medium">
                  Filtered by <strong>{selectedRiskBandFilter}</strong> risk band. Click band or clear to reset.
                </p>
              )}
            </div>

            {(selectedRiskBandFilter || selectedRiskId) && (
              <button
                onClick={() => {
                  setSelectedRiskBandFilter(null);
                  setSelectedRiskId(null);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                Clear Table Filters
              </button>
            )}
          </div>

          {/* Risks Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-3 px-4">Risk Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Likelihood</th>
                    <th className="py-3 px-4 text-center">Impact</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4">Treatment Plan</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRisks.map((r) => {
                    const isHigh = r.riskScore >= 12;
                    const isMedium = r.riskScore >= 6 && r.riskScore < 12;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3 px-4 max-w-xs font-medium text-slate-900">
                          <div>{r.title}</div>
                          <div className="text-slate-500 text-[11px] truncate mt-0.5">{r.description}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {r.category}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">
                          {r.likelihood}/5
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">
                          {r.impact}/5
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded tabular-nums ${
                              r.status === 'Treated'
                                ? 'bg-emerald-50 text-emerald-700'
                                : isHigh
                                ? 'bg-rose-50 text-rose-700'
                                : isMedium
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.riskScore}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{r.treatment}:</span> {r.treatmentPlan}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {r.owner}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-semibold text-[11px] px-2 py-0.5 rounded border ${
                              r.status === 'Treated'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : r.status === 'In Progress'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: 90-DAY ROADMAP */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">90-Day Prioritized Remediation Roadmap</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organized into 3 monthly sprints targeting critical blockers, core policy controls, and operational audit readiness.
              </p>
            </div>
            {!isAuditor && (
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          {/* Sprints Grouping */}
          {(['Sprint 1 (Days 1-30)', 'Sprint 2 (Days 31-60)', 'Sprint 3 (Days 61-90)'] as const).map((sprintName, idx) => {
            const sprintTasks = roadmap.filter((t) => t.phase === sprintName);
            const sprintGoal =
              idx === 0
                ? 'Goal: Remediate critical failing cloud checks (Admins count, Device Trust, Stale Guests)'
                : idx === 1
                ? 'Goal: Policy formalization, disaster recovery simulated failover, and IR tree testing'
                : 'Goal: Mock ISO 27001 Stage 1 walkthrough and operationalized quarterly access reviews';

            return (
              <div key={sprintName} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sprintName}</h3>
                    <p className="text-xs text-slate-500">{sprintGoal}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 tabular-nums">
                    {sprintTasks.filter((t) => t.status === 'completed').length} of {sprintTasks.length} Done
                  </span>
                </div>

                <div className="space-y-2">
                  {sprintTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isDone ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            disabled={isAuditor}
                            onClick={() =>
                              onUpdateTaskStatus(task.id, isDone ? 'todo' : 'completed')
                            }
                            className={`p-1 rounded-md mt-0.5 transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 text-transparent hover:border-indigo-500'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  task.priority === 'P1'
                                    ? 'bg-rose-100 text-rose-800'
                                    : task.priority === 'P2'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                              <h4
                                className={`text-xs font-bold ${
                                  isDone ? 'text-slate-500 line-through' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 self-end md:self-auto">
                          <span>Owner: <strong className="text-slate-700">{task.owner}</strong></span>
                          <span>Due: <strong className="text-slate-700 font-mono tabular-nums">{task.dueDate}</strong></span>
                          {!isAuditor && (
                            <select
                              value={task.status}
                              onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                              className="bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 rounded-md px-2 py-1 cursor-pointer focus:outline-none"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB: AUDIT TIMELINE */}
      {activeSubTab === 'timeline' && (
        <ComplianceTimeline
          organization={organization}
          milestones={milestones}
          onUpdateMilestoneStatus={onUpdateMilestoneStatus}
          onAddMilestone={onAddMilestone}
          isAuditor={isAuditor}
          activeRole={activeRole}
        />
      )}

      {/* SUBTAB 3: LEADERSHIP REPORT */}
      {activeSubTab === 'report' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>Executive Governance</span>
                <span aria-hidden="true">·</span>
                <span>Quarterly Board Deliverable</span>
                <span aria-hidden="true">·</span>
                <span>{leadershipReport.quarter}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Quarterly vCISO Leadership Report
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                AI-synthesized from continuous cloud evidence, framework readiness scores, and active roadmap sprint progress.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrintReport}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>

              {!isAuditor && (
                <>
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isGeneratingReport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-draft with AI</span>
                      </>
                    )}
                  </button>

                  {leadershipReport.status !== 'approved' && (
                    <button
                      onClick={handleApproveReport}
                      disabled={isApprovingReport}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Finalize</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Printable Leadership Report Dossier */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6 shadow-xs print:p-0 print:border-none">
            
            {/* Header Lockup */}
            <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-indigo-700 tracking-wider">
                  Quarterly Security & Compliance Brief
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {organization.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prepared by: <span className="font-semibold text-slate-800">{leadershipReport.vCISOAuthor}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{leadershipReport.quarter}</span>
                <span className="block text-xs text-slate-500">
                  Generated {new Date(leadershipReport.generatedAt).toLocaleDateString()}
                </span>
                <span
                  className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    leadershipReport.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {leadershipReport.status === 'approved' ? 'Approved by vCISO' : 'Draft - Review Pending'}
                </span>
              </div>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-medium">ISO 27001 Readiness</span>
                <div className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {leadershipReport.compliancePosture.isoScore}%
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">NIST CSF Alignment</span>
                <div className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {leadershipReport.compliancePosture.nistScore}%
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Verified Checks</span>
                <div className="text-2xl font-bold text-emerald-600 tabular-nums mt-0.5">
                  {leadershipReport.compliancePosture.passingChecks} / {leadershipReport.compliancePosture.totalChecks}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Open Technical Gaps</span>
                <div className="text-2xl font-bold text-rose-600 tabular-nums mt-0.5">
                  {leadershipReport.compliancePosture.criticalGaps}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Executive Summary & Posture Trajectory
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                {leadershipReport.executiveSummary}
              </p>
            </div>

            {/* Key Achievements & Milestones */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Key Security Milestones Achieved This Quarter
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {leadershipReport.quarterlyMilestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Failing Controls & Risks */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                3. Priority Remediation Targets (Sprint 1)
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {leadershipReport.topRisksSummary.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 90-Day Plan */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                4. Strategic 90-Day Horizon
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {leadershipReport.next90DaysPlan.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* vCISO Closing Assessment */}
            <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-1">
              <h4 className="text-xs font-bold text-indigo-950">vCISO Assessment & Next Steps</h4>
              <p className="text-xs text-indigo-900 italic">"{leadershipReport.vCISONotes}"</p>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 4: MULTI-CLIENT VIEW */}
      {activeSubTab === 'multiclient' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">vCISO Multi-Client Portfolio</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage all client organizations from a centralized dashboard. Compare posture, monitor open risks, and switch active tenant context.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {allOrganizations.length} Active Client Engagements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allOrganizations.map((client) => {
              const isActive = client.id === activeOrgId;
              return (
                <div
                  key={client.id}
                  className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-all ${
                    isActive ? 'border-indigo-600 ring-2 ring-indigo-50 shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">{client.industry}</span>
                      {isActive && (
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Active Context
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-1">{client.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contact: {client.primaryContact}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">ISO 27001</span>
                        <span className="text-base font-bold text-slate-900 tabular-nums">
                          {isActive ? `${isoScore}%` : '80%'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">NIST CSF</span>
                        <span className="text-base font-bold text-slate-900 tabular-nums">
                          {isActive ? `${nistScore}%` : '85%'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Connected Stacks:</span>
                        <span className="font-medium text-slate-800">{client.cloudProviders.length} Connectors</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">vCISO Lead:</span>
                        <span className="font-medium text-slate-800">{client.vcisoLead.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => onSelectOrg(client.id)}
                      className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-slate-100 text-slate-800 cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                      }`}
                    >
                      <span>{isActive ? 'Current Active Client' : 'Switch to this Client'}</span>
                      {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Risk Modal */}
      {showAddRiskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add New Organizational Risk</h3>
              <button
                onClick={() => setShowAddRiskModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Risk Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unencrypted developer laptops / Ransomware exposure"
                  value={newRiskTitle}
                  onChange={(e) => setNewRiskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Category</label>
                  <select
                    value={newRiskCategory}
                    onChange={(e) => setNewRiskCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Privileged Access">Privileged Access</option>
                    <option value="Access & Identity">Access & Identity</option>
                    <option value="Infrastructure & Data">Infrastructure & Data</option>
                    <option value="Governance & Third-Party">Governance & Third-Party</option>
                    <option value="Operational Continuity">Operational Continuity</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Treatment</label>
                  <select
                    value={newRiskTreatment}
                    onChange={(e) => setNewRiskTreatment(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Mitigate">Mitigate</option>
                    <option value="Accept">Accept</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Avoid">Avoid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Likelihood (1 to 5): <span className="font-mono">{newRiskLikelihood}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newRiskLikelihood}
                    onChange={(e) => setNewRiskLikelihood(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Impact (1 to 5): <span className="font-mono">{newRiskImpact}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newRiskImpact}
                    onChange={(e) => setNewRiskImpact(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain the technical scenario and potential impact..."
                  value={newRiskDescription}
                  onChange={(e) => setNewRiskDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Treatment Plan</label>
                <textarea
                  rows={2}
                  placeholder="Action items to remediate or monitor..."
                  value={newRiskPlan}
                  onChange={(e) => setNewRiskPlan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddRiskModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Save to Risk Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add 90-Day Roadmap Task</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct annual CREST penetration testing"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Sprint Phase</label>
                  <select
                    value={newTaskPhase}
                    onChange={(e) => setNewTaskPhase(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Sprint 1 (Days 1-30)">Sprint 1 (Days 1-30)</option>
                    <option value="Sprint 2 (Days 31-60)">Sprint 2 (Days 31-60)</option>
                    <option value="Sprint 3 (Days 61-90)">Sprint 3 (Days 61-90)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="P1">P1 (Critical Blocker)</option>
                    <option value="P2">P2 (Core Control)</option>
                    <option value="P3">P3 (Maturity)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Owner</label>
                  <input
                    type="text"
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Add to Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
