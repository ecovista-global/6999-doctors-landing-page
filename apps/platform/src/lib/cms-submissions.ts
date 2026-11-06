import pg from 'pg';
import { pool } from '@/db';
import { decrypt } from '@/lib/crypto';

export interface CmsAppointmentItem {
  id: string;
  tenantId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  serviceName: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  consentAt: string;
  idempotencyKey: string;
  ipHash: string | null;
  createdAt: string;
}

export interface FetchCmsAppointmentsParams {
  tenantId: string;
  tab?: 'today' | 'all' | undefined;
  status?: string | undefined;
  service?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  search?: string | undefined;
  cursor?: string | null | undefined;
  limit?: number | undefined;
}

export interface FetchCmsAppointmentsResult {
  items: CmsAppointmentItem[];
  nextCursor: string | null;
  hasMore: boolean;
  totalFiltered?: number;
}

function formatDateOnly(val: Date | string): string {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  const year = val.getFullYear();
  const month = String(val.getMonth() + 1).padStart(2, '0');
  const day = String(val.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Decodes a base64 keyset cursor
 */
export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed.createdAt && parsed.id) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Encodes a keyset cursor into base64
 */
export function encodeCursor(createdAt: string | Date, id: string): string {
  const timeStr = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  return Buffer.from(JSON.stringify({ createdAt: timeStr, id })).toString('base64');
}

/**
 * Fetches appointments for the CMS Submissions Dashboard with Keyset Cursor Pagination,
 * Today's OPD filtering, date ranges, and decrypted PII (MT-115 per 18 § 3 & 19 § 4).
 */
export async function fetchCmsAppointments(
  params: FetchCmsAppointmentsParams,
  clientOverride?: pg.PoolClient
): Promise<FetchCmsAppointmentsResult> {
  const {
    tenantId,
    tab = 'all',
    status,
    service,
    startDate,
    endDate,
    search,
    cursor,
    limit = 20,
  } = params;

  const effectiveLimit = Math.min(Math.max(1, limit), 100);

  const client = clientOverride || (await pool.connect());
  const shouldRelease = !clientOverride;

  try {
    // 1. Enforce tenant isolation via RLS context
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // 2. Build parameterized query
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    // Tab filter: Today's OPD Board
    if (tab === 'today') {
      conditions.push(`preferred_date = CURRENT_DATE`);
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // Service filter
    if (service && service !== 'all') {
      conditions.push(`service_name = $${paramIndex}`);
      values.push(service);
      paramIndex++;
    }

    // Date range filters
    if (startDate) {
      conditions.push(`preferred_date >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`preferred_date <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    // Keyset pagination cursor: (created_at, id) < (cursorCreatedAt, cursorId)
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        conditions.push(
          `(created_at < $${paramIndex} OR (created_at = $${paramIndex} AND id < $${paramIndex + 1}))`
        );
        values.push(decoded.createdAt);
        values.push(decoded.id);
        paramIndex += 2;
      }
    }

    // Fetch effectiveLimit + 1 rows to determine if hasMore is true
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
        idempotency_key,
        ip_hash,
        created_at
      FROM appointments
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC, id DESC
      LIMIT $${paramIndex}
    `;
    values.push(effectiveLimit + 1);

    const result = await client.query(query, values);
    const rows = result.rows;

    const hasMore = rows.length > effectiveLimit;
    const itemsToProcess = hasMore ? rows.slice(0, effectiveLimit) : rows;

    // 3. Decrypt contact PII on demand for staff access (SD-050 / MT-108)
    const items: CmsAppointmentItem[] = itemsToProcess.map((row) => {
      let patientName = '[Encrypted]';
      let patientPhone = '[Encrypted]';
      let patientEmail: string | null = null;

      try {
        patientName = decrypt(row.patient_name_enc);
      } catch {
        patientName = String(row.patient_name_enc || '');
      }

      try {
        patientPhone = decrypt(row.patient_phone_enc);
      } catch {
        patientPhone = String(row.patient_phone_enc || '');
      }

      if (row.patient_email_enc) {
        try {
          patientEmail = decrypt(row.patient_email_enc);
        } catch {
          patientEmail = String(row.patient_email_enc);
        }
      }

      const formattedDate = formatDateOnly(row.preferred_date);

      const formattedCreatedAt =
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at);

      const formattedConsentAt =
        row.consent_at instanceof Date
          ? row.consent_at.toISOString()
          : String(row.consent_at);

      return {
        id: row.id,
        tenantId: row.tenant_id,
        patientName,
        patientPhone,
        patientEmail,
        serviceName: row.service_name,
        preferredDate: formattedDate,
        preferredTimeSlot: row.preferred_time_slot,
        status: row.status,
        notes: row.notes,
        consentAt: formattedConsentAt,
        idempotencyKey: row.idempotency_key,
        ipHash: row.ip_hash,
        createdAt: formattedCreatedAt,
      };
    });

    // 4. In-memory search filter if search term provided
    let filteredItems = items;
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filteredItems = items.filter(
        (item) =>
          item.patientName.toLowerCase().includes(q) ||
          item.patientPhone.includes(q) ||
          (item.patientEmail && item.patientEmail.toLowerCase().includes(q)) ||
          item.serviceName.toLowerCase().includes(q)
      );
    }

    // 5. Build nextCursor
    let nextCursor: string | null = null;
    if (hasMore && itemsToProcess.length > 0) {
      const lastRow = itemsToProcess[itemsToProcess.length - 1];
      nextCursor = encodeCursor(lastRow.created_at, lastRow.id);
    }

    return {
      items: filteredItems,
      nextCursor,
      hasMore,
    };
  } finally {
    if (shouldRelease) {
      client.release();
    }
  }
}
