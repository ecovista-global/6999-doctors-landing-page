---
purpose: Architecture decision log — seed ADRs and proposed ADRs for every open DECISION-NEEDED
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [00_MASTER_RULES.md, 01_PRD.md, 02_TRD.md, 16_CHANGELOG.md]
---

# 17 — Decisions

## 1. Governance

ADRs are immutable: supersede, never edit. Every DECISION-NEEDED marker in brain/ resolves into an ADR (ADR-015 to ADR-019 below are proposed and pending founder acceptance). Format: ID, date, status, context, decision, consequences.

## 2. Accepted ADRs

**ADR-001 — Next.js monorepo over Astro + separate admin.** 2026-11-02 · accepted. Context: two people; need admin, portal, API and a static template. Decision: one Turborepo with `apps/platform` (Next.js) and `apps/site-template`. Consequences: (+) shared types, one CI; (−) template must stay disciplined to avoid framework JS bloat (budget 170 KB).

**ADR-002 — Shared-tenant Postgres + RLS over DB-per-tenant.** 2026-11-02 · accepted. Context: 1,000+ small tenants. Decision: `tenant_id` + RLS. Consequences: (+) cheap, single migration path; (−) isolation depends on policy correctness (tests mandatory, 13 § 1).

**ADR-003 — PostgreSQL 16 with standard SQL (vendor-neutral) over Neon-specific features, Supabase or Prisma.** 2026-11-02 · accepted. Context: founders asked for plain Postgres SQL; the fixed stack named Neon. Decision: engine = PostgreSQL 16; access via `pg` driver through PgBouncer; Drizzle for typing; migrations as plain SQL; no vendor-only features (branching, serverless driver). Neon remains the default host, swappable. Consequences: (+) portable, easy self-hosting in P3; (−) lose Neon branching for previews (use testcontainers instead). Host/region choice: ADR-016.

**ADR-004 — Upstash Redis.** accepted. Context: serverless-friendly rate limits/locks. Decision: Upstash HTTP Redis. Consequences: (+) per-request pricing, no connection limits; (−) latency 5–15 ms, vendor dependency (breaker + DB fallback).

**ADR-005 — pg-boss over BullMQ/Inngest.** accepted. Context: transactional enqueue with outbox, no extra infra. Decision: pg-boss on Postgres. Consequences: (+) one datastore; (−) ceiling around 50 jobs/s; revisit then.

**ADR-006 — Razorpay over Stripe/Cashfree.** accepted. Context: UPI-first Indian buyers. Decision: Razorpay. Consequences: (+) UPI/cards/netbanking, local invoicing support; (−) fee ≈ 2% + GST on fee.

**ADR-007 — Static export for client sites.** accepted. Context: hard exclusions (no backend, no database). Decision: statically generated single page; only the lead form talks to the control plane API. Consequences: (+) sites survive platform outage; (−) no per-visitor dynamic content.

**ADR-008 — Resend over SES.** accepted. Context: simplicity and DKIM tooling for two people. Decision: Resend. Consequences: (+) fast setup; (−) higher unit cost at scale (revisit > 100k mails/mo).

**ADR-009 — Cloudflare DNS/CDN/WAF with custom hostnames; R2 for static hosting.** accepted. Context: per-client domains. Decision: Cloudflare for SaaS + R2 + Worker host router. Consequences: (+) cheap, one vendor; (−) vendor concentration risk (DR runbook 14 § SD-098).

**ADR-010 — Kubernetes deferred to P3 but pre-specified.** accepted. Context: ops cost for 2 people. Decision: specify manifests/Helm now, deploy at ₹60,000/mo trigger. Consequences: (+) no early ops load; (−) spec may drift (CI `helm lint`).

**ADR-011 — pnpm + Turborepo.** accepted. Decision: pnpm workspaces, Turborepo with remote cache. Consequences: (+) fast CI; (−) Vercel cache dependency.

**ADR-012 — Drizzle over Prisma.** accepted. Context: SQL-close typed queries, RLS `SET LOCAL`, small bundles. Decision: Drizzle. Consequences: (+) cold-start friendly; (−) smaller ecosystem.

**ADR-013 — Client-site visual direction from two founder reference images.** 2026-11-02 · accepted. Context: founders want a green/teal medical look: split hero with doctor photo, rounded CTA, poster-style contact rows, name plate. Decision: implement as two theme presets (green, teal) in `apps/site-template`; omit "Sign In" and "Watch a video"; "Book your Appointment" becomes a wa.me/call link (no booking panel; exclusion honoured). Consequences: (+) consistent premium look; (−) photo quality depends on doctor-supplied images (crop and quality gate).

**ADR-014 — Build runner = GitHub Actions Docker job.** 2026-11-02 · accepted. Context: Vercel functions limited to 60 s; builds need sharp, Chromium. Decision: pipeline dispatches `render-site.yml` and awaits signed callback. Consequences: (+) no always-on server; (−) cold start 20–30 s, minutes quota (move to self-hosted runner at 3,000 min/mo).

## 3. Proposed ADRs (resolve every DECISION-NEEDED)

| ID | Source | Question | Recommendation | Status |
|---|---|---|---|---|
| ADR-015 | 01 § 5, § 8 | P2 pricing; is ₹6,999 GST-inclusive; renewal margin thin | Keep ₹6,999/₹2,999 at launch, treat as GST-inclusive, review renewal after 6 months | proposed |
| ADR-016 | 02 § 1 | Postgres host and region | Managed Postgres in ap-south-1 if available, else Neon nearest region | proposed |
| ADR-017 | 04 § 8, 10 § 8 | Lead retention and DPDP legal review | 24 months default; legal review before P2 | proposed |
| ADR-018 | 11 § 4 | GA4 roll-up | Per-site GA4 + platform Axiom event store | proposed |
| ADR-019 | 08 § 6 | Medical-advertising rules for content | Restrict to qualifications, services, location, timings; legal review | proposed |
| ADR-020 | 01 § 2, § 4 | Second SKU (Practice Growth); multi-page static export; appointment request form | Introduce Practice Growth SKU in P2; export up to 5 static pages; appointment request form is an enquiry via POST /v1/leads with preferred date/time; booking panel remains P3 | proposed |
| ADR-021 | 01 § 2, § 11 | Is ₹12,999 GST-inclusive? | Treat as GST-inclusive until decided (same reading as ₹6,999; net ₹11,016.10 after 18% GST) | proposed |
| ADR-022 | 01 § 2, § 11 | Wording "excludes admin dashboard" vs P2 portal | Self-serve portal is control plane (`apps/platform`), not a client-site admin panel; clarify in client terms | proposed |
| ADR-023 | 01 § 2, § 11 | Renewal margin at ₹5,999 vs hosting and maintenance | ₹5,999/yr renewal yields >75% gross margin over domain (~₹900) + hosting share, covering up to 3 updates/month | proposed |
| ADR-201 | 01 § 2, 03 § 3 | Multi-tenant isolated control-plane slice vs dedicated server per clinic | Deliver "Custom backend & database" as RLS-isolated slice of existing control plane | accepted |
| ADR-202 | 01 § 2, 03 § 3 | Dedicated database offering | Dedicated database offered only as a separately priced enterprise add-on | proposed |
| ADR-203 | 01 § 2, § 11 | Is ₹18,999 GST-inclusive? | Treat as GST-inclusive until decided (same reading as other plans; net ₹16,100.85 after 18% GST) | proposed |
| ADR-204 | 01 § 2, 04 § 10 | Volume quotas for Professional Clinic | Standard allowance 5,000 submission records/year and 1 GB media storage on R2; warning at 80% | proposed |
| ADR-205 | 01 § 2, 06 § 3 | 15-day bug-fix window definition | Clock starts at receipt of bug report; Sev-1 bugs resolved in 24 h | proposed |

**ADR-020 — Practice Growth tier (Second SKU), multi-page static export, and appointment request enquiry.** proposed. Context: Founders introduced "Practice Growth" tier (See 01_PRD.md § 2) featuring up to 5 pages and an appointment request form. Hard invariants mandate zero client-side backend/DB, no managed booking calendars in P1/P2. Decision: Introduce Practice Growth in P2 as statically exported multi-page bundle (Home, About, Services, Testimonials, Contact). "Appointment Request Form" is treated strictly as a patient enquiry using the existing `POST /v1/leads` pipeline with optional `preferred_date` and `preferred_time` fields in the payload. Real-time calendar/booking panel remains deferred to P3. Consequences: (+) Preserves zero-backend client-site invariant; (+) Reuses unified leads pipeline; (−) Doctors must confirm appointments manually via phone/WhatsApp.

**ADR-021 — GST treatment for Practice Growth (₹12,999).** proposed. Context: Founders set Practice Growth price at ₹12,999 (See 01_PRD.md § 2). Need clarity on tax treatment. Decision: Treat ₹12,999 as GST-inclusive (identical to Basic Presence ₹6,999 treatment) until explicit legal/founder decision. Net revenue = ₹11,016.10, 18% GST = ₹1,982.90. Consequences: (+) Consistent consumer-facing pricing in India; (−) Slightly compressed initial margin compared to GST-exclusive.

**ADR-022 — Clarification of "Excludes Admin Dashboard" vs P2 Doctor Portal.** proposed. Context: Practice Growth pricing card states "excludes admin dashboard", whereas P2 scope includes a doctor self-serve portal. Decision: Clarify in terms of service that "admin dashboard" refers to a dynamic CMS/admin panel hosted on the client's own domain. The P2 portal is the EcoDigiTech control plane (`apps/platform`), an agency-provided management interface. Consequences: (+) Prevents client confusion; (+) Preserves static export invariant on client domains.

**ADR-023 — Renewal economics for Practice Growth at ₹5,999.** proposed. Context: Practice Growth renewal is set at ₹5,999/year from year 2 (See 01_PRD.md § 2), covering domain, hosting, routine checks, and up to 3 updates/month. Decision: Accept ₹5,999 renewal pricing. Cost breakdown: domain renewal ~₹900, hosting share ~₹324, Razorpay fee ~₹142, amortized maintenance labor ~₹750 (max 3 minor updates/month). Net gross margin > 70%. Consequences: (+) Substantially better renewal economics than Basic Presence; (+) Sustainable SLA for active practices.

**ADR-201 — Multi-tenant isolated control plane slice over dedicated server/database per clinic.** 2026-11-05 · accepted. Context: The Professional Clinic plan (₹18,999) includes "custom backend and database configuration". Providing a dedicated VM/server or managed DB per clinic would cost more than the annual plan revenue, multiplying ops overhead for a 2-person team and destroying margins. Decision: Deliver the clinic backend as a tenant-isolated slice of the existing control plane (`apps/platform`):
1. Tenant row with `plan = 'professional'`, possessing its own RLS-isolated data in the shared PostgreSQL database across existing and new tables (`appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`).
2. Tenant-scoped `/v1` APIs in `apps/platform` configured per clinic via `clinic_settings` (hours, slots, notifications, spam rules, enabled 7-page set).
3. Public client site remains statically generated (`apps/site-template`), compiled by Docker renderer to Cloudflare R2, calling control plane via `/v1/public/...` endpoints with static fallbacks (`tel:`, `wa.me`, `mailto:`).
4. All tables strictly keyed by `tenant_id` to provide a clean future migration/export path. Consequences: (+) Preserves healthy gross margins (>70%); (+) Zero operational multiplier; (−) Requires rigorous automated RLS isolation testing.

**ADR-202 — Dedicated database offered only as a separately priced add-on.** proposed. Context: Certain high-volume multi-specialty clinics or clinics with strict enterprise compliance may request a physically dedicated database. Decision: Offer "Dedicated PostgreSQL Database" only as a separately priced enterprise add-on (e.g. +₹15,000/year to cover managed DB instance and dedicated connection pooling), rather than bundling it into the standard ₹18,999 plan. Consequences: (+) Keeps standard plan profitable; (+) Provides upsell path for larger clinics.

**ADR-203 — GST-inclusive treatment of Professional Clinic (₹18,999 / ₹9,999).** proposed. Context: Founders specified ₹18,999 first year and ₹9,999 renewal. Need uniform tax treatment. Decision: Treat ₹18,999 as GST-inclusive (net ₹16,100.85 after 18% GST ₹2,898.15) and ₹9,999 renewal as GST-inclusive (net ₹8,473.73 after 18% GST ₹1,525.27), matching the precedent set by Basic Presence (ADR-015) and Practice Growth (ADR-021). Consequences: (+) Consistent marketing and pricing cards; (−) Renewal margin falls to 63.3% at 100 sites, recovering to 74.8% at 1,000 sites (flagged in PRD § 8).

**ADR-204 — Resource quotas and database allowance for Professional Clinic.** proposed. Context: Pricing card includes "database service allowance for clinic volumes". Unbounded usage creates noisy neighbor risks and unexpected cloud costs. Decision: Standard allowance is set at 5,000 submission records (appointments + enquiries) per subscription year and 1 GB media storage in Cloudflare R2. CMS shows a warning banner at 80% (4,000 records / 800 MB); mutations past 100% return 429 `E-1602` with an option to purchase an expansion pack. Consequences: (+) Protects database capacity; (+) Clear, measurable allowance for doctors.

**ADR-205 — 15-day bug-fix window definition.** proposed. Context: Pricing card promises a "15-day bug-fix window". Need unambiguous operational definition. Decision: The 15-day bug-fix window starts from the exact timestamp a defect or bug is officially reported by the clinic via email/portal. Sev-1 critical blockers (e.g. site down or booking form failing) have a 24-hour resolution SLA; standard defects are resolved within 15 calendar days. Consequences: (+) Clear SLA tracking in CMS dashboard; (+) Protects team against indefinite legacy defect claims.
