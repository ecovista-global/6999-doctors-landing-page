'use client';

import React from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  ShieldCheckIcon,
  AwardIcon,
  UserCheckIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  CalendarIcon,
  BuildingIcon,
} from '@/components/Icons';

export default function AboutDoctorPage() {
  const { content } = useClinicContent();
  const doctor = content.doctor;
  const clinic = content.clinic;

  return (
    <div className="ms-public-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <PublicHeader content={content} />

      <main id="main-content">
        {/* Editorial Hero / Credentials Banner */}
        <section className="ms-subhero">
          <div className="ms-wrap">
            <div className="ms-badge-pill">
              <ShieldCheckIcon size={14} color="currentColor" />
              <span>
                Verified Medical Credentials &bull; Reg. {doctor.registrationNumber}
              </span>
            </div>

            <div className="ms-split-2">
              <div>
                <h1 className="ms-hero-title" style={{ marginBottom: '12px' }}>
                  {doctor.name}{' '}
                  <span className="ms-hero-serif" style={{ display: 'block', fontSize: '0.78em' }}>
                    {doctor.degree}
                  </span>
                </h1>

                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--brand)',
                    marginBottom: '16px',
                  }}
                >
                  Senior Consultant &bull; {doctor.specialty} &bull; {doctor.experienceYears}+ Years Clinical Practice
                </div>

                <p className="ms-hero-subtitle" style={{ marginBottom: '26px' }}>
                  {doctor.bio}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <Link href="/contact" className="ms-pill ms-pill-dark">
                    <CalendarIcon size={16} color="#FFFFFF" />
                    <span>Book Consultation</span>
                    <PillArrowIcon />
                  </Link>
                  <a
                    href={`tel:${doctor.phone.replace(/[^0-9+]/g, '')}`}
                    className="ms-pill ms-pill-light"
                  >
                    <PhoneIcon size={15} color="currentColor" />
                    <span>Call {doctor.phone}</span>
                  </a>
                </div>
              </div>

              {/* Accreditations & Registrations Card */}
              <div className="ms-editorial-card" style={{ padding: '26px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '6px',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Medical Accreditations
                  </h2>
                  <span className="ms-tag">NMC Verified</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="ms-icon-tile">
                      <ShieldCheckIcon size={19} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>
                        Medical Council Registration
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                        {doctor.registrationNumber}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{doctor.medicalCouncil}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="ms-icon-tile">
                      <AwardIcon size={19} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>
                        Alma Mater &amp; Postgraduate Degree
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                        {doctor.college}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{doctor.degree}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="ms-icon-tile">
                      <BuildingIcon size={19} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>
                        Hospital Attachments &amp; Honorary Roles
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                        Visiting Consultant Physician
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        Fortis Hospital, Sector 62 Noida &bull; Max Healthcare Patparganj
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="ms-icon-tile">
                      <UserCheckIcon size={19} color="currentColor" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>
                        Consulting Languages
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                        {doctor.languages}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Philosophy of Care */}
        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            <div style={{ maxWidth: '700px', marginBottom: '32px' }}>
              <span className="ms-eyebrow">Clinical Ethics</span>
              <h2 className="ms-title">
                Clinical Philosophy &amp;{' '}
                <span className="ms-hero-serif">Patient-First Care</span>
              </h2>
              <p className="ms-desc">
                Practicing evidence-based medicine guided by national and international protocols, with an uncompromised commitment to clarity and transparency.
              </p>
            </div>

            <div className="ms-grid-3">
              <div className="ms-editorial-card" style={{ background: 'var(--surface-alt)', padding: '24px' }}>
                <div className="ms-icon-tile">
                  <ShieldCheckIcon size={22} color="currentColor" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '4px 0 0 0' }}>
                  Zero Over-Prescription Policy
                </h3>
                <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  Diagnostic tests and prescription medications are recommended strictly when clinically necessary. Antibiotics are prescribed only with demonstrated microbiological rationale to counter antimicrobial resistance.
                </p>
              </div>

              <div className="ms-editorial-card" style={{ background: 'var(--surface-alt)', padding: '24px' }}>
                <div className="ms-icon-tile">
                  <ClockIcon size={22} color="currentColor" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '4px 0 0 0' }}>
                  Unrushed Consultations
                </h3>
                <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  Every patient receives an unhurried evaluation with dedicated time to explain diagnosis, review lab findings, and outline practical lifestyle and dietary adjustments in plain language.
                </p>
              </div>

              <div className="ms-editorial-card" style={{ background: 'var(--surface-alt)', padding: '24px' }}>
                <div className="ms-icon-tile">
                  <CheckCircleIcon size={22} color="currentColor" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '4px 0 0 0' }}>
                  Complimentary 7-Day Follow-Up
                </h3>
                <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  Every initial consultation (&#8377;{doctor.consultationFee}) includes a complimentary follow-up within 7 calendar days to review investigation reports and calibrate ongoing therapy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* OPD Schedule Callout */}
        <section className="ms-cta-strip">
          <div
            className="ms-wrap"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                Consultation Hours at {clinic.area} Clinic
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0 }}>
                Monday to Friday: {clinic.schedule.weekdayHours} &bull; Saturday: {clinic.schedule.saturdayHours}
              </p>
            </div>
            <Link href="/contact" className="ms-pill ms-pill-dark">
              <span>Reserve Appointment Slot</span>
              <PillArrowIcon />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
