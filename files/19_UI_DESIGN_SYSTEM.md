---
purpose: UI Design System — tokens, typography, icon family, components, CMS shell, public template pages, motion, accessibility, screenshot protocol, anti-AI-look checklist
owner: EcoDigiTech founding team
status: Draft v0.1
last_updated: 2026-11-05
related: [00_MASTER_RULES.md, 01_PRD.md, 08_UI_SPEC.md, 10_SECURITY.md, 18_CMS_SPEC.md]
---

# 19 — UI Design System

## 1. Design Tokens & Color Palette

The design system implements a refined clinical palette rooted in the founders' reference designs (ADR-013). All colors, radii, and shadows are accessed via design tokens (CSS variables).

### 1.1 Color Tokens
| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--color-brand-primary` | `#0D5C46` (Deep Clinical Green) | `#14B8A6` (Vibrant Teal) | Primary CTAs, active states, key branding |
| `--color-brand-secondary` | `#0F766E` (Forest Teal) | `#2DD4BF` (Soft Mint) | Secondary buttons, hero accents, badges |
| `--color-brand-surface` | `#E6F4F1` (Mint Tint) | `#132E27` (Deep Pine) | Hero background cards, badge backgrounds |
| `--color-bg-base` | `#FFFFFF` | `#090D0B` | Page background |
| `--color-bg-surface` | `#F8FAFC` | `#111815` | Card backgrounds, table rows, sidebar |
| `--color-bg-elevated` | `#FFFFFF` | `#18221E` | Modals, drawers, dropdown menus |
| `--color-border-subtle` | `#E2E8F0` | `#22332C` | Card dividers, table borders, input strokes |
| `--color-border-strong` | `#CBD5E1` | `#334E43` | Focus states, active borders |
| `--color-text-main` | `#0F172A` | `#F1F5F9` | Primary headings, body copy |
| `--color-text-muted` | `#64748B` | `#94A3B8` | Subtitles, timestamps, metadata |
| `--color-text-inverse` | `#FFFFFF` | `#0F172A` | Text on brand buttons |
| `--color-status-pending` | `#D97706` (Amber-600) | `#FBBF24` (Amber-400) | Pending appointment badge |
| `--color-status-confirmed` | `#059669` (Emerald-600) | `#34D399` (Emerald-400) | Confirmed appointment badge |
| `--color-status-completed` | `#2563EB` (Blue-600) | `#60A5FA` (Blue-400) | Completed appointment badge |
| `--color-status-cancelled` | `#DC2626` (Red-600) | `#F87171` (Red-400) | Cancelled appointment badge |

### 1.2 Spacing & Radii Scale
- **Spacing Scale (8-pt grid):** `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px), `space-8` (32px), `space-10` (40px), `space-12` (48px), `space-16` (64px).
- **Radii:** `radius-sm` (4px, controls), `radius-md` (8px, cards/inputs), `radius-lg` (12px, modals/drawers), `radius-xl` (16px, hero shapes), `radius-full` (9999px, pills/badges).
- **Shadows:**
  - Subtle: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
  - Card: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
  - Overlay: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`

---

## 2. Typography

Two typefaces are self-hosted in `woff2` format to guarantee fast LCP without external Google Fonts latency.

- **Display Typeface:** Plus Jakarta Sans Bold / ExtraBold (clinical authority, crisp geometry).
- **Text Typeface:** Inter / Plus Jakarta Sans Regular & Medium (optimized for screen legibility at small sizes).
- **Devanagari Fallback Chain:**
  `font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', 'Noto Sans Devanagari', sans-serif;`

### Type Scale
| Level | Font Size | Line Height | Weight | Letter Spacing |
|---|---|---|---|---|
| `display-2xl` | 44 px (2.75 rem) | 1.15 | 800 | -0.025 em |
| `display-xl` | 36 px (2.25 rem) | 1.20 | 700 | -0.020 em |
| `heading-lg` | 28 px (1.75 rem) | 1.25 | 700 | -0.015 em |
| `heading-md` | 22 px (1.375 rem) | 1.30 | 600 | -0.010 em |
| `heading-sm` | 18 px (1.125 rem) | 1.35 | 600 | 0 |
| `body-base` | 16 px (1.000 rem) | 1.50 | 400 | 0 |
| `body-sm` | 14 px (0.875 rem) | 1.45 | 400 | 0 |
| `caption` | 12 px (0.750 rem) | 1.40 | 500 | +0.010 em |

---

## 3. Iconography (Strict R7 Enforcement)

- **Standard Family:** Lucide Icons (or Phosphor), 1.75 px stroke weight, aligned to a 20 px or 24 px grid.
- **Import Format:** Imported strictly as React SVG components (e.g. `import { Calendar, Phone, CheckCircle } from 'lucide-react'`).
- **NO EMOJI POLICY (R7):** Absolutely no emoji characters anywhere in the UI — no emoji as icons, bullets, nav items, status markers, or decoration. Violation fails CI.
- **Brand Marks:** Clinic logo and doctor degree credentials rendered as custom optimized SVGs.

---

## 4. Component Library

### 4.1 Buttons
- **Primary:** Solid brand green (`--color-brand-primary`), white text, hover subtle lift (`translateY(-1px)`).
- **Secondary:** Mint background (`--color-brand-surface`), brand green text, subtle border.
- **Outline:** Transparent background, `--color-border-strong` border, hover surface tint.
- **Danger:** Deep red background, white text (for cancellations, deletions).
- **Sizes:** Small (32 px height), Medium (40 px height), Large (48 px height, min tap target).

### 4.2 Form Controls
- **Input & Textarea:** Inset subtle border, `--color-bg-base`, clear label, focus ring `2px solid var(--color-brand-primary)` with `2px offset`.
- **Select:** Custom SVG chevron down, accessible native `<select>` underneath.
- **Dropzone:** Dashed border, icon + file format notice, hover drag-over highlight, upload progress bar.

### 4.3 Data Table (CMS Submissions)
- Dense, readable table with fixed or sticky header.
- Columns: Patient Name, Phone, Service, Preferred Slot, Status Pill, Received Date, Actions (`...` menu).
- Cursor pagination footer: "Showing 1–25 of 1,420 submissions" with Previous / Next buttons.

### 4.4 Modals & Drawers
- Backdrop blur: `backdrop-filter: blur(4px); background-color: rgba(15, 23, 42, 0.4)`.
- Detail Drawer slides from right (width: 480 px on desktop, 100% on mobile).
- Confirm Dialog: explicit confirmation for destructive actions (cancel appointment, delete post, rollback site).

---

## 5. CMS Shell Layout

```
+-------------------------------------------------------------------------------+
| TOP BAR: [Logo] Clinic Name   | Search... | [Theme Toggle] [Doctor Profile]  |
+-------------------+-----------------------------------------------------------+
| SIDEBAR           | BREADCRUMBS: Submissions > Appointments                   |
| - Submissions     | HEADER: Appointments [Today's OPD]  [Filter] [Export CSV] |
|   - Appointments  +-----------------------------------------------------------+
|   - Enquiries     | STATUS TABS: All (120) | Pending (8) | Confirmed (42) ...  |
| - Site Pages (7)  +-----------------------------------------------------------+
| - Blog Posts      | DATA TABLE:                                               |
| - FAQs & Reviews  | Name        | Phone       | Service  | Slot    | Status   |
| - Media Library   | Priya M.    | +91 98...   | Dental   | 10:30 AM| [Pending]|
| - Settings        | Rajesh K.   | +91 91...   | Ortho    | 11:00 AM| [Confirm]|
| - Version History | ...         | ...         | ...      | ...     | ...      |
+-------------------+-----------------------------------------------------------+
```

---

## 6. Public Template Pages (Fixed 7-Page Set)

1. **Home (`/`):**
   - Header with clinic name, navigation menu, direct call button.
   - Split hero section: Left = headline, specialty badges, primary "Book Appointment" CTA; Right = doctor portrait on rounded organic teal shape + nameplate.
   - Clinical proof row: registration number, degrees, years of experience.
   - Services overview grid (top 6 services with clean clinical icons).
   - Clinic hours and location banner.
   - Sticky mobile CTA bar (visible on screens < 768 px).
2. **About (`/about`):** Detailed bio, medical philosophy, hospital attachments, awards.
3. **Services (`/services`):** Full list of treatments with clinical indications, procedural details, and recovery advice.
4. **Doctors (`/doctors`):** Multi-specialist roster cards with qualifications, timings, and OPD days.
5. **Testimonials & FAQ (`/testimonials-faq`):** Tabbed interface with moderated patient testimonials and accordion FAQs.
6. **Blog (`/blog` & `/blog/:slug`):** Clinical insights, preventive healthcare guides, reading time, author credential box.
7. **Contact & Appointment (`/contact`):** Dual-purpose view: Left = appointment booking form; Right = clinic address, click-to-load Google Maps facade, emergency directions.

---

## 7. Motion & Accessibility Standards

- **Motion:** All CSS transitions capped at ≤ 200 ms using timing function `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Prefers-Reduced-Motion:** Wrapped in `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`.
- **Accessibility (WCAG 2.1 AA):**
  - Minimum contrast ratio 4.5:1 for normal text, 3:1 for large text and interactive components.
  - Visible focus indicators on all interactive elements (`:focus-visible`).
  - Screen reader accessible labels (`aria-label`, `aria-describedby`) on all icon-only buttons.
  - Form inputs linked to `<label>` via `htmlFor`/`id`.

---

## 8. Screenshot Verification Protocol (R8)

Every UI task must be verified with automated browser captures:
- **Viewport Widths:**
  - `360 px`: Mobile Android (Moto G profile).
  - `768 px`: Tablet / iPad portrait.
  - `1280 px`: Standard desktop.
- **Themes:** Captured in both Light Theme and Dark Theme (total 6 screenshots per page/screen).
- **Artifact Evidence:** Stored in the task evidence walkthrough before declaring completion.

---

## 9. Anti-AI-Look Checklist (Strict R7)

Every page and screen must pass this checklist before shipping:
- [ ] **NO generic purple-to-blue gradients:** Palette strictly adheres to clinical green, mint, and teal.
- [ ] **NO uniform rounded-card grids:** Layouts use varied proportions (split hero, poster-style contact rows, asymmetrical nameplates).
- [ ] **NO stock marketing copy:** Zero "Welcome to our website", "Your health in good hands", or lorem ipsum. All copy reflects actual clinical practice facts from the content sheet.
- [ ] **NO emoji anywhere:** Icons are strictly from the Lucide/Phosphor SVG family.
- [ ] **NO unstyled flash (FOUC):** Computed CSS stylesheet verification passes in Playwright.
- [ ] **Generous whitespace:** Spacing rhythm maintains breathing room between clinical sections (min 48–64 px between desktop sections).
- [ ] **Professional typography:** High-contrast serif or geometric display headline paired with ultra-legible neutral body copy.

