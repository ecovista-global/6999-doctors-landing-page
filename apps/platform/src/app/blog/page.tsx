'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinicContent } from '@/lib/useClinicContent';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  FileTextIcon,
  ClockIcon,
  UserCheckIcon,
  CalendarIcon,
  SearchIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from '@/components/Icons';
import { CLINICAL_BLOG_POSTS } from '@/lib/blogPosts';

export default function BlogIndexPage() {
  const { content, theme } = useClinicContent();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Diabetes & Endocrinology', 'Infectious Diseases', 'Cardiovascular Health', 'Endocrinology & Women Health'];

  const filteredPosts = CLINICAL_BLOG_POSTS.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: theme.text, fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Shared Public Header */}
      <PublicHeader content={content} theme={theme} />

      {/* Blog Hero Banner */}
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
            <span>PHYSICIAN-AUTHORED MEDICAL EDUCATION &bull; EVIDENCE-BASED HEALTH</span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
            HealthConsult Clinical Blog &amp; Patient Guides
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
            Accredited medical guidance, disease prevention advisories, and wellness insights written directly by Senior Consultant Physician Dr. Maanvita Kumari.
          </p>

          {/* Search Input */}
          <div style={{ maxWidth: '480px', margin: '0 auto 20px auto', position: 'relative' }}>
            <input
              type="search"
              aria-label="Search medical blog articles"
              placeholder="Search articles by keyword or condition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 42px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '14px',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon size={18} />
            </span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? theme.primary : '#E2E8F0',
                  background: selectedCategory === cat ? theme.primary : '#FFFFFF',
                  color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                  fontSize: '12px',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Article Cards */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '28px',
          }}
        >
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              style={{
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      background: theme.bg,
                      color: theme.primary,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon size={13} color="#64748B" />
                    <span>{post.readTime}</span>
                  </span>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {post.title}
                  </Link>
                </h2>

                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: '#F1F5F9',
                        color: '#64748B',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '16px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  <strong>{post.author}</strong> &bull; {post.publishedDate}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  style={{
                    color: theme.primary,
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Read Article</span>
                  <ChevronRightIcon size={14} color={theme.primary} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Shared Public Footer */}
      <PublicFooter content={content} theme={theme} />
    </div>
  );
}
