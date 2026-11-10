'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  StarIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  MessageCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@/components/Icons';
import { CLINICAL_FAQS_CATEGORIZED } from '@/lib/clinicalFaqs';

interface PublicTestimonial {
  id: string;
  patientName: string;
  rating: number;
  treatment: string;
  reviewText: string;
  location: string;
}

interface PublicFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface PublicFaqCategory {
  category: string;
  items: { q: string; a: string }[];
}

export default function TestimonialsFaqPage() {
  const { content, theme } = useClinicContent();
  const [activeTab, setActiveTab] = useState<'reviews' | 'faqs'>('reviews');
  const [apiReviews, setApiReviews] = useState<PublicTestimonial[]>([]);
  const [apiFaqCategories, setApiFaqCategories] = useState<PublicFaqCategory[]>([]);

  useEffect(() => {
    // Load testimonials from API
    fetch('/api/v1/public/testimonials')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.testimonials && data.testimonials.length > 0) {
          const mapped: PublicTestimonial[] = data.testimonials.map((t: any) => ({
            id: t.id,
            patientName: t.patientInitials,
            rating: t.rating,
            treatment: t.treatment || 'General Consultation',
            reviewText: t.reviewText,
            location: 'Sector 18, Noida',
          }));
          setApiReviews(mapped);
        }
      })
      .catch(() => {});

    // Load FAQs from API
    fetch('/api/v1/public/faqs')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.faqs && data.faqs.length > 0) {
          // Group FAQs by category
          const categoryMap: Record<string, { q: string; a: string }[]> = {};
          (data.faqs as PublicFaqItem[]).forEach((faq) => {
            const cat = faq.category || 'General';
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push({ q: faq.question, a: faq.answer });
          });
          const grouped: PublicFaqCategory[] = Object.entries(categoryMap).map(([category, items]) => ({
            category,
            items,
          }));
          setApiFaqCategories(grouped);
        }
      })
      .catch(() => {});
  }, []);

  // Merge API reviews with static content.reviews as fallback
  const displayReviews: PublicTestimonial[] =
    apiReviews.length > 0
      ? apiReviews
      : (content.reviews as any[]).map((r) => ({
          id: r.id,
          patientName: r.patientName,
          rating: r.rating,
          treatment: r.treatment,
          reviewText: r.reviewText,
          location: r.location || 'Sector 18, Noida',
        }));

  // Merge API FAQs with static CLINICAL_FAQS_CATEGORIZED as fallback
  const displayFaqCategories: PublicFaqCategory[] =
    apiFaqCategories.length > 0 ? apiFaqCategories : CLINICAL_FAQS_CATEGORIZED;

  const totalFaqCount = displayFaqCategories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Header Banner */}
      <section
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`,
          padding: '60px 24px 30px 24px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: 700,
              color: theme.primary,
              marginBottom: '16px',
            }}
          >
            <ShieldCheckIcon size={14} color={theme.primary} />
            <span>DPDP ACT 2023 VERIFIED REVIEWS &bull; EVIDENCE-BASED CLINICAL FAQS</span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
            Patient Experiences &amp; Frequently Asked Questions
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#64748B',
              maxWidth: '750px',
              margin: '0 auto 28px auto',
              lineHeight: '1.6',
            }}
          >
            Read authentic, verified patient testimonials with documented consent, and explore answers to common inquiries regarding OPD timings, consultation fees, diabetes care, and clinic policies.
          </p>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: '#F1F5F9',
              padding: '4px',
              borderRadius: '10px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'reviews' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'reviews' ? theme.primary : '#64748B',
                fontWeight: activeTab === 'reviews' ? 800 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: activeTab === 'reviews' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              Patient Reviews ({displayReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faqs')}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'faqs' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'faqs' ? theme.primary : '#64748B',
                fontWeight: activeTab === 'faqs' ? 800 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: activeTab === 'faqs' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              Clinical FAQs ({totalFaqCount})
            </button>
          </div>
        </div>
      </section>

      {/* Main Tabbed Content */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'reviews' ? (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {displayReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div>
                    {/* Star Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '14px' }}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          size={18}
                          color={i < rev.rating ? '#F59E0B' : '#E2E8F0'}
                        />
                      ))}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#D97706', marginLeft: '6px' }}>
                        {rev.rating}.0 / 5.0
                      </span>
                    </div>

                    {/* Review Body */}
                    <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.7', margin: '0 0 18px 0', fontStyle: 'italic' }}>
                      &ldquo;{rev.reviewText}&rdquo;
                    </p>
                  </div>

                  <div>
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                        {rev.patientName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {rev.location} &bull; Treatment: <strong>{rev.treatment}</strong>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#059669',
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircleIcon size={12} color="#059669" />
                        <span>Verified Patient &bull; Consent on Record</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '40px',
                textAlign: 'center',
                padding: '24px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
              }}
            >
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                In accordance with National Medical Commission (NMC) regulations and the Digital Personal Data Protection (DPDP) Act 2023, patient names are presented in privacy-preserving formats with verified clinical consent.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {displayFaqCategories.map((cat, idx) => (
              <div key={idx}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
                  {cat.category}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cat.items.map((faq, fIdx) => (
                    <details
                      key={fIdx}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        overflow: 'hidden',
                        padding: '16px 20px',
                      }}
                    >
                      <summary
                        style={{
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#0F172A',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDownIcon size={18} color="#64748B" />
                      </summary>
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid #F1F5F9',
                          fontSize: '14px',
                          color: '#475569',
                          lineHeight: '1.7',
                        }}
                      >
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking CTA Strip */}
      <section style={{ background: theme.bg, padding: '48px 24px', borderTop: '1px solid #E2E8F0' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
            Have a Specific Clinical Question or Need a Consultation?
          </h3>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
            Book an in-person consultation at Sector 18 Noida with Dr. Maanvita Kumari or connect via WhatsApp.
          </p>
          <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/contact"
              style={{
                background: theme.primary,
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CalendarIcon size={16} color="#FFFFFF" />
              <span>Book Appointment &rarr;</span>
            </Link>
            <a
              href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366',
                color: '#FFFFFF',
                padding: '12px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MessageCircleIcon size={16} color="#FFFFFF" />
              <span>WhatsApp Us Directly</span>
            </a>
          </div>
        </div>
      </section>

      {/* Shared Public Footer */}
      <PublicFooter content={content} theme={theme} />
    </div>
  );
}
