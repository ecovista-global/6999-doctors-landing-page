'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { DoctorContent } from '@/lib/contentStore';
import { FALLBACK_CONTENT } from '@/lib/useClinicContent';
import {
  FileTextIcon,
  MonitorIcon,
  TabletIcon,
  SmartphoneIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  GlobeIcon,
  ShieldCheckIcon,
} from '@/components/Icons';

export default function SiteBlockEditorPage() {
  const [viewport, setViewport] = useState<'100%' | '768px' | '360px'>('100%');
  const [activeSection, setActiveSection] = useState<'doctor' | 'clinic' | 'services' | 'theme'>('doctor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(1);
  const baseContentRef = useRef<DoctorContent>(FALLBACK_CONTENT);

  // Form State (hydrated from /api/content on mount)
  const [formData, setFormData] = useState({
    doctorName: FALLBACK_CONTENT.doctor.name,
    degrees: FALLBACK_CONTENT.doctor.degree,
    specialty: FALLBACK_CONTENT.doctor.specialty,
    experienceYears: FALLBACK_CONTENT.doctor.experienceYears,
    registrationNumber: FALLBACK_CONTENT.doctor.registrationNumber,
    medicalCouncil: FALLBACK_CONTENT.doctor.medicalCouncil,
    almaMater: FALLBACK_CONTENT.doctor.college,
    bio: FALLBACK_CONTENT.doctor.bio,
    clinicName: FALLBACK_CONTENT.clinic.name,
    tagline: FALLBACK_CONTENT.clinic.tagline,
    phone: FALLBACK_CONTENT.doctor.phone,
    whatsapp: FALLBACK_CONTENT.doctor.whatsappNumber,
    email: FALLBACK_CONTENT.doctor.email,
    consultationFee: FALLBACK_CONTENT.doctor.consultationFee,
    followupDays: 7,
    street: FALLBACK_CONTENT.clinic.street,
    area: FALLBACK_CONTENT.clinic.area,
    city: FALLBACK_CONTENT.clinic.city,
    state: FALLBACK_CONTENT.clinic.state,
    pincode: FALLBACK_CONTENT.clinic.pincode,
    theme: 'green',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/content', { cache: 'no-store' });
        if (res.ok && active) {
          const live: DoctorContent = await res.json();
          baseContentRef.current = live;
          setFormData((prev) => ({
            ...prev,
            doctorName: live.doctor?.name || prev.doctorName,
            degrees: live.doctor?.degree || prev.degrees,
            specialty: live.doctor?.specialty || prev.specialty,
            experienceYears: live.doctor?.experienceYears ?? prev.experienceYears,
            registrationNumber: live.doctor?.registrationNumber || prev.registrationNumber,
            medicalCouncil: live.doctor?.medicalCouncil || prev.medicalCouncil,
            almaMater: live.doctor?.college || prev.almaMater,
            bio: live.doctor?.bio || prev.bio,
            clinicName: live.clinic?.name || prev.clinicName,
            tagline: live.clinic?.tagline || prev.tagline,
            phone: live.doctor?.phone || prev.phone,
            whatsapp: live.doctor?.whatsappNumber || prev.whatsapp,
            email: live.doctor?.email || prev.email,
            consultationFee: live.doctor?.consultationFee ?? prev.consultationFee,
            street: live.clinic?.street || prev.street,
            area: live.clinic?.area || prev.area,
            city: live.clinic?.city || prev.city,
            state: live.clinic?.state || prev.state,
            pincode: live.clinic?.pincode || prev.pincode,
            theme: live.theme === 'Teal Poster' ? 'teal' : 'green',
          }));
        }
      } catch {
        // Fallback to local snapshot if network unavailable
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const buildMergedContent = (): DoctorContent => {
    const base = baseContentRef.current;
    return {
      ...base,
      theme: formData.theme === 'teal' ? 'Teal Poster' : 'Green Trust',
      doctor: {
        ...base.doctor,
        name: formData.doctorName,
        degree: formData.degrees,
        specialty: formData.specialty,
        experienceYears: Number(formData.experienceYears) || base.doctor.experienceYears,
        registrationNumber: formData.registrationNumber,
        medicalCouncil: formData.medicalCouncil,
        college: formData.almaMater,
        bio: formData.bio,
        phone: formData.phone,
        whatsappNumber: formData.whatsapp,
        email: formData.email,
        consultationFee: Number(formData.consultationFee) || base.doctor.consultationFee,
      },
      clinic: {
        ...base.clinic,
        name: formData.clinicName,
        tagline: formData.tagline,
        street: formData.street,
        area: formData.area,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        feePolicy: `Standard OPD consultation fee is ₹${Number(formData.consultationFee) || 600}. Includes complimentary follow-up within ${Number(formData.followupDays) || 7} days.`,
      },
    };
  };

  const handleSave = async () => {
    setSaving(true);
    const merged = buildMergedContent();
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_site_content', JSON.stringify(formData));
    }
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to save draft');
      if (json.content) baseContentRef.current = json.content;
      setPreviewKey((k) => k + 1);
      showToast('Site changes saved & synced to live preview.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    const merged = buildMergedContent();
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_site_content', JSON.stringify(formData));
    }
    try {
      const contentRes = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!contentRes.ok) {
        const errJson = await contentRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to sync live site content');
      }
      const contentData = await contentRes.json().catch(() => ({}));
      if (contentData.content) baseContentRef.current = contentData.content;

      const res = await fetch('/api/v1/sites/00000000-0000-0000-0000-000000000001/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: merged,
          theme: formData.theme,
          notes: `Published block editor updates for ${formData.clinicName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || 'Publish failed');
      setPreviewKey((k) => k + 1);
      showToast(`Published release v${data.version} to live site.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to publish site changes.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 68px)', overflow: 'hidden' }}>
      {/* Left Editing Sidebar */}
      <div
        style={{
          width: '450px',
          minWidth: '450px',
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Editor Title & Section Tabs */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>
              Site Block <span className="ms-serif-italic" style={{ fontSize: '21px' }}>editor</span>
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="ms-pill-light"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="ms-pill-dark"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', padding: '3px', borderRadius: '9999px' }}>
            {[
              { id: 'doctor', label: 'Doctor Profile' },
              { id: 'clinic', label: 'Clinic & Fees' },
              { id: 'theme', label: 'Color Theme' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '9999px',
                  background: activeSection === tab.id ? '#183C4A' : 'transparent',
                  color: activeSection === tab.id ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontWeight: activeSection === tab.id ? 600 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Fields Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeSection === 'doctor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Medical Degrees & Accreditations
                </label>
                <input
                  type="text"
                  value={formData.degrees}
                  onChange={(e) => setFormData({ ...formData, degrees: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Clinical Specialty / Title
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Council Reg. Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Experience Years
                  </label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Medical Council / State
                </label>
                <input
                  type="text"
                  value={formData.medicalCouncil}
                  onChange={(e) => setFormData({ ...formData, medicalCouncil: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Doctor Full Biography
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.4, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {activeSection === 'clinic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Clinic Practice Name
                </label>
                <input
                  type="text"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Free Follow-up Days
                  </label>
                  <input
                    type="number"
                    value={formData.followupDays}
                    onChange={(e) => setFormData({ ...formData, followupDays: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Clinic Address (Street / Plaza)
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Area / Sector
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Select the primary visual direction for your clinical web presence.
              </p>
              <div
                onClick={() => setFormData({ ...formData, theme: 'green' })}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `2px solid ${formData.theme === 'green' ? '#0D5C46' : '#E2E8F0'}`,
                  background: formData.theme === 'green' ? '#E6F4F1' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0D5C46' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Reference 1: Clinical Emerald Green</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 26px' }}>
                  Calm clinical emerald inspiring confidence, hygiene, and trusted primary care.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, theme: 'teal' })}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `2px solid ${formData.theme === 'teal' ? '#0284C7' : '#E2E8F0'}`,
                  background: formData.theme === 'teal' ? '#E0F2FE' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0284C7' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Reference 2: Clinical Ocean Teal</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 26px' }}>
                  Modern diagnostic sky-teal optimal for pediatric, diagnostic, and pulmonology clinics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Multi-Viewport Live Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F1F5F9', overflow: 'hidden' }}>
        {/* Preview Top Bar */}
        <div
          style={{
            height: '48px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Preview Device:</span>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', padding: '3px', borderRadius: '9999px' }}>
              <button
                type="button"
                onClick={() => setViewport('100%')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: viewport === '100%' ? '#183C4A' : 'transparent',
                  color: viewport === '100%' ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <MonitorIcon size={13} />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport('768px')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: viewport === '768px' ? '#183C4A' : 'transparent',
                  color: viewport === '768px' ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TabletIcon size={13} />
                <span>Tablet (768px)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport('360px')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: viewport === '360px' ? '#183C4A' : 'transparent',
                  color: viewport === '360px' ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <SmartphoneIcon size={13} />
                <span>Mobile (360px)</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="ms-pill-light"
              style={{
                padding: '5px 10px',
                fontSize: '11px',
              }}
            >
              <RefreshCwIcon size={12} />
              <span>Reload Preview</span>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-brand-primary, #183C4A)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
              }}
            >
              <span>Open in New Tab</span>
              <ExternalLinkIcon size={13} />
            </a>
          </div>
        </div>

        {/* Iframe Viewport Frame */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', overflow: 'hidden' }}>
          <div
            style={{
              width: viewport,
              height: '100%',
              background: '#FFFFFF',
              borderRadius: viewport === '100%' ? '12px' : '18px',
              boxShadow: viewport === '100%' ? 'none' : '0 18px 36px -12px rgba(24, 60, 74, 0.16)',
              overflow: 'hidden',
              transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <iframe
              key={previewKey}
              src="/"
              title="Public Site Live Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#183C4A', color: '#FFFFFF', padding: '12px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, boxShadow: '0 10px 24px rgba(24,60,74,0.28)', zIndex: 200, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
