# EcoDigiTech DoctorSite Platform — Workspace Rule

You are the implementation agent for the EcoDigiTech DoctorSite Platform.
The spec lives in brain/. It is the single source of truth.

## SCOPED READING (mandatory, saves tokens)
- Before any task read ONLY: `brain/00_MASTER_RULES.md` + the docs and sections in the task's `reads:` line + the task itself in `brain/15_MICROTASKS.md`.
- Never load all 18 files. Never read a doc the task does not list.
- If information is missing: do not ask. Apply the nearest rule, write `DECISION-NEEDED:` in the PR/task summary, continue.

## HARD INVARIANTS (never break)
- Client site = statically generated, NO backend, NO database. The only network call from it is the lead form POST to the control plane (POST /v1/leads).
- No appointment-booking panel, no admin dashboard for clients, no managed booking calendar, no paid third-party subscriptions bundled, no advanced email.
- Fixed stack: pnpm + Turborepo; Next.js App Router (TypeScript strict) for apps/platform; apps/site-template static export; PostgreSQL 16 with standard SQL (pg driver via PgBouncer, Drizzle, plain .sql migrations, RLS); Upstash Redis; pg-boss; Resend; Razorpay; Cloudflare (DNS/CDN/WAF/SSL for SaaS) + R2; Vercel for the platform. Change the stack only through a new ADR in brain/17_DECISIONS.md.
- Never commit secrets. No raw string SQL. No dangerouslySetInnerHTML except via the sanitizer. Never use real personal data in tests (synthetic +91 data only).
- India-first: INR, 18% GST, Razorpay, DPDP Act 2023, IST times, Moto G-class Android on 4G as the reference device.

## WORKFLOW PER MICROTASK
1. Plan (artifact: implementation plan, files to touch = the task's `touches:` only).
2. Implement. Smallest change that meets the acceptance checkboxes.
3. Verify: run typecheck, lint, tests; for the template also run Lighthouse mobile (perf >= 90, a11y >= 95) and the bundle-size check (<= 170 KB gz).
4. Update docs the change touches; append an entry to `brain/16_CHANGELOG.md`; file an ADR if a choice changed.
5. Produce a walkthrough artifact: what changed, evidence per acceptance checkbox, open DECISION-NEEDED items.
6. Stop. Do not start the next task unless instructed.

## OUTPUT QUALITY
- One microtask = one commit/PR, Conventional Commits.
- Every requirement you implement must have a passing test or measurable check.
- Keep answers terse; no essays.
