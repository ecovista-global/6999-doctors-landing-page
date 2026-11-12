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
  PREMIUM_ALLOWED_PAGE_SLOTS,
  PAGE_SLOTS_METADATA,
  PREMIUM_PAGE_SLOTS_METADATA,
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

const SLOT_EXTRAS: Record<string, SlotExtraInfo> = {
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
    features: ['Multi-Doctor Directory', 'Consulting Days & Hours', 'Department Filtering', 'Direct Doctor Booking', 'Mobile Responsive Cards'],
    manageUrl: '/cms/doctors',
    manageLabel: 'Manage Doctors',
    previewHash: '#features',
    routePath: '/doctors',
    metaTitle: 'Specialist Doctors & Clinical Schedule | HealthConsult Clinic',
    metaDescription: 'Meet our consulting physicians and specialists. Check OPD timings and book priority consultations.',
  },
  specialties: {
    features: ['3 Clinical Departments', 'Linked Specialist Cards', 'Chronic Care Pathways', 'Direct Specialty Booking'],
    manageUrl: '/cms/doctors',
    manageLabel: 'Link Specialists',
    previewHash: '#specialties',
    routePath: '/specialties',
    metaTitle: 'Medical Specialties & Departments | HealthConsult Clinic',
    metaDescription: 'Explore Internal Medicine, Family Pediatrics, and Clinical Nutrition departments with specialist routing.',
  },
  facilities: {
    features: ['In-House Sample Collection', 'Digital ECG & Diagnostics', '2-8C Cold-Chain Vaccines', 'Barrier-Free Access'],
    manageUrl: '/cms/editor',
    manageLabel: 'Edit Facilities Info',
    previewHash: '#facilities',
    routePath: '/facilities',
    metaTitle: 'Clinic Facilities & Diagnostic Lab | HealthConsult Clinic',
    metaDescription: 'Point-of-care diagnostics, ECG, cold-chain vaccination suite, and outpatient observation facilities in Sector 18 Noida.',
  },
  'health-packages': {
    features: ['4 Preventive Check Panels', 'Transparent Package Pricing', 'Home Sample Option', '1-Click Package Booking'],
    manageUrl: '/cms/editor',
    manageLabel: 'Edit Checkup Panels',
    previewHash: '#health-packages',
    routePath: '/health-packages',
    metaTitle: 'Preventive Health Packages | HealthConsult Clinic',
    metaDescription: 'Comprehensive Diabetes, Cardiac, Senior Citizen, and Annual Preventive Health Screening packages with physician review.',
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
  const [enabledPages, setEnabledPages] = useState<string[]>([...PREMIUM_ALLOWED_PAGE_SLOTS]);
  const [sitePlan, setSitePlan] = useState<'professional' | 'premium'>('premium');
  const [maxAllowedPages, setMaxAllowedPages] = useState<number>(10);
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
          if (data.plan === 'professional' || data.plan === 'premium') {
            setSitePlan(data.plan);
          }
          if (typeof data.maxAllowedPages === 'number') {
            setMaxAllowedPages(data.maxAllowedPages);
          }
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

  const handleTogglePage = (slotId: string, isCore: boolean) => {
    if (isCore) {
      // Core pages cannot be disabled
      return;
    }

    setFeedback(null);
    if (enabledPages.includes(slotId)) {
      setEnabledPages(enabledPages.filter((id) => id !== slotId));
    } else {
      if (enabledPages.length >= maxAllowedPages) {
        setFeedback({
          type: 'error',
          message: `Page limit reached: maximum ${maxAllowedPages} page slots permitted on your current plan (E-1601).`,
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
          <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-text-main, #162228)', margin: '0 0 6px 0' }}>
            Page Slots Manager <span className="ms-serif-italic" style={{ fontSize: '30px', fontWeight: 400 }}>({maxAllowedPages}-page architecture)</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted, #54666E)', margin: 0 }}>
            Configure active website pages for the {sitePlan === 'premium' ? 'Premium Clinic' : 'Professional Clinic'} plan. Up to {maxAllowedPages} responsive pages are supported.
          </p>
        </div>

        {/* Counter Badge */}
        <div
          data-testid="page-count-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '9999px',
            background: enabledPages.length >= maxAllowedPages ? 'var(--color-brand-surface, #E7F2F5)' : 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '13px',
            fontWeight: 700,
            color: enabledPages.length >= maxAllowedPages ? 'var(--color-brand-primary, #183C4A)' : 'var(--color-text-muted)',
          }}
        >
          <FileTextIcon size={15} />
          <span>{enabledPages.length} / {maxAllowedPages} Pages Active</span>
        </div>
      </div>

      {/* Page Slots List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {(maxAllowedPages >= 10 ? PREMIUM_PAGE_SLOTS_METADATA : PAGE_SLOTS_METADATA).map((slot: PageSlotDetail) => {
          const isEnabled = enabledPages.includes(slot.id);
          const extra = (SLOT_EXTRAS[slot.id] ?? SLOT_EXTRAS.home)!;
          const isExpanded = !!expandedSlots[slot.id];

          return (
            <div
              key={slot.id}
              data-testid={`page-slot-card-${slot.id}`}
              className="ms-card"
              style={{
                borderRadius: '20px',
                padding: 0,
                background: isEnabled ? 'var(--color-bg-base)' : 'var(--color-bg-surface)',
                border: `1px solid ${isEnabled ? 'var(--color-border-strong)' : 'var(--color-border-subtle)'}`,
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
                  padding: '20px 24px',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '15.5px', color: 'var(--color-text-main)' }}>{slot.label}</strong>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        background: 'var(--color-brand-surface, #E7F2F5)',
                        padding: '2px 9px',
                        borderRadius: '9999px',
                        color: 'var(--color-brand-primary, #183C4A)',
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
                          padding: '2px 8px',
                          borderRadius: '9999px',
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
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                    {slot.description}
                  </p>

                  {/* Feature Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {extra.features.map((feat, fIdx) => (
                      <span
                        key={fIdx}
                        style={{
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          background: 'var(--color-bg-surface)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid var(--color-border-subtle)',
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
                        className="ms-pill-light"
                        style={{
                          padding: '7px 14px',
                          color: 'var(--color-brand-primary, #183C4A)',
                          fontSize: '12px',
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
                        className="ms-pill-light"
                        style={{
                          padding: '7px 14px',
                          color: 'var(--color-brand-primary, #183C4A)',
                          fontSize: '12px',
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
                      style={{ width: '18px', height: '18px', accentColor: '#183C4A', cursor: slot.isCore ? 'not-allowed' : 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isEnabled ? 'var(--color-brand-primary, #183C4A)' : 'var(--color-text-muted)' }}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Bottom Accordion Bar for SEO Metadata */}
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  borderTop: '1px solid var(--color-border-subtle)',
                  padding: '10px 24px',
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
          className="ms-pill-dark"
          style={{
            padding: '10px 24px',
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
