import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
  const category = searchParams.get('category');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    let query = `SELECT id, question, answer, category, display_order, is_active, created_at FROM faqs WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (category && category !== 'all' && category !== 'All') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY display_order ASC, created_at ASC`;

    const res = await client.query(query, params);
    const faqs = res.rows.map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      category: r.category,
      displayOrder: r.display_order,
      isActive: r.is_active,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    }));

    return NextResponse.json({ faqs });
  } finally {
    client.release();
  }
});

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  const body = await req.json();
  const { question, answer, category = 'General', displayOrder = 0, isActive = true } = body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new AppError('E-1101', 'Question text is required');
  }
  if (!answer || typeof answer !== 'string' || !answer.trim()) {
    throw new AppError('E-1101', 'Answer text is required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `INSERT INTO faqs (tenant_id, question, answer, category, display_order, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, question, answer, category, display_order, is_active, created_at`,
      [tenantId, question.trim(), answer.trim(), category.trim(), Number(displayOrder) || 0, Boolean(isActive)]
    );

    const newFaq = res.rows[0];

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'faq.created',
      target: `faq:${newFaq.id}`,
      details: { question: newFaq.question, category: newFaq.category },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      faq: {
        id: newFaq.id,
        question: newFaq.question,
        answer: newFaq.answer,
        category: newFaq.category,
        displayOrder: newFaq.display_order,
        isActive: newFaq.is_active,
        createdAt: newFaq.created_at.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

