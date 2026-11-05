import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const defaultDistDir = path.resolve(__dirname, '../dist');

export function getChromiumExecutablePath(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const candidates = [
    '/snap/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export interface CssBundleResult {
  htmlPath: string;
  cssPath: string;
  cssSize: number;
  linkHref: string;
}

/**
 * Step 1: Verify the compiled stylesheet is linked and non-empty in the built output.
 */
export function verifyCssBundle(distDir = defaultDistDir): CssBundleResult {
  const htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`[E-1601] Build output missing index.html at ${htmlPath}`);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Extract <link rel="stylesheet" ... href="...">
  const linkMatch = htmlContent.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/i) ||
                    htmlContent.match(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/i);

  if (!linkMatch) {
    throw new Error('[E-1602] Anti-FOUC failure: No compiled stylesheet <link> tag found in built HTML');
  }

  const hrefMatch = linkMatch[0].match(/href=["']([^"']+\.css)["']/i);
  if (!hrefMatch || !hrefMatch[1]) {
    throw new Error('[E-1602] Anti-FOUC failure: Stylesheet <link> tag is missing a valid href');
  }

  const linkHref = hrefMatch[1];
  // Strip leading slash to resolve inside distDir
  const relativeHref = linkHref.startsWith('/') ? linkHref.slice(1) : linkHref;
  const cssPath = path.join(distDir, relativeHref);

  if (!fs.existsSync(cssPath)) {
    throw new Error(`[E-1603] Anti-FOUC failure: Linked stylesheet does not exist on disk at ${cssPath}`);
  }

  const stat = fs.statSync(cssPath);
  if (stat.size === 0) {
    throw new Error(`[E-1604] Anti-FOUC failure: Compiled stylesheet is empty (0 bytes) at ${cssPath}`);
  }

  if (stat.size < 1024) {
    throw new Error(`[E-1604] Anti-FOUC failure: Compiled stylesheet is suspiciously small (${stat.size} bytes)`);
  }

  const cssContent = fs.readFileSync(cssPath, 'utf8');
  if (!cssContent.includes('--color-brand-primary') && !cssContent.includes('--brand')) {
    throw new Error('[E-1605] Anti-FOUC failure: Stylesheet missing core clinical design tokens (--color-brand-primary or --brand)');
  }

  return {
    htmlPath,
    cssPath,
    cssSize: stat.size,
    linkHref,
  };
}

export interface ComputedStylesResult {
  bodyFont: string;
  btnBg: string;
  btnRadius: string;
}

/**
 * Step 2: Playwright test asserting computed styles on initial render.
 */
export async function verifyComputedStyles(
  distDir = defaultDistDir,
  options?: {
    customHtml?: string;
    executablePath?: string;
  }
): Promise<ComputedStylesResult> {
  const executablePath = options?.executablePath || getChromiumExecutablePath();
  const launchOptions = executablePath ? { executablePath, headless: true } : { headless: true };

  // Lightweight in-process static server for accurate browser MIME handling
  const server = http.createServer((req, res) => {
    if (options?.customHtml && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(options.customHtml);
      return;
    }

    const cleanUrl = req.url === '/' ? 'index.html' : (req.url || '').split('?')[0]!;
    const filePath = path.join(distDir, cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl);

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
      '.json': 'application/json',
      '.woff2': 'font/woff2',
    };

    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch(launchOptions);
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });

    const styles = await page.evaluate(() => {
      const body = document.body;
      const btn =
        document.querySelector('.btn-primary') ||
        document.querySelector('.mobile-cta-btn') ||
        document.querySelector('button');

      return {
        bodyFont: window.getComputedStyle(body).fontFamily,
        btnBg: btn ? window.getComputedStyle(btn).backgroundColor : '',
        btnRadius: btn ? window.getComputedStyle(btn).borderRadius : '',
      };
    });

    // Check 1: Font family must contain Plus Jakarta Sans or system-ui fallback
    if (!styles.bodyFont.includes('Plus Jakarta Sans') && !styles.bodyFont.includes('system-ui')) {
      throw new Error(`[Anti-FOUC] Body font unstyled or default serif detected: "${styles.bodyFont}"`);
    }

    // Check 2: Button background color must NOT be default transparent/grey (must be brand green)
    if (
      styles.btnBg === 'rgba(0, 0, 0, 0)' ||
      styles.btnBg === 'transparent' ||
      styles.btnBg === ''
    ) {
      throw new Error(`[Anti-FOUC] Primary action button unstyled (transparent background): "${styles.btnBg}"`);
    }

    // Check 3: Button must have rounded corners from design tokens
    if (styles.btnRadius === '0px' || styles.btnRadius === '') {
      throw new Error(`[Anti-FOUC] Primary button border-radius unstyled (0px): "${styles.btnRadius}"`);
    }

    return styles;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

/**
 * Step 3: FOUC test catches unstyled HTML (negative control test).
 */
export async function verifyFoucDetection(distDir = defaultDistDir): Promise<boolean> {
  const htmlPath = path.join(distDir, 'index.html');
  const originalHtml = fs.readFileSync(htmlPath, 'utf8');

  // Strip all stylesheet links to simulate FOUC/missing CSS
  const unstyledHtml = originalHtml.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '');

  try {
    await verifyComputedStyles(distDir, { customHtml: unstyledHtml });
    // If it did NOT throw, the anti-FOUC check failed to detect unstyled HTML!
    throw new Error('Anti-FOUC guard flaw: unstyled HTML was unexpectedly accepted without error');
  } catch (err: any) {
    if (err.message && err.message.includes('[Anti-FOUC]')) {
      // Expected: anti-FOUC guard successfully caught unstyled page
      return true;
    }
    throw err;
  }
}

/**
 * CLI Execution Entrypoint
 */
export async function runCssPipelineCheck(distDir = defaultDistDir) {
  console.log('⚡ Checking CSS bundle pipeline and anti-FOUC verification...');

  // 1. Verify build output
  const bundle = verifyCssBundle(distDir);
  console.log(`✓ CSS Bundle Verified: ${bundle.linkHref} (${(bundle.cssSize / 1024).toFixed(2)} KB)`);

  // 2. Playwright computed styles check
  const styles = await verifyComputedStyles(distDir);
  console.log(`✓ Computed Styles Verified on Initial Render:`);
  console.log(`  - Font Family: ${styles.bodyFont}`);
  console.log(`  - Button Background: ${styles.btnBg}`);
  console.log(`  - Button Radius: ${styles.btnRadius}`);

  // 3. FOUC detection verification
  await verifyFoucDetection(distDir);
  console.log(`✓ Anti-FOUC Guard Verified: Unstyled HTML is deterministically caught and rejected`);

  console.log('🎉 All CSS pipeline & anti-FOUC checks passed successfully.');
}

// Auto-run if executed from CLI
const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isCli) {
  runCssPipelineCheck()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ CSS Pipeline & Anti-FOUC Check FAILED:');
      console.error(err.message || err);
      process.exit(1);
    });
}

