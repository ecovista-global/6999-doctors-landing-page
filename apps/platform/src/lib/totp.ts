/**
 * RFC-6238 Time-Based One-Time Password (TOTP) Engine (SD-056)
 * - Base32 secret generation & decoding
 * - HMAC-SHA1 6-digit TOTP calculation with drift tolerance
 * - Single-use recovery backup codes
 * - Brute-force rate limiting & lockout (5 attempts / 15 min)
 */

import crypto from 'node:crypto';
import { AppError } from './errors';

// Base32 Alphabet per RFC-4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i]!;
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random 20-byte (160-bit) Base32 secret
 */
export function generateTotpSecret(bytes = 20): string {
  const randomBytes = crypto.randomBytes(bytes);
  return encodeBase32(randomBytes);
}

/**
 * Generates an otpauth:// URI for authenticator QR codes
 */
export function generateTotpUri(
  email: string,
  secret: string,
  issuer: string = 'DoctorSite'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a 6-digit TOTP code for a given counter/step
 */
export function generateTotpCode(secretBase32: string, step: number): string {
  const key = decodeBase32(secretBase32);

  // Counter as 8-byte big-endian buffer
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(step), 0);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();

  // Dynamic truncation (RFC-4226)
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const codeInt =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const code = (codeInt % 1_000_000).toString().padStart(6, '0');
  return code;
}

/**
 * Computes current 30-second time step
 */
export function getCurrentTimeStep(timestampMs: number = Date.now(), periodSeconds = 30): number {
  return Math.floor(timestampMs / 1000 / periodSeconds);
}

/**
 * Verifies a 6-digit TOTP code with time-step drift tolerance (+/- toleranceSteps)
 */
export function verifyTotpCode(
  code: string,
  secretBase32: string,
  toleranceSteps: number = 1,
  timestampMs: number = Date.now()
): boolean {
  if (!/^\d{6}$/.test(code.trim())) {
    return false;
  }

  const currentStep = getCurrentTimeStep(timestampMs);

  for (let offset = -toleranceSteps; offset <= toleranceSteps; offset++) {
    const stepToTest = currentStep + offset;
    const expectedCode = generateTotpCode(secretBase32, stepToTest);
    if (crypto.timingSafeEqual(Buffer.from(code.trim()), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates 8 single-use alphanumeric recovery backup codes (e.g. "ABCD-1234")
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${rand.substring(0, 4)}-${rand.substring(4, 8)}`);
  }
  return codes;
}

/**
 * Hashes a recovery code for secure database storage
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * In-memory brute force tracker (5 attempts per 15 minutes per user/IP)
 */
interface AttemptRecord {
  attempts: number;
  lockoutUntil: number;
}

const lockoutStore = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkTotpRateLimit(identifier: string): void {
  const now = Date.now();
  const record = lockoutStore.get(identifier);

  if (record) {
    if (now < record.lockoutUntil) {
      const waitSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      throw new AppError(
        'E-1501',
        `Account temporarily locked due to repeated invalid 2FA attempts. Retry after ${waitSeconds}s.`
      );
    }
    // Expired lockout reset
    if (now > record.lockoutUntil && record.attempts >= MAX_ATTEMPTS) {
      lockoutStore.delete(identifier);
    }
  }
}

export function recordTotpFailure(identifier: string): void {
  const now = Date.now();
  const record = lockoutStore.get(identifier) || { attempts: 0, lockoutUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_WINDOW_MS;
  }

  lockoutStore.set(identifier, record);
}

export function resetTotpAttempts(identifier: string): void {
  lockoutStore.delete(identifier);
}

export function clearLockoutStore(): void {
  lockoutStore.clear();
}
