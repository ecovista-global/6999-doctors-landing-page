'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { BreadcrumbItem } from './Header.js';

export interface CmsShellContextValue {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  activeNav: string;
  setActiveNav: React.Dispatch<React.SetStateAction<string>>;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CmsShellContext = createContext<CmsShellContextValue | null>(null);

export function useCmsShell() {
  const ctx = useContext(CmsShellContext);
  if (!ctx) {
    throw new Error('useCmsShell must be used within CmsShellProvider');
  }
  return ctx;
}

export function CmsShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'CMS', href: '/cms' },
    { label: 'Clinical Operations' },
    { label: 'Dashboard' },
  ]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const value = useMemo<CmsShellContextValue>(
    () => ({
      collapsed,
      setCollapsed,
      activeNav,
      setActiveNav,
      breadcrumbs,
      setBreadcrumbs,
      theme,
      setTheme,
      toggleTheme,
      searchQuery,
      setSearchQuery,
    }),
    [collapsed, activeNav, breadcrumbs, theme, searchQuery, toggleTheme]
  );

  return (
    <CmsShellContext.Provider value={value}>
      {children}
    </CmsShellContext.Provider>
  );
}

