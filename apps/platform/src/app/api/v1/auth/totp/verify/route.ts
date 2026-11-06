import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { encrypt, decrypt } from '@/lib/crypto';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import {
  verifyTotpCode,
  hashRecoveryCode,
  checkTotpRateLimit,
  recordTotpFailure,
  resetTotpAttempts,
} from '@/lib/totp';

const verifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().min(1, 'Verification code is required'),
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

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('E-1101', 'Invalid verification parameters');
  }

  const { userId, code } = parsed.data;

  // 1. Check brute force rate limit / account lockout (SD-056)
  checkTotpRateLimit(userId);

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

    const userRes = await client.query(
      'SELECT id, email, role, totp_secret_enc, totp_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw new AppError('E-1101', 'User not found');
    }

    const user = userRes.rows[0];
    if (!user.totp_secret_enc) {
      throw new AppError('E-1605', '2FA is not set up on this account');
    }

    // 2. Decrypt TOTP bundle
    let bundle: { secret: string; recoveryHashes: string[] };
    try {
      const decryptedJson = decrypt(user.totp_secret_enc);
      bundle = JSON.parse(decryptedJson);
    } catch {
      throw new AppError('E-1605', 'Failed to decrypt 2FA secrets');
    }

    const cleanCode = code.trim();
    let isSuccess = false;
    let usedRecoveryCode = false;

    // 3. Try standard 6-digit TOTP verification
    if (/^\d{6}$/.test(cleanCode)) {
      if (verifyTotpCode(cleanCode, bundle.secret)) {
        isSuccess = true;
      }
    }

    // 4. Try Backup Recovery Code if not matched as TOTP
    if (!isSuccess && bundle.recoveryHashes && Array.isArray(bundle.recoveryHashes)) {
      const inputHash = hashRecoveryCode(cleanCode);
      const hashIndex = bundle.recoveryHashes.indexOf(inputHash);
      if (hashIndex !== -1) {
        isSuccess = true;
        usedRecoveryCode = true;
        // Invalidate single-use recovery code
        bundle.recoveryHashes.splice(hashIndex, 1);
      }
    }

    // 5. Handle Failure
    if (!isSuccess) {
      recordTotpFailure(userId);
      throw new AppError('E-1605', 'Invalid or expired verification code.');
    }

    // 6. Handle Success
    resetTotpAttempts(userId);

    // Re-encrypt bundle if recovery code was spent
    const updatedSecretEnc = usedRecoveryCode
      ? 'enc:v1:' + encrypt(JSON.stringify(bundle)).toString('base64')
      : user.totp_secret_enc;

    await client.query(
      `UPDATE users
       SET totp_enabled = true,
           totp_secret_enc = $1,
           last_login_at = now()
       WHERE id = $2`,
      [updatedSecretEnc, userId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Two-factor authentication verified successfully',
        usedRecoveryCode,
        remainingRecoveryCodes: bundle.recoveryHashes ? bundle.recoveryHashes.length : 0,
      },
      { status: 200 }
    );
  } finally {
    client.release();
  }
});
