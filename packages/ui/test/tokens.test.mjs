import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { THEMES, STATUS_COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../dist/index.js';

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('MT-101: Tokens & Typography Acceptance Tests', () => {
  test('Light and dark theme tokens are fully defined in THEMES export', () => {
    assert.ok(THEMES.green, 'green theme exists');
    assert.ok(THEMES.teal, 'teal theme exists');
    assert.ok(THEMES.dark, 'dark theme exists');

    for (const [themeName, colors] of Object.entries(THEMES)) {
      assert.ok(colors.brand, `${themeName} has brand`);
      assert.ok(colors.brandContrast, `${themeName} has brandContrast`);
      assert.ok(colors.ink, `${themeName} has ink`);
      assert.ok(colors.surface, `${themeName} has surface`);
      assert.ok(colors.cardBg, `${themeName} has cardBg`);
      assert.ok(colors.statusPending, `${themeName} has statusPending`);
      assert.ok(colors.statusConfirmed, `${themeName} has statusConfirmed`);
      assert.ok(colors.statusCompleted, `${themeName} has statusCompleted`);
      assert.ok(colors.statusCancelled, `${themeName} has statusCancelled`);
    }
  });

  test('Tokens CSS file contains all required custom properties', () => {
    const tokensCssPath = path.resolve(import.meta.dirname, '../src/tokens.css');
    const cssContent = fs.readFileSync(tokensCssPath, 'utf-8');

    // Light / Brand Tokens
    assert.ok(cssContent.includes('--color-brand-primary'), 'has --color-brand-primary');
    assert.ok(cssContent.includes('--color-brand-secondary'), 'has --color-brand-secondary');
    assert.ok(cssContent.includes('--color-brand-surface'), 'has --color-brand-surface');

    // Surfaces & Borders
    assert.ok(cssContent.includes('--color-bg-base'), 'has --color-bg-base');
    assert.ok(cssContent.includes('--color-bg-surface'), 'has --color-bg-surface');
    assert.ok(cssContent.includes('--color-border-subtle'), 'has --color-border-subtle');

    // Status Badges
    assert.ok(cssContent.includes('--color-status-pending'), 'has --color-status-pending');
    assert.ok(cssContent.includes('--color-status-confirmed'), 'has --color-status-confirmed');
    assert.ok(cssContent.includes('--color-status-completed'), 'has --color-status-completed');
    assert.ok(cssContent.includes('--color-status-cancelled'), 'has --color-status-cancelled');

    // Dark Mode Selector
    assert.ok(cssContent.includes('[data-theme="dark"]'), 'has [data-theme="dark"]');

    // Font family with Devanagari fallback
    assert.ok(cssContent.includes('Noto Sans Devanagari'), 'has Noto Sans Devanagari fallback');
  });

  test('WCAG 2.1 AA text contrast ratio is ≥ 4.5:1 across themes', () => {
    // Green theme main text on base bg
    const greenBodyContrast = contrastRatio(THEMES.green.ink, THEMES.green.cardBg);
    assert.ok(
      greenBodyContrast >= 4.5,
      `Green theme body text contrast ${greenBodyContrast.toFixed(2)}:1 must be >= 4.5:1`
    );

    // Green brand button contrast (text on brand button)
    const greenBtnContrast = contrastRatio(THEMES.green.brandContrast, THEMES.green.brand);
    assert.ok(
      greenBtnContrast >= 4.5,
      `Green theme button contrast ${greenBtnContrast.toFixed(2)}:1 must be >= 4.5:1`
    );

    // Dark theme main text on dark bg
    const darkBodyContrast = contrastRatio(THEMES.dark.ink, THEMES.dark.cardBg);
    assert.ok(
      darkBodyContrast >= 4.5,
      `Dark theme body text contrast ${darkBodyContrast.toFixed(2)}:1 must be >= 4.5:1`
    );

    // Dark brand button contrast
    const darkBtnContrast = contrastRatio(THEMES.dark.brandContrast, THEMES.dark.brand);
    assert.ok(
      darkBtnContrast >= 4.5,
      `Dark theme button contrast ${darkBtnContrast.toFixed(2)}:1 must be >= 4.5:1`
    );

    // Status colors contrast on dark backgrounds
    const pendingContrast = contrastRatio(STATUS_COLORS.pending.darkText, THEMES.dark.cardBg);
    assert.ok(
      pendingContrast >= 4.5,
      `Pending status dark contrast ${pendingContrast.toFixed(2)}:1 must be >= 4.5:1`
    );

    const confirmedContrast = contrastRatio(STATUS_COLORS.confirmed.darkText, THEMES.dark.cardBg);
    assert.ok(
      confirmedContrast >= 4.5,
      `Confirmed status dark contrast ${confirmedContrast.toFixed(2)}:1 must be >= 4.5:1`
    );
  });

  test('Zero external Google Fonts network calls across all codebase files', () => {
    const rootDir = path.resolve(import.meta.dirname, '../../..');
    const appsDir = path.join(rootDir, 'apps');
    const packagesDir = path.join(rootDir, 'packages');

    function searchFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          searchFiles(fullPath);
        } else if (/\.(html|css|tsx|ts|jsx|js)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          assert.ok(
            !content.includes('fonts.googleapis.com'),
            `Found Google Fonts reference in ${path.relative(rootDir, fullPath)}`
          );
          assert.ok(
            !content.includes('fonts.gstatic.com'),
            `Found Google Fonts gstatic reference in ${path.relative(rootDir, fullPath)}`
          );
        }
      }
    }

    searchFiles(appsDir);
    searchFiles(packagesDir);
  });
});
