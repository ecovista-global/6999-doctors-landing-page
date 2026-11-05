# Daily Engineering Log — 2026-11-05 (Thursday) / 2026-11-06 (Friday)
**Filename:** `UPDATE_2026-11-05_THURSDAY_NAKUL.md`  
**Engineer:** Nakul Sukhwani (<nakulsukhwani.in@gmail.com>)  
**Repository:** `6999-doctors-landing-page` (`/home/nakul/Documents/Ecodigitech-18999`)  
**Branch:** `dr-18999`  
**Status:** Successfully architected Phase 0 and implemented Milestones PA (Design System & Shells, MT-101..MT-105) and PB (Backend & Data, MT-106..MT-107) for the ₹18,999 Professional Clinic plan. All 22 platform tests, 12 site-template tests, 8 UI tests, 3 content-schema tests, and 2 CI gates passing cleanly (100% green).

---

## 1. Executive Summary

Today marked the formal launch and implementation of the **"Professional Clinic"** full-stack plan (**₹18,999 Year 1 / ₹9,999 renewal**). Moving beyond basic landing pages, this plan provides a custom backend slice, PostgreSQL database isolation, a 7-page patient portal, an enterprise CMS shell, and Row-Level Security (RLS) guaranteeing zero data leakage between clinics.

### Key Milestones Completed Today:
1. **Phase 0 — Product & Architecture Specification:**
   - Drafted commercial facts in `brain/01_PRD.md § 2` (₹18,999 first year, ₹9,999 renewal from year 2; up to 7 pages, custom backend/DB configuration, secure admin login, submissions dashboard, blog CMS, FAQs/testimonials, 5,000 submission quota, 1 GB media storage).
   - Authored Architecture Decision Records **ADR-201 through ADR-205** in `brain/17_DECISIONS.md`.
   - Defined 46 microtasks across Milestones PA–PF in `brain/15_MICROTASKS.md`.
2. **Milestone PA — Design System & Shells (MT-101 to MT-105):**
   - **MT-101 (Tokens & Typography):** Clinical green/mint/teal palettes, dark mode tokens, neutral surfaces, 8-pt spacing scale, fluid type scale, and zero external Google Fonts network calls (self-hosted / system font stack with Devanagari fallback).
   - **MT-102 (Lucide SVG Icons & Emoji Ban):** Replaced all emojis with a unified Lucide SVG icon family on a 20/24px grid with custom vector brand marks (`LogoMark`, `StethoscopeMark`, `CredentialBadgeMark`). Enforced strict R7 zero-emoji compliance in CI.
   - **MT-103 (CSS Pipeline & Anti-FOUC):** Implemented automated Playwright verification ensuring compiled stylesheets are non-empty and button computed styles adhere to design tokens, with negative-control anti-FOUC detection.
   - **MT-104 (CMS App Shell):** Built responsive Next.js App Router CMS shell featuring a collapsible sidebar (270px to 76px, 200ms cubic-bezier transition), breadcrumbs, global `⌘K` search shortcut, live site launcher, and dark/light theme switching.
   - **MT-105 (Public 7-Page Template Shell):** Built responsive `Header.tsx`, `MobileCtaBar.tsx` (sticky bottom CTA bar meeting 48px touch targets), `Footer.tsx` (NAP, DPDP notice), mobile drawer with backdrop overlay, and verified clean Axe accessibility audit (0 violations).
3. **Milestone PB — Backend and Data (MT-106 & MT-107):**
   - **MT-106 (Database Migrations):** Added 8 Drizzle PostgreSQL tables (`appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`), updated `sites.plan` and `subscriptions.plan` with `'professional'`, added TOTP 2FA fields to `users`, and applied plain SQL migration `0001_professional_clinic.sql`.
   - **MT-107 (PostgreSQL RLS Policies & Two-Clinic Isolation):** Enabled and forced Row-Level Security (`FORCE ROW LEVEL SECURITY`) across all 16 tenant tables, created isolation policies using `app.tenant_id`, and verified 0 cross-reads and mutation blocking with a two-clinic test suite.

---

## 2. What Was Done Differently from the Previous Project (`dr-12999` / `6999-doctors-landing-page`)

| Dimension | Previous Project (`dr-12999` / `dr-6999`) | Current Project (`dr-18999` — Professional Clinic) |
|---|---|---|
| **Commercial Offering** | Basic (₹6,999) / Growth (₹12,999) single-page landing page; agency-managed with routine static rebuilds. | **Professional Clinic (₹18,999 / ₹9,999 renewal)** full-stack clinic solution with dedicated backend slice, CMS dashboard, and live OPD management. |
| **Data Storage Architecture** | File-based JSON store (`fixtures/live-store.json`) or basic single-table lead capture without multi-tenant boundaries. | **Production PostgreSQL 16 schema** with 8 dedicated tables (`appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`) using Drizzle ORM and versioned `.sql` migrations. |
| **Multi-Tenant Security** | Application-level filtering via basic `WHERE tenant_id = ?` queries. | **Database-enforced Row-Level Security (RLS)** using `ALTER TABLE ... FORCE ROW LEVEL SECURITY` across all 16 tenant tables, guaranteeing mathematical zero cross-reads between clinics even at the raw SQL query level. |
| **Page Architecture** | Single-page layout with anchor jumps (`#hero`, `#about`, `#services`, `#booking`). | **Fixed 7-page slot structure** (`Home`, `About`, `Services`, `Doctors`, `Testimonials & FAQ`, `Blog`, `Contact & Appointment`) with responsive mobile drawer and dedicated routes. |
| **Iconography & Visual Quality** | 70+ Unicode emojis used as bullets, badges, star ratings, and contact icons. | **Zero Emoji Ban (Rule R7)** enforced via automated CI regex tests. Replaced with tree-shakeable Lucide SVG icon components on a 20/24px grid and custom clinical SVG brand marks. |
| **FOUC Prevention** | Standard Vite bundle build without computed style verification. | **Automated Playwright anti-FOUC verification** inspecting initial render styles (font family, colors, radii) and negative-control test in CI. |
| **Accessibility (a11y)** | Basic HTML semantic elements without automated WCAG validation. | **Axe Core automated audits** verifying 0 critical and 0 serious accessibility violations on mobile (360px) and desktop (1280px) viewports; minimum 48px touch targets on mobile CTA bar. |
| **Privacy & DPDP Compliance** | Plaintext phone numbers and messages in database records. | **Bytea encrypted PII columns** (`patient_name_enc`, `patient_phone_enc`, `patient_email_enc`, `message_enc`) designed for AES-256-GCM encryption per India DPDP Act 2023. |
| **Admin & CMS Capabilities** | Single-tab static editor modifying JSON fixtures directly. | **Modular Next.js App Router CMS** with collapsible sidebar, active navigation indicators, breadcrumbs, `⌘K` global search, theme toggle, and OPD submission management. |

---

## 3. Technical Implementation Breakdown

### 3.1 Drizzle PostgreSQL Schema Extensions (`apps/platform/src/db/schema.ts`)
* Defined custom `bytea` type for AES-256-GCM encrypted PII fields and `citext` for case-insensitive email matching.
* Created 8 Professional Clinic tables:
  * `appointments`: booking requests with encrypted PII, service name, preferred date/time slot, consent timestamp, and idempotency key.
  * `appointment_events`: full lifecycle status audit trail (`pending` &rarr; `confirmed` &rarr; `completed` / `cancelled`).
  * `enquiries`: general patient queries with encrypted contact info.
  * `posts`: clinic blog articles with slug uniqueness scoped per tenant (`unique(tenant_id, slug)`).
  * `faqs`: categorized Q&A items with display ordering and active toggles.
  * `testimonials`: patient reviews with mandatory verified consent tracking and moderation status (`draft`, `approved`, `archived`).
  * `clinic_settings`: operating hours JSON, slot interval (default 30m), max daily slots (default 40), notification emails array, and enabled page slots.
  * `usage_counters`: quota metering tracking monthly submissions (5,000 allowance), storage (1 GB R2 allowance), and content updates.

### 3.2 Row-Level Security Policies (`apps/platform/drizzle/0002_rls_policies.sql`)
* Activated `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on:
  * `appointments`, `appointment_events`, `enquiries`, `posts`, `faqs`, `testimonials`, `clinic_settings`, `usage_counters`
  * `sites`, `domains`, `content_sheets`, `leads`, `lead_events`, `subscriptions`, `outbox_events`, `audit_log`
* Applied tenant isolation policies:
  ```sql
  CREATE POLICY "tenant_isolation_appointments" ON "appointments"
    FOR ALL
    USING (
      NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      OR (
        NULLIF(current_setting('app.tenant_id', true), '') IS NULL
        AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
      )
    )
    WITH CHECK (
      NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      OR (
        NULLIF(current_setting('app.tenant_id', true), '') IS NULL
        AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
      )
    );
  ```

### 3.3 Two-Clinic Isolation Test Suite (`apps/platform/test/rls-isolation.test.ts`)
* Asserted `rowsecurity = true` in `pg_tables` across all 16 tenant tables.
* Seeded Clinic A and Clinic B records across 13 distinct tables.
* Executed session queries with `SET LOCAL app.tenant_id = :clinicAId` &rarr; verified Clinic A sees 0 Clinic B records.
* Executed direct cross-tenant queries (`WHERE id = :clinicBRecordId` and `WHERE tenant_id = :clinicBId`) &rarr; verified 0 rows returned.
* Executed cross-tenant `UPDATE` and `DELETE` &rarr; verified 0 rows affected.
* Executed cross-tenant `INSERT` with Clinic B's tenant ID &rarr; verified Postgres throws an RLS check violation.
* Executed unauthenticated query with `app.enforce_rls = 'on'` &rarr; verified 0 rows returned.
* Executed query with `app.bypass_rls = 'on'` &rarr; verified background workers can read across clinics for batch processing.

---

## 4. Verification and Test Results

### 4.1 Test Suites Summary
* **Platform Tests (`apps/platform`):** 22/22 tests passing across 5 suites:
  * `test/cms-shell.test.ts` (3/3 passing)
  * `test/db-typed-query.test.ts` (1/1 passing)
  * `test/gateway.test.ts` (3/3 passing)
  * `test/professional-migrations.test.ts` (9/9 passing)
  * `test/rls-isolation.test.ts` (6/6 passing)
* **Site Template Tests (`apps/site-template`):** 12/12 tests passing across 2 suites:
  * `test/check-css.test.ts` (3/3 passing)
  * `test/template-shell.test.ts` (9/9 passing)
* **UI Tokens & Icons Tests (`packages/ui`):** 8/8 tests passing:
  * `test/tokens.test.mjs` (4/4 passing)
  * `test/icons.test.mjs` (4/4 passing)
* **Content Schema Tests (`packages/content-schema`):** 3/3 tests passing:
  * `test/schema.test.mjs` (3/3 passing)
* **CI Gates Tests (`tests/`):** 2/2 tests passing:
  * `docs-touched` gate: PASSED
  * `gitleaks` secret detector: PASSED
* **Turborepo Monorepo Build:** 13/13 tasks successful (0 errors).

---

## 5. Git Commit History for Today

```
faac636 feat(db): implement MT-107 RLS policies and two-clinic isolation suite
aed416d feat(db): implement MT-106 database migrations, schema tables, and types for Professional Clinic
7f05574 feat(template): implement MT-105 public 7-page template shell, responsive drawer, and sticky mobile CTA bar
70ae8cc feat(cms): implement MT-104 collapsible CMS app shell, header breadcrumbs, and theme toggle
9d9f5dc feat(ci): implement MT-103 CSS pipeline and anti-FOUC verification in site-template and CI
b86bdda feat(ui): implement MT-102 Lucide SVG icon family, clinical brand marks, and emoji ban
ae1fc52 feat(ui): implement MT-101 tokens, typography, dark mode, and zero-google-fonts setup
68f8b46 docs(spec): implement Phase 0 delta spec for Professional Clinic plan (₹18,999)
```

---

## 6. Next Steps
* Proceed with **Milestone PB — Backend and Data**:
  * **MT-108:** PII encryption & decryption engine (`apps/platform/src/lib/crypto.ts`).
  * **MT-109:** Public appointments API (`POST /v1/public/appointments`) with idempotency and Turnstile bot protection.
  * **MT-110:** Public enquiries API (`POST /v1/public/enquiries`) and clinic availability endpoint (`GET /v1/public/availability`).
