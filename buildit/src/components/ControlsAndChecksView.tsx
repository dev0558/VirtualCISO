import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Search,
  Filter,
  Code,
  Copy,
  Check,
  Wrench,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  X
} from 'lucide-react';
import { AutomatedCheck, ComplianceControl, EvidenceRecord } from '../types/compliance';

interface ControlsAndChecksViewProps {
  checks: AutomatedCheck[];
  controls: ComplianceControl[];
  evidenceStore: EvidenceRecord[];
  onRemediateCheck: (checkId: string) => void;
  onRunChecks: () => void;
  isRunningChecks: boolean;
  isAuditor: boolean;
  selectedCheck: AutomatedCheck | null;
  setSelectedCheck: (check: AutomatedCheck | null) => void;
}

export const ControlsAndChecksView: React.FC<ControlsAndChecksViewProps> = ({
  checks,
  controls,
  evidenceStore,
  onRemediateCheck,
  onRunChecks,
  isRunningChecks,
  isAuditor,
  selectedCheck,
  setSelectedCheck
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<'all' | 'ISO 27001' | 'NIST CSF'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [selectedConnector, setSelectedConnector] = useState<'all' | 'm365' | 'google_workspace' | 'github'>('all');
  const [copiedHash, setCopiedHash] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);

  // Filter checks
  const filteredChecks = checks.filter((chk) => {
    // Search query
    const matchesSearch =
      chk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chk.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chk.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Framework
    let matchesFramework = true;
    if (selectedFramework === 'ISO 27001') {
      matchesFramework = chk.mappedControlCodes.some((code) => code.startsWith('A.'));
    } else if (selectedFramework === 'NIST CSF') {
      matchesFramework = chk.mappedControlCodes.some((code) => !code.startsWith('A.'));
    }

    // Status
    const matchesStatus = selectedStatus === 'all' || chk.status === selectedStatus;

    // Connector
    const matchesConnector = selectedConnector === 'all' || chk.connector === selectedConnector;

    return matchesSearch && matchesFramework && matchesStatus && matchesConnector;
  });

  const passingCount = checks.filter((c) => c.status === 'passed').length;
  const failingCount = checks.filter((c) => c.status === 'failed').length;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRemediate = async (checkId: string) => {
    setIsRemediating(true);
    await onRemediateCheck(checkId);
    setIsRemediating(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Run Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Continuous Compliance Engine</span>
            <span aria-hidden="true">·</span>
            <span>28 Automated Checks</span>
            <span aria-hidden="true">·</span>
            <span>Read-Only API Scopes</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Automated Checks & Framework Controls
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Technical checks run against Microsoft 365, Google Workspace, and GitHub to generate verifiable SHA-256 evidence.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800">
              <span className="text-emerald-600 tabular-nums">{passingCount} Passed</span>
              <span className="mx-1 text-slate-400">/</span>
              <span className="text-rose-600 tabular-nums">{failingCount} Failing</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {Math.round((passingCount / checks.length) * 100)}% Passing Rate
            </span>
          </div>

          {!isAuditor && (
            <button
              onClick={onRunChecks}
              disabled={isRunningChecks}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isRunningChecks ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating 28 Checks...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Check Engine</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search checks, codes, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Framework tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedFramework('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedFramework === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Frameworks
            </button>
            <button
              onClick={() => setSelectedFramework('ISO 27001')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedFramework === 'ISO 27001' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ISO 27001
            </button>
            <button
              onClick={() => setSelectedFramework('NIST CSF')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedFramework === 'NIST CSF' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NIST CSF
            </button>
          </div>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="passed">Passing Only</option>
            <option value="failed">Failing Only</option>
          </select>

          {/* Connector selector */}
          <select
            value={selectedConnector}
            onChange={(e) => setSelectedConnector(e.target.value as any)}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Connectors</option>
            <option value="m365">Microsoft 365</option>
            <option value="google_workspace">Google Workspace</option>
            <option value="github">GitHub</option>
          </select>
        </div>
      </div>

      {/* Checks Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Check Title & Description</th>
                <th className="py-3 px-4">Connector</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Mapped Controls</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No checks found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredChecks.map((chk) => {
                  const isPassed = chk.status === 'passed';
                  return (
                    <tr
                      key={chk.id}
                      onClick={() => setSelectedCheck(chk)}
                      className={`hover:bg-slate-50/75 transition-colors cursor-pointer ${
                        selectedCheck?.id === chk.id ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {chk.code}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-slate-900">{chk.name}</div>
                        <div className="text-slate-500 truncate mt-0.5">{chk.description}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize whitespace-nowrap">
                        {chk.connector.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold capitalize ${
                            chk.severity === 'critical'
                              ? 'text-rose-600'
                              : chk.severity === 'high'
                              ? 'text-orange-600'
                              : chk.severity === 'medium'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {chk.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {chk.mappedControlCodes.join(', ')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPassed ? (
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold inline-flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Failing</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCheck(chk);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          Inspect Evidence
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence & Remediation Modal / Drawer */}
      {selectedCheck && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-mono font-bold text-slate-700">{selectedCheck.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{selectedCheck.connector.replace('_', ' ')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold capitalize text-slate-700">{selectedCheck.severity} Severity</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCheck.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCheck(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Status and Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Current Evaluation:</span>
                  {selectedCheck.status === 'passed' ? (
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Passing (Baseline Verified)</span>
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Non-Compliant (Remediation Required)</span>
                    </span>
                  )}
                </div>
                <div className="text-slate-500 tabular-nums">
                  Last evaluated: {new Date(selectedCheck.lastRunAt).toLocaleString()}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Evaluation Logic</h4>
                <p className="text-slate-600 leading-relaxed">{selectedCheck.description}</p>
              </div>

              {/* Mapped Framework Controls */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-1.5">Mapped Framework Controls</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCheck.mappedControlCodes.map((code) => {
                    const ctrl = controls.find((c) => c.code === code);
                    return (
                      <div
                        key={code}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 max-w-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-800">{code}</span>
                          <span className="text-[10px] text-slate-500">{ctrl?.framework || 'Framework'}</span>
                        </div>
                        <div className="font-medium text-slate-900 mt-1">{ctrl?.title || code}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{ctrl?.category}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plain-Language Fix Guidance */}
              <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Plain-Language Remediation Guidance</span>
                </h4>
                <p className="text-indigo-900 leading-relaxed">{selectedCheck.remediationGuidance}</p>
              </div>

              {/* SHA-256 Hash */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-slate-900">Cryptographic Evidence Hash (SHA-256)</h4>
                  <button
                    onClick={() => handleCopyHash(selectedCheck.latestEvidenceHash)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Hash</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all">
                  {selectedCheck.latestEvidenceHash}
                </div>
              </div>

              {/* Raw Sanitized API Response JSON */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sanitized Connector API Payload (Secrets Redacted)</span>
                </h4>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedCheck.rawResponseSummary, null, 2)}
                </pre>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Auditable evidence automatically committed to tamper-evident store
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCheck(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                >
                  Close
                </button>
                {!isAuditor && selectedCheck.status === 'failed' && (
                  <button
                    onClick={() => handleRemediate(selectedCheck.id)}
                    disabled={isRemediating}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isRemediating ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Verifying Fix...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simulate Fix & Re-evaluate</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
