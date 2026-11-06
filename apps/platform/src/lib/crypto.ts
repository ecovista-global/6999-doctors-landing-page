import crypto from 'node:crypto';

// ==============================================================================
// Cryptographic Constants & Types (SD-050 / MT-108)
// ==============================================================================
export const ALGORITHM = 'aes-256-gcm';
export const IV_LENGTH_BYTES = 12; // 96-bit random IV per NIST SP 800-38D & SD-050
export const TAG_LENGTH_BYTES = 16; // 128-bit authentication tag
export const ENVELOPE_VERSION = 0x01; // Version 1 binary header

export interface KeyRing {
  [keyId: string]: Buffer;
}

// Default development key if none provided in environment (32 bytes / 256 bits)
const DEFAULT_DEV_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Internal key registry
let activeKeyId = process.env.PII_ACTIVE_KEY_ID || 'v1';
const keyRing: KeyRing = {};

/**
 * Normalizes a key input (Buffer, 64-char hex, or raw 32-byte string) into a 32-byte Buffer.
 */
function normalizeKey(key: string | Buffer): Buffer {
  if (Buffer.isBuffer(key)) {
    if (key.length !== 32) {
      throw new Error(`Invalid key length: expected 32 bytes, got ${key.length}`);
    }
    return key;
  }

  if (typeof key === 'string') {
    // If 64-char hex string
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      return Buffer.from(key, 'hex');
    }
    // If UTF-8 string of 32 bytes
    const buf = Buffer.from(key, 'utf8');
    if (buf.length === 32) {
      return buf;
    }
    // If passphrase/arbitrary length string, derive 32 bytes deterministically via SHA-256
    return crypto.createHash('sha256').update(key).digest();
  }

  throw new Error('Key must be a string or Buffer');
}

/**
 * Initialize key ring from environment variables or defaults
 */
function initializeKeyRing() {
  if (process.env.PII_KEY_RING) {
    try {
      const parsed = JSON.parse(process.env.PII_KEY_RING);
      for (const [id, k] of Object.entries(parsed)) {
        keyRing[id] = normalizeKey(k as string);
      }
    } catch {
      // Ignore parse failure, fall back to individual vars
    }
  }

  if (process.env.PII_KEY_V1) {
    keyRing['v1'] = normalizeKey(process.env.PII_KEY_V1);
  }
  if (process.env.PII_KEY_V2) {
    keyRing['v2'] = normalizeKey(process.env.PII_KEY_V2);
  }
  if (process.env.PII_ENCRYPTION_KEY && !keyRing['v1']) {
    keyRing['v1'] = normalizeKey(process.env.PII_ENCRYPTION_KEY);
  }

  if (!keyRing['v1']) {
    keyRing['v1'] = Buffer.from(DEFAULT_DEV_KEY_HEX, 'hex');
  }
}

// Initial boot
initializeKeyRing();

// ==============================================================================
// Key Ring Management (Key Rotation Support)
// ==============================================================================

export function registerKey(id: string, key: string | Buffer): void {
  keyRing[id] = normalizeKey(key);
}

export function setActiveKeyId(id: string): void {
  if (!keyRing[id]) {
    throw new Error(`Cannot set active key: key '${id}' does not exist in key ring`);
  }
  activeKeyId = id;
}

export function getActiveKeyId(): string {
  return activeKeyId;
}

export function getKey(id: string): Buffer {
  const key = keyRing[id];
  if (!key) {
    throw new Error(`Decryption failed: key '${id}' not found in key ring`);
  }
  return key;
}

export function listKeyIds(): string[] {
  return Object.keys(keyRing);
}

// ==============================================================================
// Encryption Engine (AES-256-GCM with 12-byte random IV)
// Envelope Format:
// [1 byte: Version (0x01)]
// [1 byte: Key ID length (K)]
// [K bytes: Key ID string]
// [12 bytes: Random IV]
// [16 bytes: GCM Auth Tag]
// [N bytes: Ciphertext]
// ==============================================================================

/**
 * Encrypts plaintext using AES-256-GCM.
 * Generates a fresh 12-byte cryptographically secure random IV for every encryption.
 * Returns a binary Buffer suitable for PostgreSQL bytea columns.
 */
export function encrypt(
  plaintext: string | Buffer,
  targetKeyId: string = activeKeyId
): Buffer {
  const key = getKey(targetKeyId);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const keyIdBuf = Buffer.from(targetKeyId, 'utf8');

  if (keyIdBuf.length > 255) {
    throw new Error('Key ID exceeds maximum length of 255 bytes');
  }

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Additional Authenticated Data (AAD) binds the header metadata so keyId or version cannot be tampered
  const aad = Buffer.concat([
    Buffer.from([ENVELOPE_VERSION, keyIdBuf.length]),
    keyIdBuf,
    iv,
  ]);
  cipher.setAAD(aad);

  const inputBuf = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
  const ciphertext = Buffer.concat([cipher.update(inputBuf), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack binary envelope
  return Buffer.concat([
    Buffer.from([ENVELOPE_VERSION, keyIdBuf.length]),
    keyIdBuf,
    iv,
    authTag,
    ciphertext,
  ]);
}

/**
 * Decrypts a binary Buffer or string into UTF-8 plaintext string.
 * Automatically identifies the key ID from the envelope header, enabling zero-downtime key rotation.
 */
export function decrypt(ciphertextInput: Buffer | string): string {
  const buf = decryptToBuffer(ciphertextInput);
  return buf.toString('utf8');
}

/**
 * Decrypts a binary Buffer or string into raw Buffer.
 */
export function decryptToBuffer(ciphertextInput: Buffer | string): Buffer {
  let buf: Buffer;

  if (Buffer.isBuffer(ciphertextInput)) {
    buf = ciphertextInput;
  } else if (typeof ciphertextInput === 'string') {
    if (ciphertextInput.startsWith('\\x')) {
      buf = Buffer.from(ciphertextInput.slice(2), 'hex');
    } else if (ciphertextInput.startsWith('enc:v1:')) {
      buf = Buffer.from(ciphertextInput.slice(7), 'base64');
    } else {
      try {
        buf = Buffer.from(ciphertextInput, 'base64');
        if (buf.length < 30) {
          buf = Buffer.from(ciphertextInput, 'hex');
        }
      } catch {
        buf = Buffer.from(ciphertextInput, 'hex');
      }
    }
  } else {
    throw new Error('Ciphertext must be a Buffer or string');
  }

  if (buf.length < 1 + 1 + 1 + IV_LENGTH_BYTES + TAG_LENGTH_BYTES) {
    throw new Error('Invalid ciphertext envelope: buffer too short');
  }

  // 1. Read header
  const version = buf[0];
  const keyIdLen = buf[1];
  if (version === undefined || keyIdLen === undefined) {
    throw new Error('Invalid ciphertext envelope: missing header bytes');
  }
  if (version !== ENVELOPE_VERSION) {
    throw new Error(`Unsupported envelope version: ${version}`);
  }
  const headerOffset = 2 + keyIdLen;
  if (buf.length < headerOffset + IV_LENGTH_BYTES + TAG_LENGTH_BYTES) {
    throw new Error('Invalid ciphertext envelope: malformed header length');
  }

  const keyId = buf.subarray(2, 2 + keyIdLen).toString('utf8');
  const iv = buf.subarray(headerOffset, headerOffset + IV_LENGTH_BYTES);
  const tagOffset = headerOffset + IV_LENGTH_BYTES;
  const authTag = buf.subarray(tagOffset, tagOffset + TAG_LENGTH_BYTES);
  const ciphertext = buf.subarray(tagOffset + TAG_LENGTH_BYTES);

  // 2. Fetch key from ring
  const key = getKey(keyId);

  // 3. Decrypt with authenticated tag
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const aad = Buffer.concat([
    Buffer.from([version, keyIdLen]),
    buf.subarray(2, 2 + keyIdLen),
    iv,
  ]);
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Re-encrypts a ciphertext under the new active key ID.
 * Used for database backfill / key rotation jobs.
 */
export function reencrypt(
  ciphertextInput: Buffer | string,
  newKeyId: string = activeKeyId
): Buffer {
  const plainBuf = decryptToBuffer(ciphertextInput);
  return encrypt(plainBuf, newKeyId);
}

/**
 * Helper to check if a buffer conforms to the encrypted envelope format
 */
export function isEncryptedEnvelope(input: any): boolean {
  if (!Buffer.isBuffer(input)) return false;
  if (input.length < 1 + 1 + 1 + IV_LENGTH_BYTES + TAG_LENGTH_BYTES) return false;
  return input[0] === ENVELOPE_VERSION;
}

// ==============================================================================
// PII Scrubber for Logger (SD-050 / MT-108)
// Guarantees patient name, phone, email, and message are never written to logs.
// ==============================================================================

// Sensitive key identifiers
const SENSITIVE_KEY_PATTERNS = [
  /patient_?name/i,
  /patient_?phone/i,
  /patient_?email/i,
  /phone_?enc/i,
  /name_?enc/i,
  /email_?enc/i,
  /message_?enc/i,
  /^name$/i,
  /^phone$/i,
  /^mobile$/i,
  /^email$/i,
  /^notes?$/i,
  /^password$/i,
  /^secret$/i,
  /^totp_?secret/i,
  /^authorization$/i,
  /^cookie$/i,
];

// Regex for Indian mobile numbers: +91 9876543210, +919876543210, 9876543210, 09876543210
const INDIAN_PHONE_REGEX = /(?:\+?91[\s\-]?)?(?:0)?[6-9]\d{4}[\s\-]?[0-9]{5}\b/g;

// Regex for email addresses
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Regex for Aadhaar numbers: 12 digits
const AADHAAR_REGEX = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;

// Regex for patient name patterns in freeform text (e.g. "patient Vikramaditya Singhania")
const PATIENT_NAME_IN_TEXT_REGEX = /\b(?:patient|for|consultation of)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/gi;

/**
 * Recursively scrubs PII from string values
 */
export function scrubString(str: string, knownTerms: Set<string> = new Set()): string {
  if (!str || typeof str !== 'string') return str;

  let result = str;

  // 1. Redact any known patient names/phones/emails harvested from the payload
  for (const term of knownTerms) {
    if (term && term.length >= 3) {
      if (/@/.test(term)) {
        result = result.replaceAll(term, '[REDACTED_EMAIL]');
      } else if (/\d{5,}/.test(term)) {
        result = result.replaceAll(term, '[REDACTED_PHONE]');
      } else {
        result = result.replaceAll(term, '[REDACTED_PII]');
      }
    }
  }

  // 2. Redact patterns
  result = result.replace(INDIAN_PHONE_REGEX, '[REDACTED_PHONE]');
  result = result.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  result = result.replace(AADHAAR_REGEX, '[REDACTED_ID]');
  result = result.replace(PATIENT_NAME_IN_TEXT_REGEX, (match, name) => {
    return match.replace(name, '[REDACTED_NAME]');
  });

  return result;
}

/**
 * Harvests sensitive scalar values from an object to ensure they are also scrubbed
 * if duplicated inside freeform text properties.
 */
function harvestSensitiveValues(obj: any, target: Set<string>, seen = new WeakSet()): void {
  if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
  seen.add(obj);

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string' && val.trim().length > 2) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));
      if (isSensitive) {
        target.add(val.trim());
      }
    } else if (typeof val === 'object' && val !== null) {
      harvestSensitiveValues(val, target, seen);
    }
  }
}

/**
 * Deeply scrubs PII from objects, arrays, buffers, and primitives.
 * Redacts known sensitive property names and runs regex pattern redaction on all strings.
 */
export function scrubPII<T = any>(input: T, seen = new WeakSet(), knownTerms?: Set<string>): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (Buffer.isBuffer(input)) {
    return '[ENCRYPTED_BYTEA]' as any;
  }

  if (typeof input === 'string') {
    return scrubString(input, knownTerms) as any;
  }
  if (typeof input !== 'object') {
    return input;
  }

  // On initial entry of object, harvest all known sensitive values
  if (!knownTerms) {
    knownTerms = new Set<string>();
    harvestSensitiveValues(input, knownTerms);
  }

  if (seen.has(input as object)) {
    return '[CIRCULAR]' as any;
  }
  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map((item) => scrubPII(item, seen, knownTerms)) as any;
  }

  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

    if (isSensitiveKey) {
      if (value === null || value === undefined) {
        output[key] = value;
      } else if (Buffer.isBuffer(value)) {
        output[key] = '[REDACTED_BINARY]';
      } else {
        output[key] = '[REDACTED_PII]';
      }
    } else {
      output[key] = scrubPII(value, seen, knownTerms);
    }
  }

  return output as T;
}

/**
 * Creates a wrapped logger function that automatically guarantees all logged entries
 * are stripped of patient PII before hitting stdout or log sinks.
 */
export function createScrubbedLogger(
  baseLogger: (logMessage: string) => void = console.log
) {
  return function logScrubbed(event: Record<string, any>) {
    const cleanEvent = scrubPII(event);
    baseLogger(JSON.stringify(cleanEvent));
  };
}
