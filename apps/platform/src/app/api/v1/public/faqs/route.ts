import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { withGateway } from '@/lib/gateway';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
  const category = searchParams.get('category');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    let query = `
      SELECT id, question, answer, category, display_order, is_active
      FROM faqs
      WHERE tenant_id = $1 AND is_active = true
    `;
    const params: any[] = [tenantId];

    if (category && category !== 'All' && category !== 'all') {
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
    }));

    return NextResponse.json({ faqs });
  } finally {
    client.release();
  }
});

