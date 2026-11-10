'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DoctorContent } from '@/lib/contentStore';
import {
  StethoscopeIcon,
  PhoneIcon,
  MessageCircleIcon,
  CalendarIcon,
  MenuIcon,
  XIcon,
  LockIcon as KeyIcon,
  ChevronRightIcon,
  ActivityIcon,
  GlobeIcon,
  BellIcon,
  AlertTriangleIcon,
} from '@/components/Icons';
import { TRANSLATIONS, type Locale } from '@/lib/translations';

export interface PublicHeaderProps {
  content: DoctorContent;
  theme: {
    primary: string;
    primaryDark: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Doctor', href: '/about' },
  { label: 'Treatments & Services', href: '/services' },
  { label: 'Doctors & Specialists', href: '/doctors' },
  { label: 'Reviews & FAQs', href: '/testimonials-faq' },
  { label: 'Health Blog', href: '/blog' },
  { label: 'Contact & Booking', href: '/contact' },
];

export function PublicHeader({ content, theme }: PublicHeaderProps) {
  const pathname = usePathname() || '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const t = TRANSLATIONS[locale] || TRANSLATIONS.en;

  const navLinks = [
    { label: t.home, href: '/' },
    { label: t.aboutDoctor, href: '/about' },
    { label: t.services, href: '/services' },
    { label: t.specialists, href: '/doctors' },
    { label: t.reviewsFaq, href: '/testimonials-faq' },
    { label: t.healthBlog, href: '/blog' },
    { label: t.contactBooking, href: '/contact' },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <>
      {/* 1. TOP LIVE EDGE SYNC & CMS SHORTCUT BAR */}
      <div
        style={{
          background: '#0F172A',
          color: '#F8FAFC',
          padding: '8px 24px',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative',
          zIndex: 60,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: '#10B981',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          />
          <span>
            <strong>Live Clinical Edge:</strong> Theme: <strong>{content.theme}</strong> &bull; Synced with DoctorSite Pro CMS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Bilingual Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            aria-label="Toggle Language English / Hindi"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '6px',
              color: '#FFFFFF',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <GlobeIcon size={12} color="#FFFFFF" />
            <span>{locale === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          <Link
            href="/cms"
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '5px 14px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <KeyIcon size={14} color="#FFFFFF" />
            <span>Staff CMS Control Panel &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2. CLINIC EMERGENCY / BROADCAST ADVISORY BANNER */}
      {content.announcement && showAnnouncement && (
        <div
          style={{
            background: '#0284C7',
            color: '#FFFFFF',
            padding: '7px 24px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellIcon size={14} color="#FFFFFF" />
            <span>
              <strong>{locale === 'hi' ? 'क्लीनिक परामर्श सूचना:' : 'Clinic Notice:'}</strong> {content.announcement}
            </span>
          </div>
          <button
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss clinic announcement"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '2px 4px',
              opacity: 0.85,
            }}
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* 3. MAIN CLINICAL HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#FFFFFF',
          zIndex: 50,
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Brand Clinic Logo & Name */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: theme.primary,
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <StethoscopeIcon size={22} color="#FFFFFF" />
          </div>
          <div>
            <div
              style={{
                fontWeight: '800',
                fontSize: '17px',
                color: theme.primary,
                letterSpacing: '-0.3px',
              }}
            >
              {content.clinic.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {content.doctor.name} &bull; {content.doctor.degree}
            </div>
          </div>
        </Link>

        {/* Desktop 7-Page Navigation */}
        <nav
          className="desktop-nav"
          aria-label="Patient Website Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  padding: '7px 11px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: active ? theme.primary : '#475569',
                  background: active ? theme.bg : 'transparent',
                  fontWeight: active ? '700' : '600',
                  borderBottom: active ? `2px solid ${theme.primary}` : '2px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Quick Call Action */}
          <a
            href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '7px 14px',
              borderRadius: '7px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '8px',
            }}
          >
            <PhoneIcon size={14} color="#FFFFFF" />
            <span>{t.callClinic}</span>
          </a>
        </nav>

        {/* Mobile Hamburger / Quick Call */}
        <div
          className="mobile-nav-toggle"
          style={{ display: 'none', alignItems: 'center', gap: '8px' }}
        >
          <button
            type="button"
            onClick={toggleLocale}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              color: '#334155',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {locale === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <a
            href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PhoneIcon size={14} color="#FFFFFF" />
            <span>Call</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
            }}
          >
            {mobileMenuOpen ? <XIcon size={20} color="#0F172A" /> : <MenuIcon size={20} color="#0F172A" />}
          </button>
        </div>
      </header>

      {/* 4. LIVE OPD QUEUE TRACKER STRIP */}
      <div
        data-testid="live-opd-queue-strip"
        style={{
          background: 'linear-gradient(90deg, #F0FDF4 0%, #ECFDF5 100%)',
          borderBottom: '1px solid #BBF7D0',
          padding: '8px 24px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#065F46' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#059669',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
              }}
            />
            <span>{locale === 'hi' ? 'लाइव ओपीडी टोकन:' : 'Live OPD Serving:'}</span>
            <span
              style={{
                background: '#059669',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '12px',
              }}
            >
              #{content.availability.currentServingToken || 4}
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600 }}>
            {content.availability.runningLateMinutes > 0 ? (
              <span style={{ color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <AlertTriangleIcon size={14} color="#D97706" />
                <span>
                  {locale === 'hi'
                    ? `विलंब: ${content.availability.runningLateMinutes} मिनट (${content.availability.runningLateReason || 'आपातकालीन मरीज'})`
                    : `Delay: ${content.availability.runningLateMinutes} mins (${content.availability.runningLateReason || 'Emergency acute review'})`}
                </span>
              </span>
            ) : (
              <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ActivityIcon size={14} color="#059669" />
                <span>{locale === 'hi' ? 'चिकित्सक समय पर उपस्थित' : 'Doctor On Time'}</span>
              </span>
            )}
          </div>

          <div style={{ color: '#475569', fontSize: '12px' }}>
            <span>
              {locale === 'hi' ? 'अगला स्लॉट:' : 'Next Slot:'}{' '}
              <strong style={{ color: '#0F172A' }}>{content.availability.nextAvailableSlot || 'Today, 05:30 PM'}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/contact#book"
            style={{
              background: '#047857',
              color: '#FFFFFF',
              padding: '5px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 2px rgba(4,120,87,0.2)',
            }}
          >
            <span>{locale === 'hi' ? 'टोकन बुक करें' : 'Book Next Slot'} &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            background: '#FFFFFF',
            borderBottom: '2px solid #E2E8F0',
            padding: '16px 20px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
            zIndex: 49,
            position: 'sticky',
            top: '67px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: active ? '700' : '600',
                    fontSize: '14px',
                    color: active ? theme.primary : '#334155',
                    background: active ? theme.bg : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{link.label}</span>
                  <ChevronRightIcon size={16} color={active ? theme.primary : '#94A3B8'} />
                </Link>
              );
            })}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <a
                href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
                style={{
                  flex: 1,
                  background: theme.primary,
                  color: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <PhoneIcon size={16} color="#FFFFFF" />
                <span>{t.callClinic}</span>
              </a>
              <a
                href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  background: '#25D366',
                  color: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <MessageCircleIcon size={16} color="#FFFFFF" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
