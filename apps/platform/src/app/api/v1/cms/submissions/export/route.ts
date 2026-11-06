import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { decrypt } from '@/lib/crypto';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { generateAppointmentsCsv, CsvExportAppointmentRow } from '@/lib/csv-export';

function formatDateOnly(val: Date | string): string {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  const year = val.getFullYear();
  const month = String(val.getMonth() + 1).padStart(2, '0');
  const day = String(val.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for CSV export');
  }

  const status = searchParams.get('status') || undefined;
  const service = searchParams.get('service') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const actorId = req.headers.get('x-actor-id') || 'staff_export';

  const client = await pool.connect();
  try {
    // 1. Enforce tenant boundary under PostgreSQL RLS
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let pIdx = 2;

    if (status && status !== 'all') {
      conditions.push(`status = $${pIdx}`);
      values.push(status);
      pIdx++;
    }

    if (service && service !== 'all') {
      conditions.push(`service_name = $${pIdx}`);
      values.push(service);
      pIdx++;
    }

    if (startDate) {
      conditions.push(`preferred_date >= $${pIdx}`);
      values.push(startDate);
      pIdx++;
    }

    if (endDate) {
      conditions.push(`preferred_date <= $${pIdx}`);
      values.push(endDate);
      pIdx++;
    }

    const query = `
      SELECT 
        id,
        tenant_id,
        patient_name_enc,
        patient_phone_enc,
        patient_email_enc,
        service_name,
        preferred_date,
        preferred_time_slot,
        status,
        notes,
        consent_at,
        created_at
      FROM appointments
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC, id DESC
      LIMIT 5000
    `;

    const result = await client.query(query, values);
    const rows = result.rows;

    // 2. Decrypt PII fields for export
    const exportRows: CsvExportAppointmentRow[] = rows.map((r) => {
      let patientName = '[Encrypted]';
      let patientPhone = '[Encrypted]';
      let patientEmail: string | null = null;

      try {
        patientName = decrypt(r.patient_name_enc);
      } catch {
        patientName = String(r.patient_name_enc || '');
      }

      try {
        patientPhone = decrypt(r.patient_phone_enc);
      } catch {
        patientPhone = String(r.patient_phone_enc || '');
      }

      if (r.patient_email_enc) {
        try {
          patientEmail = decrypt(r.patient_email_enc);
        } catch {
          patientEmail = String(r.patient_email_enc);
        }
      }

      return {
        id: r.id,
        patientName,
        patientPhone,
        patientEmail,
        serviceName: r.service_name,
        preferredDate: formatDateOnly(r.preferred_date),
        preferredTimeSlot: r.preferred_time_slot,
        status: r.status,
        notes: r.notes,
        consentAt: r.consent_at instanceof Date ? r.consent_at.toISOString() : String(r.consent_at),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      };
    });

    const csvContent = generateAppointmentsCsv(exportRows);

    // 3. Record Audit Log for CSV Export (Rule R9 & 18 § 7)
    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'submission.export_csv',
      target: 'appointments',
      details: {
        exportedRowsCount: exportRows.length,
        statusFilter: status || 'all',
        serviceFilter: service || 'all',
      },
      ip: clientIp,
      userAgent,
    });

    const todayDate = new Date().toISOString().slice(0, 10);
    const filename = `clinic-appointments-${todayDate}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store',
        'X-Trace-ID': ctx.traceId,
      },
    });
  } finally {
    client.release();
  }
});
