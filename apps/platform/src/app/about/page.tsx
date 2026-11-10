'use client';

import React from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  StethoscopeIcon,
  ShieldCheckIcon,
  AwardIcon,
  UserCheckIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  CalendarIcon,
  BuildingIcon,
  FileTextIcon,
} from '@/components/Icons';

export default function AboutDoctorPage() {
  const { content, theme } = useClinicContent();

  const doctor = content.doctor;
  const clinic = content.clinic;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Hero / Credentials Banner */}
      <section
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`,
          padding: '60px 24px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <ShieldCheckIcon size={14} color={theme.primary} />
            <span>VERIFIED MEDICAL CREDENTIALS &bull; COUNCIL REGISTRATION {doctor.registrationNumber}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '36px',
                  lineHeight: '1.2',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 12px 0',
                }}
              >
                {doctor.name}
              </h1>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: theme.primary,
                  marginBottom: '6px',
                }}
              >
                {doctor.degree}
              </div>
              <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
                Senior Consultant &bull; {doctor.specialty} &bull; {doctor.experienceYears}+ Years Clinical Practice
              </div>

              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.7',
                  color: '#334155',
                  marginBottom: '24px',
                }}
              >
                {doctor.bio}
              </p>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  href="/contact"
                  style={{
                    background: theme.primary,
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <CalendarIcon size={16} color="#FFFFFF" />
                  <span>Book Consultation with Doctor</span>
                </Link>
                <a
                  href={`tel:${doctor.phone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    background: '#FFFFFF',
                    color: theme.primary,
                    border: `1px solid ${theme.primary}`,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <PhoneIcon size={16} color={theme.primary} />
                  <span>Call {doctor.phone}</span>
                </a>
              </div>
            </div>

            {/* Doctor Credentials & Medical Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '32px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 20px 0',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                Medical Accreditations &amp; Registrations
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheckIcon size={20} color={theme.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Medical Council Registration
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {doctor.registrationNumber}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{doctor.medicalCouncil}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AwardIcon size={20} color={theme.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Alma Mater &amp; Postgraduate Degree
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {doctor.college}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{doctor.degree}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BuildingIcon size={20} color={theme.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Hospital Attachments &amp; Honorary Roles
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      Visiting Consultant Physician
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Fortis Hospital, Sector 62 Noida &bull; Max Healthcare Patparganj
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UserCheckIcon size={20} color={theme.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Consulting Languages
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
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
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Clinical Philosophy &amp; Patient-First Ethics
        </h2>
        <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '700px', marginBottom: '36px' }}>
          Practicing evidence-based medicine guided by national and international clinical protocols, with an uncompromised commitment to patient dignity and transparency.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          <div
            style={{
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
            }}
          >
            <div style={{ color: theme.primary, marginBottom: '12px' }}>
              <ShieldCheckIcon size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
              Zero Over-Prescription Policy
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Diagnostic tests and prescription medications are recommended strictly when clinically necessary. Antibiotics are prescribed only with demonstrated microbiological rationale to counter antimicrobial resistance.
            </p>
          </div>

          <div
            style={{
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
            }}
          >
            <div style={{ color: theme.primary, marginBottom: '12px' }}>
              <ClockIcon size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
              Unrushed Consultations
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Every patient receives an unhurried evaluation with dedicated time to explain diagnosis, discuss lab findings, and outline lifestyle and dietary adjustments in plain language.
            </p>
          </div>

          <div
            style={{
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
            }}
          >
            <div style={{ color: theme.primary, marginBottom: '12px' }}>
              <CheckCircleIcon size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
              Complimentary 7-Day Follow-Up
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Every initial consultation (₹{doctor.consultationFee}) includes a complimentary follow-up within 7 calendar days to review investigation reports and calibrate ongoing therapy without recurring consultation fees.
            </p>
          </div>
        </div>
      </section>

      {/* OPD Schedule Callout */}
      <section style={{ background: theme.bg, padding: '48px 24px', borderTop: '1px solid #E2E8F0' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              Consultation Hours at Sector 18 Clinic
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
              Monday to Friday: {clinic.schedule.weekdayHours} | Saturday: {clinic.schedule.saturdayHours}
            </p>
          </div>
          <Link
            href="/contact"
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            Reserve Your Appointment Slot &rarr;
          </Link>
        </div>
      </section>

      {/* Shared Public Footer */}
      <PublicFooter content={content} theme={theme} />
    </div>
  );
}
