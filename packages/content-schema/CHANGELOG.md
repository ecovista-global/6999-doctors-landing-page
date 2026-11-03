# Changelog — @ecodigitech/content-schema

## [1.1.0] - 2026-11-03
### Added
- Added optional `plan` enum (`basic` | `growth`, default `basic`) for Practice Growth tier.
- Added optional `pages` structure (`about`, `services`, `testimonials`, `contact`) for multi-page export.
- Added `consentObtained` and `treatmentTag` fields to `ReviewItemSchema`.

## [1.0.0] - 2026-11-02
### Added
- Initial Zod validation schema for ContentSheet:
  - `DoctorProfileSchema` (degrees, registration number, council, experience)
  - `ClinicInfoSchema` (address with 6-digit Indian pincode, +91 phone validation, maps URL)
  - `ClinicHourSchema` (days, open, close, isClosed)
  - `ServiceItemSchema` (enforces max 9 services)
  - `ReviewItemSchema` (enforces max 6 reviews)
  - `FaqItemSchema` (enforces max 8 FAQs)
  - Theme (`green` / `teal`) and language (`en` / `hi`) support
  - Security refinements banning `<script>` tags, `javascript:` URIs, and dangerous inline handlers via `safeText`
