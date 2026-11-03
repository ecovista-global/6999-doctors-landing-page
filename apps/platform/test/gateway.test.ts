import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest, NextResponse } from 'next/server';
import { withGateway } from '../src/lib/gateway';
import { AppError } from '../src/lib/errors';

describe('MT-007: Gateway Skeleton and RFC-7807 Error Envelope', () => {
  it('returns RFC-7807 problem details with traceId on AppError', async () => {
    const handler = withGateway({ auth: 'none' }, async () => {
      throw new AppError('E-1101', 'Phone number format invalid', [
        { name: 'phone', reason: 'Must match +91 standard' },
      ]);
    });

    const req = new NextRequest('http://localhost:3000/v1/leads', {
      method: 'POST',
      headers: { 'x-request-id': 'req-test-trace-123' },
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.headers.get('content-type'), 'application/problem+json');
    assert.strictEqual(res.headers.get('x-trace-id'), 'req-test-trace-123');

    const body = await res.json();
    assert.strictEqual(body.type, 'https://api.doctorsite.in/errors/e-1101');
    assert.strictEqual(body.status, 422);
    assert.strictEqual(body.code, 'E-1101');
    assert.strictEqual(body.traceId, 'req-test-trace-123');
    assert.strictEqual(body.title, 'Invalid phone or input field');
    assert.strictEqual(body.detail, 'Phone number format invalid');
    assert.deepStrictEqual(body.invalidParams, [
      { name: 'phone', reason: 'Must match +91 standard' },
    ]);
    assert.strictEqual(body.stack, undefined, 'Stack trace must NEVER be in response');
  });

  it('unhandled generic exception returns RFC-7807 without leaking stack or internal details', async () => {
    const handler = withGateway({ auth: 'none' }, async () => {
      // Throw an error with sensitive internal information and a stack trace
      throw new Error('Fatal SQL injection / secret leak in /src/db/internal.ts:42');
    });

    const req = new NextRequest('http://localhost:3000/v1/leads', {
      method: 'POST',
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 500);
    assert.strictEqual(res.headers.get('content-type'), 'application/problem+json');

    const traceIdHeader = res.headers.get('x-trace-id');
    assert.ok(traceIdHeader && traceIdHeader.startsWith('trace-'));

    const body = await res.json();
    assert.strictEqual(body.status, 500);
    assert.strictEqual(body.code, 'E-2201');
    assert.strictEqual(body.traceId, traceIdHeader);
    assert.strictEqual(body.stack, undefined, 'Stack trace must NEVER be leaked in response');

    // Verify secret / raw message is not leaked
    const jsonString = JSON.stringify(body);
    assert.strictEqual(jsonString.includes('secret leak'), false);
    assert.strictEqual(jsonString.includes('/src/db/internal.ts'), false);
  });

  it('successful handler passes through with trace headers', async () => {
    const handler = withGateway({ auth: 'none' }, async () => {
      return NextResponse.json({ ok: true });
    });

    const req = new NextRequest('http://localhost:3000/api/health', {
      method: 'GET',
      headers: { 'x-request-id': 'custom-req-id-777' },
    });

    const res = await handler(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-trace-id'), 'custom-req-id-777');
    assert.strictEqual(res.headers.get('x-request-id'), 'custom-req-id-777');

    const body = await res.json();
    assert.deepStrictEqual(body, { ok: true });
  });
});
