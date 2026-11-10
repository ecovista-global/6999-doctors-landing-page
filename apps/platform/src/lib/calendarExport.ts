/**
 * Calendar Export Utilities (RFC-5545 iCalendar & Google Calendar)
 * Rule R7: Zero Emoji Ban. Pure text and standard date formatting.
 */

export interface AppointmentCalendarDetails {
  patientName: string;
  doctorName: string;
  clinicName: string;
  service: string;
  date: string; // YYYY-MM-DD or readable string
  time: string; // e.g. "05:30 PM"
  tokenNumber?: number;
  clinicAddress: string;
  phone: string;
}

function parseDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  const now = new Date();
  let baseDate = new Date();

  // Try parsing date string
  if (dateStr && !isNaN(Date.parse(dateStr))) {
    baseDate = new Date(dateStr);
  } else {
    // Default to tomorrow if invalid or empty
    baseDate.setDate(now.getDate() + 1);
  }

  // Parse time e.g. "05:30 PM" or "10:00 AM"
  let hours = 10;
  let minutes = 0;
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1] || '10', 10);
    minutes = parseInt(timeMatch[2] || '0', 10);
    const period = (timeMatch[3] || '').toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes duration

  return { start, end };
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate a direct Google Calendar Web Event URL
 */
export function getGoogleCalendarUrl(details: AppointmentCalendarDetails): string {
  const { start, end } = parseDateTime(details.date, details.time);
  const startIso = formatIcsDate(start);
  const endIso = formatIcsDate(end);

  const title = encodeURIComponent(`Clinic Appointment: ${details.doctorName} (${details.service})`);
  const tokenInfo = details.tokenNumber ? `\nQueue Token Number: #${details.tokenNumber}` : '';
  const description = encodeURIComponent(
    `Patient: ${details.patientName}\nDoctor: ${details.doctorName}\nService: ${details.service}${tokenInfo}\nClinic: ${details.clinicName}\nHelpdesk: ${details.phone}\n\nPlease arrive 10 minutes prior to your scheduled slot.`
  );
  const location = encodeURIComponent(`${details.clinicName}, ${details.clinicAddress}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${description}&location=${location}`;
}

/**
 * Generate RFC-5545 iCalendar (.ics) format string and trigger browser download
 */
export function downloadIcsFile(details: AppointmentCalendarDetails): void {
  const { start, end } = parseDateTime(details.date, details.time);
  const startIso = formatIcsDate(start);
  const endIso = formatIcsDate(end);
  const nowIso = formatIcsDate(new Date());

  const tokenText = details.tokenNumber ? `Queue Token: #${details.tokenNumber} - ` : '';
  const summary = `Clinic Appointment: ${tokenText}${details.doctorName}`;
  const description = `Patient: ${details.patientName}\\nDoctor: ${details.doctorName}\\nService: ${details.service}\\nClinic: ${details.clinicName}\\nHelpdesk: ${details.phone}\\nToken: #${details.tokenNumber || 'N/A'}`;
  const location = `${details.clinicName}, ${details.clinicAddress}`.replace(/,/g, '\\,');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EcoDigiTech//DoctorSite Pro//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:apt-${Date.now()}@healthconsult.in`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Clinic Appointment in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  if (typeof window !== 'undefined') {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Appointment-${details.date || 'Scheduled'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

