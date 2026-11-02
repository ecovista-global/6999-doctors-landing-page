---
purpose: Constitution of brain/ — reading order, agent protocol, definitions of done, glossary
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [01_PRD.md, 03_ARCHITECTURE.md, 15_MICROTASKS.md, 16_CHANGELOG.md, 17_DECISIONS.md]
---

# 00 — Master Rules

## 1. How to use brain/

Human reading order: 01_PRD → 03_ARCHITECTURE → 02_TRD → the rest.

AI-agent protocol (mandatory, scoped-reading rule to save tokens):

| Step | Rule | Check |
|---|---|---|
| Before coding | Read ONLY: this file + the docs listed in the microtask's `reads:` + that microtask | Agent output cites each doc read |
| Never | Load all 18 files; never read a doc not listed in `reads:` | PR review rejects unlisted-doc dependencies |
| Missing info | Do not ask; use the nearest rule, write `DECISION-NEEDED:` in the PR, continue | Marker present in PR body |
| After coding | Append an entry to 16_CHANGELOG.md; if a choice changed, add an ADR in 17_DECISIONS.md (supersede, never edit) | CI job `docs-touched` fails if `apps/**` or `packages/**` changed with no `brain/16_CHANGELOG.md` diff |
| Stack | Never change the fixed stack implicitly; challenge only via ADR | ADR id referenced in PR |

## 2. Document index

| # | File | Purpose | Primary audience |
|---|---|---|---|
| 00 | 00_MASTER_RULES.md | Rules, glossary, definitions of done | All |
| 01 | 01_PRD.md | Product, personas, phases, pricing facts, stories | Founders, agents |
| 02 | 02_TRD.md | Stack decisions, cost model, runtime limits | Engineers |
| 03 | 03_ARCHITECTURE.md | Diagrams, flows, 111-row System Design Matrix | Engineers |
| 04 | 04_DATA_MODEL.md | Schema, indexes, locking, migrations, PII | Backend agents |
| 05 | 05_DATA_SOURCES.md | Inputs, events, source-of-truth rules | Backend agents |
| 06 | 06_CONTENT_PIPELINE_SPEC.md | Site build factory, queues, renewals | Backend agents, operator |
| 07 | 07_API_CONTRACT.md | Routes, auth, idempotency, webhooks, versioning | Backend/frontend agents |
| 08 | 08_UI_SPEC.md | Client template, portal, visual direction | Frontend agents |
| 09 | 09_ERROR_HANDLING.md | E-codes, timeouts, retries, degradation | All engineers |
| 10 | 10_SECURITY.md | Threat model, injection, auth, DPDP | Engineers, founders |
| 11 | 11_ANALYTICS_SEO_SPEC.md | Events, SEO, CWV monitoring | Frontend, operator |
| 12 | 12_GITHUB_ACTIONS.md | CI/CD, containers, IaC, flags | DevOps agents |
| 13 | 13_TESTING.md | Test strategy, load, chaos | All engineers |
| 14 | 14_PRODUCTION_CHECKLIST.md | Launch checklists, observability, incidents | Operator, founders |
| 15 | 15_MICROTASKS.md | Implementation queue | AI agents |
| 16 | 16_CHANGELOG.md | History | All |
| 17 | 17_DECISIONS.md | ADR log | All |

## 3. Definitions of done

| Item | Done when |
|---|---|
| Document | Frontmatter present; every requirement has an acceptance criterion; no duplicated content (link instead); DECISION-NEEDED items listed in its Open questions or resolved by ADR |
| Feature | Code merged; unit + integration tests green; docs it touches updated; changelog entry; flag/kill-switch defined if user-facing; no new Sev-2 alerts in 24 h on preview |
| Release | Checklist B (14 § 2) fully ticked; canary watched 30 min; rollback plan linked |
| Client site | Checklist A (14 § 1) fully ticked and client sign-off sent |

## 4. Editing rules

| Rule | Detail |
|---|---|
| Ownership | Founding team owns all docs; agents may edit only the files named in their microtask `touches:` |
| Versioning | Docs live in the same repo and PR as the code they describe |
| PR rule | Every behavior-changing PR updates the docs it touches (enforced by `docs-touched` job) |
| ADRs | Immutable; supersede with a new ADR |
| Duplication | Restating another file's content is a defect; link as `See 04_DATA_MODEL.md § 5` |

## 5. Glossary

| Term | Meaning |
|---|---|
| Tenant | One paying doctor/clinic account; row-level isolation key `tenant_id` |
| Site | The single-page website of a tenant; one tenant has one site in P1/P2 |
| Content sheet | Typed JSON document (validated by `packages/content-schema`) holding all doctor-visible content; versioned |
| Lead | A patient's call/WhatsApp/form enquiry; the form variant is stored as personal data |
| Control plane | The database-backed Next.js platform (`apps/platform`): auth, tenants, billing, pipeline |
| Client site | The statically generated patient-facing page; no backend, no database |
| Pipeline | Automated flow content sheet → validated → built → published → verified (06) |
| P1 / P2 / P3 | Agency factory / self-serve (Q1 2027) / roadmap-only scale phase |
| SD-### | System-design concept ID (SD-001…SD-111); matrix in 03 § 5 |
| Microtask | An implementation unit of ≤ 2 h in 15_MICROTASKS.md |

## 6. Immutable facts

Commercial facts (prices, renewal, inclusions, SLA, exclusions) live in 01_PRD.md § 2 and are restated nowhere else.
