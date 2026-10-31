import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  Plus,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  Flag,
  Award,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { ComplianceMilestone, Organization, UserRole } from '../types/compliance';

interface ComplianceTimelineProps {
  organization: Organization;
  milestones: ComplianceMilestone[];
  onUpdateMilestoneStatus: (milestoneId: string, status: string) => Promise<void>;
  onAddMilestone: (milestoneData: any) => Promise<void>;
  isAuditor: boolean;
  activeRole: UserRole;
}

export const ComplianceTimeline: React.FC<ComplianceTimelineProps> = ({
  organization,
  milestones,
  onUpdateMilestoneStatus,
  onAddMilestone,
  isAuditor,
  activeRole
}) => {
  const [filterType, setFilterType] = useState<'all' | 'audits_only' | 'pending' | 'completed'>('all');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Add Milestone Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<any>('audit_deadline');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOwner, setFormOwner] = useState(organization.vcisoLead);
  const [formFrameworkRef, setFormFrameworkRef] = useState('ISO/IEC 27001:2022');
  const [formDeliverable, setFormDeliverable] = useState('');
  const [formIsAuditDeadline, setFormIsAuditDeadline] = useState(true);
  const [formAuditorBody, setFormAuditorBody] = useState('BSI Group');

  // Reference current date: Oct 31, 2026
  const CURRENT_DATE = new Date('2026-10-31T00:00:00Z');

  // Calculate days remaining or days ago
  const getDaysDiff = (dateStr: string) => {
    const target = new Date(`${dateStr}T00:00:00Z`);
    const diffTime = target.getTime() - CURRENT_DATE.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Sort milestones chronologically
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  const filteredMilestones = sortedMilestones.filter((m) => {
    if (filterType === 'audits_only') return m.isAuditDeadline;
    if (filterType === 'pending') return m.status === 'in_progress' || m.status === 'upcoming';
    if (filterType === 'completed') return m.status === 'completed';
    return true;
  });

  const nextAuditDeadline = sortedMilestones.find(
    (m) => m.isAuditDeadline && m.status !== 'completed' && getDaysDiff(m.targetDate) >= 0
  );

  const completedCount = sortedMilestones.filter((m) => m.status === 'completed').length;
  const auditDeadlinesCount = sortedMilestones.filter((m) => m.isAuditDeadline).length;

  const handleToggleStatus = async (milestone: ComplianceMilestone) => {
    if (isAuditor) return;
    setIsUpdatingStatus(milestone.id);
    const nextStatus = milestone.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await onUpdateMilestoneStatus(milestone.id, nextStatus);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formTargetDate) return;
    await onAddMilestone({
      title: formTitle,
      category: formCategory,
      targetDate: formTargetDate,
      description: formDescription,
      owner: formOwner,
      frameworkRef: formFrameworkRef,
      deliverables: formDeliverable ? [formDeliverable] : ['Verification Audit Dossier'],
      isAuditDeadline: formIsAuditDeadline,
      auditorBody: formIsAuditDeadline ? formAuditorBody : undefined
    });
    setShowAddModal(false);
    setFormTitle('');
    setFormDescription('');
    setFormDeliverable('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      
      {/* Timeline Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Certification Roadmap</span>
            <span aria-hidden="true">·</span>
            <span>Target Framework: {organization.targetFrameworks.join(' & ')}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{completedCount} of {milestones.length} Milestones Achieved</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Compliance Milestones & Upcoming Audit Deadlines</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Key stage gates, internal validation exercises, and external certification audit deadlines for <strong className="text-slate-800">{organization.name}</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({milestones.length})
            </button>
            <button
              onClick={() => setFilterType('audits_only')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'audits_only' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Deadlines ({auditDeadlinesCount})
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({milestones.length - completedCount})
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'completed' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          {!isAuditor && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Deadline</span>
            </button>
          )}
        </div>
      </div>

      {/* Next Imminent Audit Deadline Spotlight Banner */}
      {nextAuditDeadline && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-900 font-semibold">
                <span>NEXT CRITICAL AUDIT GATEWAY</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{getDaysDiff(nextAuditDeadline.targetDate)} days remaining</span>
                {nextAuditDeadline.auditorBody && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Registrar: {nextAuditDeadline.auditorBody}</span>
                  </>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {nextAuditDeadline.title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {nextAuditDeadline.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <div className="text-right">
              <span className="block text-[11px] text-slate-500 font-medium">Scheduled Target Date</span>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {new Date(nextAuditDeadline.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <button
              onClick={() => setSelectedMilestoneId(nextAuditDeadline.id)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-lg shadow-2xs transition-colors"
            >
              Inspect Scope
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Milestone Tracker Strip */}
      <div className="relative pt-6 pb-4 overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Connector Bar */}
          <div className="absolute top-10 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          {/* Milestone Nodes */}
          <div className="grid grid-cols-6 gap-3 relative z-10">
            {sortedMilestones.slice(0, 6).map((m, index) => {
              const isCompleted = m.status === 'completed';
              const isInProgress = m.status === 'in_progress';
              const isSelected = selectedMilestoneId === m.id;
              const days = getDaysDiff(m.targetDate);

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestoneId(isSelected ? null : m.id)}
                  className={`flex flex-col items-center text-center cursor-pointer group transition-transform ${
                    isSelected ? 'scale-105' : 'hover:-translate-y-0.5'
                  }`}
                >
                  {/* Node Icon Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse'
                        : m.isAuditDeadline
                        ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : m.isAuditDeadline ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <span className="font-mono text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Date & Title */}
                  <span className="font-mono text-[11px] font-semibold text-slate-500 mt-2 tabular-nums">
                    {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span
                    className={`text-xs font-semibold mt-0.5 max-w-[120px] line-clamp-2 leading-tight ${
                      m.isAuditDeadline ? 'text-indigo-950 font-bold' : 'text-slate-800'
                    }`}
                  >
                    {m.title}
                  </span>

                  {/* Relative Badge */}
                  <span
                    className={`text-[10px] mt-1 tabular-nums font-medium ${
                      isCompleted
                        ? 'text-emerald-700'
                        : days < 0
                        ? 'text-rose-600'
                        : days <= 30
                        ? 'text-amber-700 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCompleted
                      ? 'Completed'
                      : days === 0
                      ? 'Today'
                      : days > 0
                      ? `In ${days}d`
                      : `${Math.abs(days)}d ago`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chronological Detailed Timeline Stream */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Milestone Progression Ledger ({filteredMilestones.length})
        </div>

        <div className="space-y-3">
          {filteredMilestones.map((m) => {
            const isCompleted = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';
            const days = getDaysDiff(m.targetDate);
            const isSelected = selectedMilestoneId === m.id;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMilestoneId(isSelected ? null : m.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  m.isAuditDeadline
                    ? isCompleted
                      ? 'border-emerald-200 bg-white hover:border-emerald-300'
                      : 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 shadow-2xs'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  
                  {/* Left: Indicator, Title & Deliverables */}
                  <div className="flex items-start gap-3">
                    <button
                      disabled={isAuditor}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(m);
                      }}
                      className={`p-1.5 rounded-lg mt-0.5 transition-colors cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isInProgress
                          ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                          : 'border border-slate-300 text-transparent hover:border-indigo-500'
                      }`}
                      title={isCompleted ? 'Mark In Progress' : 'Mark Completed'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {m.isAuditDeadline && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>External Audit Deadline</span>
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-500">
                          {m.frameworkRef || 'Governance'}
                        </span>
                        {m.auditorBody && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {m.auditorBody}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-bold mt-1 ${
                          isCompleted ? 'text-slate-600' : 'text-slate-900'
                        }`}
                      >
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>

                      {/* Deliverables tags */}
                      {m.deliverables && m.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.deliverables.map((del, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              Deliverable: {del}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Target Date, Owner & Countdown */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-1 shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                      {new Date(m.targetDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        isCompleted
                          ? 'text-emerald-700'
                          : days <= 30
                          ? 'text-amber-700'
                          : 'text-indigo-700'
                      }`}
                    >
                      {isCompleted
                        ? `Achieved ${m.completedDate ? `on ${m.completedDate}` : ''}`
                        : days === 0
                        ? 'Target deadline today'
                        : days > 0
                        ? `${days} days remaining`
                        : `${Math.abs(days)} days overdue`}
                    </span>

                    <span className="text-[11px] text-slate-500 mt-1">
                      Lead: <strong className="text-slate-700">{m.owner.split(',')[0]}</strong>
                    </span>
                  </div>

                </div>

                {/* Expanded Details Panel */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/80 -mx-4 -mb-4 p-4 rounded-b-xl space-y-3 text-xs text-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Category</span>
                        <strong className="text-slate-800 capitalize">{m.category.replace('_', ' ')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Lead Owner</span>
                        <strong className="text-slate-800">{m.owner}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Auditing Organization</span>
                        <strong className="text-slate-800">{m.auditorBody || 'Internal Governance Committee'}</strong>
                      </div>
                    </div>

                    {!isAuditor && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                        <span className="text-[11px] text-slate-500">
                          Toggle milestone state to record verified progress in the immutable audit log.
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(m);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Mark as In-Progress' : 'Mark Milestone Complete'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Milestone / Audit Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Schedule Compliance Milestone or Audit Date</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Milestone or Audit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ISO 27001 Surveillance Audit Year 1"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Milestone Type</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="audit_deadline">External Audit Deadline</option>
                    <option value="internal_milestone">Internal Milestone / Drill</option>
                    <option value="policy_governance">Policy & Governance Gate</option>
                    <option value="technical_verification">Technical Verification</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="isAudit"
                  checked={formIsAuditDeadline}
                  onChange={(e) => setFormIsAuditDeadline(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isAudit" className="font-semibold text-slate-800 cursor-pointer">
                  Is this an official external certification audit deadline?
                </label>
              </div>

              {formIsAuditDeadline && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Auditing Registrar / Firm</label>
                  <input
                    type="text"
                    placeholder="e.g. BSI Group, Schellman, Coalfire, A-LIGN"
                    value={formAuditorBody}
                    onChange={(e) => setFormAuditorBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Lead Owner</label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Framework Reference</label>
                  <input
                    type="text"
                    value={formFrameworkRef}
                    onChange={(e) => setFormFrameworkRef(e.target.value)}
                    placeholder="e.g. ISO 27001 Clause 9.2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Key Deliverable</label>
                <input
                  type="text"
                  placeholder="e.g. Formal Certificate of Registration / Attestation"
                  value={formDeliverable}
                  onChange={(e) => setFormDeliverable(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Scope & Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline audit scope, requirements, or objectives..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Save Deadline to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
