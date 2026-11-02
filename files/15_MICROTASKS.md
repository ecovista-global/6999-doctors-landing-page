---
purpose: Implementation queue — 58 microtasks, each ≤ 2 h, executable by an AI agent in one session
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [00_MASTER_RULES.md, 03_ARCHITECTURE.md, 04_DATA_MODEL.md, 07_API_CONTRACT.md, 16_CHANGELOG.md]
---

# 15 — Microtasks

## 1. Rules

Every task is ≤ 2 h and executable in ONE agent session using only this task + the listed brain docs + 00_MASTER_RULES.md. No task says "and everything else". After each task: append to 16_CHANGELOG.md; file an ADR if a choice changed.

## 2. Task format

`ID — title` · reads · touches · steps · accept (checkboxes) · depends · est.

## 3. Milestone map

| Milestone | Goal | Tasks |
|---|---|---|
| M0 Foundations | Repo, CI skeleton, packages | MT-001–008 |
| M1 Template v1 + manual factory | Reproduce the ₹6,999 offer by hand via CLI | MT-009–020 |
| M2 Platform core | Auth, tenants, content, pipeline, domains | MT-021–040 |
| M3 Self-serve (P2) | Signup, Razorpay, wizard, publish, lead inbox | MT-041–050 |
| M4 Hardening & P3 prep | Observability, load, chaos, IaC, K8s spec | MT-051–058 |

## 4. The tasks

### M0

**MT-001 Monorepo scaffold.** reads: 02 § 1, 02 § 6. touches: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `apps/*`, `packages/*`. steps: (1) init pnpm workspace; (2) create `apps/platform`, `apps/site-template`, `packages/{ui,content-schema,config}`; (3) add turbo pipeline `build,lint,test,typecheck`. accept: [ ] `pnpm install` clean [ ] `pnpm turbo run build` passes on empty packages. depends: none. est: 1.5 h.

**MT-002 TS strict + lint config.** reads: 02 § 6, 10 § SD-042. touches: `packages/config/*`. steps: (1) shared tsconfig strict; (2) ESLint flat config with bans: raw SQL strings, `dangerouslySetInnerHTML`, top-level `let`; (3) Prettier. accept: [ ] violating sample files fail lint [ ] all packages extend config. depends: MT-001. est: 1 h.

**MT-003 Local stack.** reads: 02 § 6. touches: `docker-compose.yml`, `.env.example`. steps: (1) Postgres 16, Redis 7, Mailpit services; (2) healthchecks; (3) `pnpm dev:stack` script. accept: [ ] `docker compose up` healthy [ ] env example lists every variable. depends: MT-001. est: 1 h.

**MT-004 PR pipeline skeleton.** reads: 12 § 1, 12 § 2 (SD-066). touches: `.github/workflows/pr.yml`. steps: (1) pnpm store cache; (2) Turborepo remote cache; (3) typecheck/lint/test/build; (4) concurrency cancel. accept: [ ] warm run < 6 min [ ] PR blocked on failure. depends: MT-001. est: 2 h.

**MT-005 content-schema v1.** reads: 01 § 2, 08 § 1, 04 § SD-024, 07 § SD-078. touches: `packages/content-schema/src/*`. steps: (1) zod `ContentSheetSchema` (doctor, degrees, registration, services ≤ 9, clinic, hours, reviews ≤ 6, faq ≤ 8, theme, lang); (2) export types; (3) semver 1.0.0 + CHANGELOG. accept: [ ] valid golden passes [ ] garbage fails with typed errors [ ] script tags rejected. depends: MT-001. est: 2 h.

**MT-006 Drizzle + base migration.** reads: 04 § 2, 04 § SD-023. touches: `apps/platform/src/db/*`, `apps/platform/drizzle/0000_base.sql`. steps: (1) Drizzle config with `pg` driver; (2) tables tenants, users; (3) migrate script; (4) citext, pgcrypto extensions. accept: [ ] migration applies on empty Postgres 16 [ ] typed query test passes. depends: MT-003. est: 2 h.

**MT-007 Gateway skeleton.** reads: 03 § SD-009, 07 § 5, 09 § 1. touches: `apps/platform/src/lib/gateway.ts`, `errors.ts`. steps: (1) `withGateway` with request ID; (2) error envelope + E-code registry; (3) JSON logger hook. accept: [ ] errors return RFC-7807 shape [ ] traceId present [ ] no stack in response. depends: MT-002. est: 2 h.

**MT-008 Docs/secret CI gates.** reads: 00 § 4, 10 § SD-019. touches: `.github/workflows/gates.yml`. steps: (1) `docs-touched` job; (2) gitleaks; (3) `pnpm audit` high. accept: [ ] sample PR without changelog fails [ ] planted fake key detected. depends: MT-004. est: 1 h.

### M1

**MT-009 Template shell & themes.** reads: 08 § 2. touches: `apps/site-template/src/styles/*`, `layout.tsx`. steps: (1) CSS variables for green and teal tokens; (2) self-hosted Plus Jakarta Sans woff2 (Latin) with `font-display: swap`; (3) base layout, skip link. accept: [ ] both themes switch via `data-theme` [ ] contrast ≥ 4.5:1 [ ] CSS < 8 KB gzipped. depends: MT-001, MT-005. est: 2 h.

**MT-010 Header + sticky CTA bar.** reads: 08 § 1, 08 § 5. touches: `apps/site-template/src/sections/{Header,CtaBar}.tsx`. steps: (1) nav anchors; (2) bottom bar call/WhatsApp/form ≥ 48 px; (3) hidden ≥ 768 px; (4) `tel:`/`wa.me` builders. accept: [ ] links correct for +91 numbers [ ] axe clean. depends: MT-009. est: 1.5 h.

**MT-011 Hero split section.** reads: 08 § 1 (row 3), 08 § 2 (LCP). touches: `sections/Hero.tsx`. steps: (1) headline + intro + CTAs left; (2) photo on rounded green/teal shape right; (3) name plate "DR. NAME (DEGREE)"; (4) `fetchpriority="high"`, width/height. accept: [ ] mobile stacks [ ] hero image is LCP [ ] no layout shift. depends: MT-009. est: 2 h.

**MT-012 Credentials + services.** reads: 08 § 1 (rows 4–5). touches: `sections/{Credentials,Services}.tsx`. steps: (1) definition list; (2) services grid max 9; (3) empty-state guards. accept: [ ] renders golden sheet [ ] >9 services rejected by schema. depends: MT-009, MT-005. est: 1.5 h.

**MT-013 Clinic info + map facade.** reads: 08 § 1 (row 6), 10 § SD-045. touches: `sections/Clinic.tsx`, `lib/maps.ts`. steps: (1) address/hours table; (2) click-to-load Maps iframe; (3) URL regex validation. accept: [ ] no Google request before click [ ] bad URL rejected. depends: MT-009. est: 1.5 h.

**MT-014 Reviews, FAQ, footer.** reads: 08 § 1 (rows 7, 8, 10). touches: `sections/{Reviews,Faq,Footer}.tsx`. steps: (1) reviews cards; (2) FAQ with `<details>`; (3) footer NAP + privacy link. accept: [ ] zero JS for FAQ [ ] NAP equals JSON-LD. depends: MT-009. est: 1.5 h.

**MT-015 Contact form + outbox fallback.** reads: 07 § 3 (SD-001), 09 § 6, 08 § 2 (form UX). touches: `sections/ContactForm.tsx`, `lib/lead-client.ts`. steps: (1) fields + consent + honeypot; (2) POST with Idempotency-Key; (3) localStorage outbox, retry 1/3/9/27 s; (4) mailto/wa.me fallback. accept: [ ] API blocked → fallback shown ≤ 40 s [ ] same key reused on retry [ ] JS < 8 KB gz. depends: MT-010. est: 2 h.

**MT-016 SEO head, sitemap, robots, JSON-LD.** reads: 11 § 5, 10 § SD-043. touches: `lib/seo.ts`, `app/{sitemap,robots}.ts`. steps: (1) meta/OG/canonical; (2) JSON-LD via `JSON.stringify` with `<` escaped; (3) sitemap/robots; (4) preview noindex. accept: [ ] JSON-LD validates [ ] title ≤ 60 chars. depends: MT-005. est: 2 h.

**MT-017 Asset pipeline.** reads: 06 § 1, 08 § 2 (images). touches: `packages/ui/src/assets/*`. steps: (1) sharp AVIF+WebP at 360/640/960 w; (2) blur placeholder ≤ 1 KB; (3) size caps; (4) magic-byte check. accept: [ ] hero ≤ 60 KB at 640 [ ] non-image rejected E-1201. depends: MT-001. est: 2 h.

**MT-018 Renderer image + CLI.** reads: 12 § 5 (SD-061), 06 § 1. touches: `infra/docker/renderer.Dockerfile`, `apps/site-template/scripts/render.ts`. steps: (1) multi-stage Dockerfile non-root; (2) CLI `render --sheet x.json --out dist/`; (3) hadolint. accept: [ ] static export from golden sheet < 90 s [ ] image < 700 MB. depends: MT-011..016. est: 2 h.

**MT-019 Lighthouse & bundle gates.** reads: 13 § 7, 02 § 5. touches: `lighthouserc.json`, `scripts/size-check.ts`. steps: (1) LHCI mobile profile; (2) assert perf ≥ 90, a11y ≥ 95; (3) size check ≤ 170 KB. accept: [ ] failing page blocks CI [ ] report artifact. depends: MT-018, MT-004. est: 1.5 h.

**MT-020 Golden sheet, snapshot, manual runbook.** reads: 13 § 3, 14 § 1. touches: `fixtures/golden.json`, `docs/manual-factory.md`. steps: (1) Indian sample doctor; (2) snapshot test; (3) manual CLI-to-R2 runbook. accept: [ ] byte-stable snapshot [ ] runbook produces a live preview. depends: MT-018. est: 1.5 h.

### M2

**MT-021 Core schema migration.** reads: 04 § 2, 04 § SD-020. touches: `drizzle/0001_core.sql`. steps: (1) sites, domains, content_sheets, leads, lead_events; (2) indexes (leads_tenant_created, domains_expiry, GIN); (3) uniques. accept: [ ] EXPLAIN uses index on inbox query [ ] migration expand-safe. depends: MT-006. est: 2 h.

**MT-022 RLS + isolation test.** reads: 03 § 3, 10 § SD-048. touches: `drizzle/0002_rls.sql`, `tests/isolation.test.ts`. steps: (1) policies on tenant tables; (2) `withTenant(tx, id)` `SET LOCAL`; (3) test two tenants across all tables. accept: [ ] zero cross-reads [ ] app role lacks BYPASSRLS. depends: MT-021. est: 2 h.

**MT-023 Email OTP auth.** reads: 07 § 2, 10 § SD-002. touches: `app/v1/auth/otp/*`. steps: (1) request/verify routes; (2) 6-digit OTP hashed, 10 min, 5 attempts; (3) Resend send. accept: [ ] expired OTP rejected [ ] 6th attempt blocked. depends: MT-007, MT-006. est: 2 h.

**MT-024 JWT + refresh rotation.** reads: 10 § SD-047, 09 § SD-094. touches: `lib/auth/tokens.ts`, `drizzle/0003_refresh.sql`. steps: (1) ES256 access 15 min; (2) hashed refresh with family id; (3) reuse revokes family; (4) ±60 s tolerance. accept: [ ] reuse test revokes family [ ] logout-all works. depends: MT-023. est: 2 h.

**MT-025 RBAC middleware.** reads: 10 § SD-048. touches: `lib/gateway.ts`, `lib/rbac.ts`. steps: (1) role matrix as data; (2) `auth:` option in gateway; (3) deny audit. accept: [ ] matrix tests per role/resource [ ] deny logged. depends: MT-024. est: 1.5 h.

**MT-026 Rate limiting.** reads: 10 § SD-002, 07 § 7, 09 § SD-013. touches: `lib/ratelimit.ts`. steps: (1) Upstash sliding windows per route; (2) 429 + headers; (3) fail-open reads, fail-closed auth. accept: [ ] 6th form POST/min = 429 [ ] Redis down behavior tested. depends: MT-007. est: 1.5 h.

**MT-027 Idempotency middleware.** reads: 07 § 3 (SD-001), 09 § SD-014. touches: `lib/idempotency.ts`. steps: (1) Redis snapshot 24 h; (2) replay header; (3) E-1302/E-1303; (4) DB unique backstop. accept: [ ] 20 parallel same-key = 1 effect [ ] replay returns original. depends: MT-007, MT-026. est: 2 h.

**MT-028 Leads POST.** reads: 07 § 10, 10 § SD-050, 10 § SD-018, 04 § 8. touches: `app/v1/leads/route.ts`, `lib/crypto.ts`. steps: (1) zod LeadInput; (2) AES-256-GCM columns; (3) insert lead + outbox in one tx; (4) dynamic CORS from domains. accept: [ ] 202 < 300 ms P99 (k6 later) [ ] DB holds only ciphertext [ ] unknown origin blocked. depends: MT-022, MT-027. est: 2 h.

**MT-029 Leads GET.** reads: 07 § 6, 04 § SD-021. touches: `app/v1/leads/route.ts`. steps: (1) keyset cursor; (2) projection; (3) decrypt for authorized roles. accept: [ ] ≤ 5 queries [ ] max limit 100. depends: MT-028, MT-025. est: 1.5 h.

**MT-030 pg-boss + queues + DLQ.** reads: 03 § SD-036, 06 § 2 (SD-039/040). touches: `workers/boss.ts`, `app/api/worker/drain/route.ts`. steps: (1) queues with retry/backoff table; (2) DLQs; (3) cron-driven drain route; (4) depth limits. accept: [ ] poison job lands in DLQ after 3 tries [ ] backpressure rejects low priority. depends: MT-006. est: 2 h.

**MT-031 Outbox + notifier.** reads: 03 § SD-034/038, 09 § SD-012. touches: `workers/outbox.ts`, `workers/notify.ts`. steps: (1) dispatcher every 5 s; (2) lead email template via Resend; (3) `lead_events` writes; (4) breaker. accept: [ ] lead email < 60 s P95 [ ] duplicate event de-duplicated. depends: MT-030, MT-028. est: 2 h.

**MT-032 Content PUT with optimistic lock.** reads: 04 § SD-025, 07 § 1. touches: `app/v1/sites/[id]/content/route.ts`. steps: (1) zod validate; (2) guarded version update; (3) 409 E-1301; (4) audit. accept: [ ] concurrent test one 409 [ ] invalid → E-2101. depends: MT-005, MT-021. est: 2 h.

**MT-033 Publish saga.** reads: 03 § SD-035, 06 § 1, 09 § 4. touches: `pipeline/publish.ts`. steps: (1) step runner with compensations; (2) enqueue validate/build/publish; (3) state persisted; (4) idempotency key `tenant:version`. accept: [ ] kill mid-build leaves old version live [ ] duplicate publish no-op. depends: MT-030, MT-032. est: 2 h.

**MT-034 Renderer dispatch + R2 swap.** reads: 02 § SD-088, 03 § 4, 03 § SD-007. touches: `pipeline/dispatch.ts`, `.github/workflows/render-site.yml`, `infra/worker/host-router.ts`. steps: (1) workflow_dispatch with signed callback; (2) R2 upload prefix per version; (3) pointer swap + purge; (4) Worker host → prefix. accept: [ ] build < 90 s [ ] swap < 5 s [ ] unknown host 404. depends: MT-018, MT-033. est: 2 h.

**MT-035 Domains + Cloudflare.** reads: 03 § SD-060, 10 § SD-049, 09 § SD-010. touches: `lib/cloudflare.ts`, `workers/domain-poll.ts`. steps: (1) create custom hostname; (2) poll SSL status 5 min; (3) store expiry; (4) breaker/timeouts. accept: [ ] hostname active in staging [ ] failures retried with jitter. depends: MT-030, MT-021. est: 2 h.

**MT-036 Post-publish verification.** reads: 06 § 1, 14 § 1. touches: `pipeline/verify.ts`. steps: (1) fetch live host; (2) test lead submit; (3) wa.me/tel check; (4) JSON-LD validate. accept: [ ] failure triggers compensation [ ] results stored. depends: MT-034, MT-035. est: 1.5 h.

**MT-037 Operator UI: tenants & intake.** reads: 01 § 6 (US-101), 08 § 2. touches: `app/(operator)/tenants/*`. steps: (1) list/create tenant; (2) intake form from schema; (3) draft sheet save. accept: [ ] slug unique [ ] draft < 2 s. depends: MT-025, MT-032. est: 2 h.

**MT-038 Operator UI: asset upload.** reads: 05 § 1, 02 § SD-088. touches: `app/v1/assets/presign/route.ts`, `app/(operator)/assets/*`. steps: (1) presigned R2 URL 10 min; (2) consent checkbox; (3) trigger MT-017 pipeline. accept: [ ] 5 MB cap [ ] direct-to-R2 upload. depends: MT-037, MT-017. est: 1.5 h.

**MT-039 Rollback.** reads: 06 § 5, 12 § SD-073. touches: `app/v1/sites/[id]/rollback/route.ts`. steps: (1) swap live_version N-1; (2) purge + verify; (3) UI button. accept: [ ] < 2 min [ ] audit entry. depends: MT-034. est: 1.5 h.

**MT-040 Renewal sweep.** reads: 06 § 4, 04 § SD-027, 02 § SD-031. touches: `workers/renewal-sweep.ts`. steps: (1) advisory lock; (2) 60/30/7/0 notices en/hi; (3) idempotent per day. accept: [ ] two parallel sweeps = one run [ ] notices logged. depends: MT-031, MT-035. est: 2 h.

### M3

**MT-041 Razorpay order + checkout.** reads: 07 § 1, 07 § 3, 01 § 5. touches: `app/v1/payments/*`, `lib/razorpay.ts`. steps: (1) create order ₹6,999 (paise 699900); (2) checkout; (3) confirm route with Idempotency-Key. accept: [ ] test-mode payment completes [ ] timeouts 8 s. depends: MT-027. est: 2 h.

**MT-042 Webhook ingestion.** reads: 05 § 4, 07 § 4 (SD-017). touches: `app/v1/webhooks/razorpay/route.ts`. steps: (1) raw body HMAC; (2) 5-min window; (3) idempotent insert; (4) 200 < 3 s. accept: [ ] replay ignored [ ] bad signature 401. depends: MT-041. est: 2 h.

**MT-043 Tenant activation + invoice.** reads: 04 § SD-026, 03 § SD-034. touches: `workers/activate.ts`. steps: (1) FOR UPDATE reconcile; (2) status active + outbox; (3) GST invoice email (18%). accept: [ ] activation < 30 s [ ] double webhook = one activation. depends: MT-042. est: 2 h.

**MT-044 Signup + Google OAuth.** reads: 10 § SD-046, 07 § 2. touches: `app/(auth)/*`. steps: (1) signup UI; (2) PKCE/state/nonce; (3) account linking rule. accept: [ ] state mismatch rejected [ ] unverified email refused. depends: MT-024. est: 2 h.

**MT-045 Wizard UI.** reads: 08 § 3, 01 § 6 (US-204–207). touches: `app/(portal)/wizard/*`. steps: (1) 7 steps; (2) autosave 5 s; (3) theme picker; (4) preview link. accept: [ ] resume after reload [ ] preview < 60 s. depends: MT-032, MT-044. est: 2 h.

**MT-046 Editor conflict UX.** reads: 08 § 3, 04 § SD-025. touches: `app/(portal)/editor/*`. steps: (1) banner on E-1301; (2) field diff; (3) keep/reload actions. accept: [ ] two-tab E2E passes [ ] no silent overwrite. depends: MT-045. est: 1.5 h.

**MT-047 SSE progress + fallback.** reads: 08 § 4 (SD-054–056), 03 § SD-037. touches: `app/v1/sites/[id]/events/route.ts`, `lib/progress-client.ts`. steps: (1) SSE ≤ 55 s; (2) Redis channel; (3) stale UX at 15 s; (4) polling fallback. accept: [ ] reconnect with Last-Event-ID [ ] fallback after 2 failures. depends: MT-033. est: 2 h.

**MT-048 Lead inbox UI.** reads: 07 § 6, 01 § 6 (US-210). touches: `app/(portal)/leads/*`. steps: (1) list with cursor; (2) mark handled; (3) CSV export. accept: [ ] 10k leads paginate fast [ ] CSV excludes nothing unauthorized. depends: MT-029. est: 1.5 h.

**MT-049 WhatsApp Cloud API notify.** reads: 05 § 1, 09 § SD-013, 07 § 4. touches: `workers/notify-wa.ts`. steps: (1) template message send; (2) callback webhook; (3) breaker; (4) email fallback. accept: [ ] flag `whatsapp_cloud_notify` gates it [ ] P95 < 60 s. depends: MT-031. est: 2 h.

**MT-050 Domain setup UI.** reads: 08 § 3, 03 § SD-060. touches: `app/(portal)/domain/*`. steps: (1) DNS instructions; (2) status polling; (3) error states. accept: [ ] status updates ≤ 5 min [ ] SSL active shown. depends: MT-035. est: 1.5 h.

### M4

**MT-051 Logging, request IDs, tracing.** reads: 14 § 3 (SD-100, SD-102). touches: `lib/logger.ts`, `instrumentation.ts`. steps: (1) pino + scrubber; (2) requestId into SQL comment and job data; (3) OTel 10% sampling. accept: [ ] one id traced across layers [ ] PII scrub test. depends: MT-007. est: 2 h.

**MT-052 Health, probes, alerts.** reads: 12 § 4 (SD-074), 14 § 3 (SD-104). touches: `app/api/{health,ready}/route.ts`, `infra/alerts.yml`. steps: (1) endpoints; (2) probes every 5 min; (3) severity routing. accept: [ ] killed Postgres → ready 503 [ ] Sev table implemented. depends: MT-030. est: 1.5 h.

**MT-053 k6 load tests.** reads: 13 § 5, 03 § SD-089–092. touches: `tests/load/*`. steps: (1) lead burst; (2) portal 50 rps; (3) thresholds. accept: [ ] p99 < 300 ms [ ] runs only against preview. depends: MT-028. est: 2 h.

**MT-054 Chaos scripts.** reads: 13 § 6 (SD-099). touches: `scripts/chaos/*`. steps: (1) five experiments; (2) abort conditions; (3) findings template. accept: [ ] each experiment documented with expected result. depends: MT-052. est: 1.5 h.

**MT-055 Terraform modules.** reads: 12 § 8 (SD-067/068). touches: `infra/terraform/*`. steps: (1) Cloudflare zone/WAF; (2) Postgres host + Upstash; (3) GitHub settings; (4) plan-on-PR. accept: [ ] clean plan on fresh account [ ] drift job. depends: MT-004. est: 2 h.

**MT-056 Partitions + backup verify.** reads: 04 § SD-029, 14 § 5 (SD-097). touches: `workers/partitions.ts`, `.github/workflows/backup-verify.yml`. steps: (1) monthly partition creator; (2) dump to R2; (3) restore check. accept: [ ] partitions ≥ 2 ahead [ ] restore row counts match. depends: MT-021. est: 2 h.

**MT-057 Feature flags + canary.** reads: 12 § 10 (SD-069), 12 § 3 (SD-071). touches: `lib/flags.ts`, `drizzle/0004_flags.sql`. steps: (1) table + Redis cache; (2) rollout hashing; (3) 90-day report. accept: [ ] 10% cohort stable per tenant [ ] kill-switch < 60 s. depends: MT-026. est: 1.5 h.

**MT-058 Helm chart + K8s spec build-out (P3).** reads: 12 § 6 (SD-062/063/075), 03 § SD-081. touches: `infra/helm/doctorsite/*`. steps: (1) chart with deployment/service/hpa/ingress; (2) values per env; (3) external-secrets; (4) helm lint in CI. accept: [ ] `helm template` renders [ ] marked P3, not deployed. depends: MT-018. est: 2 h.

## 5. Burndown table

| Milestone | Tasks | Est. hours | Critical path |
|---|---|---|---|
| M0 | 8 | 12.5 | MT-001 → MT-005 |
| M1 | 12 | 21.0 | MT-009 → MT-011 → MT-018 |
| M2 | 20 | 37.0 | MT-021 → MT-028 → MT-030 → MT-033 → MT-034 → MT-036 |
| M3 | 10 | 18.5 | MT-041 → MT-042 → MT-043 → MT-045 → MT-047 |
| M4 | 8 | 14.5 | MT-051 → MT-053 |
| Total | 58 | 103.5 | — |
