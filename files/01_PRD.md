---
purpose: Product requirements — problem, immutable commercial facts, personas, phased scope, stories, metrics, economics
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [00_MASTER_RULES.md, 02_TRD.md, 03_ARCHITECTURE.md, 10_SECURITY.md, 14_PRODUCTION_CHECKLIST.md]
---

# 01 — PRD

## 1. Problem & opportunity

Most doctors in tier-1/tier-2 Indian cities have no site of their own; patients find them through Google Maps/local search, listing portals and WhatsApp referrals, and then decide within seconds whether to call. A listing-portal page is shared with competitors and ranks on the portal's terms; a doctor-owned page with verified credentials, a visible phone/WhatsApp button and a map is the cheapest trust signal available.

Patients such as Priya compare about three options on a mid-range Android over 4G. Pages that load slowly (LCP above 2.5 s) or hide the call button lose the contact. A single fast page designed around three actions (call, WhatsApp, form) therefore converts better than a multi-page brochure site.

The gap is delivery cost: agencies spend days per site, which makes a ₹6,999 offer unprofitable. P1 industrializes delivery (hours, not days); P2 removes the operator entirely. These are engineering estimates, not measured market data.

## 2. Immutable commercial facts

### Basic Presence ("Basic Presence" — Phase 1 offer)
| Fact | Value |
|---|---|
| Brand | EcoDigiTech — an Indian digital-services company |
| Phase 1 offer | "Basic Presence" — a single-page doctor website |
| Price | ₹6,999 one-time for year 1 (includes a standard .in/.com domain for year 1 + 1 year of basic hosting) |
| Renewal | ₹2,999/year from year 2 (domain + basic hosting management) |
| Included | Doctor profile, qualifications, services and clinic details; click-to-call button; WhatsApp button; contact form with email notification; Google Maps embed; responsive design; basic SEO; SSL/HTTPS + DNS configuration; deployment + basic runtime checks |
| Service SLA | 1 content update per month; 7-day window to fix reported vulnerabilities |
| Hard exclusions | No custom backend, no database, no appointment-booking panel, no advanced/enterprise email, no bundled third-party paid subscriptions |
| Architecture rule | Client site = static single page, no backend, no database. All intelligence lives in the control plane. |
| Legal | DPDP Act 2023 governs patient-lead personal data; 18% GST applies to services |

### Practice Growth ("Practice Growth" — Badge "Popular")
| Fact | Value |
|---|---|
| Target | "For doctors building their practice", badge "Popular" |
| Price | ₹12,999 first year (includes standard domain for year 1 + 1 year managed hosting) |
| Renewal | ₹5,999/year from year 2 (domain, hosting, routine technical checks, defined maintenance) |
| Website development | Up to 5 responsive pages (Home, About, Services, Testimonials, Contact); detailed treatment and specialization sections; appointment REQUEST form with date and time preference; email + WhatsApp appointment enquiries; Google Maps, FAQs, clinic timings; Analytics and Search Console setup; basic technical and local SEO setup |
| Domain, hosting, tech | Standard domain for year 1; one year managed hosting; SSL/HTTPS, DNS, deployment; monthly availability checks and backups; up to 3 content updates per month; form testing, security checks, 7-day bug-fix window |
| Excludes | Custom backend, admin dashboard, managed booking calendar, premium email subscriptions, paid API services |
| Architecture rule | Client site = statically generated (up to 5 pages), NO backend, NO database. The only network call is lead/appointment-request POST to control plane (POST /v1/leads). All intelligence lives in control plane. |
| Legal | DPDP Act 2023 governs patient-lead personal data; 18% GST applies to services |

## 3. Personas

| Persona | Profile | Goals | Pains | Tech level |
|---|---|---|---|---|
| Dr. Sharma | 42, tier-2 city clinic, WhatsApp-first | More patient calls; credible online presence; zero upkeep | Distrusts agencies, no time, unclear renewals | Low; uses WhatsApp and UPI only |
| Priya | Patient, mid-range Android, 4G, compares 3 options | Find hours, location, fees, call in one tap | Slow pages, tiny buttons, no map | Medium; mobile only |
| EcoDigiTech operator | Builds sites, fields update requests | Ship a site in ≤ 4 h; never hand-edit HTML | Manual DNS, rework, missed renewals | High |

## 3a. Visual direction (client site)

Derived from two reference designs supplied by the founders: a clean medical landing page (white nav, mint panel, green split hero with doctor photo, bold sans headline, rounded green CTA) and a poster-style card (teal palette, doctor cut-out on a rounded shape, name plate with degree, "Call us" row). Specified in 08 § 1–2; decision in 17 ADR-013.

## 4. Phased scope

| Phase | In scope | Explicitly out of scope |
|---|---|---|
| P1 Agency factory | Operator admin; one site template (Basic Presence, single-page); automated pipeline (validate, build, publish, verify); email-OTP login for operators; lead forwarding by email + wa.me links; renewals sweep; monthly update workflow | Self-signup; online payment; booking panel; client-site backend/DB; enterprise email; multi-page sites |
| P2 Self-serve (Q1 2027) | Doctor signup, Razorpay payment, content wizard, preview, auto-publish to custom domain, lead inbox, WhatsApp Cloud API notifications, Google sign-in; Practice Growth plan shipping multi-page static export (up to 5 static pages: Home, About, Services, Testimonials, Contact) and appointment request form (enquiry with preferred date/time) | Booking panel; managed booking calendar; custom backend/DB on client sites; client-site admin dashboard |
| P3 Scale (roadmap only) | Appointment-booking panel; managed booking calendar; vernacular AI content assist; marketplace/enterprise tier; Kubernetes deployment | Not committed; every item labeled P3 wherever it appears |

Exclusions apply to every phase; the booking panel is P3. Any "Book" or "Appointment Request" on a client site is either a wa.me/call link or an appointment request enquiry (same POST /v1/leads with preferred date/time), never a managed booking calendar.

## 5. Pricing evolution

P1: ₹6,999 year 1 / ₹2,999 renewal (section 2).

DECISION-NEEDED: P2 SaaS pricing. Options: (a) keep ₹6,999 + ₹2,999 annual (simple, consistent); (b) monthly ₹599 (higher churn, cash-flow smoother); (c) annual-only with ₹3,499 renewal. Recommendation: (a) for launch, because the commercial offer is the proven asset and ₹2,999 maps cleanly to domain (~₹900) + hosting/platform share + management. Revisit renewal price after 6 months of margin data (section 8: renewal margin is thin). Resolve in ADR.

DECISION-NEEDED: whether ₹6,999 is GST-inclusive. Recommendation: treat as inclusive until founders decide; section 8 uses the conservative (inclusive) reading.

## 6. User stories

P1 (operator flows):

| ID | Story | Acceptance criteria |
|---|---|---|
| US-101 | As an operator I want to enter a new client's intake so that a tenant and draft content sheet exist | Tenant created with unique slug; intake form fields validated by zod; draft saved in ≤ 2 s |
| US-102 | As an operator I want to upload doctor photo and clinic assets so that the site has real imagery | JPG/PNG/WebP ≤ 5 MB accepted; consent checkbox required; AVIF/WebP variants generated |
| US-103 | As an operator I want one-click build so that I need no manual HTML | Build job completes < 90 s; preview URL returned; failures show an E-code |
| US-104 | As an operator I want an automated QA gate so that bad sites never publish | Lighthouse perf ≥ 90, a11y ≥ 95; JSON-LD valid; publish blocked otherwise |
| US-105 | As an operator I want to publish to the client's domain so that the site is live | Domain, DNS and SSL verified; post-publish live form test passes |
| US-106 | As an operator I want to register the client's domain so that DNS is configured automatically | Cloudflare zone/hostname created; status visible; expiry date stored |
| US-107 | As an operator I want to log a monthly update request so that the SLA clock is tracked | Request shows diff preview; SLA due date = request + 30 d; breach flagged at 80% elapsed |
| US-108 | As an operator I want to approve and rebuild an update so that changes go live safely | Immutable new version; one-click rollback available |
| US-109 | As an operator I want a renewal dashboard so that no domain expires | List sorted by expiry; alerts at 60/30/7 days; sweep runs daily 06:00 IST |
| US-110 | As an operator I want to process a vulnerability report so that the 7-day SLA holds | Ticket with severity and due date; breach alert at day 5 |
| US-111 | As an operator I want to see a lead forwarding log so that I can prove delivery | Each lead shows submitted/emailed/WhatsApp timestamps |
| US-112 | As an operator I want to roll back a site so that a bad publish is undone in minutes | Rollback completes < 2 min; previous version live and verified |
| US-113 | As an operator I want to offboard a client so that personal data is deleted per DPDP | Deletion workflow executes; audit_log entry retained |

P2 (doctor flows):

| ID | Story | Acceptance criteria |
|---|---|---|
| US-201 | As a doctor I want to sign up with email OTP so that I need no password | OTP valid 10 min; 5 attempts max; session issued |
| US-202 | As a doctor I want Google sign-in so that signup is faster | PKCE + state + nonce verified; account linked by verified email |
| US-203 | As a doctor I want to pay by UPI/card so that my site is activated | Razorpay checkout; webhook activates tenant < 30 s; GST invoice emailed |
| US-204 | As a doctor I want a guided wizard so that I fill content without help | 7 steps; autosave every 5 s; progress persisted |
| US-205 | As a doctor I want to upload my photo so that patients see me | Crop to 4:5; processed < 10 s; max 5 MB |
| US-206 | As a doctor I want a live preview so that I see the site before it goes public | Preview on *.preview.doctorsite.in updates < 60 s after save |
| US-207 | As a doctor I want to choose a theme (green or teal) so that the site matches my taste | Two presets; preview switches instantly |
| US-208 | As a doctor I want to publish in one click so that I am live in ≤ 10 min | Progress via SSE; success shows live URL |
| US-209 | As a doctor I want to connect my domain so that the site uses my name | Guided DNS steps; status polled; SSL active automatically |
| US-210 | As a doctor I want a lead inbox so that I see all patient enquiries | List with cursor pagination; mark-handled; export CSV |
| US-211 | As a doctor I want instant lead notifications so that I never miss one | Email and WhatsApp within P95 < 60 s |
| US-212 | As a doctor I want to edit content so that details stay current | Optimistic-concurrency conflict UI; republish creates new version |
| US-213 | As a doctor I want to view billing and invoices so that I trust the charges | GST invoices listed; renewal date shown |
| US-214 | As a doctor I want renewal reminders so that my site never lapses | Reminders at 30/7/1 d in en/hi |
| US-215 | As a doctor I want to request deletion of lead data so that I comply with DPDP | Request logged; deletion within 30 d |

## 7. Success metrics

| Metric | Definition | Target | Instrument |
|---|---|---|---|
| Time-to-launch | Intake complete → live verified | P1 ≤ 4 h; P2 ≤ 10 min | `site_published` minus `signup_started` events |
| Lead delivery | Form submit → email/WhatsApp delivered | P95 < 60 s | `lead_events` timestamps |
| Client-site LCP | Mobile field/lab LCP | < 2.0 s | Lighthouse CI + CrUX (11 § 6) |
| Annual churn | Clients not renewing / due | < 15% | `subscriptions` |
| Gross margin | (Net revenue − itemized costs) / net revenue per site | ≥ 70% (P2 at scale) | Monthly cost report (12 § 9) |

## 8. Unit economics (estimates)

Assumes ₹6,999 GST-inclusive (net ₹5,931 after 18% GST), ₹90/USD, control-plane fixed cost ₹6,500/month (02 § 4), operator labour ₹250/h.

| Line (year 1) | P1 at 100 sites | P2 at 1,000 sites |
|---|---|---|
| Net revenue | ₹5,931 | ₹5,931 |
| Domain (.in/.com) | ₹900 | ₹900 |
| Platform + hosting share (12 months) | ₹924 | ₹324 |
| Razorpay fee (2% + 18% GST on fee) | ₹165 | ₹165 |
| Labour | ₹1,000 (4 h) | ₹50 (automated) |
| Total cost | ₹2,989 | ₹1,439 |
| Margin | ₹2,942 (50%) | ₹4,492 (76%) |

| Line (renewal) | At 100 sites | At 1,000 sites |
|---|---|---|
| Net revenue | ₹2,541 | ₹2,541 |
| Domain renewal | ₹900 | ₹900 |
| Platform + hosting share | ₹924 | ₹324 |
| Fees + labour | ₹131 | ₹131 |
| Margin | ₹586 (23%) | ₹1,186 (47%) |

Finding: the 70% margin target is met only in P2 at scale; renewal margin is thin. DECISION-NEEDED: renewal price (recommendation in section 5).

## 9. NFR summary

| NFR | Target | Home |
|---|---|---|
| Control-plane availability | 99.9%; client sites stay up when platform is down | 14 § 3 (SD-107) |
| Platform API P99 | < 300 ms from ap-south-1 | 03 § 9 |
| Client-site performance | LCP < 2.0 s, TBT < 200 ms, Moto G over throttled 4G | 08 § 2 |
| Security | OWASP controls, DPDP checklist | 10 |
| Support SLA | 1 update/month; 7-day vulnerability fix | 06 § 3, 10 § 9 |

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Domain-renewal miss | Daily expiry sweep, 60/30/7-day alerts, auto-renew (06 § 4) |
| Founder bus factor | IaC + runbooks + documented brain/ (14 § 5) |
| WhatsApp policy change | wa.me links need no API; email fallback |
| Local-SEO competition | JSON-LD, GMB setup, per-city copy (11 § 5) |
| Payment failures | Webhook reconciliation + retries (07 § 4) |
| Template staleness | Quarterly template review, Renovate PRs |
| DPDP non-compliance | Consent notice, retention, deletion (10 § 8) |
| Vendor price hikes | Cost report monthly; swap triggers (02 § 4) |

## 11. Open questions

DECISION-NEEDED items (each resolves into a proposed ADR in 17_DECISIONS.md):
1. **P2 pricing:** Keep ₹6,999 / ₹2,999 at launch, review renewal after 6 months (See 17_DECISIONS.md ADR-015).
2. **GST-inclusive reading of ₹6,999:** Treat as inclusive until founders decide; section 8 uses conservative reading (See 17_DECISIONS.md ADR-015).
3. **GST-inclusive reading of ₹12,999 (Practice Growth):** DECISION-NEEDED: is ₹12,999 GST-inclusive? Recommendation: same reading as ₹6,999 (treat as inclusive until decided; net ₹11,016.10 after 18% GST). Resolves in proposed ADR-021.
4. **Wording "excludes admin dashboard" vs P2 self-serve portal:** DECISION-NEEDED: Practice Growth excludes "admin dashboard", but P2 offers a doctor self-serve portal. Recommendation: the portal is the control plane (`apps/platform`), not a client-site admin panel; state this distinction explicitly in client terms. Resolves in proposed ADR-022.
5. **Renewal margin at ₹5,999 vs hosting cost:** DECISION-NEEDED: assess renewal margin at ₹5,999/year. Recommendation: with standard domain renewal (~₹900) and static hosting share (~₹324–₹924), ₹5,999 provides healthy gross margin (>75%) covering up to 3 maintenance updates/month. Resolves in proposed ADR-023.
