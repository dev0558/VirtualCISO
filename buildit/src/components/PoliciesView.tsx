import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  Edit3,
  ShieldCheck,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  FileCheck2,
  Send
} from 'lucide-react';
import { Policy, UserRole } from '../types/compliance';

interface PoliciesViewProps {
  policies: Policy[];
  onApprovePolicy: (policyId: string) => Promise<void>;
  onUpdatePolicy: (policyId: string, content: string) => Promise<void>;
  onGeneratePolicyAI: (policyType: string, notes: string) => Promise<void>;
  activeRole: UserRole;
  isAuditor: boolean;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  onApprovePolicy,
  onUpdatePolicy,
  onGeneratePolicyAI,
  activeRole,
  isAuditor
}) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [aiPolicyType, setAiPolicyType] = useState('Access Control Policy');
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  const handleStartEdit = () => {
    if (selectedPolicy) {
      setEditedContent(selectedPolicy.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedPolicy) {
      await onUpdatePolicy(selectedPolicy.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPolicy) return;
    setIsApproving(true);
    try {
      await onApprovePolicy(selectedPolicy.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePolicyAI(aiPolicyType, aiCustomNotes);
      setShowAIGeneratorModal(false);
      setAiCustomNotes('');
    } finally {
      setIsGenerating(false);
    }
  };

  const corePolicyTypes = [
    'Information Security Policy',
    'Access Control Policy',
    'Incident Response Plan',
    'Backup & Disaster Recovery Policy',
    'Acceptable Use Policy'
  ];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Governance & Policy Catalog</span>
            <span aria-hidden="true">·</span>
            <span>5 Core Compliance Documents</span>
            <span aria-hidden="true">·</span>
            <span>Mandatory Human Approval</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Policies & Governance
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            AI-drafted, vCISO-vetted policies with version tracking, executive approvals, and ISO/NIST control cross-references.
          </p>
        </div>

        {!isAuditor && (
          <button
            onClick={() => setShowAIGeneratorModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Policy with AI</span>
          </button>
        )}
      </div>

      {/* Main Grid: Policy List (Left) + Document Viewer / Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 5 Policies List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-500 px-1">
            Core Policy Catalog ({policies.length})
          </div>

          {policies.map((pol) => {
            const isSelected = selectedPolicy?.id === pol.id;
            const isApproved = pol.status === 'approved';
            return (
              <div
                key={pol.id}
                onClick={() => {
                  setSelectedPolicyId(pol.id);
                  setIsEditing(false);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700">{pol.code}</span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      isApproved
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : pol.status === 'under_review'
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}
                  >
                    {pol.status === 'approved' ? 'Approved' : pol.status === 'under_review' ? 'Under Review' : 'Draft'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-1">{pol.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{pol.description}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="tabular-nums">Version {pol.version}</span>
                  <span>{pol.approver ? `Approved by ${pol.approver.split(' ')[0]}` : 'Pending Approval'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Policy Document Viewer / Editor */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {selectedPolicy ? (
            <div>
              {/* Document Header Bar */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-mono font-bold text-slate-700">{selectedPolicy.code}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">v{selectedPolicy.version}</span>
                    <span aria-hidden="true">·</span>
                    <span>Last modified: {new Date(selectedPolicy.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedPolicy.title}</h2>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                      >
                        Save Draft
                      </button>
                    </>
                  ) : (
                    <>
                      {!isAuditor && (
                        <button
                          onClick={handleStartEdit}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      {!isAuditor && selectedPolicy.status !== 'approved' && (
                        <button
                          onClick={handleApprove}
                          disabled={isApproving}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isApproving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Executive Approve</span>
                            </>
                          )}
                        </button>
                      )}

                      {selectedPolicy.status === 'approved' && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved & Enforced</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Status Notice if Draft */}
              {selectedPolicy.status === 'draft' && (
                <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    This policy is currently in <strong className="font-semibold">Draft</strong> mode. A Client Admin or vCISO must complete human review before marking it approved for external audits.
                  </span>
                </div>
              )}

              {/* Document Content View / Editor */}
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Edit Markdown Source
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={22}
                      className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 flex flex-wrap gap-4">
                      <div>
                        <strong className="text-slate-800">Author:</strong> {selectedPolicy.author}
                      </div>
                      {selectedPolicy.approver && (
                        <div>
                          <strong className="text-slate-800">Approver:</strong> {selectedPolicy.approver}
                        </div>
                      )}
                      <div>
                        <strong className="text-slate-800">Mapped Controls:</strong>{' '}
                        <span className="font-mono text-indigo-700">{selectedPolicy.mappedControls.join(', ')}</span>
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-slate-800 space-y-3">
                      {selectedPolicy.content}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              Select a policy to view and edit.
            </div>
          )}
        </div>

      </div>

      {/* AI Policy Generator Modal */}
      {showAIGeneratorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>AI Policy Drafter (Gemini)</span>
              </div>
              <button
                onClick={() => setShowAIGeneratorModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-slate-600">
                Generate an audit-ready compliance policy drafted specifically for your company using live cloud connector findings, ISO 27001:2022 clauses, and NIST CSF 2.0 categories.
              </p>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Select Policy Type
                </label>
                <select
                  value={aiPolicyType}
                  onChange={(e) => setAiPolicyType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {corePolicyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Custom Organizational Context or Requirements (Optional)
                </label>
                <textarea
                  value={aiCustomNotes}
                  onChange={(e) => setAiCustomNotes(e.target.value)}
                  placeholder="e.g. Include specific restrictions on AI chatbot usage, require FIDO2 hardware tokens for engineers, RTO 2 hours..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900">
                <strong>Guardrails Enforced:</strong> Generation retrieves only from your organization's approved data and active connectors. The policy will be saved in <strong>Draft</strong> status and will not be finalized without human approval.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAIGeneratorModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Draft Policy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
