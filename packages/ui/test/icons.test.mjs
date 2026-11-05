import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uiSrcDir = join(__dirname, '../src');
const platformIconsPath = join(__dirname, '../../../apps/platform/src/components/Icons.tsx');

// Import built icons from dist
import * as UIIcons from '../dist/index.js';
import * as SubpathIcons from '../dist/components/icons/index.js';

test('MT-102: Lucide SVG icons render cleanly as valid SVG markup', () => {
  const iconNames = [
    'StethoscopeIcon',
    'PhoneIcon',
    'MessageCircleIcon',
    'CalendarIcon',
    'ClockIcon',
    'MapPinIcon',
    'ShieldCheckIcon',
    'AwardIcon',
    'ActivityIcon',
    'LayoutDashboardIcon',
    'CheckCircleIcon',
    'StarIcon',
    'ChevronDownIcon',
    'FilterIcon',
    'TrendingUpIcon',
  ];

  for (const name of iconNames) {
    const Component = UIIcons[name];
    assert.ok(Component, `Expected ${name} to be exported from @ecodigitech/ui`);
    
    // Render to static markup
    const html = renderToStaticMarkup(React.createElement(Component, { size: 24, color: '#0D5C46' }));
    assert.ok(html.startsWith('<svg'), `${name} rendered output should start with <svg`);
    assert.ok(html.includes('viewBox="0 0 24 24"'), `${name} should have 24px viewBox`);
    assert.ok(html.includes('stroke="#0D5C46"'), `${name} should apply color to stroke`);
    assert.ok(html.includes('width="24"'), `${name} should apply size to width`);
    assert.ok(html.includes('height="24"'), `${name} should apply size to height`);
    assert.ok(html.includes('aria-hidden="true"'), `${name} should include aria-hidden="true"`);
  }
});

test('MT-102: Clinical brand marks render with correct clinical geometry', () => {
  const brandMarks = ['LogoMark', 'StethoscopeMark', 'CredentialBadgeMark'];

  for (const name of brandMarks) {
    const Component = UIIcons[name];
    assert.ok(Component, `Expected brand mark ${name} to be exported`);

    const html = renderToStaticMarkup(React.createElement(Component, { size: 32, color: '#0D5C46' }));
    assert.ok(html.startsWith('<svg'), `${name} must render an svg`);
    assert.ok(html.includes('width="32"'), `${name} must respect custom size`);
    assert.ok(html.includes('aria-hidden="true"'), `${name} must have aria-hidden`);
  }
});

test('MT-102: Subpath export @ecodigitech/ui/icons tree-shakes cleanly', () => {
  assert.ok(SubpathIcons.LogoMark, 'Subpath must export LogoMark');
  assert.ok(SubpathIcons.StethoscopeIcon, 'Subpath must export StethoscopeIcon');
  assert.ok(SubpathIcons.CalendarIcon, 'Subpath must export CalendarIcon');
  assert.strictEqual(typeof SubpathIcons.THEMES, 'undefined', 'Subpath icons should not bundle theme constants');
});

test('MT-102: Strict R7 enforcement — Zero emoji detected in UI package and platform icons', () => {
  // Regex matching standard emoji and pictographic code points
  const emojiRegex = /\p{Extended_Pictographic}/gu;

  // Scan all files in packages/ui/src
  function scanDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.css'))) {
        const content = readFileSync(fullPath, 'utf8');
        const matches = content.match(emojiRegex);
        assert.strictEqual(
          matches,
          null,
          `Emoji found in ${entry.name}: ${matches ? matches.join(', ') : ''}`
        );
      }
    }
  }

  scanDir(uiSrcDir);

  // Also verify apps/platform/src/components/Icons.tsx
  const platformContent = readFileSync(platformIconsPath, 'utf8');
  const platformMatches = platformContent.match(emojiRegex);
  assert.strictEqual(
    platformMatches,
    null,
    `Emoji found in platform Icons.tsx: ${platformMatches ? platformMatches.join(', ') : ''}`
  );
});

