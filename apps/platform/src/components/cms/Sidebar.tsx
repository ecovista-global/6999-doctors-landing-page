'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogoMark,
  LayoutDashboardIcon,
  ActivityIcon,
  CalendarIcon,
  MessageCircleIcon,
  FileTextIcon,
  Edit3Icon,
  HelpCircleIcon,
  ImageIcon,
  SettingsIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  GlobeIcon,
} from '@/components/Icons';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  href?: string;
}

export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeNav: string;
  onSelectNav?: (id: string) => void;
  clinicName?: string;
  planName?: string;
  doctorName?: string;
  staffName?: string;
  newAppointmentsCount?: number;
}

export const defaultSidebarGroups: NavGroup[] = [
  {
    groupTitle: 'Clinical Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon size={18} />, href: '/cms' },
      { id: 'opd_board', label: "Today's OPD Board", icon: <ActivityIcon size={18} />, href: '/cms/submissions?tab=today' },
      { id: 'appointments', label: 'Appointments', icon: <CalendarIcon size={18} />, href: '/cms/submissions' },
      { id: 'enquiries', label: 'Patient Enquiries', icon: <MessageCircleIcon size={18} />, href: '/cms/submissions?tab=enquiries' },
    ],
  },
  {
    groupTitle: '7-Page Site CMS',
    items: [
      { id: 'pages', label: 'Page Slots (7 Pages)', icon: <GlobeIcon size={18} />, href: '/cms/pages', badge: '7 Active', badgeColor: '#059669' },
      { id: 'editor', label: 'Site Block Editor', icon: <FileTextIcon size={18} />, href: '/cms/editor' },
      { id: 'blog', label: 'Blog Posts', icon: <Edit3Icon size={18} />, href: '/cms/blog' },
      { id: 'faqs', label: 'FAQs & Reviews', icon: <HelpCircleIcon size={18} />, href: '/cms/reviews-faqs' },
      { id: 'media', label: 'Media Library', icon: <ImageIcon size={18} />, href: '/cms/media' },
    ],
  },
  {
    groupTitle: 'Governance & Audit',
    items: [
      { id: 'settings', label: 'Settings & Security', icon: <SettingsIcon size={18} />, href: '/cms/settings' },
      { id: 'versions', label: 'Version History', icon: <RefreshCwIcon size={18} />, href: '/cms/versions' },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeNav,
  onSelectNav,
  clinicName = 'HealthConsult Clinic',
  planName = 'Professional Clinic',
  doctorName = 'Dr. Maanvita Kumari',
  staffName = 'Front Desk (Aarti)',
  newAppointmentsCount = 0,
}: SidebarProps) {
  const pathname = usePathname() || '';

  // Determine active item from current route pathname
  let resolvedActiveNav = activeNav;
  if (pathname.startsWith('/cms/pages')) {
    resolvedActiveNav = 'pages';
  } else if (pathname.startsWith('/cms/editor')) {
    resolvedActiveNav = 'editor';
  } else if (pathname.startsWith('/cms/blog')) {
    resolvedActiveNav = 'blog';
  } else if (pathname.startsWith('/cms/reviews-faqs') || pathname.startsWith('/cms/faqs')) {
    resolvedActiveNav = 'faqs';
  } else if (pathname.startsWith('/cms/media')) {
    resolvedActiveNav = 'media';
  } else if (pathname.startsWith('/cms/settings')) {
    resolvedActiveNav = 'settings';
  } else if (pathname.startsWith('/cms/versions')) {
    resolvedActiveNav = 'versions';
  } else if (pathname.startsWith('/cms/submissions')) {
    if (activeNav === 'opd_board' || activeNav === 'enquiries') {
      resolvedActiveNav = activeNav;
    } else {
      resolvedActiveNav = 'appointments';
    }
  } else if (pathname === '/cms' || pathname === '/cms/') {
    resolvedActiveNav = activeNav || 'dashboard';
  }
  return (
    <aside
      aria-label="CMS Navigation Sidebar"
      data-collapsed={collapsed}
      style={{
        width: collapsed ? '76px' : '270px',
        minWidth: collapsed ? '76px' : '270px',
        background: 'var(--color-bg-base, #FFFFFF)',
        borderRight: '1px solid var(--color-border-subtle, #E2E8F0)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        boxShadow: '1px 0 3px rgba(15, 23, 42, 0.03)',
        transition: 'width 200ms cubic-bezier(0.16, 1, 0.3, 1), min-width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header & Clinic Badge */}
      <div>
        <div
          style={{
            padding: collapsed ? '18px 16px' : '18px 20px',
            borderBottom: '1px solid var(--color-border-subtle, #F1F5F9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'var(--color-brand-surface, #E6F4F1)',
                color: 'var(--color-brand-primary, #0D5C46)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--color-border-subtle, #E2E8F0)',
              }}
              title={clinicName}
            >
              <LogoMark size={22} color="var(--color-brand-primary, #0D5C46)" strokeWidth={2} />
            </div>

            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '15px',
                    color: 'var(--color-text-main, #0F172A)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{clinicName}</span>
                  <span title="Verified Clinic Practice">
                    <ShieldCheckIcon size={14} color="var(--color-brand-primary, #0D5C46)" />
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-brand-primary, #0D5C46)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '2px',
                  }}
                >
                  {planName}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar navigation"
              aria-expanded={!collapsed}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle, #E2E8F0)',
                borderRadius: 'var(--radius-sm, 6px)',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-muted, #64748B)',
                transition: 'all 150ms ease',
              }}
              className="cms-focus-ring"
            >
              <ChevronLeftIcon size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expand toggle button */}
        {collapsed && (
          <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar navigation"
              aria-expanded={false}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle, #E2E8F0)',
                borderRadius: 'var(--radius-sm, 6px)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-muted, #64748B)',
              }}
              className="cms-focus-ring"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}

        {/* Navigation Group Items */}
        <nav
          aria-label="Main Navigation"
          style={{
            padding: collapsed ? '12px 8px' : '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 230px)',
          }}
        >
          {defaultSidebarGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-text-muted, #94A3B8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    padding: '0 12px 8px 12px',
                  }}
                >
                  {group.groupTitle}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map((item) => {
                  const isActive = resolvedActiveNav === item.id;
                  const itemBadge =
                    item.id === 'appointments' && newAppointmentsCount > 0
                      ? `${newAppointmentsCount} New`
                      : item.badge;

                  return (
                    <Link
                      key={item.id}
                      href={item.href || '/cms'}
                      onClick={() => onSelectNav && onSelectNav(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className="cms-focus-ring"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        padding: collapsed ? '12px 0' : '10px 14px',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: 'none',
                        background: isActive
                          ? 'var(--color-brand-primary, #0D5C46)'
                          : 'transparent',
                        color: isActive
                          ? 'var(--color-text-inverse, #FFFFFF)'
                          : 'var(--color-text-main, #475569)',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        transition: 'background-color 150ms ease, color 150ms ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: isActive
                              ? 'var(--color-text-inverse, #FFFFFF)'
                              : 'var(--color-brand-primary, #0D5C46)',
                          }}
                        >
                          {item.icon}
                        </span>
                        {!collapsed && <span>{item.label}</span>}
                      </div>

                      {!collapsed && itemBadge && (
                        <span
                          style={{
                            background: isActive
                              ? 'rgba(255, 255, 255, 0.25)'
                              : item.badgeColor || 'var(--color-status-pending-bg, #FEF3C7)',
                            color: isActive
                              ? '#FFFFFF'
                              : item.badgeColor
                              ? '#FFFFFF'
                              : 'var(--color-status-pending, #D97706)',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                          }}
                        >
                          {itemBadge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer: Live Website Link & Doctor Profile Card */}
      <div
        style={{
          padding: collapsed ? '12px 8px' : '16px',
          borderTop: '1px solid var(--color-border-subtle, #F1F5F9)',
          background: 'var(--color-bg-base, #FFFFFF)',
        }}
      >
        {!collapsed && (
          <div
            style={{
              background: 'var(--color-brand-surface, #E6F4F1)',
              border: '1px solid var(--color-border-subtle, #BBF7D0)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md, 10px)',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-status-confirmed, #059669)',
                  display: 'inline-block',
                }}
              />
              <strong
                style={{ fontSize: '12px', color: 'var(--color-brand-primary, #0D5C46)' }}
              >
                Live Sync Connected
              </strong>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="cms-focus-ring"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-brand-primary, #0D5C46)',
                textDecoration: 'none',
              }}
            >
              <span>View Client Website</span>
              <ExternalLinkIcon size={12} color="var(--color-brand-primary, #0D5C46)" />
            </a>
          </div>
        )}

        {/* Doctor Identity Block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title={`${doctorName} - ${staffName}`}
        >
          <div
            style={{
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
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'var(--color-text-main, #0F172A)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {doctorName}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted, #64748B)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {staffName}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

