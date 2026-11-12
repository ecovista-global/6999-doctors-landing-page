'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DoctorContent } from '@/lib/contentStore';
import {
  PhoneIcon,
  MessageCircleIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
  GlobeIcon,
  BellIcon,
} from '@/components/Icons';
import { TRANSLATIONS, type Locale } from '@/lib/translations';

export interface PublicHeaderProps {
  content: DoctorContent;
  theme?: {
    primary: string;
    primaryDark: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Specialties', href: '/specialties' },
  { label: 'Doctors', href: '/doctors' },
  { label: 'Services', href: '/services' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Packages', href: '/health-packages' },
  { label: 'Reviews', href: '/testimonials-faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export function MedSphereBrandTile({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export function PillArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 6h8" />
      <path d="M4.5 2.5 8 6l-3.5 3.5" />
    </svg>
  );
}

export function PublicHeader({ content }: PublicHeaderProps) {
  const pathname = usePathname() || '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const [clinicalTheme, setClinicalTheme] = useState<'forest' | 'teal'>('forest');
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem('ms_clinical_theme');
      if (saved === 'teal' || saved === 'forest') {
        setClinicalTheme(saved);
        document.documentElement.dataset.clinicalTheme = saved;
      } else {
        document.documentElement.dataset.clinicalTheme = 'forest';
      }
    } catch {
      document.documentElement.dataset.clinicalTheme = 'forest';
    }
  }, []);

  const handleSetTheme = (next: 'forest' | 'teal') => {
    setClinicalTheme(next);
    document.documentElement.dataset.clinicalTheme = next;
    try {
      window.sessionStorage.setItem('ms_clinical_theme', next);
    } catch {
      // Ignore restricted session storage
    }
  };

  const t = TRANSLATIONS[locale] || TRANSLATIONS.en;

  const navLinks =
    locale === 'hi'
      ? [
          { label: t.home, href: '/' },
          { label: t.aboutDoctor, href: '/about' },
          { label: t.specialtiesMenu, href: '/specialties' },
          { label: t.specialists, href: '/doctors' },
          { label: t.services, href: '/services' },
          { label: t.facilities, href: '/facilities' },
          { label: t.healthPackages, href: '/health-packages' },
          { label: t.reviewsFaq, href: '/testimonials-faq' },
          { label: t.healthBlog, href: '/blog' },
          { label: t.contactBooking, href: '/contact' },
        ]
      : PUBLIC_NAV_LINKS;

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <div className="ms-public-shell" style={{ minHeight: 'auto', background: 'transparent' }}>
      <header className="ms-header" role="banner">
        <div className="ms-wrap ms-header-inner">
          <Link
            href="/"
            className="ms-brand-link"
            aria-label={`${content.clinic.name} Home`}
          >
            <span className="ms-brand-tile" aria-hidden="true">
              <MedSphereBrandTile size={18} />
            </span>
            <span className="ms-brand-title">
              {content.clinic.name.includes('HealthConsult')
                ? 'MedSphere Clinic'
                : content.clinic.name}
            </span>
          </Link>

          <nav className="ms-nav-links" aria-label="Patient Website Navigation">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`ms-nav-link ${active ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ms-header-actions">
            <div className="ms-theme-switcher" role="group" aria-label="Clinical Palette">
              <button
                type="button"
                className={`ms-theme-chip ${clinicalTheme === 'forest' ? 'active' : ''}`}
                onClick={() => handleSetTheme('forest')}
                aria-pressed={clinicalTheme === 'forest'}
              >
                Forest
              </button>
              <button
                type="button"
                className={`ms-theme-chip ${clinicalTheme === 'teal' ? 'active' : ''}`}
                onClick={() => handleSetTheme('teal')}
                aria-pressed={clinicalTheme === 'teal'}
              >
                Teal
              </button>
            </div>

            <button
              type="button"
              onClick={toggleLocale}
              className="ms-lang-chip"
              aria-label="Toggle Language English or Hindi"
            >
              <GlobeIcon size={13} color="currentColor" />
              <span>{locale === 'en' ? 'हिन्दी' : 'EN'}</span>
            </button>

            <Link href="/doctors" className="ms-pill ms-pill-dark">
              <span>{locale === 'hi' ? 'चिकित्सक देखें' : 'Find a Doctor'}</span>
              <PillArrowIcon />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="ms-mobile-toggle"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon size={20} color="currentColor" />
            </button>
          </div>
        </div>
      </header>

      {content.announcement && showAnnouncement && (
        <div
          style={{
            background: 'var(--mint)',
            borderBottom: '1px solid var(--border)',
            color: 'var(--brand)',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <div
            className="ms-wrap"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellIcon size={14} color="currentColor" />
              <span>
                <strong>{locale === 'hi' ? 'सूचना:' : 'Clinic Notice:'}</strong>{' '}
                {content.announcement}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnnouncement(false)}
              aria-label="Dismiss clinic announcement"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--brand)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <>
          <div
            className="ms-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="ms-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                <span className="ms-brand-tile" aria-hidden="true">
                  <MedSphereBrandTile size={16} />
                </span>
                <span>{content.clinic.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <XIcon size={18} color="currentColor" />
              </button>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navLinks.map((link) => {
                  const active = isLinkActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '44px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '15px',
                          fontWeight: active ? 700 : 500,
                          color: active ? 'var(--brand)' : 'var(--ink)',
                          background: active ? 'var(--mint)' : 'transparent',
                        }}
                      >
                        <span>{link.label}</span>
                        <ChevronRightIcon size={16} color="currentColor" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div
              style={{
                padding: '16px 20px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <Link
                href="/doctors"
                onClick={() => setMobileMenuOpen(false)}
                className="ms-pill ms-pill-dark ms-pill-block"
              >
                <span>Find a Doctor</span>
                <PillArrowIcon />
              </Link>
              <a
                href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
                className="ms-pill ms-pill-light ms-pill-block"
              >
                <PhoneIcon size={15} color="currentColor" />
                <span>{t.callClinic}</span>
              </a>
              <a
                href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="ms-pill ms-pill-light ms-pill-block"
              >
                <MessageCircleIcon size={15} color="currentColor" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
