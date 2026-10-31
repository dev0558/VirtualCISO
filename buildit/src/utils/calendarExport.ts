import { ComplianceCalendarEvent } from '../types/compliance';

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string for a single compliance event
 */
export function generateIcsForEvent(event: ComplianceCalendarEvent): string {
  const cleanDate = event.date.replace(/-/g, '');
  const dtStart = `${cleanDate}T130000Z`;
  const dtEnd = `${cleanDate}T150000Z`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${event.id}@compliance-platform.internal`;

  const categoryLabel = 
    event.category === 'audit' 
      ? 'Quarterly Compliance Audit' 
      : event.category === 'policy_review' 
      ? 'Governance Policy Review' 
      : 'Security Training Deadline';

  const description = [
    `Category: ${categoryLabel}`,
    `Recurrence: ${event.recurrence}`,
    `Owner: ${event.owner} (${event.ownerRole || 'Lead'})`,
    event.frameworkRef ? `Framework: ${event.frameworkRef}` : '',
    event.auditorBody ? `Auditor/Body: ${event.auditorBody}` : '',
    `Description: ${event.description}`,
    event.deliverables && event.deliverables.length > 0 ? `Deliverables:\n- ${event.deliverables.join('\n- ')}` : ''
  ].filter(Boolean).join('\n\n').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Compliance Automation Platform//vCISO Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:[${event.category.toUpperCase().replace('_', ' ')}] ${event.title}`,
    `DESCRIPTION:${description}`,
    `STATUS:${event.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers a browser download of the .ics file
 */
export function downloadIcsFile(event: ComplianceCalendarEvent) {
  const icsData = generateIcsForEvent(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.id}-${event.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a Google Calendar web intent link
 */
export function getGoogleCalendarLink(event: ComplianceCalendarEvent): string {
  const cleanDate = event.date.replace(/-/g, '');
  const dates = `${cleanDate}T130000Z/${cleanDate}T150000Z`;
  const text = encodeURIComponent(`[Compliance] ${event.title}`);
  const details = encodeURIComponent(
    `${event.description}\n\nOwner: ${event.owner}\nFramework: ${event.frameworkRef || 'General'}\nRecurrence: ${event.recurrence}`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
}
