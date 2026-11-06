/**
 * Idempotency Engine (SD-001)
 * Enforces Idempotency-Key headers on mutating endpoints.
 * Provides caching, payload conflict detection, and in-flight deduplication.
 */

import crypto from 'node:crypto';
import { AppError } from './errors';

export interface IdempotencyResponseRecord {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

export interface IdempotencyRecord {
  hash: string;
  state: 'pending' | 'done';
  response: IdempotencyResponseRecord;
  expiresAt: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export interface IdempotencyCheckResult {
  isReplay: boolean;
  record?: IdempotencyResponseRecord;
}

/**
 * Validates the idempotency key and payload hash.
 * If key already processed, returns cached response.
 * If key is in-flight, throws AppError('E-1303').
 * If key was used with different payload, throws AppError('E-1302').
 * If key is new, marks it pending and returns { isReplay: false }.
 */
export function processIdempotency(
  key: string,
  rawBody: string,
  ttlMs: number = DEFAULT_IDEMPOTENCY_TTL_MS
): IdempotencyCheckResult {
  const hash = sha256(rawBody);
  const now = Date.now();
  const cached = idempotencyStore.get(key);

  if (cached && now < cached.expiresAt) {
    if (cached.hash !== hash) {
      throw new AppError(
        'E-1302',
        'Idempotency key reused with a different request payload body.'
      );
    }
    if (cached.state === 'pending') {
      throw new AppError(
        'E-1303',
        'Duplicate request in flight. Already sending, please wait.'
      );
    }
    return {
      isReplay: true,
      record: cached.response,
    };
  }

  // Mark pending
  idempotencyStore.set(key, {
    hash,
    state: 'pending',
    response: { status: 200, body: null },
    expiresAt: now + ttlMs,
  });

  return { isReplay: false };
}

/**
 * Commits a completed response for an idempotency key.
 */
export function saveIdempotencyResponse(
  key: string,
  rawBody: string,
  status: number,
  body: any,
  headers: Record<string, string> = {},
  ttlMs: number = DEFAULT_IDEMPOTENCY_TTL_MS
): void {
  const hash = sha256(rawBody);
  idempotencyStore.set(key, {
    hash,
    state: 'done',
    response: { status, body, headers },
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Removes an idempotency record (e.g. on unhandled rollback/error).
 */
export function clearIdempotency(key: string): void {
  idempotencyStore.delete(key);
}

/**
 * Resets in-memory idempotency store (for hermetic test execution).
 */
export function resetIdempotencyStore(): void {
  idempotencyStore.clear();
}

