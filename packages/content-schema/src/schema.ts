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

export const PREMIUM_ALLOWED_PAGE_SLOTS = [
  'home',
  'about',
  'services',
  'doctors',
  'specialties',
  'facilities',
  'health-packages',
  'testimonials-faq',
  'blog',
  'contact',
] as const;

export type PremiumPageSlot = (typeof PREMIUM_ALLOWED_PAGE_SLOTS)[number];

export const PremiumPageSlotEnum = z.enum(PREMIUM_ALLOWED_PAGE_SLOTS);

export const PremiumPageSlotsSchema = z
  .array(PremiumPageSlotEnum)
  .max(10, { message: 'Maximum of 10 enabled pages permitted on the Premium Clinic plan' })
  .refine(
    (slots) => new Set(slots).size === slots.length,
    { message: 'Duplicate page slots are not permitted' }
  );

export interface PageSlotDetail {
  id: AllowedPageSlot | PremiumPageSlot;
  label: string;
  path: string;
  description: string;
  isCore: boolean;
  tier?: 'professional' | 'premium';
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

export const PREMIUM_PAGE_SLOTS_METADATA: PageSlotDetail[] = [
  ...PAGE_SLOTS_METADATA.slice(0, 4).map((slot) => ({ ...slot, tier: 'professional' as const })),
  {
    id: 'specialties',
    label: 'Specialties Directory',
    path: '/specialties',
    description: 'Department & clinical speciality directory linking symptoms to resident consultants.',
    isCore: false,
    tier: 'premium',
  },
  {
    id: 'facilities',
    label: 'Clinic Facilities & Lab',
    path: '/facilities',
    description: 'Diagnostics, day-care observation bay, pharmacy, and patient safety infrastructure.',
    isCore: false,
    tier: 'premium',
  },
  {
    id: 'health-packages',
    label: 'Preventive Health Packages',
    path: '/health-packages',
    description: 'Annual metabolic panels, diabetes screening, and senior wellness checkup bundles.',
    isCore: false,
    tier: 'premium',
  },
  ...PAGE_SLOTS_METADATA.slice(4).map((slot) => ({ ...slot, tier: 'professional' as const })),
];

export function validatePageSlots(
  slots: string[],
  plan: 'basic' | 'growth' | 'professional' | 'premium' = 'professional'
): { valid: boolean; error?: string } {
  if (!Array.isArray(slots)) {
    return { valid: false, error: 'Page slots must be an array' };
  }
  const maxAllowed = plan === 'premium' ? 10 : 7;
  const allowedList: readonly string[] = plan === 'premium' ? PREMIUM_ALLOWED_PAGE_SLOTS : ALLOWED_PAGE_SLOTS;

  if (slots.length > maxAllowed) {
    return { valid: false, error: `Maximum of ${maxAllowed} enabled pages permitted on this plan` };
  }
  for (const slot of slots) {
    if (!allowedList.includes(slot)) {
      return { valid: false, error: `Invalid page slot: '${slot}'. Allowed slots: ${allowedList.join(', ')}` };
    }
  }
  if (new Set(slots).size !== slots.length) {
    return { valid: false, error: 'Duplicate page slots are not permitted' };
  }
  return { valid: true };
}
