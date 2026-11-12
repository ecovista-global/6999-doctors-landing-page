'use client';

import React, { useEffect, useState } from 'react';
import { useClinicContent } from '@/lib/useClinicContent';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  MapPinIcon,
  PhoneIcon,
  MessageCircleIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  PrinterIcon,
} from '@/components/Icons';
import { AppointmentSlipModal } from '@/components/public/AppointmentSlipModal';
import { getGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendarExport';

export default function ContactAndBookingPage() {
  const { content } = useClinicContent();
  const [showSlipModal, setShowSlipModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0] || '';
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; department?: string; fee?: number | string }>>(
    CLINICAL_DOCTORS.map((d) => ({ id: d.id, name: d.name, fee: d.fee }))
  );
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    doctor: CLINICAL_DOCTORS[0]?.name || 'Dr. Maanvita Kumari',
    doctorId: '',
    service: 'General Internal Medicine & OPD Consultation',
    preferredDate: todayStr,
    shift: 'Evening' as 'Morning' | 'Afternoon' | 'Evening',
    notes: '',
  });

  const [selectedSlot, setSelectedSlot] = useState<string>('05:30 PM');
  const [liveSlots, setLiveSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAptId, setSubmittedAptId] = useState('');
  const [confirmedToken, setConfirmedToken] = useState<number>(8);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qDoctor = params.get('doctor');
      const qDoctorId = params.get('doctorId');
      const qService = params.get('service');
      if (qDoctor || qDoctorId || qService) {
        setFormData((prev) => ({
          ...prev,
          doctor: qDoctor || prev.doctor,
          doctorId: qDoctorId || prev.doctorId,
          service: qService || prev.service,
        }));
      }
    }

    fetch('/api/v1/public/doctors')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setDoctors(data.items);
          setFormData((prev) => {
            const matched = data.items.find(
              (d: any) => d.name === prev.doctor || d.id === prev.doctorId
            );
            return matched
              ? { ...prev, doctor: matched.name, doctorId: matched.id }
              : { ...prev, doctor: data.items[0].name, doctorId: data.items[0].id };
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const targetDate = formData.preferredDate || todayStr;
    if (!targetDate) return;
    const qs = new URLSearchParams({ date: targetDate });
    if (formData.doctorId && /^[0-9a-f-]{36}$/i.test(formData.doctorId)) {
      qs.set('doctorId', formData.doctorId);
    } else if (formData.doctor) {
      qs.set('doctor', formData.doctor);
    }
    fetch(`/api/v1/public/availability?${qs.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.isClosed) {
          const avail = Array.isArray(data.availableSlots) ? data.availableSlots : [];
          const booked = Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
          setIsDayClosed(false);
          setLiveSlots(avail);
          setBookedSlots(booked);
          if (avail.length > 0 && !avail.includes(selectedSlot)) {
            setSelectedSlot(avail[0]);
          }
        } else {
          setIsDayClosed(Boolean(data?.isClosed));
          setLiveSlots([]);
          setBookedSlots([]);
        }
      })
      .catch(() => {});
  }, [formData.preferredDate, formData.doctor, formData.doctorId, todayStr]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!formData.patientName || !formData.phone) {
      setBookingError('Please provide your name and phone number.');
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
          doctor: formData.doctor,
          service: formData.service,
          preferredDate: formData.preferredDate || todayStr,
          shift: formData.shift,
          preferredTimeSlot: selectedSlot,
          notes: `Doctor: ${formData.doctor}. Selected Slot: ${selectedSlot}. ${formData.notes}`.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const apt = data.appointment;
        setSubmittedAptId(apt?.id || '');
        setConfirmedToken(
          apt?.tokenNumber ||
            (content?.availability?.currentServingToken ? content.availability.currentServingToken + 4 : 8)
        );
        setSubmitSuccess(true);
      } else if (res.status === 409) {
        const errData = await res.json().catch(() => ({}));
        setBookingError(
          errData?.error ||
            `${selectedSlot} with ${formData.doctor} on ${formData.preferredDate || todayStr} is already reserved. Please pick another slot.`
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        setBookingError(errData?.error || 'Failed to submit appointment. Please call the clinic directly.');
      }
    } catch {
      setBookingError('Error submitting appointment. Please call the clinic directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const fallbackSlots =
    formData.shift === 'Morning'
      ? ['09:30 AM', '10:00 AM', '10:30 AM', '11:15 AM', '12:00 PM']
      : ['05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'];
  const slotList = liveSlots.length > 0 ? liveSlots : isDayClosed ? [] : fallbackSlots;

  return (
    <div className="ms-public-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <PublicHeader content={content} />

      <main id="main-content">
        <section className="ms-subhero">
          <div className="ms-wrap ms-subhero-centered">
            <div className="ms-badge-pill">
              <span className="ms-dot-live" aria-hidden="true" />
              <span>Online Appointment Desk &bull; Live Token Queue Confirmation</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '820px', marginBottom: '12px' }}>
              Book Consultation &amp;{' '}
              <span className="ms-hero-serif">Visit Clinic</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '720px', margin: 0 }}>
              Reserve an outpatient appointment with {content.doctor.name}, {content.doctor.degree}, at {content.clinic.name}, {content.clinic.area}, {content.clinic.city}.
            </p>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap ms-split-2">
            {/* Left Column: Editorial Multi-Doctor Booking Card */}
            <div
              id="lead-form"
              className="ms-editorial-card"
              style={{ padding: 'clamp(22px, 3vw, 34px)', boxShadow: 'var(--shadow-editorial-md)' }}
            >
              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div
                    style={{
                      width: '62px',
                      height: '62px',
                      borderRadius: '50%',
                      background: 'var(--mint)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px auto',
                    }}
                  >
                    <CheckCircleIcon size={32} color="var(--brand)" />
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
                    Appointment Confirmed
                  </h2>
                  <p className="ms-desc" style={{ marginBottom: '20px' }}>
                    Estimated Token <strong>#{confirmedToken}</strong> for <strong>{formData.patientName}</strong>.
                  </p>

                  <div
                    className="ms-surface-box"
                    style={{
                      textAlign: 'left',
                      marginBottom: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '14px',
                      color: 'var(--ink)',
                    }}
                  >
                    <div><strong>Specialist:</strong> {formData.doctor}</div>
                    <div><strong>Consultation:</strong> {formData.service}</div>
                    <div><strong>Session / Slot:</strong> {formData.shift} ({selectedSlot})</div>
                    <div>
                      <strong>Location:</strong> {content.clinic.name}, {content.clinic.area}, {content.clinic.city}
                    </div>
                    <div>
                      <strong>OPD Fee:</strong> &#8377;{content.doctor.consultationFee} (Payable at clinic desk)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowSlipModal(true)}
                      className="ms-pill ms-pill-dark"
                      style={{ minHeight: '42px', fontSize: '13.5px' }}
                    >
                      <PrinterIcon size={15} color="#FFFFFF" />
                      <span>Print Appointment Slip</span>
                    </button>

                    <a
                      href={getGoogleCalendarUrl({
                        patientName: formData.patientName,
                        doctorName: formData.doctor,
                        clinicName: content.clinic.name,
                        service: formData.service,
                        date: formData.preferredDate || todayStr,
                        time: selectedSlot,
                        tokenNumber: confirmedToken,
                        clinicAddress: `${content.clinic.street}, ${content.clinic.area}, ${content.clinic.city}`,
                        phone: content.doctor.phone,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-pill ms-pill-light"
                      style={{ minHeight: '42px', fontSize: '13.5px' }}
                    >
                      <CalendarIcon size={14} color="var(--brand)" />
                      <span>Google Calendar</span>
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        downloadIcsFile({
                          patientName: formData.patientName,
                          doctorName: formData.doctor,
                          clinicName: content.clinic.name,
                          service: formData.service,
                          date: formData.preferredDate || todayStr,
                          time: selectedSlot,
                          tokenNumber: confirmedToken,
                          clinicAddress: `${content.clinic.street}, ${content.clinic.area}, ${content.clinic.city}`,
                          phone: content.doctor.phone,
                        })
                      }
                      className="ms-pill ms-pill-light"
                      style={{ minHeight: '42px', fontSize: '13.5px' }}
                    >
                      <ClockIcon size={14} color="var(--brand)" />
                      <span>Download .ics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmitSuccess(false);
                        setFormData((prev) => ({
                          ...prev,
                          patientName: '',
                          phone: '',
                          service: 'General Internal Medicine & OPD Consultation',
                          preferredDate: todayStr,
                          shift: 'Evening',
                          notes: '',
                        }));
                      }}
                      className="ms-pill ms-pill-light"
                      style={{ minHeight: '42px', fontSize: '13.5px' }}
                    >
                      <span>Book Another Slot</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBook}>
                  <h2 style={{ fontSize: '23px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    In-Clinic Appointment Booking
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 22px 0' }}>
                    Real-time multi-doctor slot reservation. Average OPD wait time is under 15 minutes.
                  </p>

                  {bookingError && (
                    <div role="alert" className="ms-alert-error" style={{ marginBottom: '16px' }}>
                      {bookingError}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="ms-form-row-2">
                      <div>
                        <label htmlFor="contact-doctor" className="ms-label">
                          Consulting Specialist *
                        </label>
                        <select
                          id="contact-doctor"
                          value={formData.doctor}
                          onChange={(e) => {
                            const docName = e.target.value;
                            const matched = doctors.find((d) => d.name === docName);
                            setBookingError(null);
                            setFormData({
                              ...formData,
                              doctor: docName,
                              doctorId: matched?.id || '',
                            });
                          }}
                          className="ms-field"
                        >
                          {doctors.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                              {d.department ? ` (${d.department})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="contact-date" className="ms-label">
                          Preferred Date *
                        </label>
                        <input
                          id="contact-date"
                          type="date"
                          min={todayStr}
                          value={formData.preferredDate}
                          onChange={(e) => {
                            setBookingError(null);
                            setFormData({ ...formData, preferredDate: e.target.value });
                          }}
                          className="ms-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-name" className="ms-label">
                        Patient Full Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        placeholder="e.g. Ramesh Sharma"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        className="ms-field"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="ms-label">
                        Contact Mobile Number *
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="ms-field"
                      />
                      <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '5px', display: 'block' }}>
                        Encrypted under DPDP Act 2023. Used solely for consultation confirmation.
                      </span>
                    </div>

                    <div className="ms-form-row-2">
                      <div>
                        <label htmlFor="contact-service" className="ms-label">
                          Clinical Specialty / Treatment
                        </label>
                        <select
                          id="contact-service"
                          value={formData.service}
                          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                          className="ms-field"
                        >
                          {content.services.map((s) => (
                            <option key={s.id} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="contact-shift" className="ms-label">
                          Preferred OPD Session
                        </label>
                        <select
                          id="contact-shift"
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                          className="ms-field"
                        >
                          <option value="Morning">Morning (09:00 AM - 01:00 PM)</option>
                          <option value="Evening">Evening (05:00 PM - 08:00 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="ms-label">Live OPD Time Slot *</span>
                      {isDayClosed ? (
                        <div className="ms-surface-box" style={{ padding: '12px 14px', fontSize: '13.5px', color: 'var(--muted)' }}>
                          Specialist OPD is closed on the selected date. Please pick another day or specialist.
                        </div>
                      ) : (
                        <div className="ms-slot-grid">
                          {slotList.map((slot) => {
                            const isBooked = bookedSlots.includes(slot);
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isBooked}
                                onClick={() => {
                                  setBookingError(null);
                                  setSelectedSlot(slot);
                                }}
                                className={`ms-slot-btn${isSelected ? ' active' : ''}`}
                              >
                                {slot}
                                {isBooked ? ' (Booked)' : ''}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact-notes" className="ms-label">
                        Primary Symptoms or Concerns (Optional)
                      </label>
                      <textarea
                        id="contact-notes"
                        rows={3}
                        placeholder="e.g. Elevated fasting blood glucose, fever for 3 days, routine annual checkup..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="ms-field"
                        style={{ minHeight: '88px', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="consent-check"
                        required
                        defaultChecked
                        style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                      />
                      <label htmlFor="consent-check" style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55 }}>
                        I consent to {content.clinic.name} securely recording my appointment details and sending token notifications in compliance with DPDP Act 2023.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || isDayClosed}
                      className="ms-pill ms-pill-dark ms-pill-block"
                    >
                      <CalendarIcon size={16} color="#FFFFFF" />
                      <span>
                        {submitting ? 'Confirming Token...' : `Confirm Visit (${selectedSlot})`}
                      </span>
                      <PillArrowIcon />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Clinic Details, Map Facade & Emergency */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="ms-editorial-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px 0' }}>
                  Clinic Location &amp; Contact Desk
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div className="ms-icon-tile" style={{ width: '38px', height: '38px' }}>
                      <MapPinIcon size={18} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
                        {content.clinic.name}
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '3px', lineHeight: 1.5 }}>
                        {content.clinic.street}, {content.clinic.area}, {content.clinic.city}, {content.clinic.state} &ndash;{' '}
                        {content.clinic.pincode}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--brand)', fontWeight: 600, marginTop: '4px' }}>
                        {content.clinic.transitGuidance}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="ms-icon-tile" style={{ width: '38px', height: '38px' }}>
                      <PhoneIcon size={17} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Front Desk Telephone</div>
                      <a
                        href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
                        className="ms-action-link"
                        style={{ minHeight: 'auto', fontSize: '15px' }}
                      >
                        {content.doctor.phone}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="ms-icon-tile" style={{ width: '38px', height: '38px' }}>
                      <MessageCircleIcon size={17} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>WhatsApp Consultation Desk</div>
                      <a
                        href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ms-action-link"
                        style={{ minHeight: 'auto', fontSize: '14.5px' }}
                      >
                        Chat on WhatsApp ({content.doctor.whatsappNumber})
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div className="ms-icon-tile" style={{ width: '38px', height: '38px' }}>
                      <ClockIcon size={17} color="currentColor" />
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
                      <strong>OPD Timings</strong>
                      <br />
                      <span style={{ color: 'var(--muted)' }}>
                        Mon &ndash; Fri: {content.clinic.schedule.weekdayHours}
                        <br />
                        Saturday: {content.clinic.schedule.saturdayHours}
                        <br />
                        Sunday: {content.clinic.schedule.sundayHours}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Click-to-load Interactive Map Facade */}
              <div className="ms-editorial-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                    Interactive Clinic Map
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    {content.clinic.area} &bull; {content.clinic.city}
                  </div>
                </div>

                <div style={{ height: '240px', background: 'var(--surface)', position: 'relative' }}>
                  {mapLoaded ? (
                    <iframe
                      src={content.clinic.googleMapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      title="Clinic Location Map"
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '20px',
                        textAlign: 'center',
                      }}
                    >
                      <MapPinIcon size={30} color="var(--brand)" />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                        Click below to load interactive Google Maps directions
                      </div>
                      <button
                        type="button"
                        onClick={() => setMapLoaded(true)}
                        className="ms-pill ms-pill-dark"
                        style={{ minHeight: '40px', padding: '0 18px', fontSize: '13.5px' }}
                      >
                        <span>Load Interactive Map</span>
                        <PillArrowIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Notice */}
              <div className="ms-alert-emergency">
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#991B1B', marginBottom: '4px' }}>
                  Emergency Medical Care Protocol
                </div>
                <p style={{ fontSize: '12.5px', color: '#7F1D1D', margin: 0, lineHeight: 1.55 }}>
                  For acute life-threatening emergencies (sudden chest pain, stroke signs, severe hemorrhage, or loss of consciousness), call national emergency services <strong>112</strong> or <strong>108</strong> immediately, or proceed to the nearest emergency trauma center at Fortis Hospital Noida Sector 62.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showSlipModal && (
        <AppointmentSlipModal
          isOpen={showSlipModal}
          onClose={() => setShowSlipModal(false)}
          appointment={{
            tokenNumber: confirmedToken,
            patientName: formData.patientName,
            phone: formData.phone,
            service: formData.service,
            date: formData.preferredDate || todayStr,
            time: selectedSlot,
            shift: formData.shift,
            id: submittedAptId,
          }}
          content={content}
        />
      )}

      <PublicFooter content={content} />
    </div>
  );
}
