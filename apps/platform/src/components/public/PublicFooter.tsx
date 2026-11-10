'use client';

import React from 'react';
import Link from 'next/link';
import type { DoctorContent } from '@/lib/contentStore';
import {
  StethoscopeIcon,
  PhoneIcon,
  MessageCircleIcon,
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  LockIcon as KeyIcon,
} from '@/components/Icons';
import { PUBLIC_NAV_LINKS } from './PublicHeader';

export interface PublicFooterProps {
  content: DoctorContent;
  theme: {
    primary: string;
    primaryDark: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export function PublicFooter({ content, theme }: PublicFooterProps) {
  return (
    <footer
      style={{
        background: '#0F172A',
        color: '#94A3B8',
        padding: '54px 24px 36px 24px',
        fontSize: '13px',
        borderTop: '1px solid #1E293B',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
        }}
      >
        {/* Column 1: Clinic & Doctor Identity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: theme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
              }}
            >
              <StethoscopeIcon size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#FFFFFF' }}>
                {content.clinic.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {content.clinic.tagline}
              </div>
            </div>
          </div>
          <p style={{ lineHeight: '1.6', margin: '0 0 14px 0', fontSize: '12px' }}>
            {content.doctor.bio}
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#1E293B',
              border: '1px solid #334155',
              fontSize: '11px',
              color: '#38BDF8',
            }}
          >
            <ShieldCheckIcon size={13} color="#38BDF8" />
            <span>Registration: {content.doctor.registrationNumber}</span>
          </div>
        </div>

        {/* Column 2: 7-Page Architecture Directory */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#F1F5F9',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px',
            }}
          >
            7-Page Clinic Directory
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {PUBLIC_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    color: '#94A3B8',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 150ms ease',
                  }}
                >
                  <span style={{ color: theme.accent }}>&rsaquo;</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Clinic Timings & Schedule */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#F1F5F9',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px',
            }}
          >
            OPD Timings &amp; Location
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <ClockIcon size={15} color="#38BDF8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#E2E8F0' }}>Monday - Friday:</strong>
                <div style={{ fontSize: '12px' }}>{content.clinic.schedule.weekdayHours}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <ClockIcon size={15} color="#38BDF8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#E2E8F0' }}>Saturday:</strong>
                <div style={{ fontSize: '12px' }}>{content.clinic.schedule.saturdayHours}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <MapPinIcon size={15} color="#38BDF8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#E2E8F0' }}>Location:</strong>
                <div style={{ fontSize: '12px' }}>
                  {content.clinic.street}, {content.clinic.area}, {content.clinic.city}, {content.clinic.state} - {content.clinic.pincode}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Quick Contact & Staff CMS Shortcut */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#F1F5F9',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px',
            }}
          >
            Patient Care &amp; Admin
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#E2E8F0',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              <PhoneIcon size={14} color="#38BDF8" />
              <span>{content.doctor.phone}</span>
            </a>
            <a
              href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#E2E8F0',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              <MessageCircleIcon size={14} color="#25D366" />
              <span>WhatsApp Consultation Desk</span>
            </a>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1E293B' }}>
              <Link
                href="/cms"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#38BDF8',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                <KeyIcon size={13} color="#38BDF8" />
                <span>Doctor &amp; Staff CMS Login &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Legal & DPDP Compliance */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '36px auto 0 auto',
          paddingTop: '20px',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          color: '#64748B',
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} {content.clinic.name}. All medical rights reserved. Reg No: {content.doctor.registrationNumber}.
        </div>
        <div>
          Compliant with Digital Personal Data Protection (DPDP) Act 2023 &bull; Encrypted Telehealth Architecture
        </div>
      </div>
    </footer>
  );
}
