---
purpose: Analytics events, funnels, privacy, SEO system, Core Web Vitals monitoring, SLI feed
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [01_PRD.md, 08_UI_SPEC.md, 10_SECURITY.md, 14_PRODUCTION_CHECKLIST.md]
---

# 11 — Analytics & SEO

## 1. Event dictionary

| Event | Properties | Trigger | Phase |
|---|---|---|---|
| signup_started | method (otp/google), source | Signup form opened | P2 |
| payment_success | tenant_id, amount_paise, plan | Webhook processed | P2 |
| site_published | site_id, version, duration_s | Saga done | P1 |
| lead_created | site_id, channel | POST /v1/leads accepted | P1 |
| call_clicked | site_id | tel: link click | P1 |
| whatsapp_clicked | site_id, placement (hero/bar) | wa.me click | P1 |
| form_submitted | site_id, result (ok/error code) | Form submit | P1 |
| update_requested | site_id, source | Update logged | P1 |

Acceptance: every event validated by zod `EventSchema`; unknown events rejected and counted.

## 2. Funnels & dashboards

| Funnel | Steps |
|---|---|
| Visit → lead (per site) | page view → call/WhatsApp/form click → lead_created |
| Signup → publish (per doctor) | signup_started → payment_success → wizard done → site_published |
| Operator dashboard | sites live, builds/day, build success %, update SLA breaches, domains expiring in 60 days, DLQ depth |

## 3. Privacy

Per-site data isolation: each client site has its own GA4 property/stream; no cross-site user IDs. Consent banner for Indian visitors: analytics scripts load only after "Accept" (DPDP); the banner adds < 3 KB and no layout shift. IP truncation on (GA4 default; platform events store /24 only). No sensitive-category tracking: no form field contents, no health terms in events or URLs.

## 4. Tooling

DECISION-NEEDED: GA4 roll-up. Decision: one GA4 property per client site (isolation, doctor can own it), plus a platform-level server-side event store (PostHog/Axiom class; recommendation: Axiom, already in the log pipeline) holding the 8 events above for roll-up reporting across all sites. Rejected: a single shared GA4 property (cross-tenant exposure). Resolve in ADR.

## 5. SEO system per client site

Pre-publish checklist (automated where noted):

| Item | Rule |
|---|---|
| Title/meta/OG | Unique: `{Dr. Name} — {Specialty} in {City}` ≤ 60 chars; description ≤ 155; OG image 1200×630 (auto) |
| Canonical | `https://{host}/` |
| sitemap.xml / robots.txt | Generated; robots allows all; previews `noindex` |
| JSON-LD | Physician + MedicalClinic validated in pipeline |
| NAP | Name, address, phone identical across page, JSON-LD and GMB |
| Alt text | Required for every image (validation fails if empty) |
| Headings | One H1, ordered H2/H3 |

GMB setup: create/claim profile, verify (postcard/phone/video, 3–14 days estimate), same NAP, category matching specialty, link site. Search Console: add domain property via DNS TXT in the zone, submit sitemap, record in `domains`. Local SEO: city + specialty keywords in title/H1/first paragraph naturally, no stuffing (max 2 mentions of the primary keyword per 100 words).

## 6. Core Web Vitals monitoring

Thresholds: LCP < 2.0 s, INP < 200 ms, CLS < 0.1. Weekly Lighthouse CI run per site on a Moto G profile; regression alert when LCP rises > 20% or any metric leaves threshold twice in a row (Sev-3). Monthly per-client report (the deliverable under the 1-update SLA):

| Section | Content |
|---|---|
| Traffic | Visits, top cities |
| Leads | Calls, WhatsApp, forms vs previous month |
| CWV | LCP/INP/CLS, pass/fail |
| Top queries | From Search Console (top 5) |
| Actions taken | Updates made, fixes, recommendations |

## 7. Feed to SLOs

SLIs fed from product metrics: lead-delivery latency (`lead_events`), build success rate (`site_published` vs failures), client-site availability (probes). Definitions: See 14_PRODUCTION_CHECKLIST.md § 3 (SD-106).
