---
purpose: API contracts — inventory, auth, idempotency, webhooks, errors, pagination, versioning, OpenAPI sketch
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [03_ARCHITECTURE.md, 05_DATA_SOURCES.md, 09_ERROR_HANDLING.md, 10_SECURITY.md]
---

# 07 — API Contract

## 1. API inventory

| Route | Method | Auth | Rate limit | Idempotent | Phase | Version |
|---|---|---|---|---|---|---|
| /v1/leads | POST | none (public, CORS allowlist) | 5/min/IP; 100/h/tenant | Required header | P1 | v1 |
| /v1/leads | GET | tenant_owner/staff | 300/min/user | n/a (read) | P1 | v1 |
| /v1/auth/otp/request | POST | none | 10/15 min/IP | No | P1 | v1 |
| /v1/auth/otp/verify | POST | none | 10/15 min/IP | No | P1 | v1 |
| /v1/auth/google/callback | GET | OAuth state | 10/15 min/IP | No | P2 | v1 |
| /v1/auth/refresh | POST | refresh cookie | 30/15 min/user | No | P1 | v1 |
| /v1/tenants | POST | operator | 60/min | Header | P1 | v1 |
| /v1/sites/{id}/content | PUT | owner/operator | 120/min | Version check | P1 | v1 |
| /v1/sites/{id}/publish | POST | owner/operator | 10/h/site | Header | P1 | v1 |
| /v1/sites/{id}/rollback | POST | operator | 10/h/site | Header | P1 | v1 |
| /v1/sites/{id}/events | GET (SSE) | owner/operator | 20/min | n/a | P2 | v1 |
| /v1/payments/order | POST | tenant_owner | 20/min | Header required | P2 | v1 |
| /v1/payments/confirm | POST | tenant_owner | 20/min | Header required | P2 | v1 |
| /v1/webhooks/razorpay | POST | HMAC | none (provider IPs) | By event_id | P2 | v1 |
| /v1/webhooks/whatsapp | POST/GET | HMAC / verify token | none | By event_id | P2 | v1 |
| /api/health, /api/ready | GET | none | 60/min | n/a | P1 | unversioned |

## 2. Authentication

P1: passwordless email OTP (6 digits, 10-min expiry, 5 attempts, delivered via Resend). P2 adds Google OAuth **(SD-046)** with PKCE, `state`, `nonce` (security detail in 10 § SD-046). Tokens: JWT access 15 min in `__Host-at` cookie (HttpOnly, Secure, SameSite=Lax), rotating refresh 30 days in `__Host-rt`. **(SD-047)** rotation summary: each refresh issues a new refresh token and invalidates the old; reuse of an old one revokes the whole family (detail: 10 § SD-047).

## 3. Idempotency

**(SD-001) Idempotency keys.** *Meaning:* `POST /v1/leads`, `POST /v1/payments/order`, and `POST /v1/payments/confirm` are retried by browsers, flaky 4G and webhooks. *Decision:* required header `Idempotency-Key: <uuid v4>`; stored in Redis `idem:{tenant}:{key}` with request hash and response snapshot, TTL 24 h; DB unique constraint (`leads.idempotency_key`, `payments.idempotency_key`) is the backstop. Replay with same key and same body returns the original status/body plus `X-Idempotent-Replay: true`; same key with different body returns 422 E-1302; in-flight duplicate returns 409 E-1303 with `Retry-After: 2`. Rejected: server-generated dedupe by content hash (false positives for repeat patients).

### Payments and plan amounts in paise
Razorpay orders are created via `POST /v1/payments/order` with integer amounts in paise (canonical pricing facts live in 01_PRD.md § 2):
- **Basic Presence:** ₹6,999 = `699900` paise (first year); renewal ₹2,999 = `299900` paise.
- **Practice Growth:** ₹12,999 = `1299900` paise (first year); renewal ₹5,999 = `599900` paise. *Sketch:*

```ts
// apps/platform/src/lib/idempotency.ts
export async function withIdempotency(req, tenantId, run) {
  const key = req.headers.get('Idempotency-Key'); if (!key) throw new ApiError('E-1304');
  const rk = `idem:${tenantId}:${key}`, hash = sha256(await req.clone().text());
  const hit = await redis.get(rk);
  if (hit) return hit.hash === hash ? replay(hit) : fail('E-1302');
  if (!(await redis.set(rk, {state:'pending',hash}, {nx:true, ex:86400}))) throw new ApiError('E-1303');
  const res = await run(); await redis.set(rk, {state:'done',hash,res}, {ex:86400}); return res;
}
```

*Failure:* duplicate leads or double activation; reveals as `idempotency_db_conflict_total` > 0 and duplicate-lead report. *Verify:* 13 § 4 (parallel duplicate submits).

## 4. Webhooks

**(SD-017) Webhooks.** *Meaning:* inbound Razorpay (`payment.captured`, `payment.failed`, `refund.processed`) and WhatsApp callbacks (P2). *Decision:* ingestion contract in 05 § 4: HMAC-SHA256 signature on the raw body, 5-minute replay window, idempotent store in `webhook_events (provider,event_id) UNIQUE`, respond 200 in < 3 s, heavy work via outbox. Outbound webhooks: none in P1; P2+ envelope `{id, type, created, data}` signed with `X-DS-Signature`, retries 0.2 s × 2^n cap 30 s then daily for 3 days, then DLQ (06 § SD-039). Rejected: polling Razorpay as the main path (kept only for reconciliation). *Failure:* missed payment activation; reveals as nightly reconciliation diff (05 § 3) and `webhook_signature_fail_total`. *Verify:* 13 § 1 (contract tests); 13 § 4 (double delivery).

## 5. Errors

RFC-7807-style envelope: `{ "type": "https://api.doctorsite.in/errors/E-1302", "title": "Idempotency key reused with different body", "status": 422, "code": "E-1302", "traceId": "…" }`. Catalogue: See 09_ERROR_HANDLING.md § 1. Never leak stack traces, SQL, or vendor errors.

## 6. Pagination & filtering

Cursor pagination: `?limit=50&cursor=<opaque base64 of (created_at,id)>`; max `limit` 100; response `{ items, nextCursor }`. Filters `?status=new&channel=form&from=2026-11-01`; sort fixed to `created_at desc` (no arbitrary sorts).

## 7. Rate-limit contract

On limit: HTTP 429, body code E-1501, header `Retry-After: <seconds>`; every response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Limits defined in 10 § SD-002.

## 8. Versioning

**(SD-077) API versioning.** *Meaning:* URL major version. *Decision:* `/v1` prefix; additive changes only within v1; breaking changes ship as `/v2` with both live ≥ 6 months; deprecated routes return `Deprecation: true` and `Sunset: <HTTP-date>`; deprecation notice dates published in 16_CHANGELOG. Rejected: header versioning (hard for client sites' static form code). *Failure:* old client sites break after a change; reveals as 4xx spike by `X-Client-Version`. *Verify:* 13 § 1 (contract tests).

**(SD-078) Semantic versioning.** *Meaning:* versions of platform API and `packages/content-schema`. *Decision:* API: MINOR/PATCH inside v1; content-schema `MAJOR.MINOR.PATCH`: PATCH = docs/fixes, MINOR = new optional field, MAJOR = removed/renamed/required field or type change (forces migrator, 04 § SD-024). Templates reference a compatible range. Rejected: calendar versioning. *Failure:* silent incompatible deploy; reveals through the CI `schema-compat` job. *Verify:* 13 § 3; 12 § 2.

## 9. Timeout budgets

| Endpoint class | Budget |
|---|---|
| Public lead POST | 3 s total (server work < 300 ms P99) |
| Reads | 5 s |
| Publish/trigger (enqueue only) | 5 s |
| SSE | 55 s then reconnect |
| Webhooks | 3 s |

See 09_ERROR_HANDLING.md § SD-010.

## 10. OpenAPI sketch

```yaml
openapi: 3.1.0
info: { title: DoctorSite API, version: 1.0.0 }
paths:
  /v1/leads:
    post:
      parameters: [{ name: Idempotency-Key, in: header, required: true, schema: { type: string, format: uuid } }]
      requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/LeadInput' } } } }
      responses: { '202': { description: Accepted }, '409': { description: E-1303 }, '422': { description: E-1302 }, '429': { description: E-1501 } }
    get:
      parameters: [{ name: cursor, in: query, schema: { type: string } }, { name: limit, in: query, schema: { type: integer, maximum: 100 } }]
      responses: { '200': { description: Page of leads } }
  /v1/sites/{id}/publish:
    post:
      parameters: [{ name: id, in: path, required: true, schema: { type: string, format: uuid } }, { name: Idempotency-Key, in: header, required: true, schema: { type: string } }]
      responses: { '202': { description: Job queued, returns jobId }, '409': { description: Version conflict E-1301 } }
components:
  schemas:
    LeadInput:
      type: object
      required: [siteId, name, phone, consent]
      properties:
        siteId: { type: string, format: uuid }
        name: { type: string, maxLength: 80 }
        phone: { type: string, pattern: '^\+91[6-9][0-9]{9}$' }
        email: { type: string, format: email }
        message: { type: string, maxLength: 500 }
        consent: { type: boolean, const: true }
        preferredDate: { type: string, format: date, description: 'Optional preferred appointment date (Practice Growth)' }
        preferredTime: { type: string, maxLength: 30, description: 'Optional preferred appointment time/slot (Practice Growth)' }
        website: { type: string, maxLength: 0, description: honeypot }
```
