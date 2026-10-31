import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HelpCircle,
  Play,
  Download,
  ScrollText,
  Layers,
  ArrowRight,
  X,
  CornerDownLeft,
  Calendar
} from 'lucide-react';
import { AutomatedCheck, Policy, RiskEntry, UserRole } from '../types/compliance';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  checks: AutomatedCheck[];
  policies: Policy[];
  risks: RiskEntry[];
  onSelectCheck: (check: AutomatedCheck) => void;
  onNavigateTab: (tab: string, subTab?: string) => void;
  onRunChecks: () => void;
  activeRole: UserRole;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  checks,
  policies,
  risks,
  onSelectCheck,
  onNavigateTab,
  onRunChecks,
  activeRole
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items
  const q = query.toLowerCase().trim();

  // Navigation actions
  const navActions = [
    { id: 'nav-overview', label: 'Go to Dashboard Overview', tab: 'overview', category: 'Navigation', icon: ShieldCheck },
    { id: 'nav-calendar', label: 'Go to Compliance Calendar (Audits, Policies & Training)', tab: 'overview', category: 'Navigation', icon: Calendar },
    { id: 'nav-checks', label: 'Go to Controls & Automated Checks', tab: 'checks', category: 'Navigation', icon: Layers },
    { id: 'nav-policies', label: 'Go to Policies & Governance', tab: 'policies', category: 'Navigation', icon: FileText },
    { id: 'nav-questionnaires', label: 'Go to Vendor Due Diligence (DDQ)', tab: 'questionnaires', category: 'Navigation', icon: HelpCircle },
    { id: 'nav-risks', label: 'Go to vCISO Risk Heatmap & Register', tab: 'vciso', subTab: 'risks', category: 'Navigation', icon: AlertTriangle },
    { id: 'nav-roadmap', label: 'Go to 90-Day Remediation Roadmap', tab: 'vciso', subTab: 'roadmap', category: 'Navigation', icon: Layers },
    { id: 'nav-report', label: 'Go to Executive Leadership AI Report', tab: 'vciso', subTab: 'report', category: 'Navigation', icon: FileText },
    { id: 'nav-auditor', label: 'Go to Auditor Export & Dossier', tab: 'auditor', category: 'Navigation', icon: Download },
  ].filter(action => !q || action.label.toLowerCase().includes(q) || action.tab.includes(q));

  // Matched checks
  const matchedChecks = checks.filter(
    (c) =>
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.connector.toLowerCase().includes(q)
  ).slice(0, 5);

  // Matched policies
  const matchedPolicies = policies.filter(
    (p) =>
      !q ||
      p.code.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  ).slice(0, 4);

  // Matched risks
  const matchedRisks = risks.filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
  ).slice(0, 4);

  const allItems = [
    ...navActions.map(a => ({ type: 'action' as const, data: a })),
    ...matchedChecks.map(c => ({ type: 'check' as const, data: c })),
    ...matchedPolicies.map(p => ({ type: 'policy' as const, data: p })),
    ...matchedRisks.map(r => ({ type: 'risk' as const, data: r }))
  ];

  const handleSelect = (index: number) => {
    const item = allItems[index];
    if (!item) return;

    if (item.type === 'action') {
      onNavigateTab(item.data.tab, item.data.subTab);
    } else if (item.type === 'check') {
      onSelectCheck(item.data);
      onNavigateTab('checks');
    } else if (item.type === 'policy') {
      onNavigateTab('policies');
    } else if (item.type === 'risk') {
      onNavigateTab('vciso', 'risks');
    }
    onClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search checks, controls, policies, risks, or commands..."
            className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching compliance controls, checks, or policies found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {allItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                if (item.type === 'action') {
                  const Icon = item.data.icon;
                  return (
                    <button
                      key={item.data.id}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/80 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="font-medium text-slate-900">{item.data.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <span>jump</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    </button>
                  );
                }

                if (item.type === 'check') {
                  const chk = item.data;
                  return (
                    <button
                      key={chk.id}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/80 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${chk.status === 'passed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-800">{chk.code}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-medium text-slate-900 truncate">{chk.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {chk.connector} · {chk.mappedControlCodes.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-mono tabular-nums ${chk.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {chk.status === 'passed' ? 'PASS' : 'FAIL'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                }

                if (item.type === 'policy') {
                  const pol = item.data;
                  return (
                    <button
                      key={pol.id}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/80 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-800">{pol.code}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-medium text-slate-900 truncate">{pol.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            v{pol.version} · {pol.status} · {pol.description}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                }

                if (item.type === 'risk') {
                  const r = item.data;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/80 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-800">Score {r.riskScore}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-medium text-slate-900 truncate">{r.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {r.category} · {r.treatment} · {r.status}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-700 shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-700 shadow-2xs">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-700 shadow-2xs">↵</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-700 shadow-2xs">esc</kbd>
              <span>close</span>
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            SecuraVantage Continuous Platform
          </div>
        </div>
      </div>
    </div>
  );
};
