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

      {/* Center: Global Search Bar */}
      <div style={{ position: 'relative', width: '380px' }}>
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
            padding: '9px 36px 9px 36px',
            borderRadius: 'var(--radius-md, 10px)',
            border: '1px solid var(--color-border-subtle, #CBD5E1)',
            fontSize: '13px',
            background: 'var(--color-bg-surface, #F8FAFC)',
            color: 'var(--color-text-main, #0F172A)',
            boxSizing: 'border-box',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '11px',
            color: 'var(--color-text-muted, #94A3B8)',
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
            right: '10px',
            top: '9px',
            background: 'var(--color-border-subtle, #E2E8F0)',
            color: 'var(--color-text-muted, #64748B)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs, 4px)',
            fontSize: '10px',
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right: Actions, Theme Switcher & Doctor Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Dedicated Navbar Button for Page Slots (7 Pages) */}
        <Link
          href="/cms/pages"
          className="cms-focus-ring"
          title="Open Page Slots Manager (7-Page Architecture)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 13px',
            borderRadius: 'var(--radius-md, 10px)',
            background: 'var(--color-bg-surface, #F1F5F9)',
            color: 'var(--color-brand-primary, #0D5C46)',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid var(--color-border-subtle, #CBD5E1)',
            transition: 'all 150ms ease',
          }}
        >
          <GlobeIcon size={14} color="var(--color-brand-primary, #0D5C46)" />
          <span>Page Slots</span>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 800,
              background: 'var(--color-brand-surface, #E6F4F1)',
              color: 'var(--color-brand-primary, #0D5C46)',
              border: '1px solid var(--color-border-subtle, #BFE3DC)',
            }}
          >
            7 Active
          </span>
        </Link>

        {/* View Live Patient Website */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="cms-focus-ring"
          title="Open live patient website in a new tab"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-md, 10px)',
            background: 'var(--color-brand-surface, #E6F4F1)',
            color: 'var(--color-brand-primary, #0D5C46)',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid var(--color-border-subtle, #BFE3DC)',
            transition: 'background-color 150ms ease',
          }}
        >
          <span>Live Site</span>
          <ExternalLinkIcon size={13} color="currentColor" />
        </a>

        {/* Light / Dark Mode Toggle Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Toggle theme (currently ${theme})`}
          className="cms-focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-md, 10px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            background: 'var(--color-bg-base, #FFFFFF)',
            color: 'var(--color-text-main, #0F172A)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
          }}
        >
          <PaletteIcon size={15} color="var(--color-brand-primary, #0D5C46)" />
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
              background: 'var(--color-brand-primary, #0D5C46)',
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

