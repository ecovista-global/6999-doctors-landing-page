'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DoctorContent } from '@/lib/contentStore';
import {
  StethoscopeIcon,
  PhoneIcon,
  MessageCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BanknoteIcon,
  BuildingIcon,
  ShieldCheckIcon,
  AwardIcon,
  FileTextIcon,
  ActivityIcon,
  GlobeIcon,
  PillIcon,
  ZapIcon,
  LockIcon,
  MicroscopeIcon,
  HeartPulseIcon,
  ThermometerIcon,
  UserCheckIcon,
  SyringeIcon,
  StarIcon,
  CheckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  LockIcon as KeyIcon,
  MenuIcon,
  XIcon,
  PrinterIcon,
  AlertCircleIcon,
  Share2Icon,
  CopyIcon,
} from '@/components/Icons';

const DEFAULT_PALETTE = { primary: '#0F766E', primaryDark: '#115E59', accent: '#047857', bg: '#F0FDF4', text: '#0F172A' };

const THEME_PALETTES: Record<string, { primary: string; primaryDark: string; accent: string; bg: string; text: string }> = {
  'Green Trust': { primary: '#0F766E', primaryDark: '#115E59', accent: '#047857', bg: '#F0FDF4', text: '#0F172A' },
  'Teal Poster': { primary: '#0284C7', primaryDark: '#0369A1', accent: '#0EA5E9', bg: '#F0F9FF', text: '#0F172A' },
  'Navy Gold': { primary: '#1E3A8A', primaryDark: '#172554', accent: '#D97706', bg: '#F8FAFC', text: '#0F172A' },
  'Sand Warmth': { primary: '#78350F', primaryDark: '#451A03', accent: '#B45309', bg: '#FFFBEB', text: '#1C1917' },
  'Slate Clean': { primary: '#334155', primaryDark: '#0F172A', accent: '#475569', bg: '#F8FAFC', text: '#0F172A' },
  'Rose Clinic': { primary: '#BE123C', primaryDark: '#881337', accent: '#E11D48', bg: '#FFF1F2', text: '#1F2937' },
};

// SVG icon selector for services and trust pillars
function renderServiceIcon(iconName: string, color: string) {
  switch (iconName) {
    case 'heartPulse': return <HeartPulseIcon size={28} color={color} />;
    case 'thermometer': return <ThermometerIcon size={28} color={color} />;
    case 'pill': return <PillIcon size={28} color={color} />;
    case 'userCheck': return <UserCheckIcon size={28} color={color} />;
    case 'syringe': return <SyringeIcon size={28} color={color} />;
    case 'activity': return <ActivityIcon size={28} color={color} />;
    case 'microscope': return <MicroscopeIcon size={28} color={color} />;
    case 'shield': return <ShieldCheckIcon size={28} color={color} />;
    case 'clock': return <ClockIcon size={28} color={color} />;
    case 'message': return <MessageCircleIcon size={28} color={color} />;
    default: return <StethoscopeIcon size={28} color={color} />;
  }
}

export default function PatientLandingPage() {
  const [content, setContent] = useState<DoctorContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Appointment Form State
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    service: 'General Health Checkup',
    preferredDate: '',
    shift: 'Morning' as 'Morning' | 'Afternoon' | 'Evening',
    notes: '',
  });
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>('05:30 PM');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAptId, setSubmittedAptId] = useState('');
  const [confirmedToken, setConfirmedToken] = useState<number>(8);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    patientName: string;
    phone: string;
    service: string;
    shift: string;
    date: string;
    time: string;
  } | null>(null);

  // Fetch live content from CMS API
  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (err) {
      console.error('Failed to load live content', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, 4000);

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'doctorsite_sync_event') {
        fetchContent();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const downloadIcsCalendar = () => {
    if (!content || !confirmedDetails) return;
    const dateFormatted = ((confirmedDetails.date || new Date().toISOString().split('T')[0]) ?? '').replace(/-/g, '');
    const icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DoctorSite Pro//Clinic Appointment Slip//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:Medical Consultation with ${content.doctor.name} (Token #${confirmedToken})`,
      `DESCRIPTION:In-clinic consultation at ${content.clinic.name}. Patient: ${confirmedDetails.patientName}. Service: ${confirmedDetails.service}. Address: ${content.clinic.street}, ${content.clinic.area}, ${content.clinic.city}`,
      `LOCATION:${content.clinic.street}, ${content.clinic.area}, ${content.clinic.city}`,
      `DTSTART:${dateFormatted}T120000Z`,
      `DTEND:${dateFormatted}T123000Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-token-${confirmedToken}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone) {
      alert('Please provide your name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          notes: selectedSlotTime ? `Slot time: ${selectedSlotTime}. ${formData.notes}` : formData.notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const apt = data.appointment;
        setSubmittedAptId(apt?.id || 'APT-CONFIRMED');
        setConfirmedToken(apt?.tokenNumber || (content?.availability?.currentServingToken ? content.availability.currentServingToken + 4 : 8));
        setConfirmedDetails({
          patientName: formData.patientName,
          phone: formData.phone,
          service: formData.service,
          shift: formData.shift,
          date: formData.preferredDate || (new Date().toISOString().split('T')[0] ?? ''),
          time: selectedSlotTime || (formData.shift === 'Morning' ? '10:30 AM' : '05:30 PM'),
        });
        setSubmitSuccess(true);
      } else {
        alert('Failed to submit appointment request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', color: '#0F766E' }}>
          <StethoscopeIcon size={48} color="#0F766E" style={{ marginBottom: '14px' }} />
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Loading Clinical Presence...</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Connecting to DoctorSite Pro Control Plane...</div>
        </div>
      </div>
    );
  }

  const theme = (content?.theme && THEME_PALETTES[content.theme]) ? THEME_PALETTES[content.theme]! : DEFAULT_PALETTE;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans)' }}>
      
      {/* ========================================================= */}
      {/* 1. TOP LIVE EDGE SYNC & CMS SHORTCUT BAR                  */}
      {/* ========================================================= */}
      <div
        style={{
          background: '#0F172A',
          color: '#F8FAFC',
          padding: '8px 24px',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#10B981', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }} />
          <span>
            <strong>Live Clinical Edge:</strong> Theme: <strong>{content.theme}</strong> &bull; Synced with DoctorSite Pro CMS
          </span>
        </div>
        <Link
          href="/cms"
          style={{
            background: theme.primary,
            color: '#FFFFFF',
            padding: '5px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <KeyIcon size={14} color="#FFFFFF" />
          <span>Staff CMS Control Panel (Edit All Content &amp; Manage Appointments) &rarr;</span>
        </Link>
      </div>

      {/* Emergency Notice & Announcement Strip */}
      <div style={{ background: theme.bg, borderBottom: `1px solid ${theme.primary}22`, padding: '10px 24px', textAlign: 'center', fontSize: '13px', color: theme.primaryDark, fontWeight: '600' }}>
        <ShieldCheckIcon size={15} color={theme.primaryDark} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
        {content.announcement} &bull; Emergency Direct Hotline: <strong>{content.doctor.phone}</strong>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN HEADER & NAVIGATION                               */}
      {/* ========================================================= */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#FFFFFF',
          zIndex: 50,
          borderBottom: '1px solid #E2E8F0',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: theme.primary, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StethoscopeIcon size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '18px', color: theme.primary }}>{content.clinic.name}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {content.doctor.name} &bull; {content.doctor.degree}
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" className="nav-link" style={{ color: theme.primary, fontWeight: '700' }}>Home</Link>
          <Link href="/about" className="nav-link" style={{ color: '#334155' }}>About Doctor</Link>
          <Link href="/services" className="nav-link" style={{ color: '#334155' }}>Treatments &amp; Services</Link>
          <Link href="/doctors" className="nav-link" style={{ color: '#334155' }}>Doctors &amp; Specialists</Link>
          <Link href="/testimonials-faq" className="nav-link" style={{ color: '#334155' }}>Reviews &amp; FAQs</Link>
          <Link href="/blog" className="nav-link" style={{ color: '#334155' }}>Health Blog</Link>
          <Link href="/contact" className="nav-link" style={{ color: theme.primary, fontWeight: '700' }}>Contact &amp; Booking</Link>
          <a
            href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
            className="ux-btn"
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '7px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '6px',
            }}
          >
            <PhoneIcon size={14} color="#FFFFFF" />
            <span>Call Clinic</span>
          </a>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <div className="mobile-nav-toggle" style={{ alignItems: 'center', gap: '8px' }}>
          <a
            href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
            className="ux-btn"
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PhoneIcon size={14} color="#FFFFFF" />
            <span>Call</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
            }}
          >
            {mobileMenuOpen ? <XIcon size={20} color="#0F172A" /> : <MenuIcon size={20} color="#0F172A" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'sticky',
            top: '71px',
            zIndex: 49,
            background: '#FFFFFF',
            borderBottom: '2px solid #E2E8F0',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ color: theme.primary, fontWeight: '700', textDecoration: 'none', padding: '6px 0' }}>Home</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', fontWeight: '600', textDecoration: 'none', padding: '6px 0' }}>About Doctor</Link>
          <Link href="/services" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', fontWeight: '600', textDecoration: 'none', padding: '6px 0' }}>Treatments &amp; Services</Link>
          <Link href="/doctors" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', fontWeight: '600', textDecoration: 'none', padding: '6px 0' }}>Doctors &amp; Specialists</Link>
          <Link href="/testimonials-faq" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', fontWeight: '600', textDecoration: 'none', padding: '6px 0' }}>Reviews &amp; FAQs</Link>
          <Link href="/blog" onClick={() => setMobileMenuOpen(false)} style={{ color: '#334155', fontWeight: '600', textDecoration: 'none', padding: '6px 0' }}>Health Blog</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} style={{ color: theme.primary, fontWeight: '700', textDecoration: 'none', padding: '6px 0' }}>Contact &amp; Booking</Link>
        </div>
      )}

      {/* Live Doctor Running Late Broadcast Banner */}
      {content.availability && content.availability.runningLateMinutes > 0 && (
        <div
          style={{
            background: '#FEF3C7',
            borderBottom: '2px solid #F59E0B',
            color: '#92400E',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <AlertCircleIcon size={20} color="#D97706" />
          <span>
            <strong>Live OPD Notice:</strong> {content.doctor.name} is running ~{content.availability.runningLateMinutes} mins behind schedule ({content.availability.runningLateReason || 'due to emergency clinical care'}). Currently serving <strong>Token #{content.availability.currentServingToken}</strong>. All waiting tokens adjusted.
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. HERO SECTION (SPLIT CUTOUT LAYOUT WITH POSTER STRIP)   */}
      {/* ========================================================= */}
      <section style={{ background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`, padding: '64px 24px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${theme.primary}15`, color: theme.primary, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <CheckCircleIcon size={14} color={theme.primary} />
                <span>DMC Registered &bull; {content.doctor.registrationNumber} &bull; {content.hero.statExperience} Practice</span>
              </div>

              {/* LIVE "NEXT AVAILABLE" CHIP */}
              <a
                href="#booking"
                className="ux-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#15803D',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '800',
                  textDecoration: 'none',
                }}
              >
                <span className="pulse-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                <span>Next available: {content.availability?.nextAvailableSlot || 'Today 5:30 PM'}</span>
                <span style={{ fontSize: '10px', background: '#BBF7D0', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Pick Slot &darr;</span>
              </a>

              {/* CURRENT SERVING TOKEN PILL */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>
                <span>Currently Serving Token #{content.availability?.currentServingToken || 3}</span>
              </div>
            </div>
            
            <h1 style={{ fontSize: '42px', lineHeight: 1.2, fontWeight: '800', color: theme.primaryDark, margin: '0 0 16px 0' }}>
              {content.hero.headline}
            </h1>
            
            <p style={{ fontSize: '17px', lineHeight: 1.6, color: '#475569', margin: '0 0 28px 0' }}>
              {content.hero.subtitle}
            </p>

            {/* CTA Group */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <a
                href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
                className="ux-btn"
                style={{
                  background: theme.primary,
                  color: '#FFFFFF',
                  padding: '13px 26px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 14px ${theme.primary}40`,
                }}
              >
                <PhoneIcon size={18} color="#FFFFFF" />
                <span>Call Dr. {content.doctor.name.split(' ')[1] || 'Doctor'}</span>
              </a>

              <a
                href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(content.doctor.name)},%20I%20would%20like%20to%20consult%20you.`}
                target="_blank"
                rel="noreferrer"
                className="ux-btn"
                style={{
                  background: '#FFFFFF',
                  color: '#047857',
                  border: '2px solid #047857',
                  padding: '11px 22px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MessageCircleIcon size={18} color="#047857" />
                <span>Book on WhatsApp</span>
              </a>

              <a
                href="#booking"
                className="ux-btn"
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CalendarIcon size={16} color="#334155" />
                <span>Request Slot</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary }}>{content.hero.statExperience}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Clinical Practice</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary }}>{content.hero.statConsultations}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Patients Consulted</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary }}>{content.hero.statRating}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Patient Satisfaction</div>
              </div>
            </div>

            {/* Poster-Style Contact Highlights Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: '#FFFFFF', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneIcon size={18} color={theme.primary} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Call directly:</div>
                  <strong style={{ fontSize: '13px', color: theme.primaryDark }}>{content.doctor.phone}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPinIcon size={18} color={theme.primary} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Clinic Location:</div>
                  <strong style={{ fontSize: '13px', color: theme.primaryDark }}>{content.clinic.area}, {content.clinic.city}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClockIcon size={18} color={theme.primary} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Schedule:</div>
                  <strong style={{ fontSize: '13px', color: theme.primaryDark }}>
                    {content.clinic.schedule?.weekdayHours?.replace('Monday – Friday:', '').trim() || '09:00 AM – 08:00 PM'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Portrait & Profile Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="ux-card" style={{ width: '100%', maxWidth: '440px', background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
              <div style={{ height: '340px', background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {content.doctor.photoUrl ? (
                  <img
                    src={content.doctor.photoUrl}
                    alt={content.doctor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="ux-icon-box" style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StethoscopeIcon size={96} color="#FFFFFF" strokeWidth={1.5} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#047857', color: '#FFFFFF', padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                  <span>In-Clinic Today</span>
                </div>
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: 'bold', color: '#0F172A', fontSize: '16px' }}>{content.doctor.name}</div>
                  <div style={{ color: theme.primary, fontSize: '12px', fontWeight: '700' }}>{content.doctor.degree}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{content.doctor.specialty}</div>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#475569', marginBottom: '16px' }}>
                  {content.doctor.bio}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.bg, padding: '12px 16px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Consultation Fee</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.primary }}>₹{content.doctor.consultationFee}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: '700', textAlign: 'right' }}>
                    7-Day Free Follow-up<br />
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>Included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. VERIFIED CREDENTIALS & ACCREDITATIONS                  */}
      {/* ========================================================= */}
      <section id="about" style={{ padding: '64px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Doctor Verification
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>Verified Credentials &amp; Registrations</h2>
          <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
            Medical qualifications and council registrations transparently displayed for patient peace of mind.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div className="ux-icon-box" style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <AwardIcon size={26} color={theme.primary} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: theme.primaryDark }}>Medical Degrees</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1E293B' }}>{content.doctor.degree}</p>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{content.doctor.college}</span>
          </div>

          <div className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div className="ux-icon-box" style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <FileTextIcon size={26} color={theme.primary} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: theme.primaryDark }}>Council Registration</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1E293B' }}>Reg. No: {content.doctor.registrationNumber}</p>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{content.doctor.medicalCouncil}</span>
          </div>

          <div className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div className="ux-icon-box" style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <ActivityIcon size={26} color={theme.primary} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: theme.primaryDark }}>Clinical Experience</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1E293B' }}>{content.doctor.experienceYears}+ Years Active Practice</p>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Over {content.hero.statConsultations} Adult &amp; Family Consultations</span>
          </div>

          <div className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div className="ux-icon-box" style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${theme.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <GlobeIcon size={26} color={theme.primary} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: theme.primaryDark }}>Languages Spoken</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1E293B' }}>{content.doctor.languages}</p>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Fluent consultation in patient&apos;s native language</span>
          </div>
        </div>

        {/* Accreditations Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div className="ux-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div className="ux-icon-box">
              <ShieldCheckIcon size={26} color={theme.primary} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: '#0F172A' }}>NABH Safety Standards</strong>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Sterilized clinic environment &amp; protocols</span>
            </div>
          </div>
          <div className="ux-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div className="ux-icon-box">
              <PillIcon size={26} color={theme.primary} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: '#0F172A' }}>Transparent Consultation</strong>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Complimentary 7-day follow-up included</span>
            </div>
          </div>
          <div className="ux-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div className="ux-icon-box">
              <ZapIcon size={26} color={theme.primary} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: '#0F172A' }}>Digital WhatsApp Reports</strong>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Instant prescription &amp; diagnostic delivery</span>
            </div>
          </div>
          <div className="ux-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div className="ux-icon-box">
              <LockIcon size={26} color={theme.primary} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block', color: '#0F172A' }}>DPDP Act 2023 Compliant</strong>
              <span style={{ fontSize: '12px', color: '#64748B' }}>100% encrypted &amp; private health records</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. WHY CHOOSE US (CLINIC TRUST PILLARS)                   */}
      {/* ========================================================= */}
      <section id="features" style={{ background: '#F8FAFC', padding: '64px 24px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Clinic Standards
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>Why Patients Trust {content.clinic.name}</h2>
            <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
              We prioritize medical ethics, transparent guidance, and zero unnecessary interventions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {content.whyChooseUs?.map((pillar) => (
              <div key={pillar.id} className="ux-card" style={{ background: '#FFFFFF', padding: '28px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div className="ux-icon-box" style={{ width: '52px', height: '52px', borderRadius: '12px', background: `${theme.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  {renderServiceIcon(pillar.icon, theme.primary)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.primaryDark, margin: '0 0 10px 0' }}>{pillar.title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#64748B', margin: 0 }}>{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. COMPREHENSIVE CLINICAL SERVICES (ALL 9)                */}
      {/* ========================================================= */}
      <section id="services" style={{ padding: '64px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Clinical Specializations
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>Comprehensive Care For Your Whole Family</h2>
          <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
            Personalized diagnosis, modern medical protocols, and ongoing family wellness care.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {content.services.map((srv) => (
            <div key={srv.id} className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div>
                <div className="ux-icon-box" style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${theme.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  {renderServiceIcon(srv.icon, theme.primary)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.primaryDark, margin: '0 0 8px 0' }}>{srv.title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#64748B', margin: '0 0 16px 0' }}>{srv.description}</p>
              </div>
              <a
                href="#booking"
                style={{ color: theme.primary, textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Consult Doctor</span>
                <span>&rarr;</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. CLINIC LOCATION, TIMINGS & MAP FACADE                  */}
      {/*    (MATCHING USER'S UPLOADED IMAGE EXACTLY)               */}
      {/* ========================================================= */}
      <section id="clinic" style={{ background: theme.bg, padding: '64px 24px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Clinic Visit
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>Visit {content.clinic.name}</h2>
            <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
              Conveniently located in Central Market, Sector 18 Noida with dedicated parking and metro accessibility.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
            
            {/* Left Card: Exactly matching user uploaded image */}
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Tagline Quote */}
              <div style={{ color: '#16A34A', fontStyle: 'italic', fontWeight: '700', fontSize: '17px' }}>
                {content.clinic.taglineQuote || '"We Nurture Your Health, Every Day"'}
              </div>

              {/* Clinic Address */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="ux-icon-box" style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPinIcon size={20} color={theme.primary} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>Clinic Address:</strong>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#475569' }}>
                    {content.clinic.street}, {content.clinic.area}, {content.clinic.city}, {content.clinic.state} – {content.clinic.pincode}
                  </p>
                </div>
              </div>

              {/* Consultation Schedule Table */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="ux-icon-box" style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClockIcon size={20} color={theme.primary} />
                </div>
                <div style={{ width: '100%' }}>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0F172A', marginBottom: '8px' }}>Consultation Schedule:</strong>
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 0', color: '#64748B' }}>Monday – Friday:</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                          {content.clinic.schedule?.weekdayHours?.replace('Monday – Friday:', '').trim() || '09:00 AM – 08:00 PM'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 0', color: '#64748B' }}>Saturday:</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                          {content.clinic.schedule?.saturdayHours?.replace('Saturday:', '').trim() || '09:00 AM – 04:00 PM'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: '#64748B' }}>Sunday:</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#DC2626' }}>
                          {content.clinic.schedule?.sundayHours?.replace('Sunday:', '').trim() || 'Closed (Emergency On-Call)'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consultation Fee & Policy */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="ux-icon-box" style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BanknoteIcon size={20} color={theme.primary} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>Consultation Fee &amp; Policy:</strong>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#475569' }}>
                    {content.clinic.feePolicy}
                  </p>
                </div>
              </div>

              {/* Clinic Amenities */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="ux-icon-box" style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${theme.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BuildingIcon size={20} color={theme.primary} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0F172A', marginBottom: '8px' }}>Clinic Amenities:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {content.clinic.amenities.map((amenity, idx) => (
                      <span key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckIcon size={12} color="#16A34A" />
                        <span>{amenity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Card: Google Map Facade & Transit Guidance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Map Facade Box */}
              <div
                className="ux-card"
                style={{
                  flex: 1,
                  background: '#E2E8F0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #CBD5E1',
                  minHeight: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {!showInteractiveMap ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '280px',
                      backgroundImage: content.clinic.photoUrl ? `url(${content.clinic.photoUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: content.clinic.photoUrl ? 'rgba(255,255,255,0.85)' : 'transparent', backdropFilter: content.clinic.photoUrl ? 'blur(2px)' : 'none' }} />
                    <div style={{ textAlign: 'center', padding: '32px', position: 'relative', zIndex: 2 }}>
                      <div className="ux-icon-box" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '12px' }}>
                        <MapPinIcon size={28} color="#DC2626" />
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', color: '#0F172A' }}>
                        {content.clinic.mapLocationName}
                      </h4>
                      <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748B' }}>
                        {content.clinic.mapSubtitle}
                      </p>
                      <button
                        type="button"
                        className="ux-btn"
                        onClick={() => setShowInteractiveMap(true)}
                        style={{
                          background: '#FFFFFF',
                          color: theme.primary,
                          border: `1px solid ${theme.primary}`,
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                      >
                        Click to Load Interactive Google Map
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    title="Clinic Interactive Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '320px' }}
                    loading="lazy"
                    allowFullScreen
                    src={content.clinic.googleMapEmbedUrl}
                  />
                )}
              </div>

              {/* Transit & Parking Guidance Card */}
              <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
                <strong style={{ color: theme.primaryDark }}>Transit &amp; Parking Guidance: </strong>
                {content.clinic.transitGuidance}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. PATIENT REVIEWS (VERIFIED CLINICAL FEEDBACK)           */}
      {/* ========================================================= */}
      <section id="reviews" style={{ padding: '64px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Patient Feedback
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
            What Patients Say About {content.doctor.name}
          </h2>
          <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
            Real, verified clinical experiences from families treated at our clinic.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {content.reviews?.map((rev) => (
            <div key={rev.id} className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                    {rev.treatment}
                  </span>
                  <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <StarIcon key={i} size={15} color="#F59E0B" fill="#F59E0B" />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#475569', fontStyle: 'italic', margin: '0 0 16px 0' }}>
                  &quot;{rev.reviewText}&quot;
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: theme.bg, color: theme.primaryDark, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                  {rev.patientName[0]}
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: '#0F172A' }}>{rev.patientName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Verified Patient &bull; {rev.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDIONS)            */}
      {/* ========================================================= */}
      <section id="faq" style={{ background: '#F8FAFC', padding: '64px 24px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Common Patient Enquiries
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>Frequently Asked Questions</h2>
            <p style={{ color: '#64748B', fontSize: '15px' }}>
              Quick answers about consultation hours, fees, diagnostic tests, and appointments.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {content.faqs?.map((faq, idx) => (
              <details
                key={faq.id}
                open={idx === 0}
                className="ux-card"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  padding: '16px 20px',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: '700', fontSize: '15px', color: theme.primaryDark, outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{faq.question}</span>
                  <ChevronDownIcon size={18} color="#64748B" />
                </summary>
                <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', lineHeight: 1.6, color: '#475569', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. IN-CLINIC APPOINTMENT BOOKING FORM                    */}
      {/* ========================================================= */}
      <section id="booking" style={{ padding: '64px 24px', maxWidth: '840px', margin: '0 auto' }}>
        <div className="ux-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '26px', color: theme.primaryDark }}>Request an In-Clinic Appointment</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
              Fill your details below. Front desk ({content.doctor.name} clinic) will confirm your exact slot via WhatsApp/call.
            </p>
          </div>

          {submitSuccess && confirmedDetails ? (
            <div style={{ background: '#F8FAFC', border: '2px solid #86EFAC', borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircleIcon size={28} color="#15803D" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#166534', fontWeight: '800' }}>
                      Appointment Slip Confirmed!
                    </h4>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Ref ID: <strong>{submittedAptId}</strong> &bull; Scheduled with {content.doctor.name}
                    </div>
                  </div>
                </div>

                {/* Token Badge */}
                <div style={{ background: '#0F766E', color: '#FFFFFF', padding: '8px 18px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>OPD TOKEN</div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>#{confirmedToken < 10 ? `0${confirmedToken}` : confirmedToken}</div>
                </div>
              </div>

              {/* Slip Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#FFFFFF', padding: '18px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Patient Name</div>
                  <strong style={{ color: '#0F172A', fontSize: '14px' }}>{confirmedDetails.patientName}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Phone Number</div>
                  <strong style={{ color: '#0F172A', fontSize: '14px' }}>{confirmedDetails.phone}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Clinical Specialty</div>
                  <strong style={{ color: '#0F766E', fontSize: '14px' }}>{confirmedDetails.service}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Confirmed Slot Time</div>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>{confirmedDetails.date} ({confirmedDetails.time})</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Consultation Fee</div>
                  <strong style={{ color: '#0F172A', fontSize: '14px' }}>₹{content.doctor.consultationFee} (7-day free follow-up)</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Clinic Address</div>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>Sector 18, Noida (Near Metro Gate 2)</strong>
                </div>
              </div>

              {/* Actions Strip: Download Slip, Calendar .ics, Maps */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ux-btn"
                  style={{
                    background: '#0F766E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <PrinterIcon size={16} color="#FFFFFF" />
                  <span>Print / Save Slip</span>
                </button>

                <button
                  type="button"
                  onClick={downloadIcsCalendar}
                  className="ux-btn"
                  style={{
                    background: '#FFFFFF',
                    color: '#0F766E',
                    border: '1px solid #0F766E',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CalendarIcon size={16} color="#0F766E" />
                  <span>Add to Calendar (.ics)</span>
                </button>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(content.clinic.mapLocationName + ' ' + content.clinic.area + ' ' + content.clinic.city)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ux-btn"
                  style={{
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <MapPinIcon size={16} color="#334155" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20Sunita,%20I%20have%20booked%20appointment%20${submittedAptId}%20with%20Token%20%23${confirmedToken}%20for%20${encodeURIComponent(confirmedDetails.patientName)}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="ux-btn"
                  style={{
                    background: '#DCFCE7',
                    color: '#15803D',
                    border: '1px solid #86EFAC',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <MessageCircleIcon size={16} color="#15803D" />
                  <span>WhatsApp Desk</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setFormData({
                      patientName: '',
                      phone: '',
                      service: content.services[0]?.title || 'General Health Checkup',
                      preferredDate: '',
                      shift: 'Morning',
                      notes: '',
                    });
                  }}
                  className="ux-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    padding: '10px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginLeft: 'auto',
                  }}
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. LIVE SLOT PICKER */}
              <div style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}25`, borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: theme.primaryDark, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon size={16} color={theme.primary} />
                    <span>1. Pick Available Consultation Slot (Live CDN Availability)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                    Next: {content.availability?.nextAvailableSlot || 'Today 5:30 PM'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {(content.availability?.todaySlots || [
                    { id: 's1', time: '05:30 PM', period: 'evening', available: true },
                    { id: 's2', time: '06:00 PM', period: 'evening', available: true },
                    { id: 's3', time: '06:30 PM', period: 'evening', available: false },
                    { id: 's4', time: '07:00 PM', period: 'evening', available: true },
                    { id: 's5', time: '10:00 AM', period: 'morning', available: true },
                    { id: 's6', time: '10:30 AM', period: 'morning', available: true },
                  ]).map((slot) => {
                    const isSelected = selectedSlotTime === slot.time;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => {
                          setSelectedSlotTime(slot.time);
                          setFormData({
                            ...formData,
                            shift: slot.period === 'morning' ? 'Morning' : 'Evening',
                            preferredDate: (slot.period === 'morning' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]) ?? '',
                          });
                        }}
                        className="ux-btn"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isSelected
                            ? `2px solid ${theme.primary}`
                            : slot.available
                            ? '1px solid #CBD5E1'
                            : '1px dashed #E2E8F0',
                          background: isSelected
                            ? '#FFFFFF'
                            : slot.available
                            ? '#FFFFFF'
                            : '#F1F5F9',
                          color: isSelected
                            ? theme.primary
                            : slot.available
                            ? '#0F172A'
                            : '#94A3B8',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: isSelected ? `0 4px 12px ${theme.primary}25` : 'none',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '800' }}>{slot.time}</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', color: isSelected ? theme.primary : slot.available ? '#16A34A' : '#94A3B8' }}>
                          {isSelected ? 'Selected' : slot.available ? slot.period : 'Reserved'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. PATIENT CONTACT DETAILS */}
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                2. Patient Contact Details
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Deshmukh"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Phone Number (for WhatsApp Confirmation &amp; Token) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Clinical Specialty</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {content.services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Preferred Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="Morning">Morning ({content.clinic.morningHours || '09:00 AM – 01:30 PM'})</option>
                    <option value="Evening">Evening ({content.clinic.eveningHours || '04:30 PM – 08:00 PM'})</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Symptoms / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting blood test review, chronic knee stiffness..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="ux-btn"
                style={{
                  background: theme.primary,
                  color: '#FFFFFF',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: `0 4px 12px ${theme.primary}40`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <CalendarIcon size={18} color="#FFFFFF" />
                <span>{submitting ? 'Generating OPD Token...' : `Confirm Slot ${selectedSlotTime ? `(${selectedSlotTime})` : ''}`}</span>
              </button>

              <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <LockIcon size={13} color="#94A3B8" />
                <span>DPDP Act 2023 Compliant. Your personal data is encrypted and used solely for consultation scheduling.</span>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. SEMANTIC FOOTER                                       */}
      {/* ========================================================= */}
      <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '48px 24px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>{content.clinic.name}</div>
            <p style={{ lineHeight: 1.6, margin: 0 }}>
              {content.doctor.name} ({content.doctor.degree})<br />
              Registration Lic: {content.doctor.registrationNumber}<br />
              {content.doctor.medicalCouncil}
            </p>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>Contact &amp; Emergency</div>
            <p style={{ lineHeight: 1.6, margin: 0 }}>
              Phone: {content.doctor.phone}<br />
              WhatsApp: {content.doctor.whatsappNumber}<br />
              Email: {content.doctor.email}
            </p>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>Consultation Standards</div>
            <p style={{ lineHeight: 1.6, margin: 0 }}>
              &bull; Evidence-based clinical guidelines<br />
              &bull; 7-day complimentary follow-up<br />
              &bull; Zero unsolicited medicine promotion
            </p>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>7-Page Directory</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <Link href="/about" style={{ color: '#94A3B8', textDecoration: 'none' }}>About Doctor</Link>
              <Link href="/services" style={{ color: '#94A3B8', textDecoration: 'none' }}>Treatments &amp; Services</Link>
              <Link href="/doctors" style={{ color: '#94A3B8', textDecoration: 'none' }}>Doctors &amp; Specialists</Link>
              <Link href="/testimonials-faq" style={{ color: '#94A3B8', textDecoration: 'none' }}>Reviews &amp; FAQs</Link>
              <Link href="/blog" style={{ color: '#94A3B8', textDecoration: 'none' }}>Health Blog</Link>
              <Link href="/contact" style={{ color: '#94A3B8', textDecoration: 'none' }}>Contact &amp; Booking</Link>
            </div>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>System Controls</div>
            <Link
              href="/cms"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              <KeyIcon size={14} color="#FFFFFF" />
              <span>Staff CMS Login &rarr;</span>
            </Link>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '24px', textAlign: 'center', fontSize: '12px' }}>
          &copy; {new Date().getFullYear()} {content.clinic.name}. Powered by DoctorSite Pro &bull; Cloudflare Edge Architecture.
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 12. MOBILE PERSISTENT STICKY CTA BAR (HIDDEN ON DESKTOP!) */}
      {/* ========================================================= */}
      <aside className="mobile-sticky-cta" aria-label="Mobile Emergency Actions">
        <a
          href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
          style={{
            flex: 1,
            background: theme.primary,
            color: '#FFFFFF',
            padding: '10px',
            borderRadius: '6px',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <PhoneIcon size={16} color="#FFFFFF" />
          <span>Call</span>
        </a>
        <a
          href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            background: '#047857',
            color: '#FFFFFF',
            padding: '10px',
            borderRadius: '6px',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <MessageCircleIcon size={16} color="#FFFFFF" />
          <span>WhatsApp</span>
        </a>
        <a
          href="#booking"
          style={{
            flex: 1.2,
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px',
            borderRadius: '6px',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <CalendarIcon size={16} color="#FFFFFF" />
          <span>Book Slot</span>
        </a>
      </aside>

    </div>
  );
}
