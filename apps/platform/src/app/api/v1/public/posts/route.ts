import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { withGateway } from '@/lib/gateway';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    let query = `
      SELECT id, title, slug, excerpt, content_json, cover_image_url, is_published, published_at, created_at
      FROM posts
      WHERE tenant_id = $1 AND is_published = true
    `;
    const params: any[] = [tenantId];

    if (category && category !== 'All' && category !== 'all') {
      params.push(category);
      query += ` AND content_json->>'category' = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`;
    }

    query += ` ORDER BY COALESCE(published_at, created_at) DESC`;

    const res = await client.query(query, params);

    const posts = res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt || '',
      category: row.content_json?.category || 'General Medicine',
      readTime: row.content_json?.readTime || '4 min read',
      coverImageUrl: row.cover_image_url || '',
      isPublished: row.is_published,
      publishedDate: row.published_at ? row.published_at.toISOString().slice(0, 10) : 'Recent',
      author: 'Dr. Maanvita Kumari (MBBS, MD)',
      tags: row.content_json?.tags || ['General Health'],
    }));

    return NextResponse.json({ posts });
  } finally {
    client.release();
  }
});

