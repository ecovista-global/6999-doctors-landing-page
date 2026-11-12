'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  ClockIcon,
  SearchIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from '@/components/Icons';
import { CLINICAL_BLOG_POSTS, ClinicalBlogPost } from '@/lib/blogPosts';

export default function BlogIndexPage() {
  const { content } = useClinicContent();
  const [allPosts, setAllPosts] = useState<ClinicalBlogPost[]>(CLINICAL_BLOG_POSTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    async function loadDynamicPosts() {
      try {
        const res = await fetch('/api/v1/public/posts');
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            const dynamicSlugs = new Set(data.posts.map((p: any) => p.slug));
            const existingNonDuplicates = CLINICAL_BLOG_POSTS.filter((p) => !dynamicSlugs.has(p.slug));
            setAllPosts([...data.posts, ...existingNonDuplicates]);
            return;
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
            const published = parsed
              .filter((p: any) => p.isPublished)
              .map((p: any) => ({
                slug: p.slug,
                title: p.title,
                excerpt: p.excerpt,
                category: p.category,
                readTime: p.readTime,
                publishedDate: p.publishedAt || 'Recent',
                author: content.doctor.name,
                tags: [p.category],
              }));
            if (published.length > 0) {
              const pubSlugs = new Set(published.map((p: any) => p.slug));
              const nonDups = CLINICAL_BLOG_POSTS.filter((p) => !pubSlugs.has(p.slug));
              setAllPosts([...published, ...nonDups]);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    loadDynamicPosts();
  }, [content.doctor.name]);

  const categories = [
    'All',
    'General Medicine',
    'Diabetes & Endocrinology',
    'Infectious Diseases',
    'Cardiovascular Health',
    'Endocrinology & Women Health',
    'Preventive Care',
  ];

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    const matchesCategory =
      selectedCategory === 'All' ||
      post.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

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
              <span>Physician-Authored Medical Education &bull; Evidence-Based Guides</span>
            </div>

            <h1 className="ms-hero-title" style={{ maxWidth: '820px', marginBottom: '12px' }}>
              Clinical Blog &amp;{' '}
              <span className="ms-hero-serif">Patient Guides</span>
            </h1>
            <p className="ms-desc" style={{ maxWidth: '700px', margin: '0 auto 24px auto' }}>
              Accredited medical guidance, seasonal prevention advisories, and wellness insights authored by {content.doctor.name}.
            </p>

            <div className="ms-search-wrap" style={{ marginBottom: '20px' }}>
              <input
                type="search"
                aria-label="Search medical blog articles"
                placeholder="Search articles by keyword or condition..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ms-search-input"
              />
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon size={18} />
              </span>
            </div>

            <div className="ms-chip-bar" style={{ maxWidth: '920px' }}>
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`ms-chip-pill${active ? ' active' : ''}`}
                    style={{ minHeight: '36px', fontSize: '12.5px', padding: '0 14px' }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ms-section" style={{ background: '#FFFFFF' }}>
          <div className="ms-wrap">
            {filteredPosts.length === 0 ? (
              <div className="ms-surface-box" style={{ textAlign: 'center', padding: '44px 20px' }}>
                <p className="ms-desc" style={{ marginBottom: '14px' }}>
                  No patient guides matched your current filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearch('');
                  }}
                  className="ms-pill ms-pill-dark"
                >
                  <span>View All Articles</span>
                </button>
              </div>
            ) : (
              <div className="ms-grid-3">
                {filteredPosts.map((post) => (
                  <article
                    key={post.slug}
                    className="ms-editorial-card"
                    style={{ justifyContent: 'space-between', padding: '24px' }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: '12px',
                        }}
                      >
                        <span className="ms-tag">{post.category}</span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ClockIcon size={13} color="currentColor" />
                          <span>{post.readTime}</span>
                        </span>
                      </div>

                      <h2
                        style={{
                          fontSize: '18.5px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          margin: '0 0 10px 0',
                          lineHeight: 1.38,
                        }}
                      >
                        <Link
                          href={`/blog/${post.slug}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {post.title}
                        </Link>
                      </h2>

                      <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                        {post.excerpt}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                          {post.tags.map((tag) => (
                            <span key={tag} className="ms-tag-muted">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '14px',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        <strong style={{ color: 'var(--ink)' }}>{post.author}</strong> &bull; {post.publishedDate}
                      </div>
                      <Link href={`/blog/${post.slug}`} className="ms-action-link" style={{ minHeight: 'auto', fontSize: '13.5px', flexShrink: 0 }}>
                        <span>Read Article</span>
                        <ChevronRightIcon size={14} color="currentColor" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter content={content} />
    </div>
  );
}
