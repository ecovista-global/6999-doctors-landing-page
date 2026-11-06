import { AppError } from './errors';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Allowed status transitions for Professional Clinic appointments (18 § 3 / MT-117)
 * - Pending -> Confirmed | Cancelled
 * - Confirmed -> Completed | Cancelled
 * - Cancelled -> Pending (reopen)
 * - Completed -> Terminal state (no further transitions)
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: ['pending'],
  completed: [],
};

/**
 * Validates whether a status transition is permitted.
 */
export function validateStatusTransition(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) {
    return true;
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus as AppointmentStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(toStatus as AppointmentStatus);
}

/**
 * Asserts that a status transition is valid, throwing 422 E-1603 if rejected.
 */
export function assertValidStatusTransition(fromStatus: string, toStatus: string): void {
  if (!validateStatusTransition(fromStatus, toStatus)) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus as AppointmentStatus];
    const allowedText = allowed && allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)';
    throw new AppError(
      'E-1603',
      `Invalid appointment status transition from '${fromStatus}' to '${toStatus}'. Allowed transitions: ${allowedText}`
    );
  }
}
