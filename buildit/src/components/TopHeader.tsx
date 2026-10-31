import React from 'react';
import {
  Play,
  RefreshCw,
  ScrollText,
  Search,
  Command,
  Download,
  AlertCircle,
  FileCheck2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Organization, UserRole } from '../types/compliance';

interface TopHeaderProps {
  organization: Organization;
  activeRole: UserRole;
  activeTab: string;
  activeSubTab?: string;
  onRunChecks: () => void;
  isRunningChecks: boolean;
  onOpenAuditLogs: () => void;
  onOpenCommandPalette: () => void;
  onNavigateTab: (tab: string, subTab?: string) => void;
  failingChecksCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  organization,
  activeRole,
  activeTab,
  activeSubTab,
  onRunChecks,
  isRunningChecks,
  onOpenAuditLogs,
  onOpenCommandPalette,
  onNavigateTab,
  failingChecksCount
}) => {
  const getSectionAndTabName = () => {
    switch (activeTab) {
      case 'overview':
        return { section: 'Continuous Compliance', view: 'Dashboard & Posture' };
      case 'checks':
        return { section: 'Continuous Compliance', view: 'Automated Controls & Checks' };
      case 'policies':
        return { section: 'Continuous Compliance', view: 'Policies & Governance' };
      case 'questionnaires':
        return { section: 'Continuous Compliance', view: 'Vendor Due Diligence (DDQ)' };
      case 'vciso':
        if (activeSubTab === 'risks') return { section: 'vCISO Advisory', view: 'Risk Heatmap & Register' };
        if (activeSubTab === 'roadmap') return { section: 'vCISO Advisory', view: '90-Day Remediation Roadmap' };
        if (activeSubTab === 'report') return { section: 'vCISO Advisory', view: 'Executive Leadership AI Report' };
        if (activeSubTab === 'multiclient') return { section: 'vCISO Advisory', view: 'Multi-Tenant Fleet' };
        return { section: 'vCISO Advisory', view: 'Security Leadership Workspace' };
      case 'auditor':
        return { section: 'Audit & Attestation', view: 'Auditor Export & Dossier' };
      default:
        return { section: 'Platform', view: activeTab };
    }
  };

  const { section, view } = getSectionAndTabName();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 h-14 flex items-center justify-between px-6 shrink-0">
      {/* Zone 1: Contextual Breadcrumb Trail */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs min-w-0">
        <span className="font-semibold text-slate-800 whitespace-nowrap truncate max-w-[160px] md:max-w-[220px]">
          {organization.name}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
          {section}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
        <span className="font-medium text-slate-900 whitespace-nowrap">
          {view}
        </span>
      </nav>

      {/* Zone 2: Search Command Palette Trigger */}
      <div className="hidden md:flex items-center mx-4 max-w-sm w-full">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors text-left"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search controls, checks, policies, risks...</span>
          </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded font-mono text-[10px] shrink-0 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Primary Action & Operations */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Audit Log Trigger */}
        <button
          onClick={onOpenAuditLogs}
          title="View Immutable Audit Trail"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <ScrollText className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">Audit Trail</span>
        </button>

        {/* Auditor Export Quick Action */}
        {activeTab !== 'auditor' && (
          <button
            onClick={() => onNavigateTab('auditor')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Auditor Dossier</span>
          </button>
        )}

        {/* Primary Action Button: Run Automated Checks */}
        {activeRole !== 'auditor' && (
          <button
            onClick={onRunChecks}
            disabled={isRunningChecks}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            {isRunningChecks ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Evaluating 28 Checks...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                <span>Run 28 Checks</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
