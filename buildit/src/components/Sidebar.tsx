import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  CheckSquare,
  FileText,
  ClipboardList,
  Flame,
  Calendar,
  FileBarChart,
  Building2,
  Download,
  ScrollText,
  ChevronDown,
  UserCheck,
  Shield,
  Layers,
  ChevronRight,
  LogOut,
  Sparkles,
  Command
} from 'lucide-react';
import { Organization, UserRole } from '../types/compliance';

interface SidebarProps {
  organizations: Organization[];
  activeOrgId: string;
  onSelectOrg: (id: string) => void;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string, subTab?: string) => void;
  failingChecksCount: number;
  onOpenAuditLogs: () => void;
  onOpenCommandPalette: () => void;
  activeSubTab?: string;
}

interface NavItem {
  id: string;
  subTab?: string;
  label: string;
  icon: any;
  badge?: string;
  badgeType?: 'danger';
  action?: () => void;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  organizations,
  activeOrgId,
  onSelectOrg,
  activeRole,
  onSelectRole,
  activeTab,
  onSelectTab,
  failingChecksCount,
  onOpenAuditLogs,
  onOpenCommandPalette,
  activeSubTab
}) => {
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const currentOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0] || {
    id: 'org-healthbridge',
    name: 'HealthBridge Technologies',
    industry: 'Healthcare SaaS & Telehealth',
    employeeCount: 52,
    cloudProviders: [],
    primaryContact: 'elena.rostova@healthbridge.io',
    vcisoLead: 'Marcus Vance, CISSP',
    targetFrameworks: ['ISO/IEC 27001:2022', 'NIST CSF 2.0']
  };

  const navSections: NavSection[] = [
    {
      group: 'CONTINUOUS COMPLIANCE',
      items: [
        { id: 'overview', label: 'Overview & Scorecard', icon: LayoutDashboard },
        {
          id: 'checks',
          label: 'Automated Controls & Checks',
          icon: CheckSquare,
          badge: failingChecksCount > 0 ? `${failingChecksCount} failing` : undefined,
          badgeType: 'danger' as const
        },
        { id: 'policies', label: 'Policies & Governance', icon: FileText },
        { id: 'questionnaires', label: 'Vendor Due Diligence (DDQ)', icon: ClipboardList }
      ]
    },
    {
      group: 'VCISO ADVISORY',
      items: [
        { id: 'vciso', subTab: 'risks', label: 'Risk Heatmap & Register', icon: Flame },
        { id: 'vciso', subTab: 'roadmap', label: '90-Day Remediation', icon: Calendar },
        { id: 'vciso', subTab: 'report', label: 'Executive AI Report', icon: FileBarChart },
        { id: 'vciso', subTab: 'multiclient', label: 'Multi-Tenant Fleet', icon: Building2 }
      ]
    },
    {
      group: 'AUDIT & ATTESTATION',
      items: [
        { id: 'auditor', label: 'Auditor Export & Dossier', icon: Download },
        { id: 'audit-logs', label: 'Immutable Audit Trail', icon: ScrollText, action: onOpenAuditLogs }
      ]
    }
  ];

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'client_admin':
        return 'Client Admin';
      case 'vciso':
        return 'vCISO Lead';
      case 'auditor':
        return 'Auditor (Read-Only)';
    }
  };

  const getUserName = (role: UserRole) => {
    switch (role) {
      case 'client_admin':
        return 'Elena Rostova (CTO)';
      case 'vciso':
        return 'Marcus Vance, CISSP';
      case 'auditor':
        return 'KPMG Audit Lead';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand & Platform Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-tight">
              SecuraVantage
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Continuous Compliance OS
            </div>
          </div>
        </div>
      </div>

      {/* Organization Switcher Dropdown */}
      <div className="p-3 border-b border-slate-800/80 relative">
        <button
          onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left"
        >
          <div className="min-w-0 pr-2">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Active Tenant
            </div>
            <div className="text-xs font-semibold text-white truncate mt-0.5">
              {currentOrg.name}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {isOrgDropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-700/50">
            {organizations.map((org) => {
              const isSelected = org.id === activeOrgId;
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    onSelectOrg(org.id);
                    setIsOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-indigo-600/20 text-white font-medium' : 'text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-semibold">{org.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{org.industry}</div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Search Shortcut */}
      <div className="px-3 pt-3">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          <span className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span>Quick search...</span>
          </span>
          <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.group}>
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isSubTab = item.subTab !== undefined;
                const isActive = isSubTab
                  ? activeTab === 'vciso' && activeSubTab === item.subTab
                  : activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={`${item.id}-${item.subTab || ''}`}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        onSelectTab(item.id, item.subTab);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role Switcher & User Card Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 relative">
        <button
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
              {activeRole === 'client_admin' ? 'ER' : activeRole === 'vciso' ? 'MV' : 'AU'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {getUserName(activeRole)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1.5">
                <span>{getRoleDisplayName(activeRole)}</span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {isRoleDropdownOpen && (
          <div className="absolute left-3 right-3 bottom-full mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-700/50">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Switch Access Role
            </div>
            {(['client_admin', 'vciso', 'auditor'] as UserRole[]).map((r) => {
              const isSelected = r === activeRole;
              return (
                <button
                  key={r}
                  onClick={() => {
                    onSelectRole(r);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-indigo-600/20 text-white font-medium' : 'text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{getRoleDisplayName(r)}</div>
                    <div className="text-[10px] text-slate-400">{getUserName(r)}</div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Engine status indicator */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-2 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SHA-256 Ledger Verified</span>
          </span>
          <span className="text-slate-400">28 checks</span>
        </div>
      </div>
    </aside>
  );
};
