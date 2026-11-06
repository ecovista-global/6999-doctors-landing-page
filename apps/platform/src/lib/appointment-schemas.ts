import { z } from 'zod';

// ==============================================================================
// Zod Validation Schema for Public Appointment Submissions (F-04 / DPDP Act)
// ==============================================================================
export const appointmentSubmissionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  clinicSlug: z.string().min(1).optional(),
  patientName: z
    .string({ required_error: 'Patient name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  patientPhone: z
    .string({ required_error: 'Phone number is required' })
    .regex(
      /^(?:\+?91[\s\-]?)?(?:0)?[6-9]\d{4}[\s\-]?[0-9]{5}$/,
      'Please enter a valid 10-digit Indian phone number (+91)'
    ),
  patientEmail: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  serviceName: z
    .string({ required_error: 'Service name is required' })
    .min(2, 'Service name must be at least 2 characters')
    .max(100),
  preferredDate: z
    .string({ required_error: 'Preferred date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Preferred date must be in YYYY-MM-DD format'),
  preferredTimeSlot: z
    .string({ required_error: 'Preferred time slot is required' })
    .min(2, 'Time slot is required')
    .max(50),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Patient consent is mandatory under India DPDP Act 2023' }),
  }),
  turnstileToken: z.string().optional(),
  honeypot: z.string().optional(),
  formRenderedAt: z.union([z.number(), z.string()]).optional(),
});

export type AppointmentSubmissionInput = z.infer<typeof appointmentSubmissionSchema>;

