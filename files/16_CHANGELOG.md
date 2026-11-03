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
