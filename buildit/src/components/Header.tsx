import React from 'react';
import { ShieldCheck, Play, RefreshCw, ScrollText, Building2, UserCog, Eye } from 'lucide-react';
import { Organization, UserRole } from '../types/compliance';

interface HeaderProps {
  organizations: Organization[];
  activeOrgId: string;
  onSelectOrg: (id: string) => void;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onRunChecks: () => void;
  isRunningChecks: boolean;
  onOpenAuditLogs: () => void;
  failingChecksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  organizations,
  activeOrgId,
  onSelectOrg,
  activeRole,
  onSelectRole,
  activeTab,
  onSelectTab,
  onRunChecks,
  isRunningChecks,
  onOpenAuditLogs,
  failingChecksCount
}) => {
  const currentOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'checks', label: 'Controls & Checks' },
    { id: 'policies', label: 'Policies' },
    { id: 'questionnaires', label: 'Questionnaires' },
    { id: 'vciso', label: 'vCISO Workspace' },
    { id: 'auditor', label: 'Auditor Export' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single element Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-semibold">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <button
              onClick={() => onSelectTab('overview')}
              className="text-left cursor-pointer group"
            >
              <div className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                SecuraVantage
              </div>
              <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                AI Compliance & vCISO
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 text-sm font-medium ${
                    isActive
                      ? 'text-indigo-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                  {link.id === 'checks' && failingChecksCount > 0 && (
                    <span className="ml-1.5 text-xs text-rose-600 font-semibold tabular-nums">
                      ({failingChecksCount})
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Tenant / Role controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Tenant Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={activeOrgId}
                onChange={(e) => onSelectOrg(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 pr-2 py-0.5 focus:outline-none cursor-pointer"
                title="Switch Organization (Multi-Tenant Context)"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <UserCog className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={activeRole}
                onChange={(e) => onSelectRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-medium text-slate-800 pr-2 py-0.5 focus:outline-none cursor-pointer"
                title="Current User Role"
              >
                <option value="client_admin">Client Admin</option>
                <option value="vciso">vCISO Expert</option>
                <option value="auditor">Auditor (Read-Only)</option>
              </select>
            </div>

            {/* Audit Log Trigger */}
            <button
              onClick={onOpenAuditLogs}
              title="View Immutable Audit Log"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <ScrollText className="w-4 h-4" />
            </button>

            {/* Primary Action Button */}
            {activeRole !== 'auditor' ? (
              <button
                onClick={onRunChecks}
                disabled={isRunningChecks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg transition-all shadow-sm disabled:opacity-50 whitespace-nowrap"
              >
                {isRunningChecks ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Checks...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Checks</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Auditor Mode</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
