import React from 'react';
import { MapPinIcon, PhoneIcon, ClockIcon, MailIcon } from '@ecodigitech/ui/icons';
import { SEVEN_PAGE_NAV, type NavItem } from './Header.js';

export interface FooterProps {
  clinicName?: string | undefined;
  doctorName?: string | undefined;
  degrees?: string | undefined;
  registration?: string | undefined;
  council?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  hours?: string | undefined;
  email?: string | undefined;
  navItems?: NavItem[] | undefined;
}

export const Footer: React.FC<FooterProps> = ({
  clinicName = 'HealthConsult Family Clinic',
  doctorName = 'Dr. Maanvita Kumari',
  degrees = 'MBBS, MD - General Medicine',
  registration = 'DMC/R/28491',
  council = 'Delhi Medical Council',
  address = 'Plot 14, Health Plaza, Central Market, Sector 18, Noida – 201301',
  phone = '+91 98765 43210',
  hours = 'Mon – Sat: 09:00 AM – 08:00 PM',
  email = 'contact@healthconsult.in',
  navItems = SEVEN_PAGE_NAV,
}) => {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: NAP & Credentials */}
          <div className="footer-col">
            <span className="footer-brand">{clinicName}</span>
            <p className="footer-bio">
              Led by {doctorName} ({degrees}), providing trusted, evidence-based healthcare for families.
            </p>
            <p className="footer-reg">
              Registration: {registration} • {council}
            </p>
          </div>

          {/* Column 2: 7-Page Navigation */}
          <div className="footer-col">
            <h4 className="footer-heading">Clinic Navigation</h4>
            <ul className="footer-links">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Clinical Specialties */}
          <div className="footer-col">
            <h4 className="footer-heading">Clinical Care</h4>
            <ul className="footer-links">
              <li><a href="/services#diabetes">Diabetes &amp; Hypertension</a></li>
              <li><a href="/services#infections">Fever &amp; Infection Care</a></li>
              <li><a href="/services#metabolic">Thyroid &amp; Metabolic Health</a></li>
              <li><a href="/services#geriatric">Geriatric &amp; Senior Medicine</a></li>
              <li><a href="/services#checkups">Preventive Family Health Checkup</a></li>
              <li><a href="/services#vaccinations">Adult Vaccination Schedules</a></li>
            </ul>
          </div>

          {/* Column 4: Clinic Contact & Hours (Clean SVG Icons, Zero Emoji) */}
          <div className="footer-col">
            <h4 className="footer-heading">Clinic Contact &amp; Hours</h4>
            <div className="footer-contact-item">
              <MapPinIcon size={18} className="footer-icon" aria-hidden="true" />
              <span>{address}</span>
            </div>
            <div className="footer-contact-item">
              <PhoneIcon size={18} className="footer-icon" aria-hidden="true" />
              <span>
                Phone: <a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
              </span>
            </div>
            <div className="footer-contact-item">
              <ClockIcon size={18} className="footer-icon" aria-hidden="true" />
              <span>{hours}</span>
            </div>
            <div className="footer-contact-item">
              <MailIcon size={18} className="footer-icon" aria-hidden="true" />
              <span>
                Email: <a href={`mailto:${email}`}>{email}</a>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: DPDP Notice & Attribution */}
        <div className="footer-bottom-bar">
          <div className="footer-dpdp">
            Patient data processed in accordance with the Digital Personal Data Protection (DPDP) Act, 2023.
          </div>
          <div className="footer-credit">
            Designed &amp; Hosted by <strong>EcoDigiTech</strong> • Fast, Verified Doctor Presence
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
