import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyCssBundle,
  verifyComputedStyles,
  verifyFoucDetection,
  defaultDistDir,
} from '../scripts/check-css.js';

describe('MT-103: CSS pipeline & anti-FOUC verification tests', () => {
  it('CSS bundle is verified in build output (linked and non-empty)', () => {
    const result = verifyCssBundle(defaultDistDir);
    assert.ok(result.cssSize > 1024, `CSS size must be > 1 KB (got ${result.cssSize})`);
    assert.ok(result.linkHref.endsWith('.css'), 'Link href must end with .css');
    assert.ok(result.cssPath.includes('dist'), 'CSS path must point to dist assets');
  });

  it('Playwright computed style check passes on initial render', async () => {
    const styles = await verifyComputedStyles(defaultDistDir);
    assert.ok(
      styles.bodyFont.includes('Plus Jakarta Sans') || styles.bodyFont.includes('system-ui'),
      'Body font must use Plus Jakarta Sans or system-ui fallback'
    );
    assert.strictEqual(
      styles.btnBg,
      'rgb(13, 92, 70)',
      'Primary action button must use clinical brand green'
    );
    assert.strictEqual(
      styles.btnRadius,
      '10px',
      'Button must use design token border-radius'
    );
  });

  it('Anti-FOUC test catches and rejects unstyled HTML', async () => {
    const caught = await verifyFoucDetection(defaultDistDir);
    assert.strictEqual(caught, true, 'Anti-FOUC guard must detect unstyled HTML and fail');
  });
});

