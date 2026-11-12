'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  StethoscopeIcon,
  HeartPulseIcon,
  ActivityIcon,
  ThermometerIcon,
  PillIcon,
  UserCheckIcon,
  SyringeIcon,
  MicroscopeIcon,
  ShieldCheckIcon,
  ClockIcon,
  SearchIcon,
  CalendarIcon,
} from '@/components/Icons';

function getServiceIcon(id: string) {
  switch (id) {
    case 'srv-1': return <StethoscopeIcon size={22} color="currentColor" />;
    case 'srv-2': return <HeartPulseIcon size={22} color="currentColor" />;
    case 'srv-3': return <ActivityIcon size={22} color="currentColor" />;
    case 'srv-4': return <ThermometerIcon size={22} color="currentColor" />;
    case 'srv-5': return <PillIcon size={22} color="currentColor" />;
    case 'srv-6': return <UserCheckIcon size={22} color="currentColor" />;
    case 'srv-7': return <SyringeIcon size={22} color="currentColor" />;
    case 'srv-8': return <MicroscopeIcon size={22} color="currentColor" />;
    default: return <ShieldCheckIcon size={22} color="currentColor" />;
  }
}

export default function ServicesPage() {
  const { content } = useClinicContent();
  const [search, setSearch] = useState('');

  const filteredServices = content.services.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

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
              <span>Specialized Internal Medicine &bull; {content.services.length} Clinical Domains</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '820px', marginBottom: '12px' }}>
              Comprehensive Clinical{' '}
              <span className="ms-hero-serif">Treatments &amp; Care</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '700px', margin: '0 auto 24px auto' }}>
              Evidence-based outpatient consultations by {content.doctor.name}, {content.doctor.degree}, covering chronic disease management, metabolic disorders, acute illnesses, and preventive screenings.
            </p>

            <div className="ms-search-wrap">
              <input
                type="search"
                aria-label="Search clinical treatments"
                placeholder="Search treatments (e.g., Diabetes, Dengue, Thyroid, ECG)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ms-search-input"
              />
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon size={18} />
              </span>
            </div>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            {filteredServices.length === 0 ? (
              <div className="ms-surface-box" style={{ textAlign: 'center', padding: '44px 20px' }}>
                <p className="ms-desc" style={{ marginBottom: '14px' }}>
                  No clinical treatments matched &ldquo;{search}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="ms-pill ms-pill-dark"
                >
                  <span>Reset Search</span>
                </button>
              </div>
            ) : (
              <div className="ms-grid-3">
                {filteredServices.map((service, index) => (
                  <article
                    key={service.id || index}
                    className="ms-editorial-card"
                    style={{ justifyContent: 'space-between', padding: '22px' }}
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
                        <div className="ms-icon-tile">{getServiceIcon(service.id)}</div>
                        <span className="ms-tag">OPD Consultation</span>
                      </div>

                      <h2 style={{ fontSize: '18.5px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0' }}>
                        {service.title}
                      </h2>
                      <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 18px 0' }}>
                        {service.description}
                      </p>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderTop: '1px solid var(--border)',
                          marginBottom: '14px',
                          fontSize: '13.5px',
                        }}
                      >
                        <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <ClockIcon size={14} color="currentColor" />
                          <span>20&ndash;30 Mins</span>
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                          Fee: &#8377;{content.doctor.consultationFee}
                        </span>
                      </div>

                      <Link
                        href={`/contact?service=${encodeURIComponent(service.title)}`}
                        className="ms-pill ms-pill-dark ms-pill-block"
                        style={{ minHeight: '42px', fontSize: '14px' }}
                      >
                        <CalendarIcon size={14} color="#FFFFFF" />
                        <span>Book Consultation</span>
                        <PillArrowIcon />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
