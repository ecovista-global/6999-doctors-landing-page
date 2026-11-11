'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BreadcrumbItem } from './Header.js';

export interface CmsShellContextValue {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  activeNav: string;
  setActiveNav: (nav: string) => void;
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

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <CmsShellContext.Provider
      value={{
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
      }}
    >
      {children}
    </CmsShellContext.Provider>
  );
}

