import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORAGE_QUOTA_BYTES = 1_073_741_824;

function resolvePublicUploadsDir(): string {
  const monoPublic = path.join(process.cwd(), 'apps', 'platform', 'public');
  const basePublic = existsSync(monoPublic) ? monoPublic : path.join(process.cwd(), 'public');
  return path.join(basePublic, 'uploads');
}

function getIdFromRequest(req: NextRequest): string {
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id || !UUID_RE.test(id)) throw new AppError('E-1101', 'Invalid asset id');
  if (!UUID_RE.test(tenantId)) throw new AppError('E-1101', 'Invalid tenantId');

  const body = await req.json();
  const { title, assignedTo, category, url, mimeType, fileSizeBytes } = body;

  if (url !== undefined) {
    const trimmedUrl = String(url).trim();
    const isValidUrl =
      trimmedUrl.startsWith('/') ||
      /^https?:\/\//i.test(trimmedUrl) ||
      /^data:image\/(jpeg|png|webp|gif|svg\+xml);/i.test(trimmedUrl);
    if (!trimmedUrl || !isValidUrl) {
      throw new AppError('E-1201', 'Unsupported image URL scheme.');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const prevRes = await client.query(
      `SELECT file_size_bytes FROM media_assets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (prevRes.rowCount === 0) throw new AppError('E-1101', 'Media asset not found');

    const prevSize: number = prevRes.rows[0].file_size_bytes ?? 0;
    const nextSize: number | null = typeof fileSizeBytes === 'number' && Number.isFinite(fileSizeBytes)
      ? Math.max(0, Math.trunc(fileSizeBytes))
      : null;
    const sizeDelta = nextSize !== null ? nextSize - prevSize : 0;

    if (sizeDelta > 0) {
      const quotaRes = await client.query(
        `SELECT storage_bytes FROM usage_counters WHERE tenant_id = $1`,
        [tenantId]
      );
      const currentStorageBytes = quotaRes.rows[0]?.storage_bytes ?? 0;
      if (currentStorageBytes + sizeDelta > STORAGE_QUOTA_BYTES) {
        throw new AppError('E-1602', 'Storage quota exceeded.');
      }
    }

    const res = await client.query(
      `UPDATE media_assets
       SET title = COALESCE($1, title),
           assigned_to = COALESCE($2, assigned_to),
           category = COALESCE($3, category),
           url = COALESCE($4, url),
           mime_type = COALESCE($5, mime_type),
           file_size_bytes = COALESCE($6, file_size_bytes)
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, title, url, storage_key, file_size_bytes, mime_type, dimensions, assigned_to, category, uploaded_at`,
      [
        title?.trim() || null,
        assignedTo || null,
        category || null,
        url ? String(url).trim() : null,
        mimeType || null,
        nextSize,
        id,
        tenantId,
      ]
    );

    const asset = res.rows[0];

    if (sizeDelta !== 0) {
      await client.query(
        `UPDATE usage_counters
         SET storage_bytes = GREATEST(0, storage_bytes + $1), updated_at = NOW()
         WHERE tenant_id = $2`,
        [sizeDelta, tenantId]
      );
    }

    // Unassign other assets previously holding this exclusive role
    if (assignedTo && assignedTo !== 'unassigned') {
      await client.query(
        `UPDATE media_assets
         SET assigned_to = 'unassigned'
         WHERE tenant_id = $1 AND assigned_to = $2 AND id <> $3`,
        [tenantId, assignedTo, id]
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'media.updated',
      target: `media_asset:${id}`,
      details: { title: asset.title, assignedTo: asset.assigned_to, category: asset.category },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        title: asset.title,
        url: asset.url,
        storageKey: asset.storage_key,
        fileSizeBytes: asset.file_size_bytes,
        fileSize: `${(asset.file_size_bytes / 1024).toFixed(0)} KB`,
        mimeType: asset.mime_type,
        dimensions: asset.dimensions || '',
        assignedTo: asset.assigned_to || 'unassigned',
        category: asset.category,
        uploadedAt: asset.uploaded_at.toISOString(),
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

  if (!id || !UUID_RE.test(id)) throw new AppError('E-1101', 'Invalid asset id');
  if (!UUID_RE.test(tenantId)) throw new AppError('E-1101', 'Invalid tenantId');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const fetchRes = await client.query(
      `SELECT file_size_bytes, url FROM media_assets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (fetchRes.rowCount === 0) throw new AppError('E-1101', 'Media asset not found');

    const fileSizeBytes: number = fetchRes.rows[0].file_size_bytes ?? 0;
    const assetUrl: string = fetchRes.rows[0].url ?? '';

    await client.query(
      `DELETE FROM media_assets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    // Decrement storage quota
    if (fileSizeBytes > 0) {
      await client.query(
        `UPDATE usage_counters
         SET storage_bytes = GREATEST(0, storage_bytes - $1), updated_at = NOW()
         WHERE tenant_id = $2`,
        [fileSizeBytes, tenantId]
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'media.deleted',
      target: `media_asset:${id}`,
      details: { fileSizeBytes },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    if (assetUrl.startsWith('/uploads/')) {
      const diskName = path.basename(assetUrl);
      const candidate = path.join(resolvePublicUploadsDir(), diskName);
      if (diskName && existsSync(candidate)) {
        await unlink(candidate).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

