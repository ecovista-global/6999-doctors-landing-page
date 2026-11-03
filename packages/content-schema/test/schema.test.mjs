import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentSheetSchema } from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('MT-005: ContentSheetSchema Acceptance Tests', () => {
  const goldenPath = path.resolve(__dirname, '../../../fixtures/golden.json');
  const goldenData = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));

  it('valid golden fixture passes schema validation', () => {
    const result = ContentSheetSchema.safeParse(goldenData);
    assert.strictEqual(result.success, true, 'Golden fixture must validate without errors');
  });

  it('garbage inputs fail with typed validation errors', () => {
    // Missing doctor name and invalid phone
    const garbage1 = {
      ...goldenData,
      doctor: { ...goldenData.doctor, name: '' },
      clinic: { ...goldenData.clinic, phone: '12345' }, // Not +91 Indian format
    };
    const res1 = ContentSheetSchema.safeParse(garbage1);
    assert.strictEqual(res1.success, false);
    const errors1 = res1.error.format();
    assert.ok(errors1.clinic?.phone?._errors?.length);

    // Enforce <= 9 services rule (10 services should fail)
    const tooManyServices = Array.from({ length: 10 }, (_, i) => ({
      title: `Service ${i + 1}`,
      description: `Description for service ${i + 1}`,
    }));
    const res2 = ContentSheetSchema.safeParse({ ...goldenData, services: tooManyServices });
    assert.strictEqual(res2.success, false, '> 9 services must be rejected');
    assert.ok(res2.error.format().services?._errors?.length);

    // Enforce <= 6 reviews rule (7 reviews should fail)
    const tooManyReviews = Array.from({ length: 7 }, (_, i) => ({
      authorInitial: `Author ${i + 1}`,
      rating: 5,
      text: `Review text ${i + 1}`,
    }));
    const res3 = ContentSheetSchema.safeParse({ ...goldenData, reviews: tooManyReviews });
    assert.strictEqual(res3.success, false, '> 6 reviews must be rejected');
    assert.ok(res3.error.format().reviews?._errors?.length);

    // Enforce <= 8 FAQs rule (9 FAQs should fail)
    const tooManyFaqs = Array.from({ length: 9 }, (_, i) => ({
      question: `Question ${i + 1}?`,
      answer: `Answer ${i + 1}`,
    }));
    const res4 = ContentSheetSchema.safeParse({ ...goldenData, faq: tooManyFaqs });
    assert.strictEqual(res4.success, false, '> 8 FAQs must be rejected');
    assert.ok(res4.error.format().faq?._errors?.length);
  });

  it('malicious script tags and injection attempts are rejected', () => {
    // Injected <script> tag in doctor bio
    const xssBio = {
      ...goldenData,
      doctor: {
        ...goldenData.doctor,
        bio: 'Compassionate physician <script>alert("pwned")</script>',
      },
    };
    const res1 = ContentSheetSchema.safeParse(xssBio);
    assert.strictEqual(res1.success, false, 'Script tag in bio must be rejected');

    // Injected <script src=...> in clinic tagline
    const xssTagline = {
      ...goldenData,
      clinic: {
        ...goldenData.clinic,
        tagline: 'Care <script src="https://evil.com/xss.js"></script>',
      },
    };
    const res2 = ContentSheetSchema.safeParse(xssTagline);
    assert.strictEqual(res2.success, false, 'External script tag must be rejected');

    // Injected javascript: URI scheme
    const jsUri = {
      ...goldenData,
      doctor: {
        ...goldenData.doctor,
        name: 'Dr. Test javascript:void(0)',
      },
    };
    const res3 = ContentSheetSchema.safeParse(jsUri);
    assert.strictEqual(res3.success, false, 'javascript: URI scheme must be rejected');
  });
});
