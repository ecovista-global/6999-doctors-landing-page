'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { DoctorContent } from '@/lib/contentStore';
import { FALLBACK_CONTENT } from '@/lib/useClinicContent';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';
import { CLINICAL_BLOG_POSTS, type ClinicalBlogPost } from '@/lib/blogPosts';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { AppointmentSlipModal } from '@/components/public/AppointmentSlipModal';
import {
  PhoneIcon,
  CalendarIcon,
  LockIcon,
  StethoscopeIcon,
  CheckCircleIcon,
} from '@/components/Icons';

interface PublicDoctorItem {
  id: string;
  name: string;
  slug?: string;
  qualification: string;
  department: string;
  experienceYears?: number;
  experienceLabel?: string;
  registrationNumber?: string;
  bio: string;
  photoUrl?: string | null;
  consultationFeeInr?: number;
  slotIntervalMinutes?: number;
}

const AVATAR_FALLBACKS = [
  '/images/avatar-1.jpg',
  '/images/avatar-2.jpg',
  '/images/avatar-3.jpg',
];

const EDITORIAL_SPECIALTIES = [
  {
    title: 'Cardiology & Heart Clinic',
    serviceValue: 'Hypertension & Preventive Cardiology',
    summary:
      'Preventive heart screening, lipid optimization, ECG evaluation, and long-term hypertension care.',
    label: 'ECG & Lipid Panel Review',
  },
  {
    title: 'Diabetes & Thyroid Clinic',
    serviceValue: 'Comprehensive Diabetes Evaluation',
    summary:
      'HbA1c trend tracking, thyroid titration, insulin review, and sustainable metabolic nutrition plans.',
    label: 'HbA1c & TSH Titration Trend',
  },
  {
    title: 'Internal Medicine & Fever Care',
    serviceValue: 'General Consultation & Acute Fever',
    summary:
      'Same-day acute fever diagnosis, respiratory triage, preventive panels, and multisystem care.',
    label: 'Same-Day Acute Evaluation',
  },
  {
    title: 'Paediatrics & Child Care',
    serviceValue: 'Family & Pediatric Care',
    summary:
      'Newborn growth tracking, school immunisations, adolescent care, and fever response guidance.',
    label: 'Growth & Vaccine Schedule',
  },
  {
    title: 'Orthopaedics & Joint Clinic',
    serviceValue: 'Preventive Health Screening',
    summary:
      'Evidence-backed osteoarthritis rehab, sports sprains, posture correction, and spine guidance.',
    label: 'Joint Mobility & Spine Plan',
  },
  {
    title: 'Clinical Nutrition & Women Care',
    serviceValue: 'Clinical Nutrition & Lifestyle',
    summary:
      'Antenatal screening coordination, PCOS metabolic plans, iron optimisation, and wellness reviews.',
    label: 'Antenatal & Preventive Pathway',
  },
];

const PATHWAY_STEPS = [
  {
    step: 'Step 01 · Symptom Intake & Lab Sync',
    description:
      'Share your symptoms or prior test panels ahead of time so your consultant starts prepared.',
    image: '/images/pathway-triage.jpg',
    alt: 'Medical coordinator syncing lab history and patient symptoms at intake',
  },
  {
    step: 'Step 02 · Noida OPD or Video Visit',
    description:
      'Choose calm in-person examination at Sector 18 Noida or encrypted HD teleconsultation from home.',
    image: '/images/pathway-consult.jpg',
    alt: 'Specialist physician performing an unhurried clinical consultation',
  },
  {
    step: 'Step 03 · 7-Day Care Follow-Up',
    description:
      'Receive a plain-language digital prescription summary and scheduled follow-up review.',
    image: '/images/pathway-followup.jpg',
    alt: 'Patient reviewing digital prescription follow-up guidance with specialist',
  },
];

const DEFAULT_FALLBACK_SLOTS = [
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
];

function splitHeadlineEditorial(headline: string): { lead: string; serifTail: string } {
  const clean = (headline || 'Your Health Deserves the right specialist').trim();
  const words = clean.split(/\s+/);
  if (words.length <= 2) {
    return { lead: '', serifTail: clean };
  }
  return {
    lead: words.slice(0, -2).join(' '),
    serifTail: words.slice(-2).join(' '),
  };
}

function SpecialtyChart({ index, label }: { index: number; label: string }) {
  const variant = index % 3;
  return (
    <svg
      viewBox="0 0 360 108"
      width="100%"
      height="108"
      aria-hidden="true"
      fill="none"
      style={{ borderRadius: '8px', display: 'block' }}
    >
      <rect width="360" height="108" rx="10" fill="#EFF7F9" />
      <rect x="16" y="16" width="38" height="38" rx="10" fill="#183C4A" />
      {variant === 0 && (
        <>
          <path d="M24 35h7l3-8 4 16 3-8h7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 68c28 0 34-36 58-36s26 42 50 42 28-28 54-28 32 30 56 30 30-22 52-22" stroke="#1F6D82" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {variant === 1 && (
        <>
          <path d="M35 26v18M26 35h18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="74" y="54" width="46" height="22" rx="6" fill="#BFE0EA" />
          <rect x="130" y="48" width="46" height="28" rx="6" fill="#77B8CA" />
          <rect x="186" y="42" width="46" height="34" rx="6" fill="#1F6D82" />
          <rect x="242" y="52" width="46" height="24" rx="6" fill="#183C4A" />
          <rect x="298" y="46" width="46" height="30" rx="6" fill="#0F2730" />
        </>
      )}
      {variant === 2 && (
        <>
          <circle cx="35" cy="35" r="8" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="35" cy="35" r="2.5" fill="#FFFFFF" />
          <polyline
            points="74,76 130,66 190,72 250,46 310,40 342,36"
            stroke="#183C4A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="250" cy="46" r="4.5" fill="#1F6D82" />
          <circle cx="342" cy="36" r="4.5" fill="#183C4A" />
        </>
      )}
      <text x="74" y="34" fill="#183C4A" fontSize="12" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
        {label}
      </text>
      <rect x="16" y="88" width="328" height="5" rx="2.5" fill="#D4E8EE" />
      <rect x="16" y="88" width="218" height="5" rx="2.5" fill="#183C4A" />
    </svg>
  );
}

export default function PatientLandingPage() {
  const [content, setContent] = useState<DoctorContent>(FALLBACK_CONTENT);
  const [doctorsRoster, setDoctorsRoster] = useState<PublicDoctorItem[]>(
    CLINICAL_DOCTORS.map((d) => ({
      id: d.id,
      name: d.name,
      qualification: d.degrees,
      department: d.role,
      experienceLabel: d.experience,
      registrationNumber: d.registration,
      bio: d.bio,
      photoUrl: null,
      consultationFeeInr: 700,
    }))
  );
  const [blogPosts, setBlogPosts] = useState<ClinicalBlogPost[]>(CLINICAL_BLOG_POSTS);

  const [activePathwayIndex, setActivePathwayIndex] = useState(0);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0] || '', []);
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    doctorId: '',
    doctor: CLINICAL_DOCTORS[0]?.name || 'Dr. Maanvita Kumari',
    service: 'Hypertension & Preventive Cardiology',
    preferredDate: '',
    shift: 'Evening' as 'Morning' | 'Evening',
    notes: '',
    consent: true,
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_FALLBACK_SLOTS);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('05:30 PM');

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAptId, setSubmittedAptId] = useState('');
  const [confirmedToken, setConfirmedToken] = useState<number>(8);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    patientName: string;
    phone: string;
    service: string;
    shift: string;
    date: string;
    time: string;
  } | null>(null);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch {
      // Fall back safely to initial snapshot
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      preferredDate: prev.preferredDate || todayStr,
    }));
    fetchContent();

    fetch('/api/v1/public/doctors')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setDoctorsRoster(data.items);
          setFormData((prev) => ({
            ...prev,
            doctorId: prev.doctorId || data.items[0].id,
            doctor: prev.doctor || data.items[0].name,
          }));
        }
      })
      .catch(() => {});

    fetch('/api/v1/public/posts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setBlogPosts(data.items);
        }
      })
      .catch(() => {});

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
  }, [todayStr]);

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
        if (!data) return;
        setIsDayClosed(Boolean(data.isClosed));
        const open = Array.isArray(data.availableSlots) ? data.availableSlots : [];
        const booked = Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
        setAvailableSlots(open.length > 0 || data.isClosed ? open : DEFAULT_FALLBACK_SLOTS);
        setBookedSlots(booked);
        if (open.length > 0 && (!selectedSlot || booked.includes(selectedSlot) || !open.includes(selectedSlot))) {
          setSelectedSlot(open[0]);
        }
      })
      .catch(() => {});
  }, [formData.preferredDate, formData.doctor, formData.doctorId, todayStr]);

  const scrollToBooking = (opts?: { service?: string; doctorId?: string; doctorName?: string }) => {
    setBookingError(null);
    setSubmitSuccess(false);
    setFormData((prev) => ({
      ...prev,
      service: opts?.service || prev.service,
      doctorId: opts?.doctorId ?? prev.doctorId,
      doctor: opts?.doctorName || prev.doctor,
    }));
    const el = document.getElementById('lead-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!formData.patientName.trim() || !formData.phone.trim()) {
      setBookingError('Please enter patient full name and mobile phone number.');
      return;
    }
    if (!formData.consent) {
      setBookingError('Please confirm DPDP Act 2023 scheduling consent to continue.');
      return;
    }
    if (isDayClosed) {
      setBookingError('The selected date falls on a closed clinic day. Please select another date.');
      return;
    }
    if (selectedSlot && bookedSlots.includes(selectedSlot)) {
      setBookingError(`${selectedSlot} with ${formData.doctor} is already reserved. Please choose an open time slot.`);
      return;
    }

    setSubmitting(true);
    try {
      const bookingDate = formData.preferredDate || todayStr;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.patientName.trim(),
          phone: formData.phone.trim(),
          doctor: formData.doctor,
          service: formData.service,
          preferredDate: bookingDate,
          shift: formData.shift,
          preferredTimeSlot: selectedSlot,
          notes: `Doctor: ${formData.doctor}. Selected Slot: ${selectedSlot}. ${formData.notes}`.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const apt = data.appointment;
        const token =
          apt?.tokenNumber ||
          (content?.availability?.currentServingToken ? content.availability.currentServingToken + 4 : 8);
        setSubmittedAptId(apt?.id || 'APT-CONFIRMED');
        setConfirmedToken(token);
        setConfirmedDetails({
          patientName: formData.patientName.trim(),
          phone: formData.phone.trim(),
          service: formData.service,
          shift: formData.shift,
          date: bookingDate,
          time: selectedSlot || '05:30 PM',
        });
        setSubmitSuccess(true);
        setBookedSlots((prev) => (selectedSlot ? [...prev, selectedSlot] : prev));
        setShowSlipModal(true);
      } else if (res.status === 409) {
        const errData = await res.json().catch(() => ({}));
        setBookingError(
          errData?.error || 'This slot was just reserved for this doctor. Please select another open slot.'
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        setBookingError(errData?.error || 'Unable to submit booking. Please call the reception desk directly.');
      }
    } catch {
      setBookingError('Network error while booking slot. Please retry or call the clinic directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const { lead: headlineLead, serifTail: headlineSerif } = splitHeadlineEditorial(
    content.hero.headline || 'Your Health Deserves the right specialist'
  );

  const heroPhotoSrc =
    content.doctor.photoUrl && !content.doctor.photoUrl.endsWith('.svg')
      ? content.doctor.photoUrl
      : '/images/hero-doctor.jpg';

  const serviceOptions = useMemo(() => {
    const merged = new Set<string>();
    EDITORIAL_SPECIALTIES.forEach((s) => merged.add(s.serviceValue));
    content.services.forEach((s) => merged.add(s.title));
    return Array.from(merged);
  }, [content.services]);

  const reviewsList = content.reviews.slice(0, 3);
  const faqsList = content.faqs.slice(0, 4);
  const blogList = blogPosts.slice(0, 3);
  const currentPathway = PATHWAY_STEPS[activePathwayIndex] || PATHWAY_STEPS[0]!;

  return (
    <div className="ms-public-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <PublicHeader content={content} />

      <main id="main-content">
        {/* SECTION 1: EDITORIAL SPLIT HERO */}
        <section id="hero" className="ms-hero">
          <div className="ms-wrap ms-grid-12" style={{ alignItems: 'center' }}>
            <div className="ms-col-span-5">
              <div className="ms-hero-pill" aria-live="polite">
                <span className="ms-dot-live" aria-hidden="true" />
                <span>
                  {content.clinic.area} OPD &bull; {content.clinic.schedule.weekdayHours} &bull; Serving Token #
                  {content.availability.currentServingToken || 4}
                </span>
              </div>

              <h1 className="ms-hero-title">
                {headlineLead ? `${headlineLead} ` : ''}
                <span className="ms-hero-serif">{headlineSerif}</span>
              </h1>

              <p className="ms-hero-subtitle">
                {content.hero.subtitle ||
                  'Consult verified specialists across internal medicine, diabetes care, family paediatrics, and clinical nutrition at our Sector 18 Noida clinic or via video.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => scrollToBooking()}
                  className="ms-pill ms-pill-dark"
                >
                  <span>Book Specialist Visit</span>
                  <PillArrowIcon />
                </button>
                <Link href="/doctors" className="ms-pill ms-pill-light">
                  <span>Find a Doctor</span>
                  <PillArrowIcon />
                </Link>
              </div>

              <div className="ms-hero-highlights">
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>
                    Real-Time Slot Selection
                  </strong>
                  <span style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.45, display: 'block' }}>
                    {doctorsRoster.length}+ specialists with live conflict-checked OPD slots.
                  </span>
                </div>
                <div
                  className="ms-hero-highlights-divider"
                  style={{ width: '1px', height: '44px', background: 'var(--border)' }}
                  aria-hidden="true"
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>
                    {content.doctor.medicalCouncil || 'NMC Registered Panel'}
                  </strong>
                  <span style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.45, display: 'block' }}>
                    Reg: {content.doctor.registrationNumber} &bull; DPDP encrypted intake.
                  </span>
                </div>
              </div>
            </div>

            <div className="ms-col-start-7">
              <div
                className="ms-photo-frame"
                style={{ aspectRatio: '4 / 3', maxHeight: '468px', width: '100%' }}
              >
                <img
                  src={heroPhotoSrc}
                  alt={`${content.doctor.name} welcoming patients at ${content.clinic.name}`}
                  style={{ objectPosition: '50% 10%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ABOUT BENTO */}
        <section id="about" className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap ms-grid-12" style={{ alignItems: 'center' }}>
            <div className="ms-col-span-5">
              <span className="ms-eyebrow">About Us</span>
              <h2 className="ms-title">About Our Specialist Care Team</h2>
              <p className="ms-desc">{content.doctor.bio}</p>

              <div className="ms-bento-stack">
                <Link href="/doctors" style={{ textDecoration: 'none' }} className="ms-bento-light">
                  <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.15, marginBottom: '6px' }}>
                    {content.hero.statExperience || '18+ Yrs'}
                  </div>
                  <p style={{ fontSize: '14.5px', lineHeight: 1.45, color: 'var(--muted)', margin: 0 }}>
                    Clinical experience in metabolic &amp; multi-specialty family care.
                  </p>
                </Link>

                <Link href="/specialties" style={{ textDecoration: 'none' }} className="ms-bento-dark">
                  <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.15, marginBottom: '6px' }}>
                    {content.hero.statConsultations || '12,000+'}
                  </div>
                  <p style={{ fontSize: '14.5px', lineHeight: 1.45, color: '#EDF6F8', margin: 0 }}>
                    Families treated across Sector 18 OPD and video follow-ups.
                  </p>
                </Link>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <Link href="/about" className="ms-pill ms-pill-dark">
                  <span>Doctor Profile &amp; Story</span>
                  <PillArrowIcon />
                </Link>
                <Link href="/facilities" className="ms-pill ms-pill-light">
                  <span>Clinic Facilities &amp; Labs</span>
                  <PillArrowIcon />
                </Link>
              </div>
            </div>

            <figure
              className="ms-col-start-7 ms-photo-frame"
              style={{ aspectRatio: '4 / 3', maxHeight: '460px', width: '100%' }}
            >
              <img
                src="/images/about-consultation.jpg"
                alt="Physician reviewing digital diagnostic imaging with a patient inside consultation room"
              />
            </figure>
          </div>
        </section>

        {/* SECTION 3: MEDICAL SPECIALTIES */}
        <section id="specialties" className="ms-section" style={{ background: 'var(--surface-alt)' }}>
          <div className="ms-wrap">
            <div className="ms-grid-12" style={{ marginBottom: '28px', alignItems: 'center' }}>
              <div className="ms-col-span-5">
                <span className="ms-eyebrow">Specialties</span>
                <h2 className="ms-title">Medical Specialties Around Your Symptoms</h2>
                <p className="ms-desc">
                  Select any clinical department below to pre-select that specialty in our live Sector 18 booking form.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <Link href="/specialties" className="ms-action-link">
                    <span>Explore All Department Guides &rarr;</span>
                  </Link>
                </div>
              </div>

              <div className="ms-col-start-7" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <svg
                  viewBox="0 0 560 184"
                  width="100%"
                  height="184"
                  role="img"
                  aria-label="MedSphere symptom triage flow: Intake to Triage to Specialist Visit"
                  fill="none"
                >
                  <rect x="2" y="2" width="556" height="180" rx="14" fill="#FFFFFF" stroke="#D7E4E9" strokeWidth="1.5" />
                  <text x="24" y="34" fill="#183C4A" fontSize="13" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                    Department Matching Flow &middot; Sector 18 OPD
                  </text>
                  <rect x="22" y="50" width="150" height="110" rx="10" fill="#EFF7F9" stroke="#C4DAE1" />
                  <circle cx="44" cy="76" r="10" fill="#183C4A" />
                  <path d="M40 76h8M44 72v8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <text x="64" y="80" fill="#111C21" fontSize="12.5" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">01 Intake</text>
                  <text x="34" y="106" fill="#2F3E46" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">Symptom check</text>
                  <text x="34" y="122" fill="#2F3E46" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">&amp; lab upload</text>
                  <rect x="34" y="136" width="100" height="8" rx="4" fill="#BFE0EA" />

                  <path d="M180 105h24" stroke="#183C4A" strokeWidth="2" strokeLinecap="round" />
                  <path d="M198 100l6 5-6 5" stroke="#183C4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  <rect x="208" y="50" width="150" height="110" rx="10" fill="#EFF7F9" stroke="#C4DAE1" />
                  <circle cx="230" cy="76" r="10" fill="#1F6D82" />
                  <path d="M226 76l3 3 5-6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="248" y="80" fill="#111C21" fontSize="12.5" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">02 Triage</text>
                  <text x="220" y="106" fill="#2F3E46" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">Department match</text>
                  <text x="220" y="122" fill="#2F3E46" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">&amp; slot timing</text>
                  <rect x="220" y="136" width="110" height="8" rx="4" fill="#1F6D82" />

                  <path d="M366 105h24" stroke="#183C4A" strokeWidth="2" strokeLinecap="round" />
                  <path d="M384 100l6 5-6 5" stroke="#183C4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  <rect x="394" y="50" width="144" height="110" rx="10" fill="#183C4A" />
                  <circle cx="416" cy="76" r="10" fill="#FFFFFF" />
                  <path d="M412 76h8" stroke="#183C4A" strokeWidth="2" strokeLinecap="round" />
                  <text x="434" y="80" fill="#FFFFFF" fontSize="12.5" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">03 Visit</text>
                  <text x="406" y="106" fill="#E6F2F5" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">20-min focused</text>
                  <text x="406" y="122" fill="#E6F2F5" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">NMC consult</text>
                  <rect x="406" y="136" width="116" height="8" rx="4" fill="#6BB8CC" />
                </svg>
              </div>
            </div>

            <div className="ms-grid-3">
              {EDITORIAL_SPECIALTIES.map((spec, idx) => (
                <article key={spec.title} className="ms-editorial-card">
                  <SpecialtyChart index={idx} label={spec.label} />
                  <h3 style={{ fontSize: '18.5px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                    {spec.title}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.48, color: 'var(--muted)', flex: 1 }}>
                    {spec.summary}
                  </p>
                  <button
                    type="button"
                    onClick={() => scrollToBooking({ service: spec.serviceValue })}
                    className="ms-action-link"
                  >
                    Book Specialist Visit
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: MULTI-DOCTOR ROSTER (LIVE FROM POSTGRESQL) */}
        <section id="doctors" className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            <div className="ms-grid-12" style={{ marginBottom: '28px', alignItems: 'center' }}>
              <div className="ms-col-span-5">
                <span className="ms-eyebrow">Lead Doctors</span>
                <h2 className="ms-title">Specialist Doctors at {content.clinic.name}</h2>
                <p className="ms-desc">
                  Each consultant holds active National Medical Commission credentials and configurable conflict-checked OPD windows.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <Link href="/doctors" className="ms-action-link">
                    View Full Multi-Doctor Directory ({doctorsRoster.length}) &rarr;
                  </Link>
                </div>
              </div>

              <div className="ms-col-start-7" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <svg
                  viewBox="0 0 560 184"
                  width="100%"
                  height="184"
                  role="img"
                  aria-label="NMC registration verification and daily OPD availability summary"
                  fill="none"
                >
                  <rect x="2" y="2" width="556" height="180" rx="14" fill="#F8FAFB" stroke="#D7E4E9" strokeWidth="1.5" />
                  <circle cx="50" cy="54" r="24" fill="#183C4A" />
                  <path d="M40 54l6 6 12-13" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="92" y="48" fill="#111C21" fontSize="14.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                    NMC Council Verified Roster
                  </text>
                  <text x="92" y="70" fill="#2F3E46" fontSize="12.5" fontFamily="Plus Jakarta Sans, sans-serif">
                    Dedicated per-doctor slot intervals &middot; Zero double-bookings
                  </text>
                  <rect x="24" y="100" width="160" height="28" rx="14" fill="#E6F2F5" />
                  <text x="52" y="118" fill="#183C4A" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    Mon-Sat OPD
                  </text>
                  <rect x="198" y="100" width="164" height="28" rx="14" fill="#E6F2F5" />
                  <text x="220" y="118" fill="#183C4A" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    9 AM - 8 PM IST
                  </text>
                  <rect x="376" y="100" width="160" height="28" rx="14" fill="#183C4A" />
                  <text x="398" y="118" fill="#FFFFFF" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    Same-Day Video
                  </text>
                  <rect x="24" y="146" width="512" height="10" rx="5" fill="#D7E4E9" />
                  <rect x="24" y="146" width="440" height="10" rx="5" fill="#1F6D82" />
                </svg>
              </div>
            </div>

            <div className="ms-grid-3">
              {doctorsRoster.slice(0, 6).map((doc, idx) => {
                const avatar =
                  doc.photoUrl && !doc.photoUrl.endsWith('.svg')
                    ? doc.photoUrl
                    : AVATAR_FALLBACKS[idx % AVATAR_FALLBACKS.length]!;
                return (
                  <article
                    key={doc.id}
                    className="ms-editorial-card"
                    style={{ background: 'var(--surface-alt)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={avatar}
                        alt={`Portrait of ${doc.name}`}
                        style={{
                          width: '68px',
                          height: '86px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          objectPosition: 'top center',
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <h3 style={{ fontSize: '18.5px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                          {doc.name}
                        </h3>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: 'var(--brand)' }}>
                          {doc.qualification}
                          {doc.experienceYears
                            ? ` · ${doc.experienceYears} Yrs`
                            : doc.experienceLabel
                            ? ` · ${doc.experienceLabel}`
                            : ''}
                        </span>
                        <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                          {doc.department}
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 360 132" width="100%" height="132" aria-hidden="true" fill="none">
                      <rect width="360" height="132" rx="10" fill="#FFFFFF" stroke="#D7E4E9" />
                      <text x="16" y="28" fill="#183C4A" fontSize="12" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                        OPD Windows &middot; {doc.slotIntervalMinutes || 20}-min Slots
                      </text>
                      <text x="16" y="50" fill="#2F3E46" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">
                        Morning &middot; 9:30 AM - 1:30 PM
                      </text>
                      <rect x="16" y="59" width="328" height="9" rx="4.5" fill="#EFF7F9" />
                      <rect x="16" y="59" width="248" height="9" rx="4.5" fill="#183C4A" />
                      <text x="16" y="92" fill="#2F3E46" fontSize="11.5" fontFamily="Plus Jakarta Sans, sans-serif">
                        Evening &middot; 5:00 PM - 8:00 PM
                      </text>
                      <rect x="16" y="101" width="328" height="9" rx="4.5" fill="#EFF7F9" />
                      <rect x="16" y="101" width="280" height="9" rx="4.5" fill="#1F6D82" />
                    </svg>

                    <p style={{ fontSize: '14.5px', lineHeight: 1.48, color: 'var(--muted)', flex: 1 }}>
                      {doc.bio}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap',
                        paddingTop: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)' }}>
                        Reg: {doc.registrationNumber || content.doctor.registrationNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => scrollToBooking({ doctorId: doc.id, doctorName: doc.name })}
                        className="ms-action-link"
                      >
                        Select &amp; Book &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: CLINICAL CARE SERVICES & PREVENTIVE PACKAGES */}
        <section id="services" className="ms-section" style={{ background: 'var(--surface)' }}>
          <div className="ms-wrap ms-grid-12" style={{ alignItems: 'center' }}>
            <div className="ms-col-span-5">
              <span className="ms-eyebrow">Care Services</span>
              <h2 className="ms-title">Clinical Services &amp; Care Continuity</h2>
              <p className="ms-desc">
                Structured specialist continuity from pre-visit symptom intake through Sector 18 OPD or HD video follow-up.
              </p>

              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {PATHWAY_STEPS.map((item, idx) => {
                  const active = idx === activePathwayIndex;
                  return (
                    <li key={item.step}>
                      <button
                        type="button"
                        onClick={() => setActivePathwayIndex(idx)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: '#FFFFFF',
                          border: active ? '2px solid var(--brand)' : '1px solid var(--border)',
                          borderRadius: '14px',
                          padding: '16px 18px',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '17.5px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                          {item.step}
                        </div>
                        <p style={{ fontSize: '14.5px', lineHeight: 1.48, color: 'var(--muted)', margin: 0 }}>
                          {item.description}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div style={{ marginTop: '22px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/services" className="ms-pill ms-pill-dark">
                  <span>View All Services</span>
                  <PillArrowIcon />
                </Link>
                <Link href="/health-packages" className="ms-pill ms-pill-light">
                  <span>Preventive Health Packages</span>
                  <PillArrowIcon />
                </Link>
              </div>
            </div>

            <div className="ms-col-start-7">
              <div
                className="ms-photo-frame"
                style={{ aspectRatio: '4 / 3', maxHeight: '460px', width: '100%' }}
              >
                <img src={currentPathway.image} alt={currentPathway.alt} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: PATIENT RESOURCES & BLOG (LIVE CMS SYNCED) */}
        <section id="resources" className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            <div className="ms-grid-12" style={{ marginBottom: '28px', alignItems: 'center' }}>
              <div className="ms-col-span-5">
                <span className="ms-eyebrow">Patient Resources</span>
                <h2 className="ms-title">Patient Resources &amp; Clinical Briefs</h2>
                <p className="ms-desc">
                  Evidence-based preparation briefs written by {content.clinic.name} consultants to make your OPD visit productive.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <Link href="/blog" className="ms-action-link">
                    Browse Full Health Blog Library &rarr;
                  </Link>
                </div>
              </div>

              <div className="ms-col-start-7" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <svg
                  viewBox="0 0 560 176"
                  width="100%"
                  height="176"
                  role="img"
                  aria-label="MedSphere diagnostic library metrics across clinical guides"
                  fill="none"
                >
                  <rect x="2" y="2" width="556" height="172" rx="14" fill="#F8FAFB" stroke="#D7E4E9" strokeWidth="1.5" />
                  <text x="26" y="46" fill="#111C21" fontSize="14.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                    Pre-Consultation Checklist Guides
                  </text>
                  <text x="26" y="70" fill="#2F3E46" fontSize="12.5" fontFamily="Plus Jakarta Sans, sans-serif">
                    Reviewed by Internal Medicine, Endocrinology &amp; Clinical Nutrition
                  </text>
                  <rect x="26" y="96" width="150" height="28" rx="14" fill="#FFFFFF" stroke="#D7E4E9" />
                  <text x="44" y="114" fill="#183C4A" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    Home BP Protocol
                  </text>
                  <rect x="188" y="96" width="150" height="28" rx="14" fill="#FFFFFF" stroke="#D7E4E9" />
                  <text x="206" y="114" fill="#183C4A" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    HbA1c Fast Guide
                  </text>
                  <rect x="350" y="96" width="184" height="28" rx="14" fill="#183C4A" />
                  <text x="368" y="114" fill="#FFFFFF" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    Noida OPD Intake Prep
                  </text>
                  <rect x="26" y="142" width="508" height="10" rx="5" fill="#E6F2F5" />
                  <rect x="26" y="142" width="380" height="10" rx="5" fill="#1F6D82" />
                </svg>
              </div>
            </div>

            <div className="ms-grid-3">
              {blogList.map((post, idx) => (
                <article
                  key={post.slug}
                  className="ms-editorial-card"
                  style={{ background: 'var(--surface-alt)' }}
                >
                  <SpecialtyChart index={idx} label={post.category || 'Clinical Brief'} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--brand)',
                        background: 'var(--mint)',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      {post.category || 'Care Guide'}
                    </span>
                    <span style={{ color: 'var(--muted)' }}>{post.publishedDate}</span>
                  </div>
                  <h3 style={{ fontSize: '18.5px', fontWeight: 600, lineHeight: 1.3, color: 'var(--ink)' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.48, color: 'var(--muted)', flex: 1 }}>
                    {post.excerpt}
                  </p>
                  <Link href={`/blog/${post.slug}`} className="ms-action-link">
                    Read Clinical Guide &rarr;
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: VERIFIED PATIENT REVIEWS & CLINIC FAQS */}
        <section id="reviews" className="ms-section" style={{ background: 'var(--surface)' }}>
          <div className="ms-wrap">
            <div className="ms-grid-12" style={{ marginBottom: '28px', alignItems: 'center' }}>
              <div className="ms-col-span-5">
                <span className="ms-eyebrow">Reviews &amp; FAQ</span>
                <h2 className="ms-title">Patient Reviews &amp; Clinic Questions</h2>
                <p className="ms-desc">
                  Verified family stories alongside transparent answers on Sector 18 OPD fees and medical records.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <Link href="/testimonials-faq" className="ms-action-link">
                    See All Patient Testimonials &amp; FAQs &rarr;
                  </Link>
                </div>
              </div>

              <div className="ms-col-start-7" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <svg
                  viewBox="0 0 560 116"
                  width="100%"
                  height="116"
                  role="img"
                  aria-label="4.9 out of 5 verified patient satisfaction rating"
                  fill="none"
                >
                  <rect x="2" y="2" width="556" height="112" rx="14" fill="#FFFFFF" stroke="#D7E4E9" strokeWidth="1.5" />
                  <text x="26" y="44" fill="#183C4A" fontSize="24" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
                    4.9 / 5
                  </text>
                  <text x="128" y="38" fill="#111C21" fontSize="13.5" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                    Verified Patient Satisfaction
                  </text>
                  <text x="128" y="58" fill="#2F3E46" fontSize="12" fontFamily="Plus Jakarta Sans, sans-serif">
                    Zero hidden charges &middot; DPDP compliant privacy
                  </text>
                  <rect x="26" y="76" width="508" height="10" rx="5" fill="#E6F2F5" />
                  <rect x="26" y="76" width="486" height="10" rx="5" fill="#183C4A" />
                </svg>
              </div>
            </div>

            <div className="ms-grid-3" style={{ marginBottom: '20px' }}>
              {reviewsList.map((rev) => {
                const initials = rev.patientName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0] || '')
                  .join('')
                  .toUpperCase();
                return (
                  <article key={rev.id} className="ms-editorial-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'var(--brand)',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-hidden="true"
                      >
                        {initials || 'PT'}
                      </span>
                      <svg width="88" height="16" viewBox="0 0 92 18" fill="#183C4A" aria-hidden="true">
                        <polygon points="9,1 11.4,6 17,6.7 13,10.5 14,16 9,13.3 4,16 5,10.5 1,6.7 6.6,6" />
                        <polygon points="27,1 29.4,6 35,6.7 31,10.5 32,16 27,13.3 22,16 23,10.5 19,6.7 24.6,6" />
                        <polygon points="45,1 47.4,6 53,6.7 49,10.5 50,16 45,13.3 40,16 41,10.5 37,6.7 42.6,6" />
                        <polygon points="63,1 65.4,6 71,6.7 67,10.5 68,16 63,13.3 58,16 59,10.5 55,6.7 60.6,6" />
                        <polygon points="81,1 83.4,6 89,6.7 85,10.5 86,16 81,13.3 76,16 77,10.5 73,6.7 78.6,6" />
                      </svg>
                    </div>
                    <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--ink)', flex: 1 }}>
                      &ldquo;{rev.reviewText}&rdquo;
                    </p>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--muted)' }}>
                      {rev.patientName} &middot; {rev.treatment}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="ms-grid-2">
              {faqsList.map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <h3 style={{ fontSize: '17.5px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    {faq.question}
                  </h3>
                  <p style={{ fontSize: '14.5px', lineHeight: 1.5, color: 'var(--muted)', margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8: CLOSING CONTACT, CLINIC MAP & LIVE SLOT BOOKING */}
        <section id="contact" className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap ms-grid-12">
            <div className="ms-col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="ms-eyebrow">Contact &amp; Visit</span>
                <h2 className="ms-title">Visit {content.clinic.name}</h2>
                <p className="ms-desc">
                  {content.clinic.street}, {content.clinic.area}, {content.clinic.city},{' '}
                  {content.clinic.state} {content.clinic.pincode} &middot; {content.clinic.schedule.weekdayHours}.
                </p>
              </div>

              <div
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {showInteractiveMap ? (
                  <iframe
                    title="Clinic Location Google Map"
                    src="https://www.google.com/maps?q=Sector+18+Noida+201301&output=embed"
                    width="100%"
                    height="190"
                    style={{ border: 0, borderRadius: '10px' }}
                    loading="lazy"
                  />
                ) : (
                  <svg
                    viewBox="0 0 460 148"
                    width="100%"
                    height="148"
                    role="img"
                    aria-label="Sector 18 Noida clinic location map schematic"
                    fill="none"
                  >
                    <rect width="460" height="148" rx="10" fill="#EDF6F8" />
                    <path d="M0 54h460M130 0v148M320 0v148" stroke="#CFE1E7" strokeWidth="8" />
                    <path d="M0 54h460M130 0v148" stroke="#FFFFFF" strokeWidth="2" />
                    <rect x="64" y="18" width="96" height="24" rx="6" fill="#FFFFFF" stroke="#B9D2DA" />
                    <text x="74" y="34" fill="#183C4A" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                      Metro Sec 18
                    </text>
                    <circle cx="265" cy="90" r="14" fill="#183C4A" />
                    <circle cx="265" cy="90" r="5" fill="#FFFFFF" />
                    <rect x="190" y="110" width="150" height="24" rx="6" fill="#183C4A" />
                    <text x="202" y="126" fill="#FFFFFF" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                      {content.clinic.area || 'Sector 18'} Clinic
                    </text>
                  </svg>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <a href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`} className="ms-pill ms-pill-dark">
                    <PhoneIcon size={15} color="#FFFFFF" />
                    <span>{content.doctor.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowInteractiveMap((v) => !v)}
                    className="ms-pill ms-pill-light"
                  >
                    <span>{showInteractiveMap ? 'Hide Live Map' : 'Show Clinic Map'}</span>
                    <PillArrowIcon />
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '14px',
                  padding: '14px 16px',
                }}
              >
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#7F1D1D', margin: 0 }}>
                  <strong>Emergency Warning:</strong> For chest pain, severe bleeding, or acute breathing difficulty, dial emergency helpline 112 immediately instead of waiting for a callback.
                </p>
              </div>
            </div>

            <div
              id="lead-form"
              className="ms-col-start-7"
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  Book Specialist Visit
                </h3>
                <Link href="/contact" className="ms-action-link" style={{ minHeight: 'auto', fontSize: '13.5px' }}>
                  Full Booking Desk &rarr;
                </Link>
              </div>
              <p style={{ fontSize: '14.5px', lineHeight: 1.48, color: 'var(--muted)', marginBottom: '16px' }}>
                Choose your consulting physician, date, and open time slot. Confirmed slots lock automatically in PostgreSQL.
              </p>

              {submitSuccess && confirmedDetails ? (
                <div
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065F46', fontWeight: 700, fontSize: '16px' }}>
                    <CheckCircleIcon size={20} color="#059669" />
                    <span>Appointment Reserved &middot; Token #{confirmedToken}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#064E3B', lineHeight: 1.55 }}>
                    Patient: <strong>{confirmedDetails.patientName}</strong> &middot; Doctor:{' '}
                    <strong>{formData.doctor}</strong> &middot; {confirmedDetails.date} at{' '}
                    <strong>{confirmedDetails.time}</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowSlipModal(true)}
                      className="ms-pill ms-pill-dark"
                    >
                      <CalendarIcon size={15} color="#FFFFFF" />
                      <span>Open Appointment Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmitSuccess(false)}
                      className="ms-pill ms-pill-light"
                    >
                      Book Another Visit
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookingError && (
                    <div
                      role="alert"
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#991B1B',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                      }}
                    >
                      {bookingError}
                    </div>
                  )}

                  <div className="ms-grid-2">
                    <div>
                      <label htmlFor="home-patient-name" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                        Patient Full Name *
                      </label>
                      <input
                        id="home-patient-name"
                        type="text"
                        required
                        placeholder="e.g. Rajesh Sharma"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #9CB4C0',
                          background: '#FFFFFF',
                          fontSize: '15px',
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="home-patient-phone" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                        Mobile Phone *
                      </label>
                      <input
                        id="home-patient-phone"
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #9CB4C0',
                          background: '#FFFFFF',
                          fontSize: '15px',
                        }}
                      />
                    </div>
                  </div>

                  <div className="ms-grid-2">
                    <div>
                      <label htmlFor="home-doctor-select" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                        Consulting Doctor *
                      </label>
                      <select
                        id="home-doctor-select"
                        value={formData.doctor}
                        onChange={(e) => {
                          const matched = doctorsRoster.find((d) => d.name === e.target.value);
                          setBookingError(null);
                          setFormData({
                            ...formData,
                            doctor: e.target.value,
                            doctorId: matched?.id || '',
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #9CB4C0',
                          background: '#FFFFFF',
                          fontSize: '14.5px',
                        }}
                      >
                        {doctorsRoster.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} {d.department ? `(${d.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="home-service-select" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                        Clinical Specialty
                      </label>
                      <select
                        id="home-service-select"
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #9CB4C0',
                          background: '#FFFFFF',
                          fontSize: '14.5px',
                        }}
                      >
                        {serviceOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ms-grid-2">
                    <div>
                      <label htmlFor="home-preferred-date" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                        Preferred Date
                      </label>
                      <input
                        id="home-preferred-date"
                        type="date"
                        value={formData.preferredDate || todayStr}
                        min={todayStr}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #9CB4C0',
                          background: '#FFFFFF',
                          fontSize: '14.5px',
                        }}
                      />
                    </div>

                    <div>
                      <label htmlFor="home-shift-select" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                        OPD Shift
                      </label>
                      <select
                        id="home-shift-select"
                        value={formData.shift}
                        onChange={(e) => setFormData({ ...formData, shift: e.target.value as 'Morning' | 'Evening' })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #9CB4C0',
                          background: '#FFFFFF',
                          fontSize: '14.5px',
                        }}
                      >
                        <option value="Morning">Morning (09:00 AM - 01:30 PM)</option>
                        <option value="Evening">Evening (04:30 PM - 08:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '6px' }}>
                      Available Time Slots ({formData.doctor})
                    </span>
                    {isDayClosed ? (
                      <div style={{ fontSize: '13.5px', color: '#991B1B', fontWeight: 600 }}>
                        Clinic Closed on this date. Please select another working day.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {Array.from(new Set([...availableSlots, ...bookedSlots]))
                          .slice(0, 12)
                          .map((slot) => {
                            const isBooked = bookedSlots.includes(slot);
                            const isSelected = selectedSlot === slot && !isBooked;
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isBooked}
                                onClick={() => {
                                  setBookingError(null);
                                  setSelectedSlot(slot);
                                }}
                                style={{
                                  padding: '6px 11px',
                                  borderRadius: '9999px',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  border: isSelected
                                    ? '1px solid var(--brand)'
                                    : isBooked
                                    ? '1px solid #FECACA'
                                    : '1px solid var(--border)',
                                  background: isSelected
                                    ? 'var(--brand)'
                                    : isBooked
                                    ? '#FEF2F2'
                                    : '#FFFFFF',
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : isBooked
                                    ? '#B91C1C'
                                    : 'var(--ink)',
                                  textDecoration: isBooked ? 'line-through' : 'none',
                                }}
                              >
                                {slot}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="home-notes" style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '5px' }}>
                      Brief Symptom Summary (Optional)
                    </label>
                    <textarea
                      id="home-notes"
                      rows={2}
                      placeholder="Primary symptoms or test review (avoid sharing sensitive IDs)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #9CB4C0',
                        background: '#FFFFFF',
                        fontSize: '14.5px',
                      }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', lineHeight: 1.45, color: 'var(--ink)' }}>
                    <input
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand)' }}
                    />
                    <span>
                      I consent to appointment scheduling contact under the <strong>DPDP Act 2023</strong> and confirm this is not an emergency.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting || isDayClosed}
                    className="ms-pill ms-pill-dark ms-pill-block"
                  >
                    <CalendarIcon size={16} color="#FFFFFF" />
                    <span>
                      {submitting
                        ? 'Reserving Slot...'
                        : `Confirm Visit${selectedSlot ? ` (${selectedSlot})` : ''}`}
                    </span>
                    <PillArrowIcon />
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: 'var(--muted)',
                    }}
                  >
                    <LockIcon size={13} color="currentColor" />
                    <span>Encrypted patient scheduling &middot; Zero spam guarantees</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter content={content} />

      {showSlipModal && confirmedDetails && (
        <AppointmentSlipModal
          isOpen={showSlipModal}
          onClose={() => setShowSlipModal(false)}
          appointment={{
            tokenNumber: confirmedToken,
            patientName: confirmedDetails.patientName,
            phone: confirmedDetails.phone,
            service: confirmedDetails.service,
            date: confirmedDetails.date || todayStr,
            time: confirmedDetails.time,
            shift: confirmedDetails.shift,
            id: submittedAptId,
          }}
          content={content}
        />
      )}
    </div>
  );
}
