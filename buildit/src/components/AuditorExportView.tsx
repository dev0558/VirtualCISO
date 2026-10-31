import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Hash,
  Eye,
  Check,
  Building2,
  ExternalLink
} from 'lucide-react';
import {
  ComplianceControl,
  AutomatedCheck,
  Organization,
  Policy
} from '../types/compliance';

interface AuditorExportViewProps {
  organization: Organization;
  controls: ComplianceControl[];
  checks: AutomatedCheck[];
  policies: Policy[];
  isoScore: number;
  nistScore: number;
}

export const AuditorExportView: React.FC<AuditorExportViewProps> = ({
  organization,
  controls,
  checks,
  policies,
  isoScore,
  nistScore
}) => {
  const [selectedFramework, setSelectedFramework] = useState<'all' | 'ISO 27001:2022' | 'NIST CSF 2.0'>('all');

  const filteredControls = controls.filter((ctrl) => {
    if (selectedFramework === 'all') return true;
    return ctrl.framework === selectedFramework;
  });

  const passedControlsCount = filteredControls.filter((c) => c.status === 'passed').length;

  const handleDownloadCSV = () => {
    window.location.href = `/api/tenants/${organization.id}/export/csv`;
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Auditor Read-Only Notice Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">Auditor Read-Only Mode</span>
              <span aria-hidden="true">·</span>
              <span>Independent Third-Party Verification</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Auditor Compliance Dossier & Evidence Export
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Cryptographically hashed evidence trails for ISO/IEC 27001:2022 Annex A and NIST CSF 2.0 categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Export</span>
          </button>
          <button
            onClick={handlePrintDossier}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Evidence Dossier</span>
          </button>
        </div>
      </div>

      {/* Framework Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filter Framework:</span>
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedFramework('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedFramework === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Frameworks ({controls.length})
            </button>
            <button
              onClick={() => setSelectedFramework('ISO 27001:2022')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedFramework === 'ISO 27001:2022' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ISO 27001:2022
            </button>
            <button
              onClick={() => setSelectedFramework('NIST CSF 2.0')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedFramework === 'NIST CSF 2.0' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NIST CSF 2.0
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800 tabular-nums">{filteredControls.length}</strong> controls ·{' '}
          <span className="text-emerald-700 font-semibold tabular-nums">{passedControlsCount} Passed</span>
        </div>
      </div>

      {/* Printable Auditor Dossier */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8 shadow-xs print:p-0 print:border-none">
        
        {/* Cover / Attestation Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Independent Auditor Compliance Verification Package</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {organization.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Industry: <span className="text-slate-800 font-medium">{organization.industry}</span> · Scope: {organization.cloudProviders.join(', ')}
            </p>
          </div>

          <div className="text-right text-xs text-slate-600">
            <span className="block font-semibold text-slate-900">Report Reference: AUD-2026-HB01</span>
            <span className="block text-slate-500">Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="block text-slate-500">vCISO: {organization.vcisoLead}</span>
          </div>
        </div>

        {/* Readiness Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">ISO 27001:2022 Readiness</span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">{isoScore}%</div>
            <span className="text-[10px] text-slate-500">Annex A technical subset</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">NIST CSF 2.0 Category Fit</span>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">{nistScore}%</div>
            <span className="text-[10px] text-slate-500">6 core functions evaluated</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Technical Checks Pass Rate</span>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-0.5">
              {checks.filter((c) => c.status === 'passed').length} / {checks.length}
            </div>
            <span className="text-[10px] text-slate-500">Automated continuous checks</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Approved Security Policies</span>
            <div className="text-2xl font-extrabold text-indigo-600 tabular-nums mt-0.5">
              {policies.filter((p) => p.status === 'approved').length} / {policies.length}
            </div>
            <span className="text-[10px] text-slate-500">Formally governed</span>
          </div>
        </div>

        {/* Control-by-Control Audit Evidence Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Control Verification Ledger & SHA-256 Hashes
            </h3>
            <span className="text-xs text-slate-500">Tamper-evident verification trail</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Framework</th>
                  <th className="py-2.5 px-3">Control Code</th>
                  <th className="py-2.5 px-3">Title & Mandate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Applicable Checks</th>
                  <th className="py-2.5 px-3">SHA-256 Evidence Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredControls.map((ctrl) => {
                  const mappedChecks = checks.filter((c) => ctrl.applicableChecks.includes(c.code));
                  const isPassed = ctrl.status === 'passed';
                  return (
                    <tr key={ctrl.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {ctrl.framework}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {ctrl.code}
                      </td>
                      <td className="py-2.5 px-3 max-w-sm">
                        <div className="font-semibold text-slate-900">{ctrl.title}</div>
                        <div className="text-slate-500 text-[11px] truncate">{ctrl.description}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isPassed ? (
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Action Needed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {ctrl.applicableChecks.join(', ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {mappedChecks[0]?.latestEvidenceHash ? (
                          <span title={mappedChecks[0]?.latestEvidenceHash}>
                            {mappedChecks[0]?.latestEvidenceHash.substring(0, 20)}...
                          </span>
                        ) : (
                          'Policy Evidence'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formal Attestation Signature Section */}
        <div className="border-t border-slate-200 pt-8 mt-8">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">
            Compliance Attestation & Formal Sign-Off
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-semibold text-slate-500 block">Virtual CISO / Compliance Lead</span>
              <div className="h-10 border-b border-dashed border-slate-300 flex items-end">
                <span className="font-serif italic text-base text-slate-800">Marcus Vance, CISSP</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Security Governance Lead</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-semibold text-slate-500 block">External Lead Auditor (Read-Only)</span>
              <div className="h-10 border-b border-dashed border-slate-300 flex items-end">
                <span className="font-serif italic text-base text-slate-400">Independent Reviewer</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Date: ____________________</span>
                <span>Stage 1 Assessment Body</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
