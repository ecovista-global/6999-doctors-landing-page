import React, { useState, useEffect } from 'react';
import { LogoMark, PhoneIcon, MessageCircleIcon, MenuIcon, XIcon } from '@ecodigitech/ui/icons';

export interface NavItem {
  label: string;
  href: string;
  id: string;
}

export const SEVEN_PAGE_NAV: NavItem[] = [
  { label: 'Home', href: '/', id: 'home' },
  { label: 'About', href: '/about', id: 'about' },
  { label: 'Services', href: '/services', id: 'services' },
  { label: 'Doctors', href: '/doctors', id: 'doctors' },
  { label: 'Testimonials & FAQ', href: '/testimonials-faq', id: 'testimonials-faq' },
  { label: 'Blog', href: '/blog', id: 'blog' },
  { label: 'Contact & Appointment', href: '/contact', id: 'contact' },
];

export interface HeaderProps {
  clinicName?: string | undefined;
  phone?: string | undefined;
  whatsappNumber?: string | undefined;
  currentPath?: string | undefined;
  navItems?: NavItem[] | undefined;
}

export const Header: React.FC<HeaderProps> = ({
  clinicName = 'HealthConsult Family Clinic',
  phone = '+919876543210',
  whatsappNumber = '919876543210',
  currentPath = '/',
  navItems = SEVEN_PAGE_NAV,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <header className="site-header" role="banner">
      <div className="container header-container">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" aria-label={`${clinicName} Home`}>
          <LogoMark size={34} className="brand-icon" />
          <span className="brand-name">
            <strong>Health</strong>Consult
          </span>
        </a>

        {/* Desktop 7-Page Navigation */}
        <nav className="nav-links" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <a
                key={item.id}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="header-actions">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Clinic"
          >
            <MessageCircleIcon size={16} className="btn-icon" />
            WhatsApp Clinic
          </a>
          <a
            href={`tel:${phone}`}
            className="btn btn-primary btn-sm"
            id="header-call-btn"
            aria-label={`Call Clinic at ${phone}`}
          >
            <PhoneIcon size={16} className="btn-icon" />
            Call Doctor
          </a>
        </div>

        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={toggleDrawer}
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {drawerOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Responsive Navigation Drawer */}
      <div
        id="mobile-nav-drawer"
        className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
      >
        <div className="drawer-header">
          <div className="drawer-brand">
            <LogoMark size={28} className="brand-icon" />
            <span className="drawer-title">{clinicName}</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            <XIcon size={22} />
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Mobile Drawer Navigation">
          <ul className="drawer-nav-list">
            {navItems.map((item) => {
              const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
              return (
                <li key={item.id} className="drawer-nav-item">
                  <a
                    href={item.href}
                    className={`drawer-nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeDrawer}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="drawer-footer-actions">
          <a
            href={`tel:${phone}`}
            className="btn btn-primary btn-block"
            onClick={closeDrawer}
            aria-label={`Call Doctor at ${phone}`}
          >
            <PhoneIcon size={18} className="btn-icon" />
            Call Doctor Directly
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            className="btn btn-secondary btn-block"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeDrawer}
            aria-label="WhatsApp Clinic Desk"
          >
            <MessageCircleIcon size={18} className="btn-icon" />
            WhatsApp Clinic Desk
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
