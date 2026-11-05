import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Browser } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { Header, SEVEN_PAGE_NAV } from '../src/components/Header.js';
import { Footer } from '../src/components/Footer.js';
import { MobileCtaBar } from '../src/components/MobileCtaBar.js';
import { PublicLayout } from '../src/app/layout.js';
import { getChromiumExecutablePath, defaultDistDir } from '../scripts/check-css.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../screenshots');

// Ensure screenshots dir exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

describe('MT-105: Public 7-Page Template Shell Acceptance Suite', () => {
  let server: http.Server;
  let serverPort: number;
  let browser: Browser;

  before(async () => {
    // 1. Start lightweight static HTTP server for built dist
    server = http.createServer((req, res) => {
      const cleanUrl = req.url === '/' ? 'index.html' : (req.url || '').split('?')[0]!;
      const filePath = path.join(defaultDistDir, cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath);
      const mimeMap: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.svg': 'image/svg+xml',
      };
      res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
        }
        resolve();
      });
    });

    // 2. Launch Chromium
    const executablePath = getChromiumExecutablePath();
    const launchOptions = executablePath ? { executablePath, headless: true } : { headless: true };
    browser = await chromium.launch(launchOptions);
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // --- PART 1: React Component & Unit Checks ---

  it('TSX Header component renders clinical logo, phone CTA, and 7-page navigation', () => {
    const html = renderToStaticMarkup(
      React.createElement(Header, {
        clinicName: 'HealthConsult Family Clinic',
        currentPath: '/services',
      })
    );

    assert.ok(html.includes('HealthConsult'), 'Header must include clinic name');
    assert.ok(html.includes('tel:+919876543210'), 'Header must contain click-to-call link');
    assert.ok(html.includes('https://wa.me/'), 'Header must contain WhatsApp clinic CTA');
    assert.ok(html.includes('aria-controls="mobile-nav-drawer"'), 'Header must link toggle button to drawer');
    assert.ok(html.includes('mobile-nav-toggle'), 'Header must contain mobile nav toggle button');

    // Assert all 7 pages are rendered (accounting for HTML entities in JSX)
    for (const item of SEVEN_PAGE_NAV) {
      const matchLabel = item.label.replace('&', '&amp;');
      assert.ok(
        html.includes(item.label) || html.includes(matchLabel),
        `Header must include nav item: ${item.label}`
      );
    }
  });

  it('TSX MobileCtaBar renders sticky 3-action bar with zero emoji and min touch targets', () => {
    const html = renderToStaticMarkup(
      React.createElement(MobileCtaBar, {
        phone: '+919876543210',
        doctorName: 'Dr. Maanvita Kumari',
      })
    );

    assert.ok(html.includes('sticky-mobile-bar'), 'Must use sticky-mobile-bar class');
    assert.ok(html.includes('tel:+919876543210'), 'Must contain phone link');
    assert.ok(html.includes('https://wa.me/'), 'Must contain WhatsApp link');
    assert.ok(html.includes('/contact'), 'Must contain appointment link');

    // Strict Emoji check using Unicode Extended_Pictographic property
    const emojiRegex = /\p{Extended_Pictographic}/u;
    assert.ok(!emojiRegex.test(html), 'MobileCtaBar must have zero emojis');
  });

  it('TSX Footer renders NAP, DPDP compliance notice, and zero emoji', () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, {
        clinicName: 'HealthConsult Family Clinic',
      })
    );

    assert.ok(html.includes('Plot 14, Health Plaza'), 'Footer must contain clinic address');
    assert.ok(html.includes('DMC/R/28491'), 'Footer must contain registration credential');
    assert.ok(html.includes('Digital Personal Data Protection (DPDP) Act, 2023'), 'Footer must contain DPDP notice');
    assert.ok(html.includes('EcoDigiTech'), 'Footer must contain EcoDigiTech attribution');

    const emojiRegex = /\p{Extended_Pictographic}/u;
    assert.ok(!emojiRegex.test(html), 'Footer must have zero emojis');
  });

  it('TSX PublicLayout wraps Header, Main, Footer, and MobileCtaBar with skip link', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        PublicLayout,
        { currentPath: '/' },
        React.createElement('div', { id: 'test-child' }, 'Clinic Content')
      )
    );

    assert.ok(html.includes('Skip to main content'), 'Layout must include skip-to-content accessibility link');
    assert.ok(html.includes('id="main-content"'), 'Layout must include main content wrapper');
    assert.ok(html.includes('id="test-child"'), 'Layout must render children inside main');
    assert.ok(html.includes('sticky-mobile-bar'), 'Layout must include sticky mobile CTA bar');
  });

  // --- PART 2: Playwright Live Wiring, Responsive Drawer, & Mobile CTA Bar ---

  it('Acceptance: Responsive mobile nav drawer opens and closes cleanly (< 768px)', async () => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 740 },
    });
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:${serverPort}/`, { waitUntil: 'networkidle' });

    const toggleBtn = page.locator('#mobile-nav-toggle');
    const drawer = page.locator('#mobile-nav-drawer');
    const backdrop = page.locator('#drawer-backdrop');
    const closeBtn = page.locator('#drawer-close-btn');

    // 1. Initial State: Drawer closed and not visible
    const isVisibleInitially = await drawer.isVisible();
    assert.strictEqual(isVisibleInitially, false, 'Drawer should not be visible initially');
    assert.strictEqual(await toggleBtn.getAttribute('aria-expanded'), 'false');

    // 2. Click toggle button -> Open drawer
    await toggleBtn.click();
    await page.waitForTimeout(250); // allow 200ms transition

    assert.strictEqual(await toggleBtn.getAttribute('aria-expanded'), 'true');
    const isVisibleOpen = await drawer.isVisible();
    assert.ok(isVisibleOpen, 'Drawer must be visible when opened');
    const backdropOpen = await backdrop.evaluate((el) => el.classList.contains('open'));
    assert.ok(backdropOpen, 'Backdrop must have "open" class');

    // Verify all 7 navigation links are present inside drawer
    const drawerLinks = drawer.locator('.drawer-nav-link');
    const count = await drawerLinks.count();
    assert.strictEqual(count, 7, 'Mobile drawer must have exactly 7 navigation links');

    // Capture visual evidence of open mobile drawer
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-drawer-open-360px.png') });

    // 3. Close drawer via close button
    await closeBtn.click();
    await page.waitForTimeout(250);

    assert.strictEqual(await toggleBtn.getAttribute('aria-expanded'), 'false');
    const isVisibleClosed = await drawer.isVisible();
    assert.strictEqual(isVisibleClosed, false, 'Drawer must not be visible after closing');

    // 4. Test closing via Escape key
    await toggleBtn.click();
    await page.waitForTimeout(250);
    assert.strictEqual(await toggleBtn.getAttribute('aria-expanded'), 'true');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    assert.strictEqual(await toggleBtn.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await drawer.isVisible(), false, 'Drawer must close on Escape key');

    await context.close();
  });

  it('Acceptance: Sticky mobile CTA bar active on mobile (< 768px) and meets 48px touch targets', async () => {
    // 1. Mobile Viewport (360px)
    const mobileContext = await browser.newContext({
      viewport: { width: 360, height: 740 },
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://127.0.0.1:${serverPort}/`, { waitUntil: 'networkidle' });

    const mobileBar = mobilePage.locator('.sticky-mobile-bar');
    await mobileBar.waitFor({ state: 'visible', timeout: 2000 });

    const isVisibleOnMobile = await mobileBar.isVisible();
    assert.ok(isVisibleOnMobile, 'Sticky CTA bar must be visible on mobile (< 768px)');

    // Assert 3 touch targets exist
    const ctaButtons = mobileBar.locator('.mobile-cta-btn');
    assert.strictEqual(await ctaButtons.count(), 3, 'Sticky bar must have 3 CTA buttons (Call, WhatsApp, Enquire/Book)');

    // Verify minimum touch target height >= 48px
    const callBox = await mobileBar.locator('.cta-call').boundingBox();
    assert.ok(callBox && callBox.height >= 48, `Call touch target must be >= 48px height (got ${callBox?.height}px)`);
    const waBox = await mobileBar.locator('.cta-wa').boundingBox();
    assert.ok(waBox && waBox.height >= 48, `WhatsApp touch target must be >= 48px height (got ${waBox?.height}px)`);

    await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-sticky-bar-360px.png') });
    await mobileContext.close();

    // 2. Desktop Viewport (1280px)
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`http://127.0.0.1:${serverPort}/`, { waitUntil: 'networkidle' });

    const desktopBar = desktopPage.locator('.sticky-mobile-bar');
    const isHiddenOnDesktop = !(await desktopBar.isVisible());
    assert.ok(isHiddenOnDesktop, 'Sticky CTA bar must be hidden on desktop (>= 768px)');

    // Assert desktop navigation is visible
    const desktopNav = desktopPage.locator('.site-header .nav-links');
    assert.ok(await desktopNav.isVisible(), 'Desktop navigation links must be visible on desktop');

    await desktopContext.close();
  });

  // --- PART 3: Axe Accessibility Audit (Zero Violations) ---

  it('Acceptance: Axe accessibility audit is clean (zero critical or serious violations)', async () => {
    // Test both Desktop (1280px) and Mobile (360px)
    const viewports = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 360, height: 740 },
    ];

    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${serverPort}/`, { waitUntil: 'networkidle' });

      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = axeResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (seriousOrCritical.length > 0) {
        console.error(`Axe violations on ${vp.name}:`, JSON.stringify(seriousOrCritical, null, 2));
      }

      assert.strictEqual(
        seriousOrCritical.length,
        0,
        `Axe audit on ${vp.name} must have 0 critical or serious violations (found ${seriousOrCritical.length})`
      );

      await context.close();
    }
  });

  // --- PART 4: Visual Screenshot Verification (Rule R8) ---

  it('Generates visual evidence screenshots at 360, 768, and 1280 px across themes', async () => {
    const widths = [360, 768, 1280];
    const themes = ['green', 'teal'];

    for (const theme of themes) {
      for (const width of widths) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${serverPort}/`, { waitUntil: 'networkidle' });

        // Set theme
        await page.evaluate((t) => (window as unknown as { setTheme: (theme: string) => void }).setTheme(t), theme);
        await page.waitForTimeout(100);

        const filename = `template-shell-${theme}-${width}px.png`;
        await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: false });
        assert.ok(fs.existsSync(path.join(screenshotsDir, filename)), `Screenshot ${filename} must exist`);

        await context.close();
      }
    }
  });

  // --- PART 5: Zero-Emoji Enforcement Check (Strict R7) ---

  it('Built HTML strictly complies with R7 (zero emojis detected across public template)', () => {
    const builtHtmlPath = path.join(defaultDistDir, 'index.html');
    const content = fs.readFileSync(builtHtmlPath, 'utf8');

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu);
    assert.strictEqual(
      emojiMatches,
      null,
      `Strict R7 violation: Found ${emojiMatches?.length} emojis in built output: ${emojiMatches?.join(', ')}`
    );
  });
});
