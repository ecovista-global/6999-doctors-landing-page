'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  StethoscopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  SearchIcon,
} from '@/components/Icons';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';

interface DirectoryDoctorItem {
  id: string;
  name: string;
  role: string;
  degrees: string;
  college: string | null;
  registration: string;
  department: string;
  specialties: string[];
  experience: string | null;
  schedule: string | null;
  fee: number | string;
  bio: string | null;
  photoUrl?: string | null;
}

const FALLBACK_PORTRAITS = [
  '/images/avatar-1.jpg',
  '/images/avatar-2.jpg',
  '/images/avatar-3.jpg',
];

export default function DoctorsRosterPage() {
  const { content } = useClinicContent();
  const [doctors, setDoctors] = useState<DirectoryDoctorItem[]>(
    CLINICAL_DOCTORS.map((d, idx) => ({
      ...d,
      department:
        idx === 0
          ? 'Internal Medicine'
          : idx === 1
            ? 'Family & Pediatric Medicine'
            : 'Clinical Nutrition',
      photoUrl: FALLBACK_PORTRAITS[idx % FALLBACK_PORTRAITS.length] ?? null,
    }))
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const spec = params.get('specialty');
      if (spec) setSelectedFilter(spec);
    }

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

  const departments = useMemo(() => {
    const set = new Set<string>(['All']);
    for (const d of doctors) {
      if (d.department) set.add(d.department);
    }
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesDept =
        selectedFilter === 'All' ||
        doc.department?.toLowerCase() === selectedFilter.toLowerCase() ||
        doc.specialties.some((s) => s.toLowerCase().includes(selectedFilter.toLowerCase()));

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.role.toLowerCase().includes(q) ||
        doc.department.toLowerCase().includes(q) ||
        doc.specialties.some((s) => s.toLowerCase().includes(q));

      return matchesDept && matchesQuery;
    });
  }, [doctors, selectedFilter, searchQuery]);

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
              <ShieldCheckIcon size={14} color="currentColor" />
              <span>Verified Clinical Faculty &bull; Multi-Specialty Directory</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '820px', marginBottom: '12px' }}>
              Doctors &amp; Clinical{' '}
              <span className="ms-hero-serif">Specialists</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '680px', margin: '0 auto 24px auto' }}>
              Browse specialists by clinical department and book directly into a doctor&apos;s live outpatient slot calendar.
            </p>

            {/* Department Filter Pills + Search */}
            <div className="ms-chip-bar" style={{ width: '100%', maxWidth: '880px' }}>
              {departments.map((dept) => {
                const active = selectedFilter.toLowerCase() === dept.toLowerCase();
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedFilter(dept)}
                    className={`ms-chip-pill${active ? ' active' : ''}`}
                  >
                    {dept}
                  </button>
                );
              })}
              <div style={{ position: 'relative', minWidth: '220px', flex: '0 1 250px' }}>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctor or condition..."
                  aria-label="Filter specialists"
                  className="ms-search-input"
                  style={{ minHeight: '40px', fontSize: '13.5px', paddingLeft: '38px' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    pointerEvents: 'none',
                  }}
                >
                  <SearchIcon size={15} />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            {filteredDoctors.length === 0 ? (
              <div
                className="ms-surface-box"
                style={{ textAlign: 'center', padding: '48px 24px', borderStyle: 'dashed' }}
              >
                <StethoscopeIcon size={28} color="var(--brand)" />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: '12px 0 8px 0' }}>
                  No specialists matched &ldquo;{selectedFilter}&rdquo;
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter('All');
                    setSearchQuery('');
                  }}
                  className="ms-pill ms-pill-dark"
                >
                  <span>Show All Specialists</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredDoctors.map((doc, idx) => {
                  const displayFee = typeof doc.fee === 'number' ? `₹${doc.fee}` : doc.fee;
                  const avatarSrc = doc.photoUrl || FALLBACK_PORTRAITS[idx % FALLBACK_PORTRAITS.length];
                  return (
                    <article
                      key={doc.id}
                      className="ms-editorial-card"
                      style={{ padding: 'clamp(22px, 3vw, 32px)' }}
                    >
                      <div className="ms-split-2" style={{ alignItems: 'center' }}>
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              marginBottom: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <img
                              src={avatarSrc}
                              alt={`${doc.name} portrait`}
                              width={60}
                              height={60}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid var(--border)',
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                                <span className="ms-tag">{doc.department}</span>
                                {doc.experience && (
                                  <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                                    {doc.experience}
                                  </span>
                                )}
                              </div>
                              <h2 style={{ fontSize: '23px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                                {doc.name}
                              </h2>
                            </div>
                          </div>

                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brand)', marginBottom: '4px' }}>
                            {doc.degrees} &bull; {doc.role}
                          </div>
                          <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '12px' }}>
                            {doc.college || 'Accredited Medical Institution'} &bull; Reg:{' '}
                            <strong style={{ color: 'var(--ink)' }}>{doc.registration}</strong>
                          </div>

                          {doc.bio && (
                            <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                              {doc.bio}
                            </p>
                          )}

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {doc.specialties.map((s, sIdx) => (
                              <span key={sIdx} className="ms-tag-muted">
                                {s}
                              </span>
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
                            Consulting Schedule &amp; Timings
                          </div>

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                            <ClockIcon size={18} color="var(--brand)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.55 }}>
                              {doc.schedule || 'Mon - Sat OPD Hours'}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 0',
                              borderTop: '1px solid var(--border)',
                              borderBottom: '1px solid var(--border)',
                              marginBottom: '18px',
                            }}
                          >
                            <span style={{ fontSize: '13.5px', color: 'var(--muted)' }}>OPD Consultation Fee</span>
                            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>{displayFee}</span>
                          </div>

                          <Link
                            href={`/contact?doctor=${encodeURIComponent(doc.name)}&doctorId=${encodeURIComponent(doc.id)}`}
                            className="ms-pill ms-pill-dark ms-pill-block"
                          >
                            <CalendarIcon size={15} color="#FFFFFF" />
                            <span>Book with {doc.name}</span>
                            <PillArrowIcon />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
