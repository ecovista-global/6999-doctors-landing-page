/**
 * CSV Generation & RFC-4180 Escaping Engine (18 § 3 / MT-118)
 */

export function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvExportAppointmentRow {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  serviceName: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
  notes: string | null;
  consentAt: string;
  createdAt: string;
}

export function generateAppointmentsCsv(rows: CsvExportAppointmentRow[]): string {
  const headers = [
    'Appointment ID',
    'Patient Name',
    'Phone',
    'Email',
    'Service',
    'Preferred Date',
    'Time Slot',
    'Status',
    'Notes',
    'Consent Timestamp',
    'Submitted At',
  ];

  const lines = [headers.join(',')];

  for (const r of rows) {
    const line = [
      escapeCsvField(r.id),
      escapeCsvField(r.patientName),
      escapeCsvField(r.patientPhone),
      escapeCsvField(r.patientEmail),
      escapeCsvField(r.serviceName),
      escapeCsvField(r.preferredDate),
      escapeCsvField(r.preferredTimeSlot),
      escapeCsvField(r.status),
      escapeCsvField(r.notes),
      escapeCsvField(r.consentAt),
      escapeCsvField(r.createdAt),
    ].join(',');
    lines.push(line);
  }

  return lines.join('\r\n');
}
