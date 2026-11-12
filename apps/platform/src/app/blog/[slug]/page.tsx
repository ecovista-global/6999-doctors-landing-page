'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader, PillArrowIcon } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
} from '@/components/Icons';
import { CLINICAL_BLOG_POSTS, POST_CONTENTS } from '@/lib/blogPosts';
import { sanitizeHtml } from '@/lib/htmlSanitizer';

export default function BlogDetailPage() {
  const { content } = useClinicContent();
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
      try {
        const listRes = await fetch('/api/v1/public/posts');
        if (listRes.ok) {
          const listData = await listRes.json();
          const hasLivePost = Array.isArray(listData?.posts) && listData.posts.some((p: any) => p.slug === slug);
          if (hasLivePost) {
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
          }
        }
      } catch {
        // Fallback below
      }

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
                author: content.doctor.name,
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
  }, [slug, content.doctor.name]);

  return (
    <div className="ms-public-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <PublicHeader content={content} />

      <main id="main-content">
        <section className="ms-subhero">
          <div className="ms-wrap" style={{ maxWidth: '860px' }}>
            <Link href="/blog" className="ms-action-link" style={{ marginBottom: '18px' }}>
              <ChevronLeftIcon size={16} color="currentColor" />
              <span>Back to Health Blog Directory</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span
                className="ms-tag"
                style={{ background: 'var(--brand)', borderColor: 'var(--brand)', color: '#FFFFFF' }}
              >
                {post.category}
              </span>
              <span style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
                {post.readTime} &bull; Published {post.publishedDate}
              </span>
            </div>

            <h1 className="ms-title" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: '20px' }}>
              {post.title}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '15px',
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--ink)' }}>{post.author}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Senior Consultant Physician &bull; {content.clinic.name}
                </div>
              </div>
            </div>
          </div>
        </section>

        <article className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap" style={{ maxWidth: '860px' }}>
            {post.coverImageUrl && (
              <div className="ms-photo-frame" style={{ maxHeight: '420px', marginBottom: '32px' }}>
                <img src={post.coverImageUrl} alt={post.title} />
              </div>
            )}

            {post.contentHtml ? (
              <div
                className="ms-article-body"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentHtml) }}
              />
            ) : (
              <div>
                {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                  <div
                    className="ms-surface-box"
                    style={{
                      borderLeft: '4px solid var(--brand)',
                      marginBottom: '32px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--brand)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        marginBottom: '12px',
                      }}
                    >
                      <ShieldCheckIcon size={16} color="currentColor" />
                      <span>Key Clinical Takeaways for Patients</span>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {post.keyTakeaways.map((k, i) => (
                        <li key={i} style={{ fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
                          {k}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {post.paragraphs?.map((para, idx) => (
                    <p
                      key={idx}
                      style={{
                        fontSize: '16px',
                        lineHeight: 1.78,
                        color: 'var(--muted)',
                        margin: 0,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div
              className="ms-surface-box"
              style={{
                marginTop: '44px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                padding: '26px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                  Need Personalized Medical Advice from {content.doctor.name}?
                </h3>
                <p style={{ fontSize: '14.5px', color: 'var(--muted)', margin: 0 }}>
                  Consultations available in-clinic at {content.clinic.area}, {content.clinic.city}. Standard fee &#8377;
                  {content.doctor.consultationFee} with complimentary 7-day follow-up.
                </p>
              </div>
              <Link href="/contact" className="ms-pill ms-pill-dark">
                <CalendarIcon size={15} color="#FFFFFF" />
                <span>Book Appointment</span>
                <PillArrowIcon />
              </Link>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
