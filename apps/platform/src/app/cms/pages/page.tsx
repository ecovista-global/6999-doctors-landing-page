'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LockIcon,
  GlobeIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  Edit3Icon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from '@/components/Icons';
import {
  ALLOWED_PAGE_SLOTS,
  PAGE_SLOTS_METADATA,
  AllowedPageSlot,
  PageSlotDetail,
} from '@ecodigitech/content-schema';

interface SlotExtraInfo {
  features: string[];
  manageUrl: string;
  manageLabel: string;
  previewHash: string;
  routePath: string;
  metaTitle: string;
  metaDescription: string;
}

const SLOT_EXTRAS: Record<AllowedPageSlot, SlotExtraInfo> = {
  home: {
    features: ['Clinical Split Hero', 'Doctor Photo Cutout', 'Medical Badges', 'Clinic Hours Banner', 'Quick-Book CTA'],
    manageUrl: '/cms/editor',
    manageLabel: 'Edit in Site Editor',
    previewHash: '#hero',
    routePath: '/',
    metaTitle: 'Dr. Maanvita Kumari | Best General Physician in Sector 18 Noida',
    metaDescription: 'Consult Dr. Maanvita Kumari (MBBS, MD) at HealthConsult Family Clinic, Sector 18 Noida. Compassionate general medicine, diabetes & infection care.',
  },
  about: {
    features: ['Doctor Full Biography', 'Medical Council Reg (DMC/R/14298)', 'Alma Mater (MAMC)', '12+ Years Experience', 'Philosophy of Care'],
    manageUrl: '/cms/editor',
    manageLabel: 'Edit Doctor Profile',
    previewHash: '#about',
    routePath: '/about',
    metaTitle: 'About Dr. Maanvita Kumari | MBBS, MD (General Medicine) MAMC',
    metaDescription: 'Learn about Dr. Maanvita Kumari, senior physician at HealthConsult Clinic with 12+ years of clinical excellence in internal medicine and diabetology.',
  },
  services: {
    features: ['9 Comprehensive Clinical Services', 'Lucide Vector SVG Icons', 'Procedure Instructions', 'Consultation Fee Policy (₹600)', '7-Day Follow-up'],
    manageUrl: '/cms/editor',
    manageLabel: 'Manage Services',
    previewHash: '#services',
    routePath: '/services',
    metaTitle: 'Clinical Treatments & Services | HealthConsult Family Clinic',
    metaDescription: 'Expert care for Type-2 Diabetes, Hypertension, Seasonal Fevers, Thyroid, and Preventive Health Checks at Sector 18 Noida.',
  },
  doctors: {
    features: ['Specialist Clinical Roster', 'Consulting Days & Hours', 'Qualifications Display', 'Direct Booking Trigger', 'Mobile Responsive Cards'],
    manageUrl: '/cms/editor',
    manageLabel: 'Manage Specialists',
    previewHash: '#features',
    routePath: '/doctors',
    metaTitle: 'Specialist Doctors & Clinical Schedule | HealthConsult Clinic',
    metaDescription: 'Meet our consulting physicians and specialists. Check OPD timings and book priority consultations.',
  },
  'testimonials-faq': {
    features: ['Verified Patient Reviews', 'DPDP Act 2023 Consent Check', '5-Star Rating Selector', 'Searchable FAQ Accordion', 'Emergency Protocols'],
    manageUrl: '/cms/reviews-faqs',
    manageLabel: 'Manage FAQs & Reviews',
    previewHash: '#reviews',
    routePath: '/testimonials-faq',
    metaTitle: 'Patient Reviews & FAQs | HealthConsult Family Clinic',
    metaDescription: 'Read verified patient experiences and find answers to common questions about appointments, fees, and reports at HealthConsult Clinic.',
  },
  blog: {
    features: ['Patient Education Guides', 'Sanitized HTML Body', 'Categories & Read Time', 'Cover Images', 'Health Tips & Advisories'],
    manageUrl: '/cms/blog',
    manageLabel: 'Manage Blog Articles',
    previewHash: '#blog',
    routePath: '/blog',
    metaTitle: 'Health & Wellness Blog | Dr. Maanvita Kumari',
    metaDescription: 'Evidence-backed patient education articles on managing diabetes, seasonal fevers, and adult immunization in Delhi NCR.',
  },
  contact: {
    features: ['Interactive Booking Form', 'Cloudflare Turnstile Anti-Bot', 'Google Maps Facade', 'Emergency Hospital Notice', 'WhatsApp Direct Confirmation'],
    manageUrl: '/cms/settings',
    manageLabel: 'Configure Clinic Settings',
    previewHash: '#contact',
    routePath: '/contact',
    metaTitle: 'Contact & Book Appointment | HealthConsult Family Clinic Noida',
    metaDescription: 'Visit HealthConsult Clinic at Plot 14, Health Plaza, Sector 18 Noida. Book in-person or call +91 98765 43210.',
  },
};

export default function PageSlotsManager() {
  const [enabledPages, setEnabledPages] = useState<AllowedPageSlot[]>([...ALLOWED_PAGE_SLOTS]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});

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

  const toggleExpand = (slotId: string) => {
    setExpandedSlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
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

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1050px', margin: '0 auto' }}>
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

      {/* Page Slots List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {PAGE_SLOTS_METADATA.map((slot: PageSlotDetail) => {
          const isEnabled = enabledPages.includes(slot.id);
          const extra = SLOT_EXTRAS[slot.id];
          const isExpanded = !!expandedSlots[slot.id];

          return (
            <div
              key={slot.id}
              data-testid={`page-slot-card-${slot.id}`}
              style={{
                borderRadius: '12px',
                background: isEnabled ? '#FFFFFF' : '#F8FAFC',
                border: `1px solid ${isEnabled ? '#CBD5E1' : '#E2E8F0'}`,
                boxShadow: isEnabled ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none',
                opacity: isEnabled ? 1 : 0.65,
                transition: 'all 150ms ease',
                overflow: 'hidden',
              }}
            >
              {/* Top Card Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 22px',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>{slot.label}</strong>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        background: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: '#0D5C46',
                        fontWeight: 600,
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
                          padding: '2px 7px',
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
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {slot.description}
                  </p>

                  {/* Feature Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {extra.features.map((feat, fIdx) => (
                      <span
                        key={fIdx}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#F1F5F9',
                          color: '#475569',
                          fontWeight: 500,
                        }}
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions & Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isEnabled && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={extra.manageUrl}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#0D5C46',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <Edit3Icon size={13} />
                        <span>{extra.manageLabel}</span>
                      </Link>

                      <a
                        href={extra.routePath}
                        target="_blank"
                        rel="noreferrer"
                        title={`Preview live page (${extra.routePath})`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#0D5C46',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLinkIcon size={13} />
                        <span>Preview Page</span>
                      </a>
                    </div>
                  )}

                  {/* Toggle switch */}
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: slot.isCore ? 'not-allowed' : 'pointer',
                      paddingLeft: '6px',
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`toggle-page-${slot.id}`}
                      disabled={slot.isCore}
                      checked={isEnabled}
                      onChange={() => handleTogglePage(slot.id, slot.isCore)}
                      style={{ width: '18px', height: '18px', cursor: slot.isCore ? 'not-allowed' : 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isEnabled ? '#0D5C46' : '#94A3B8' }}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Bottom Accordion Bar for SEO Metadata */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  padding: '8px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(slot.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  <ChevronDownIcon size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                  <span>{isExpanded ? 'Hide SEO & Route Details' : 'View SEO & Route Details'}</span>
                </button>

                <span style={{ color: '#94A3B8', fontSize: '11px' }}>
                  Path: <code style={{ color: '#0F172A' }}>{slot.path}</code>
                </span>
              </div>

              {/* Expanded SEO details */}
              {isExpanded && (
                <div style={{ padding: '16px 22px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', fontSize: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#0F172A' }}>Meta Title:</strong>
                    <div style={{ color: '#475569', marginTop: '2px' }}>{extra.metaTitle}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#0F172A' }}>Meta Description:</strong>
                    <div style={{ color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>{extra.metaDescription}</div>
                  </div>
                </div>
              )}
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          {saving ? 'Updating Slots...' : 'Save Page Architecture'}
        </button>
      </div>
    </div>
  );
}
