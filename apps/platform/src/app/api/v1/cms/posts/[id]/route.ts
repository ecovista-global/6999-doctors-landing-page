import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { sanitizeHtml, generateSlug, calculateReadTime } from '@/lib/htmlSanitizer';

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
    throw new AppError('E-1101', 'Article ID is required');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `SELECT id, tenant_id, title, slug, excerpt, content_json, cover_image_url,
              published_at, is_published, seo_title, seo_description, created_at, updated_at
       FROM posts
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [id, tenantId]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `Article not found with ID ${id}`);
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
        content: row.content_json?.html || '',
        isPublished: row.is_published,
        publishedAt: row.published_at ? row.published_at.toISOString().slice(0, 10) : undefined,
        createdAt: row.created_at ? row.created_at.toISOString() : undefined,
        updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
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
    throw new AppError('E-1101', 'Article ID is required');
  }

  const body = await req.json();
  const {
    title,
    slug: providedSlug,
    excerpt = '',
    content = '',
    category = 'General Medicine',
    coverImageUrl = '',
    isPublished = true,
    seoTitle,
    seoDescription,
  } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('E-1101', 'Article title is required');
  }

  const cleanSlug = providedSlug && providedSlug.trim()
    ? generateSlug(providedSlug)
    : generateSlug(title);

  const sanitizedContent = sanitizeHtml(content);
  const calculatedReadTime = calculateReadTime(sanitizedContent);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // Check slug uniqueness excluding this post
    const collision = await client.query(
      `SELECT id FROM posts WHERE tenant_id = $1 AND slug = $2 AND id != $3 LIMIT 1`,
      [tenantId, cleanSlug, id]
    );

    if (collision.rowCount && collision.rowCount > 0) {
      throw new AppError('E-1301', `The URL slug '${cleanSlug}' is already in use by another article. Please use a unique slug.`);
    }

    const contentJson = {
      html: sanitizedContent,
      category,
      readTime: calculatedReadTime,
      tags: [category],
    };

    const updateRes = await client.query(
      `UPDATE posts
       SET title = $1,
           slug = $2,
           excerpt = $3,
           content_json = $4,
           cover_image_url = $5,
           is_published = $6,
           published_at = CASE WHEN $6 = true AND published_at IS NULL THEN NOW() ELSE published_at END,
           seo_title = $7,
           seo_description = $8,
           updated_at = NOW()
       WHERE id = $9 AND tenant_id = $10
       RETURNING id, title, slug, excerpt, content_json, cover_image_url, published_at, is_published, created_at, updated_at`,
      [
        title.trim(),
        cleanSlug,
        excerpt.trim(),
        contentJson,
        coverImageUrl.trim(),
        Boolean(isPublished),
        seoTitle || title.trim(),
        seoDescription || excerpt.trim(),
        id,
        tenantId,
      ]
    );

    if (updateRes.rowCount === 0) {
      throw new AppError('E-1101', `Article not found with ID ${id}`);
    }

    const updated = updateRes.rows[0];

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_editor',
      action: 'post.updated',
      target: `post:${id}`,
      details: {
        title: updated.title,
        slug: updated.slug,
        isPublished: updated.is_published,
      },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      post: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt,
        category: updated.content_json?.category,
        readTime: updated.content_json?.readTime,
        coverImageUrl: updated.cover_image_url,
        content: updated.content_json?.html,
        isPublished: updated.is_published,
        publishedAt: updated.published_at ? updated.published_at.toISOString().slice(0, 10) : undefined,
        createdAt: updated.created_at ? updated.created_at.toISOString() : undefined,
        updatedAt: updated.updated_at ? updated.updated_at.toISOString() : undefined,
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
    throw new AppError('E-1101', 'Article ID is required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const delRes = await client.query(
      `DELETE FROM posts WHERE id = $1 AND tenant_id = $2 RETURNING id, title`,
      [id, tenantId]
    );

    if (delRes.rowCount === 0) {
      throw new AppError('E-1101', `Article not found with ID ${id}`);
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_editor',
      action: 'post.deleted',
      target: `post:${id}`,
      details: { title: delRes.rows[0].title },
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
