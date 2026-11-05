---
purpose: Test strategy — pyramid, tooling, schema tests, race recipes, load, chaos, visual/a11y, flaky policy
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [03_ARCHITECTURE.md, 09_ERROR_HANDLING.md, 12_GITHUB_ACTIONS.md, 14_PRODUCTION_CHECKLIST.md]
---

# 13 — Testing

## 1. Test pyramid & targets

| Layer | Scope | Target |
|---|---|---|
| Unit | `packages/*`, lib functions | ≥ 70% lines on packages |
| Integration | Every Route Handler and queue worker against real Postgres + Redis (testcontainers) | 100% of routes; two-clinic RLS isolation test across all 15 tenant tables (F-02: zero cross-reads); injection payloads; EXPLAIN assertions for hot queries; query-count guard (≤ 5 per list route) |
| E2E | Playwright: signup → pay → wizard → publish → lead (P2 happy path); client-site journeys (call, WhatsApp, form, form with API blocked); R6 live-wiring suite (edit in CMS -> save -> publish -> live site assert; public form submit -> Postgres row -> CMS dashboard visible) | Pass on every release |
| Contract | Razorpay/WhatsApp webhook payload schemas vs recorded fixtures (07 § 4) | Fixtures updated when provider changes |

### R6 Live-Wiring Proof Suite & State Machine Tests
- **R6 Live-Wiring:** For every CMS-editable field, Playwright tests edit value in CMS -> trigger publish -> wait for swap -> navigate to live page URL -> assert new content is rendered. For public forms: submit test appointment -> assert encrypted row created in `appointments` -> login as receptionist -> assert appointment is listed in today's inbox.
- **Two-Clinic Isolation (F-02):** Seeds Tenant A and Tenant B. Runs read/write matrix; asserts Tenant A cannot read Tenant B's appointments, enquiries, posts, FAQs, testimonials, or settings under any header combination.
- **Status Machine (F-06):** Validates allowed transitions (`Pending -> Confirmed -> Completed`, `Pending -> Cancelled`, `Confirmed -> Cancelled`, `Cancelled -> Pending`). Rejects illegal transitions (e.g. `Completed -> Pending`) with 422 `E-1603`. Asserts audit trail recorded in `appointment_events` and `audit_log`.
- **Spam Defense (F-08):** Tests Turnstile invalid token rejection (403 `E-1604`), honeypot rejection, time-trap (< 3s rejection), and rate limiting.

## 2. Tooling & environments

Vitest + Testing Library; Playwright with device matrix: Moto G-class Android (Chromium, 4G throttle 1.6 Mbps/150 ms RTT, 4x CPU slowdown) and iPhone SE (WebKit); testcontainers (Postgres 16, Redis 7); MSW for third-party mocks; CI wiring in 12 § 2. Migration test: apply all SQL migrations to an empty DB and to a snapshot of the previous release, then run integration suite.

## 3. Content-schema testing

Property-based tests (zod + fast-check): arbitrary garbage content sheets (huge strings, wrong types, missing fields, script tags) must fail deterministically with E-2101 and never crash the builder; valid generated sheets must build. Golden-site snapshot: a fixed content sheet renders to a byte-stable HTML (after hash normalization); changes require review. Compatibility test: old schema versions run through migrators (04 § SD-024).

## 4. Race-condition tests

| Scenario (SD-014) | Recipe | Pass condition |
|---|---|---|
| Parallel duplicate lead submits | 20 concurrent POSTs with same Idempotency-Key | Exactly 1 lead row; 19 replay responses |
| Concurrent edits | Two clients PUT with same base version | One 200, one 409 E-1301 |
| Double webhook | Same Razorpay event twice in parallel | One activation, one 200 no-op |
| Renewal vs publish | Run sweep and publish on same site | Serialized by advisory lock; no partial state |
| Parallel sweep (SD-031) | Two sweeps simultaneously | One exits at lock |
| Poison job | Job that always throws | Lands in `*_dlq` after 3 attempts |
| Crash mid-build | Kill renderer at step 3 | Saga compensates; previous version live |

## 5. Load testing

k6 scenarios against preview, never prod: portal 50 rps for 10 min; lead burst 500/min for 5 min then spike to 5,000/min for 60 s. Thresholds: `http_req_duration{route:leads} p(99)<300`, `http_req_failed<0.001`, queue age P95 < 120 s, notify delivery P95 < 60 s, DB connections < 80% max. Latency budgets: 03 § SD-089–SD-092.

## 6. Chaos engineering

**(SD-099) Chaos engineering.** *Meaning:* controlled failure experiments to validate 09's design. *Decision:* quarterly GameDay (2 people, 2 hours, weekday 11:00 IST) on staging, with production-safe subsets only for items marked P.

| # | Experiment | Expected outcome |
|---|---|---|
| 1 | Kill Redis | Idempotency via DB; auth fails closed; no duplicate leads |
| 2 | Postgres failover | API 503 < 5 min; jobs resume; no lost leads (outbox) |
| 3 | Worker crash mid-build | Saga compensation; old version live |
| 4 | Cloudflare API 5xx injection | Breaker opens; publish parks; recovers |
| 5 | Expired-domain simulation (P) | Alert at 60/30/7 days; runbook worked end-to-end |

Blast-radius rules: staging first; one experiment at a time; abort if error rate > 5% on production-safe runs; announce in advance; rollback owner named. Findings feed 09 runbooks and 14 checklists as tracked actions. *Sketch:* `scripts/chaos/kill-redis.sh` toggles network policy for 10 min. *Failure:* untested assumptions; reveals as experiment misses. *Verify:* 14 § 5.

## 7. Visual & accessibility

Per-section visual regression for the template (Playwright screenshots of each of the 10 sections, both themes, 360 px and 1280 px; threshold 0.1%); axe gate: zero serious/critical; Lighthouse CI: performance ≥ 90, accessibility ≥ 95, LCP < 2.0 s, CLS < 0.1, JS ≤ 170 KB.

## 8. Flaky policy & data

Flaky tests get label `flaky`, are quarantined (non-blocking), and must be fixed or deleted within 7 days. Test data synthetic only: Indian names, `+91` numbers in the 9000000000 range reserved for tests, `@example.in` emails; never real personal data.
