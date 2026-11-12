'use client';

import React from 'react';
import Link from 'next/link';
import {
  SearchIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  PaletteIcon,
  ShieldCheckIcon,
  GlobeIcon,
} from '@/components/Icons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  theme?: 'light' | 'dark' | 'green' | 'teal';
  onToggleTheme?: () => void;
  doctorName?: string;
  roleName?: string;
  onOpenSearch?: () => void;
}

export function Header({
  breadcrumbs = [{ label: 'CMS' }, { label: 'Submissions' }, { label: 'Appointments' }],
  searchQuery = '',
  onSearchChange,
  theme = 'light',
  onToggleTheme,
  doctorName = 'Dr. Maanvita Kumari',
  roleName = 'Clinic Owner',
  onOpenSearch,
}: HeaderProps) {
  return (
    <header
      aria-label="CMS Top Header"
      style={{
        height: '68px',
        background: 'var(--color-bg-base, #FFFFFF)',
        borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
      }}
    >
      {/* Left: Breadcrumbs Hierarchy */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center' }}>
        <ol
          style={{
            listStyle: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
            padding: 0,
          }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: isLast ? 700 : 500,
                  color: isLast
                    ? 'var(--color-text-main, #0F172A)'
                    : 'var(--color-text-muted, #64748B)',
                }}
              >
                {crumb.href && !isLast ? (
                  <a
                    href={crumb.href}
                    className="cms-focus-ring"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      transition: 'color 150ms ease',
                    }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                )}
                {!isLast && (
                  <span style={{ color: 'var(--color-text-muted, #94A3B8)', display: 'flex', alignItems: 'center' }}>
                    <ChevronRightIcon size={14} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Center: Pill Search Bar */}
      <div style={{ position: 'relative', width: '360px', maxWidth: '38vw' }}>
        <input
          type="search"
          aria-label="Search patients, appointments, services, reviews"
          placeholder="Search patients, appointments, services..."
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          onClick={onOpenSearch}
          className="cms-focus-ring"
          style={{
            width: '100%',
            padding: '9px 44px 9px 38px',
            borderRadius: '9999px',
            border: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.12))',
            fontSize: '13px',
            background: 'var(--color-bg-surface, #F5F8F9)',
            color: 'var(--color-text-main, #162228)',
            boxSizing: 'border-box',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '14px',
            top: '10px',
            color: 'var(--color-text-muted, #54666E)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SearchIcon size={16} color="currentColor" />
        </span>
        <span
          style={{
            position: 'absolute',
            right: '12px',
            top: '8px',
            background: 'var(--color-bg-base, #FFFFFF)',
            border: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.12))',
            color: 'var(--color-text-muted, #54666E)',
            padding: '2px 7px',
            borderRadius: '9999px',
            fontSize: '10px',
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right: Actions, Theme Switcher & Doctor Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Dedicated Navbar Pill for Page Slots (Up to 10 Pages) */}
        <Link
          href="/cms/pages"
          className="cms-focus-ring ms-pill-light"
          title="Open Page Slots Manager (10-Page Architecture)"
          style={{
            padding: '6px 13px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-main, #162228)',
            textDecoration: 'none',
          }}
        >
          <GlobeIcon size={14} color="var(--color-brand-primary, #183C4A)" />
          <span>Page Slots</span>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 700,
              background: 'var(--color-brand-surface, #E7F2F5)',
              color: 'var(--color-brand-primary, #183C4A)',
            }}
          >
            10 Active
          </span>
        </Link>

        {/* View Live Patient Website — Signature MedSphere Dark Pill CTA with white left circle */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="cms-focus-ring ms-pill-dark"
          title="Open live patient website in a new tab"
          style={{
            padding: '4px 14px 4px 4px',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span className="ms-pill-circle" style={{ width: '26px', height: '26px' }}>
            <ExternalLinkIcon size={13} color="#183C4A" />
          </span>
          <span>Live Site</span>
        </a>

        {/* Light / Dark Mode Toggle Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Toggle theme (currently ${theme})`}
          className="cms-focus-ring ms-pill-light"
          style={{
            padding: '7px 13px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <PaletteIcon size={14} color="var(--color-brand-primary, #183C4A)" />
          <span style={{ textTransform: 'capitalize' }}>{theme}</span>
        </button>

        {/* Doctor Identity & Role Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingLeft: '10px',
            borderLeft: '1px solid var(--color-border-subtle, #E2E8F0)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-brand-primary, #183C4A)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {doctorName.replace('Dr. ', '')[0] || 'D'}
            <span
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-status-confirmed, #059669)',
                border: '2px solid #FFFFFF',
              }}
              title="Online"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-text-main, #0F172A)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {doctorName}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted, #64748B)',
                fontWeight: 600,
              }}
            >
              {roleName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

