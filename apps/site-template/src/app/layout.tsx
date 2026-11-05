import React from 'react';
import { Header, type NavItem } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { MobileCtaBar } from '../components/MobileCtaBar.js';

export interface LayoutProps {
  children: React.ReactNode;
  currentPath?: string | undefined;
  clinicName?: string | undefined;
  doctorName?: string | undefined;
  degrees?: string | undefined;
  registration?: string | undefined;
  council?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  whatsappNumber?: string | undefined;
  hours?: string | undefined;
  email?: string | undefined;
  navItems?: NavItem[] | undefined;
}

export const PublicLayout: React.FC<LayoutProps> = ({
  children,
  currentPath = '/',
  clinicName = 'HealthConsult Family Clinic',
  doctorName = 'Dr. Maanvita Kumari',
  degrees = 'MBBS, MD - General Medicine',
  registration = 'DMC/R/28491',
  council = 'Delhi Medical Council',
  address = 'Plot 14, Health Plaza, Central Market, Sector 18, Noida – 201301',
  phone = '+91 98765 43210',
  whatsappNumber = '919876543210',
  hours = 'Mon – Sat: 09:00 AM – 08:00 PM',
  email = 'contact@healthconsult.in',
  navItems,
}) => {
  return (
    <div className="site-layout">
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Shared 7-Page Navigation Header */}
      <Header
        clinicName={clinicName}
        phone={phone.replace(/\s+/g, '')}
        whatsappNumber={whatsappNumber}
        currentPath={currentPath}
        navItems={navItems}
      />

      {/* Main Page Content */}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Shared Footer with NAP + DPDP Notice */}
      <Footer
        clinicName={clinicName}
        doctorName={doctorName}
        degrees={degrees}
        registration={registration}
        council={council}
        address={address}
        phone={phone}
        hours={hours}
        email={email}
        navItems={navItems}
      />

      {/* Sticky Mobile CTA Bar (< 768px, 48px touch targets) */}
      <MobileCtaBar
        phone={phone.replace(/\s+/g, '')}
        doctorName={doctorName}
        whatsappNumber={whatsappNumber}
        appointmentHref="/contact"
      />
    </div>
  );
};

export default PublicLayout;
