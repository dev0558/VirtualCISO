import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  GraduationCap,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  Plus,
  Filter,
  Download,
  ExternalLink,
  X,
  Building,
  Flag,
  Sparkles,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { ComplianceCalendarEvent, CalendarEventCategory, CalendarEventRecurrence, Organization, UserRole } from '../types/compliance';
import { SEED_CALENDAR_EVENTS } from '../data/calendarSeedData';
import { downloadIcsFile, getGoogleCalendarLink } from '../utils/calendarExport';

interface ComplianceCalendarProps {
  organization: Organization;
  activeRole: UserRole;
  isAuditor: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({
  organization,
  activeRole,
  isAuditor,
  onNavigateTab
}) => {
  // Current Simulation Anchor: Oct 31, 2026
  const SIMULATION_TODAY = '2026-10-31';
  const TODAY_DATE = new Date('2026-10-31T00:00:00Z');

  // Calendar events state (initialized with seed events for the organization)
  const [events, setEvents] = useState<ComplianceCalendarEvent[]>(() => {
    // Return seed events filtered or mapped for this org
    return SEED_CALENDAR_EVENTS.map(ev => ({
      ...ev,
      organizationId: organization.id
    }));
  });

  // Calendar View Mode: Month Grid vs Agenda List
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Calendar navigation state: default to November 2026 (the active upcoming month following Oct 31, 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 0-indexed: 10 = November

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | CalendarEventCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ComplianceCalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-11-18');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for adding an event
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CalendarEventCategory>('audit');
  const [formDate, setFormDate] = useState('2026-11-25');
  const [formTime, setFormTime] = useState('10:00 AM EST');
  const [formOwner, setFormOwner] = useState(organization.vcisoLead);
  const [formRecurrence, setFormRecurrence] = useState<CalendarEventRecurrence>('Quarterly');
  const [formFrameworkRef, setFormFrameworkRef] = useState('ISO/IEC 27001:2022');
  const [formAuditorBody, setFormAuditorBody] = useState('BSI Group');
  const [formDescription, setFormDescription] = useState('');

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // October
    setSelectedDate(SIMULATION_TODAY);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days difference calculation relative to simulation anchor (Oct 31, 2026)
  const getDaysDiff = (dateStr: string) => {
    const target = new Date(`${dateStr}T00:00:00Z`);
    const diffTime = target.getTime() - TODAY_DATE.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesOwner = ev.owner.toLowerCase().includes(q);
        const matchesFw = ev.frameworkRef?.toLowerCase().includes(q) || false;
        const matchesDesc = ev.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOwner && !matchesFw && !matchesDesc) return false;
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  // Calendar grid construction for currentYear & currentMonth
  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: ComplianceCalendarEvent[];
    }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === SIMULATION_TODAY,
        events: filteredEvents.filter(ev => ev.date === dateStr)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === SIMULATION_TODAY,
        events: filteredEvents.filter(ev => ev.date === dateStr)
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingDays = totalCells - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === SIMULATION_TODAY,
        events: filteredEvents.filter(ev => ev.date === dateStr)
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredEvents]);

  // Counts for Category Badges
  const counts = useMemo(() => {
    return {
      all: events.length,
      audit: events.filter(e => e.category === 'audit').length,
      policy_review: events.filter(e => e.category === 'policy_review').length,
      training: events.filter(e => e.category === 'training').length
    };
  }, [events]);

  // Next Upcoming Items for the Top Metric Bar
  const nextAudit = useMemo(() => {
    return events
      .filter(e => e.category === 'audit' && getDaysDiff(e.date) >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  const nextPolicy = useMemo(() => {
    return events
      .filter(e => e.category === 'policy_review' && getDaysDiff(e.date) >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  const nextTraining = useMemo(() => {
    return events
      .filter(e => e.category === 'training' && getDaysDiff(e.date) >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  // Events on the currently selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => e.date === selectedDate);
  }, [selectedDate, filteredEvents]);

  // Toggle completed status handler
  const handleToggleEventStatus = (event: ComplianceCalendarEvent) => {
    if (isAuditor) return;
    setEvents(prev =>
      prev.map(item => {
        if (item.id === event.id) {
          return {
            ...item,
            status: item.status === 'completed' ? 'upcoming' : 'completed'
          };
        }
        return item;
      })
    );
    if (selectedEvent?.id === event.id) {
      setSelectedEvent(prev => prev ? {
        ...prev,
        status: prev.status === 'completed' ? 'upcoming' : 'completed'
      } : null);
    }
  };

  // Add Event Handler
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    const newEvent: ComplianceCalendarEvent = {
      id: `cal-custom-${Date.now().toString(36)}`,
      organizationId: organization.id,
      title: formTitle.trim(),
      category: formCategory,
      date: formDate,
      time: formTime,
      duration: formCategory === 'audit' ? 'Full Day' : '1 hr',
      owner: formOwner,
      ownerRole: formOwner.includes('vCISO') ? 'Virtual CISO Lead' : 'Security Team',
      frameworkRef: formFrameworkRef,
      recurrence: formRecurrence,
      status: 'upcoming',
      description: formDescription || `Scheduled ${formCategory.replace('_', ' ')} event for ${organization.name}.`,
      auditorBody: formCategory === 'audit' ? formAuditorBody : undefined,
      deliverables: [`Documented record for ${formCategory.replace('_', ' ')}`]
    };

    setEvents(prev => [...prev, newEvent]);
    setShowAddModal(false);
    setSelectedDate(formDate);

    // Reset form
    setFormTitle('');
    setFormDescription('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* 1. Header & Title Bar */}
      <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Continuous Compliance Cadence</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Simulation Anchor: <strong className="font-mono text-slate-700 font-semibold">{SIMULATION_TODAY}</strong> (Q4 2026)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Compliance Calendar & Regulatory Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrated calendar mapping upcoming quarterly accredited audits, formal policy review cycles, and mandatory recurring security training deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* View Mode Toggle: Month Grid vs Agenda List */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Month Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Quarterly Agenda
              </button>
            </div>

            {/* Add Event Button (disabled for read-only auditor) */}
            {!isAuditor && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Event</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Metric / Urgency Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/80">
          {/* Next Quarterly Audit */}
          <div className="p-3 bg-white rounded-lg border border-indigo-100 flex items-start gap-3">
            <div className="p-2 rounded-md bg-indigo-50 border border-indigo-200/60 text-indigo-700 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-900">
                  Upcoming Quarterly Audit
                </span>
                {nextAudit && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-800">
                    {getDaysDiff(nextAudit.date) === 0 ? 'Today' : `In ${getDaysDiff(nextAudit.date)} days`}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={nextAudit?.title}>
                {nextAudit?.title || 'No pending audits'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                <span>{nextAudit?.date}</span>
                {nextAudit?.auditorBody && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{nextAudit.auditorBody}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Next Policy Review */}
          <div className="p-3 bg-white rounded-lg border border-emerald-100 flex items-start gap-3">
            <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-700 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
                  Next Policy Review
                </span>
                {nextPolicy && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800">
                    {getDaysDiff(nextPolicy.date) === 0 ? 'Today' : `In ${getDaysDiff(nextPolicy.date)} days`}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={nextPolicy?.title}>
                {nextPolicy?.title || 'No pending reviews'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                <span>{nextPolicy?.date}</span>
                <span aria-hidden="true">·</span>
                <span>{nextPolicy?.recurrence} Cadence</span>
              </div>
            </div>
          </div>

          {/* Next Recurring Training */}
          <div className="p-3 bg-white rounded-lg border border-amber-100 flex items-start gap-3">
            <div className="p-2 rounded-md bg-amber-50 border border-amber-200/60 text-amber-700 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                  Recurring Training Cutoff
                </span>
                {nextTraining && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800">
                    {getDaysDiff(nextTraining.date) === 0 ? 'Today' : `In ${getDaysDiff(nextTraining.date)} days`}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={nextTraining?.title}>
                {nextTraining?.title || 'No upcoming training'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                <span>{nextTraining?.date}</span>
                <span aria-hidden="true">·</span>
                <span>Mandatory Cutoff</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Controls & Category Tabs */}
      <div className="px-5 py-3 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>All Categories</span>
            <span className={`ml-1.5 font-mono text-[11px] px-1.5 py-0.2 rounded ${
              selectedCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'audit'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                : 'bg-white text-indigo-900 border-indigo-200/80 hover:bg-indigo-50/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Quarterly Audits</span>
            <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
              selectedCategory === 'audit' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
            }`}>
              {counts.audit}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('policy_review')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'policy_review'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-emerald-900 border-emerald-200/80 hover:bg-emerald-50/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Policy Reviews</span>
            <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
              selectedCategory === 'policy_review' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {counts.policy_review}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('training')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'training'
                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                : 'bg-white text-amber-900 border-amber-200/80 hover:bg-amber-50/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>Recurring Training</span>
            <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
              selectedCategory === 'training' ? 'bg-amber-800 text-amber-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {counts.training}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, owners, frameworks..."
            className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 w-full sm:w-60 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Month Navigation Header (Visible in Month View) */}
      {viewMode === 'month' && (
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 font-mono tracking-tight flex items-center gap-2">
              <span>{monthNames[currentMonth]} {currentYear}</span>
            </h3>

            {/* Jump to Simulation Anchor (Oct 2026) */}
            <button
              type="button"
              onClick={handleJumpToToday}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              Simulation Today ({SIMULATION_TODAY})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Body: Month Grid OR Agenda List */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Calendar 7-Column Grid (3 cols on desktop) */}
          <div className="lg:col-span-3 border-r border-slate-200/80">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-100/60 text-slate-600 text-[11px] font-bold uppercase tracking-wider text-center py-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/20">
              {calendarGridDays.map((dayItem, idx) => {
                const isSelected = selectedDate === dayItem.dateStr;
                const hasEvents = dayItem.events.length > 0;

                return (
                  <div
                    key={`${dayItem.dateStr}-${idx}`}
                    onClick={() => setSelectedDate(dayItem.dateStr)}
                    className={`min-h-[105px] p-1.5 transition-colors cursor-pointer relative flex flex-col justify-between ${
                      dayItem.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                    } ${
                      isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20' : 'hover:bg-slate-50/90'
                    } ${
                      dayItem.isToday ? 'border-amber-400/80' : ''
                    }`}
                  >
                    {/* Day Number and Badges */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                          dayItem.isToday
                            ? 'bg-amber-500 text-white font-bold shadow-2xs'
                            : isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : dayItem.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayItem.dayNumber}
                      </span>

                      {dayItem.isToday && (
                        <span className="text-[9px] font-bold font-mono tracking-tight uppercase text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded border border-amber-200">
                          Today
                        </span>
                      )}

                      {hasEvents && !dayItem.isToday && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {dayItem.events.length}
                        </span>
                      )}
                    </div>

                    {/* Event Pill Cards inside day cell */}
                    <div className="space-y-1 overflow-y-auto max-h-[72px] pr-0.5">
                      {dayItem.events.slice(0, 3).map((event) => {
                        const isAudit = event.category === 'audit';
                        const isPolicy = event.category === 'policy_review';
                        const isTraining = event.category === 'training';
                        const isCompleted = event.status === 'completed';

                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setSelectedDate(event.date);
                            }}
                            className={`group text-left text-[11px] p-1 rounded-sm border transition-all truncate block cursor-pointer ${
                              isCompleted
                                ? 'bg-slate-100 border-slate-200 text-slate-500 line-through opacity-75'
                                : isAudit
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100 hover:border-indigo-300'
                                : isPolicy
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300'
                                : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
                            }`}
                            title={`${event.title} (${event.category.replace('_', ' ')})`}
                          >
                            <div className="flex items-center gap-1">
                              {isAudit && <ShieldCheck className="w-2.5 h-2.5 shrink-0 text-indigo-600" />}
                              {isPolicy && <FileText className="w-2.5 h-2.5 shrink-0 text-emerald-600" />}
                              {isTraining && <GraduationCap className="w-2.5 h-2.5 shrink-0 text-amber-600" />}
                              <span className="truncate font-medium">{event.title}</span>
                            </div>
                          </div>
                        );
                      })}

                      {dayItem.events.length > 3 && (
                        <div className="text-[10px] text-slate-500 font-mono pl-1">
                          +{dayItem.events.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector Side-Panel */}
          <div className="lg:col-span-1 p-4 bg-slate-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Selected Date Schedule
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {selectedDate || 'No date selected'}
                  </span>
                </div>
                {selectedDate === SIMULATION_TODAY && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    Active Today
                  </span>
                )}
              </div>

              {/* Day Events Feed */}
              <div className="mt-3 space-y-3">
                {eventsOnSelectedDate.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <CalendarCheck className="w-7 h-7 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-medium text-slate-600">No events on this date</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select a date with highlighted items or schedule a new compliance deadline.
                    </p>
                    {!isAuditor && (
                      <button
                        onClick={() => {
                          if (selectedDate) setFormDate(selectedDate);
                          setShowAddModal(true);
                        }}
                        className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule on this day</span>
                      </button>
                    )}
                  </div>
                ) : (
                  eventsOnSelectedDate.map((ev) => {
                    const isAudit = ev.category === 'audit';
                    const isPolicy = ev.category === 'policy_review';
                    const isTraining = ev.category === 'training';
                    const isCompleted = ev.status === 'completed';

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer bg-white hover:shadow-xs ${
                          selectedEvent?.id === ev.id
                            ? 'border-indigo-500 ring-1 ring-indigo-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isAudit
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isPolicy
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {ev.category.replace('_', ' ')}
                          </span>

                          <span className={`text-[10px] font-mono font-semibold ${
                            isCompleted ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {ev.time || 'All Day'}
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold text-slate-900 leading-snug ${
                          isCompleted ? 'line-through text-slate-500' : ''
                        }`}>
                          {ev.title}
                        </h4>

                        <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{ev.owner}</span>
                          </div>
                          {ev.frameworkRef && (
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{ev.frameworkRef}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400">
                            {ev.recurrence}
                          </span>
                          <span className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                            Details &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Helper / Export Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>{filteredEvents.length} total scheduled</span>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Agenda List
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 6. Agenda / Schedule List View */
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Compliance Event</th>
                  <th className="py-2.5 px-3">Owner & Role</th>
                  <th className="py-2.5 px-3">Cadence</th>
                  <th className="py-2.5 px-3">Framework Ref</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((ev) => {
                    const daysDiff = getDaysDiff(ev.date);
                    const isAudit = ev.category === 'audit';
                    const isPolicy = ev.category === 'policy_review';
                    const isTraining = ev.category === 'training';
                    const isCompleted = ev.status === 'completed';

                    return (
                      <tr
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        {/* Date */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block">
                            {ev.date}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {ev.time || 'All Day'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              isAudit
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isPolicy
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isAudit && <ShieldCheck className="w-3 h-3 text-indigo-600" />}
                            {isPolicy && <FileText className="w-3 h-3 text-emerald-600" />}
                            {isTraining && <GraduationCap className="w-3 h-3 text-amber-600" />}
                            <span>{ev.category === 'audit' ? 'Quarterly Audit' : ev.category === 'policy_review' ? 'Policy Review' : 'Training Deadline'}</span>
                          </span>
                        </td>

                        {/* Event Title */}
                        <td className="py-3 px-3 max-w-sm">
                          <span className={`font-bold text-slate-900 block ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                            {ev.title}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">
                            {ev.description}
                          </span>
                        </td>

                        {/* Owner */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                          <span className="font-medium block">{ev.owner}</span>
                          <span className="text-[10px] text-slate-400">{ev.ownerRole || 'Lead'}</span>
                        </td>

                        {/* Cadence */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                          {ev.recurrence}
                        </td>

                        {/* Framework Ref */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 max-w-xs truncate">
                          {ev.frameworkRef || 'General ISMS'}
                        </td>

                        {/* Status & Countdown */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Completed</span>
                            </span>
                          ) : daysDiff < 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Past Due</span>
                            </span>
                          ) : daysDiff === 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span>Due Today</span>
                            </span>
                          ) : daysDiff <= 14 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>In {daysDiff} days</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono">
                              In {daysDiff} days
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadIcsFile(ev);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors mr-1"
                            title="Download .ics Calendar Invite"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. EVENT INSPECTION MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      selectedEvent.category === 'audit'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : selectedEvent.category === 'policy_review'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {selectedEvent.category === 'audit'
                      ? 'Quarterly Compliance Audit'
                      : selectedEvent.category === 'policy_review'
                      ? 'Policy Governance Review'
                      : 'Recurring Security Training Deadline'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedEvent.recurrence}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Date & Time Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Scheduled Date</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{selectedEvent.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Time & Duration</span>
                  <span className="font-medium text-slate-800 font-mono text-xs">{selectedEvent.time} ({selectedEvent.duration || 'Session'})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Timeline Status</span>
                  <span className={`font-bold font-mono text-xs ${
                    selectedEvent.status === 'completed' ? 'text-slate-500' : 'text-indigo-700'
                  }`}>
                    {selectedEvent.status === 'completed' ? 'Completed' : `In ${getDaysDiff(selectedEvent.date)} days`}
                  </span>
                </div>
              </div>

              {/* Event Description */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Operational Description</h4>
                <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Ownership & Accountability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Responsible Lead</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedEvent.owner}</span>
                  <span className="text-[11px] text-slate-500">{selectedEvent.ownerRole || 'Engagement Lead'}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Framework Mapping</span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5">
                    {selectedEvent.frameworkRef || 'General ISMS Requirement'}
                  </span>
                  {selectedEvent.auditorBody && (
                    <span className="text-[11px] text-indigo-700 font-medium">Auditor: {selectedEvent.auditorBody}</span>
                  )}
                  {selectedEvent.policyCode && (
                    <span className="text-[11px] text-emerald-700 font-medium">Governs: {selectedEvent.policyCode}</span>
                  )}
                </div>
              </div>

              {/* Deliverables / Verification Checklist */}
              {selectedEvent.deliverables && selectedEvent.deliverables.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Audit Deliverables & Verification Checklist</span>
                    <span className="text-[11px] font-mono font-normal text-slate-400">
                      {selectedEvent.deliverables.length} items
                    </span>
                  </h4>
                  <ul className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    {selectedEvent.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mandatory Audience */}
              {selectedEvent.mandatoryForRoles && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Required Attendees / Mandated Roles</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.mandatoryForRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer & Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Download .ICS File */}
                <button
                  type="button"
                  onClick={() => downloadIcsFile(selectedEvent)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .ICS</span>
                </button>

                {/* Google Calendar Link */}
                <a
                  href={getGoogleCalendarLink(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add to Google Calendar</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                {!isAuditor && (
                  <button
                    type="button"
                    onClick={() => handleToggleEventStatus(selectedEvent)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                      selectedEvent.status === 'completed'
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{selectedEvent.status === 'completed' ? 'Reopen' : 'Mark Completed'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SCHEDULE NEW EVENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Schedule Compliance Milestone / Deadline
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Compliance Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Q1 2027 ISO 27001 Surveillance Audit"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Event Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CalendarEventCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="audit">Quarterly Audit</option>
                    <option value="policy_review">Policy Review</option>
                    <option value="training">Recurring Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Cadence / Recurrence *
                  </label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as CalendarEventRecurrence)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Bi-Monthly">Bi-Monthly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Time / Window
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 10:00 AM EST or All Day"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Responsible Owner
                  </label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Framework Reference
                  </label>
                  <input
                    type="text"
                    value={formFrameworkRef}
                    onChange={(e) => setFormFrameworkRef(e.target.value)}
                    placeholder="e.g. ISO 27001 A.5.1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {formCategory === 'audit' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Auditor / Registrar Body
                  </label>
                  <input
                    type="text"
                    value={formAuditorBody}
                    onChange={(e) => setFormAuditorBody(e.target.value)}
                    placeholder="e.g. BSI Group / Schellman"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Scope & Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize verification scope, required documentation, and deliverables..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
