import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  encrypt,
  decrypt,
  decryptToBuffer,
  reencrypt,
  registerKey,
  setActiveKeyId,
  getActiveKeyId,
  isEncryptedEnvelope,
  scrubPII,
  scrubString,
  createScrubbedLogger,
  IV_LENGTH_BYTES,
  TAG_LENGTH_BYTES,
  ENVELOPE_VERSION,
} from '../src/lib/crypto';

describe('MT-108: PII Encryption & Decryption Engine Acceptance Suite', () => {
  const samplePatientName = 'Vikramaditya Singhania';
  const samplePatientPhone = '+919876543210';
  const samplePatientEmail = 'vikram.singhania@hospital-care.in';
  const sampleMedicalNote = 'Patient experiencing acute palpitations and dyspnea on exertion for 3 days.';

  it('Acceptance: AES-256-GCM encrypt and decrypt roundtrip passes for all patient contact fields', () => {
    // 1. Encrypt Patient Name
    const nameEnc = encrypt(samplePatientName);
    assert.ok(Buffer.isBuffer(nameEnc), 'Encrypted name must be a Buffer (PostgreSQL bytea)');
    assert.ok(nameEnc.length > samplePatientName.length, 'Ciphertext buffer must include IV, tag, and header');
    assert.strictEqual(decrypt(nameEnc), samplePatientName, 'Decrypted name must match original');

    // 2. Encrypt Patient Phone
    const phoneEnc = encrypt(samplePatientPhone);
    assert.ok(Buffer.isBuffer(phoneEnc));
    assert.strictEqual(decrypt(phoneEnc), samplePatientPhone, 'Decrypted phone must match original');

    // 3. Encrypt Patient Email
    const emailEnc = encrypt(samplePatientEmail);
    assert.ok(Buffer.isBuffer(emailEnc));
    assert.strictEqual(decrypt(emailEnc), samplePatientEmail, 'Decrypted email must match original');

    // 4. Encrypt Medical Message / Notes
    const notesEnc = encrypt(sampleMedicalNote);
    assert.ok(Buffer.isBuffer(notesEnc));
    assert.strictEqual(decrypt(notesEnc), sampleMedicalNote, 'Decrypted medical note must match original');

    // 5. Encrypt Raw Buffer payload
    const rawData = Buffer.from('Binary confidential record', 'utf8');
    const rawEnc = encrypt(rawData);
    assert.deepStrictEqual(decryptToBuffer(rawEnc), rawData);
  });

  it('Acceptance: Fresh 12-byte random IV is generated per encryption (non-deterministic ciphertext)', () => {
    // Encrypt identical plaintext 10 times
    const ciphertexts: Buffer[] = [];
    const ivs: Buffer[] = [];

    for (let i = 0; i < 10; i++) {
      const enc = encrypt(samplePatientPhone);
      ciphertexts.push(enc);

      // Extract IV from envelope (offset: version(1) + keyIdLen(1) + keyId("v1"=2) = 4)
      const keyIdLen = enc[1]!;
      const ivOffset = 2 + keyIdLen;
      const iv = enc.subarray(ivOffset, ivOffset + IV_LENGTH_BYTES);
      ivs.push(iv);
    }

    // Assert all ciphertexts are distinct
    const uniqueCiphertexts = new Set(ciphertexts.map((c) => c.toString('hex')));
    assert.strictEqual(uniqueCiphertexts.size, 10, 'Each encryption must produce a unique ciphertext');

    // Assert all IVs are distinct
    const uniqueIVs = new Set(ivs.map((iv) => iv.toString('hex')));
    assert.strictEqual(uniqueIVs.size, 10, 'Each encryption must generate a unique 12-byte random IV');
  });

  it('Acceptance: Authentication tag and ciphertext tampering fails with cryptographic rejection', () => {
    const enc = encrypt(sampleMedicalNote);

    // Tamper with ciphertext payload (flip last byte)
    const tamperedCiphertext = Buffer.from(enc);
    tamperedCiphertext[tamperedCiphertext.length - 1] = (tamperedCiphertext[tamperedCiphertext.length - 1] ?? 0) ^ 0xff;

    assert.throws(
      () => decrypt(tamperedCiphertext),
      /unable to authenticate data|Unsupported state/,
      'Tampered ciphertext must fail GCM authentication'
    );

    // Tamper with IV (flip byte at IV offset)
    const tamperedIV = Buffer.from(enc);
    const ivOffset = 2 + (tamperedIV[1] ?? 0);
    tamperedIV[ivOffset] = (tamperedIV[ivOffset] ?? 0) ^ 0xff;

    assert.throws(
      () => decrypt(tamperedIV),
      /unable to authenticate data|Unsupported state/,
      'Tampered IV must fail GCM authentication'
    );

    // Tamper with Auth Tag
    const tamperedTag = Buffer.from(enc);
    const tagOffset = ivOffset + IV_LENGTH_BYTES;
    tamperedTag[tagOffset] = (tamperedTag[tagOffset] ?? 0) ^ 0xff;

    assert.throws(
      () => decrypt(tamperedTag),
      /unable to authenticate data|Unsupported state/,
      'Tampered auth tag must fail GCM authentication'
    );
  });

  it('Acceptance: Key rotation support (multi-key ring, backwards compatibility, and re-encryption)', () => {
    const keyV1 = crypto.randomBytes(32);
    const keyV2 = crypto.randomBytes(32);
    const keyV3 = crypto.randomBytes(32);

    // 1. Register keys in ring
    registerKey('key-2026-v1', keyV1);
    registerKey('key-2026-v2', keyV2);
    registerKey('key-2026-v3', keyV3);

    // 2. Set active key to v1 and encrypt
    setActiveKeyId('key-2026-v1');
    assert.strictEqual(getActiveKeyId(), 'key-2026-v1');
    const encV1 = encrypt('Sensitive Patient V1 Record', 'key-2026-v1');

    // 3. Rotate active key to v2
    setActiveKeyId('key-2026-v2');
    assert.strictEqual(getActiveKeyId(), 'key-2026-v2');

    // 4. Existing record encrypted with v1 must still decrypt seamlessly without downtime
    const decryptedV1 = decrypt(encV1);
    assert.strictEqual(decryptedV1, 'Sensitive Patient V1 Record', 'Must decrypt records created with older keys');

    // 5. New encryptions automatically use active key v2
    const encV2 = encrypt('New Patient V2 Record');
    assert.strictEqual(decrypt(encV2), 'New Patient V2 Record');

    // 6. Re-encrypt legacy record from v1 to v3 using reencrypt() helper
    const reencryptedV3 = reencrypt(encV1, 'key-2026-v3');
    assert.strictEqual(decrypt(reencryptedV3), 'Sensitive Patient V1 Record');

    // Verify header of re-encrypted buffer reflects key-2026-v3
    const keyIdLen = reencryptedV3[1] ?? 0;
    const keyIdInHeader = reencryptedV3.subarray(2, 2 + keyIdLen).toString('utf8');
    assert.strictEqual(keyIdInHeader, 'key-2026-v3');
  });

  it('Acceptance: PII scrubber removes patient phone, email, name, and notes from log payloads', () => {
    const rawLogPayload = {
      level: 'info',
      traceId: 'req-trace-456',
      method: 'POST',
      path: '/v1/appointments',
      patientName: samplePatientName,
      patientPhone: samplePatientPhone,
      patientEmail: samplePatientEmail,
      notes: sampleMedicalNote,
      message: `Direct consultation inquiry from ${samplePatientPhone} (${samplePatientEmail}) for Dr. Sharma`,
      auditTrail: {
        actorId: 'receptionist-aarti',
        patientPhoneEnc: Buffer.from('binary-buffer'),
        freeformComment: `Called patient at +91 9876543210 regarding slot availability. Email confirmation to vikram.singhania@hospital-care.in`,
      },
    };

    const scrubbed = scrubPII(rawLogPayload);

    // 1. Sensitive property keys are masked
    assert.strictEqual(scrubbed.patientName, '[REDACTED_PII]');
    assert.strictEqual(scrubbed.patientPhone, '[REDACTED_PII]');
    assert.strictEqual(scrubbed.patientEmail, '[REDACTED_PII]');
    assert.strictEqual(scrubbed.notes, '[REDACTED_PII]');
    assert.strictEqual(scrubbed.auditTrail.patientPhoneEnc, '[REDACTED_BINARY]');

    // 2. Freeform message string contains no plaintext phone or email
    assert.ok(!scrubbed.message.includes(samplePatientPhone), 'Message must not contain plaintext phone');
    assert.ok(!scrubbed.message.includes(samplePatientEmail), 'Message must not contain plaintext email');
    assert.ok(scrubbed.message.includes('[REDACTED_PHONE]'));
    assert.ok(scrubbed.message.includes('[REDACTED_EMAIL]'));

    // 3. Freeform nested comment contains no plaintext phone or email
    assert.ok(!scrubbed.auditTrail.freeformComment.includes(samplePatientPhone));
    assert.ok(!scrubbed.auditTrail.freeformComment.includes(samplePatientEmail));
    assert.ok(scrubbed.auditTrail.freeformComment.includes('[REDACTED_PHONE]'));
    assert.ok(scrubbed.auditTrail.freeformComment.includes('[REDACTED_EMAIL]'));
  });

  it('Acceptance: Plaintext PII is NEVER written to stdout/log sinks when using scrubbed logger', () => {
    const loggedMessages: string[] = [];
    const testLogSink = (msg: string) => {
      loggedMessages.push(msg);
    };

    const logger = createScrubbedLogger(testLogSink);

    // Log payload containing raw PII
    logger({
      action: 'appointment.received',
      phone: samplePatientPhone,
      email: samplePatientEmail,
      patientName: samplePatientName,
      details: `Inbound appointment for patient ${samplePatientName} (${samplePatientPhone}) with email ${samplePatientEmail}: ${sampleMedicalNote}`,
    });

    assert.strictEqual(loggedMessages.length, 1);
    const logOutput = loggedMessages[0]!;

    // Assert STRICT absence of any patient personal data in raw output
    assert.strictEqual(logOutput.includes(samplePatientName), false, 'Log output must NOT leak patient name');
    assert.strictEqual(logOutput.includes(samplePatientPhone), false, 'Log output must NOT leak patient phone');
    assert.strictEqual(logOutput.includes(samplePatientEmail), false, 'Log output must NOT leak patient email');
    assert.strictEqual(logOutput.includes(sampleMedicalNote), false, 'Log output must NOT leak patient medical notes');

    // Assert that the scrubbed indicators are present in JSON
    assert.ok(logOutput.includes('[REDACTED_PII]') || logOutput.includes('[REDACTED_PHONE]'));
  });

  it('Acceptance: Envelope inspection utility works correctly', () => {
    const enc = encrypt('Test data');
    assert.strictEqual(isEncryptedEnvelope(enc), true);
    assert.strictEqual(isEncryptedEnvelope(Buffer.from('Not an encrypted envelope')), false);
    assert.strictEqual(isEncryptedEnvelope('not a buffer'), false);
    assert.strictEqual(isEncryptedEnvelope(null), false);
  });
});
