'use client';

import React, { useState } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PlusIcon,
  Trash2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
} from '@/components/Icons';

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export type OperatingHours = Record<string, DaySchedule>;

export interface ClinicSettingsData {
  operatingHours: OperatingHours;
  slotIntervalMinutes: number;
  maxDailySlots: number;
  notificationEmails: string[];
  spamThreshold: number;
}

export interface OperatingHoursEditorProps {
  initialSettings: ClinicSettingsData;
  onSave: (settings: ClinicSettingsData) => Promise<void>;
}

const DAYS_OF_WEEK: Array<{ key: string; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function OperatingHoursEditor({ initialSettings, onSave }: OperatingHoursEditorProps) {
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(initialSettings.operatingHours);
  const [slotInterval, setSlotInterval] = useState<number>(initialSettings.slotIntervalMinutes || 30);
  const [maxSlots, setMaxSlots] = useState<number>(initialSettings.maxDailySlots || 40);
  const [notificationEmails, setNotificationEmails] = useState<string[]>(initialSettings.notificationEmails || []);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [spamThreshold, setSpamThreshold] = useState<number>(initialSettings.spamThreshold || 5);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDayChange = (dayKey: string, field: keyof DaySchedule, value: string | boolean) => {
    setOperatingHours((prev) => {
      const current = prev[dayKey] || { open: '09:00', close: '18:00', closed: false };
      return {
        ...prev,
        [dayKey]: {
          open: field === 'open' ? (value as string) : current.open,
          close: field === 'close' ? (value as string) : current.close,
          closed: field === 'closed' ? (value as boolean) : current.closed,
        },
      };
    });
  };

  const handleAddEmail = () => {
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed) return;

    if (notificationEmails.length >= 3) {
      setFeedback({ type: 'error', message: 'Maximum of 3 notification emails permitted.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (notificationEmails.includes(trimmed)) {
      setFeedback({ type: 'error', message: 'Email address already added.' });
      return;
    }

    setNotificationEmails([...notificationEmails, trimmed]);
    setNewEmailInput('');
    setFeedback(null);
  };

  const handleRemoveEmail = (indexToRemove: number) => {
    setNotificationEmails(notificationEmails.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await onSave({
        operatingHours,
        slotIntervalMinutes: Number(slotInterval),
        maxDailySlots: Number(maxSlots),
        notificationEmails,
        spamThreshold: Number(spamThreshold),
      });

      setFeedback({ type: 'success', message: 'Clinic settings and hours saved successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save clinic settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '860px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* 1. Operating Hours Schedule Card */}
      <div
        style={{
          background: 'var(--color-bg-base, #FFFFFF)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ClockIcon size={18} color="#0D5C46" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
            Weekly Operating Hours
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
          Configure clinic opening and closing times. Days marked as Closed will have slots blocked in the appointment scheduler.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const schedule = operatingHours[key] || { open: '09:00', close: '18:00', closed: false };
            return (
              <div
                key={key}
                data-testid={`day-row-${key}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: schedule.closed ? '#F8FAFC' : '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ width: '110px', fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>
                  {label}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      data-testid={`checkbox-closed-${key}`}
                      checked={schedule.closed}
                      onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                    />
                    <span style={{ color: schedule.closed ? '#B91C1C' : '#64748B', fontWeight: schedule.closed ? 700 : 500 }}>
                      Closed
                    </span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="time"
                      data-testid={`time-open-${key}`}
                      disabled={schedule.closed}
                      value={schedule.open}
                      onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        opacity: schedule.closed ? 0.4 : 1,
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>to</span>
                    <input
                      type="time"
                      data-testid={`time-close-${key}`}
                      disabled={schedule.closed}
                      value={schedule.close}
                      onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        opacity: schedule.closed ? 0.4 : 1,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Slot Interval & Daily Capacity Card */}
      <div
        style={{
          background: 'var(--color-bg-base, #FFFFFF)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <CalendarIcon size={18} color="#0D5C46" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
            Slot Duration & Capacity
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
          Determine how time slots are partitioned and daily booking limits.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label
              htmlFor="settings-slot-interval"
              style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}
            >
              Slot Interval (Minutes)
            </label>
            <select
              id="settings-slot-interval"
              data-testid="select-slot-interval"
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                outline: 'none',
              }}
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes (Standard)</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes (Comprehensive)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="settings-max-slots"
              style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}
            >
              Max Daily Slots per Doctor
            </label>
            <input
              id="settings-max-slots"
              data-testid="input-max-slots"
              type="number"
              min={1}
              max={120}
              value={maxSlots}
              onChange={(e) => setMaxSlots(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Notification Recipients Card */}
      <div
        style={{
          background: 'var(--color-bg-base, #FFFFFF)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
            Alert & Notification Recipients
          </h2>
          <span style={{ fontSize: '12px', fontWeight: 600, color: notificationEmails.length >= 3 ? '#DC2626' : '#64748B' }}>
            {notificationEmails.length} / 3 configured
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
          Emails configured here receive immediate alerts for new appointments and enquiries via Resend.
        </p>

        {/* Existing email pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {notificationEmails.map((email, idx) => (
            <div
              key={email}
              data-testid={`email-pill-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                color: '#1E293B',
              }}
            >
              <span>{email}</span>
              <button
                type="button"
                data-testid={`remove-email-${idx}`}
                aria-label={`Remove ${email}`}
                onClick={() => handleRemoveEmail(idx)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2Icon size={14} />
              </button>
            </div>
          ))}
          {notificationEmails.length === 0 && (
            <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
              No notification emails registered yet. Add up to 3 addresses below.
            </div>
          )}
        </div>

        {/* Add email input */}
        {notificationEmails.length < 3 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              data-testid="input-new-email"
              placeholder="e.g. clinic@doctorcare.in"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                outline: 'none',
              }}
            />
            <button
              type="button"
              data-testid="btn-add-email"
              onClick={handleAddEmail}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#0F172A',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <PlusIcon size={14} />
              Add
            </button>
          </div>
        )}
      </div>

      {/* 4. Spam Threshold Slider Card */}
      <div
        style={{
          background: 'var(--color-bg-base, #FFFFFF)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheckIcon size={18} color="#0D5C46" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Bot & Spam Sensitivity
            </h2>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D5C46' }}>
            Level {spamThreshold} / 10
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
          Adjust Turnstile verification sensitivity and time-trap tolerance (1 = Lenient, 10 = Maximum bot protection).
        </p>

        <input
          type="range"
          data-testid="slider-spam-threshold"
          min={1}
          max={10}
          value={spamThreshold}
          onChange={(e) => setSpamThreshold(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          data-testid="settings-feedback-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
          }}
        >
          {feedback.type === 'success' ? <CheckCircleIcon size={16} /> : <AlertCircleIcon size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="submit"
          data-testid="btn-save-settings"
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 24px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--color-brand-primary, #0D5C46)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
