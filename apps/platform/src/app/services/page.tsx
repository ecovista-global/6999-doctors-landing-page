'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
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
  ChevronRightIcon,
} from '@/components/Icons';

function getServiceIcon(id: string, color: string) {
  switch (id) {
    case 'srv-1': return <StethoscopeIcon size={26} color={color} />;
    case 'srv-2': return <HeartPulseIcon size={26} color={color} />;
    case 'srv-3': return <ActivityIcon size={26} color={color} />;
    case 'srv-4': return <ThermometerIcon size={26} color={color} />;
    case 'srv-5': return <PillIcon size={26} color={color} />;
    case 'srv-6': return <UserCheckIcon size={26} color={color} />;
    case 'srv-7': return <SyringeIcon size={26} color={color} />;
    case 'srv-8': return <MicroscopeIcon size={26} color={color} />;
    default: return <ShieldCheckIcon size={26} color={color} />;
  }
}

export default function ServicesPage() {
  const { content, theme, loading } = useClinicContent();
  const [search, setSearch] = useState('');

  if (loading && !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Clinical Services...</p>
      </div>
    );
  }

  const filteredServices = content.services.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Services Hero Section */}
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
            <StethoscopeIcon size={14} color={theme.primary} />
            <span>SPECIALIZED INTERNAL MEDICINE TREATMENTS &bull; ALL 9 CLINICAL DOMAINS</span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
            Comprehensive Clinical Treatments &amp; Care
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#64748B',
              maxWidth: '750px',
              margin: '0 auto 28px auto',
              lineHeight: '1.6',
            }}
          >
            Evidence-based outpatient consultations by Dr. Maanvita Kumari (MBBS, MD) covering chronic disease management, metabolic disorders, acute seasonal illnesses, and preventive health screenings.
          </p>

          {/* Search Treatments Input */}
          <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
            <input
              type="search"
              aria-label="Search clinical treatments"
              placeholder="Search treatments (e.g., Diabetes, Dengue, Thyroid, ECG)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 42px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '14px',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon size={18} />
            </span>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredServices.map((service, index) => (
            <div
              key={service.id || index}
              style={{
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getServiceIcon(service.id, theme.primary)}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.primary,
                      background: theme.bg,
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    OPD Consultation
                  </span>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px 0' }}>
                  {service.title}
                </h2>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
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
                    borderTop: '1px solid #F1F5F9',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ClockIcon size={14} color="#64748B" />
                    <span>20-30 Mins Consultation</span>
                  </span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>
                    Fee: ₹{content.doctor.consultationFee}
                  </span>
                </div>

                <Link
                  href={`/contact?service=${encodeURIComponent(service.title)}`}
                  style={{
                    width: '100%',
                    background: theme.primary,
                    color: '#FFFFFF',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <CalendarIcon size={14} color="#FFFFFF" />
                  <span>Book This Consultation</span>
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
