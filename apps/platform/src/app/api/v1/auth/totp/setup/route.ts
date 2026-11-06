import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { encrypt } from '@/lib/crypto';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import {
  generateTotpSecret,
  generateTotpUri,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '@/lib/totp';

const setupSchema = z.object({
  userId: z.string().uuid(),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError('E-1101', 'Malformed JSON payload');
  }

  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('E-1101', 'Invalid setup parameters', [
      { name: 'userId', reason: 'Valid UUID userId is required' },
    ]);
  }

  const { userId } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

    const userRes = await client.query(
      'SELECT id, email, role, tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw new AppError('E-1101', 'User account not found');
    }

    const user = userRes.rows[0];

    // 1. Generate TOTP secret and recovery codes
    const secret = generateTotpSecret();
    const recoveryCodes = generateRecoveryCodes(8);
    const recoveryHashes = recoveryCodes.map(hashRecoveryCode);
    const uri = generateTotpUri(user.email, secret, 'DoctorSite Clinic');

    // 2. Encrypt TOTP bundle with AES-256-GCM
    const bundlePayload = JSON.stringify({
      secret,
      recoveryHashes,
      createdAt: new Date().toISOString(),
      pendingVerification: true,
    });
    const secretEnc = 'enc:v1:' + encrypt(bundlePayload).toString('base64');

    // 3. Store in users table
    await client.query(
      `UPDATE users
       SET totp_secret_enc = $1,
           totp_enabled = false
       WHERE id = $2`,
      [secretEnc, userId]
    );

    return NextResponse.json(
      {
        success: true,
        secret,
        uri,
        recoveryCodes,
      },
      { status: 200 }
    );
  } finally {
    client.release();
  }
});
