'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
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
  const { content } = useClinicContent();
  const [activeTab, setActiveTab] = useState<'reviews' | 'faqs'>('reviews');
  const [apiReviews, setApiReviews] = useState<PublicTestimonial[]>([]);
  const [apiFaqCategories, setApiFaqCategories] = useState<PublicFaqCategory[]>([]);

  useEffect(() => {
    fetch('/api/v1/public/testimonials')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.testimonials && data.testimonials.length > 0) {
          const mapped: PublicTestimonial[] = data.testimonials.map((t: any) => ({
            id: t.id,
            patientName: t.patientInitials,
            rating: t.rating,
            treatment: t.treatment || 'General Consultation',
            reviewText: t.reviewText,
            location: `${content.clinic.area}, ${content.clinic.city}`,
          }));
          setApiReviews(mapped);
        }
      })
      .catch(() => {});

    fetch('/api/v1/public/faqs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.faqs && data.faqs.length > 0) {
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
  }, [content.clinic.area, content.clinic.city]);

  const displayReviews: PublicTestimonial[] =
    apiReviews.length > 0
      ? apiReviews
      : (content.reviews as any[]).map((r) => ({
          id: r.id,
          patientName: r.patientName,
          rating: r.rating,
          treatment: r.treatment,
          reviewText: r.reviewText,
          location: r.location || `${content.clinic.area}, ${content.clinic.city}`,
        }));

  const displayFaqCategories: PublicFaqCategory[] =
    apiFaqCategories.length > 0 ? apiFaqCategories : CLINICAL_FAQS_CATEGORIZED;

  const totalFaqCount = displayFaqCategories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className="ms-public-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <PublicHeader content={content} />

      <main id="main-content">
        <section className="ms-subhero">
          <div className="ms-wrap ms-subhero-centered">
            <div className="ms-badge-pill">
              <ShieldCheckIcon size={14} color="currentColor" />
              <span>DPDP Act 2023 Verified Reviews &bull; Evidence-Based Clinical FAQs</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '840px', marginBottom: '12px' }}>
              Patient Experiences &amp;{' '}
              <span className="ms-hero-serif">Clinical FAQs</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '700px', margin: '0 auto 26px auto' }}>
              Authentic, consented patient testimonials alongside clear answers on OPD timings, consultation fees, diabetes care, and clinic policies.
            </p>

            {/* Editorial Segmented Switcher */}
            <div className="ms-segmented" role="tablist" aria-label="Testimonials and FAQ tabs">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'reviews'}
                onClick={() => setActiveTab('reviews')}
                className={`ms-segmented-btn${activeTab === 'reviews' ? ' active' : ''}`}
              >
                Patient Reviews ({displayReviews.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'faqs'}
                onClick={() => setActiveTab('faqs')}
                className={`ms-segmented-btn${activeTab === 'faqs' ? ' active' : ''}`}
              >
                Clinical FAQs ({totalFaqCount})
              </button>
            </div>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            {activeTab === 'reviews' ? (
              <div>
                <div className="ms-grid-3">
                  {displayReviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="ms-editorial-card"
                      style={{ justifyContent: 'space-between', padding: '24px' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '14px' }}>
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              size={17}
                              color={i < rev.rating ? '#D97706' : '#CBD5E1'}
                            />
                          ))}
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#B45309', marginLeft: '6px' }}>
                            {rev.rating}.0 / 5.0
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: '14.5px',
                            color: 'var(--ink)',
                            lineHeight: 1.7,
                            margin: '0 0 18px 0',
                            fontStyle: 'italic',
                          }}
                        >
                          &ldquo;{rev.reviewText}&rdquo;
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                          {rev.patientName}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                          {rev.location} &bull; {rev.treatment}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#047857',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircleIcon size={13} color="currentColor" />
                          <span>Verified Patient &bull; Consent on Record</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="ms-surface-box" style={{ marginTop: '36px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                    In accordance with National Medical Commission (NMC) regulations and the Digital Personal Data Protection (DPDP) Act 2023, patient names are presented in privacy-preserving formats with verified clinical consent.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '880px', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {displayFaqCategories.map((cat, idx) => (
                  <div key={idx}>
                    <h2 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 14px 0' }}>
                      {cat.category}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {cat.items.map((faq, fIdx) => (
                        <details key={fIdx} className="ms-faq-item">
                          <summary>
                            <span>{faq.q}</span>
                            <ChevronDownIcon size={18} color="var(--brand)" style={{ flexShrink: 0 }} />
                          </summary>
                          <div
                            style={{
                              marginTop: '12px',
                              paddingTop: '12px',
                              borderTop: '1px solid var(--border)',
                              fontSize: '14.5px',
                              color: 'var(--muted)',
                              lineHeight: 1.7,
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
          </div>
        </section>

        <section className="ms-cta-strip">
          <div className="ms-wrap" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '23px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px 0' }}>
              Have a Specific Clinical Question or Need a Consultation?
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '0 auto 22px auto', maxWidth: '620px' }}>
              Book an in-person consultation at {content.clinic.area}, {content.clinic.city} with {content.doctor.name} or connect with our reception desk.
            </p>
            <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/contact" className="ms-pill ms-pill-dark">
                <CalendarIcon size={15} color="#FFFFFF" />
                <span>Book Appointment</span>
                <PillArrowIcon />
              </Link>
              <a
                href={`https://wa.me/${content.doctor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="ms-pill ms-pill-light"
              >
                <MessageCircleIcon size={15} color="var(--brand)" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
