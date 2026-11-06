'use client';

import React, { useState, useEffect } from 'react';
import { OperatingHoursEditor, ClinicSettingsData } from '@/components/cms/OperatingHoursEditor';

const DEFAULT_SETTINGS: ClinicSettingsData = {
  operatingHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '09:00', close: '14:00', closed: true },
  },
  slotIntervalMinutes: 30,
  maxDailySlots: 40,
  notificationEmails: [],
  spamThreshold: 5,
};

export default function ClinicSettingsPage() {
  const [settings, setSettings] = useState<ClinicSettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getTenantId = () => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000001';
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const tenantId = getTenantId();
        const res = await fetch(`/api/v1/cms/settings?tenantId=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error('Failed to load clinic settings:', err);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (updated: ClinicSettingsData) => {
    const tenantId = getTenantId();
    const res = await fetch(`/api/v1/cms/settings?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(updated),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.title || 'Failed to save settings');
    }

    const saved = await res.json();
    setSettings(saved);
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
        Loading Clinic Settings...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto 24px auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
          Clinic Settings & Operating Hours
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
          Manage weekly clinical timings, booking slot durations, notification email dispatches, and bot security thresholds.
        </p>
      </div>

      <OperatingHoursEditor
        initialSettings={settings || DEFAULT_SETTINGS}
        onSave={handleSave}
      />
    </div>
  );
}
