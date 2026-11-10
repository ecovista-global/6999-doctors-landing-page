'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/cms/Sidebar';
import { Header } from '@/components/cms/Header';
import { CmsShellProvider, useCmsShell } from '@/components/cms/CmsShellContext';

function getRouteBreadcrumbs(pathname: string) {
  if (pathname.startsWith('/cms/pages')) {
    return [{ label: 'CMS', href: '/cms' }, { label: '7-Page Site CMS' }, { label: 'Page Slots (7-Page Architecture)' }];
  }
  if (pathname.startsWith('/cms/editor')) {
    return [{ label: 'CMS', href: '/cms' }, { label: '7-Page Site CMS' }, { label: 'Site Block Editor' }];
  }
  if (pathname.startsWith('/cms/blog')) {
    return [{ label: 'CMS', href: '/cms' }, { label: '7-Page Site CMS' }, { label: 'Blog Posts' }];
  }
  if (pathname.startsWith('/cms/reviews-faqs') || pathname.startsWith('/cms/faqs')) {
    return [{ label: 'CMS', href: '/cms' }, { label: '7-Page Site CMS' }, { label: 'FAQs & Reviews' }];
  }
  if (pathname.startsWith('/cms/media')) {
    return [{ label: 'CMS', href: '/cms' }, { label: '7-Page Site CMS' }, { label: 'Media Library' }];
  }
  if (pathname.startsWith('/cms/settings')) {
    return [{ label: 'CMS', href: '/cms' }, { label: 'Governance & Audit' }, { label: 'Settings & Security' }];
  }
  if (pathname.startsWith('/cms/versions')) {
    return [{ label: 'CMS', href: '/cms' }, { label: 'Governance & Audit' }, { label: 'Version History' }];
  }
  if (pathname.startsWith('/cms/submissions')) {
    return [{ label: 'CMS', href: '/cms' }, { label: 'Clinical Operations' }, { label: 'Submissions & OPD' }];
  }
  return [{ label: 'CMS', href: '/cms' }, { label: 'Clinical Operations' }, { label: 'Dashboard' }];
}

function CmsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const {
    collapsed,
    setCollapsed,
    activeNav,
    setActiveNav,
    breadcrumbs,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
  } = useCmsShell();

  // If on a specific sub-route and breadcrumbs are default, use path-derived breadcrumbs
  const isDefaultBreadcrumbs =
    breadcrumbs.length === 3 &&
    breadcrumbs[0]?.label === 'CMS' &&
    breadcrumbs[1]?.label === 'Submissions' &&
    breadcrumbs[2]?.label === 'Appointments';

  const effectiveBreadcrumbs =
    pathname !== '/cms/submissions' && isDefaultBreadcrumbs
      ? getRouteBreadcrumbs(pathname)
      : breadcrumbs;

  return (
    <div
      className="cms-shell-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        height: '100vh',
        background: 'var(--color-bg-surface, #F8FAFC)',
        color: 'var(--color-text-main, #0F172A)',
        overflow: 'hidden',
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Persistent Collapsible Sidebar (MT-104) */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activeNav={activeNav}
        onSelectNav={(id) => setActiveNav(id)}
      />

      {/* Main Canvas with Sticky Top Header */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Header
          breadcrumbs={effectiveBreadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main
          id="cms-main-content"
          tabIndex={-1}
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--color-bg-surface, #F8FAFC)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CmsShellProvider>
      <CmsLayoutContent>{children}</CmsLayoutContent>
    </CmsShellProvider>
  );
}
