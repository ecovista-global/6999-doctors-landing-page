import { z } from 'zod';

/**
 * 7-Page Architecture Slot Constants & Validation (18 § 2 / MT-120)
 * Allowed slots for the Professional Clinic plan (exactly 7):
 * 1. Home ('/')
 * 2. About ('/about')
 * 3. Services ('/services')
 * 4. Doctors ('/doctors')
 * 5. Testimonials-FAQ ('/testimonials-faq')
 * 6. Blog ('/blog')
 * 7. Contact ('/contact')
 */
export const ALLOWED_PAGE_SLOTS = [
  'home',
  'about',
  'services',
  'doctors',
  'testimonials-faq',
  'blog',
  'contact',
] as const;

export type AllowedPageSlot = (typeof ALLOWED_PAGE_SLOTS)[number];

export const PageSlotEnum = z.enum(ALLOWED_PAGE_SLOTS);

export const ProfessionalPageSlotsSchema = z
  .array(PageSlotEnum)
  .max(7, { message: 'Maximum of 7 enabled pages permitted on the Professional Clinic plan' })
  .refine(
    (slots) => new Set(slots).size === slots.length,
    { message: 'Duplicate page slots are not permitted' }
  );

export interface PageSlotDetail {
  id: AllowedPageSlot;
  label: string;
  path: string;
  description: string;
  isCore: boolean;
}

export const PAGE_SLOTS_METADATA: PageSlotDetail[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    description: 'Split hero with doctor cutout, clinical badges, quick-book trigger, and clinic timings.',
    isCore: true,
  },
  {
    id: 'about',
    label: 'About Doctor',
    path: '/about',
    description: 'Doctor full biography, alma mater, medical council registration, and clinic story.',
    isCore: false,
  },
  {
    id: 'services',
    label: 'Treatments & Services',
    path: '/services',
    description: 'Comprehensive grid of clinical treatments, procedure instructions, and service FAQs.',
    isCore: false,
  },
  {
    id: 'doctors',
    label: 'Doctors & Specialists',
    path: '/doctors',
    description: 'Multi-specialist clinical roster with consulting schedules and qualifications.',
    isCore: false,
  },
  {
    id: 'testimonials-faq',
    label: 'Reviews & FAQs',
    path: '/testimonials-faq',
    description: 'Patient initials testimonials with verified consent and searchable clinical FAQs.',
    isCore: false,
  },
  {
    id: 'blog',
    label: 'Health Blog',
    path: '/blog',
    description: 'Patient education guides, seasonal advisories, and wellness articles.',
    isCore: false,
  },
  {
    id: 'contact',
    label: 'Contact & Booking',
    path: '/contact',
    description: 'Interactive appointment booking form, Google Maps facade, and clinic emergency notice.',
    isCore: true,
  },
];

export function validatePageSlots(slots: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(slots)) {
    return { valid: false, error: 'Page slots must be an array' };
  }
  if (slots.length > 7) {
    return { valid: false, error: 'Maximum of 7 enabled pages permitted on this plan' };
  }
  for (const slot of slots) {
    if (!ALLOWED_PAGE_SLOTS.includes(slot as AllowedPageSlot)) {
      return { valid: false, error: `Invalid page slot: '${slot}'. Allowed slots: ${ALLOWED_PAGE_SLOTS.join(', ')}` };
    }
  }
  if (new Set(slots).size !== slots.length) {
    return { valid: false, error: 'Duplicate page slots are not permitted' };
  }
  return { valid: true };
}
