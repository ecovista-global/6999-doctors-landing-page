'use client';

import React, { useState } from 'react';
import { AppointmentStatus, ALLOWED_STATUS_TRANSITIONS } from '@/lib/appointment-state-machine';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from '@/components/Icons';

export interface StatusTransitionBarProps {
  appointmentId: string;
  tenantId: string;
  currentStatus: AppointmentStatus;
  onStatusChanged: (newStatus: AppointmentStatus) => void;
  disabled?: boolean;
}

export function StatusTransitionBar({
  appointmentId,
  tenantId,
  currentStatus,
  onStatusChanged,
  disabled = false,
}: StatusTransitionBarProps) {
  const [loadingStatus, setLoadingStatus] = useState<AppointmentStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);

  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  const handleTransition = async (targetStatus: AppointmentStatus, note?: string) => {
    setLoadingStatus(targetStatus);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/cms/submissions/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          status: targetStatus,
          notes: note || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.title || `Status update failed (${res.status})`);
      }

      onStatusChanged(targetStatus);
      setShowCancelPrompt(false);
      setCancellationReason('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change status');
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div
      className="cms-status-transition-bar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'var(--color-bg-subtle, #F8FAFC)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
            Workflow Stage
          </span>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>
            Current: {currentStatus}
          </div>
        </div>

        {/* Action Buttons based on allowed transitions */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {currentStatus === 'pending' && (
            <>
              <button
                type="button"
                data-testid="btn-transition-confirmed"
                disabled={disabled || loadingStatus !== null}
                onClick={() => handleTransition('confirmed')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #99F6E4',
                  background: '#0D9488',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: disabled || loadingStatus !== null ? 'not-allowed' : 'pointer',
                  opacity: loadingStatus !== null ? 0.7 : 1,
                }}
              >
                <CheckCircleIcon size={14} />
                {loadingStatus === 'confirmed' ? 'Confirming...' : 'Confirm Appointment'}
              </button>

              <button
                type="button"
                data-testid="btn-open-cancel"
                disabled={disabled || loadingStatus !== null}
                onClick={() => setShowCancelPrompt(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#4B5563',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: disabled || loadingStatus !== null ? 'not-allowed' : 'pointer',
                }}
              >
                <XCircleIcon size={14} />
                Cancel Slot
              </button>
            </>
          )}

          {currentStatus === 'confirmed' && (
            <>
              <button
                type="button"
                data-testid="btn-transition-completed"
                disabled={disabled || loadingStatus !== null}
                onClick={() => handleTransition('completed')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-brand-primary, #183C4A)',
                  background: 'var(--color-brand-primary, #183C4A)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: disabled || loadingStatus !== null ? 'not-allowed' : 'pointer',
                  opacity: loadingStatus !== null ? 0.7 : 1,
                }}
              >
                <CheckCircleIcon size={14} />
                {loadingStatus === 'completed' ? 'Completing...' : 'Mark Completed'}
              </button>

              <button
                type="button"
                data-testid="btn-open-cancel"
                disabled={disabled || loadingStatus !== null}
                onClick={() => setShowCancelPrompt(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#4B5563',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: disabled || loadingStatus !== null ? 'not-allowed' : 'pointer',
                }}
              >
                <XCircleIcon size={14} />
                Cancel / No-Show
              </button>
            </>
          )}

          {currentStatus === 'cancelled' && (
            <button
              type="button"
              data-testid="btn-transition-pending"
              disabled={disabled || loadingStatus !== null}
              onClick={() => handleTransition('pending', 'Reopened from cancelled')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #FDE68A',
                background: '#FEF3C7',
                color: '#B45309',
                fontWeight: 600,
                fontSize: '12px',
                cursor: disabled || loadingStatus !== null ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCwIcon size={13} />
              {loadingStatus === 'pending' ? 'Reopening...' : 'Reopen to Pending'}
            </button>
          )}

          {currentStatus === 'completed' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-brand-primary, #183C4A)',
                background: 'var(--color-brand-surface, #E7F2F5)',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid #A7F3D0',
              }}
            >
              <CheckCircleIcon size={14} />
              Finalized (Completed)
            </span>
          )}
        </div>
      </div>

      {/* Cancellation Prompt Modal / Card */}
      {showCancelPrompt && (
        <div
          data-testid="cancel-prompt-box"
          style={{
            marginTop: '8px',
            padding: '12px',
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label
            htmlFor="cancel-reason-input"
            style={{ fontSize: '12px', fontWeight: 700, color: '#9F1239' }}
          >
            Reason for Cancellation:
          </label>
          <input
            id="cancel-reason-input"
            data-testid="cancel-reason-input"
            type="text"
            placeholder="e.g. Patient requested reschedule, doctor unavailable..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid #FDA4AF',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCancelPrompt(false)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              type="button"
              data-testid="btn-confirm-cancel"
              onClick={() => handleTransition('cancelled', cancellationReason || 'Cancelled by staff')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: '#E11D48',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      )}

      {/* Error feedback */}
      {errorMessage && (
        <div
          data-testid="transition-error-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '6px',
            background: '#FEF2F2',
            border: '1px solid #F87171',
            color: '#B91C1C',
            fontSize: '12px',
          }}
        >
          <AlertCircleIcon size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
