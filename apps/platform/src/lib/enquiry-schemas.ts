import { z } from 'zod';

// ==============================================================================
// Zod Validation Schema for Public Clinic Enquiries (F-04 / DPDP Act)
// ==============================================================================
export const enquirySubmissionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  clinicSlug: z.string().min(1).optional(),
  name: z
    .string({ required_error: 'Patient name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(
      /^(?:\+?91[\s\-]?)?(?:0)?[6-9]\d{4}[\s\-]?[0-9]{5}$/,
      'Please enter a valid 10-digit Indian phone number (+91)'
    ),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  service: z.string().max(100).optional(),
  message: z
    .string({ required_error: 'Message is required' })
    .min(5, 'Message must be at least 5 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Patient consent is mandatory under India DPDP Act 2023' }),
  }),
  turnstileToken: z.string().optional(),
});

export type EnquirySubmissionInput = z.infer<typeof enquirySubmissionSchema>;
