'use client';

import React, { useState, useEffect } from 'react';
import {
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LockIcon,
  GlobeIcon,
  RefreshCwIcon,
} from '@/components/Icons';
import {
  ALLOWED_PAGE_SLOTS,
  PAGE_SLOTS_METADATA,
  AllowedPageSlot,
  PageSlotDetail,
} from '@ecodigitech/content-schema';

export default function PageSlotsManager() {
  const [enabledPages, setEnabledPages] = useState<AllowedPageSlot[]>([...ALLOWED_PAGE_SLOTS]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getTenantId = () => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000001';
  };

  useEffect(() => {
    async function loadPages() {
      try {
        const tenantId = getTenantId();
        const res = await fetch(`/api/v1/cms/pages?tenantId=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.enabledPages) {
            setEnabledPages(data.enabledPages);
          }
        }
      } catch (err) {
        console.error('Failed to load page slots:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, []);

  const handleTogglePage = (slotId: AllowedPageSlot, isCore: boolean) => {
    if (isCore) {
      // Core pages cannot be disabled
      return;
    }

    setFeedback(null);
    if (enabledPages.includes(slotId)) {
      setEnabledPages(enabledPages.filter((id) => id !== slotId));
    } else {
      if (enabledPages.length >= 7) {
        setFeedback({
          type: 'error',
          message: 'Page limit reached: maximum 7 page slots permitted on the Professional Clinic plan (E-1601).',
        });
        return;
      }
      setEnabledPages([...enabledPages, slotId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const tenantId = getTenantId();
      const res = await fetch(`/api/v1/cms/pages?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ enabledPages }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.title || `Save failed (${res.status})`);
      }

      setFeedback({
        type: 'success',
        message: 'Page architecture and enabled slots updated successfully.',
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save page slots.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
        Loading Page Slots Manager...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Page Slots Manager (7-Page Architecture)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Configure active website pages for the Professional Clinic plan. Exactly up to 7 distinct pages are supported.
          </p>
        </div>

        {/* Counter Badge */}
        <div
          data-testid="page-count-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: enabledPages.length === 7 ? '#CCFBF1' : '#F1F5F9',
            border: `1px solid ${enabledPages.length === 7 ? '#99F6E4' : '#CBD5E1'}`,
            fontSize: '13px',
            fontWeight: 700,
            color: enabledPages.length === 7 ? '#0D9488' : '#334155',
          }}
        >
          <FileTextIcon size={15} />
          <span>{enabledPages.length} / 7 Pages Active</span>
        </div>
      </div>

      {/* Page Slots Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {PAGE_SLOTS_METADATA.map((slot: PageSlotDetail) => {
          const isEnabled = enabledPages.includes(slot.id);
          return (
            <div
              key={slot.id}
              data-testid={`page-slot-card-${slot.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '8px',
                background: isEnabled ? '#FFFFFF' : '#F8FAFC',
                border: `1px solid ${isEnabled ? '#CBD5E1' : '#E2E8F0'}`,
                boxShadow: isEnabled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
                opacity: isEnabled ? 1 : 0.6,
                transition: 'all 150ms ease',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>{slot.label}</strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      background: '#F1F5F9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#475569',
                    }}
                  >
                    {slot.path}
                  </span>
                  {slot.isCore && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                      }}
                    >
                      <LockIcon size={10} />
                      Required Core
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{slot.description}</p>
              </div>

              {/* Toggle switch */}
              <div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: slot.isCore ? 'not-allowed' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid={`toggle-page-${slot.id}`}
                    disabled={slot.isCore}
                    checked={isEnabled}
                    onChange={() => handleTogglePage(slot.id, slot.isCore)}
                    style={{ width: '16px', height: '16px', cursor: slot.isCore ? 'not-allowed' : 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isEnabled ? '#0D5C46' : '#94A3B8' }}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          data-testid="page-slots-feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '20px',
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
          type="button"
          data-testid="btn-save-pages"
          disabled={saving}
          onClick={handleSave}
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
          {saving ? 'Updating Slots...' : 'Save Page Architecture'}
        </button>
      </div>
    </div>
  );
}
