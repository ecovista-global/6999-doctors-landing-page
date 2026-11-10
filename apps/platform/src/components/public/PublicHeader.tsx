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
} from '@/components/Icons';

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

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
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
          <span>Staff CMS Control Panel (Edit All Content &amp; Manage Appointments) &rarr;</span>
        </Link>
      </div>

      {/* 2. MAIN CLINICAL HEADER */}
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
          {PUBLIC_NAV_LINKS.map((link) => {
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
            <span>Call Clinic</span>
          </a>
        </nav>

        {/* Mobile Hamburger / Quick Call */}
        <div
          className="mobile-nav-toggle"
          style={{ display: 'none', alignItems: 'center', gap: '8px' }}
        >
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
            {PUBLIC_NAV_LINKS.map((link) => {
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
                <span>Call Clinic</span>
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
