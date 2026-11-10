'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  MapPinIcon,
  PhoneIcon,
  MessageCircleIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  PrinterIcon,
  BuildingIcon,
  SendIcon,
} from '@/components/Icons';

export default function ContactAndBookingPage() {
  const { content, theme } = useClinicContent();

  // Form state
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    service: 'General Internal Medicine & OPD Consultation',
    preferredDate: '',
    shift: 'Evening' as 'Morning' | 'Afternoon' | 'Evening',
    notes: '',
  });

  const [selectedSlot, setSelectedSlot] = useState<string>('05:30 PM');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<number>(8);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Enquiry state
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');

  const handleBook = async (e: React.FormEvent) => {
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
          patientName: formData.patientName,
          phone: formData.phone,
          service: formData.service,
          preferredDate: formData.preferredDate || new Date().toISOString().split('T')[0],
          shift: formData.shift,
          notes: `Selected Slot: ${selectedSlot}. ${formData.notes}`.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const apt = data.appointment;
        setConfirmedToken(apt?.tokenNumber || (content?.availability?.currentServingToken ? content.availability.currentServingToken + 4 : 8));
        setSubmitSuccess(true);
      } else {
        alert('Failed to submit appointment. Please call the clinic directly.');
      }
    } catch {
      alert('Error submitting appointment. Please call the clinic directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone) {
      alert('Please enter your name and phone number.');
      return;
    }
    setEnquirySent(true);
  };

  const downloadIcs = () => {
    const today = (formData.preferredDate || new Date().toISOString().split('T')[0])?.replace(/-/g, '') ?? '';
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DoctorSite Pro//Clinic Appointment//EN',
      'BEGIN:VEVENT',
      `SUMMARY:OPD Appointment - Dr. Maanvita Kumari (Token #${confirmedToken})`,
      `DESCRIPTION:Consultation: ${formData.service}. Token Number #${confirmedToken}. HealthConsult Clinic, Sector 18 Noida.`,
      `LOCATION:${content.clinic.street}, ${content.clinic.area}, ${content.clinic.city}`,
      `DTSTART:${today}T120000Z`,
      `DTEND:${today}T123000Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthconsult-token-${confirmedToken}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Hero Banner */}
      <section
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`,
          padding: '60px 24px 30px 24px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: 700,
              color: theme.primary,
              marginBottom: '16px',
            }}
          >
            <CalendarIcon size={14} color={theme.primary} />
            <span>ONLINE APPOINTMENT DESK &bull; LIVE TOKEN QUEUE CONFIRMATION</span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
            Book Consultation &amp; Visit Clinic
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#64748B',
              maxWidth: '750px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            Reserve an outpatient appointment with Dr. Maanvita Kumari (MBBS, MD) at HealthConsult Family Clinic, Sector 18, Noida. Receive immediate digital token confirmation.
          </p>
        </div>
      </section>

      {/* Main Grid: Form + Clinic Details */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '40px',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Interactive Appointment Form */}
          <div
            style={{
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              padding: '36px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
            }}
          >
            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  <CheckCircleIcon size={36} color="#059669" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
                  Appointment Confirmed!
                </h2>
                <div style={{ fontSize: '15px', color: '#64748B', marginBottom: '24px' }}>
                  Your estimated token is <strong>#{confirmedToken}</strong> for <strong>{formData.patientName}</strong>.
                </div>

                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    textAlign: 'left',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                  }}
                >
                  <div><strong>Doctor:</strong> {content.doctor.name}</div>
                  <div><strong>Consultation:</strong> {formData.service}</div>
                  <div><strong>Session / Slot:</strong> {formData.shift} ({selectedSlot})</div>
                  <div><strong>Location:</strong> HealthConsult Clinic, Sector 18 Noida</div>
                  <div><strong>OPD Consultation Fee:</strong> ₹{content.doctor.consultationFee} (Payable at clinic desk)</div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={downloadIcs}
                    style={{
                      background: theme.primary,
                      color: '#FFFFFF',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CalendarIcon size={15} color="#FFFFFF" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setFormData({ patientName: '', phone: '', service: 'General Internal Medicine & OPD Consultation', preferredDate: '', shift: 'Evening', notes: '' });
                    }}
                    style={{
                      background: '#FFFFFF',
                      color: '#475569',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Book Another Slot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                  In-Clinic Appointment Booking
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px 0' }}>
                  Fill out the form below. Average OPD wait time is under 15 minutes.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Patient Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Contact Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                      Encrypted under DPDP Act 2023. Used solely for consultation confirmation.
                    </span>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Clinical Specialty / Treatment
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                      }}
                    >
                      {content.services.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shift & Time Slot */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Preferred OPD Session
                      </label>
                      <select
                        value={formData.shift}
                        onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '14px',
                          background: '#FFFFFF',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="Morning">Morning (09:00 AM - 01:00 PM)</option>
                        <option value="Evening">Evening (05:00 PM - 08:00 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Preferred Slot Time
                      </label>
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '14px',
                          background: '#FFFFFF',
                          boxSizing: 'border-box',
                        }}
                      >
                        {formData.shift === 'Morning' ? (
                          <>
                            <option value="09:30 AM">09:30 AM</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="10:30 AM">10:30 AM</option>
                            <option value="11:15 AM">11:15 AM</option>
                            <option value="12:00 PM">12:00 PM</option>
                          </>
                        ) : (
                          <>
                            <option value="05:30 PM">05:30 PM</option>
                            <option value="06:00 PM">06:00 PM</option>
                            <option value="06:30 PM">06:30 PM</option>
                            <option value="07:00 PM">07:00 PM</option>
                            <option value="07:30 PM">07:30 PM</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Clinical Notes / Symptoms */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Primary Symptoms or Medical Concerns (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Elevated fasting blood glucose, fever for 3 days, routine annual health checkup..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* DPDP Act Patient Consent Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="consent-check"
                      required
                      defaultChecked
                      style={{ marginTop: '3px' }}
                    />
                    <label htmlFor="consent-check" style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                      I consent to HealthConsult Family Clinic securely recording my appointment details and transmitting token notifications via SMS/WhatsApp in compliance with DPDP Act 2023.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: theme.primary,
                      color: '#FFFFFF',
                      padding: '14px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '15px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <CalendarIcon size={18} color="#FFFFFF" />
                    <span>{submitting ? 'Confirming Token...' : 'Confirm In-Clinic Appointment'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Clinic Information & Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Contact Desk */}
            <div
              style={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '28px',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>
                Clinic Location &amp; Contact Desk
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <MapPinIcon size={20} color={theme.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {content.clinic.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px', lineHeight: '1.5' }}>
                      {content.clinic.street}, {content.clinic.area}, {content.clinic.city}, {content.clinic.state} - {content.clinic.pincode}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                      {content.clinic.transitGuidance}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PhoneIcon size={18} color={theme.primary} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Front Desk Telephone:</div>
                    <a
                      href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
                      style={{ fontSize: '14px', fontWeight: 700, color: theme.primary, textDecoration: 'none' }}
                    >
                      {content.doctor.phone}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MessageCircleIcon size={18} color="#25D366" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>WhatsApp Consultation Desk:</div>
                    <a
                      href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '14px', fontWeight: 700, color: '#059669', textDecoration: 'none' }}
                    >
                      Chat on WhatsApp (+91 98765 43210)
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <ClockIcon size={18} color={theme.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    <strong>OPD Timings:</strong><br />
                    Mon - Fri: {content.clinic.schedule.weekdayHours}<br />
                    Saturday: {content.clinic.schedule.saturdayHours}<br />
                    Sunday: {content.clinic.schedule.sundayHours}
                  </div>
                </div>
              </div>
            </div>

            {/* Click-to-load Google Maps Facade (SD-045) */}
            <div
              style={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                  Interactive Clinic Map
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Sector 18 Central Market &bull; Metro Station Gate No. 2
                </div>
              </div>

              <div style={{ height: '240px', background: '#F1F5F9', position: 'relative' }}>
                {mapLoaded ? (
                  <iframe
                    src={content.clinic.googleMapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="HealthConsult Clinic Location"
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '20px',
                      textAlign: 'center',
                    }}
                  >
                    <MapPinIcon size={32} color={theme.primary} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                      Click to load Google Maps location
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapLoaded(true)}
                      style={{
                        background: theme.primary,
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Load Interactive Map
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Notice */}
            <div
              style={{
                borderRadius: '12px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                padding: '16px 20px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#991B1B', marginBottom: '4px' }}>
                Emergency Medical Care Protocol
              </div>
              <p style={{ fontSize: '12px', color: '#7F1D1D', margin: 0, lineHeight: '1.5' }}>
                For acute life-threatening emergencies (such as sudden chest pain, stroke signs, severe hemorrhage, or loss of consciousness), call national emergency services <strong>112</strong> or <strong>108</strong> immediately, or proceed to the nearest emergency trauma center at Fortis Hospital Noida Sector 62.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Public Footer */}
      <PublicFooter content={content} theme={theme} />
    </div>
  );
}
