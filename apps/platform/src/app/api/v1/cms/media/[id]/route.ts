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

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) throw new AppError('E-1101', 'Asset id is required');

  const body = await req.json();
  const { title, assignedTo, category } = body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `UPDATE media_assets
       SET title = COALESCE($1, title),
           assigned_to = COALESCE($2, assigned_to),
           category = COALESCE($3, category)
       WHERE id = $4 AND tenant_id = $5
       RETURNING id, title, url, file_size_bytes, mime_type, dimensions, assigned_to, category, uploaded_at`,
      [
        title?.trim() || null,
        assignedTo || null,
        category || null,
        id,
        tenantId,
      ]
    );

    if (res.rowCount === 0) throw new AppError('E-1101', 'Media asset not found');

    const asset = res.rows[0];

    // If a previous assignment was 'unassigned' or we changed assignment, unassign other assets with the same role
    if (assignedTo && assignedTo !== 'unassigned') {
      await client.query(
        `UPDATE media_assets
         SET assigned_to = 'unassigned'
         WHERE tenant_id = $1 AND assigned_to = $2 AND id <> $3`,
        [tenantId, assignedTo, id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        title: asset.title,
        url: asset.url,
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

  if (!id) throw new AppError('E-1101', 'Asset id is required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // Fetch file size before deletion to decrement quota
    const fetchRes = await client.query(
      `SELECT file_size_bytes FROM media_assets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (fetchRes.rowCount === 0) throw new AppError('E-1101', 'Media asset not found');

    const fileSizeBytes = fetchRes.rows[0].file_size_bytes;

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

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

