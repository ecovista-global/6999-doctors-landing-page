---
purpose: Operational checklists — site launch, release, observability standards, incidents/on-call, quarterly drills
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [03_ARCHITECTURE.md, 09_ERROR_HANDLING.md, 10_SECURITY.md, 12_GITHUB_ACTIONS.md, 13_TESTING.md]
---

# 14 — Production Checklist

## 1. Checklist A — per-client site launch

- [ ] Content sheet validated (zod) and committed to `client-content/{slug}.json`
- [ ] Doctor consent for photo and registration number recorded
- [ ] Registration number and degrees verified by operator against source documents
- [ ] DNS records correct (`dig` from 1.1.1.1 and 8.8.8.8)
- [ ] SSL active; `https://` loads; HTTP redirects to HTTPS; HSTS header present
- [ ] `www` and apex both resolve and canonicalize to one host
- [ ] Canonical, sitemap.xml, robots.txt present and correct
- [ ] OG preview verified (WhatsApp share preview shows image and title)
- [ ] JSON-LD Physician + MedicalClinic validated
- [ ] Title ≤ 60 and description ≤ 155 characters, unique
- [ ] Google Business Profile claimed/verified, NAP identical
- [ ] Search Console property verified, sitemap submitted
- [ ] Form → platform → email delivered (P95 < 60 s) end to end
- [ ] Form → WhatsApp path (P2) delivered
- [ ] Honeypot and rate limit active (6th submit/min blocked)
- [ ] Consent notice visible next to form
- [ ] `tel:` link tested on a real Android phone
- [ ] `wa.me` link opens WhatsApp with prefilled text on a real Android phone
- [ ] Sticky mobile CTA bar works and does not cover content
- [ ] Lighthouse mobile performance ≥ 90 and accessibility ≥ 95
- [ ] LCP < 2.0 s, CLS < 0.1, TBT < 200 ms (Moto G profile)
- [ ] Images AVIF/WebP, each ≤ 150 KB; hero ≤ 60 KB
- [ ] Alt text on all images; one H1
- [ ] Favicon present; custom 404 page; `/index.html` redirects fine
- [ ] Google Maps facade loads map on click
- [ ] Hindi copy (if enabled) renders in Devanagari without tofu
- [ ] Analytics consent banner works; events appear in GA4 after consent
- [ ] Uptime probe added for the host (5 min)
- [ ] Expiry date stored in `domains`; renewal sweep shows site
- [ ] Previous version retained for rollback; rollback tested once
- [ ] Content-sheet backup committed
- [ ] Client sign-off message sent (en/hi) and acknowledged

### Practice Growth tier add-on checklist (growth-only block)
- [ ] Multi-page static export verified (Home `/`, About `/about/`, Services `/services/`, Testimonials `/testimonials/`, Contact `/contact/`)
- [ ] Per-page self-referencing canonical URLs verified on all 5 routes
- [ ] Shared navigation header and sticky mobile CTA bar tested across all pages
- [ ] Appointment REQUEST form tested (preferred date/time enquiry fields forward to `/v1/leads`)
- [ ] Dedicated Testimonials page reviews verified against written patient consent
- [ ] Google Search Console property verified via DNS TXT and 5-page sitemap submitted
- [ ] Google Analytics 4 stream verified receiving live test page views across all 5 pages
- [ ] Per-page JSON-LD schemas validated without warnings on Schema Markup Validator

### Professional Clinic tier add-on checklist (full-stack block)
- [ ] 7-page static export verified (Home `/`, About `/about/`, Services `/services/`, Doctors `/doctors/`, Testimonials & FAQ `/testimonials-faq/`, Blog `/blog/`, Contact & Appointment `/contact/`)
- [ ] 8th page rejection verified in content schema (`E-1601`)
- [ ] Appointment booking form tested: submit -> `POST /v1/public/appointments` -> encrypted row in Postgres -> visible in CMS Today's OPD view
- [ ] General enquiry form tested: submit -> `POST /v1/public/enquiries` -> encrypted row in Postgres -> visible in CMS
- [ ] Cloudflare Turnstile spam protection verified blocking fake/automated submissions (`E-1604`)
- [ ] Receptionist status transitions tested end-to-end (`Pending -> Confirmed -> Completed`, `Cancelled`) with audit trail
- [ ] Rich-text blog editor tested: create post, sanitize HTML, upload cover image to R2, publish, verify live post page
- [ ] Testimonials moderation tested: unapproved review hidden; approved review with recorded consent published
- [ ] Clinic settings tested: operating hours and slot duration reflect on public availability endpoint
- [ ] 2FA TOTP setup tested for clinic owner login (`/v1/auth/totp/verify`)
- [ ] Nightly database backup to encrypted R2 bucket verified; restore drill tested
- [ ] Database quota counter verified (warning at 80% of 5,000 submissions / 1 GB media)
- [ ] 15-day bug fix window SLA clock and monthly 3-update allowance active

## 2. Checklist B — SaaS release

- [ ] Migrations are expand-only (or contract approved) and applied before deploy
- [ ] Feature flags set (new code paths default off)
- [ ] CI green: typecheck, lint, unit, integration, bundle size, gitleaks, audit
- [ ] Canary 10% → 50% → 100%, each watched 30 minutes
- [ ] Error rate < 0.1%, P99 < 300 ms, no new Sentry issue spike during canary
- [ ] Rollback plan linked in the PR (`vercel rollback` + flag off)
- [ ] 16_CHANGELOG entry written; docs updated
- [ ] Announcement to operators (and doctors for P2 user-visible changes)

## 3. Checklist C — observability & operations standards

**(SD-100) Logging.** *Meaning:* structured logs with request IDs. *Decision:* JSON via `pino`; fields `ts, level, requestId, traceId, tenantId, route, status, ms`; `requestId` generated at Cloudflare (`cf-ray` mapped to `x-request-id`) and carried: CDN → Vercel function → DB query comment `/*req:abc123*/` → pg-boss job data → renderer logs → email metadata. Example: request `req_7f3a` appears in Cloudflare log, `POST /v1/leads` function log, `insert leads` slow-query log, `notify` job log. PII scrubbing: keys `name, phone, email, message` replaced with `[redacted]`; retention 90 days. *Failure:* untraceable incidents or PII leak; reveals as scrubber test failure and log-search audit. *Verify:* 13 § 1.

**(SD-101) Monitoring.** *Meaning:* dashboards. *Decision:* Better Stack dashboards: (1) queue depth/age/DLQ, (2) build success rate, (3) lead-delivery P95, (4) 4xx/5xx by route, (5) per-site CWV, (6) dependency breaker states, (7) DB connections/CPU/lag, (8) domains expiring. *Failure:* blind spots; reveals in monthly dashboard review. *Verify:* 14 § 5.

**(SD-102) Distributed tracing.** *Meaning:* following one request through components. *Decision:* OpenTelemetry SDK in platform and renderer; W3C `traceparent` header propagated into pg-boss job payloads; head sampling 10%, 100% for errors; export to the log pipeline vendor (OTLP). *Failure:* missing spans; reveals as orphan-span ratio > 5%. *Verify:* 13 § 2.

**(SD-103) Metrics.** *Meaning:* numeric signals. *Decision:* RED (rate, errors, duration) per route plus business metrics: leads/day, publishes/day, build duration, queue age, renewals due, DLQ depth, heap ratio. Cardinality rule: no `tenant_id` label on high-volume metrics. *Failure:* unusable bills/slow queries from cardinality; reveals in vendor usage. *Verify:* 14 § 5.

**(SD-104) Alerting.**

| Sev | Condition (examples) | Channel | Owner | Escalation |
|---|---|---|---|---|
| Sev-1 | Platform down 5 min; client site down (expired domain); data exposure | Phone call + WhatsApp + email | On-call | Other founder after 15 min |
| Sev-2 | Lead-delivery P95 > 5 min; DLQ > 0 for 15 min; error rate > 2%; payment mismatch | WhatsApp + email | On-call | Other founder after 1 h |
| Sev-3 | CWV regression; CDN hit ratio < 90%; flag older than 90 days | Email/Slack | Owner of area | Weekly review |

Business-hours paging for Sev-2/3 (09:00–21:00 IST); Sev-1 any time. *Failure:* alert fatigue or silence; reveals as ack time and noisy-rule review monthly. *Verify:* 14 § 5.

**(SD-105) Observability.** *Meaning:* explaining unknown problems. *Decision:* logs, traces and metrics correlated by `traceId`. Worked example: lead P95 alert fires → metrics show `notify` queue age rising → trace for a sample lead shows Resend span 18 s → breaker state `open` → logs show Resend 429 → action: reduce notify concurrency, enable WhatsApp link fallback, contact Resend. *Failure:* guesswork under pressure; reveals as time-to-diagnose > 30 min. *Verify:* 14 § 5 (GameDay).

**(SD-106) SLIs.**

| SLI | Formula |
|---|---|
| Platform availability | successful `/api/ready` probes ÷ total, 5-min windows |
| Lead delivery | leads with `email_sent` within 60 s ÷ leads accepted |
| Build success | builds finishing < 10 min ÷ builds started |
| Client-site availability | successful probes ÷ total per host |
| API latency | % requests under 300 ms |

*Failure:* vanity metrics; reveals in quarterly SLO review. *Verify:* 11 § 7.

**(SD-107) SLOs.** *Meaning:* targets. *Decision:* platform availability 99.9% (≈ 43 min/month); lead delivery 99% < 60 s; build success 99% < 10 min; client-site availability 99.95% (CDN-backed). Window: 30 days rolling. *Failure:* unmeasured promises; reveals as SLO report gaps. *Verify:* 14 § 5.

**(SD-108) Error budgets.** *Meaning:* velocity vs stability. *Decision:* budget = 0.1% of 30 days (43.2 min) for availability; policy: burn > 50% in a month → hardening week (features paused, reliability tasks only); burn > 100% → freeze until two weeks of green; exceptions need both founders. *Failure:* feature work during instability; reveals as burn dashboard. *Verify:* 14 § 5.

## 4. Checklist D — incidents & on-call

**(SD-109) Production incidents.** *Meaning:* handling outages. *Decision:* severity per SD-104; timeline template: detect → acknowledge (< 15 min) → mitigate → communicate (every 30 min for Sev-1) → resolve → postmortem. Client comms:

- en: "We are aware of a service issue affecting {feature}. Your website remains online. We expect resolution by {time} IST."
- hi: "हमें {feature} में समस्या की जानकारी है। आपकी वेबसाइट चालू है। हम {time} IST तक समाधान की अपेक्षा करते हैं।"

Breach template: what happened, data affected, actions, contact. *Failure:* chaos and silence; reveals as ack-time breach. *Verify:* 14 § 5.

**(SD-110) On-call.** *Meaning:* who responds. *Decision:* TEAM_SIZE = 2: alternate weeks; business-hours paging (09:00–21:00 IST); outside hours only Sev-1 pages. Structural mitigation: static-first design means patient-facing sites stay up while platform issues wait for morning. Escalation tree: on-call → other founder (15 min) → vendor support. What prevents the 3:14 AM pager: no Sev-2 pages overnight, retries and queues absorb overnight failures, daily sweep tolerates delays, auto-rollback. *Failure:* burnout; reveals as pages/week > 3 (review). *Verify:* 14 § 5.

**(SD-111) Postmortems.** *Meaning:* learning from incidents. *Decision:* blameless template (summary, impact, timeline, root cause, what went well/badly, action items with owner and date) written within 48 hours of any Sev-1/2; actions tracked in GitHub issues label `postmortem`, reviewed weekly until closed. *Failure:* repeat incidents; reveals as recurring root-cause tags. *Verify:* 14 § 5.

## 5. Checklist E — quarterly ops drills

**(SD-097) Backups.** *Meaning:* recoverable data. *Decision:* Postgres PITR (7 days, host-provided) plus nightly logical dump to R2 (encrypted, 30 days); content sheets in git; DNS zone exports weekly (Terraform state + `cf-export`); R2 site assets versioned. RPO 24 h (nightly dump) and typically minutes via PITR; RTO 4 h (rebuild + restore for a 2-person team, estimate). Restore drill: weekly automated restore of the latest dump into a scratch DB with row-count checks; quarterly full restore + app smoke. *Failure:* unusable backups; reveals as failed weekly verification. *Verify:* 12 § SD-041.

**(SD-098) Disaster recovery.** *Meaning:* account/region loss. *Decision:* runbook: recreate Cloudflare/Postgres/Upstash/Vercel via Terraform; restore latest dump; rebuild all sites from git content sheets via rebuild-all (backpressure-limited, 06 § SD-040); repoint DNS; verify with probes. Time-boxed test: 4 h, once per year (full) and tabletop quarterly. *Failure:* unknown restore time; reveals as drill overrun. *Verify:* 14 § 5.

Quarterly drill list:

- [ ] Restore drill (SD-097) completed within RTO
- [ ] DR tabletop or full test (SD-098)
- [ ] Chaos GameDay executed; findings logged (13 § SD-099)
- [ ] Cost review against model (02 § SD-086)
- [ ] Access review: roles, GitHub/Cloudflare/Vercel members, tokens (10 § SD-048)
- [ ] Secret rotation due items done (10 § SD-019)
- [ ] Postmortem actions closed
- [ ] Dependency overrides reviewed (12 § SD-076)
