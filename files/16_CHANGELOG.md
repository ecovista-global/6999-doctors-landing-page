---
purpose: Keep-a-Changelog history for platform, template, content-schema and docs
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-03
related: [00_MASTER_RULES.md, 07_API_CONTRACT.md, 12_GITHUB_ACTIONS.md, 17_DECISIONS.md]
---

# 16 — Changelog

## 1. Versioning policy (SD-078)

| Artifact | MAJOR | MINOR | PATCH |
|---|---|---|---|
| Platform (`apps/platform`) | Breaking API (`/v2`) or breaking schema | New feature | Fix |
| Template (`apps/site-template`) | Section/layout break requiring content change | New optional section | Fix/style |
| `packages/content-schema` | Removed/renamed/required field | New optional field | Docs/fix |
| brain/ docs | Structure change (file added/removed) | New section | Edit/typo |

Rule: every merged PR appends an entry below; releases are cut from the pipeline in 12_GITHUB_ACTIONS.md § 3. Format: Keep a Changelog (Added, Changed, Deprecated, Removed, Fixed, Security).

## 2. Entries

## [Unreleased]

### Added (Milestone PB: Backend and Data — MT-109)

- **MT-109 (Public appointments API & idempotency):**
  - Implemented public appointment booking endpoint `POST /api/v1/public/appointments` in `apps/platform/src/app/api/v1/public/appointments/route.ts` with CORS preflight `OPTIONS` and standard RFC-7807 problem details error mapping.
  - Implemented Zod input validation schema `appointmentSubmissionSchema` in `apps/platform/src/lib/appointment-schemas.ts` enforcing Indian phone format (`+91`), clinic identifier resolution (`tenantId` or `clinicSlug`), ISO date format (`YYYY-MM-DD`), and mandatory DPDP Act 2023 patient consent (`consent: true`).
  - Implemented reusable sliding window IP rate limiter `checkRateLimit` in `apps/platform/src/lib/rate-limit.ts` enforcing 5 req/min/IP with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers (HTTP 429 `E-1501`).
  - Implemented reusable idempotency management engine in `apps/platform/src/lib/idempotency.ts` (`processIdempotency`, `saveIdempotencyResponse`, `clearIdempotency`) per SD-001:
    - Enforces mandatory `Idempotency-Key` header on mutating requests (HTTP 400 `E-1304`).
    - Exact replay with identical payload returns cached response with `X-Idempotent-Replay: true` (HTTP 202).
    - Idempotency key reused with different payload returns conflict error (HTTP 422 `E-1302`).
    - Concurrent duplicate requests return in-flight conflict with `Retry-After: 2` (HTTP 409 `E-1303`).
  - Transactional database execution in PostgreSQL:
    - Sets tenant isolation context (`set_config('app.tenant_id', ...)`).
    - Encrypts patient PII (`patient_name_enc`, `patient_phone_enc`, `patient_email_enc`) via AES-256-GCM (`encrypt()` from `@/lib/crypto`).
    - Hashes client IP using SHA-256 (`ip_hash`) for DPDP compliance.
    - Inserts appointment row into `appointments` with DB-level idempotency backstop.
    - Atomically creates transactional outbox event `appointment.created` in `outbox_events` for asynchronous notification dispatch.
    - Logs initial audit lifecycle entry in `appointment_events`.
  - Added test suite `apps/platform/test/public-appointments.test.ts` (7/7 tests passing) asserting 202 Accepted, replay header, conflict detection, validation failures, rate limiting, and CORS headers.
  - Added `test/public-appointments.test.ts` to `apps/platform/package.json` test runner (36/36 tests green across platform suite).

### Added (Milestone PB: Backend and Data — MT-108)

- **MT-108 (PII encryption & decryption engine):**
  - Implemented application-level AES-256-GCM encryption/decryption engine in `apps/platform/src/lib/crypto.ts` for patient PII fields per SD-050, 04 § 8, and Rule R9.
  - Implemented self-describing binary envelope `[version 0x01][keyIdLen][keyId][12-byte random IV][16-byte GCM tag][ciphertext]` with Additional Authenticated Data (AAD) binding metadata to authentication tag.
  - Added multi-key ring management supporting zero-downtime key rotation (`registerKey`, `setActiveKeyId`, `getActiveKeyId`, `reencrypt`). Older records decrypt seamlessly via key ID in envelope header.
  - Implemented deep PII scrubber for system loggers (`scrubPII`, `scrubString`, `createScrubbedLogger`):
    - Redacts known sensitive fields (`patientName`, `patientPhone`, `patientEmail`, `notes`, `totpSecret`, etc.) to `[REDACTED_PII]`.
    - Redacts binary bytea buffers to `[REDACTED_BINARY]` / `[ENCRYPTED_BYTEA]`.
    - Harvests object-level patient identifiers and masks them across freeform log text.
    - Pattern masks Indian mobile numbers (`[REDACTED_PHONE]`), emails (`[REDACTED_EMAIL]`), and Aadhaar formats (`[REDACTED_ID]`).
  - Added test suite `apps/platform/test/crypto.test.ts` (7/7 tests passing) asserting roundtrip fidelity, 12-byte random IV uniqueness, tampering rejection, key rotation / re-encryption, and zero plaintext PII leaks in log sinks.
  - Added `test/crypto.test.ts` to `apps/platform/package.json` test runner (29/29 tests green across platform suite).

### Added (Milestone PB: Backend and Data — MT-107)

- **MT-107 (RLS policies & two-clinic isolation suite):**
  - Enabled and forced PostgreSQL Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY; ALTER TABLE ... FORCE ROW LEVEL SECURITY;`) across all 16 tenant tables:
    - 8 Professional Clinic tables: `appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`.
    - 8 Core platform tenant-owned tables: `sites`, `domains`, `content_sheets`, `leads`, `lead_events`, `subscriptions`, `outbox_events`, `audit_log`.
  - Implemented SQL migration `apps/platform/drizzle/0002_rls_policies.sql` defining tenant isolation policies:
    - Tenant-keyed tables: `USING (NULLIF(current_setting('app.bypass_rls', true), '') = 'on' OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR (NULLIF(current_setting('app.tenant_id', true), '') IS NULL AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'))` with matching `WITH CHECK` clauses.
    - Foreign-keyed tables (`domains`, `content_sheets` via `sites.tenant_id`, and `lead_events` via `leads.tenant_id`): scoped via subquery checks.
  - Implemented comprehensive two-clinic isolation test suite in `apps/platform/test/rls-isolation.test.ts`:
    - Asserted `rowsecurity = true` across all 16 tenant tables in `pg_tables`.
    - Seeded two isolated test clinics (Clinic A and Clinic B) with appointments, enquiries, blog posts, FAQs, testimonials, settings, counters, sites, subscriptions, leads, and outbox events.
    - Verified Clinic A reads only Clinic A records across all 13 queried tables (0 cross-reads).
    - Verified direct cross-tenant queries for Clinic B records return EMPTY (0 rows).
    - Verified cross-tenant mutation attempts (UPDATE/DELETE) affect 0 rows, and cross-tenant INSERT throws RLS check violation.
    - Verified Clinic B reads only Clinic B records (0 cross-reads).
    - Verified unauthenticated queries with enforced RLS return 0 rows.
    - Verified operator bypass mode (`app.bypass_rls = 'on'`) can observe cross-clinic rows for background queue and backup processing.
  - Updated `apps/platform/package.json` test runner to execute the RLS isolation test suite (22/22 tests green across platform suite).

### Added (Milestone PB: Backend and Data — MT-106)

- **MT-106 (Database migrations for Professional Clinic):**
  - Updated Drizzle PostgreSQL schema in `apps/platform/src/db/schema.ts` adding 8 Professional Clinic tables per `04_DATA_MODEL.md § 2`:
    - `appointments`: Booking requests with encrypted PII (`patient_name_enc`, `patient_phone_enc`, `patient_email_enc`), service, preferred date/slot, status, consent timestamp, and idempotency key.
    - `appointment_events`: Lifecycle audit trail tracking from/to status transitions and staff notes.
    - `enquiries`: General clinic messages with encrypted PII (`name_enc`, `phone_enc`, `email_enc`, `message_enc`), consent, and idempotency.
    - `posts`: Blog articles with unique tenant slug, rich-text AST, cover image, and SEO metadata.
    - `faqs`: Categorized clinic Q&As with active toggle and display ordering.
    - `testimonials`: Moderated patient reviews with mandatory recorded consent and star ratings.
    - `clinic_settings`: Operating hours, slot intervals (default 30m), max daily slots (default 40), notification emails, spam threshold, and enabled pages.
    - `usage_counters`: Quota metering for submissions (5,000 allowance), storage (1 GB R2 allowance), and monthly content updates.
  - Added `'professional'` tier to `sites.plan` and `subscriptions.plan` enums, and added TOTP 2FA fields (`totp_secret_enc`, `totp_enabled`) to `users` table.
  - Exported TypeScript schema types (`Appointment`, `NewAppointment`, `AppointmentEvent`, `NewAppointmentEvent`, `Enquiry`, `NewEnquiry`, `Post`, `NewPost`, `Faq`, `NewFaq`, `Testimonial`, `NewTestimonial`, `ClinicSettings`, `NewClinicSettings`, `UsageCounters`, `NewUsageCounters`).
  - Created and applied plain SQL migration `apps/platform/drizzle/0001_professional_clinic.sql` with all core platform and professional tables, foreign keys with cascade delete, and performance indexes per `04 § 3`.
  - Added test suite `apps/platform/test/professional-migrations.test.ts` (16/16 tests green across platform suite) verifying clean migration application, foreign key integrity, professional plan persistence, typed CRUD, and exported types.

### Added (Milestone PA: Design System & Shells — MT-105)

- **MT-105 (Public 7-page template shell):**
  - Created shared React template shell components in `apps/site-template/src/`:
    - `Header.tsx`: Clinical branding (`LogoMark`), click-to-call phone CTA, WhatsApp CTA, 7-page fixed navigation slots (`Home`, `About`, `Services`, `Doctors`, `Testimonials & FAQ`, `Blog`, `Contact & Appointment`), mobile toggle button, and responsive nav drawer with smooth 200ms cubic-bezier transition, backdrop overlay, and Escape key dismissal.
    - `MobileCtaBar.tsx`: Sticky bottom mobile CTA bar (< 768px) with 3 touch targets (Call, WhatsApp, Book Visit) exceeding 48px touch target requirements and zero emojis.
    - `Footer.tsx`: Structured NAP (Name, Address, Phone) matching JSON-LD schema, medical registration credentials, 7-page navigation links, clinical care specialties, DPDP Act 2023 compliance notice, and clean SVG Lucide icons.
    - `layout.tsx`: Base public layout wrapping Header, main content with skip link (`#main-content`), Footer, and MobileCtaBar.
  - Refactored `apps/site-template/index.html`, `src/styles.css`, and `src/main.js`:
    - Cleaned all legacy emojis (71 instances) across hero pills, credentials, accreditations, features, services, clinic details, review stars, and footer contact lines, replacing them with Lucide SVGs.
    - Implemented `.mobile-nav-toggle`, `.mobile-drawer`, `.drawer-backdrop`, and added `#blog` preview section and updated heading hierarchies.
    - Fixed contrast tokens in `packages/ui` (`--color-text-muted: #475569`) and `.cta-wa` (`#047857`) ensuring WCAG 2.1 AA text contrast ≥ 4.5:1 across both Green and Teal themes.
  - Built comprehensive automated Playwright and Axe test suite in `apps/site-template/test/template-shell.test.ts`:
    - Verified responsive mobile drawer opens/closes, updates `aria-expanded`, and traps focus (Escape close).
    - Verified sticky mobile CTA bar is visible on mobile (< 768px), hidden on desktop (≥ 768px), and meets 48px minimum touch targets.
    - Executed Axe accessibility audit verifying 0 critical and 0 serious accessibility violations across both desktop (1280px) and mobile (360px) viewports.
    - Captured automated visual evidence screenshots across 360, 768, and 1280px in both Green and Teal clinical themes.
    - Verified strict R7 zero-emoji compliance across built production HTML.

### Added (Milestone PA: Design System & Shells — MT-104)

- **MT-104 (CMS app shell):**
  - Implemented modular Next.js App Router CMS shell in `apps/platform/src/app/cms/layout.tsx` with dedicated state provider `CmsShellContext.tsx`.
  - Built collapsible desktop sidebar component `Sidebar.tsx` supporting smooth 200ms cubic-bezier width transitions (270px to 76px), clinic brand mark (`LogoMark`), verified clinic status badge, grouped navigation for 7-page site and operations, active nav highlighting with `aria-current="page"`, and live sync connection indicator.
  - Built top header bar `Header.tsx` featuring accessible breadcrumbs (`<nav aria-label="Breadcrumb">`), global search bar with `⌘K` keyboard hint, live patient site launcher, and light/dark theme switcher using clinical tokens.
  - Implemented `.cms-focus-ring` in `globals.css` ensuring accessible `:focus-visible` styling (`outline: 2px solid var(--color-brand-primary); outline-offset: 2px`).
  - Added unit test suite `apps/platform/test/cms-shell.test.ts` verifying smooth collapse, active navigation state highlighting, and accessible keyboard focus styles.

### Added (Milestone PA: Design System & Shells — MT-103)

- **MT-103 (CSS pipeline & anti-FOUC verification):**
  - Created automated verification script `apps/site-template/scripts/check-css.ts` checking built output in `dist/`, verifying the compiled stylesheet (`assets/index-*.css`) is linked in `index.html`, exists on disk, and has non-empty size (22.7 KB).
  - Implemented headless Playwright computed style inspection verifying on initial render that body font family contains Plus Jakarta Sans/system-ui, primary buttons use clinical green (`rgb(13, 92, 70)`), and border radii adhere to design tokens (`10px`).
  - Implemented deterministic negative-control anti-FOUC guard (`verifyFoucDetection`) asserting that unstyled HTML is caught and rejected by CI with an actionable diagnostic error.
  - Added unit test suite `apps/site-template/test/check-css.test.ts` and wired `check:css` and Playwright dependency installation into `.github/workflows/pr.yml`.

### Added (Milestone PA: Design System & Shells — MT-102)

- **MT-102 (Icon family & brand marks):**
  - Implemented Lucide SVG icon family components on 20/24px grid with stroke regular (1.75/2) and clinical brand marks (`LogoMark`, `StethoscopeMark`, `CredentialBadgeMark`) in `packages/ui/src/components/icons/*`.
  - Exported SVG icon suite from `@ecodigitech/ui` root and dedicated subpath export `@ecodigitech/ui/icons` for clean tree-shaking.
  - Re-exported icon family in `apps/platform/src/components/Icons.tsx` linking platform components to the unified UI package.
  - Added unit test suite `packages/ui/test/icons.test.mjs` verifying clean SVG markup rendering, subpath export tree-shaking, and strict R7 zero-emoji enforcement across all UI components and platform icon definitions.
  - Configured `tsconfig.typecheck.json` in `apps/platform` for isolated typechecking without interference from transient Next.js build types.

### Added (Milestone PA: Design System & Shells — MT-101)

- **MT-101 (Tokens & Typography Setup):**
  - Configured `@ecodigitech/ui` tokens (`packages/ui/src/tokens.css` and `src/index.ts`) with clinical green/mint/teal palettes, dark mode tokens, neutral surfaces, semantic status badge tokens (`pending`, `confirmed`, `completed`, `cancelled`), 8-pt spacing grid, and fluid typography scale.
  - Replaced external Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) with self-hosted / system font stack and Devanagari fallback chain (`'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Devanagari', Roboto, sans-serif`).
  - Added unit test suite `packages/ui/test/tokens.test.mjs` verifying light/dark token completeness, WCAG 2.1 AA text contrast ratio ≥ 4.5:1 across themes, and zero external Google Fonts network calls across all apps and packages.

### Added (Phase 0: Professional Clinic Plan — ₹18,999 Specification)

- **New Plan Specification (`01_PRD.md`):**
  - Added "Professional Clinic" commercial facts table to § 2 (₹18,999 Year 1 / ₹9,999 renewal, full-stack badge, up to 7 pages, custom backend/DB configuration, secure admin login, submissions dashboard, statuses, basic blog CMS, editable FAQs/testimonials, 5,000 submission quota, 1 GB media storage, 3 content updates/mo, 15-day bug fix window).
  - Added Feature Traceability matrix (F-01 through F-15).
  - Added clinic receptionist persona (Aarti, 26).
  - Added 30 user stories (US-301 through US-330) with 2-4 acceptance criteria each.
  - Added unit economics analysis for Year 1 (72.1% margin) and renewal (63.3% margin; flagged `< 70%`).
  - Added DECISION-NEEDED questions for GST treatment, database allowance quotas, and 15-day bug fix window.
- **New Specifications (`18_CMS_SPEC.md` & `19_UI_DESIGN_SYSTEM.md`):**
  - Authored `18_CMS_SPEC.md` covering RBAC permissions matrix, 7-page content model, submissions inbox, status transitions state machine (`Pending -> Confirmed -> Completed, Cancelled`), rich-text editor with `sanitize-html` pipeline, media library with per-card photo replacement, publishing saga with atomic rollback, and immutable audit trail.
  - Authored `19_UI_DESIGN_SYSTEM.md` covering clinical green/teal design tokens, typography with self-hosted woff2 and Devanagari fallback, Lucide SVG icon family, strict anti-emoji policy, component library, CMS app shell, 7-page public layouts, 200ms motion rules, WCAG 2.1 AA accessibility, multi-width screenshot protocol (360/768/1280 px, light/dark), and explicit anti-AI-look checklist.
- **Architectural & Data Model Extensions (`03_ARCHITECTURE.md`, `04_DATA_MODEL.md`, `05_DATA_SOURCES.md`):**
  - Added Mermaid sequence diagrams for patient appointment form submission and CMS publishing saga.
  - Formulated ADR-201: delivered backend as an RLS-isolated slice in shared PostgreSQL rather than dedicated servers per clinic.
  - Added 8 new tables: `appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`.
  - Added indexes for hot queries and keyset pagination.
  - Documented AES-256-GCM encryption for patient contact fields.
- **Contract & Error Updates (`07_API_CONTRACT.md`, `09_ERROR_HANDLING.md`):**
  - Added routes: `/v1/public/appointments`, `/v1/public/enquiries`, `/v1/public/availability`, `/v1/cms/submissions/*`, `/v1/cms/posts`, `/v1/cms/faqs`, `/v1/cms/testimonials`, `/v1/cms/settings`, `/v1/cms/media/upload`, `/v1/auth/totp/*`.
  - Added plan amount in paise: `1899900` (Year 1) / `999900` (renewal).
  - Added error codes E-1601 to E-1607 for plan limits, quotas, transitions, Turnstile, 2FA, and sanitization.
- **Security & Pipeline Updates (`06_CONTENT_PIPELINE_SPEC.md`, `10_SECURITY.md`, `11_ANALYTICS_SEO_SPEC.md`, `12_GITHUB_ACTIONS.md`, `13_TESTING.md`, `14_PRODUCTION_CHECKLIST.md`):**
  - Documented TOTP 2FA, Turnstile bot verification, rich-text sanitization, and strict CSP.
  - Added R6 live-wiring Playwright test strategy and two-clinic RLS isolation tests.
  - Added Professional Clinic add-on checklist to Checklist A.
- **Decisions Log (`17_DECISIONS.md`):**
  - Recorded accepted ADR-201 and proposed ADR-202 through ADR-205.
- **Implementation Queue (`15_MICROTASKS.md`):**
  - Extended implementation roadmap with 6 new milestones: PA (Design system & shells), PB (Backend & data), PC (CMS), PD (Public site), PE (Operations), PF (Hardening).
  - Added 46 microtasks (MT-101 to MT-146) each ≤ 2 h in standard template with F-xx tags and proof tests.
  - Added updated burndown table (112 total tasks, 197.5 hours) and F-01..F-15 coverage matrix.

### Added (Milestone M0: Foundations — MT-001 through MT-008)

- **MT-001 (Monorepo scaffold):** Configured pnpm workspaces, Turborepo pipeline (`build`, `lint`, `test`, `typecheck`), and directory layout (`apps/platform`, `apps/site-template`, `packages/config`, `packages/content-schema`, `packages/ui`).
- **MT-002 (TS strict + lint config):** Implemented strict TypeScript base config (`packages/config/tsconfig.base.json`) and flat ESLint config (`packages/config/eslint.config.js`) enforcing bans on top-level `let` (SD-080), `dangerouslySetInnerHTML` (SD-042), and raw SQL string interpolation (SD-042). Verified with automated unit test suite.
- **MT-003 (Local stack):** Configured `docker-compose.yml` for PostgreSQL 16, Redis 7, and Mailpit with healthchecks; added comprehensive `.env.example`.
- **MT-004 (PR pipeline skeleton):** Configured `.github/workflows/pr.yml` with pnpm store caching, Turborepo cache, concurrency cancellation, and full CI validation.
- **MT-005 (content-schema v1 & v1.1):** Built `@ecodigitech/content-schema` Zod validation schemas enforcing strict caps (services ≤ 9, reviews ≤ 6, FAQs ≤ 8), phone format, XSS script injection rejection, and v1.1.0 Practice Growth plan/pages extensions. Tested against `fixtures/golden.json` and garbage/injection payloads.
- **MT-006 (Drizzle + base migration):** Configured Drizzle ORM with `pg` driver, generated `drizzle/0000_base.sql` with `pgcrypto` and `citext` extensions, migration runner `src/db/migrate.ts`, and verified typed query test against live PostgreSQL.
- **MT-007 (Gateway skeleton):** Built `withGateway()` edge wrapper with request/trace ID propagation, structured JSON event logging, E-code catalogue (`E-1xxx` through `E-4xxx`), and RFC-7807 Problem Details error responses without leaking stack traces.
- **MT-008 (Docs/secret CI gates):** Configured `.github/workflows/gates.yml` containing `docs-touched` gate, Gitleaks scanner (SD-019), and dependency audit. Verified with test suite asserting PR rejection on missing changelog and planted fake key detection.

### Added (docs MINOR - MT-000)

- Reconciled "Practice Growth" as second commercial SKU across brain/ documentation:
  - `01_PRD.md`: Added Practice Growth table in § 2 beside Basic Presence (single source of truth for pricing: ₹12,999 first year, ₹5,999 renewal); updated § 4 phased scope (multi-page static sites move to P2); added 3 DECISION-NEEDED items to § 11. Basic Presence facts untouched.
  - `17_DECISIONS.md`: Added proposed ADR-020 (Second SKU, multi-page static export, appointment request enquiry), ADR-021 (₹12,999 GST treatment), ADR-022 (admin dashboard exclusion clarification), ADR-023 (renewal economics at ₹5,999).
  - `04_DATA_MODEL.md`: Added `plan enum('basic', 'growth')` to `sites` and `subscriptions`; updated `subscriptions.renewal_price_paise` (299900 / 599900); bumped `content-schema` SemVer specification to v1.1.0 (optional `plan` and `pages`).
  - `07_API_CONTRACT.md`: Added `/v1/payments/order` route, documented plan-aware amounts in paise (`699900` / `1299900`), and added optional appointment request fields to `LeadInput`.
  - `08_UI_SPEC.md`: Defined multi-page template structure for Practice Growth (up to 5 pages: Home, About, Services, Testimonials, Contact) sharing common Header and sticky CTA bar.
  - `06_CONTENT_PIPELINE_SPEC.md`: Updated SLA update allowance (1/month for Basic, 3/month for Growth) and renewal sweep pricing per plan.
  - `11_ANALYTICS_SEO_SPEC.md`: Added per-page canonical tags, 5-page sitemap generation, and per-page JSON-LD specs for Practice Growth.
  - `14_PRODUCTION_CHECKLIST.md`: Added growth-only launch verification checklist block to Checklist A.
  - `15_MICROTASKS.md`: Added microtasks MT-059 to MT-066 in standard template; updated total task count to 66 and burndown hours to 116.5 h.

### Added

- Root monorepo configuration: `pnpm-workspace.yaml`, `package.json`, `turbo.json`, `.gitignore`, `.env.example`, `docker-compose.yml`
- Shared packages: `@ecodigitech/config` (TS strict, ESLint rules, Prettier), `@ecodigitech/content-schema` (Zod ContentSheet schema), `@ecodigitech/ui` (Design tokens for Green & Teal visual directions)
- Client site template (`apps/site-template`): 10-section static template conforming to `08_UI_SPEC.md` and reference screenshots, with live theme switcher and < 30 KB JS budget
- Platform control plane scaffold (`apps/platform`): Next.js 15 App Router, Drizzle PostgreSQL 16 schema, and API gateway RFC-7807 problem details
- Test fixture: `fixtures/golden.json` reproducing reference doctor credentials and clinic profile


## [0.1.0] - 2026-11-02

### Added (docs)

- 00_MASTER_RULES.md — constitution, agent protocol, glossary
- 01_PRD.md — product requirements, personas, stories, unit economics
- 02_TRD.md — stack decisions, coordination, runtime limits, cost model
- 03_ARCHITECTURE.md — diagrams, flows, 111-row System Design Matrix
- 04_DATA_MODEL.md — PostgreSQL schema, indexes, migrations, locking, PII
- 05_DATA_SOURCES.md — input inventory, event catalogue, webhook contract
- 06_CONTENT_PIPELINE_SPEC.md — build pipeline, queues, renewals
- 07_API_CONTRACT.md — routes, auth, idempotency, versioning
- 08_UI_SPEC.md — client template (reference-image direction), portal, live progress
- 09_ERROR_HANDLING.md — E-code catalogue, timeouts, breakers, degradation
- 10_SECURITY.md — threat model, controls, DPDP, vulnerability SLA
- 11_ANALYTICS_SEO_SPEC.md — events, SEO, CWV
- 12_GITHUB_ACTIONS.md — CI/CD, containers, K8s/Helm (P3), IaC, flags
- 13_TESTING.md — test strategy, load, chaos
- 14_PRODUCTION_CHECKLIST.md — launch, release, observability, incidents, drills
- 15_MICROTASKS.md — 58 implementation tasks across M0–M4
- 16_CHANGELOG.md — this file
- 17_DECISIONS.md — 14 seed ADRs (PostgreSQL native SQL and visual direction recorded)

### Changed

- Database decision: PostgreSQL 16 with standard SQL (vendor-neutral), per founder request (ADR-003)
