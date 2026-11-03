'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DoctorContent } from '@/lib/contentStore';

const DEFAULT_PALETTE = { primary: '#0F766E', primaryDark: '#115E59', accent: '#047857', bg: '#F0FDF4', text: '#0F172A' };

const THEME_PALETTES: Record<string, { primary: string; primaryDark: string; accent: string; bg: string; text: string }> = {
  'Green Trust': { primary: '#0F766E', primaryDark: '#115E59', accent: '#047857', bg: '#F0FDF4', text: '#0F172A' },
  'Teal Poster': { primary: '#0284C7', primaryDark: '#0369A1', accent: '#0EA5E9', bg: '#F0F9FF', text: '#0F172A' },
  'Navy Gold': { primary: '#1E3A8A', primaryDark: '#172554', accent: '#D97706', bg: '#F8FAFC', text: '#0F172A' },
  'Sand Warmth': { primary: '#78350F', primaryDark: '#451A03', accent: '#B45309', bg: '#FFFBEB', text: '#1C1917' },
  'Slate Clean': { primary: '#334155', primaryDark: '#0F172A', accent: '#475569', bg: '#F8FAFC', text: '#0F172A' },
  'Rose Clinic': { primary: '#BE123C', primaryDark: '#881337', accent: '#E11D48', bg: '#FFF1F2', text: '#1F2937' },
};

export default function PatientLandingPage() {
  const [content, setContent] = useState<DoctorContent | null>(null);
  const [loading, setLoading] = useState(true);

  // Appointment Form State
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    service: 'Diabetes Management',
    preferredDate: '',
    shift: 'Morning' as 'Morning' | 'Afternoon' | 'Evening',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAptId, setSubmittedAptId] = useState('');

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
    // Poll every 4 seconds to reflect CMS updates live without manual page refresh
    const interval = setInterval(fetchContent, 4000);
    return () => clearInterval(interval);
  }, []);

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
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmittedAptId(data.appointment?.id || 'APT-CONFIRMED');
        setSubmitSuccess(true);
        setFormData({
          patientName: '',
          phone: '',
          service: 'Diabetes Management',
          preferredDate: '',
          shift: 'Morning',
          notes: '',
        });
        setTimeout(() => setSubmitSuccess(false), 8000);
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
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🩺</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading Clinical Presence...</div>
        </div>
      </div>
    );
  }

  const theme = (content?.theme && THEME_PALETTES[content.theme]) ? THEME_PALETTES[content.theme]! : DEFAULT_PALETTE;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Banner: CMS Shortcut & Live Sync Notice */}
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
          <span><strong>Live Clinical Edge:</strong> Active Theme: <strong>{content.theme}</strong> &bull; Synced with DoctorSite Pro CMS</span>
        </div>
        <Link
          href="/cms"
          style={{
            background: theme.primary,
            color: '#FFFFFF',
            padding: '5px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <span>🔐</span> Go to CMS Panel (Edit Content &amp; Manage Appointments) &rarr;
        </Link>
      </div>

      {/* Emergency Notice & Announcement Bar */}
      <div style={{ background: theme.bg, borderBottom: `1px solid ${theme.primary}33`, padding: '10px 24px', textAlign: 'center', fontSize: '13px', color: theme.primaryDark, fontWeight: '500' }}>
        🛡️ {content.announcement} &bull; Emergency Hotline: <strong>{content.doctor.phone}</strong>
      </div>

      {/* Main Header / Sticky Navbar */}
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
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: theme.primary, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            🩺
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', color: theme.primary }}>{content.clinic.name}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>{content.doctor.name} &bull; {content.doctor.degree}</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px', fontWeight: '500' }}>
          <a href="#credentials" style={{ textDecoration: 'none', color: '#334155' }}>Credentials</a>
          <a href="#services" style={{ textDecoration: 'none', color: '#334155' }}>Specialties</a>
          <a href="#timings" style={{ textDecoration: 'none', color: '#334155' }}>Clinic Hours</a>
          <a href="#booking" style={{ textDecoration: 'none', color: '#334155' }}>Book Appointment</a>
          <a
            href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📞 Call Clinic
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`, padding: '64px 24px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${theme.primary}15`, color: theme.primary, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px' }}>
              <span>✓</span> Verified Family Physician &bull; {content.doctor.registrationNumber}
            </div>
            <h1 style={{ fontSize: '42px', lineHeight: 1.2, fontWeight: '800', color: theme.primaryDark, margin: '0 0 16px 0' }}>
              {content.hero.headline}
            </h1>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#475569', margin: '0 0 28px 0' }}>
              {content.hero.subtitle}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <a
                href="#booking"
                style={{
                  background: theme.primary,
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  boxShadow: `0 4px 14px ${theme.primary}40`,
                }}
              >
                📅 Request Appointment
              </a>
              <a
                href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(content.doctor.name)},%20I%20would%20like%20to%20enquire%20about%20a%20consultation.`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#FFFFFF',
                  color: '#047857',
                  border: '2px solid #047857',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                💬 Chat on WhatsApp
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary }}>{content.hero.statExperience}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Clinical Practice</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary }}>{content.hero.statConsultations}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Consultations</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary }}>{content.hero.statRating}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Patient Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Doctor Portrait & Profile Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
              <div style={{ height: '340px', background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '120px' }}>👩‍⚕️</div>
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: '#0F172A', fontSize: '16px' }}>{content.doctor.name}</div>
                  <div style={{ color: theme.primary, fontSize: '12px', fontWeight: '600' }}>{content.doctor.degree}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>License: {content.doctor.registrationNumber} ({content.doctor.medicalCouncil})</div>
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
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: '600', textAlign: 'right' }}>
                    7-Day Free Follow-up<br />
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Specialties & Services */}
      <section id="services" style={{ padding: '64px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Specializations</div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>Comprehensive Outpatient Services</h2>
          <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px' }}>
            Evidence-based medical care customized for chronic health management, lifestyle wellness, and rapid acute recovery.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {content.services.map((srv) => (
            <div key={srv.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{srv.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.primaryDark, margin: '0 0 8px 0' }}>{srv.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#64748B', margin: 0 }}>{srv.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinic Walkthrough & Hours */}
      <section id="timings" style={{ background: '#F8FAFC', padding: '64px 24px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px' }}>
          <div>
            <div style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>Visit Our Clinic</div>
            <h2 style={{ fontSize: '30px', fontWeight: 'bold', margin: '8px 0 20px 0' }}>Location &amp; OPD Shift Hours</h2>
            <div style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
              📍 <strong>{content.clinic.name}</strong><br />
              {content.clinic.street}, {content.clinic.area}<br />
              {content.clinic.city}, {content.clinic.state} — {content.clinic.pincode}
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: theme.primaryDark }}>Consultation Timings:</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <span>🌅 Morning OPD:</span>
                <strong>{content.clinic.morningHours}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <span>🌇 Evening OPD:</span>
                <strong>{content.clinic.eveningHours}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748B' }}>
                <span>Sunday:</span>
                <span>{content.clinic.sundayHours}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {content.clinic.amenities.map((amenity, idx) => (
                <span key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#475569' }}>
                  ✓ {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Appointment Booking Form */}
          <div id="booking" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: theme.primaryDark }}>Request an In-Clinic Appointment</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B' }}>
              Fill your details below. Front desk ({content.doctor.name} clinic) will confirm your exact slot via WhatsApp/call.
            </p>

            {submitSuccess && (
              <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                🎉 <strong>Appointment Request Received! (Ref ID: {submittedAptId})</strong><br />
                Our receptionist Sunita has received your request in the CMS panel and will contact you via WhatsApp shortly to confirm your slot.
              </div>
            )}

            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Deshmukh"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Phone Number (for WhatsApp Confirmation) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Clinical Specialty</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {content.services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Preferred Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="Morning">Morning ({content.clinic.morningHours ? (content.clinic.morningHours.split('–')[0]?.trim() || '10:00 AM') : '10:00 AM'})</option>
                    <option value="Evening">Evening ({content.clinic.eveningHours ? (content.clinic.eveningHours.split('–')[0]?.trim() || '05:30 PM') : '05:30 PM'})</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Symptoms / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting blood test review, chronic knee stiffness..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
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
                }}
              >
                {submitting ? 'Submitting to Clinic...' : 'Confirm Appointment Request'}
              </button>

              <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
                🔒 DPDP Act 2023 Compliant. Your personal data is encrypted and used solely for consultation scheduling.
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
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
            <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>System Controls</div>
            <Link
              href="/cms"
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              🔐 Staff CMS Login &rarr;
            </Link>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '24px', textAlign: 'center', fontSize: '12px' }}>
          &copy; {new Date().getFullYear()} {content.clinic.name}. Powered by DoctorSite Pro &bull; Cloudflare Edge Architecture.
        </div>
      </footer>
    </div>
  );
}
