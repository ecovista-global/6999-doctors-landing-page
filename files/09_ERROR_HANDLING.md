---
purpose: Error catalogue, timeouts, retries, circuit breakers, concurrency hazards, distributed failure modes, degradation ladder
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [03_ARCHITECTURE.md, 04_DATA_MODEL.md, 07_API_CONTRACT.md, 13_TESTING.md, 14_PRODUCTION_CHECKLIST.md]
---

# 09 — Error Handling

## 1. Error taxonomy & catalogue

Prefixes: E-1xxx user, E-2xxx platform, E-3xxx third-party, E-4xxx infra.

| Code | Meaning | HTTP | User message (en / hi) | Operator action |
|---|---|---|---|---|
| E-1101 | Invalid phone/field | 422 | Please check your phone number. / कृपया अपना फ़ोन नंबर जाँचें। | None |
| E-1201 | Asset rejected (type/size) | 422 | This image is not allowed (max 5 MB). / यह छवि स्वीकार्य नहीं है (अधिकतम 5 MB)। | None |
| E-1301 | Content version conflict | 409 | Page changed elsewhere. / पेज कहीं और बदला गया है। | None |
| E-1302 | Idempotency key reused, different body | 422 | Please retry the form. / कृपया फ़ॉर्म दोबारा भेजें। | Check client bug |
| E-1303 | Duplicate in flight | 409 | Already sending, please wait. / भेजा जा रहा है, कृपया प्रतीक्षा करें। | None |
| E-1304 | Missing Idempotency-Key | 400 | Something went wrong, please retry. / कुछ गलत हुआ, कृपया पुनः प्रयास करें। | Fix client |
| E-1401 | Webhook signature/replay invalid | 401 | n/a | Investigate if sustained |
| E-1501 | Rate limited | 429 | Too many attempts, try later. / बहुत अधिक प्रयास, बाद में कोशिश करें। | None |
| E-1601 | Page limit exceeded (max 7 pages) | 422 | Up to 7 pages allowed on this plan. / इस प्लान पर अधिकतम 7 पेज की अनुमति है। | Review page selection |
| E-1602 | Quota exceeded (submissions/storage) | 429 | Plan volume quota reached. / प्लान कोटा सीमा समाप्त हो गई है। | Offer quota add-on |
| E-1603 | Invalid status transition | 422 | Invalid appointment status transition. / अमान्य अपॉइंटमेंट स्थिति परिवर्तन। | Check allowed transitions |
| E-1604 | Turnstile / spam verification failed | 403 | Security verification failed. / सुरक्षा सत्यापन विफल रहा। | Check spam logs |
| E-1605 | 2FA code invalid or expired | 401 | Invalid or expired verification code. / अमान्य या समाप्त सत्यापन कोड। | User retry / recovery |
| E-1606 | Testimonial consent unrecorded | 422 | Patient consent must be recorded. / मरीज की सहमति दर्ज होनी चाहिए। | Record patient consent |
| E-1607 | Rich-text sanitization violation | 422 | Disallowed HTML or script tags detected. / अस्वीकृत HTML या स्क्रिप्ट टैग पाए गए। | Remove disallowed tags |
| E-2101 | Content sheet failed validation | 422 | We could not build your page. / हम आपका पेज नहीं बना सके। | Fix sheet, replay |
| E-2201 | Build failed | 500 | Build failed, team notified. / बिल्ड विफल, टीम को सूचित किया गया। | Check renderer logs |
| E-2301 | Asset processing failed | 500 | Image processing failed. / छवि प्रोसेस नहीं हुई। | Re-upload/replay |
| E-2401 | Backpressure shed | 503 | Busy, retry shortly. / व्यस्त है, कुछ देर बाद प्रयास करें। | Check queue depth |
| E-3101 | Razorpay error | 502 | Payment service is slow. / भुगतान सेवा धीमी है। | Reconcile |
| E-3201 | WhatsApp API error | 502 | Message will be delayed. / संदेश में देरी होगी। | Email fallback |
| E-3202 | Resend error | 502 | Email will be delayed. / ईमेल में देरी होगी। | Check Resend status |
| E-3301 | Cloudflare error | 502 | Domain update pending. / डोमेन अपडेट लंबित है। | Retry/reconcile |
| E-4001 | Database unavailable/pool exhausted | 503 | Service temporarily unavailable. / सेवा अस्थायी रूप से अनुपलब्ध है। | Page on-call |
| E-4101 | Redis unavailable | 503 (auth) / pass-through | Please try again. / कृपया पुनः प्रयास करें। | Check Upstash |
| E-4201 | Dependency breaker open | 503 | Try again in a minute. / एक मिनट बाद प्रयास करें। | Check dependency |

## 2. Timeout & retry deep dives

**(SD-010) Timeouts.** *Meaning:* every outbound call has a deadline. *Decision:* `AbortSignal.timeout(ms)` on all fetches; budget table:

| Dependency | Timeout |
|---|---|
| Postgres query | 5 s (`statement_timeout`), 2 s for lead insert |
| Redis (Upstash) | 300 ms |
| Resend | 5 s |
| WhatsApp Cloud API | 5 s |
| Razorpay | 8 s |
| Cloudflare API | 10 s |
| GitHub dispatch | 10 s |

Rejected: library defaults (often infinite). *Failure:* hung requests exhaust concurrency; reveals as `function_duration_p99` > 10 s. *Verify:* 13 § 5; 14 § 3.

**(SD-011) Retries.** *Meaning:* when to try again. *Decision:* retry: idempotent reads, writes carrying an idempotency key, webhook handlers (provider-driven), queue jobs (06 § 2). Never retry: unkeyed payment creation, OTP sends beyond limit, non-idempotent third-party POSTs without keys. Rejected: blanket retry middleware. *Failure:* double charge or duplicate emails; reveals as duplicate-event metric. *Verify:* 13 § 4.

**(SD-012) Exponential backoff.** *Meaning:* spacing retries. *Decision:* `delay = random(0, min(30 s, 0.2 s × 2^n))` (full jitter); max attempts: Resend 8, Cloudflare 5, Razorpay reads 3, WhatsApp 6, build 3. *Sketch:* `const d = Math.random() * Math.min(30000, 200 * 2 ** n)`. *Failure:* retry storms after an outage; reveals as synchronized request spikes. *Verify:* 13 § 1 (unit test distribution).

## 3. Circuit breakers

**(SD-013) Circuit breakers.** *Meaning:* stop calling a failing dependency. *Decision:* one breaker per dependency (Resend, WhatsApp, Razorpay, Cloudflare, Redis) using `opossum`: open after 5 failures within 30 s, half-open after 60 s, close after 2 successes. When open: Resend/WhatsApp jobs re-queue with delay; Redis breaker switches rate limiter to fail-open for public reads and fail-closed for auth; Razorpay shows retry page. Rejected: no breaker (cascading failure). *Sketch:* `new CircuitBreaker(fn,{errorThresholdPercentage:50, volumeThreshold:5, rollingCountTimeout:30000, resetTimeout:60000})`. *Failure:* thread/connection pileup; reveals as `breaker_state{dep}` = open, shown on the dependency dashboard (14 § 3). *Verify:* 13 § 6 (Cloudflare 5xx injection).

## 4. Concurrency hazards

**(SD-014) Race conditions.** *Meaning:* inventory with mitigations:

| Hazard | Mitigation |
|---|---|
| Duplicate form submits | Idempotency key (07 § 3) |
| Concurrent content edits | Optimistic lock (04 § SD-025) |
| Double webhook delivery | Unique `webhook_events` (07 § 4) |
| Renewal sweep vs publish | `pg_advisory_xact_lock(hashtext(site_id))` in both paths |
| Two workers one tenant | pg-boss `singletonKey` (06 § 2) |

*Failure:* silent corruption; reveals as conflict/duplicate counters. *Verify:* 13 § 4 (recipes).

**(SD-015) Deadlocks.** *Meaning:* circular waits. *Decision:* single lock order across transactions: `tenants → sites → content_sheets → leads → subscriptions → payments`; `deadlock_timeout 1 s`, `statement_timeout 5 s`, `lock_timeout 3 s`; on SQLSTATE 40P01 retry once. *Failure:* hung requests; reveals as `pg_stat_database.deadlocks` increase. *Verify:* 13 § 4.

**(SD-016) Memory leaks.** *Meaning:* growth in long-lived processes. *Decision:* no unbounded module-level Maps (lint `no-restricted-globals` + review rule), caches only in Redis with TTL; stream builds/uploads; renderer exits after each job; `heap_ratio` alarm > 80% for 3 min. *Failure:* OOM kills; reveals as restarts. *Verify:* 13 § 5; 14 § 3.

## 5. Distributed failure modes

**(SD-093) Network partitions.** *Meaning:* split between platform and a dependency. *Decision table:*

| Lost | Behavior |
|---|---|
| Postgres | Static sites up; portal/API 503 E-4001; client form uses fallback ladder |
| Redis | Idempotency falls back to DB constraint; flags use defaults; auth rate-limit fails closed |
| Resend | Leads stored; emails queued; WhatsApp link still works |
| Cloudflare API | Publish parks at hostname step; site stays on current version |
| GitHub Actions | Builds queue; nothing else affected |

*Failure:* partial writes; reveals as queue age and `outbox_lag_seconds`. *Verify:* 13 § 6.

**(SD-094) Clock skew.** *Meaning:* servers disagree on time. *Decision:* ordering uses DB `now()` (`created_at default now()`), never app clocks; JWT `iat/nbf` tolerance ±60 s; webhook window 5 min; cron drift: schedules in IST and jobs tolerate ±2 min. *Failure:* premature token rejection; reveals as `jwt_clock_reject_total`. *Verify:* 13 § 1.

**(SD-096) Failover.** *Meaning:* continuing after a component loss. *Decision:* P1 single region accepted (03 § SD-095); Postgres host failover to standby (target RTO 5 min estimate); Vercel/Cloudflare multi-AZ by vendor; primary survival trait: client sites do not depend on the platform. *Failure:* long DB outage; reveals as probe failures. *Verify:* 14 § 5; 13 § 6 (Neon/Postgres failover drill).

## 6. Graceful degradation ladder

| Level | Condition | Behavior |
|---|---|---|
| 0 | Normal | Form POST → 202 |
| 1 | API slow/5xx | Client JS stores payload in `localStorage` outbox and retries with the same Idempotency-Key (backoff 1/3/9/27 s) |
| 2 | Retries fail | Show mailto: link to doctor's email and the wa.me link with the message pre-filled |
| 3 | Platform fully down | Static sites stay up; call and WhatsApp links work (no platform dependency) |

Acceptance: Playwright test with API blocked shows Level 2 within 40 s (13 § 2).

## 7. Incident runbook index

| Failure class | Runbook |
|---|---|
| Expired domain / DNS | 14 § 4 + 06 § 4 |
| Lead delivery delay | 14 § 4 |
| Build/DLQ failure | 06 § SD-039 |
| DB outage | 14 § 5 |
| Payment mismatch | 05 § 3 |

Postmortem triggers (14 § SD-111): any Sev-1/Sev-2, any data exposure, error budget burn > 50%.
