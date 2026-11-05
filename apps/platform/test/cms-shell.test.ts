import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from '../src/components/cms/Sidebar.js';
import { Header } from '../src/components/cms/Header.js';

describe('MT-104: CMS App Shell Acceptance Tests', () => {
  it('Sidebar collapses smoothly between 270px and 76px with transition', () => {
    // 1. Expanded Sidebar
    const expandedHtml = renderToStaticMarkup(
      React.createElement(Sidebar, {
        collapsed: false,
        onToggleCollapse: () => {},
        activeNav: 'dashboard',
        clinicName: 'HealthConsult Family Clinic',
        planName: 'Professional Clinic',
      })
    );

    assert.ok(expandedHtml.includes('width:270px'), 'Expanded sidebar must have width 270px');
    assert.ok(
      expandedHtml.includes('transition:width 200ms cubic-bezier(0.16, 1, 0.3, 1)'),
      'Sidebar must have smooth 200ms transition'
    );
    assert.ok(expandedHtml.includes('aria-expanded="true"'), 'Toggle button must indicate aria-expanded="true"');
    assert.ok(expandedHtml.includes('HealthConsult Family Clinic'), 'Clinic name badge must be visible');
    assert.ok(expandedHtml.includes('Professional Clinic'), 'Plan badge must be visible');

    // 2. Collapsed Sidebar
    const collapsedHtml = renderToStaticMarkup(
      React.createElement(Sidebar, {
        collapsed: true,
        onToggleCollapse: () => {},
        activeNav: 'dashboard',
        clinicName: 'HealthConsult Family Clinic',
        planName: 'Professional Clinic',
      })
    );

    assert.ok(collapsedHtml.includes('width:76px'), 'Collapsed sidebar must have width 76px');
    assert.ok(collapsedHtml.includes('aria-expanded="false"'), 'Toggle button must indicate aria-expanded="false"');
    assert.ok(
      collapsedHtml.includes('aria-label="Expand sidebar navigation"'),
      'Expand button must have accessible aria-label'
    );
  });

  it('Active navigation state is clearly highlighted with aria-current="page"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Sidebar, {
        collapsed: false,
        onToggleCollapse: () => {},
        activeNav: 'appointments',
        newAppointmentsCount: 8,
      })
    );

    assert.ok(html.includes('aria-current="page"'), 'Active navigation item must have aria-current="page"');
    assert.ok(html.includes('8 New'), 'Appointments item must display badge with new count');
    assert.ok(
      html.includes('var(--color-brand-primary, #0D5C46)'),
      'Active item must be highlighted with primary brand color'
    );
  });

  it('Keyboard focus styles (cms-focus-ring) and accessible semantics are present', () => {
    const sidebarHtml = renderToStaticMarkup(
      React.createElement(Sidebar, {
        collapsed: false,
        onToggleCollapse: () => {},
        activeNav: 'dashboard',
      })
    );

    assert.ok(
      sidebarHtml.includes('class="cms-focus-ring"'),
      'Sidebar interactive items must have cms-focus-ring class'
    );
    assert.ok(
      sidebarHtml.includes('aria-label="CMS Navigation Sidebar"'),
      'Sidebar must have accessible semantic label'
    );

    const headerHtml = renderToStaticMarkup(
      React.createElement(Header, {
        breadcrumbs: [
          { label: 'CMS', href: '/cms' },
          { label: 'Submissions' },
          { label: 'Appointments' },
        ],
        theme: 'light',
        doctorName: 'Dr. Maanvita Kumari',
        roleName: 'Clinic Owner',
      })
    );

    assert.ok(
      headerHtml.includes('aria-label="Breadcrumb"'),
      'Header must include accessible breadcrumbs nav'
    );
    assert.ok(
      headerHtml.includes('aria-current="page"'),
      'Last breadcrumb must have aria-current="page"'
    );
    assert.ok(
      headerHtml.includes('class="cms-focus-ring"'),
      'Header search input and theme toggle must include cms-focus-ring'
    );
    assert.ok(
      headerHtml.includes('aria-label="Search patients, appointments, services, reviews"'),
      'Global search input must have accessible aria-label'
    );
  });
});

