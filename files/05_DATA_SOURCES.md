---
purpose: Inventory of every input, the event catalogue, source-of-truth rules, webhook ingestion
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-02
related: [03_ARCHITECTURE.md, 04_DATA_MODEL.md, 06_CONTENT_PIPELINE_SPEC.md, 07_API_CONTRACT.md, 09_ERROR_HANDLING.md]
---

# 05 — Data Sources

## 1. Master source table

| Source | Format | Owner | Freshness | Validation | Storage (04) | Failure handling (09) |
|---|---|---|---|---|---|---|
| Client intake (P1 operator form; P2 wizard) | JSON via Server Action | Operator / doctor | On submit | zod `IntakeSchema` | content_sheets | E-1xxx inline errors |
| Content sheet (canonical) | JSON, also committed to git repo `client-content/{slug}.json` | Platform | Per publish | zod `ContentSheetSchema` | content_sheets + git | E-2101 blocks build |
| Doctor photo, clinic assets | JPG/PNG/WebP ≤ 5 MB, min 800×1000 px; consent checkbox mandatory | Operator / doctor | On upload | magic-byte sniff, size, dimensions | R2 `assets/{tenant}/` | E-1201 reject; E-2301 processing retry |
| Razorpay payment events | JSON webhook | Razorpay | Real time | HMAC signature + schema | webhook_events, payments | Retry + reconcile (E-3101) |
| WhatsApp Cloud API callbacks (P2) | JSON webhook | Meta | Real time | `X-Hub-Signature-256` | webhook_events | E-3201 retry |
| Cloudflare domain/SSL status | REST poll (every 5 min while pending) | Cloudflare | ≤ 5 min | zod response schema | domains | E-3301 retry, alert at 1 h |
| Uptime probe results | JSON from external prober | Probe vendor | 5 min | schema | Better Stack | Sev-2 alert on 2 failures |
| Analytics events | JSON batch | Client site / platform | ≤ 10 s | zod `EventSchema` | PostHog/Axiom class store (11) | Drop with counter, never block UX |
| Public appointment submissions | JSON via POST /v1/public/appointments | Patient / browser | Real time | zod `AppointmentInputSchema` + Turnstile | appointments, outbox_events | E-1101, E-1604 Turnstile reject |
| Public enquiry submissions | JSON via POST /v1/public/enquiries | Patient / browser | Real time | zod `EnquiryInputSchema` + Turnstile | enquiries, outbox_events | E-1101, E-1604 Turnstile reject |
| Blog posts | JSON / rich-text TipTap | Doctor / owner | On save | zod `PostSchema` + `sanitize-html` | posts | E-1607 sanitize error |
| FAQs and testimonials | JSON | Doctor / owner | On save | zod `FaqSchema`, `TestimonialSchema` | faqs, testimonials | E-1606 consent missing |
| Clinic settings & slots | JSON | Staff / owner | On save | zod `ClinicSettingsSchema` | clinic_settings | E-1xxx validation errors |
| Cron sweep outputs | Internal records | Workers | Daily | internal types | outbox_events | Alert on missed run (12 § 9) |

## 2. Event catalogue

| Event | Producer | Consumer | Payload sketch | Guarantee |
|---|---|---|---|---|
| `lead.created` | POST /v1/leads | Notifier | `{lead_id, tenant_id}` | At-least-once, idempotent consumer |
| `lead.notified` | Notifier | Analytics, lead_events | `{lead_id, channel, at}` | At-least-once |
| `appointment.created` | POST /v1/public/appointments | Notifier, Dashboard | `{appointment_id, tenant_id}` | At-least-once, idempotent |
| `appointment.status_changed` | PATCH /v1/cms/submissions/appointments | Audit, Analytics | `{appointment_id, from_status, to_status, actor_id}` | At-least-once |
| `enquiry.created` | POST /v1/public/enquiries | Notifier, Dashboard | `{enquiry_id, tenant_id}` | At-least-once |
| `post.published` | CMS Blog | Pipeline, Analytics | `{post_id, slug, tenant_id}` | At-least-once |
| `testimonial.moderated` | CMS Testimonials | Pipeline | `{testimonial_id, status, tenant_id}` | At-least-once |
| `content.saved` | Portal | Pipeline | `{site_id, version}` | At-least-once |
| `site.published` | Pipeline | Notifier, analytics | `{site_id, version, host}` | At-least-once |
| `payment.captured` | Webhook handler | Billing, Pipeline | `{payment_id, tenant_id, paise}` | Exactly-once effect (idempotent) |
| `domain.expiring` | Renewal sweep | Notifier | `{domain_id, days_left}` | At-least-once |
| `domain.ssl_changed` | CF poller | Pipeline | `{host, status}` | At-least-once |
| `update.requested` | Operator/doctor | SLA tracker | `{site_id, due_at}` | At-least-once |

Consumers de-duplicate by `event_id` (03 § SD-038).

## 3. Source-of-truth rules

| Data | Truth | Reconciliation |
|---|---|---|
| Doctor details | Content sheet (latest published version) | Git copy is backup; mismatch alert |
| Payments | Razorpay | Nightly job fetches last 48 h payments and diffs against `payments`; mismatch = Sev-2 |
| Domain state | Cloudflare/registrar | Daily diff against `domains`; registrar expiry date overrides ours |
| Leads | Postgres | n/a |

## 4. Webhook ingestion contract

| Step | Rule |
|---|---|
| 1 Raw body | Read raw bytes before JSON parse |
| 2 Signature | Razorpay: HMAC-SHA256 of raw body with `RAZORPAY_WEBHOOK_SECRET`, constant-time compare; WhatsApp: `X-Hub-Signature-256` |
| 3 Replay window | Reject if provider timestamp older than 5 min (E-1401) |
| 4 Idempotent store | `INSERT INTO webhook_events … ON CONFLICT (provider,event_id) DO NOTHING`; if no row inserted return 200 immediately |
| 5 Process | Handler runs in same transaction as state change; errors return 5xx so the provider retries |
| 6 Response | 200 within 3 s; heavy work goes to the outbox |

Details and retry policy: See 07_API_CONTRACT.md § 4 (SD-017).
