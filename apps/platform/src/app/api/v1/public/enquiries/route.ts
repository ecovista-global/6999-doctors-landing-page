import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { encrypt } from '@/lib/crypto';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  processIdempotency,
  saveIdempotencyResponse,
  clearIdempotency,
} from '@/lib/idempotency';
import { validateSpamProtection } from '@/lib/spam-protection';
import { enquirySubmissionSchema } from '@/lib/enquiry-schemas';

// ==============================================================================
// 1. CORS Preflight & Security Headers
// ==============================================================================
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Idempotency-Key, X-Request-ID, X-Trace-ID, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ==============================================================================
// 2. Main POST Handler (/v1/public/enquiries)
// ==============================================================================
export const POST = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const origin = req.headers.get('origin') || '*';
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // --- 1. Rate Limiting (5/min/IP per SD-002) ---
  const rl = checkRateLimit(clientIp, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        type: 'https://api.doctorsite.in/errors/e-1501',
        title: 'Rate limited',
        status: 429,
        code: 'E-1501',
        detail: 'Too many attempts, try later.',
        traceId: ctx.traceId,
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'Retry-After': String(rl.resetSeconds),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.resetSeconds),
          'Access-Control-Allow-Origin': origin,
        },
      }
    );
  }

  // --- 2. Idempotency Key Validation (SD-001) ---
  const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();
  if (!idempotencyKey) {
    throw new AppError('E-1304', 'Missing Idempotency-Key header on mutating request');
  }

  const rawBodyText = await req.text();
  const idemResult = processIdempotency(idempotencyKey, rawBodyText);

  if (idemResult.isReplay && idemResult.record) {
    return NextResponse.json(idemResult.record.body, {
      status: idemResult.record.status,
      headers: {
        ...idemResult.record.headers,
        'X-Idempotent-Replay': 'true',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  // --- 3. Parse & Validate Payload with Zod (E-1101) ---
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(rawBodyText);
  } catch {
    clearIdempotency(idempotencyKey);
    throw new AppError('E-1101', 'Malformed JSON payload');
  }

  const validationResult = enquirySubmissionSchema.safeParse(jsonPayload);
  if (!validationResult.success) {
    clearIdempotency(idempotencyKey);
    const invalidParams = validationResult.error.errors.map((err) => ({
      name: err.path.join('.'),
      reason: err.message,
    }));
    throw new AppError('E-1101', 'Validation failed for enquiry submission', invalidParams);
  }

  const data = validationResult.data;

  // --- 3.1 Bot & Spam Protection (SD-055 / E-1604) ---
  try {
    await validateSpamProtection({
      honeypot: data.honeypot,
      formRenderedAt: data.formRenderedAt,
      turnstileToken: data.turnstileToken,
      clientIp,
    });
  } catch (err) {
    clearIdempotency(idempotencyKey);
    throw err;
  }

  // --- 4. Database Transaction: Insert Encrypted Enquiry + Outbox Event ---
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 4.1 Resolve Tenant ID
    let resolvedTenantId = data.tenantId;

    if (!resolvedTenantId && data.clinicSlug) {
      const tenantLookup = await client.query(
        'SELECT id FROM tenants WHERE slug = $1 LIMIT 1',
        [data.clinicSlug]
      );
      if (tenantLookup.rowCount && tenantLookup.rowCount > 0) {
        resolvedTenantId = tenantLookup.rows[0].id;
      }
    }

    if (!resolvedTenantId) {
      const defaultTenantLookup = await client.query(
        'SELECT id FROM tenants WHERE status = $1 ORDER BY created_at ASC LIMIT 1',
        ['active']
      );
      if (defaultTenantLookup.rowCount && defaultTenantLookup.rowCount > 0) {
        resolvedTenantId = defaultTenantLookup.rows[0].id;
      }
    }

    if (!resolvedTenantId) {
      throw new AppError('E-1101', 'Unable to resolve clinic tenant for enquiry');
    }

    // Tenant context for RLS
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [resolvedTenantId]);

    // 4.2 Check Database Idempotency Constraint Backstop
    const existingEnquiry = await client.query(
      'SELECT id, service, created_at FROM enquiries WHERE idempotency_key = $1',
      [idempotencyKey]
    );

    if (existingEnquiry.rowCount && existingEnquiry.rowCount > 0) {
      await client.query('COMMIT');
      const replayPayload = {
        status: 'accepted',
        enquiryId: existingEnquiry.rows[0].id,
        service: existingEnquiry.rows[0].service,
        message: 'Enquiry received and queued for clinic team response.',
      };

      saveIdempotencyResponse(idempotencyKey, rawBodyText, 202, replayPayload);

      return NextResponse.json(replayPayload, {
        status: 202,
        headers: {
          'X-Idempotent-Replay': 'true',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }

    // 4.3 Encrypt Patient PII using AES-256-GCM
    const nameEnc = encrypt(data.name);
    const phoneEnc = encrypt(data.phone);
    const emailEnc = data.email ? encrypt(data.email) : null;
    const messageEnc = encrypt(data.message);

    // 4.4 Insert Enquiry Record
    const insertEnquiryRes = await client.query(
      `INSERT INTO enquiries (
        tenant_id,
        name_enc,
        phone_enc,
        email_enc,
        message_enc,
        service,
        status,
        consent_at,
        idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8)
      RETURNING id, created_at, consent_at`,
      [
        resolvedTenantId,
        nameEnc,
        phoneEnc,
        emailEnc,
        messageEnc,
        data.service || null,
        'pending',
        idempotencyKey,
      ]
    );

    const createdEnquiry = insertEnquiryRes.rows[0];
    const enquiryId = createdEnquiry.id;

    // 4.5 Insert Transactional Outbox Event for Asynchronous Notification
    await client.query(
      `INSERT INTO outbox_events (
        tenant_id,
        type,
        payload
      ) VALUES ($1, $2, $3)`,
      [
        resolvedTenantId,
        'enquiry.created',
        JSON.stringify({
          enquiryId,
          tenantId: resolvedTenantId,
          service: data.service || 'General Enquiry',
          createdAt: createdEnquiry.created_at,
        }),
      ]
    );

    await client.query('COMMIT');

    const successPayload = {
      status: 'accepted',
      enquiryId,
      service: data.service || null,
      message: 'Enquiry received and queued for clinic team response.',
    };

    saveIdempotencyResponse(idempotencyKey, rawBodyText, 202, successPayload);

    return NextResponse.json(successPayload, {
      status: 202,
      headers: {
        Location: `/v1/public/enquiries/${enquiryId}`,
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'Access-Control-Allow-Origin': origin,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    clearIdempotency(idempotencyKey);
    throw err;
  } finally {
    client.release();
  }
});
