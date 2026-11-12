'use client';

import React from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  BuildingIcon,
  MicroscopeIcon,
  HeartPulseIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@/components/Icons';

const CLINIC_FACILITIES = [
  {
    title: 'In-House Sample Collection & Point-of-Care Diagnostics',
    category: 'Diagnostics',
    description:
      'On-site phlebotomy suite with same-day digital reporting for HbA1c, Fasting/PP glucose, Lipid Profile, Kidney/Liver panels, and rapid fever markers (NS1, Malaria, CRP).',
    highlights: [
      'NABL-partnered sample barcode tracking',
      'Instant random blood glucose & SpO2 triage',
      'Digital ECG & 24-hour ambulatory BP monitoring',
    ],
  },
  {
    title: 'Cold-Chain Adult & Pediatric Immunization Room',
    category: 'Preventive Care',
    description:
      'Dedicated temperature-monitored vaccine refrigerator maintaining 2 to 8 degrees Celsius cold chain for influenza, pneumococcal, hepatitis B, HPV, and pediatric vaccines.',
    highlights: [
      'Continuous digital temperature logging',
      'Immunization card & recall scheduling',
      'Trained nursing administration under physician supervision',
    ],
  },
  {
    title: 'Nebulization, Day-Care Stabilization & Wound Care',
    category: 'Outpatient Procedures',
    description:
      'Equipped observation bay for asthma/COPD nebulization therapy, IV rehydration during acute viral gastritis, diabetic foot dressing, and blood pressure stabilization.',
    highlights: [
      'Hospital-grade oxygen concentrator backup',
      'Sterile single-use dressing & suture removal packs',
      'Low-wait observation seating',
    ],
  },
  {
    title: 'Accessibility, Token Queue & Barrier-Free Access',
    category: 'Patient Experience',
    description:
      'Wheelchair-accessible ground-corridor entry in Sector 18, dedicated senior-citizen seating, sterilized examination rooms, and predictable online token slots.',
    highlights: [
      'Under 12-minute average OPD wait for online bookings',
      'Dedicated parking bay & elevator access',
      'Digital printed & WhatsApp prescription summary',
    ],
  },
];

export default function FacilitiesPage() {
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
              <BuildingIcon size={14} color="currentColor" />
              <span>Clinical Infrastructure &bull; Diagnostics &amp; Safety</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '820px', marginBottom: '12px' }}>
              Clinic Facilities &amp;{' '}
              <span className="ms-hero-serif">Diagnostic Suite</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '700px', margin: 0 }}>
              Designed for accurate diagnosis in a single visit &mdash; combining point-of-care diagnostics, digital ECG, cold-chain immunization, and senior-friendly outpatient rooms.
            </p>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            <div className="ms-grid-2" style={{ gap: '22px' }}>
              {CLINIC_FACILITIES.map((item, idx) => {
                const IconComp =
                  idx === 0
                    ? MicroscopeIcon
                    : idx === 1
                      ? ShieldCheckIcon
                      : idx === 2
                        ? HeartPulseIcon
                        : BuildingIcon;
                return (
                  <article
                    key={item.title}
                    className="ms-editorial-card"
                    style={{ justifyContent: 'space-between', padding: '26px' }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '14px',
                        }}
                      >
                        <div className="ms-icon-tile">
                          <IconComp size={20} color="currentColor" />
                        </div>
                        <span className="ms-tag">{item.category}</span>
                      </div>

                      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 10px 0' }}>
                        {item.title}
                      </h2>
                      <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {item.highlights.map((h) => (
                          <div
                            key={h}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13.5px',
                              color: 'var(--ink)',
                            }}
                          >
                            <CheckCircleIcon size={15} color="var(--brand)" style={{ flexShrink: 0 }} />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link href="/contact" className="ms-pill ms-pill-dark ms-pill-block">
                      <CalendarIcon size={15} color="#FFFFFF" />
                      <span>Schedule Diagnostic Visit</span>
                      <PillArrowIcon />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
