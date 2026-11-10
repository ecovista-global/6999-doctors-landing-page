'use client';

import React, { useState, useEffect } from 'react';
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

  // Form State
  const [formData, setFormData] = useState({
    doctorName: 'Dr. Maanvita Kumari',
    degrees: 'MBBS, MD (General Medicine)',
    specialty: 'Consultant Physician & Diabetologist',
    experienceYears: 12,
    registrationNumber: 'DMC/R/14298',
    medicalCouncil: 'Delhi Medical Council',
    almaMater: 'Maulana Azad Medical College (MAMC), New Delhi',
    bio: 'Senior Consultant Physician with over 12 years of clinical excellence managing adult chronic diseases, complex glycemic disorders, and infectious illnesses across premier medical institutions in Delhi NCR.',
    clinicName: 'HealthConsult Family Clinic',
    tagline: 'Compassionate Primary Healthcare & Preventive Medicine',
    phone: '+919876543210',
    whatsapp: '+919876543210',
    email: 'contact@healthconsult.in',
    consultationFee: 600,
    followupDays: 7,
    street: 'Plot 14, Health Plaza, Central Market',
    area: 'Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    theme: 'green',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_site_content');
      if (saved) {
        try {
          setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch {}
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    setSaving(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_site_content', JSON.stringify(formData));
    }
    setTimeout(() => {
      setSaving(false);
      setPreviewKey((k) => k + 1);
      showToast('Draft content sheet saved.');
    }, 300);
  };

  const handlePublish = () => {
    setPublishing(true);
    handleSave();
    setTimeout(() => {
      setPublishing(false);
      showToast('Site published successfully to Cloudflare edge.');
    }, 600);
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
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Site Block Editor
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0D5C46',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
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
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: '6px',
                  background: activeSection === tab.id ? '#FFFFFF' : 'transparent',
                  color: activeSection === tab.id ? '#0D5C46' : '#64748B',
                  fontWeight: activeSection === tab.id ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: activeSection === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
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
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setViewport('100%')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewport === '100%' ? '#FFFFFF' : 'transparent',
                  color: viewport === '100%' ? '#0D5C46' : '#64748B',
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
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewport === '768px' ? '#FFFFFF' : 'transparent',
                  color: viewport === '768px' ? '#0D5C46' : '#64748B',
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
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewport === '360px' ? '#FFFFFF' : 'transparent',
                  color: viewport === '360px' ? '#0D5C46' : '#64748B',
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
              style={{
                background: 'transparent',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCwIcon size={12} />
              <span>Reload Preview</span>
            </button>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#0D5C46',
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
              borderRadius: viewport === '100%' ? '0' : '12px',
              boxShadow: viewport === '100%' ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid #E2E8F0',
            }}
          >
            <iframe
              key={previewKey}
              src="http://localhost:5173"
              title="Public Site Live Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0D5C46', color: '#FFFFFF', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 200, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
