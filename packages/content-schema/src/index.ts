import { z } from 'zod';

// Security check: ban script tags and dangerous HTML/JS in any text input
export const safeText = (maxChars: number = 500) =>
  z
    .string()
    .trim()
    .max(maxChars)
    .refine((val) => !/<script\b[^>]*>([\s\S]*?)<\/script>/gi.test(val) && !/<script\b/gi.test(val), {
      message: 'Malicious script tags are strictly prohibited',
    })
    .refine((val) => !/javascript:/gi.test(val), {
      message: 'javascript: URI schemes are prohibited',
    })
    .refine((val) => !/onload\s*=|onerror\s*=/gi.test(val), {
      message: 'Inline event handlers are prohibited',
    });

// E.164 phone number validator (+91 for Indian mobile / clinic numbers)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+91[6-9]\d{9}$/, {
    message: 'Must be a valid Indian phone number starting with +91 followed by 10 digits',
  });

export const DoctorProfileSchema = z.object({
  name: safeText(100),
  degree: safeText(50), // e.g. "MBBS, MD (General Medicine)"
  specialty: safeText(100), // e.g. "Consultant Physician"
  experienceYears: z.number().int().min(0).max(70),
  registrationNumber: safeText(50), // Medical registration number
  medicalCouncil: safeText(100), // e.g. "Delhi Medical Council"
  bio: safeText(1000),
  photoUrl: z.string().url().max(500),
  photoAlt: safeText(150),
});

export const ClinicAddressSchema = z.object({
  street: safeText(200),
  area: safeText(100),
  city: safeText(100),
  state: safeText(100),
  pincode: z.string().regex(/^\d{6}$/, { message: 'Pincode must be 6 digits' }),
});

export const ClinicInfoSchema = z.object({
  name: safeText(150),
  tagline: safeText(200),
  address: ClinicAddressSchema,
  googleMapsUrl: z.string().url().max(500),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  whatsappNumber: phoneSchema,
  email: z.string().email().max(100),
  consultationFee: z.number().int().min(0).max(50000).optional(),
});

export const ClinicHourSchema = z.object({
  days: safeText(50), // e.g. "Mon - Sat"
  open: safeText(20), // e.g. "09:00 AM"
  close: safeText(20), // e.g. "08:00 PM"
  isClosed: z.boolean().default(false),
});

export const ServiceItemSchema = z.object({
  title: safeText(100),
  description: safeText(300),
  icon: safeText(50).optional(),
});

export const ReviewItemSchema = z.object({
  authorInitial: safeText(50), // e.g. "Priya K."
  rating: z.number().int().min(1).max(5),
  text: safeText(400),
  source: safeText(50).default('Verified Patient'),
  treatmentTag: safeText(50).optional(),
  consentObtained: z.boolean().default(true),
});

export const FaqItemSchema = z.object({
  question: safeText(200),
  answer: safeText(800),
});

export const SeoSchema = z.object({
  metaTitle: safeText(60),
  metaDescription: safeText(160),
  canonicalUrl: z.string().url().max(300).optional(),
  keywords: z.array(safeText(50)).max(15).default([]),
});

export const ThemeEnum = z.enum(['green', 'teal']);
export type ThemeType = z.infer<typeof ThemeEnum>;

export const LangEnum = z.enum(['en', 'hi']);
export type LangType = z.infer<typeof LangEnum>;

export const PlanEnum = z.enum(['basic', 'growth']);
export type PlanType = z.infer<typeof PlanEnum>;

export const PagesConfigSchema = z
  .object({
    about: z.boolean().default(true),
    services: z.boolean().default(true),
    testimonials: z.boolean().default(true),
    contact: z.boolean().default(true),
  })
  .optional();

export const ContentSheetSchema = z.object({
  schemaVersion: z.enum(['1.0.0', '1.1.0']).default('1.0.0'),
  plan: PlanEnum.default('basic'),
  doctor: DoctorProfileSchema,
  clinic: ClinicInfoSchema,
  hours: z.array(ClinicHourSchema).min(1).max(7),
  services: z.array(ServiceItemSchema).min(1).max(9), // Enforced rule: <= 9 services
  reviews: z.array(ReviewItemSchema).max(6).default([]), // Enforced rule: <= 6 reviews
  faq: z.array(FaqItemSchema).max(8).default([]), // Enforced rule: <= 8 FAQs
  theme: ThemeEnum.default('green'),
  lang: LangEnum.default('en'),
  seo: SeoSchema,
  pages: PagesConfigSchema,
});

export type ContentSheet = z.infer<typeof ContentSheetSchema>;
export type DoctorProfile = z.infer<typeof DoctorProfileSchema>;
export type ClinicInfo = z.infer<typeof ClinicInfoSchema>;
export type ServiceItem = z.infer<typeof ServiceItemSchema>;
export type ReviewItem = z.infer<typeof ReviewItemSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type SeoConfig = z.infer<typeof SeoSchema>;
