---
purpose: Implementation queue — 66 microtasks, each ≤ 2 h, executable by an AI agent in one session
owner: EcoDigiTech founding team
status: Draft v0.2
last_updated: 2026-11-03
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
| M3 Self-serve & Practice Growth (P2) | Signup, Razorpay, wizard, publish, lead inbox, 5-page export | MT-041–050, MT-059–066 |
| M4 Hardening & P3 prep | Observability, load, chaos, IaC, K8s spec | MT-051–058 |
| PA Design system & shells | Tokens, fonts, icon set, CSS check, CMS shell, public template shell | MT-101–105 |
| PB Backend & data | Migrations, RLS, auth/2FA, public APIs, spam protection, outbox, audit | MT-106–114 |
| PC CMS | Inbox, statuses, settings, pages, blog, FAQs, testimonials, media, rollback | MT-115–124 |
| PD Public site | 7 pages, appointment form, blog, FAQ, testimonials, SEO, i18n | MT-125–132 |
| PE Operations | Backups, health, reviews report, SLA tracker, renewals, quotas, billing | MT-133–139 |
| PF Hardening | Load tests, security review, a11y audit, chaos GameDay, launch checklist, docs | MT-140–146 |

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

### Practice Growth Add-ons (P2)

**MT-059 Multi-page template routing and shared header/CTA.** reads: 01 § 2, 08 § 1, 17 § ADR-020. touches: `apps/site-template/src/{layout.tsx,routes.ts,components/Header.tsx,components/CtaBar.tsx}`. steps: (1) static route builder generating up to 5 static pages (Home `/`, About `/about/`, Services `/services/`, Testimonials `/testimonials/`, Contact `/contact/`) when `plan=growth`; (2) shared header highlighting active page link; (3) shared sticky CTA bar across all routes; (4) single-page fallback when `plan=basic`. accept: [ ] static build produces 5 distinct HTML files for growth [ ] basic builds single index.html [ ] active route aria-current verified [ ] bundle size within budget. depends: MT-009, MT-010. est: 2 h.

**MT-060 About page static section.** reads: 01 § 2, 08 § 1, 04 § SD-024. touches: `apps/site-template/src/pages/about.tsx`, `sections/AboutDoctor.tsx`. steps: (1) full-width biographical narrative and credentials definition list; (2) medical registration and alma mater callouts; (3) clinic hygiene/standards badges bar; (4) self-referencing canonical tag `https://{host}/about/`. accept: [ ] renders full doctor biography and qualifications [ ] canonical points to /about/ [ ] mobile responsive. depends: MT-059, MT-012. est: 1.5 h.

**MT-061 Testimonials page (consent-based reviews).** reads: 01 § 2, 08 § 1, 10 § 8, 17 § ADR-020. touches: `apps/site-template/src/pages/testimonials.tsx`, `sections/TestimonialsGrid.tsx`. steps: (1) patient reviews grid with verified treatment tags; (2) enforce consent-only display guard (filter reviews lacking verified consent flag); (3) per-page JSON-LD Review schema; (4) canonical tag `https://{host}/testimonials/`. accept: [ ] unconsented reviews suppressed [ ] Review schema validates [ ] canonical points to /testimonials/. depends: MT-059, MT-014. est: 1.5 h.

**MT-062 Appointment-request fields in form.** reads: 01 § 2, 07 § 10, 08 § 1, 17 § ADR-020. touches: `apps/site-template/src/sections/ContactForm.tsx`, `packages/content-schema/src/index.ts`. steps: (1) add optional `preferredDate` (HTML5 date input with min=tomorrow) and `preferredTime` (morning/afternoon/evening radio/select) to form when `plan=growth`; (2) update `LeadInput` schema; (3) forward to existing `POST /v1/leads` pipeline; (4) update outbox payload. accept: [ ] appointment request submits successfully to /v1/leads [ ] fields included in lead notification email/wa [ ] basic plan renders standard contact form without appointment fields. depends: MT-015, MT-059. est: 1.5 h.

**MT-063 Plan-aware Razorpay order.** reads: 01 § 2, 07 § 1, 07 § 3, 17 § ADR-021. touches: `apps/platform/src/app/v1/payments/order/route.ts`, `apps/platform/src/lib/razorpay.ts`. steps: (1) plan validator checking `basic` vs `growth`; (2) order creation setting amount to 699900 paise (basic) or 1299900 paise (growth) per 01 § 2; (3) order notes recording plan and tenant_id; (4) idempotency key support. accept: [ ] basic order creates with 699900 paise [ ] growth order creates with 1299900 paise [ ] invalid plan returns E-2101 [ ] same key returns existing order. depends: MT-041. est: 1.5 h.

**MT-064 Plan-aware SLA tracker.** reads: 01 § 2, 06 § 3, 04 § 2. touches: `apps/platform/src/workers/sla-tracker.ts`, `apps/platform/src/lib/sla.ts`. steps: (1) query subscription plan for active site; (2) count content update requests in current calendar month; (3) enforce quota: 1/month for basic, 3/month for growth; (4) calculate due date (+5 business days) and 80% elapsed warning. accept: [ ] basic 2nd update queued/rejected [ ] growth 4th update queued/rejected [ ] due date and breach warnings calculated correctly. depends: MT-030, MT-037. est: 1.5 h.

**MT-065 Plan-aware renewal sweep.** reads: 01 § 2, 06 § 4, 04 § 2, 17 § ADR-023. touches: `apps/platform/src/workers/renewal-sweep.ts`. steps: (1) join `domains` with `subscriptions.plan`; (2) set invoice/notification renewal amount to 299900 paise (₹2,999) for basic, 599900 paise (₹5,999) for growth; (3) interpolate `{renewal_price}` in en/hi notification templates; (4) test sweep idempotency. accept: [ ] basic renewal invoice generated for ₹2,999 [ ] growth renewal invoice generated for ₹5,999 [ ] notices display matching plan prices. depends: MT-040. est: 1.5 h.

**MT-066 GA4 + Search Console wiring step.** reads: 01 § 2, 11 § 5, 14 § 1. touches: `apps/platform/src/pipeline/seo-setup.ts`, `apps/platform/src/lib/google-search-console.ts`. steps: (1) Search Console DNS TXT verification record generator; (2) 5-page sitemap submission via Search Console API; (3) per-site GA4 stream ID provisioning; (4) post-publish checklist verification step. accept: [ ] DNS TXT entry created [ ] 5-page sitemap verified [ ] growth verification script asserts all 5 URLs indexable. depends: MT-035, MT-036, MT-059. est: 2 h.

### Milestone PA — Design system and shells

**MT-101 Tokens & typography setup.** tags: [F-01, F-07]. reads: 00 § R7, 08 § 1, 19 § 1, 19 § 2. touches: `packages/ui/src/tokens/*`, `apps/platform/src/styles/*`, `apps/site-template/src/styles/*`. steps: (1) CSS variables for clinical green/mint/teal, neutral surfaces, borders, status badges, dark mode tokens; (2) self-hosted Plus Jakarta Sans / Inter woff2; (3) Devanagari fallback font chain. accept: [ ] light and dark tokens defined [ ] contrast ≥ 4.5:1 [ ] no external Google Fonts network calls. depends: MT-001. est: 1.5 h.

**MT-102 Icon family & brand marks.** tags: [F-01, F-05, F-07]. reads: 00 § R7, 19 § 3. touches: `packages/ui/src/components/icons/*`, `apps/platform/src/components/Icons.tsx`. steps: (1) Lucide SVG components on 20/24px grid; (2) SVG clinic logo and credentials mark; (3) ESLint ban on emoji in UI packages. accept: [x] SVG icon set renders cleanly [x] zero emoji detected across components [x] icon bundle tree-shakes. depends: MT-101. est: 1.5 h.

**MT-103 CSS pipeline & anti-FOUC verification.** tags: [F-01]. reads: 00 § R7, 19 § 9, 13 § 7. touches: `apps/site-template/scripts/check-css.ts`, `.github/workflows/pr.yml`. steps: (1) build script verifying compiled stylesheet is linked and non-empty in output; (2) Playwright test asserting computed styles on initial render; (3) CI failure on unstyled render. accept: [x] CSS bundle verified in build output [x] Playwright computed style check passes [x] FOUC test catches unstyled HTML. depends: MT-101. est: 1 h.

**MT-104 CMS app shell.** tags: [F-03, F-05]. reads: 00 § R7, 18 § 1, 19 § 5. touches: `apps/platform/src/app/cms/layout.tsx`, `components/cms/Sidebar.tsx`, `Header.tsx`. steps: (1) desktop collapsible sidebar with icon+label; (2) clinic name badge; (3) top bar breadcrumbs, user avatar, and light/dark theme switcher. accept: [x] sidebar collapses smoothly [x] active nav state highlighted [x] accessible keyboard focus styles. depends: MT-102. est: 2 h.

**MT-105 Public 7-page template shell.** tags: [F-01]. reads: 00 § R7, 08 § 1, 19 § 6. touches: `apps/site-template/src/app/layout.tsx`, `components/{Header,Footer,MobileCtaBar}.tsx`. steps: (1) shared header with clinical logo, phone CTA, 7-page navigation dropdown/drawer; (2) sticky bottom CTA bar (call/WhatsApp/appointment) < 768px; (3) footer with NAP + DPDP notice. accept: [x] responsive nav drawer opens/closes [x] sticky CTA bar active on mobile [x] axe clean (zero violations). depends: MT-101, MT-102. est: 2 h.

### Milestone PB — Backend and data

**MT-106 Database migrations for Professional Clinic.** tags: [F-02, F-04, F-06]. reads: 04 § 2, 04 § 3, 18 § 2. touches: `apps/platform/src/db/schema.ts`, `apps/platform/drizzle/0001_professional_clinic.sql`. steps: (1) Drizzle tables for `appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`; (2) add `professional` to `plan` enum; (3) export schema types. accept: [x] plain SQL migration applies cleanly on PostgreSQL 16 [x] schema types exported [x] foreign keys valid. depends: MT-006. est: 2 h.

**MT-107 RLS policies & two-clinic isolation suite.** tags: [F-02]. reads: 03 § 3, 04 § 3, 13 § 1. touches: `apps/platform/drizzle/0002_rls_policies.sql`, `apps/platform/test/rls-isolation.test.ts`. steps: (1) enable RLS on all 8 new tables; (2) create tenant isolation policies `USING (tenant_id = current_setting('app.tenant_id')::uuid)`; (3) write two-clinic isolation test asserting 0 cross-reads on every table. accept: [x] RLS active on all tenant tables [x] two-clinic isolation test passes [x] direct cross-tenant query returns empty. depends: MT-106. est: 2 h.

**MT-108 PII encryption & decryption engine.** tags: [F-04, F-09]. reads: 00 § R9, 04 § 8, 10 § SD-050. touches: `apps/platform/src/lib/crypto.ts`, `test/crypto.test.ts`. steps: (1) AES-256-GCM encryption/decryption for patient contact fields (name, phone, email, message); (2) 12-byte random IV; (3) PII scrubber for logger. accept: [x] encrypt/decrypt roundtrip passes [x] key rotation support [x] plaintext never written to log. depends: MT-106. est: 1.5 h.

**MT-109 Public appointments API & idempotency.** tags: [F-04, F-08]. reads: 07 § 1, 07 § 3, 09 § 1. touches: `apps/platform/src/app/api/v1/public/appointments/route.ts`. steps: (1) implement `POST /v1/public/appointments`; (2) CORS domain check; (3) `Idempotency-Key` header; (4) rate limiting (5/min/IP); (5) zod validation and transactional insert of encrypted appointment + outbox event. accept: [ ] valid payload returns 202 [ ] duplicate idempotency key returns replay response [ ] invalid payload returns 422 E-1101. depends: MT-107, MT-108. est: 2 h.

**MT-110 Public enquiries API & availability endpoint.** tags: [F-04, F-08]. reads: 07 § 1, 07 § 3. touches: `apps/platform/src/app/api/v1/public/enquiries/route.ts`, `availability/route.ts`. steps: (1) implement `POST /v1/public/enquiries`; (2) implement `GET /v1/public/availability` returning configured clinic slots and operating hours. accept: [ ] enquiry inserts to DB with consent timestamp [ ] availability respects clinic_settings [ ] rate limited. depends: MT-107, MT-108. est: 1.5 h.

**MT-111 Turnstile, honeypot & bot protection.** tags: [F-08]. reads: 00 § R9, 10 § SD-055, 09 § 1. touches: `apps/platform/src/lib/spam-protection.ts`, `test/spam.test.ts`. steps: (1) Cloudflare Turnstile token verification server-side; (2) hidden honeypot field check; (3) time-trap (< 3s rejection). accept: [ ] fake bot submission rejected with 403 E-1604 [ ] honeypot trigger blocked [ ] valid Turnstile token passes. depends: MT-109. est: 1.5 h.

**MT-112 Outbox notifier job with Resend.** tags: [F-04, F-10]. reads: 03 § 2, 06 § 2. touches: `apps/platform/src/jobs/notifier.ts`, `apps/platform/src/lib/resend.ts`. steps: (1) pg-boss worker draining `appointment.created` and `enquiry.created` outbox events; (2) format clinic notification email; (3) dispatch via Resend; (4) retry with exponential backoff. accept: [ ] email dispatched within P95 < 60 s [ ] Resend timeout/breaker handles failures [ ] eventual delivery confirmed. depends: MT-109. est: 2 h.

**MT-113 TOTP 2FA auth & session management.** tags: [F-03]. reads: 10 § SD-056, 07 § 1. touches: `apps/platform/src/app/api/v1/auth/totp/*`, `src/lib/auth.ts`. steps: (1) RFC-6238 TOTP setup and QR code generation; (2) TOTP verification challenge on login; (3) brute-force lockout (5 attempts / 15 min); (4) 8 backup recovery codes. accept: [ ] setup generates valid secret [ ] valid code unlocks session [ ] invalid code rejected E-1605. depends: MT-106. est: 2 h.

**MT-114 Audit trail engine.** tags: [F-06]. reads: 04 § 2, 18 § 7. touches: `apps/platform/src/lib/audit.ts`, `test/audit.test.ts`. steps: (1) append-only audit logger capturing actor, action, resource, diff JSON, IP hash, user agent; (2) PostgreSQL triggers banning UPDATE/DELETE. accept: [ ] audit log entry recorded on mutations [ ] UPDATE/DELETE raises SQL exception [ ] no PII in audit bodies. depends: MT-106. est: 1.5 h.

### Milestone PC — CMS

**MT-115 Submissions dashboard (Today OPD & filters).** tags: [F-05]. reads: 18 § 3, 19 § 4. touches: `apps/platform/src/app/cms/submissions/page.tsx`, `components/cms/SubmissionsTable.tsx`. steps: (1) submissions table with status badges; (2) Today's OPD tab (`preferred_date = CURRENT_DATE`); (3) date range and service filters; (4) keyset cursor pagination. accept: [ ] seeded 10k rows paginates < 300 ms P99 [ ] Today tab filters correctly [ ] search filters records. depends: MT-104, MT-109. est: 2 h.

**MT-116 Submission detail drawer & staff notes.** tags: [F-05]. reads: 18 § 3. touches: `apps/platform/src/components/cms/SubmissionDrawer.tsx`. steps: (1) sliding detail drawer showing decrypted patient contact info, consent details, Turnstile score; (2) internal staff notes textarea with auto-save. accept: [ ] drawer opens smoothly [ ] staff note persists to DB [ ] access logged in audit trail. depends: MT-115. est: 1.5 h.

**MT-117 Status state machine & allowed transitions.** tags: [F-06]. reads: 18 § 3, 09 § 1. touches: `apps/platform/src/app/api/v1/cms/submissions/appointments/[id]/route.ts`, `components/cms/StatusTransitionBar.tsx`. steps: (1) enforce status transitions (`Pending -> Confirmed -> Completed`, `Pending -> Cancelled`, `Confirmed -> Cancelled`, `Cancelled -> Pending`); (2) reject invalid transitions with 422 E-1603; (3) record transition in `appointment_events` and `audit_log`. accept: [ ] Pending to Confirmed succeeds [ ] Completed to Pending rejected E-1603 [ ] status transition audited. depends: MT-115, MT-114. est: 1.5 h.

**MT-118 CSV export & WhatsApp direct confirmation.** tags: [F-05]. reads: 18 § 3. touches: `apps/platform/src/app/api/v1/cms/submissions/export/route.ts`, `components/cms/WhatsAppLink.tsx`. steps: (1) stream decrypted submissions to CSV download with RFC-4180 escaping; (2) one-click `wa.me` URL generator prefilled with patient name and confirmed appointment details. accept: [ ] CSV downloads < 3 s [ ] WhatsApp link formats correctly [ ] respects tenant boundary. depends: MT-115. est: 1.5 h.

**MT-119 Clinic settings CMS (Hours, slots & notifications).** tags: [F-02]. reads: 18 § 2, 18 § 3. touches: `apps/platform/src/app/cms/settings/page.tsx`, `components/cms/OperatingHoursEditor.tsx`. steps: (1) operating hours editor (Monday–Sunday open/close/closed); (2) slot interval dropdown (15/30/45/60 min); (3) notification emails list (max 3); (4) spam threshold slider. accept: [ ] saves clinic settings [ ] public availability endpoint updates immediately [ ] validation blocks invalid emails. depends: MT-104, MT-110. est: 2 h.

**MT-120 Page slots manager (7 pages limit enforcer).** tags: [F-01]. reads: 18 § 2, 09 § 1. touches: `apps/platform/src/app/cms/pages/page.tsx`, `packages/content-schema/src/schema.ts`. steps: (1) UI to toggle page slots out of 7 allowed (Home, About, Services, Doctors, Testimonials-FAQ, Blog, Contact); (2) schema validation rejects 8th page with 422 E-1601. accept: [ ] 7 pages toggled successfully [ ] 8th page attempt blocked with E-1601 [ ] draft content updated. depends: MT-104, MT-005. est: 1.5 h.

**MT-121 Rich-text blog editor with HTML sanitizer.** tags: [F-07]. reads: 00 § R9, 18 § 4, 10 § SD-054. touches: `apps/platform/src/app/cms/blog/*`, `components/cms/TipTapEditor.tsx`. steps: (1) TipTap editor for blog posts; (2) server-side `sanitize-html` stripping scripts/iframes; (3) cover image upload; (4) custom slug and SEO meta tags. accept: [ ] post draft saved [ ] malicious HTML/script stripped [ ] unique slug verified. depends: MT-104, MT-108. est: 2 h.

**MT-122 FAQs & testimonials CMS with consent check.** tags: [F-07]. reads: 00 § R10, 18 § 2, 10 § SD-054. touches: `apps/platform/src/app/cms/reviews-faqs/*`. steps: (1) FAQ CRUD with reordering; (2) Testimonials CRUD with mandatory consent checkbox, patient initials format, rating selector, and moderation status toggle (Draft -> Approved). accept: [ ] FAQs reorder saved [ ] testimonial requires consent checkbox [ ] unapproved testimonials stay draft. depends: MT-104. est: 1.5 h.

**MT-123 Media library & per-card asset replacement.** tags: [F-07, F-11]. reads: 18 § 5, 10 § SD-054. touches: `apps/platform/src/app/cms/media/*`, `components/cms/Dropzone.tsx`, `PhotoReplaceDrawer.tsx`. steps: (1) file dropzone uploading to R2 bucket `assets/{tenant_id}/`; (2) magic-byte check; (3) SVG sanitizer; (4) per-card photo replace drawer; (5) storage quota tracker (1 GB limit). accept: [ ] uploaded image converted to WebP/AVIF [ ] per-card photo replacement swaps asset instantly [ ] quota meter updates. depends: MT-104. est: 2 h.

**MT-124 Publishing saga & rollback controller.** tags: [F-01, F-07]. reads: 18 § 6, 06 § 1. touches: `apps/platform/src/app/api/v1/sites/[id]/publish/route.ts`, `rollback/route.ts`, `components/cms/PublishBar.tsx`. steps: (1) trigger publish saga: validate schema -> dispatch Docker renderer -> upload to R2 -> swap live_version pointer -> purge Cloudflare CDN cache; (2) 1-click rollback endpoint. accept: [ ] publish saga succeeds end-to-end [ ] live site serves new version [ ] rollback reverts pointer in < 10 s. depends: MT-120, MT-121. est: 2 h.

### Milestone PD — Public site

**MT-125 Public home page (Clinical split hero & timings).** tags: [F-01]. reads: 00 § R7, 08 § 1, 19 § 6. touches: `apps/site-template/src/app/page.tsx`, `sections/HomeSections.tsx`. steps: (1) medical badge; (2) clinical split hero with doctor cutout on rounded shape, nameplate, quick appointment trigger; (3) services preview; (4) clinic timings banner. accept: [ ] LCP < 2.0 s [ ] mobile stacks cleanly [ ] screenshot matches clinical visual direction. depends: MT-105. est: 2 h.

**MT-126 About page & doctor credentials showcase.** tags: [F-01]. reads: 08 § 1, 19 § 6. touches: `apps/site-template/src/app/about/page.tsx`. steps: (1) doctor full biography and degrees; (2) medical council registration badge; (3) hospital attachments and philosophy of care. accept: [ ] registration credentials prominently displayed [ ] responsive layout [ ] axe clean. depends: MT-105. est: 1.5 h.

**MT-127 Services page (Comprehensive treatment grid).** tags: [F-01]. reads: 08 § 1, 19 § 6. touches: `apps/site-template/src/app/services/page.tsx`. steps: (1) grid of up to 12 clinic treatments with clinical icons, indication summaries, recovery guidelines; (2) direct booking CTA per service. accept: [ ] all enabled services render [ ] icons from Lucide SVG family [ ] zero emoji. depends: MT-105, MT-102. est: 1.5 h.

**MT-128 Doctors & specialists roster page.** tags: [F-01]. reads: 18 § 2, 19 § 6. touches: `apps/site-template/src/app/doctors/page.tsx`. steps: (1) multi-doctor profile cards with qualifications, consulting days, hours; (2) appointment button linking to booking form. accept: [ ] specialist cards format correctly [ ] doctor photo renders with alt text [ ] mobile responsive. depends: MT-105. est: 1.5 h.

**MT-129 Testimonials & FAQ interactive page.** tags: [F-01, F-07]. reads: 00 § R10, 18 § 2, 19 § 6. touches: `apps/site-template/src/app/testimonials-faq/page.tsx`. steps: (1) tabbed view: verified patient testimonials (stars, initials, treatment); (2) accessible `<details>` accordion FAQs categorized by topic. accept: [ ] only approved testimonials render [ ] FAQ accordion zero JS dependency [ ] structured JSON-LD emitted. depends: MT-105, MT-122. est: 1.5 h.

**MT-130 Blog index & article detail pages.** tags: [F-01, F-07]. reads: 18 § 2, 11 § 5. touches: `apps/site-template/src/app/blog/page.tsx`, `apps/site-template/src/app/blog/[slug]/page.tsx`. steps: (1) blog listing page with cover image cards, tags, reading time; (2) article detail page rendering sanitized content, author bio, social share, and `BlogPosting` JSON-LD schema. accept: [ ] blog index and article pages build statically [ ] sanitized HTML rendered [ ] canonical and OG tags valid. depends: MT-105, MT-121. est: 2 h.

**MT-131 Contact & interactive appointment form.** tags: [F-01, F-04, F-08]. reads: 18 § 3, 19 § 6, 10 § SD-055. touches: `apps/site-template/src/app/contact/page.tsx`, `components/AppointmentForm.tsx`. steps: (1) appointment booking form with slot selector, patient details, consent checkbox, Turnstile widget; (2) general enquiry form; (3) Google Maps facade with click-to-load. accept: [ ] live form submit creates appointment row in DB [ ] Turnstile blocks bots [ ] outbox fallback triggers if offline. depends: MT-105, MT-109, MT-111. est: 2 h.

**MT-132 Static build verification & 7-page SEO pipeline.** tags: [F-01, F-12]. reads: 11 § 5, 06 § 1. touches: `apps/site-template/src/app/sitemap.ts`, `robots.ts`, `render.ts`. steps: (1) static export pipeline for all 7 pages + blog post slugs; (2) `sitemap.xml` with `<lastmod>` and per-page canonical tags; (3) Lighthouse CI check. accept: [ ] all 7 pages build into static output dist [ ] Lighthouse Mobile Perf ≥ 90, A11y ≥ 95 [ ] JS bundle ≤ 170 KB gz per page. depends: MT-125..MT-131. est: 2 h.

### Milestone PE — Operations

**MT-133 Scheduled nightly database backups to R2.** tags: [F-13]. reads: 14 § 5, 04 § 2. touches: `scripts/backup/dump-db.sh`, `.github/workflows/backup.yml`. steps: (1) automated script dumping PostgreSQL database, encrypting archive with GPG, uploading to Cloudflare R2 bucket with 30-day retention; (2) weekly restore drill validation. accept: [ ] automated backup script runs cleanly [ ] encrypted dump uploaded to R2 [ ] restore verification script succeeds. depends: MT-106. est: 1.5 h.

**MT-134 Health & readiness probes with circuit breakers.** tags: [F-13]. reads: 09 § SD-010, 09 § SD-013, 07 § 1. touches: `apps/platform/src/app/api/health/route.ts`, `api/ready/route.ts`. steps: (1) `/api/health` and `/api/ready` endpoints checking PostgreSQL connection pool, Redis ping, and dependency circuit breakers; (2) external 5-min probe configuration. accept: [ ] returns 200 when healthy [ ] returns 503 with degraded component on failure [ ] responds in < 50 ms. depends: MT-107. est: 1 h.

**MT-135 Monthly security & dependency review generator.** tags: [F-14]. reads: 10 § 1, 14 § 3. touches: `apps/platform/src/jobs/securityReport.ts`, `src/app/cms/reports/page.tsx`. steps: (1) monthly cron job compiling Renovate dependency updates, audit log security events, CVE status, and backup logs into downloadable tenant PDF/HTML report; (2) SLA tracker for 7-day vulnerability window. accept: [ ] monthly report generated [ ] stored in tenant dashboard [ ] 7-day vulnerability SLA tracker active. depends: MT-114. est: 2 h.

**MT-136 Plan-aware SLA & 15-day bug-fix clock.** tags: [F-15]. reads: 06 § 3, 01 § 2. touches: `apps/platform/src/lib/sla.ts`, `components/cms/SlaTracker.tsx`. steps: (1) SLA engine tracking monthly content updates (up to 3/month, auto-reset on 1st); (2) 15-day bug-fix countdown clock starting from defect report timestamp. accept: [ ] 3 update counter resets monthly [ ] 15-day countdown alerts at 80% [ ] breach flag triggered if SLA missed. depends: MT-114. est: 1.5 h.

**MT-137 Plan-aware renewal sweep at ₹9,999.** tags: [F-09, F-10]. reads: 06 § 4, 01 § 2. touches: `apps/platform/src/jobs/renewalSweep.ts`, `templates/renewalEmail.ts`. steps: (1) daily renewal sweep checking `domains.expires_on` and `subscriptions`; (2) create renewal orders for Professional Clinic at ₹9,999 (999900 paise); (3) dispatch 60/30/7-day bilingual notices (en/hi). accept: [ ] 60/30/7 day triggers fire [ ] Razorpay order amount = 999900 paise [ ] subscriptions date advances on payment. depends: MT-106. est: 2 h.

**MT-138 Database & media quota enforcer.** tags: [F-11]. reads: 04 § 10, 09 § 1. touches: `apps/platform/src/lib/quota.ts`, `components/cms/QuotaBanner.tsx`. steps: (1) middleware checking `usage_counters`: 5,000 submission records/year and 1 GB media storage; (2) render warning banner at 80%; (3) return 429 E-1602 at 100%. accept: [ ] warning banner shows at 80% [ ] mutation past 100% blocked with E-1602 [ ] counters increment accurately. depends: MT-106, MT-109, MT-123. est: 1.5 h.

**MT-139 Razorpay ₹18,999 billing & GST invoice generator.** tags: [F-10]. reads: 01 § 2, 07 § 4. touches: `apps/platform/src/lib/billing.ts`, `templates/invoice.tsx`. steps: (1) Razorpay order generation for ₹18,999 (`1899900` paise); (2) webhook confirmation handler; (3) generate compliant 18% GST tax invoice PDF with SAC code 998314 and email to clinic owner. accept: [ ] payment webhook activates subscription [ ] amount = 1899900 paise [ ] GST invoice PDF generated with correct tax breakdown. depends: MT-106. est: 2 h.

### Milestone PF — Hardening

**MT-140 R6 live-wiring Playwright verification suite.** tags: [F-04, F-06, F-07]. reads: 00 § R6, 13 § 1. touches: `tests/e2e/live-wiring.spec.ts`. steps: (1) end-to-end Playwright test suite: edit clinic hours/FAQ in CMS -> publish -> assert change live; (2) submit appointment on static page -> assert row in Postgres -> assert visible in CMS dashboard -> transition to Confirmed. accept: [ ] full live-wiring suite green [ ] zero mocks used [ ] evidence logged in walkthrough artifact. depends: MT-115, MT-124, MT-131. est: 2 h.

**MT-141 Multi-width visual & screenshot protocol.** tags: [F-01, F-05, F-07]. reads: 00 § R7, 00 § R8, 19 § 8. touches: `tests/e2e/visual-screenshots.spec.ts`. steps: (1) Playwright script capturing screenshots at 360 px, 768 px, and 1280 px across all 7 public pages and all CMS screens in both light and dark themes; (2) validate anti-AI checklist. accept: [ ] 42 screenshots captured without visual defects [ ] anti-AI checklist passed [ ] dark mode contrast validated. depends: MT-124, MT-132. est: 2 h.

**MT-142 Load & performance benchmark.** tags: [F-05, F-11]. reads: 13 § 5, 03 § 9. touches: `tests/load/k6-submissions.js`. steps: (1) k6 load test: 500 appointment submissions/minute spike; (2) verify P99 latency < 300 ms for public API and CMS inbox pagination on 10k rows; (3) DB connection pool holds < 80%. accept: [ ] P99 < 300 ms [ ] error rate < 0.1% [ ] CPU and pool stable. depends: MT-109, MT-115. est: 2 h.

**MT-143 Security & DPDP audit.** tags: [F-03, F-08, F-09]. reads: 00 § R9, 10 § 1, 10 § 8. touches: `tests/security/audit.test.ts`. steps: (1) test injection vectors (SQLi, XSS via rich text); (2) Turnstile spam bypass test; (3) CSRF token validation; (4) 2FA brute force lockout; (5) DPDP consent logging / deletion workflow. accept: [ ] zero injection vulnerabilities [ ] DPDP deletion wipes PII [ ] 2FA lockout holds. depends: MT-111, MT-113, MT-121. est: 2 h.

**MT-144 Chaos GameDay simulation.** tags: [F-13]. reads: 13 § 6, 09 § 3. touches: `scripts/chaos/gameday.sh`. steps: (1) simulate dependency failures on staging: Redis outage (fallback to DB idempotency); (2) renderer worker failure (saga compensation); (3) Resend API down (outbox retry). accept: [ ] public submissions succeed during Redis outage [ ] no orphaned records on renderer crash [ ] outbox resumes cleanly. depends: MT-112, MT-124, MT-134. est: 2 h.

**MT-145 Production launch checklist run.** tags: [F-12, F-13, F-14]. reads: 14 § 1, 14 § 2. touches: `docs/launch-runs/professional-clinic-alpha.md`. steps: (1) execute Checklist A (7 pages, forms, DNS, SSL, Turnstile, backup) and Checklist B; (2) document validation proof for each checkbox. accept: [ ] all checklist items ticked [ ] SSL verified active [ ] smoke test passes. depends: MT-132, MT-140. est: 1.5 h.

**MT-146 Documentation integrity & walkthrough evidence.** tags: [F-01..F-15]. reads: 00 § 4, 16 § 1. touches: `brain/*`, `16_CHANGELOG.md`. steps: (1) update all touched specifications; (2) record final ADRs; (3) append Keep-a-Changelog entries; (4) generate feature traceability proof report. accept: [ ] `docs-touched` gate passes [ ] changelog up to date [ ] walkthrough artifact generated. depends: MT-140..MT-145. est: 1.5 h.

## 5. Burndown table

| Milestone | Tasks | Est. hours | Critical path |
|---|---|---|---|
| M0 Foundations | 8 | 12.5 | MT-001 → MT-005 |
| M1 Template v1 + factory | 12 | 21.0 | MT-009 → MT-011 → MT-018 |
| M2 Platform core | 20 | 37.0 | MT-021 → MT-028 → MT-030 → MT-034 → MT-036 |
| M3 Self-serve & Growth (P2) | 18 | 31.5 | MT-041 → MT-042 → MT-045 → MT-047 → MT-059 |
| M4 Hardening & P3 prep | 8 | 14.5 | MT-051 → MT-053 |
| PA Design system & shells | 5 | 8.0 | MT-101 → MT-104 → MT-105 |
| PB Backend & data | 9 | 16.0 | MT-106 → MT-107 → MT-109 → MT-112 |
| PC CMS | 10 | 18.0 | MT-115 → MT-117 → MT-120 → MT-124 |
| PD Public site | 8 | 14.5 | MT-125 → MT-131 → MT-132 |
| PE Operations | 7 | 11.5 | MT-133 → MT-137 → MT-138 |
| PF Hardening | 7 | 13.0 | MT-140 → MT-141 → MT-145 → MT-146 |
| **Total** | **112** | **197.5** | — |

## 6. Feature Traceability Matrix (Professional Clinic F-01 to F-15)

| ID | Plan feature | Covered by Microtasks | Proof in CI |
|---|---|---|---|
| F-01 | Up to 7 pages, custom design | MT-101, MT-103, MT-105, MT-120, MT-125..MT-132, MT-141 | Static export emits exactly enabled pages; 8th page rejected (E-1601); screenshots at 3 widths |
| F-02 | Custom backend and database configuration | MT-106, MT-107, MT-119 | Two-clinic isolation test: zero cross-reads on every table |
| F-03 | Secure admin login | MT-104, MT-113, MT-143 | Auth suite: OTP + rotating refresh tokens + TOTP 2FA + lockout after 5 attempts |
| F-04 | Appointment and enquiry records | MT-106, MT-108, MT-109, MT-110, MT-112, MT-131, MT-140 | Submit on live page -> encrypted row created in Postgres -> visible in CMS (R6) |
| F-05 | Admin dashboard for submissions | MT-104, MT-115, MT-116, MT-118, MT-141, MT-142 | Seeded 10k rows paginate < 300 ms P99; filters & today OPD view functional |
| F-06 | Statuses Pending / Confirmed / Completed / Cancelled | MT-106, MT-114, MT-117, MT-140 | State machine test: illegal transition rejected (E-1603); every change audited in audit_log |
| F-07 | Basic blog CMS, editable FAQs / testimonials | MT-101, MT-102, MT-121, MT-122, MT-123, MT-124, MT-129, MT-130, MT-140 | Edit in CMS -> publish -> live page reflects update (R6); consent guard on reviews |
| F-08 | Form validation and basic spam protection | MT-109, MT-110, MT-111, MT-131, MT-143 | Turnstile + honeypot + time-trap block automated bots; valid submissions pass |
| F-09 | Standard domain, Year 1 | MT-108, MT-137, MT-143 | Hostname active; expiry tracked in `domains` table |
| F-10 | One year managed hosting | MT-112, MT-137, MT-139 | Static on R2/Cloudflare + platform on Vercel; subscription dates correct |
| F-11 | Database allowance for clinic volumes | MT-123, MT-138, MT-142 | Quota enforcer blocks submissions at 5,000 / media at 1 GB with E-1602; warning at 80% |
| F-12 | SSL, deployment, DNS, environment config | MT-132, MT-145 | Checklist A items pass; SSL active; automated build verified |
| F-13 | Scheduled backups, basic health checks | MT-133, MT-134, MT-144, MT-145 | Nightly encrypted dump to R2; restore drill succeeds; /api/health responds < 50 ms |
| F-14 | Monthly security and dependency review | MT-135, MT-145 | Monthly generated report in CMS; Renovate audit; 7-day vulnerability SLA tracked |
| F-15 | 3 content updates/month + 15-day bug-fix window | MT-136, MT-146 | Plan-aware SLA tracker: monthly counter resets on 1st; 15-day bug-fix countdown clock |
