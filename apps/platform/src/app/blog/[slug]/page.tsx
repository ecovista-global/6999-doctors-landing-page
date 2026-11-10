'use client';

import React, { useState, useEffect } from 'react';
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
import { sanitizeHtml } from '@/lib/htmlSanitizer';

export default function BlogDetailPage() {
  const { content, theme } = useClinicContent();
  const params = useParams();
  const slug = (params?.slug as string) || 'managing-type-2-diabetes-in-summer';

  const defaultMeta = CLINICAL_BLOG_POSTS.find((p) => p.slug === slug) || CLINICAL_BLOG_POSTS[0]!;
  const defaultData = POST_CONTENTS[slug] || POST_CONTENTS['managing-type-2-diabetes-in-summer']!;

  const [post, setPost] = useState<{
    title: string;
    category: string;
    readTime: string;
    publishedDate: string;
    author: string;
    contentHtml?: string;
    coverImageUrl?: string;
    keyTakeaways?: string[];
    paragraphs?: string[];
  }>({
    title: defaultMeta.title,
    category: defaultMeta.category,
    readTime: defaultMeta.readTime,
    publishedDate: defaultMeta.publishedDate,
    author: defaultMeta.author,
    keyTakeaways: defaultData.keyTakeaways,
    paragraphs: defaultData.body,
  });

  useEffect(() => {
    async function loadPost() {
      // 1. Try public API endpoint
      try {
        const res = await fetch(`/api/v1/public/posts/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.post) {
            setPost({
              title: data.post.title,
              category: data.post.category,
              readTime: data.post.readTime,
              publishedDate: data.post.publishedDate,
              author: data.post.author,
              contentHtml: data.post.contentHtml,
              coverImageUrl: data.post.coverImageUrl,
            });
            return;
          }
        }
      } catch {
        // Fallback
      }

      // 2. Try demo posts from localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('demo_clinic_posts');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const found = parsed.find((p: any) => p.slug === slug);
            if (found) {
              setPost({
                title: found.title,
                category: found.category,
                readTime: found.readTime,
                publishedDate: found.publishedAt || 'Recent',
                author: 'Dr. Maanvita Kumari (MBBS, MD)',
                contentHtml: found.content,
                coverImageUrl: found.coverImageUrl,
              });
              return;
            }
          } catch {
            // ignore
          }
        }
      }

      // 3. Fallback to hardcoded mock
      const staticMeta = CLINICAL_BLOG_POSTS.find((p) => p.slug === slug) || CLINICAL_BLOG_POSTS[0]!;
      const staticData = POST_CONTENTS[slug] || POST_CONTENTS['managing-type-2-diabetes-in-summer']!;
      setPost({
        title: staticMeta.title,
        category: staticMeta.category,
        readTime: staticMeta.readTime,
        publishedDate: staticMeta.publishedDate,
        author: staticMeta.author,
        keyTakeaways: staticData.keyTakeaways,
        paragraphs: staticData.body,
      });
    }

    loadPost();
  }, [slug]);

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
              {post.category}
            </span>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              {post.readTime} &bull; Published {post.publishedDate}
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
            {post.title}
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
                {post.author}
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
        {/* Cover Photo if present */}
        {post.coverImageUrl && (
          <div
            style={{
              width: '100%',
              maxHeight: '420px',
              borderRadius: '14px',
              overflow: 'hidden',
              marginBottom: '36px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            <img
              src={post.coverImageUrl}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Dynamic HTML Content */}
        {post.contentHtml ? (
          <div>
            <style>{`
              .article-body-render h2 { font-size: 24px; font-weight: 800; color: #0F172A; margin: 32px 0 14px 0; }
              .article-body-render h3 { font-size: 20px; font-weight: 700; color: #0F172A; margin: 24px 0 10px 0; }
              .article-body-render p { font-size: 16px; line-height: 1.8; color: #334155; margin: 0 0 18px 0; }
              .article-body-render ul, .article-body-render ol { margin: 0 0 20px 0; padding-left: 24px; font-size: 16px; color: #334155; line-height: 1.7; }
              .article-body-render li { margin-bottom: 8px; }
              .article-body-render blockquote { border-left: 4px solid #0D5C46; background: #F8FAFC; margin: 20px 0; padding: 14px 20px; font-style: italic; color: #475569; border-radius: 0 8px 8px 0; }
              .article-body-render .clinical-callout { background: #ECFDF5; border-left: 5px solid #059669; padding: 16px 20px; border-radius: 8px; margin: 24px 0; color: #065F46; font-size: 15px; line-height: 1.6; }
              .article-body-render .clinical-callout.emergency-alert { background: #FEF2F2; border-left-color: #DC2626; color: #991B1B; }
            `}</style>
            <div
              className="article-body-render"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentHtml) }}
            />
          </div>
        ) : (
          /* Hardcoded Paragraphs Fallback */
          <div>
            {post.keyTakeaways && post.keyTakeaways.length > 0 && (
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
                  {post.keyTakeaways.map((k, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {post.paragraphs?.map((para, idx) => (
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
          </div>
        )}

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
