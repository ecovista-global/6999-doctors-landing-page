import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { sanitizeHtml, generateSlug, calculateReadTime } from '@/lib/htmlSanitizer';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    let query = `
      SELECT id, tenant_id, title, slug, excerpt, content_json, cover_image_url,
             published_at, is_published, seo_title, seo_description, created_at, updated_at
      FROM posts
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND content_json->>'category' = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC`;

    const res = await client.query(query, params);

    const posts = res.rows.map((row) => ({
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
      createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : new Date().toISOString(),
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
    }));

    return NextResponse.json({ posts });
  } finally {
    client.release();
  }
});

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

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

  // 1. Generate and sanitize slug
  const cleanSlug = providedSlug && providedSlug.trim()
    ? generateSlug(providedSlug)
    : generateSlug(title);

  if (!cleanSlug) {
    throw new AppError('E-1101', 'Valid URL slug could not be generated');
  }

  // 2. Sanitize rich HTML content
  const sanitizedContent = sanitizeHtml(content);
  const calculatedReadTime = calculateReadTime(sanitizedContent);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // Check slug uniqueness within tenant
    const existing = await client.query(
      `SELECT id FROM posts WHERE tenant_id = $1 AND slug = $2 LIMIT 1`,
      [tenantId, cleanSlug]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      throw new AppError('E-1301', `The URL slug '${cleanSlug}' is already in use by another article. Please use a unique slug.`);
    }

    const contentJson = {
      html: sanitizedContent,
      category,
      readTime: calculatedReadTime,
      tags: [category],
    };

    const publishedAt = isPublished ? new Date() : null;

    const insertRes = await client.query(
      `INSERT INTO posts (
         tenant_id, title, slug, excerpt, content_json, cover_image_url,
         published_at, is_published, seo_title, seo_description, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, title, slug, excerpt, content_json, cover_image_url, published_at, is_published, created_at`,
      [
        tenantId,
        title.trim(),
        cleanSlug,
        excerpt.trim(),
        contentJson,
        coverImageUrl.trim(),
        publishedAt,
        Boolean(isPublished),
        seoTitle || title.trim(),
        seoDescription || excerpt.trim(),
      ]
    );

    const newPost = insertRes.rows[0];

    // Audit trail
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_editor',
      action: 'post.created',
      target: `post:${newPost.id}`,
      details: {
        title: newPost.title,
        slug: newPost.slug,
        isPublished: newPost.is_published,
      },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      post: {
        id: newPost.id,
        title: newPost.title,
        slug: newPost.slug,
        excerpt: newPost.excerpt,
        category: newPost.content_json?.category,
        readTime: newPost.content_json?.readTime,
        coverImageUrl: newPost.cover_image_url,
        content: newPost.content_json?.html,
        isPublished: newPost.is_published,
        publishedAt: newPost.published_at ? newPost.published_at.toISOString().slice(0, 10) : undefined,
        createdAt: newPost.created_at.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
