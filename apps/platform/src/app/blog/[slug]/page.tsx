'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  FileTextIcon,
  ClockIcon,
  UserCheckIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  PhoneIcon,
} from '@/components/Icons';
import { CLINICAL_BLOG_POSTS, POST_CONTENTS } from '@/lib/blogPosts';

export default function BlogDetailPage() {
  const { content, theme, loading } = useClinicContent();
  const params = useParams();
  const slug = (params?.slug as string) || 'managing-type-2-diabetes-in-summer';

  const postMeta = CLINICAL_BLOG_POSTS.find((p) => p.slug === slug) || CLINICAL_BLOG_POSTS[0]!;
  const postData = POST_CONTENTS[slug] || POST_CONTENTS['managing-type-2-diabetes-in-summer']!;

  if (loading && !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Clinical Article...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Article Header & Breadcrumbs */}
      <section
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, #FFFFFF 100%)`,
          padding: '48px 24px 32px 24px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: theme.primary,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <ChevronLeftIcon size={16} color={theme.primary} />
            <span>Back to Health Blog Directory</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span
              style={{
                background: theme.primary,
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {postMeta.category}
            </span>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              {postMeta.readTime} &bull; Published {postMeta.publishedDate}
            </span>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: '1.25',
              margin: '0 0 16px 0',
            }}
          >
            {postMeta.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: theme.primary,
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                {postMeta.author}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Senior Consultant Physician &bull; HealthConsult Clinic Noida
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article style={{ padding: '48px 24px', maxWidth: '840px', margin: '0 auto' }}>
        {/* Key Takeaways Box */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #CBD5E1',
            borderLeft: `5px solid ${theme.primary}`,
            padding: '24px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: theme.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '14px',
            }}
          >
            <ShieldCheckIcon size={16} color={theme.primary} />
            <span>Key Clinical Takeaways for Patients</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {postData.keyTakeaways.map((k, i) => (
              <li key={i} style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                {k}
              </li>
            ))}
          </ul>
        </div>

        {/* Paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {postData.body.map((para, idx) => (
            <p
              key={idx}
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#334155',
                margin: 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Doctor Consultation CTA Card */}
        <div
          style={{
            marginTop: '48px',
            background: theme.bg,
            borderRadius: '14px',
            border: '1px solid #CBD5E1',
            padding: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              Need Personalized Medical Advice from Dr. Maanvita Kumari?
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
              Consultations available in-clinic at Sector 18, Noida. Standard fee ₹600 with complimentary 7-day follow-up.
            </p>
          </div>
          <Link
            href="/contact"
            style={{
              background: theme.primary,
              color: '#FFFFFF',
              padding: '12px 22px',
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
            <span>Book In-Clinic Consultation</span>
          </Link>
        </div>
      </article>

      {/* Shared Public Footer */}
      <PublicFooter content={content} theme={theme} />
    </div>
  );
}
