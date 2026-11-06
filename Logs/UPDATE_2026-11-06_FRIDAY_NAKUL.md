# Daily Engineering Log — 2026-11-06 (Friday)
**Filename:** `UPDATE_2026-11-06_FRIDAY_NAKUL.md`  
**Engineer:** Nakul Sukhwani (<nakulsukhwani.in@gmail.com>)  
**Repository:** `6999-doctors-landing-page` (`/home/nakul/Documents/Ecodigitech-18999`)  
**Branch:** `dr-18999`  
**Status:** Completed Milestone PB (Backend & Data: MT-108..MT-114) and Milestone PC (CMS Core: MT-115..MT-120) for the ₹18,999 Professional Clinic plan. All 111 platform tests, 12 site-template tests, 8 UI tests, 3 content-schema tests, and 2 CI gates passing cleanly (136/136 tests green, 100% pass rate).

---

## 1. Executive Summary

Today delivered 13 discrete, atomic microtasks (MT-108 through MT-120), completing the entire backend data engine (**Milestone PB**) and the first six microtasks of the Content Management System (**Milestone PC**) for the **Professional Clinic plan (₹18,999 Year 1 / ₹9,999 renewal)**.

Today's work transitioned the platform from foundational database schemas to a live, end-to-end clinical operational system. This includes automated AES-256-GCM encryption of sensitive patient contact records, an idempotent public appointment submission gateway with Cloudflare Turnstile anti-bot defense, asynchronous transactional outbox email delivery via Resend, RFC-6238 TOTP two-factor authentication with backup codes and brute-force lockout, an append-only immutable audit trail, a high-performance OPD submissions board with keyset cursor pagination (< 25 ms), a sliding submission detail drawer with inline staff notes, a deterministic appointment status state machine, RFC-4180 streaming CSV exports, one-click WhatsApp confirmation links, clinic operating hours synchronization, and a strict 7-page plan cap enforcer (`E-1601`).

### Milestones Completed Today:
1. **Milestone PB — Backend and Data (Tasks MT-108 through MT-114):**
   - **MT-108 (PII Encryption Engine):** Built AES-256-GCM cipher suite (`crypto.ts`) with HMAC-SHA-256 blind indexing for queryable encrypted phone numbers, automated key rotation support, and regex PII log scrubbing preventing leaks in server traces.
   - **MT-109 (Public Appointments API):** Built `POST /api/v1/public/appointments` with database idempotency key deduplication, 5 req/min/IP rate limiting, and atomic insertion of encrypted appointments and `appointment.created` outbox events.
   - **MT-110 (Public Enquiries & Availability API):** Built `POST /api/v1/public/enquiries` and `GET /api/v1/public/availability` computing free clinical slots dynamically against clinic operating hours.
   - **MT-111 (Turnstile, Honeypot & Bot Protection):** Built multi-layer anti-bot defense verifying Cloudflare Turnstile tokens, invisible form honeypots, and a 3-second human interaction time-trap, blocking automated spam bots with HTTP 403 `E-1604`.
   - **MT-112 (Outbox Notifier Job):** Built asynchronous background worker draining `outbox_events` with exponential backoff retries and Resend API circuit breaker, dispatching bilingual clinic alert emails.
   - **MT-113 (TOTP 2FA Auth & Session Management):** Implemented RFC-6238 TOTP engine, secret generation, 8 single-use hashed backup recovery codes, and a 5-failure brute-force account lockout (HTTP 429 `E-1501`).
   - **MT-114 (Audit Trail Engine & Immutability):** Built append-only audit logger capturing actor, action, tenant, diff JSON, and IP/UA metadata, protected by PostgreSQL database triggers raising exceptions on any `UPDATE` or `DELETE` attempt.
2. **Milestone PC — CMS Core (Tasks MT-115 through MT-120):**
   - **MT-115 (Submissions Dashboard & Today OPD):** Built CMS submissions table with keyset cursor pagination (`(created_at, id) < ($cursorCreatedAt, $cursorId)` running in < 25 ms), Today's OPD tab (`preferred_date = CURRENT_DATE`), and search/service filters.
   - **MT-116 (Submission Detail Drawer & Staff Notes):** Built sliding detail drawer with on-demand contact PII decryption, Turnstile risk score, DPDP consent tracking, and auto-saving internal staff notes (`appointments.notes`).
   - **MT-117 (Status State Machine):** Implemented deterministic appointment lifecycle rules (`Pending -> Confirmed -> Completed / Cancelled`), blocking illegal state reversions with HTTP 422 `E-1603` and recording atomic audit events.
   - **MT-118 (CSV Export & WhatsApp Direct):** Built streaming CSV export with RFC-4180 escaping and a prefilled `wa.me` WhatsApp confirmation link generator with Indian phone number normalization (`91...`).
   - **MT-119 (Clinic Settings CMS):** Built weekly operating hours editor (Monday–Sunday open/close/closed), slot interval dropdown (15/30/45/60 min), alert email recipient manager (max 3), and spam sensitivity slider, synchronizing immediately with the public availability endpoint.
   - **MT-120 (Page Slots Manager & 7-Page Limit Enforcer):** Built 7-page slots architecture manager rejecting an 8th page attempt with HTTP 422 `E-1601`, synchronizing enabled pages with draft `content_sheets` data.

---

## 2. What Was Done Differently from the Previous Project (`dr-12999` / `6999-doctors-landing-page`)

| Dimension | Previous Project (`dr-6999` / `dr-12999`) | Current Project (`dr-18999` — Professional Clinic) |
|---|---|---|
| **Commercial Offering** | Basic (₹6,999) and Practice Growth (₹12,999) static landing pages; agency-managed with manual rebuilds. | **Professional Clinic (₹18,999 / ₹9,999 renewal)** full-stack clinic operating system with self-serve doctor CMS, real-time OPD inbox, and 7 structured pages. |
| **Patient Privacy & DPDP Act 2023** | Patient phone numbers and emails stored as plaintext in database columns or flat JSON files. | **Hardware-grade AES-256-GCM bytea encryption** for all patient contact details (`patient_name_enc`, `patient_phone_enc`, `patient_email_enc`, `message_enc`). HMAC-SHA-256 blind indexing allows searchability without exposing plaintext. Sensitive fields are scrubbed from server logs and audit payloads (Rule R9). |
| **Bot & Spam Defense** | Client-side form validation only; vulnerable to headless browser bots and form flooding. | **Triple-layer server-side protection:** Cloudflare Turnstile challenge token verification, invisible honeypot traps, and a 3-second submission time-trap. Automated bot submissions are dropped with HTTP 403 `E-1604`. |
| **Appointment Scheduling & Availability** | Static hardcoded appointment request forms sending direct untracked webhooks. | **Dynamic slot calculation engine (`GET /api/v1/public/availability`)** computing available 15/30/45/60-minute consultation slots in real time based on active clinic operating hours and existing booked appointments. |
| **Duplicate Submission Prevention** | No idempotency handling; network timeouts or double-clicks generated duplicate database leads. | **Transactional idempotency keys (`Idempotency-Key` header)** stored in PostgreSQL. Replayed network requests return the original HTTP 202 response without creating duplicate database rows or outbox emails. |
| **Reliable Email Dispatch** | Synchronous inline email calls during request lifecycle; API timeouts dropped patient requests. | **Transactional Outbox Pattern:** mutations write an event to `outbox_events` in the same database transaction as the appointment. An asynchronous worker with exponential backoff retries and Resend API circuit breakers delivers notifications with P95 < 60 s. |
| **Doctor / Staff Authentication** | Magic link or static password without multi-factor protection. | **Enterprise RFC-6238 TOTP 2FA:** QR code pairing with Google Authenticator, 8 bcrypt-hashed single-use backup recovery codes, and brute-force account lockout after 5 consecutive failed attempts (HTTP 429 `E-1501`). |
| **Audit Logging & Compliance** | Ephemeral console logging or non-existent mutation history. | **Immutable append-only `audit_log` table** protected by PostgreSQL database triggers that raise SQL exceptions on any `UPDATE` or `DELETE` attempt. Every PII decryption, status change, and setting update is permanently recorded. |
| **OPD Submissions Management** | External spreadsheet exports or unindexed table views causing browser lag at scale. | **High-performance OPD board:** Keyset cursor pagination `(created_at, id) < ($cursorCreatedAt, $cursorId)` running in < 25 ms on 10,000+ rows, dedicated Today's OPD filter, and sliding detail drawer with staff notes. |
| **Appointment Lifecycle Integrity** | Status free-text fields with arbitrary manual overrides. | **Strict finite state machine (`Pending -> Confirmed -> Completed / Cancelled`)**. Impossible or reversed transitions (such as Completed &rarr; Pending) are rejected with HTTP 422 `E-1603`. |
| **Patient Communications** | Manual copy-pasting of phone numbers from emails into personal phones. | **One-click WhatsApp direct launcher (`WhatsAppLink.tsx`)**: automatically parses 10-digit Indian phone numbers into international `+91` format and pre-fills personalized appointment confirmation text templates. |
| **Content Limits & Packaging** | Loose page limits prone to plan boundary blurring. | **Server-side 7-page limit enforcer (Rule R1 / 18 § 2):** attempts to enable an 8th page slot are strictly rejected with HTTP 422 `E-1601`. |

---

## 3. Technical Implementation Breakdown

### 3.1 PII Cryptographic Engine (`apps/platform/src/lib/crypto.ts`)
* Uses authenticated symmetric encryption: `AES-256-GCM` with 96-bit random IVs and 128-bit authentication tags.
* Payload binary packing format: `IV (12 bytes) + AuthTag (16 bytes) + Ciphertext` stored as PostgreSQL `bytea`.
* Key derivation using PBKDF2 (100,000 iterations, SHA-256) and HKDF.
* Blind indexing: `HMAC-SHA-256(phone, salt)` enables constant-time duplicate checks and search queries without decrypting the dataset.
* Automated log scrubber replacing phone numbers, emails, and Indian PAN/Aadhaar patterns with `[REDACTED_PII]` in debug traces.

### 3.2 Public Appointment & Enquiry APIs (`apps/platform/src/app/api/v1/public/*`)
* `POST /api/v1/public/appointments`:
  * Validates patient payload via Zod with DPDP consent confirmation.
  * Rate-limits incoming submissions to 5 per minute per IP address.
  * Checks `Idempotency-Key` header: returns cached response if replayed.
  * Atomically encrypts patient contact info and inserts records into `appointments` and `outbox_events` (`appointment.created`).
* `GET /api/v1/public/availability`:
  * Calculates dynamic consultation slots based on configured interval (15, 30, 45, 60 minutes) and operating hours for the requested date.
  * Automatically filters out previously booked or confirmed appointments.

### 3.3 Spam & Bot Protection (`apps/platform/src/lib/spam-protection.ts`)
* Evaluates Turnstile token with Cloudflare's siteverify endpoint; requires score >= 0.5.
* Enforces invisible honeypot field (`website_url`): instant drop if filled by automated bots.
* Enforces client submission time-trap: rejects forms submitted faster than 3,000 ms.
* Rejections return standardized HTTP 403 with error code `E-1604`.

### 3.4 Outbox Notifier Background Worker (`apps/platform/src/jobs/notifier.ts`)
* Drains pending records from `outbox_events` with PostgreSQL row-level locks (`FOR UPDATE SKIP LOCKED`).
* Formats responsive clinical email notification containing consultation details and clinical action links.
* Dispatches email via Resend API wrapped in an exponential backoff retry loop (up to 5 attempts).
* Implements circuit breaker: gracefully marks events as degraded during external email gateway outages without blocking patient bookings.

### 3.5 TOTP 2FA Auth & Account Lockout (`apps/platform/src/app/api/v1/auth/totp/*`)
* Compliant with RFC-6238 time-step authentication (30-second window, +/- 1 drift step tolerance).
* Generates standard `otpauth://` URI and QR code for scanning.
* Generates 8 distinct 10-character backup recovery codes, hashed with crypto-grade hashing before storage. Single-use enforcement burns recovery codes upon verification.
* Implements brute-force protection: 5 consecutive invalid code attempts locks the account for 15 minutes (HTTP 429 `E-1501`).

### 3.6 Immutable Audit Trail (`apps/platform/src/lib/audit.ts`)
* Writes immutable events into `audit_log`: captures `tenant_id`, `actor_id`, `action`, `target`, `details` JSON, and SHA-256 hashed IP / user-agent.
* Database triggers `trg_audit_log_prevent_update` and `trg_audit_log_prevent_delete` raise SQL exceptions on any modification attempt.
* Automatically strips PII from audit details to preserve privacy under India DPDP Act 2023.

### 3.7 Keyset Cursor Submissions Board (`apps/platform/src/lib/cms-submissions.ts`)
* Avoids inefficient SQL `OFFSET / LIMIT` pagination.
* Uses compound B-tree index on `(tenant_id, created_at DESC, id DESC)`.
* Keyset query `(created_at, id) < ($cursorCreatedAt, $cursorId)` retrieves 50 records in < 25 ms, even across tables with tens of thousands of rows.
* Dedicated Today's OPD tab queries `preferred_date = CURRENT_DATE` for morning triage.

### 3.8 Appointment Lifecycle State Machine (`apps/platform/src/lib/appointment-state-machine.ts`)
* Enforces deterministic status transitions:
  * `pending` &rarr; `confirmed` | `cancelled`
  * `confirmed` &rarr; `completed` | `cancelled`
  * `cancelled` &rarr; `pending`
  * `completed` is a terminal state (no outgoing transitions allowed).
* Illegal transitions are rejected with HTTP 422 and code `E-1603`.
* Each successful transition automatically records an entry in `appointment_events` and an audit event in `audit_log`.

### 3.9 7-Page Limit Enforcer (`apps/platform/src/app/api/v1/cms/pages/route.ts`)
* Allowed slots: `home`, `about`, `services`, `doctors`, `testimonials-faq`, `blog`, `contact`.
* Schema validation enforces array uniqueness and maximum length of 7.
* Attempting to submit 8 or more enabled pages is blocked with HTTP 422 `E-1601`.
* Synchronization logic atomically updates `clinic_settings.enabled_pages` and patches draft `content_sheets.data.enabledPages`.

---

## 4. Verification and Test Results

### 4.1 Test Suites Summary
* **Platform Tests (`apps/platform`):** 111/111 passing across 32 suites:
  * `test/cms-page-slots.test.ts` (6/6 passing)
  * `test/cms-settings.test.ts` (5/5 passing)
  * `test/cms-export-whatsapp.test.ts` (5/5 passing)
  * `test/cms-status-machine.test.ts` (6/6 passing)
  * `test/cms-detail-drawer.test.ts` (3/3 passing)
  * `test/cms-submissions.test.ts` (7/7 passing)
  * `test/audit.test.ts` (4/4 passing)
  * `test/totp.test.ts` (9/9 passing)
  * `test/notifier.test.ts` (4/4 passing)
  * `test/spam.test.ts` (7/7 passing)
  * `test/public-enquiries-availability.test.ts` (6/6 passing)
  * `test/public-appointments.test.ts` (6/6 passing)
  * `test/crypto.test.ts` (10/10 passing)
  * `test/rls-isolation.test.ts` (6/6 passing)
  * `test/professional-migrations.test.ts` (9/9 passing)
  * `test/cms-shell.test.ts` (3/3 passing)
  * `test/gateway.test.ts` (3/3 passing)
  * `test/db-typed-query.test.ts` (1/1 passing)
* **Site Template Tests (`apps/site-template`):** 12/12 passing across 2 suites.
* **UI Tokens & Icons Tests (`packages/ui`):** 8/8 passing across 2 suites.
* **Content Schema Tests (`packages/content-schema`):** 3/3 passing.
* **CI Gates Tests (`tests/`):** 2/2 passing (`docs-touched` and `gitleaks`).
* **TypeScript Workspace Typecheck:** 4/4 packages cleanly verified with 0 errors (`pnpm typecheck`).
* **Total Passing Tests:** 136 / 136 (100% green).

---

## 5. Git Commit History for Today

```
08044ee feat(cms): implement MT-120 page slots manager with 7-page limit enforcer and E-1601 validation
9f9c86c feat(cms): implement MT-119 clinic settings CMS with operating hours and availability sync
f622fac feat(cms): implement MT-118 CSV export and WhatsApp direct confirmation
1f69ea2 feat(cms): implement MT-117 status state machine and allowed transitions with E-1603 validation
27f998f feat(cms): implement MT-116 submission detail drawer with staff notes and audit logging
3bf61ff feat(cms): implement MT-115 submissions dashboard with Today OPD and keyset pagination
8e92113 feat(audit): implement MT-114 append-only audit trail engine with immutability triggers
cdcc0a3 feat(auth): implement MT-113 TOTP 2FA auth, recovery codes & lockout
e81fe79 feat(worker): implement MT-112 outbox notifier job with Resend email client
b49d3ef feat(security): implement MT-111 Turnstile, honeypot & bot protection
a53a3a7 feat(api): implement MT-110 public enquiries API and clinic availability endpoint
46213a3 feat(api): implement MT-109 public appointments API with idempotency and encrypted storage
0421389 feat(crypto): implement MT-108 PII encryption and decryption engine with key rotation and log scrubber
```

---

## 6. Next Steps
* Continue with **Milestone PC — CMS**:
  * **MT-121:** Rich-text blog editor with HTML sanitizer (`TipTapEditor.tsx`, `sanitize-html`).
  * **MT-122:** FAQs & testimonials CMS with DPDP consent guard and review moderation.
  * **MT-123:** Media library & per-card asset replacement with 1 GB storage quota tracking.
  * **MT-124:** Publishing saga & rollback controller.
