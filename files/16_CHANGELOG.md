---
purpose: Keep-a-Changelog history for platform, template, content-schema and docs
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
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
