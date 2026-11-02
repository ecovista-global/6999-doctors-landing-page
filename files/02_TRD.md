---
purpose: Technical decisions — stack tables, coordination, runtime limits, cost model, NFR budgets, toolchain
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [01_PRD.md, 03_ARCHITECTURE.md, 04_DATA_MODEL.md, 12_GITHUB_ACTIONS.md, 17_DECISIONS.md]
---

# 02 — TRD

## 1. Stack decision tables

Database change requested by founders: plain PostgreSQL (standard SQL, no vendor-specific features). Recorded in 17 ADR-003.

| Layer | Choice | Why | Rejected | Revisit trigger |
|---|---|---|---|---|
| Monorepo | pnpm + Turborepo | Fast installs, remote cache (ADR-011) | Nx | > 15 packages |
| Platform | Next.js App Router, TS strict | One deployable for UI + API | Separate admin SPA | Team > 5 |
| Client site | `apps/site-template`, static export | Honors no-backend exclusion (ADR-007) | SSR per site | Never in P1/P2 |
| Database | PostgreSQL 16, standard SQL, `pg` driver via PgBouncer; Drizzle ORM + SQL migrations | Portable; RLS; JSONB | Neon-specific features (branching, serverless driver), Prisma | Host cost > ₹5,000/mo |
| DB host | Default Neon (managed Postgres, Mumbai-nearest region) | Zero-ops for 2 people | Self-hosted RDS | DECISION-NEEDED: host region; recommend managed Postgres in ap-south-1 if Neon lacks it |
| Cache/limits/locks | Upstash Redis | Serverless HTTP API, per-request pricing | ElastiCache | > 10M cmds/mo |
| Queue | pg-boss on Postgres | No extra infra; transactional enqueue (ADR-005) | BullMQ, Inngest | > 50 jobs/s |
| Email | Resend | Simple API, DKIM (ADR-008) | SES | > 100k mails/mo |
| WhatsApp | P1 wa.me; P2 Cloud API | No approval in P1 | Third-party BSP | Template rejection rate |
| Payments | Razorpay | UPI-first (ADR-006) | Stripe, Cashfree | Fee > 2.5% |
| Edge | Cloudflare (DNS, CDN, WAF, SSL for SaaS) | One vendor for domains | Fastly | Enterprise needs |
| Static hosting | Cloudflare R2 + Worker routing hostname to site prefix | Cheapest static serving; no function per site | Vercel per-site projects | R2 pricing change |
| Platform hosting | Vercel Pro | Preview deploys, instant rollback | Self-host | 02 § 4 trigger |
| Build runner | GitHub Actions Docker job dispatched by pipeline | Heavy build outside 60 s functions (ADR-014) | Vercel build | Runner minutes > 3,000/mo |
| Observability | OpenTelemetry, Better Stack logs, Sentry, external probes | Cheap, swappable | Datadog | Cost > ₹10,000/mo |

## 2. Storage & coordination

**(SD-031) Leader election.** *Meaning:* only one process may run singleton work (renewal sweep, outbox dispatcher) in `apps/platform/src/workers/`. *Decision:* P1/P2 need no election framework: pg-boss gives each job to one worker; singletons take `pg_try_advisory_lock(hashtext('renewal-sweep'))` in a transaction; P3 on Kubernetes uses a `coordination.k8s.io` Lease. Rejected: etcd/Consul (needless ops). *Sketch:* `SELECT pg_try_advisory_xact_lock(42001)` returns false → exit 0. *Failure:* two sweeps double-email clients; reveals as duplicate `outbox_events` per day (alert: count > 1 per `renewal_sweep` key). *Verify:* 13 § 4 (parallel sweep test); 14 § 5.

**(SD-032) CAP theorem.** *Meaning:* trade-off per store. *Decision:* table below. Rejected: multi-master DB (complexity). *Sketch:*

| Store | Under partition | Features accepting deviation |
|---|---|---|
| Postgres (single primary) | Consistent, unavailable | Payments, tenants must be strongly consistent; control plane returns E-4xx |
| Redis | Available, may lose data | Rate limits (fail-open for reads, fail-closed for auth), idempotency snapshots (DB backstop) |
| CDN edge | Available, stale up to TTL | Client sites, previews |

*Failure:* Redis loss treated as source of truth causes duplicate leads; metric `idempotency_db_conflict_total`. *Verify:* 13 § 6 (kill Redis); 14 § 3.

## 3. Runtime constraints

**(SD-079) Garbage collection.** *Meaning:* Node heap limits in Vercel functions and the renderer container. *Decision:* functions at 1024 MB (heap ≈ 75%); heavy work (sharp, static export) in the Docker renderer with `--max-old-space-size=1536` on a 7 GB runner; stream files, never buffer whole sites. Rejected: 3 GB functions (cost). *Sketch:* `process.memoryUsage().heapUsed / heapTotal > 0.8` emits `heap_ratio` metric. *Failure:* OOM kill mid-publish; reveals as 5xx with `FUNCTION_INVOCATION_FAILED` and heap alarm > 80% for 3 min. *Verify:* 13 § 5; 14 § 3 (SD-103).

**(SD-080) Thread safety.** *Meaning:* concurrency in Node and queue workers. *Decision:* no mutable module-level state (lint rule `no-restricted-syntax` on top-level `let` in `apps/platform/src`); per-request objects only; image resizing uses `sharp` thread pool (concurrency 2) in the renderer; `worker_threads` only if a CPU task exceeds 200 ms in a function. Rejected: shared in-memory caches. *Sketch:* `export const db = createPool()` (immutable handle) allowed; `let counter` banned. *Failure:* cross-tenant data bleed through shared state; reveals through RLS isolation test failure. *Verify:* 13 § 1 (isolation tests); 10 § 4.

**(SD-087) Cold starts.** *Meaning:* first-request latency on Vercel functions. *Decision:* Node runtime (not Edge) for DB routes; bundle each route < 1 MB; no heavy imports at top level; Vercel Cron pings `/api/health` every minute for lead route warm-up (P1). Measured target: cold P95 < 800 ms, warm P99 < 300 ms (estimate). Rejected: Edge runtime for DB (driver limits). *Failure:* lead POST exceeds 300 ms P99; metric `cold_start_ratio`. *Verify:* 13 § 5 (k6 burst); 14 § 3.

**(SD-088) Serverless limits.** *Meaning:* limits shaping features. *Decision:* `maxDuration = 60 s`; request body limit 4.5 MB so uploads go direct to R2 via presigned URL (max 5 MB, 10 min expiry); no long-running work in functions (builds run in the renderer); no WebSockets (08 § 4). Rejected: raising to 300 s. *Failure:* 504 on upload or build; metric `function_duration_p99`. *Verify:* 13 § 5; 06 § 2.

## 4. Cost model

**(SD-086) Cost optimization.** *Meaning:* ₹/month by scale (estimates at ₹90/USD). *Decision:* static-first design; revisit self-hosting at trigger.

| Item | 10 sites | 100 sites | 1,000 sites |
|---|---|---|---|
| Vercel Pro | ₹1,800 | ₹1,800 | ₹3,500 |
| Postgres host | ₹2,000 | ₹2,000 | ₹4,500 |
| Upstash | ₹500 | ₹900 | ₹2,000 |
| Cloudflare (hostnames beyond 100 free ≈ ₹9/site) + R2 | ₹0 | ₹300 | ₹9,000 |
| Resend | ₹0 | ₹1,800 | ₹1,800 |
| Logs/Sentry/uptime | ₹0 | ₹0 | ₹2,500 |
| GitHub Actions runners | ₹0 | ₹0 | ₹3,200 |
| Total | ₹4,300 | ₹6,800 | ₹26,500 |
| Per site | ₹430 | ₹68 | ₹26.5 |

Client-site infra anchor (< ₹40/site/month at 100 sites): scope is client-variable cost only (R2, CDN, hostname, email share ≈ ₹12); the all-in per-site figure including the fixed control plane is ₹68–77 and is the figure used in 01 § 8. Justification: fixed control-plane cost is not caused by any one site. *Trigger to self-host rendering (P3):* Vercel + runner spend > ₹60,000/month or > 3,000 sites (See 12 § 6). *Failure:* silent bill growth; alert from monthly cost report if total > 120% of table. *Verify:* 12 § 9; 14 § 5.

## 5. NFR budgets

| Budget | Target |
|---|---|
| API P50 / P99 | 80 ms / 300 ms from ap-south-1 |
| Build | < 90 s |
| Deploy (platform) | < 5 min |
| Client-site JS | < 170 KB gzipped (target: < 30 KB, no framework runtime beyond islands) |
| Error rate | < 0.1% of requests |
| Lead delivery P95 | < 60 s |

## 6. Toolchain & environments

| Concern | Choice |
|---|---|
| Lint/format | ESLint (flat config) + Prettier; ban raw SQL strings and `dangerouslySetInnerHTML` |
| Test/typecheck | Vitest, Playwright, `tsc --noEmit` strict |
| Local | `docker compose up` (Postgres 16, Redis, Mailpit); `pnpm dev` |
| Environments | local / preview (per PR) / staging / production; same Postgres major version and env var names everywhere |
| Commits | Conventional Commits; semver releases (16) |
