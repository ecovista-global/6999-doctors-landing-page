import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

function getSlugFromRequest(req: NextRequest): string {
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const slug = getSlugFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!slug) {
    throw new AppError('E-1101', 'Article slug is required');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `SELECT id, title, slug, excerpt, content_json, cover_image_url, published_at, created_at
       FROM posts
       WHERE tenant_id = $1 AND slug = $2 AND is_published = true
       LIMIT 1`,
      [tenantId, slug]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `Article '${slug}' not found`);
    }

    const row = res.rows[0];
    return NextResponse.json({
      post: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt || '',
        category: row.content_json?.category || 'General Medicine',
        readTime: row.content_json?.readTime || '4 min read',
        coverImageUrl: row.cover_image_url || '',
        contentHtml: row.content_json?.html || '',
        publishedDate: row.published_at ? row.published_at.toISOString().slice(0, 10) : 'Recent',
        author: 'Dr. Maanvita Kumari (MBBS, MD)',
        tags: row.content_json?.tags || ['General Health'],
      },
    });
  } finally {
    client.release();
  }
});
