import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

function getIdFromRequest(req: NextRequest): string {
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) {
    throw new AppError('E-1101', 'FAQ ID is required');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `SELECT id, question, answer, category, display_order, is_active, created_at
       FROM faqs
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [id, tenantId]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `FAQ not found with ID ${id}`);
    }

    const r = res.rows[0];
    return NextResponse.json({
      faq: {
        id: r.id,
        question: r.question,
        answer: r.answer,
        category: r.category,
        displayOrder: r.display_order,
        isActive: r.is_active,
        createdAt: r.created_at ? r.created_at.toISOString() : undefined,
      },
    });
  } finally {
    client.release();
  }
});

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) {
    throw new AppError('E-1101', 'FAQ ID is required');
  }

  const body = await req.json();
  const { question, answer, category, displayOrder, isActive } = body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `UPDATE faqs
       SET question = COALESCE($1, question),
           answer = COALESCE($2, answer),
           category = COALESCE($3, category),
           display_order = COALESCE($4, display_order),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND tenant_id = $7
       RETURNING id, question, answer, category, display_order, is_active, created_at`,
      [
        question ? question.trim() : null,
        answer ? answer.trim() : null,
        category ? category.trim() : null,
        displayOrder !== undefined ? Number(displayOrder) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        id,
        tenantId,
      ]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `FAQ not found with ID ${id}`);
    }

    const updated = res.rows[0];

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'faq.updated',
      target: `faq:${id}`,
      details: { question: updated.question, isActive: updated.is_active },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      faq: {
        id: updated.id,
        question: updated.question,
        answer: updated.answer,
        category: updated.category,
        displayOrder: updated.display_order,
        isActive: updated.is_active,
        createdAt: updated.created_at ? updated.created_at.toISOString() : undefined,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export const DELETE = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) {
    throw new AppError('E-1101', 'FAQ ID is required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `DELETE FROM faqs WHERE id = $1 AND tenant_id = $2 RETURNING id, question`,
      [id, tenantId]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `FAQ not found with ID ${id}`);
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'faq.deleted',
      target: `faq:${id}`,
      details: { question: res.rows[0].question },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

