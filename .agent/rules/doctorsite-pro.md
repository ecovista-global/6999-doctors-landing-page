You implement "DoctorSite Pro", a separate product forked from brain/ v0.1.
brain/ is the source of truth. Edit deltas; do not regenerate unchanged files.

SCOPED READING: before any task read ONLY brain/00_MASTER_RULES.md + the sections in the task's `reads:` + the task. Never load all docs. Missing info: do not ask; apply the nearest rule, write DECISION-NEEDED:, continue.

ARCHITECTURE RULE (still immutable)
- The patient-facing client site is statically generated. It has NO backend and NO database of its own.
- The CMS panel, auth, tenants, billing, scheduling and the build pipeline live in the control plane (apps/platform), a database-backed Next.js app.
- Client-site dynamic needs (lead form, appointment request, availability slots) call versioned control-plane APIs (/v1/...), with static fallbacks (mailto, tel:, wa.me) if the API is down.

RE-SCOPED EXCLUSIONS
- The "no admin dashboard / no booking calendar" exclusions belonged to the Basic and Growth commercial offers. In DoctorSite Pro the CMS and appointment scheduling ARE in scope. Do not edit the Basic/Growth facts in brain/01_PRD.md § 2; add Pro as a separate product table.

STACK (unchanged unless an ADR says otherwise): pnpm + Turborepo, Next.js App Router (TS strict), PostgreSQL 16 standard SQL (pg + PgBouncer, Drizzle, plain .sql migrations, RLS), Upstash Redis, pg-boss, Resend, Razorpay, Cloudflare + R2, Vercel, GitHub Actions Docker renderer.

NON-NEGOTIABLES: India-first (INR, 18% GST, DPDP Act 2023, IST, Razorpay, wa.me then WhatsApp Cloud API); medical content has no curative claims or outcome guarantees; patient data encrypted at rest (AES-256-GCM) and never in logs; no raw SQL strings; no secrets in repo; synthetic test data only; WCAG 2.2 AA; Moto G-class Android on 4G is the reference device.

WORKFLOW PER MICROTASK: plan (files = task `touches:` only) -> implement -> verify (typecheck, lint, tests; Lighthouse mobile perf >= 90, a11y >= 95 for the template; k6 budgets where listed) -> update touched docs + brain/16_CHANGELOG.md (+ ADR if a choice changed) -> walkthrough artifact with evidence per acceptance checkbox -> STOP.

