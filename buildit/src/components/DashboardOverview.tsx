import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileText,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Hash,
  Database,
  Cloud,
  GitBranch,
  ShieldAlert,
  Play,
  Calendar as CalendarIcon,
  GitCommit
} from 'lucide-react';
import { Organization, AutomatedCheck, EvidenceRecord, ComplianceControl, ComplianceMilestone, UserRole } from '../types/compliance';
import { ComplianceTimeline } from './ComplianceTimeline';
import { ComplianceTrendChart } from './ComplianceTrendChart';
import { ComplianceCalendar } from './ComplianceCalendar';

interface DashboardOverviewProps {
  organization: Organization;
  scores: {
    isoScore: number;
    nistScore: number;
    isoPassed: number;
    isoTotal: number;
    nistPassed: number;
    nistTotal: number;
  };
  controls: ComplianceControl[];
  checks: AutomatedCheck[];
  evidenceStore: EvidenceRecord[];
  milestones: ComplianceMilestone[];
  onUpdateMilestoneStatus: (milestoneId: string, status: string) => Promise<void>;
  onAddMilestone: (milestoneData: any) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onInspectCheck: (check: AutomatedCheck) => void;
  onRemediateCheck: (checkId: string) => void;
  onRunChecks: () => void;
  isRunningChecks: boolean;
  isAuditor: boolean;
  activeRole: UserRole;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  organization,
  scores,
  controls,
  checks,
  evidenceStore,
  milestones,
  onUpdateMilestoneStatus,
  onAddMilestone,
  onNavigateTab,
  onInspectCheck,
  onRemediateCheck,
  onRunChecks,
  isRunningChecks,
  isAuditor,
  activeRole
}) => {
  const failingChecks = checks.filter((c) => c.status === 'failed');
  const passingChecks = checks.filter((c) => c.status === 'passed');
  const [scheduleTab, setScheduleTab] = useState<'calendar' | 'timeline'>('calendar');

  // NIST Functions mapping
  const nistFunctions = [
    { code: 'GV', label: 'Govern', count: '1/1', percentage: 100 },
    { code: 'ID', label: 'Identify', count: '0/1', percentage: 0 },
    { code: 'PR', label: 'Protect', count: '3/3', percentage: 100 },
    { code: 'DE', label: 'Detect', count: '1/1', percentage: 100 },
    { code: 'RS', label: 'Respond', count: '1/1', percentage: 100 },
    { code: 'RC', label: 'Recover', count: '1/1', percentage: 100 },
  ];

  const connectors = [
    {
      name: 'Microsoft 365 / Entra ID',
      icon: Cloud,
      type: 'm365',
      status: 'Connected (Read-Only)',
      checksCount: 10,
      failing: checks.filter((c) => c.connector === 'm365' && c.status === 'failed').length,
      scopes: ['Directory.Read.All', 'AuditLog.Read.All', 'Policy.Read.All']
    },
    {
      name: 'Google Workspace',
      icon: Database,
      type: 'google_workspace',
      status: 'Connected (Read-Only)',
      checksCount: 9,
      failing: checks.filter((c) => c.connector === 'google_workspace' && c.status === 'failed').length,
      scopes: ['admin.directory.user.readonly', 'reports.audit.readonly']
    },
    {
      name: 'GitHub Enterprise / Cloud',
      icon: GitBranch,
      type: 'github',
      status: 'Connected (Read-Only)',
      checksCount: 9,
      failing: checks.filter((c) => c.connector === 'github' && c.status === 'failed').length,
      scopes: ['repo:status', 'read:org', 'security_events:read']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Compliance Posture Header Strip */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{organization.name}</span>
            <span aria-hidden="true">·</span>
            <span>{organization.industry}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{organization.employeeCount} headcount</span>
            <span aria-hidden="true">·</span>
            <span>Lead: {organization.vcisoLead}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Continuous Compliance & Audit Posture
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically anchored against <strong className="text-slate-700 font-semibold">ISO/IEC 27001:2022</strong> and <strong className="text-slate-700 font-semibold">NIST CSF 2.0</strong> with continuous API evidence collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Stage 1 Readiness</span>
              <span className="font-bold text-slate-800 font-mono tabular-nums">{scores.isoScore}%</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">NIST Alignment</span>
              <span className="font-bold text-slate-800 font-mono tabular-nums">{scores.nistScore}%</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Checks Evaluated</span>
              <span className="font-bold text-emerald-700 font-mono tabular-nums">{passingChecks.length}/{checks.length} passing</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('auditor')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap cursor-pointer"
          >
            Auditor Dossier
          </button>
        </div>
      </div>

      {/* Critical Failing Controls Remediation Banner */}
      {failingChecks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-900">
                  {failingChecks.length} Technical Compliance Checks Require Remediation
                </h2>
                <p className="text-xs text-amber-800 mt-1">
                  Automated cloud checks flagged {failingChecks.length} items that negatively impact ISO 27001 and NIST CSF scores:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {failingChecks.map((chk) => (
                    <button
                      key={chk.id}
                      onClick={() => onInspectCheck(chk)}
                      className="text-left text-xs bg-white text-slate-800 px-3 py-1.5 rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer shadow-xs"
                    >
                      <span className="font-mono text-slate-500 font-semibold">{chk.code}</span>: {chk.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('checks')}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-amber-300 hover:border-amber-400 shadow-xs"
            >
              <span>View All Checks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Compliance Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ISO 27001:2022 Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">International Standard</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">ISO/IEC 27001:2022</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {scores.isoScore}%
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">Readiness Score</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  scores.isoScore >= 90
                    ? 'bg-emerald-600'
                    : scores.isoScore >= 70
                    ? 'bg-indigo-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${scores.isoScore}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span>Annex A Subset Evaluated</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {scores.isoPassed} of {scores.isoTotal} controls verified
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Audit Status: <span className="font-medium text-slate-900">Stage 1 Ready</span>
            </span>
            <button
              onClick={() => onNavigateTab('checks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Controls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* NIST CSF 2.0 Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Cybersecurity Framework</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">NIST CSF 2.0</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {scores.nistScore}%
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">Category Alignment</span>
              </div>
            </div>

            {/* NIST 6 Core Functions */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              {nistFunctions.map((fn) => (
                <div key={fn.code} className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-800 font-mono">{fn.code}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{fn.label}</span>
                  <span
                    className={`block text-[10px] font-semibold mt-1 tabular-nums ${
                      fn.percentage === 100 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {fn.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span>Categories Assessed</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {scores.nistPassed} of {scores.nistTotal} categories compliant
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Coverage: <span className="font-medium text-slate-900">All 6 Functions Mapped</span>
            </span>
            <button
              onClick={() => onNavigateTab('checks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Category Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Historical Trend Line Chart (Last 6 Months using Recharts) */}
      <ComplianceTrendChart
        organization={organization}
        currentIsoScore={scores.isoScore}
        currentNistScore={scores.nistScore}
      />

      {/* Compliance Cadence: Calendar Format vs Roadmap Timeline */}
      <div className="space-y-3">
        {/* View Switcher Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono">
              Audit & Governance Scheduling
            </h3>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-600 font-medium">
              {scheduleTab === 'calendar' ? 'Calendar Format (Upcoming Audits, Policy Reviews & Training)' : 'Milestone Roadmap Timeline'}
            </span>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setScheduleTab('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                scheduleTab === 'calendar'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Compliance Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleTab('timeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                scheduleTab === 'timeline'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Milestone Roadmap</span>
            </button>
          </div>
        </div>

        {scheduleTab === 'calendar' ? (
          <ComplianceCalendar
            organization={organization}
            activeRole={activeRole}
            isAuditor={isAuditor}
            onNavigateTab={onNavigateTab}
          />
        ) : (
          <ComplianceTimeline
            organization={organization}
            milestones={milestones}
            onUpdateMilestoneStatus={onUpdateMilestoneStatus}
            onAddMilestone={onAddMilestone}
            isAuditor={isAuditor}
            activeRole={activeRole}
          />
        )}
      </div>

      {/* Connected Integrations & Quick Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Connected Cloud & SaaS Platforms</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only connectors continuously pull audit evidence without access to raw customer files or secrets.
            </p>
          </div>
          <button
            onClick={onRunChecks}
            disabled={isRunningChecks}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Sync All Connectors</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connectors.map((conn) => {
            const Icon = conn.icon;
            return (
              <div key={conn.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{conn.name}</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Automated Checks:</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{conn.checksCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Failing Checks:</span>
                      <span className={`font-semibold tabular-nums ${conn.failing > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {conn.failing}
                      </span>
                    </div>
                    <div className="pt-2 text-[11px] text-slate-500 font-mono truncate">
                      Scopes: {conn.scopes.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Least-Privilege Scoped</span>
                  <button
                    onClick={() => onNavigateTab('checks')}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View checks
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Evidence Stream & Cryptographic Verification Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Evidence Stream & Integrity Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every automated check creates an immutable evidence record with a SHA-256 hash for auditor verification.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('auditor')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Full Evidence Export</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Check Code</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Connector</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">SHA-256 Hash</th>
                <th className="py-2.5 px-3 text-right">Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evidenceStore.slice(0, 7).map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    {ev.checkCode}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                    {ev.checkName}
                  </td>
                  <td className="py-2.5 px-3 capitalize text-slate-600">
                    {ev.connector.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3">
                    {ev.status === 'passed' ? (
                      <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Failing</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                    <span title={ev.sha256Hash} className="cursor-help">
                      {ev.sha256Hash.substring(0, 16)}...
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
