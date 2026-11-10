import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

// 1 GB limit per Professional Clinic plan
const STORAGE_QUOTA_BYTES = 1_073_741_824;

// Allowed MIME types for clinic media
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

// Magic byte signatures for MIME validation
const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF....WEBP
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
];

function detectMimeFromBuffer(buf: Buffer): string | null {
  for (const sig of MAGIC_BYTES) {
    const offset = sig.offset ?? 0;
    if (sig.bytes.every((b, i) => buf[offset + i] === b)) {
      if (sig.mime === 'image/webp') {
        // confirm WEBP fourcc at offset 8
        if (buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
        return 'image/gif'; // was RIFF but not WEBP
      }
      return sig.mime;
    }
  }
  // Attempt SVG detection by text content
  const head = buf.slice(0, 512).toString('utf8').trimStart();
  if (head.startsWith('<?xml') || head.startsWith('<svg') || head.includes('<svg')) {
    return 'image/svg+xml';
  }
  return null;
}

function sanitizeSvg(raw: string): string {
  // Strip script tags, event handlers, javascript: hrefs, and external resource refs
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, 'removed:')
    .replace(/xlink:href\s*=\s*["']https?:[^"']*["']/gi, '')
    .replace(/href\s*=\s*["']https?:[^"']*["']/gi, '');
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
  const category = searchParams.get('category');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    let query = `
      SELECT id, title, url, storage_key, file_size_bytes, mime_type, dimensions, assigned_to, category, uploaded_at
      FROM media_assets
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY uploaded_at DESC`;

    const res = await client.query(query, params);
    const assets = res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      storageKey: r.storage_key,
      fileSizeBytes: r.file_size_bytes,
      mimeType: r.mime_type,
      dimensions: r.dimensions,
      assignedTo: r.assigned_to || 'unassigned',
      category: r.category,
      uploadedAt: r.uploaded_at ? r.uploaded_at.toISOString() : undefined,
    }));

    // Fetch real storage quota from usage_counters
    const quotaRes = await client.query(
      `SELECT storage_bytes FROM usage_counters WHERE tenant_id = $1`,
      [tenantId]
    );
    const storageBytes = quotaRes.rows[0]?.storage_bytes ?? 0;

    return NextResponse.json({
      assets,
      quota: {
        usedBytes: storageBytes,
        limitBytes: STORAGE_QUOTA_BYTES,
        usedMb: parseFloat((storageBytes / 1_048_576).toFixed(1)),
        limitMb: 1024,
        percentUsed: parseFloat(((storageBytes / STORAGE_QUOTA_BYTES) * 100).toFixed(1)),
      },
    });
  } finally {
    client.release();
  }
});

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  const contentType = req.headers.get('content-type') || '';

  let title = '';
  let url = '';
  let category = 'clinic';
  let fileSizeBytes = 0;
  let mimeType = 'image/jpeg';
  let dimensions = '';
  let svgBuffer: Buffer | null = null;

  if (contentType.startsWith('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    title = (formData.get('title') as string | null) || '';
    category = (formData.get('category') as string | null) || 'clinic';

    if (!file || !(file instanceof File)) {
      throw new AppError('E-1101', 'File is required for upload');
    }

    // Magic byte validation
    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const detectedMime = detectMimeFromBuffer(buf);

    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      throw new AppError('E-1201', `File type not allowed. Permitted: JPEG, PNG, WebP, SVG, GIF. Detected: ${detectedMime || 'unknown'}`);
    }

    mimeType = detectedMime;
    fileSizeBytes = buf.byteLength;

    // SVG sanitization
    if (mimeType === 'image/svg+xml') {
      const rawSvg = buf.toString('utf8');
      const cleanSvg = sanitizeSvg(rawSvg);
      svgBuffer = Buffer.from(cleanSvg, 'utf8');
      fileSizeBytes = svgBuffer.byteLength;
    }

    // For demonstration, store as a data: URL or simulate CDN path
    // In production, this is where the R2 S3-compatible upload would occur.
    // We store a placeholder CDN URL with the storage key pattern.
    const storageKey = `tenants/${tenantId}/media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    url = `/api/v1/cms/media/serve?key=${encodeURIComponent(storageKey)}`;
    // If this were real R2: url = `https://${R2_PUBLIC_BUCKET_URL}/${storageKey}`;

    title = title.trim() || file.name.replace(/\.[^.]+$/, '');
  } else {
    // JSON body: URL-based asset registration (Unsplash/external CDN URLs)
    const body = await req.json();
    title = body.title?.trim() || '';
    url = body.url?.trim() || '';
    category = body.category || 'clinic';
    fileSizeBytes = body.fileSizeBytes || 0;
    mimeType = body.mimeType || 'image/jpeg';
    dimensions = body.dimensions || '';

    if (!url) {
      throw new AppError('E-1101', 'Asset URL is required');
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      mimeType = 'image/jpeg';
    }
  }

  if (!title) title = 'Clinical Media Asset';

  // Check storage quota before saving
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const quotaRes = await client.query(
      `SELECT storage_bytes FROM usage_counters WHERE tenant_id = $1`,
      [tenantId]
    );
    const currentStorageBytes = quotaRes.rows[0]?.storage_bytes ?? 0;

    if (currentStorageBytes + fileSizeBytes > STORAGE_QUOTA_BYTES) {
      throw new AppError('E-1603', `Storage quota exceeded. Used: ${(currentStorageBytes / 1_048_576).toFixed(1)} MB of 1024 MB.`);
    }

    const res = await client.query(
      `INSERT INTO media_assets (tenant_id, title, url, file_size_bytes, mime_type, dimensions, category, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, title, url, file_size_bytes, mime_type, dimensions, assigned_to, category, uploaded_at`,
      [tenantId, title, url, fileSizeBytes, mimeType, dimensions, category]
    );

    const newAsset = res.rows[0];

    // Update storage quota counter
    if (fileSizeBytes > 0) {
      await client.query(
        `INSERT INTO usage_counters (tenant_id, period_start, storage_bytes)
         VALUES ($1, CURRENT_DATE, $2)
         ON CONFLICT (tenant_id) DO UPDATE SET storage_bytes = usage_counters.storage_bytes + $2, updated_at = NOW()`,
        [tenantId, fileSizeBytes]
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'media.uploaded',
      target: `media_asset:${newAsset.id}`,
      details: { title, mimeType, fileSizeBytes, category },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      asset: {
        id: newAsset.id,
        title: newAsset.title,
        url: newAsset.url,
        fileSizeBytes: newAsset.file_size_bytes,
        fileSize: `${(newAsset.file_size_bytes / 1024).toFixed(0)} KB`,
        mimeType: newAsset.mime_type,
        dimensions: newAsset.dimensions || '',
        assignedTo: newAsset.assigned_to || 'unassigned',
        category: newAsset.category,
        uploadedAt: newAsset.uploaded_at.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

