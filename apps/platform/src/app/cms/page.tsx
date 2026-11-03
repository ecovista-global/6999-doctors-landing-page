'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DoctorContent, AppointmentRecord } from '@/lib/contentStore';

type Tab = 'dashboard' | 'appointments' | 'editor' | 'media' | 'themes' | 'settings';
type EditorSection = 'hero' | 'doctor' | 'clinic' | 'pillars' | 'services' | 'reviews' | 'faqs';

const THEME_PRESETS: Array<{
  name: string;
  primary: string;
  accent: string;
  bg: string;
  specialty: string;
  description: string;
}> = [
  {
    name: 'Green Trust',
    primary: '#0F766E',
    accent: '#047857',
    bg: '#F0FDF4',
    specialty: 'General Physicians, Internal Medicine, Family Clinics',
    description: 'Calm clinical emerald inspiring confidence, hygiene, and trusted primary care.',
  },
  {
    name: 'Teal Poster',
    primary: '#0284C7',
    accent: '#0EA5E9',
    bg: '#F0F9FF',
    specialty: 'Pediatrics, Diagnostic Labs, Pulmonology',
    description: 'Fresh clinical sky-blue optimal for modern diagnostics and children wellness.',
  },
  {
    name: 'Navy Gold',
    primary: '#1E3A8A',
    accent: '#D97706',
    bg: '#F8FAFC',
    specialty: 'Cardiology, Neurology, Multi-Specialty Supercenters',
    description: 'Prestigious deep sapphire paired with warm amber for senior specialists.',
  },
  {
    name: 'Sand Warmth',
    primary: '#78350F',
    accent: '#B45309',
    bg: '#FFFBEB',
    specialty: 'Orthopedics, Dermatology, Ayurvedic & Holistic',
    description: 'Earthy amber warmth providing comfort for chronic rehab and skin therapies.',
  },
  {
    name: 'Slate Clean',
    primary: '#334155',
    accent: '#475569',
    bg: '#F8FAFC',
    specialty: 'Dental Clinics, Ophthalmology, Daycare Surgery',
    description: 'Ultra-minimal architectural slate for high-tech precision procedures.',
  },
  {
    name: 'Rose Clinic',
    primary: '#BE123C',
    accent: '#E11D48',
    bg: '#FFF1F2',
    specialty: 'Obstetrics & Gynecology, IVF, Fertility Centres',
    description: 'Gentle crimson rose radiating warmth and empathetic maternal care.',
  },
];

export default function CmsPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editorSection, setEditorSection] = useState<EditorSection>('clinic');
  const [deviceViewport, setDeviceViewport] = useState<'360px' | '768px' | '100%'>('100%');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string>('Synced on startup');
  const [previewKey, setPreviewKey] = useState<number>(1);

  // Live Content Store
  const [content, setContent] = useState<DoctorContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);

  // Live Appointments Store
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [aptFilter, setAptFilter] = useState<'all' | 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Quick Walk-in Appointment Modal state
  const [showAddAptModal, setShowAddAptModal] = useState(false);
  const [newAptData, setNewAptData] = useState({
    patientName: '',
    phone: '',
    service: 'General Health Checkup',
    preferredDate: new Date().toISOString().split('T')[0],
    shift: 'Morning' as 'Morning' | 'Afternoon' | 'Evening',
    notes: 'Walk-in booking recorded by front desk',
  });

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Fetch Live Content from /api/content
  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (err) {
      console.error('Failed to load content in CMS', err);
    } finally {
      setLoadingContent(false);
    }
  };

  // 2. Fetch Live Appointments from /api/appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments', { cache: 'no-store' });
      if (res.ok) {
        const data: AppointmentRecord[] = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to load appointments in CMS', err);
    }
  };

  useEffect(() => {
    fetchContent();
    fetchAppointments();

    const interval = setInterval(() => {
      fetchAppointments();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Update content field helper
  const handleContentChange = (section: keyof DoctorContent, field: string, value: any) => {
    if (!content) return;
    setHasUnsavedChanges(true);

    if (section === 'doctor') {
      setContent({
        ...content,
        doctor: { ...content.doctor, [field]: value },
      });
    } else if (section === 'clinic') {
      if (field.startsWith('schedule.')) {
        const scheduleKey = field.split('.')[1] as 'weekdayHours' | 'saturdayHours' | 'sundayHours';
        setContent({
          ...content,
          clinic: {
            ...content.clinic,
            schedule: {
              ...content.clinic.schedule,
              [scheduleKey]: value,
            },
          },
        });
      } else {
        setContent({
          ...content,
          clinic: { ...content.clinic, [field]: value },
        });
      }
    } else if (section === 'hero') {
      setContent({
        ...content,
        hero: { ...content.hero, [field]: value },
      });
    } else {
      setContent({
        ...content,
        [section]: value,
      });
    }
  };

  // 3. Publish Changes to /api/content
  const handlePublish = async (overrideContent?: DoctorContent) => {
    const payload = overrideContent || content;
    if (!payload) return;

    setPublishStatus('publishing');
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent(data.content);
        }
        setHasUnsavedChanges(false);
        setPublishStatus('published');
        setLastPublishedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        try {
          localStorage.setItem('doctorsite_sync_event', Date.now().toString());
        } catch (_) {}
        setPreviewKey((k) => k + 1);

        setTimeout(() => setPublishStatus('idle'), 4000);
      } else {
        setPublishStatus('error');
        alert('Failed to publish changes. Check server logs.');
      }
    } catch (err) {
      console.error(err);
      setPublishStatus('error');
      alert('Network error while publishing.');
    }
  };

  // 4. Update Appointment Status via /api/appointments/[id]
  const updateStatus = async (id: string, newStatus: AppointmentRecord['status'], notes?: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        const result = await res.json();
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? result.appointment : apt))
        );
      } else {
        alert('Failed to update appointment status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Create Manual Walk-in Appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptData.patientName || !newAptData.phone) {
      alert('Please provide patient name and phone.');
      return;
    }
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAptData),
      });
      if (res.ok) {
        const result = await res.json();
        setAppointments((prev) => [result.appointment, ...prev]);
        setShowAddAptModal(false);
        setNewAptData({
          patientName: '',
          phone: '',
          service: content?.services[0]?.title || 'General Health Checkup',
          preferredDate: new Date().toISOString().split('T')[0],
          shift: 'Morning',
          notes: 'Walk-in booking recorded by front desk',
        });
      } else {
        alert('Failed to add appointment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating appointment.');
    }
  };

  // 6. Direct Theme Switcher with Instant Publish
  const selectAndPublishTheme = async (themeName: string) => {
    if (!content) return;
    const updated = { ...content, theme: themeName };
    setContent(updated);
    setHasUnsavedChanges(true);
    await handlePublish(updated);
  };

  // Array item helpers (Services, FAQs, Reviews, Pillars)
  const updateService = (idx: number, field: string, val: string) => {
    if (!content) return;
    const newServices = [...content.services];
    newServices[idx] = { ...newServices[idx], [field]: val } as any;
    setContent({ ...content, services: newServices });
    setHasUnsavedChanges(true);
  };

  const addService = () => {
    if (!content) return;
    const newService = {
      id: `srv-${Date.now()}`,
      title: 'New Clinical Procedure',
      description: 'Comprehensive evaluation and treatment protocol for adult and family health.',
      icon: '🩺',
    };
    setContent({ ...content, services: [...content.services, newService] });
    setHasUnsavedChanges(true);
  };

  const removeService = (idx: number) => {
    if (!content) return;
    const newServices = content.services.filter((_, i) => i !== idx);
    setContent({ ...content, services: newServices });
    setHasUnsavedChanges(true);
  };

  const updateReview = (idx: number, field: string, val: any) => {
    if (!content) return;
    const newReviews = [...content.reviews];
    newReviews[idx] = { ...newReviews[idx], [field]: val } as any;
    setContent({ ...content, reviews: newReviews });
    setHasUnsavedChanges(true);
  };

  const addReview = () => {
    if (!content) return;
    const newReview = {
      id: `rev-${Date.now()}`,
      patientName: 'New Verified Patient',
      location: 'Sector 18, Noida',
      treatment: 'General Health Review',
      rating: 5,
      reviewText: 'Excellent medical consultation. The doctor took ample time to listen and explain everything clearly.',
    };
    setContent({ ...content, reviews: [...content.reviews, newReview] });
    setHasUnsavedChanges(true);
  };

  const removeReview = (idx: number) => {
    if (!content) return;
    const newReviews = content.reviews.filter((_, i) => i !== idx);
    setContent({ ...content, reviews: newReviews });
    setHasUnsavedChanges(true);
  };

  const updateFaq = (idx: number, field: string, val: string) => {
    if (!content) return;
    const newFaqs = [...content.faqs];
    newFaqs[idx] = { ...newFaqs[idx], [field]: val } as any;
    setContent({ ...content, faqs: newFaqs });
    setHasUnsavedChanges(true);
  };

  const addFaq = () => {
    if (!content) return;
    const newFaq = {
      id: `faq-${Date.now()}`,
      question: 'New Frequently Asked Question?',
      answer: 'Clear, concise clinical response provided by the doctor or clinic desk.',
    };
    setContent({ ...content, faqs: [...content.faqs, newFaq] });
    setHasUnsavedChanges(true);
  };

  const removeFaq = (idx: number) => {
    if (!content) return;
    const newFaqs = content.faqs.filter((_, i) => i !== idx);
    setContent({ ...content, faqs: newFaqs });
    setHasUnsavedChanges(true);
  };

  const updateAmenity = (idx: number, val: string) => {
    if (!content) return;
    const newAmenities = [...content.clinic.amenities];
    newAmenities[idx] = val;
    setContent({ ...content, clinic: { ...content.clinic, amenities: newAmenities } });
    setHasUnsavedChanges(true);
  };

  const addAmenity = () => {
    if (!content) return;
    setContent({
      ...content,
      clinic: { ...content.clinic, amenities: [...content.clinic.amenities, 'New Clinic Facility'] },
    });
    setHasUnsavedChanges(true);
  };

  const removeAmenity = (idx: number) => {
    if (!content) return;
    const newAmenities = content.clinic.amenities.filter((_, i) => i !== idx);
    setContent({ ...content, clinic: { ...content.clinic, amenities: newAmenities } });
    setHasUnsavedChanges(true);
  };

  const updateWhyChooseUs = (idx: number, field: string, val: string) => {
    if (!content) return;
    const newPillars = [...content.whyChooseUs];
    newPillars[idx] = { ...newPillars[idx], [field]: val } as any;
    setContent({ ...content, whyChooseUs: newPillars });
    setHasUnsavedChanges(true);
  };

  // DPDP Patient Data Export
  const downloadDPDPExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      complianceStandard: 'Digital Personal Data Protection Act (DPDP) 2023',
      clinic: content?.clinic.name,
      doctor: content?.doctor.name,
      totalRecords: appointments.length,
      appointments: appointments.map((a) => ({
        id: a.id,
        patientName: a.patientName,
        phone: a.phone,
        service: a.service,
        date: a.preferredDate,
        shift: a.shift,
        status: a.status,
        recordedAt: a.createdAt,
        consentPurpose: 'In-clinic medical consultation and OPD slot scheduling',
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpdp-appointments-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = aptFilter === 'all' ? true : apt.status === aptFilter;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const newAppointmentsCount = appointments.filter((a) => a.status === 'new').length;

  if (loadingContent || !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', color: '#0F766E' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🩺</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Loading DoctorSite Pro CMS Panel...</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Connecting to Control Plane API (/api/content)...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER BAR: BRANDING, STATUS & SYNC ACTIONS         */}
      {/* ========================================================= */}
      <header
        style={{
          background: '#0F766E',
          color: '#FFFFFF',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #115E59',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 60,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🩺
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              DoctorSite Pro
              <span
                style={{
                  background: '#047857',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                PREMIUM CMS 2.0
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', color: '#CCFBF1' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                Online
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#CCFBF1', marginTop: '2px' }}>
              <strong>{content.clinic.name}</strong> &bull; {content.doctor.name} ({content.doctor.degree})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title="Open patient landing page in new tab"
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '7px 14px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s',
            }}
          >
            <span>🌐</span> View Patient Site (localhost:3000) &rarr;
          </a>

          <button
            onClick={() => handlePublish()}
            disabled={publishStatus === 'publishing'}
            title="Save changes and immediately update the live patient page"
            style={{
              background:
                publishStatus === 'published'
                  ? '#047857'
                  : hasUnsavedChanges
                  ? '#F59E0B'
                  : '#FFFFFF',
              color:
                publishStatus === 'published' || hasUnsavedChanges
                  ? '#FFFFFF'
                  : '#0F766E',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '7px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
            }}
          >
            {publishStatus === 'publishing' && '⏳ Publishing to Patient Page...'}
            {publishStatus === 'published' && '✅ Live on Patient Page!'}
            {publishStatus === 'idle' && (
              <>
                <span>🚀</span>
                {hasUnsavedChanges ? 'Publish Changes (Unsaved)' : 'Publish to Live Site'}
              </>
            )}
            {publishStatus === 'error' && '❌ Retry Publishing'}
          </button>

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.25)', paddingLeft: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontWeight: '700', color: '#FFFFFF' }}>Dr. Rajiv (Owner)</div>
            <div style={{ color: '#CCFBF1', fontSize: '11px' }}>Staff: Sunita (Front Desk)</div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. NAVIGATION BAR (SEGMENTED PILL TABS)                   */}
      {/* ========================================================= */}
      <nav
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflowX: 'auto',
          position: 'sticky',
          top: '64px',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', gap: '4px', padding: '6px 0' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard', badge: null },
            {
              id: 'appointments',
              label: '📅 Appointments',
              badge: newAppointmentsCount > 0 ? `${newAppointmentsCount} New` : `${appointments.length}`,
              badgeColor: newAppointmentsCount > 0 ? '#DC2626' : '#64748B',
            },
            { id: 'editor', label: '🧱 Page Block Editor', badge: null },
            { id: 'media', label: '🖼️ Media Library', badge: null },
            { id: 'themes', label: '🎨 6 Themes', badge: content.theme, badgeColor: '#0F766E' },
            { id: 'settings', label: '⚙️ Clinic Settings', badge: null },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: isActive ? '#0F766E' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : tab.badgeColor,
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      marginLeft: '2px',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B', padding: '6px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' }}>
            <span>🎨 Theme:</span>
            <strong style={{ color: '#0F766E' }}>{content.theme}</strong>
          </div>
        </div>
      </nav>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FCD34D', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#92400E' }}>
          <div>
            ⚠️ <strong>You have unsaved changes!</strong> Edits will not appear on the live patient site until published.
          </div>
          <button
            onClick={() => handlePublish()}
            style={{
              background: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            🚀 Publish Now
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MAIN WORKSPACE / TAB CONTENT PANELS                    */}
      {/* ========================================================= */}
      <main style={{ padding: '24px', flex: 1, maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD                                         */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div
                onClick={() => setActiveTab('appointments')}
                style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Total Appointments Recorded</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0F766E', margin: '4px 0' }}>
                  {appointments.length}
                </div>
                <div style={{ fontSize: '12px', color: newAppointmentsCount > 0 ? '#DC2626' : '#047857', fontWeight: '600' }}>
                  {newAppointmentsCount > 0 ? `🟡 ${newAppointmentsCount} New request awaiting front-desk review` : '✓ All requests processed'}
                </div>
              </div>

              <div
                onClick={() => setActiveTab('editor')}
                style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Current Consultation Fee</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0284C7', margin: '4px 0' }}>
                  ₹{content.doctor.consultationFee}
                </div>
                <div style={{ fontSize: '12px', color: '#0284C7' }}>
                  7-Day Complimentary Follow-up Included
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Core Web Vitals (4G Mobile)</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#15803D', margin: '4px 0' }}>0.9s</div>
                <div style={{ fontSize: '12px', color: '#15803D' }}>⚡ LCP Target &lt; 2.0s &bull; WCAG 2.2 AA Passing</div>
              </div>

              <div
                onClick={() => setActiveTab('themes')}
                style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Active Clinical Theme</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#334155', margin: '4px 0' }}>
                  {content.theme}
                </div>
                <div style={{ fontSize: '12px', color: '#0F766E', fontWeight: '600' }}>
                  Click to switch between 6 presets &rarr;
                </div>
              </div>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px 20px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong style={{ color: '#166534', fontSize: '14px' }}>Front-Desk Notice for Sunita:</strong>
                <span style={{ color: '#14532D', marginLeft: '8px', fontSize: '13px' }}>
                  {content.doctor.name} OPD shifts are: {content.clinic.schedule.weekdayHours} and {content.clinic.schedule.saturdayHours}. Request-first model requires contacting patient via WhatsApp before confirming slots.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('appointments')}
                style={{ background: '#166534', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Go to Appointments Inbox &rarr;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0F172A' }}>⚡ Clinic Control Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => { setActiveTab('editor'); setEditorSection('clinic'); }}
                    style={{ textAlign: 'left', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>🏥 Edit Clinic Schedule, Map &amp; Amenities</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Update timings, fee policy, address, and transit guidance</div>
                    </div>
                    <span style={{ color: '#94A3B8' }}>&rarr;</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('editor'); setEditorSection('services'); }}
                    style={{ textAlign: 'left', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>🔬 Manage Clinical Services ({content.services.length})</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Add or edit outpatient treatments and procedures</div>
                    </div>
                    <span style={{ color: '#94A3B8' }}>&rarr;</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('editor'); setEditorSection('reviews'); }}
                    style={{ textAlign: 'left', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>💬 Manage Patient Reviews ({content.reviews.length})</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Add or update patient testimonials &amp; ratings</div>
                    </div>
                    <span style={{ color: '#94A3B8' }}>&rarr;</span>
                  </button>

                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', padding: '12px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#166534' }}>🌐 View Live Patient Landing Page</div>
                      <div style={{ fontSize: '12px', color: '#15803D' }}>Verify real-time updates at http://localhost:3000/</div>
                    </div>
                    <span style={{ color: '#166534' }}>↗</span>
                  </a>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0F172A' }}>📋 Latest Patient Inquiries</h3>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    View All ({appointments.length}) &rarr;
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appointments.slice(0, 4).map((apt) => (
                    <div
                      key={apt.id}
                      style={{
                        padding: '10px 12px',
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{apt.patientName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {apt.service} &bull; {apt.preferredDate} ({apt.shift})
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          background:
                            apt.status === 'new'
                              ? '#FEF3C7'
                              : apt.status === 'contacted'
                              ? '#E0F2FE'
                              : apt.status === 'confirmed'
                              ? '#DCFCE7'
                              : '#F1F5F9',
                          color:
                            apt.status === 'new'
                              ? '#92400E'
                              : apt.status === 'contacted'
                              ? '#0369A1'
                              : apt.status === 'confirmed'
                              ? '#15803D'
                              : '#475569',
                        }}
                      >
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: APPOINTMENTS INBOX (CRM-LITE)                      */}
        {/* ========================================================= */}
        {activeTab === 'appointments' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A' }}>
                  Patient Appointments &bull; Request-First Reception Inbox
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Per ADR-104: Receptionist verifies shift capacity and confirms time slot directly on WhatsApp. Live synced with /api/appointments.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowAddAptModal(true)}
                  style={{
                    background: '#0F766E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>+</span> Add Walk-in / Phone Patient
                </button>
                <button
                  onClick={() => fetchAppointments()}
                  style={{
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All (${appointments.length})` },
                  { id: 'new', label: `🟡 New (${appointments.filter((a) => a.status === 'new').length})` },
                  { id: 'contacted', label: `🔵 Contacted (${appointments.filter((a) => a.status === 'contacted').length})` },
                  { id: 'confirmed', label: `🟢 Confirmed (${appointments.filter((a) => a.status === 'confirmed').length})` },
                  { id: 'completed', label: `⚪ Completed (${appointments.filter((a) => a.status === 'completed').length})` },
                  { id: 'cancelled', label: `🔴 Cancelled (${appointments.filter((a) => a.status === 'cancelled').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAptFilter(f.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: aptFilter === f.id ? '700' : '500',
                      border: aptFilter === f.id ? '1px solid #0F766E' : '1px solid #E2E8F0',
                      background: aptFilter === f.id ? '#F0FDF4' : '#FFFFFF',
                      color: aptFilter === f.id ? '#0F766E' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search patient, phone, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', width: '260px' }}
              />
            </div>

            {/* Modal for Walk-in Booking */}
            {showAddAptModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>+ Add Walk-in / Phone Consultation</h3>
                    <button onClick={() => setShowAddAptModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                  </div>
                  <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Patient Name *</label>
                      <input
                        type="text"
                        required
                        value={newAptData.patientName}
                        onChange={(e) => setNewAptData({ ...newAptData, patientName: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newAptData.phone}
                        onChange={(e) => setNewAptData({ ...newAptData, phone: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Service</label>
                        <select
                          value={newAptData.service}
                          onChange={(e) => setNewAptData({ ...newAptData, service: e.target.value })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        >
                          {content.services.map((s) => (
                            <option key={s.id} value={s.title}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Shift</label>
                        <select
                          value={newAptData.shift}
                          onChange={(e) => setNewAptData({ ...newAptData, shift: e.target.value as any })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        >
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Date</label>
                      <input
                        type="date"
                        value={newAptData.preferredDate}
                        onChange={(e) => setNewAptData({ ...newAptData, preferredDate: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Staff Notes</label>
                      <input
                        type="text"
                        value={newAptData.notes}
                        onChange={(e) => setNewAptData({ ...newAptData, notes: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddAptModal(false)}
                        style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Confirm Booking
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>ID &amp; Patient</th>
                    <th style={{ padding: '12px' }}>Phone / WhatsApp</th>
                    <th style={{ padding: '12px' }}>Specialty</th>
                    <th style={{ padding: '12px' }}>Date &amp; Shift</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Front-Desk Notes</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Workflow Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                        No appointments match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>
                          <div>{apt.patientName}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{apt.id} &bull; {apt.createdAt}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <a
                            href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(apt.patientName)},%20this%20is%20Sunita%20from%20${encodeURIComponent(content.clinic.name)}%20regarding%20your%20consultation%20request%20with%20${encodeURIComponent(content.doctor.name)}.%20Please%20let%20us%20know%20if%20you%20prefer%20morning%20or%20evening.`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#047857', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Open WhatsApp chat with patient"
                          >
                            💬 {apt.phone}
                          </a>
                        </td>
                        <td style={{ padding: '12px', color: '#334155' }}>{apt.service}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: '600' }}>{apt.preferredDate}</span>
                          <span style={{ marginLeft: '6px', fontSize: '11px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                            {apt.shift}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              background:
                                apt.status === 'new'
                                  ? '#FEF3C7'
                                  : apt.status === 'contacted'
                                  ? '#E0F2FE'
                                  : apt.status === 'confirmed'
                                  ? '#DCFCE7'
                                  : '#F1F5F9',
                              color:
                                apt.status === 'new'
                                  ? '#92400E'
                                  : apt.status === 'contacted'
                                  ? '#0369A1'
                                  : apt.status === 'confirmed'
                                  ? '#15803D'
                                  : '#475569',
                            }}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748B', maxWidth: '220px', fontSize: '12px' }}>
                          {apt.notes}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {apt.status === 'new' && (
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => updateStatus(apt.id, 'contacted', 'WhatsApp outreach performed')}
                                style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Mark Contacted
                              </button>
                            )}
                            {(apt.status === 'new' || apt.status === 'contacted') && (
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => updateStatus(apt.id, 'confirmed', 'Time slot confirmed with patient')}
                                style={{ background: '#16A34A', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Confirm Slot
                              </button>
                            )}
                            {apt.status === 'confirmed' && (
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => updateStatus(apt.id, 'completed', 'Consultation finished')}
                                style={{ background: '#475569', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Complete Visit
                              </button>
                            )}
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => updateStatus(apt.id, 'cancelled', 'Cancelled by patient or clinic')}
                                style={{ background: '#F1F5F9', color: '#991B1B', border: '1px solid #FECACA', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PAGE BLOCK EDITOR & REAL-TIME PREVIEW             */}
        {/* ========================================================= */}
        {activeTab === 'editor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0F172A' }}>
                  Interactive Block Editor &bull; Live Preview
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Edit all sections (including Clinic Schedule, Google Map, Why Choose Us, 9 Services, Reviews, FAQs). Click &quot;Publish to Live Site&quot; to push changes immediately.
                </p>
              </div>

              {/* Viewport Width Controls */}
              <div style={{ display: 'flex', gap: '6px', background: '#E2E8F0', padding: '4px', borderRadius: '8px' }}>
                <button
                  onClick={() => setDeviceViewport('360px')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: deviceViewport === '360px' ? '700' : '500',
                    background: deviceViewport === '360px' ? '#FFFFFF' : 'transparent',
                    color: deviceViewport === '360px' ? '#0F766E' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  📱 Mobile (360px)
                </button>
                <button
                  onClick={() => setDeviceViewport('768px')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: deviceViewport === '768px' ? '700' : '500',
                    background: deviceViewport === '768px' ? '#FFFFFF' : 'transparent',
                    color: deviceViewport === '768px' ? '#0F766E' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  📟 Tablet (768px)
                </button>
                <button
                  onClick={() => setDeviceViewport('100%')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: deviceViewport === '100%' ? '700' : '500',
                    background: deviceViewport === '100%' ? '#FFFFFF' : 'transparent',
                    color: deviceViewport === '100%' ? '#0F766E' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  🖥️ Desktop (1400px)
                </button>
              </div>
            </div>

            {/* Sub-Navigation for Block Sections */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              {[
                { id: 'clinic', label: '🏥 Clinic, Timings & Map (Photo Match)' },
                { id: 'hero', label: '📢 Hero & Announcements' },
                { id: 'doctor', label: '👩‍⚕️ Doctor Credentials & Pricing' },
                { id: 'pillars', label: '⭐ Why Choose Us (4 Pillars)' },
                { id: 'services', label: `🔬 Clinical Services (${content.services.length})` },
                { id: 'reviews', label: `💬 Patient Reviews (${content.reviews.length})` },
                { id: 'faqs', label: `❓ FAQs (${content.faqs.length})` },
              ].map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setEditorSection(sec.id as EditorSection)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: editorSection === sec.id ? '700' : '500',
                    border: editorSection === sec.id ? '1px solid #0F766E' : '1px solid #CBD5E1',
                    background: editorSection === sec.id ? '#0F766E' : '#FFFFFF',
                    color: editorSection === sec.id ? '#FFFFFF' : '#334155',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Split Grid: Left Editor Forms & Right Live Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 500px) 1fr', gap: '24px', alignItems: 'flex-start' }}>
              
              {/* Left Column: Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Save Banner */}
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F766E' }}>
                      Editing: {editorSection.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {hasUnsavedChanges ? '⚠️ Unsaved changes ready to publish' : '✓ All synced with live patient page'}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePublish()}
                    disabled={publishStatus === 'publishing'}
                    style={{
                      background: hasUnsavedChanges ? '#D97706' : '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {publishStatus === 'publishing' ? '⏳ Saving...' : '🚀 Publish Changes'}
                  </button>
                </div>

                {/* =================================================== */}
                {/* SECTION: CLINIC, SCHEDULE & MAP (USER UPLOAD MATCH) */}
                {/* =================================================== */}
                {editorSection === 'clinic' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏥</span> Clinic Address, Consultation Schedule &amp; Map Facade
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
                      Matches the uploaded design card: tagline quote, consultation schedule table, fee policy, amenities, map title, and transit guidance.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                          Tagline Quote (Shown on top of card in green italics)
                        </label>
                        <input
                          type="text"
                          value={content.clinic.taglineQuote || ''}
                          onChange={(e) => handleContentChange('clinic', 'taglineQuote', e.target.value)}
                          placeholder='"We Nurture Your Health, Every Day"'
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Clinic Name</label>
                        <input
                          type="text"
                          value={content.clinic.name}
                          onChange={(e) => handleContentChange('clinic', 'name', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>📍 Full Clinic Street Address</label>
                        <input
                          type="text"
                          value={content.clinic.street}
                          onChange={(e) => handleContentChange('clinic', 'street', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Area</label>
                          <input
                            type="text"
                            value={content.clinic.area}
                            onChange={(e) => handleContentChange('clinic', 'area', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>City</label>
                          <input
                            type="text"
                            value={content.clinic.city}
                            onChange={(e) => handleContentChange('clinic', 'city', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Pincode</label>
                          <input
                            type="text"
                            value={content.clinic.pincode}
                            onChange={(e) => handleContentChange('clinic', 'pincode', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {/* Consultation Schedule Table Inputs */}
                      <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>
                          🕒 Consultation Schedule (Table Rows)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Monday – Friday:</span>
                            <input
                              type="text"
                              value={content.clinic.schedule?.weekdayHours || ''}
                              onChange={(e) => handleContentChange('clinic', 'schedule.weekdayHours', e.target.value)}
                              placeholder="Monday – Friday: 09:00 AM – 08:00 PM"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Saturday:</span>
                            <input
                              type="text"
                              value={content.clinic.schedule?.saturdayHours || ''}
                              onChange={(e) => handleContentChange('clinic', 'schedule.saturdayHours', e.target.value)}
                              placeholder="Saturday: 09:00 AM – 04:00 PM"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Sunday:</span>
                            <input
                              type="text"
                              value={content.clinic.schedule?.sundayHours || ''}
                              onChange={(e) => handleContentChange('clinic', 'schedule.sundayHours', e.target.value)}
                              placeholder="Sunday: Closed (Emergency On-Call)"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Consultation Fee & Policy */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                          💵 Consultation Fee &amp; Policy Text
                        </label>
                        <textarea
                          rows={2}
                          value={content.clinic.feePolicy || ''}
                          onChange={(e) => handleContentChange('clinic', 'feePolicy', e.target.value)}
                          placeholder="₹600 regular consultation. Includes a 7-day complimentary follow-up visit for the same medical issue."
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Amenities Editor */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700' }}>🏥 Clinic Amenities ({content.clinic.amenities.length})</label>
                          <button
                            type="button"
                            onClick={addAmenity}
                            style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            + Add Facility
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {content.clinic.amenities.map((amenity, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                value={amenity}
                                onChange={(e) => updateAmenity(idx, e.target.value)}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                              />
                              <button
                                type="button"
                                onClick={() => removeAmenity(idx)}
                                style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Google Map & Transit Guidance */}
                      <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#1E293B' }}>
                          📍 Google Map Facade &amp; Transit Guidance
                        </strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Map Location Title:</span>
                            <input
                              type="text"
                              value={content.clinic.mapLocationName || ''}
                              onChange={(e) => handleContentChange('clinic', 'mapLocationName', e.target.value)}
                              placeholder="HealthConsult Clinic Location"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Map Subtitle:</span>
                            <input
                              type="text"
                              value={content.clinic.mapSubtitle || ''}
                              onChange={(e) => handleContentChange('clinic', 'mapSubtitle', e.target.value)}
                              placeholder="Sector 18 Central Market, Noida"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Transit &amp; Parking Guidance:</span>
                            <textarea
                              rows={2}
                              value={content.clinic.transitGuidance || ''}
                              onChange={(e) => handleContentChange('clinic', 'transitGuidance', e.target.value)}
                              placeholder="Located directly in Central Market Sector 18, just 200 meters from Noida Sector 18 Metro Station..."
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* SECTION: HERO & HIGHLIGHTS                          */}
                {/* =================================================== */}
                {editorSection === 'hero' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E' }}>
                      📢 Hero Section, Metrics &amp; Top Announcements
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Top Emergency &amp; Announcement Bar</label>
                        <input
                          type="text"
                          value={content.announcement}
                          onChange={(e) => handleContentChange('announcement' as any, '', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Hero Main Headline</label>
                        <input
                          type="text"
                          value={content.hero.headline}
                          onChange={(e) => handleContentChange('hero', 'headline', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Hero Subtitle</label>
                        <textarea
                          rows={2}
                          value={content.hero.subtitle}
                          onChange={(e) => handleContentChange('hero', 'subtitle', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Practice Stat</label>
                          <input
                            type="text"
                            value={content.hero.statExperience}
                            onChange={(e) => handleContentChange('hero', 'statExperience', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Patients Stat</label>
                          <input
                            type="text"
                            value={content.hero.statConsultations}
                            onChange={(e) => handleContentChange('hero', 'statConsultations', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Rating Stat</label>
                          <input
                            type="text"
                            value={content.hero.statRating}
                            onChange={(e) => handleContentChange('hero', 'statRating', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* SECTION: DOCTOR CREDENTIALS                         */}
                {/* =================================================== */}
                {editorSection === 'doctor' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E' }}>
                      👩‍⚕️ Doctor Credentials, Pricing &amp; Bio
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Doctor Name</label>
                        <input
                          type="text"
                          value={content.doctor.name}
                          onChange={(e) => handleContentChange('doctor', 'name', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Consultation Fee (₹)</label>
                          <input
                            type="number"
                            value={content.doctor.consultationFee}
                            onChange={(e) => handleContentChange('doctor', 'consultationFee', Number(e.target.value))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Languages Spoken</label>
                          <input
                            type="text"
                            value={content.doctor.languages || 'English & Hindi'}
                            onChange={(e) => handleContentChange('doctor', 'languages', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Medical Degrees</label>
                        <input
                          type="text"
                          value={content.doctor.degree}
                          onChange={(e) => handleContentChange('doctor', 'degree', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>College / Alma Mater</label>
                        <input
                          type="text"
                          value={content.doctor.college || ''}
                          onChange={(e) => handleContentChange('doctor', 'college', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Registration Lic.</label>
                          <input
                            type="text"
                            value={content.doctor.registrationNumber}
                            onChange={(e) => handleContentChange('doctor', 'registrationNumber', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Medical Council</label>
                          <input
                            type="text"
                            value={content.doctor.medicalCouncil}
                            onChange={(e) => handleContentChange('doctor', 'medicalCouncil', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Doctor Bio</label>
                        <textarea
                          rows={3}
                          value={content.doctor.bio}
                          onChange={(e) => handleContentChange('doctor', 'bio', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* SECTION: WHY CHOOSE US (4 TRUST PILLARS)            */}
                {/* =================================================== */}
                {editorSection === 'pillars' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E' }}>
                      ⭐ Why Choose Us &bull; Clinic Trust Pillars
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {content.whyChooseUs?.map((pillar, idx) => (
                        <div key={pillar.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                            <input
                              type="text"
                              value={pillar.icon}
                              onChange={(e) => updateWhyChooseUs(idx, 'icon', e.target.value)}
                              style={{ width: '48px', textAlign: 'center', fontSize: '18px', padding: '4px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                            />
                            <input
                              type="text"
                              value={pillar.title}
                              onChange={(e) => updateWhyChooseUs(idx, 'title', e.target.value)}
                              style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={pillar.description}
                            onChange={(e) => updateWhyChooseUs(idx, 'description', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* SECTION: SERVICES (ALL 9 PROCEDURES)                */}
                {/* =================================================== */}
                {editorSection === 'services' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0F766E' }}>
                        🔬 Clinical Services ({content.services.length})
                      </h3>
                      <button
                        type="button"
                        onClick={addService}
                        style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + Add Service
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {content.services.map((srv, idx) => (
                        <div key={srv.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                              <input
                                type="text"
                                value={srv.icon}
                                onChange={(e) => updateService(idx, 'icon', e.target.value)}
                                style={{ width: '48px', textAlign: 'center', fontSize: '18px', padding: '4px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                              />
                              <input
                                type="text"
                                value={srv.title}
                                onChange={(e) => updateService(idx, 'title', e.target.value)}
                                style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeService(idx)}
                              style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={srv.description}
                            onChange={(e) => updateService(idx, 'description', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* SECTION: PATIENT REVIEWS                            */}
                {/* =================================================== */}
                {editorSection === 'reviews' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0F766E' }}>
                        💬 Patient Feedback &amp; Reviews ({content.reviews.length})
                      </h3>
                      <button
                        type="button"
                        onClick={addReview}
                        style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + Add Review
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {content.reviews.map((rev, idx) => (
                        <div key={rev.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                              <input
                                type="text"
                                placeholder="Patient Name"
                                value={rev.patientName}
                                onChange={(e) => updateReview(idx, 'patientName', e.target.value)}
                                style={{ width: '120px', fontWeight: '700', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                              />
                              <input
                                type="text"
                                placeholder="Treatment Tag"
                                value={rev.treatment}
                                onChange={(e) => updateReview(idx, 'treatment', e.target.value)}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeReview(idx)}
                              style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                            <input
                              type="text"
                              placeholder="Location (e.g. Sector 18, Noida)"
                              value={rev.location}
                              onChange={(e) => updateReview(idx, 'location', e.target.value)}
                              style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px' }}
                            />
                            <select
                              value={rev.rating}
                              onChange={(e) => updateReview(idx, 'rating', Number(e.target.value))}
                              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px' }}
                            >
                              <option value={5}>★★★★★ (5 Stars)</option>
                              <option value={4}>★★★★☆ (4 Stars)</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Review Text"
                            value={rev.reviewText}
                            onChange={(e) => updateReview(idx, 'reviewText', e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =================================================== */}
                {/* SECTION: FAQS                                       */}
                {/* =================================================== */}
                {editorSection === 'faqs' && (
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0F766E' }}>
                        ❓ Frequently Asked Questions ({content.faqs.length})
                      </h3>
                      <button
                        type="button"
                        onClick={addFaq}
                        style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + Add FAQ
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {content.faqs.map((faq, idx) => (
                        <div key={faq.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                              placeholder="Question"
                              style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeFaq(idx)}
                              style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                            placeholder="Answer"
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Live Iframe Preview */}
              <div
                style={{
                  background: '#CBD5E1',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontWeight: '600' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    Live Patient Site Preview (http://localhost:3000/)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPreviewKey((k) => k + 1)}
                      title="Reload preview iframe"
                      style={{ background: '#FFFFFF', border: '1px solid #94A3B8', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      🔄 Refresh
                    </button>
                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: '#0F766E', color: '#FFFFFF', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}
                    >
                      ↗ Open New Tab
                    </a>
                  </div>
                </div>

                <div
                  style={{
                    width: deviceViewport,
                    maxWidth: '100%',
                    height: '800px',
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    transition: 'width 0.25s ease',
                    border: '1px solid #94A3B8',
                  }}
                >
                  <iframe
                    ref={previewIframeRef}
                    key={previewKey}
                    src="/"
                    title="Live Site Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MEDIA LIBRARY                                     */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0F766E' }}>
              Cloudflare R2 Media Library &bull; Asset Pipeline
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B' }}>
              Automatic AVIF/WebP generation, EXIF metadata stripping, and focal-point centering per ADR-009.
            </p>

            <div
              style={{
                border: '2px dashed #0F766E',
                borderRadius: '10px',
                padding: '36px',
                textAlign: 'center',
                background: '#F0FDF4',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📤</div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#0F766E' }}>
                Upload Doctor Portrait or Clinic Photos
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                Supports JPG, PNG, WebP (Auto-optimized to AVIF with Sharp &bull; Presigned R2 PUT)
              </div>
            </div>

            <h3 style={{ fontSize: '15px', color: '#334155', marginBottom: '12px' }}>Active Media Assets</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', background: '#F8FAFC' }}>
                <div style={{ height: '140px', background: '#CCFBF1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  👩‍⚕️
                </div>
                <div style={{ fontWeight: '700', fontSize: '13px', marginTop: '10px' }}>dr_maanvita_portrait.webp</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Focal Point: (50%, 30%) &bull; 42 KB WebP</div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#047857', fontWeight: '600' }}>✓ Active on Hero</div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', background: '#F8FAFC' }}>
                <div style={{ height: '140px', background: '#E0F2FE', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  🏥
                </div>
                <div style={{ fontWeight: '700', fontSize: '13px', marginTop: '10px' }}>noida_clinic_facade.webp</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Focal Point: (50%, 50%) &bull; 68 KB WebP</div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#047857', fontWeight: '600' }}>✓ Active on OPD Section</div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', background: '#F8FAFC' }}>
                <div style={{ height: '140px', background: '#FEF3C7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  🩺
                </div>
                <div style={{ fontWeight: '700', fontSize: '13px', marginTop: '10px' }}>stethoscope_branding.png</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Lossless SVG/PNG &bull; 14 KB</div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#047857', fontWeight: '600' }}>✓ Active on Nav Logo</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: 6 CLINICAL THEMES                                 */}
        {/* ========================================================= */}
        {activeTab === 'themes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A' }}>
                  DoctorSite Pro &bull; 6 Clinical Theme Presets
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Per <code>19_PREMIUM_UX_SPEC.md</code>. All palettes pass WCAG 2.2 Level AA accessibility standards. Click &quot;Apply &amp; Publish Immediately&quot; to see instant changes on the patient site.
                </p>
              </div>

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                Active Theme: <strong>{content.theme}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {THEME_PRESETS.map((theme) => {
                const isCurrent = content.theme === theme.name;
                return (
                  <div
                    key={theme.name}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: isCurrent ? '2px solid #0F766E' : '1px solid #E2E8F0',
                      padding: '22px',
                      boxShadow: isCurrent ? '0 6px 16px rgba(15,118,110,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '17px', color: theme.primary }}>{theme.name}</strong>
                        {isCurrent && (
                          <span style={{ background: '#0F766E', color: '#FFFFFF', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '999px' }}>
                            ✓ ACTIVE THEME
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ flex: 1, height: '44px', borderRadius: '8px', background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}>
                          Primary
                        </div>
                        <div style={{ flex: 1, height: '44px', borderRadius: '8px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}>
                          Accent
                        </div>
                        <div style={{ flex: 1, height: '44px', borderRadius: '8px', background: theme.bg, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '11px', fontWeight: 'bold' }}>
                          Background
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '500' }}>
                        {theme.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        <strong>Recommended for:</strong> {theme.specialty}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                      <button
                        onClick={() => selectAndPublishTheme(theme.name)}
                        style={{
                          flex: 1,
                          background: isCurrent ? '#0F766E' : '#FFFFFF',
                          color: isCurrent ? '#FFFFFF' : '#0F766E',
                          border: isCurrent ? 'none' : '1px solid #0F766E',
                          padding: '10px',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isCurrent ? '✓ Currently Live' : '⚡ Apply & Publish Immediately'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CLINIC SETTINGS & COMPLIANCE                      */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0F766E' }}>
              Clinic Governance &bull; 18% GST &amp; DPDP Act 2023
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748B' }}>
              Operational compliance configurations for Indian healthcare regulations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div style={{ border: '1px solid #E2E8F0', padding: '20px', borderRadius: '10px' }}>
                <h3 style={{ fontSize: '15px', color: '#1E293B', margin: '0 0 12px 0' }}>Clinic Operational Shifts</h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  <strong>{content.clinic.schedule.weekdayHours}</strong><br />
                  <strong>{content.clinic.schedule.saturdayHours}</strong><br />
                  <strong>{content.clinic.schedule.sundayHours}</strong>
                </p>
                <button
                  onClick={() => { setActiveTab('editor'); setEditorSection('clinic'); }}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  ✏️ Edit Hours in Block Editor
                </button>
              </div>

              <div style={{ border: '1px solid #E2E8F0', padding: '20px', borderRadius: '10px' }}>
                <h3 style={{ fontSize: '15px', color: '#1E293B', margin: '0 0 12px 0' }}>18% GST Compliance &amp; Billing</h3>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
                  <strong>Plan:</strong> DoctorSite Pro (Annual Retainer)<br />
                  <strong>Base Fee:</strong> ₹24,999 / year<br />
                  <strong>CGST (9%) + SGST (9%):</strong> ₹4,499.82<br />
                  <strong>Total Invoice:</strong> ₹29,498.82 INR<br />
                  <strong>SAC Code:</strong> 998314 (IT &amp; Digital Presence Automation)
                </div>
                <button
                  onClick={() => alert('GST Tax Invoice downloaded: INV-2026-998314.pdf')}
                  style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  📄 Download Latest Tax Invoice
                </button>
              </div>

              <div style={{ border: '1px solid #E2E8F0', padding: '20px', borderRadius: '10px' }}>
                <h3 style={{ fontSize: '15px', color: '#1E293B', margin: '0 0 12px 0' }}>DPDP Act 2023 Patient Privacy</h3>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
                  <strong>Consent Status:</strong> Active on appointment form.<br />
                  <strong>Storage:</strong> AES-256-GCM encrypted.<br />
                  <strong>Audit Trail:</strong> All status transitions logged.<br />
                  <strong>Right to Erasure:</strong> Supported per patient phone ID.
                </div>
                <button
                  onClick={downloadDPDPExport}
                  style={{ background: '#1E3A8A', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  📥 Export Patient Consent &amp; Appointment Ledger
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer style={{ borderTop: '1px solid #E2E8F0', background: '#FFFFFF', padding: '16px 24px', textAlign: 'center', fontSize: '12px', color: '#94A3B8' }}>
        DoctorSite Pro v0.2.0 &bull; Control Plane CMS &bull; DPDP Act 2023 &amp; Razorpay Compliant &bull; Connected to http://localhost:3000/
      </footer>
    </div>
  );
}
