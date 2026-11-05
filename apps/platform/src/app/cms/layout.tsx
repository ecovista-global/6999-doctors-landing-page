'use client';

import React from 'react';
import { Sidebar } from '@/components/cms/Sidebar';
import { Header } from '@/components/cms/Header';
import { CmsShellProvider, useCmsShell } from '@/components/cms/CmsShellContext';

function CmsLayoutContent({ children }: { children: React.ReactNode }) {
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
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)",
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
          breadcrumbs={breadcrumbs}
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
