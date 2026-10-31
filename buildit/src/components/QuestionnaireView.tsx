import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Search,
  Filter,
  Check,
  Edit2,
  RefreshCw,
  FileSpreadsheet,
  Link2,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SecurityQuestionnaire, QuestionnaireAnswer, UserRole } from '../types/compliance';

interface QuestionnaireViewProps {
  questionnaire: SecurityQuestionnaire;
  onAutofillAI: () => Promise<void>;
  onApproveItem: (itemId: string, notes: string) => Promise<void>;
  isAuditor: boolean;
  activeRole: UserRole;
}

export const QuestionnaireView: React.FC<QuestionnaireViewProps> = ({
  questionnaire,
  onAutofillAI,
  onApproveItem,
  isAuditor,
  activeRole
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needs_review' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(questionnaire.items[0]?.id || null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const items = questionnaire.items;
  const needsReviewItems = items.filter((i) => i.needsReview);
  const approvedItems = items.filter((i) => i.humanApproved);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.suggestedAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterMode === 'needs_review') {
      return matchesSearch && item.needsReview;
    }
    if (filterMode === 'approved') {
      return matchesSearch && item.humanApproved;
    }
    return matchesSearch;
  });

  const handleAutofill = async () => {
    setIsAutofilling(true);
    try {
      await onAutofillAI();
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleApproveAnswer = async (itemId: string) => {
    setApprovingId(itemId);
    try {
      const notes = reviewNotes[itemId] || 'Approved by compliance reviewer.';
      await onApproveItem(itemId, notes);
    } finally {
      setApprovingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Question #', 'Category', 'Customer Security Question', 'Verified Answer', 'Confidence Score', 'Status', 'Cited Sources'];
    const rows = questionnaire.items.map((i) => [
      i.questionNumber,
      `"${i.category}"`,
      `"${i.question.replace(/"/g, '""')}"`,
      `"${i.suggestedAnswer.replace(/"/g, '""')}"`,
      `"${i.confidenceScore}%"`,
      i.humanApproved ? 'APPROVED' : i.needsReview ? 'NEEDS REVIEW' : 'PENDING',
      `"${i.citedSources.map((s) => `${s.name} (${s.reference})`).join('; ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${questionnaire.customerName.replace(/\s+/g, '_')}_Completed_Security_Questionnaire.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Customer Due Diligence</span>
            <span aria-hidden="true">·</span>
            <span>Autofill with Evidence & Citations</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{items.length} Questions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Questionnaire Autofill
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            AI answers vendor security assessments using approved policies and automated check results with explicit source citations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {!isAuditor && (
            <button
              onClick={handleAutofill}
              disabled={isAutofilling}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              {isAutofilling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Answers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Autofill All Questions</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Metrics & Upload Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Questions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{items.length}</div>
          <span className="text-[11px] text-slate-500">SIG Lite / CAIQ Standard</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Human Approved</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{approvedItems.length}</div>
          <span className="text-[11px] text-slate-500">
            {Math.round((approvedItems.length / items.length) * 100)}% Verified
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Flagged for Review</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{needsReviewItems.length}</div>
          <span className="text-[11px] text-slate-500">Confidence &lt; 75% or gap</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Average Confidence</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
            {Math.round(items.reduce((acc, i) => acc + i.confidenceScore, 0) / items.length)}%
          </div>
          <span className="text-[11px] text-slate-500">Backed by Live Evidence</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search questions, categories, answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Questions ({items.length})
          </button>
          <button
            onClick={() => setFilterMode('needs_review')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterMode === 'needs_review' ? 'bg-white text-amber-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Needs Review ({needsReviewItems.length})
          </button>
          <button
            onClick={() => setFilterMode('approved')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterMode === 'approved' ? 'bg-white text-emerald-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedItems.length})
          </button>
        </div>
      </div>

      {/* Questions Accordion / List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isExpanded = expandedItemId === item.id;
          const isHighConfidence = item.confidenceScore >= 85;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border transition-all ${
                item.needsReview
                  ? 'border-amber-200 hover:border-amber-300'
                  : item.humanApproved
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Row Header */}
              <div
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-slate-500 mt-0.5 tabular-nums">
                    Q{item.questionNumber < 10 ? `0${item.questionNumber}` : item.questionNumber}
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {item.question}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Status Indicator */}
                  {item.humanApproved ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Approved</span>
                    </span>
                  ) : item.needsReview ? (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Needs Review</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      Drafted
                    </span>
                  )}

                  {/* Confidence Meter */}
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded ${
                      isHighConfidence
                        ? 'text-emerald-700 bg-emerald-50'
                        : item.confidenceScore >= 75
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}
                  >
                    {item.confidenceScore}% Confidence
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Answer, Citations & Review Form */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs">
                  {/* Answer Box */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Synthesized Customer Answer</h4>
                    <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {item.suggestedAnswer}
                    </p>
                  </div>

                  {/* Cited Sources */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cited Sources & Evidence Grounding</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.citedSources.map((src, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                        >
                          <span className="font-bold text-slate-900 capitalize">{src.type}:</span>{' '}
                          {src.name} <span className="font-mono text-slate-500">({src.reference})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Human Review & Approval Action */}
                  {!isAuditor && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Optional reviewer notes or customer context..."
                          value={reviewNotes[item.id] || item.humanReviewNotes || ''}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [item.id]: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!item.humanApproved ? (
                          <button
                            onClick={() => handleApproveAnswer(item.id)}
                            disabled={approvingId === item.id}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            {approvingId === item.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve Answer</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Signed off by {item.humanReviewNotes ? 'Reviewer' : 'vCISO'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
