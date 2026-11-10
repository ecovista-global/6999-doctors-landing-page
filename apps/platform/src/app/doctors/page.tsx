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
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@/components/Icons';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';

export default function DoctorsRosterPage() {
  const { content, theme, loading } = useClinicContent();

  if (loading && !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Clinical Doctors Roster...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Roster Header Section */}
      <section
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`,
          padding: '60px 24px 40px 24px',
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
            <ShieldCheckIcon size={14} color={theme.primary} />
            <span>VERIFIED CLINICAL FACULTY &bull; MULTI-SPECIALTY ROSTER</span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
            Doctors &amp; Clinical Specialists
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
            Meet our accredited team of physicians, family consultants, and certified diabetes educators providing coordinated outpatient care at Sector 18, Noida.
          </p>
        </div>
      </section>

      {/* Doctors Roster List */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {CLINICAL_DOCTORS.map((doc) => (
            <div
              key={doc.id}
              style={{
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      background: theme.bg,
                      color: theme.primary,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {doc.role}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    {doc.experience}
                  </span>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                  {doc.name}
                </h2>
                <div style={{ fontSize: '15px', fontWeight: 700, color: theme.primary, marginBottom: '6px' }}>
                  {doc.degrees}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
                  {doc.college} &bull; Reg: <strong>{doc.registration}</strong>
                </div>

                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  {doc.bio}
                </p>

                {/* Specialties Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {doc.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        color: '#334155',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Consultation Details Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Consulting Schedule &amp; Timings
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                  <ClockIcon size={18} color={theme.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '13px', color: '#0F172A', lineHeight: '1.5' }}>
                    {doc.schedule}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderTop: '1px solid #E2E8F0',
                    borderBottom: '1px solid #E2E8F0',
                    marginBottom: '18px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#64748B' }}>OPD Consultation Fee:</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{doc.fee}</span>
                </div>

                <Link
                  href={`/contact?doctor=${encodeURIComponent(doc.name)}`}
                  style={{
                    width: '100%',
                    background: theme.primary,
                    color: '#FFFFFF',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxSizing: 'border-box',
                  }}
                >
                  <CalendarIcon size={16} color="#FFFFFF" />
                  <span>Book Appointment with {doc.name.split(' ')[1]}</span>
                  <ChevronRightIcon size={14} color="#FFFFFF" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shared Public Footer */}
      <PublicFooter content={content} theme={theme} />
    </div>
  );
}
