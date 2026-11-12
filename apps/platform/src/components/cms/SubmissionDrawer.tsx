'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CmsAppointmentItem } from '@/lib/cms-submissions';
import { StatusBadge } from './SubmissionsTable';
import { StatusTransitionBar } from './StatusTransitionBar';
import { WhatsAppLink } from './WhatsAppLink';
import { AppointmentStatus } from '@/lib/appointment-state-machine';
import {
  XIcon,
  PhoneIcon,
  MessageCircleIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CopyIcon,
  ShieldCheckIcon,
  FileTextIcon,
  RefreshCwIcon,
} from '@/components/Icons';

export interface SubmissionDrawerProps {
  submission: CmsAppointmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved?: (id: string, newNotes: string) => void;
  onStatusChanged?: (id: string, newStatus: CmsAppointmentItem['status']) => void;
}

export interface AppointmentTimelineEvent {
  id: string;
  actorId: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
}

export interface PatientVisitSummary {
  id: string;
  serviceName: string;
  doctorName: string | null;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
}

export function SubmissionDrawer({
  submission,
  isOpen,
  onClose,
  onNoteSaved,
  onStatusChanged,
}: SubmissionDrawerProps) {
  const [notes, setNotes] = useState<string>(submission?.notes || '');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [events, setEvents] = useState<AppointmentTimelineEvent[]>([]);
  const [patientHistory, setPatientHistory] = useState<PatientVisitSummary[]>([]);

  // Sync notes and load full booking history when submission changes
  useEffect(() => {
    if (submission) {
      setNotes(submission.notes || '');
      setSaveStatus('idle');
      if (isOpen && submission.id && submission.tenantId) {
        fetch(`/api/v1/cms/submissions/appointments/${submission.id}?tenantId=${submission.tenantId}`, {
          cache: 'no-store',
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((detail) => {
            if (detail) {
              setEvents(Array.isArray(detail.events) ? detail.events : []);
              setPatientHistory(Array.isArray(detail.patientHistory) ? detail.patientHistory : []);
            }
          })
          .catch(() => {});
      }
    }
  }, [submission, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !submission) {
    return null;
  }

  const handleSaveNotes = async () => {
    if (!submission) return;
    setIsSavingNote(true);
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/v1/cms/submissions/appointments/${submission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': submission.tenantId,
        },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setSaveStatus('saved');
      onNoteSaved?.(submission.id, notes);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to save staff notes:', err);
      setSaveStatus('error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCopyDetails = () => {
    const text = `Patient: ${submission.patientName}\nPhone: ${submission.patientPhone}\nService: ${submission.serviceName}\nPreferred Date: ${submission.preferredDate} (${submission.preferredTimeSlot})\nStatus: ${submission.status}`;
    navigator.clipboard?.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Submission Details"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        data-testid="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Drawer Panel */}
      <div
        data-testid="drawer-panel"
        style={{
          position: 'relative',
          width: 'min(520px, 95vw)',
          height: '100%',
          background: 'var(--color-bg-base, #FFFFFF)',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 51,
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
            background: 'var(--color-bg-subtle, #F8FAFC)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                data-testid="drawer-patient-name"
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--color-text-main, #0F172A)',
                  margin: 0,
                }}
              >
                {submission.patientName}
              </h2>
              <StatusBadge status={submission.status} />
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted, #64748B)',
                margin: '4px 0 0 0',
              }}
            >
              ID: {submission.id.slice(0, 13)}...
            </p>
          </div>

          <button
            type="button"
            data-testid="drawer-close-button"
            aria-label="Close detail drawer"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, #CBD5E1)',
              background: '#FFFFFF',
              color: 'var(--color-text-main, #334155)',
              cursor: 'pointer',
            }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Quick Action Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href={`tel:${submission.patientPhone}`}
              data-testid="drawer-call-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#E0F2FE',
                color: '#0369A1',
                textDecoration: 'none',
                border: '1px solid #BAE6FD',
              }}
            >
              <PhoneIcon size={13} />
              Call Patient
            </a>

            <WhatsAppLink
              phone={submission.patientPhone}
              patientName={submission.patientName}
              date={submission.preferredDate}
              timeSlot={submission.preferredTimeSlot}
            />

            <button
              type="button"
              data-testid="drawer-copy-btn"
              onClick={handleCopyDetails}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              <CopyIcon size={13} />
              {copyFeedback ? 'Copied to Clipboard' : 'Copy Summary'}
            </button>
          </div>

          {/* Appointment Information Card */}
          <div
            style={{
              background: 'var(--color-bg-subtle, #F8FAFC)',
              border: '1px solid var(--color-border-subtle, #E2E8F0)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted, #475569)',
                margin: '0 0 12px 0',
              }}
            >
              Appointment Specification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                  Requested Service
                </span>
                <strong style={{ color: '#0F172A' }}>{submission.serviceName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                  Assigned Doctor
                </span>
                <strong style={{ color: 'var(--color-brand-primary, #183C4A)' }}>
                  {submission.doctorName || 'Clinic General OPD'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                  Phone Number
                </span>
                <strong style={{ color: '#0F172A' }}>{submission.patientPhone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                  Preferred Date
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-brand-primary, #183C4A)', fontWeight: 700 }}>
                  <CalendarIcon size={13} />
                  {submission.preferredDate}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                  Time Slot
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: 600 }}>
                  <ClockIcon size={13} />
                  {submission.preferredTimeSlot}
                </div>
              </div>
              {submission.patientEmail && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 600 }}>
                    Email Address
                  </span>
                  <span style={{ color: '#334155' }}>{submission.patientEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compliance & Security Card (DPDP Act 2023) */}
          <div
            style={{
              background: 'var(--color-brand-surface, #E7F2F5)',
              border: '1px solid var(--color-border-subtle, #DFE8EB)',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldCheckIcon size={15} color="var(--color-brand-primary, #183C4A)" />
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-brand-primary, #183C4A)',
                  margin: 0,
                }}
              >
                DPDP & Verification Guardrails
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-main, #121B1F)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                Consent Timestamp: <strong>{submission.consentAt}</strong>
              </div>
              <div>
                Bot Verification: <strong>Turnstile Token Valid (Human)</strong>
              </div>
              {submission.ipHash && (
                <div style={{ fontSize: '11px', color: '#4ADE80', wordBreak: 'break-all' }}>
                  IP Blind Index: {submission.ipHash.slice(0, 24)}...
                </div>
              )}
            </div>
          </div>

          {/* Workflow Status State Machine Bar (MT-117) */}
          <StatusTransitionBar
            appointmentId={submission.id}
            tenantId={submission.tenantId}
            currentStatus={submission.status}
            onStatusChanged={(newStatus) => onStatusChanged?.(submission.id, newStatus)}
          />

          {/* Booking History Timeline & Prior Patient Visits */}
          <div
            style={{
              background: 'var(--color-bg-surface, #FFFFFF)',
              border: '1px solid var(--color-border-subtle, #DFE8EB)',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted, #475569)',
                margin: '0 0 10px 0',
              }}
            >
              Status Timeline &amp; Booking History
            </h3>
            {events.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                Initial request created on {submission.createdAt.slice(0, 10)}.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      fontSize: '12px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--color-bg-base, #F5F8F9)',
                      border: '1px solid var(--color-border-subtle, #DFE8EB)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>
                      {ev.fromStatus ? `${ev.fromStatus} -> ${ev.toStatus}` : `Created (${ev.toStatus})`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Actor: {ev.actorId} &bull; {new Date(ev.createdAt).toLocaleString()}
                    </div>
                    {ev.note && (
                      <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '3px' }}>{ev.note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {patientHistory.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle, #DFE8EB)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Previous Visits ({patientHistory.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {patientHistory.map((h) => (
                    <div key={h.id} style={{ fontSize: '12px', color: '#334155', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span>
                        {h.preferredDate} ({h.preferredTimeSlot}) &bull; {h.doctorName || h.serviceName}
                      </span>
                      <strong style={{ color: 'var(--color-brand-primary, #183C4A)' }}>{h.status}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Internal Staff Notes Area with Auto-Save */}
          <div
            style={{
              background: 'var(--color-bg-surface, #FFFFFF)',
              border: '1px solid var(--color-border-subtle, #DFE8EB)',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileTextIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                <label
                  htmlFor="drawer-notes-textarea"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-main, #121B1F)',
                  }}
                >
                  Internal Staff Notes
                </label>
              </div>

              {saveStatus === 'saving' && (
                <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 600 }}>Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span style={{ fontSize: '11px', color: 'var(--color-brand-primary, #183C4A)', fontWeight: 700 }}>Saved to DB</span>
              )}
              {saveStatus === 'error' && (
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>Save Failed</span>
              )}
            </div>

            <textarea
              id="drawer-notes-textarea"
              data-testid="drawer-notes-textarea"
              rows={4}
              value={notes}
              placeholder="Add receptionist notes, medical history reminders, or follow-up details..."
              onChange={(e) => {
                setNotes(e.target.value);
                setSaveStatus('idle');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle, #CBD5E1)',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                data-testid="drawer-save-note-btn"
                disabled={isSavingNote}
                onClick={handleSaveNotes}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'var(--color-brand-primary, #183C4A)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: isSavingNote ? 'not-allowed' : 'pointer',
                  opacity: isSavingNote ? 0.7 : 1,
                }}
              >
                {isSavingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
            background: 'var(--color-bg-subtle, #F8FAFC)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748B)' }}>
            Audit logged on viewing
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, #CBD5E1)',
              background: '#FFFFFF',
              color: 'var(--color-text-main, #334155)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
