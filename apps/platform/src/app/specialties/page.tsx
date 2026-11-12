'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';
import {
  StethoscopeIcon,
  HeartPulseIcon,
  ActivityIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@/components/Icons';

interface PublicDoctor {
  id: string;
  name: string;
  role: string;
  degrees: string;
  department: string;
  specialties: string[];
  schedule: string | null;
  fee: number | string;
}

const CLINICAL_DEPARTMENTS = [
  {
    key: 'Internal Medicine',
    subtitle: 'Adult Chronic Disease & Multi-System Diagnostics',
    summary:
      'Evidence-based outpatient management for Type 2 Diabetes, difficult-to-control hypertension, thyroid dysfunction, fatty liver, and complex acute fevers.',
    protocols: [
      'HbA1c & CGM glycemic titration clinics',
      'Hypertension & cardiovascular risk stratification',
      'Dengue, malaria, enteric & respiratory infection pathways',
      'Geriatric polypharmacy review & deprescribing',
    ],
  },
  {
    key: 'Family & Pediatric Medicine',
    subtitle: 'Pediatric Wellness, Immunizations & Primary Family Care',
    summary:
      'Coordinated primary consultations covering pediatric growth milestones, adult & child vaccination schedules, allergy care, and seasonal respiratory infections.',
    protocols: [
      'IAP-aligned childhood & adolescent immunization clinic',
      'Adult influenza, pneumococcal, hepatitis & typhoid vaccines',
      'Pediatric acute fever, ear & throat evaluations',
      'School health fitness & family travel medicine advisories',
    ],
  },
  {
    key: 'Clinical Nutrition',
    subtitle: 'Therapeutic Diets, Metabolic Reversal & Renal Nutrition',
    summary:
      'Structured medical nutrition therapy designed around everyday North & South Indian home meals for sustainable glycemic, lipid, and weight control.',
    protocols: [
      'Customized Indian diabetic & gestational meal plans',
      'Low-sodium DASH planning for essential hypertension',
      'PCOS insulin-resistance & fatty liver nutrition',
      'CKD protein/potassium-calibrated renal dietary counseling',
    ],
  },
];

export default function SpecialtiesDirectoryPage() {
  const { content } = useClinicContent();
  const [doctors, setDoctors] = useState<PublicDoctor[]>(
    CLINICAL_DOCTORS.map((d, i) => ({
      id: d.id,
      name: d.name,
      role: d.role,
      degrees: d.degrees,
      department:
        i === 0
          ? 'Internal Medicine'
          : i === 1
            ? 'Family & Pediatric Medicine'
            : 'Clinical Nutrition',
      specialties: d.specialties,
      schedule: d.schedule,
      fee: d.fee,
    }))
  );

  useEffect(() => {
    let active = true;
    fetch('/api/v1/public/doctors')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.items) && data.items.length > 0) {
          setDoctors(data.items);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
              <StethoscopeIcon size={14} color="currentColor" />
              <span>Specialty Departments &bull; Integrated Outpatient Care</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '780px', marginBottom: '12px' }}>
              Clinical Specialties &amp;{' '}
              <span className="ms-hero-serif">Departments</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '680px', margin: 0 }}>
              Focused multidisciplinary care across {CLINICAL_DEPARTMENTS.length} outpatient departments with direct specialist appointment routing.
            </p>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {CLINICAL_DEPARTMENTS.map((dept, index) => {
              const matchedDoctors = doctors.filter(
                (doc) =>
                  doc.department?.toLowerCase() === dept.key.toLowerCase() ||
                  doc.specialties.some((s) => dept.key.toLowerCase().includes(s.toLowerCase()))
              );
              const IconComponent =
                index === 0 ? HeartPulseIcon : index === 1 ? ShieldCheckIcon : ActivityIcon;

              return (
                <article
                  key={dept.key}
                  className="ms-editorial-card"
                  style={{ padding: 'clamp(22px, 3vw, 32px)' }}
                >
                  <div className="ms-split-2">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div className="ms-icon-tile">
                          <IconComponent size={20} color="currentColor" />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                            {dept.key}
                          </h2>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--brand)' }}>
                            {dept.subtitle}
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65, margin: '8px 0 18px 0' }}>
                        {dept.summary}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {dept.protocols.map((p) => (
                          <div
                            key={p}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '9px',
                              fontSize: '14px',
                              color: 'var(--ink)',
                            }}
                          >
                            <CheckCircleIcon size={16} color="var(--brand)" style={{ flexShrink: 0 }} />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ms-surface-box">
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--brand)',
                          letterSpacing: '0.03em',
                          marginBottom: '12px',
                        }}
                      >
                        Department Specialists ({matchedDoctors.length})
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {matchedDoctors.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              border: '1px solid var(--border)',
                              padding: '16px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px',
                              }}
                            >
                              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                                {doc.name}
                              </div>
                              <span className="ms-tag">
                                {typeof doc.fee === 'number' ? `₹${doc.fee}` : doc.fee}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                              {doc.degrees} &bull; {doc.role}
                            </div>
                            {doc.schedule && (
                              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '12px' }}>
                                {doc.schedule}
                              </div>
                            )}
                            <Link
                              href={`/contact?doctor=${encodeURIComponent(doc.name)}&doctorId=${encodeURIComponent(doc.id)}`}
                              className="ms-pill ms-pill-dark"
                              style={{ minHeight: '40px', padding: '0 16px', fontSize: '13.5px' }}
                            >
                              <CalendarIcon size={14} color="#FFFFFF" />
                              <span>Book with {doc.name.split(' ').slice(0, 2).join(' ')}</span>
                              <PillArrowIcon />
                            </Link>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={`/doctors?specialty=${encodeURIComponent(dept.key)}`}
                        className="ms-action-link"
                        style={{ marginTop: '14px' }}
                      >
                        <span>View all specialists in {dept.key}</span>
                        <ChevronRightIcon size={15} color="currentColor" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
