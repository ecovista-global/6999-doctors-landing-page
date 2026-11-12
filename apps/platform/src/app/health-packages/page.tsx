'use client';

import React from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  HeartPulseIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/components/Icons';

const HEALTH_PACKAGES = [
  {
    name: 'Comprehensive Diabetes & Metabolic Panel',
    badge: 'Most Recommended',
    price: '₹1,450',
    turnaround: 'Same-Day Evening Reports',
    parameters: '48 Parameters + Physician Review',
    featured: true,
    includes: [
      'Fasting Blood Glucose & HbA1c (Glycated Hemoglobin)',
      'Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)',
      'Kidney Function Test (Creatinine, Urea, eGFR) & Urine Microalbumin',
      'Liver Enzymes (SGOT, SGPT) & Thyroid Profile (TSH)',
      'Complimentary Dietitian Glycemic Review',
    ],
  },
  {
    name: 'Executive Cardiac & Hypertension Screening',
    badge: 'Preventive Heart Care',
    price: '₹1,950',
    turnaround: 'Same-Day Evening Reports',
    parameters: '54 Parameters + 12-Lead ECG',
    featured: false,
    includes: [
      'Digital 12-Lead Electrocardiogram (ECG)',
      'High-Sensitivity CRP (hs-CRP) & Full Lipid Sub-fractions',
      'Serum Electrolytes (Sodium, Potassium) & Renal Panel',
      'HbA1c & Fasting Insulin Resistance Check',
      'Lead Physician Cardiovascular Risk Score Consultation',
    ],
  },
  {
    name: 'Senior Citizen Preventive Wellness Profile',
    badge: 'Ages 60+ Priority',
    price: '₹2,200',
    turnaround: 'Morning Home Collection Available',
    parameters: '62 Parameters + Medication Audit',
    featured: false,
    includes: [
      'Complete Blood Count (CBC) & ESR',
      'Vitamin D3, Vitamin B12, Serum Calcium & Phosphorus',
      'Thyroid Profile (T3, T4, TSH), Liver & Kidney Panels',
      'ECG + Blood Pressure Orthostatic Screening',
      'Polypharmacy Safety & Bone Health Consultation',
    ],
  },
  {
    name: 'Annual Family & Immunity Baseline Check',
    badge: 'Annual Preventive',
    price: '₹1,100',
    turnaround: 'Reports Within 12 Hours',
    parameters: '36 Core Biomarkers',
    featured: false,
    includes: [
      'CBC, Fasting Blood Sugar & Lipid Screen',
      'SGPT, Serum Creatinine, Uric Acid & TSH',
      'Urine Routine & Microscopy Examination',
      'Immunization Gap Assessment with Family Physician',
    ],
  },
];

export default function HealthPackagesPage() {
  const { content } = useClinicContent();

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
              <HeartPulseIcon size={14} color="currentColor" />
              <span>Preventive Health Screening &bull; Doctor-Reviewed Panels</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '820px', marginBottom: '12px' }}>
              Preventive Health &amp;{' '}
              <span className="ms-hero-serif">Diagnostic Packages</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '700px', margin: 0 }}>
              Transparent panel pricing with NABL-partnered sample processing and direct clinical report interpretation by our clinic specialists.
            </p>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            <div className="ms-grid-2" style={{ gap: '22px' }}>
              {HEALTH_PACKAGES.map((pkg) => (
                <article
                  key={pkg.name}
                  className="ms-editorial-card"
                  style={{
                    justifyContent: 'space-between',
                    padding: '26px',
                    borderColor: pkg.featured ? 'var(--brand)' : 'var(--border)',
                    boxShadow: pkg.featured ? 'var(--shadow-editorial-md)' : undefined,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        gap: '10px',
                      }}
                    >
                      <span
                        className="ms-tag"
                        style={
                          pkg.featured
                            ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: '#FFFFFF' }
                            : undefined
                        }
                      >
                        {pkg.badge}
                      </span>
                      <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                        {pkg.price}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '20.5px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
                      {pkg.name}
                    </h2>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        fontSize: '13px',
                        color: 'var(--muted)',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--brand)' }}>
                        <ShieldCheckIcon size={14} color="currentColor" />
                        <span>{pkg.parameters}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ClockIcon size={14} color="currentColor" />
                        <span>{pkg.turnaround}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' }}>
                      {pkg.includes.map((line) => (
                        <div
                          key={line}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '13.5px',
                            color: 'var(--ink)',
                            lineHeight: 1.5,
                          }}
                        >
                          <CheckCircleIcon size={15} color="var(--brand)" style={{ marginTop: '3px', flexShrink: 0 }} />
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/contact?service=${encodeURIComponent(pkg.name)}`}
                    className="ms-pill ms-pill-dark ms-pill-block"
                  >
                    <CalendarIcon size={15} color="#FFFFFF" />
                    <span>Book {pkg.name.split(' ')[0]} Checkup</span>
                    <PillArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
