'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DoctorContent } from '@/lib/contentStore';
import {
  PhoneIcon,
  MessageCircleIcon,
  LockIcon as KeyIcon,
  StethoscopeIcon,
  CalendarIcon,
} from '@/components/Icons';
import { MedSphereBrandTile, PUBLIC_NAV_LINKS } from './PublicHeader';

export interface PublicFooterProps {
  content: DoctorContent;
  theme?: {
    primary: string;
    primaryDark: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export function PublicFooter({ content }: PublicFooterProps) {
  const pathname = usePathname();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const bookHref = pathname === '/' ? '#lead-form' : '/contact#lead-form';

  return (
    <div className="ms-public-shell" style={{ minHeight: 'auto', background: 'transparent', paddingBottom: 0 }}>
      <footer className="ms-footer" role="contentinfo">
        <div className="ms-wrap">
          <div className="ms-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span
                  className="ms-brand-tile"
                  style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)' }}
                  aria-hidden="true"
                >
                  <MedSphereBrandTile size={16} />
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                  {content.clinic.name}
                </span>
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#D7E8EE', marginBottom: '12px' }}>
                {content.doctor.bio}
              </p>
              <div style={{ fontSize: '13px', color: '#C7DCE3' }}>
                Reg: {content.doctor.registrationNumber} &bull; {content.doctor.medicalCouncil}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                Clinic Directory
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '6px 12px',
                }}
              >
                {PUBLIC_NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="ms-footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                OPD Hours &amp; Centre
              </h3>
              <div style={{ fontSize: '14.5px', lineHeight: 1.55, color: '#D7E8EE', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  {content.clinic.street}, {content.clinic.area}, {content.clinic.city},{' '}
                  {content.clinic.state} {content.clinic.pincode}
                </div>
                <div>Mon&ndash;Fri: {content.clinic.schedule.weekdayHours}</div>
                <div>Saturday: {content.clinic.schedule.saturdayHours}</div>
                <div>Emergency Notice: Dial 112 for acute trauma or chest pain.</div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                Patient Support &amp; Staff
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`}
                  className="ms-footer-link"
                  style={{ gap: '8px', textDecoration: 'none' }}
                >
                  <PhoneIcon size={14} color="#FFFFFF" />
                  <span>{content.doctor.phone}</span>
                </a>
                <a
                  href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ms-footer-link"
                  style={{ gap: '8px', textDecoration: 'none' }}
                >
                  <MessageCircleIcon size={14} color="#86EFAC" />
                  <span>WhatsApp Consultation Desk</span>
                </a>
                <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.16)' }}>
                  <Link
                    href="/cms"
                    className="ms-footer-link"
                    style={{ gap: '7px', fontSize: '13.5px', fontWeight: 600 }}
                  >
                    <KeyIcon size={13} color="#FFFFFF" />
                    <span>Clinic Staff CMS &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.18)',
              paddingTop: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <p style={{ fontSize: '13.5px', color: '#D7E8EE', margin: 0 }}>
              &copy; {new Date().getFullYear()} {content.clinic.name}. Compliant with DPDP Act 2023 &amp; NMC Telemedicine Guidelines.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              style={{
                background: 'transparent',
                border: 0,
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Return to Top
            </button>
          </div>
        </div>
      </footer>

      {/* Shared Sticky Mobile Action Bar (< 768px) across all public pages */}
      <nav className="ms-mobile-bar" aria-label="Quick clinic actions">
        <a href={`tel:${content.doctor.phone.replace(/[^0-9+]/g, '')}`} className="ms-mobile-bar-btn">
          <PhoneIcon size={17} color="currentColor" />
          <span>Contact</span>
        </a>
        <Link href="/doctors" className="ms-mobile-bar-btn">
          <StethoscopeIcon size={17} color="currentColor" />
          <span>Doctors</span>
        </Link>
        <Link href={bookHref} className="ms-mobile-bar-btn">
          <CalendarIcon size={17} color="currentColor" />
          <span>Book Visit</span>
        </Link>
      </nav>
    </div>
  );
}
