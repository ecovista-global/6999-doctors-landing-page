import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { GET as getMedia, POST as postMedia } from '../src/app/api/v1/cms/media/route';
import { PUT as putMediaAsset, DELETE as deleteMediaAsset } from '../src/app/api/v1/cms/media/[id]/route';

function resolveUploadsDir(): string {
  const monoPublic = path.join(process.cwd(), 'apps', 'platform', 'public');
  const basePublic = existsSync(monoPublic) ? monoPublic : path.join(process.cwd(), 'public');
  return path.join(basePublic, 'uploads');
}

describe('MT-123: Media Library Upload, Magic-Byte Validation & 1 GB Quota', () => {
  const tenantId = randomUUID();
  const createdIds: string[] = [];

  // Minimal valid 1x1 PNG bytes
  const PNG_BYTES = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `media-test-${Date.now()}`, 'Media Test Clinic', 'active']
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  after(async () => {
    for (const id of createdIds) {
      await deleteMediaAsset(
        new NextRequest(`http://localhost:3000/api/v1/cms/media/${id}?tenantId=${tenantId}`, {
          method: 'DELETE',
        })
      ).catch(() => {});
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query("SELECT set_config('app.bypass_audit_immutability', 'on', true)");
      await client.query('DELETE FROM media_assets WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM usage_counters WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('rejects magic-byte spoofed shell script disguised as .png with 422 E-1201', async () => {
    const form = new FormData();
    const fakePng = new File([Buffer.from('#!/bin/sh\nrm -rf /\n')], 'malware.png', { type: 'image/png' });
    form.append('file', fakePng);
    form.append('title', 'Spoofed Image');

    const req = new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`, {
      method: 'POST',
      body: form,
    });
    const res = await postMedia(req);
    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.code, 'E-1201');
  });

  it('rejects unsafe javascript: URL scheme with 422 E-1201', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'XSS URL', url: 'javascript:alert(1)' }),
    });
    const res = await postMedia(req);
    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.code, 'E-1201');
  });

  it('sanitizes malicious SVG script tags & event handlers before saving to uploads', async () => {
    const dirtySvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="steal()"><script>alert(1)</script><circle cx="20" cy="20" r="10"/></svg>`;
    const form = new FormData();
    form.append('file', new File([Buffer.from(dirtySvg)], 'clinic-logo.svg', { type: 'image/svg+xml' }));
    form.append('title', 'Sanitized Crest');
    form.append('category', 'brand');

    const res = await postMedia(
      new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`, {
        method: 'POST',
        body: form,
      })
    );
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    createdIds.push(data.asset.id);
    assert.ok(data.asset.url.startsWith('/uploads/'));

    const diskPath = path.join(resolveUploadsDir(), path.basename(data.asset.url));
    const savedSvg = await readFile(diskPath, 'utf8');
    assert.ok(savedSvg.includes('<circle'));
    assert.ok(!savedSvg.includes('<script'));
    assert.ok(!savedSvg.includes('onload'));
    assert.ok(!savedSvg.includes('alert(1)'));
  });

  it('uploads PNG, assigns exclusive roles, increments quota, and cleans up disk file on DELETE', async () => {
    const form1 = new FormData();
    form1.append('file', new File([PNG_BYTES], 'doctor-one.png', { type: 'image/png' }));
    form1.append('title', 'Doctor Photo One');
    form1.append('category', 'doctor');

    const upload1 = await postMedia(
      new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`, { method: 'POST', body: form1 })
    );
    assert.strictEqual(upload1.status, 201);
    const { asset: asset1 } = await upload1.json();
    createdIds.push(asset1.id);

    const diskPath1 = path.join(resolveUploadsDir(), path.basename(asset1.url));
    assert.ok(existsSync(diskPath1));

    const form2 = new FormData();
    form2.append('file', new File([PNG_BYTES], 'doctor-two.png', { type: 'image/png' }));
    form2.append('title', 'Doctor Photo Two');
    const upload2 = await postMedia(
      new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`, { method: 'POST', body: form2 })
    );
    assert.strictEqual(upload2.status, 201);
    const { asset: asset2 } = await upload2.json();
    createdIds.push(asset2.id);

    // Assign role exclusively to asset1, then reassign to asset2
    const assign1 = await putMediaAsset(
      new NextRequest(`http://localhost:3000/api/v1/cms/media/${asset1.id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: 'hero_doctor_portrait' }),
      })
    );
    assert.strictEqual(assign1.status, 200);

    const assign2 = await putMediaAsset(
      new NextRequest(`http://localhost:3000/api/v1/cms/media/${asset2.id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: 'hero_doctor_portrait' }),
      })
    );
    assert.strictEqual(assign2.status, 200);

    const listRes = await getMedia(
      new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`)
    );
    const listData = await listRes.json();
    const row1 = listData.assets.find((a: { id: string }) => a.id === asset1.id);
    const row2 = listData.assets.find((a: { id: string }) => a.id === asset2.id);
    assert.strictEqual(row1.assignedTo, 'unassigned');
    assert.strictEqual(row2.assignedTo, 'hero_doctor_portrait');
    const quotaBeforeDelete = listData.quota.usedBytes;
    assert.ok(quotaBeforeDelete >= PNG_BYTES.byteLength * 2);

    // Invalid UUID returns 422 E-1101
    const badIdRes = await putMediaAsset(
      new NextRequest(`http://localhost:3000/api/v1/cms/media/not-a-uuid?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Fail' }),
      })
    );
    assert.strictEqual(badIdRes.status, 422);

    // Delete asset1 and confirm quota decrements & disk file unlinked
    const delRes = await deleteMediaAsset(
      new NextRequest(`http://localhost:3000/api/v1/cms/media/${asset1.id}?tenantId=${tenantId}`, {
        method: 'DELETE',
      })
    );
    assert.strictEqual(delRes.status, 200);
    createdIds.splice(createdIds.indexOf(asset1.id), 1);
    assert.ok(!existsSync(diskPath1));

    const afterList = await (await getMedia(new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`))).json();
    assert.strictEqual(afterList.quota.usedBytes, quotaBeforeDelete - PNG_BYTES.byteLength);
  });

  it('blocks uploads exceeding 1 GB tenant storage quota with 429 E-1602', async () => {
    const client = await pool.connect();
    let prevBytes = 0;
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const r = await client.query('SELECT storage_bytes FROM usage_counters WHERE tenant_id = $1', [tenantId]);
      prevBytes = r.rows[0]?.storage_bytes ?? 0;
      await client.query('UPDATE usage_counters SET storage_bytes = 1073741800 WHERE tenant_id = $1', [tenantId]);
    } finally {
      client.release();
    }

    const form = new FormData();
    form.append('file', new File([PNG_BYTES], 'over-quota.png', { type: 'image/png' }));
    const res = await postMedia(
      new NextRequest(`http://localhost:3000/api/v1/cms/media?tenantId=${tenantId}`, { method: 'POST', body: form })
    );
    assert.strictEqual(res.status, 429);
    const json = await res.json();
    assert.strictEqual(json.code, 'E-1602');

    // Restore usage_counters cleanly
    const c2 = await pool.connect();
    try {
      await c2.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      await c2.query('UPDATE usage_counters SET storage_bytes = $1 WHERE tenant_id = $2', [prevBytes, tenantId]);
    } finally {
      c2.release();
    }
  });
});
