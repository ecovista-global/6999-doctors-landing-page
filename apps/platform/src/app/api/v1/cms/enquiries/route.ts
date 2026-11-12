import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { decrypt } from '@/lib/crypto';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { DEFAULT_DEMO_TENANT_ID } from '@/lib/defaultTenant';

const ALLOWED_STATUSES = ['pending', 'contacted', 'resolved', 'archived'] as const;

export interface CmsEnquiryItem {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  service: string | null;
  status: string;
  consentAt: string;
  createdAt: string;
}

function safeDecrypt(buf: Buffer | string | null | undefined, fallback = ''): string {
  if (!buf) return fallback;
  try {
    return decrypt(buf as Buffer);
  } catch {
    return fallback || String(buf);
  }
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId =
    searchParams.get('tenantId') ||
    req.headers.get('x-tenant-id') ||
    DEFAULT_DEMO_TENANT_ID;
  const status = searchParams.get('status') || '';
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    params.push(limit);
    const res = await client.query(
      `SELECT id, tenant_id, name_enc, phone_enc, email_enc, message_enc, service, status, consent_at, created_at
       FROM enquiries
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length}`,
      params
    );

    let items: CmsEnquiryItem[] = res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: safeDecrypt(row.name_enc, '[Encrypted]'),
      phone: safeDecrypt(row.phone_enc, '[Encrypted]'),
      email: row.email_enc ? safeDecrypt(row.email_enc, '') : null,
      message: safeDecrypt(row.message_enc, ''),
      service: row.service ?? null,
      status: row.status,
      consentAt: row.consent_at ? new Date(row.consent_at).toISOString() : new Date().toISOString(),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }));

    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.phone.toLowerCase().includes(search) ||
          (item.email || '').toLowerCase().includes(search) ||
          (item.service || '').toLowerCase().includes(search) ||
          item.message.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(
      { items, total: items.length },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Trace-ID': ctx.traceId,
        },
      }
    );
  } finally {
    client.release();
  }
});

export const PATCH = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId =
    searchParams.get('tenantId') ||
    req.headers.get('x-tenant-id') ||
    DEFAULT_DEMO_TENANT_ID;

  const body = await req.json();
  const { id, status } = body || {};

  if (!id || typeof id !== 'string') {
    throw new AppError('E-1101', 'Enquiry id is required');
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new AppError('E-1101', `Invalid enquiry status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `UPDATE enquiries
       SET status = $1
       WHERE id = $2 AND tenant_id = $3
       RETURNING id, status`,
      [status, id, tenantId]
    );

    if (res.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new AppError('E-1101', 'Enquiry not found');
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'enquiry.status_updated',
      target: `enquiry:${id}`,
      details: { status },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, id: res.rows[0].id, status: res.rows[0].status },
      { status: 200, headers: { 'X-Trace-ID': ctx.traceId } }
    );
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    throw err;
  } finally {
    client.release();
  }
});

