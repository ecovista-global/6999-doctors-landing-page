/**
 * MT-122: FAQs & Testimonials PostgreSQL Moderation Test Suite
 * Tests CMS and public API routes for FAQs and Testimonials.
 * DPDP Act 2023 consent gate enforcement is verified.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID,
};

let createdFaqId: string | null = null;
let createdTestimonialId: string | null = null;

describe('MT-122: FAQs & Testimonials PostgreSQL Moderation', () => {
  describe('CMS: FAQ API Routes', () => {
    it('GET /api/v1/cms/faqs returns 200 with faqs array', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/faqs?tenantId=${TENANT_ID}`);
      assert.equal(res.status, 200, 'CMS FAQs GET should return 200');
      const data = await res.json();
      assert.ok(Array.isArray(data.faqs), 'Response should contain faqs array');
    });

    it('POST /api/v1/cms/faqs creates a new FAQ and returns 201', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/faqs?tenantId=${TENANT_ID}`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          question: 'What are your clinic hours?',
          answer: 'Morning OPD: 09:00 AM - 01:00 PM. Evening OPD: 05:00 PM - 08:00 PM. Sunday: Closed.',
          category: 'Appointments',
          displayOrder: 99,
          isActive: true,
        }),
      });
      assert.equal(res.status, 201, 'FAQ POST should return 201');
      const data = await res.json();
      assert.ok(data.success, 'Response should indicate success');
      assert.ok(data.faq.id, 'Created FAQ should have an id');
      assert.equal(data.faq.category, 'Appointments', 'FAQ category should match');
      createdFaqId = data.faq.id;
    });

    it('POST /api/v1/cms/faqs returns 422 when question is missing', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/faqs?tenantId=${TENANT_ID}`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ answer: 'An answer without a question', category: 'General' }),
      });
      assert.equal(res.status, 422, 'Missing question should return 422');
    });

    it('PUT /api/v1/cms/faqs/[id] updates FAQ correctly', async () => {
      assert.ok(createdFaqId, 'Must have a created FAQ id from prior test');
      const res = await fetch(`${BASE}/api/v1/cms/faqs/${createdFaqId}?tenantId=${TENANT_ID}`, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify({ isActive: false }),
      });
      assert.equal(res.status, 200, 'FAQ PUT should return 200');
      const data = await res.json();
      assert.equal(data.faq.isActive, false, 'FAQ isActive should be updated to false');
    });

    it('GET /api/v1/cms/faqs with category filter returns filtered results', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/faqs?tenantId=${TENANT_ID}&category=Appointments`);
      assert.equal(res.status, 200, 'Filtered GET should return 200');
      const data = await res.json();
      assert.ok(Array.isArray(data.faqs), 'Should return faqs array');
      const allMatchCategory = data.faqs.every((f: any) => f.category === 'Appointments');
      assert.ok(allMatchCategory, 'All returned FAQs should have category Appointments');
    });

    it('DELETE /api/v1/cms/faqs/[id] removes the FAQ', async () => {
      assert.ok(createdFaqId, 'Must have a created FAQ id from prior test');
      const res = await fetch(`${BASE}/api/v1/cms/faqs/${createdFaqId}?tenantId=${TENANT_ID}`, {
        method: 'DELETE',
        headers: HEADERS,
      });
      assert.equal(res.status, 200, 'FAQ DELETE should return 200');
      const data = await res.json();
      assert.ok(data.success, 'Delete response should indicate success');
    });
  });

  describe('CMS: Testimonials API Routes', () => {
    it('GET /api/v1/cms/testimonials returns 200 with testimonials array', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/testimonials?tenantId=${TENANT_ID}`);
      assert.equal(res.status, 200, 'CMS testimonials GET should return 200');
      const data = await res.json();
      assert.ok(Array.isArray(data.testimonials), 'Response should contain testimonials array');
    });

    it('POST /api/v1/cms/testimonials with consent creates testimonial in draft', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/testimonials?tenantId=${TENANT_ID}`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          patientInitials: 'T. E.',
          reviewText: 'Very professional and caring doctor. Highly recommend.',
          rating: 5,
          treatment: 'General Consultation',
          consentRecorded: true,
          moderationStatus: 'draft',
        }),
      });
      assert.equal(res.status, 201, 'Testimonial POST with consent should return 201');
      const data = await res.json();
      assert.ok(data.success, 'Response should indicate success');
      assert.ok(data.testimonial.id, 'Created testimonial should have an id');
      assert.equal(data.testimonial.moderationStatus, 'draft', 'Status should be draft');
      createdTestimonialId = data.testimonial.id;
    });

    it('POST /api/v1/cms/testimonials blocks approval without consent (DPDP E-1606)', async () => {
      const res = await fetch(`${BASE}/api/v1/cms/testimonials?tenantId=${TENANT_ID}`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          patientInitials: 'No. C.',
          reviewText: 'Review without consent should not be approved.',
          rating: 4,
          treatment: 'Hypertension',
          consentRecorded: false,
          moderationStatus: 'approved',
        }),
      });
      assert.equal(res.status, 422, 'Approving without consent should return 422 (E-1606)');
      const data = await res.json();
      assert.ok(data.code === 'E-1606' || (data.errors && data.errors.some((e: any) => e.code === 'E-1606')),
        'Error code should be E-1606');
    });

    it('PUT /api/v1/cms/testimonials/[id] promotes testimonial to approved with consent', async () => {
      assert.ok(createdTestimonialId, 'Must have a created testimonial id from prior test');
      const res = await fetch(`${BASE}/api/v1/cms/testimonials/${createdTestimonialId}?tenantId=${TENANT_ID}`, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify({ moderationStatus: 'approved', consentRecorded: true }),
      });
      assert.equal(res.status, 200, 'Approve with consent should return 200');
      const data = await res.json();
      assert.equal(data.testimonial.moderationStatus, 'approved', 'Status should be promoted to approved');
      assert.equal(data.testimonial.consentRecorded, true, 'Consent should be recorded');
    });

    it('DELETE /api/v1/cms/testimonials/[id] removes the testimonial', async () => {
      assert.ok(createdTestimonialId, 'Must have a created testimonial id from prior test');
      const res = await fetch(`${BASE}/api/v1/cms/testimonials/${createdTestimonialId}?tenantId=${TENANT_ID}`, {
        method: 'DELETE',
        headers: HEADERS,
      });
      assert.equal(res.status, 200, 'Testimonial DELETE should return 200');
      const data = await res.json();
      assert.ok(data.success, 'Delete response should indicate success');
    });
  });

  describe('Public: FAQ & Testimonial Read Endpoints', () => {
    it('GET /api/v1/public/faqs returns 200 with active FAQs only', async () => {
      const res = await fetch(`${BASE}/api/v1/public/faqs`);
      assert.equal(res.status, 200, 'Public FAQs GET should return 200');
      const data = await res.json();
      assert.ok(Array.isArray(data.faqs), 'Should return faqs array');
      const allActive = data.faqs.every((f: any) => f.isActive === true);
      assert.ok(allActive, 'All public FAQs must have isActive=true');
    });

    it('GET /api/v1/public/testimonials returns 200 with approved+consent rows only', async () => {
      const res = await fetch(`${BASE}/api/v1/public/testimonials`);
      assert.equal(res.status, 200, 'Public testimonials GET should return 200');
      const data = await res.json();
      assert.ok(Array.isArray(data.testimonials), 'Should return testimonials array');
      const allApproved = data.testimonials.every(
        (t: any) => t.moderationStatus === 'approved' && t.consentRecorded === true
      );
      assert.ok(allApproved, 'All public testimonials must be approved AND have consent recorded');
    });
  });
});
