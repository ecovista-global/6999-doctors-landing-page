'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit3Icon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  XIcon,
} from '@/components/Icons';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  coverImageUrl?: string | undefined;
  content: string;
  isPublished: boolean;
  publishedAt?: string | undefined;
  createdAt: string;
}

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Managing Type-2 Diabetes in Urban Lifestyles: A Clinician’s Guide',
    slug: 'managing-type-2-diabetes-urban-lifestyle',
    excerpt: 'Practical dietary, exercise, and pharmacological strategies for busy professionals managing blood glucose levels in NCR.',
    category: 'General Medicine',
    readTime: '5 min read',
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=640',
    content: `<h2>Understanding Urban Glycemic Challenges</h2>
<p>In metropolitan settings like Noida and Delhi NCR, sedentary desk hours combined with late evening meals pose significant glycemic challenges for patients with prediabetes and Type-2 diabetes.</p>
<div class="clinical-callout"><strong>Clinical Pearl:</strong> Postprandial 15-minute walks reduce peak glucose spikes by up to 22% compared to continuous sitting.</div>
<h3>1. Carbohydrate Quality over Extreme Restriction</h3>
<p>Extreme ketogenic or crash diets often lead to rebound hyperglycemia and patient non-adherence. Instead, prioritize complex legumes, millets (ragi, jowar), and high-fiber vegetables.</p>
<h3>2. Routine HbA1c and Kidney Profiling</h3>
<p>Patients should undergo quarterly HbA1c checks along with annual urine microalbumin testing to safeguard against diabetic nephropathy.</p>`,
    isPublished: true,
    publishedAt: '2026-10-28',
    createdAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'post-2',
    title: 'Seasonal Viral Fevers & Dengue Preparedness: Warning Signs to Watch',
    slug: 'seasonal-viral-fevers-dengue-warning-signs',
    excerpt: 'Essential clinical advice on fluid maintenance, platelet monitoring intervals, and red-flag symptoms requiring emergency triage.',
    category: 'Infectious Disease',
    readTime: '4 min read',
    coverImageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=640',
    content: `<h2>Early Recognition of Atypical Viral Fevers</h2>
<p>During the post-monsoon and early winter transition, viral fevers frequently overlap with Dengue and Chikungunya presentations.</p>
<div class="clinical-callout"><strong>Emergency Red Flags:</strong> Persistent vomiting, mucosal bleeding, severe abdominal pain, and sudden lethargy warrant urgent hospital presentation.</div>
<h3>Hydration Protocols</h3>
<p>Avoid excessive reliance on home remedies that cause gastric irritation. Oral rehydration salts (ORS), coconut water, and adequate clear fluids remain the clinical cornerstone.</p>`,
    isPublished: true,
    publishedAt: '2026-11-02',
    createdAt: '2026-11-02T08:30:00Z',
  },
  {
    id: 'post-3',
    title: 'Adult Immunization Guide: Protecting Senior Citizens from Pneumonia & Shingles',
    slug: 'adult-immunization-senior-citizens-pneumonia-shingles',
    excerpt: 'Vaccines are not just for pediatric patients. Discover evidence-backed immunization schedules for adults over 50.',
    category: 'Preventive Care',
    readTime: '6 min read',
    coverImageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=640',
    content: `<h2>The Critical Gap in Adult Immunization</h2>
<p>While childhood vaccination coverage in India has expanded dramatically, adult vaccination remains critically underutilized among high-risk demographics.</p>
<h3>1. Pneumococcal Conjugate & Polysaccharide Vaccines</h3>
<p>Recommended for all individuals aged 65 and above, as well as adults aged 19-64 with chronic pulmonary disease, asthma, diabetes, or smoking history.</p>
<h3>2. Recombinant Zoster (Shingles)</h3>
<p>Two-dose schedule highly effective at preventing post-herpetic neuralgia in individuals aged 50 and older.</p>`,
    isPublished: false,
    createdAt: '2026-11-05T14:15:00Z',
  },
];

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    category: 'General Medicine',
    readTime: '5 min read',
    coverImageUrl: '',
    content: '',
    isPublished: true,
  });

  useEffect(() => {
    // Load from localStorage or default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_clinic_posts');
      if (saved) {
        try {
          setPosts(JSON.parse(saved));
        } catch {
          setPosts(DEFAULT_POSTS);
        }
      } else {
        setPosts(DEFAULT_POSTS);
      }
    }
    setLoading(false);
  }, []);

  const savePostsToStorage = (updated: BlogPost[]) => {
    setPosts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_clinic_posts', JSON.stringify(updated));
    }
  };

  const handleOpenNew = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      category: 'General Medicine',
      readTime: '4 min read',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=640',
      content: '<p>Write your patient education article here...</p>',
      isPublished: true,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      readTime: post.readTime,
      coverImageUrl: post.coverImageUrl || '',
      content: post.content,
      isPublished: post.isPublished,
    });
    setIsEditorOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const derivedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: derivedSlug,
    }));
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Sanitize body (strip script tags per Rule R9)
    const sanitizedContent = formData.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onload\s*=|onerror\s*=/gi, '');

    if (editingPost) {
      const updated = posts.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              ...formData,
              content: sanitizedContent,
              publishedAt: formData.isPublished ? p.publishedAt || new Date().toISOString().slice(0, 10) : undefined,
            }
          : p
      );
      savePostsToStorage(updated);
      showToast('Article updated successfully.');
    } else {
      const newPost: BlogPost = {
        id: `post-${Date.now()}`,
        ...formData,
        content: sanitizedContent,
        createdAt: new Date().toISOString(),
        publishedAt: formData.isPublished ? new Date().toISOString().slice(0, 10) : undefined,
      };
      savePostsToStorage([newPost, ...posts]);
      showToast('New clinical article published.');
    }

    setIsEditorOpen(false);
  };

  const handleDeletePost = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updated = posts.filter((p) => p.id !== id);
      savePostsToStorage(updated);
      showToast('Article deleted.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories = ['all', 'General Medicine', 'Infectious Disease', 'Preventive Care', 'Cardiology', 'Pediatrics'];

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Clinical Blog & Patient Education
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Author, publish, and manage verified patient health guides for the Health Blog page (/blog).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-brand-primary, #0D5C46)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <PlusIcon size={16} />
          <span>New Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <SearchIcon
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              background: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${selectedCategory === cat ? '#0D5C46' : '#E2E8F0'}`,
                background: selectedCategory === cat ? '#E6F4F1' : '#FFFFFF',
                color: selectedCategory === cat ? '#0D5C46' : '#64748B',
                fontSize: '12px',
                fontWeight: selectedCategory === cat ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            color: '#64748B',
          }}
        >
          <FileTextIcon size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '15px', color: '#0F172A', margin: '0 0 6px 0' }}>No articles found</h3>
          <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>Try searching with different terms or create a new health article.</p>
          <button
            type="button"
            onClick={handleOpenNew}
            style={{
              padding: '8px 16px',
              background: '#0D5C46',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create New Article
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                gap: '20px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#F1F5F9',
                      color: '#475569',
                    }}
                  >
                    {post.category}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: post.isPublished ? '#D1FAE5' : '#FEF3C7',
                      color: post.isPublished ? '#065F46' : '#92400E',
                    }}
                  >
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon size={12} />
                    {post.readTime}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {post.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94A3B8' }}>
                  <span>Slug: <code style={{ color: '#0D5C46', background: '#F8FAFC', padding: '1px 4px' }}>/blog/{post.slug}</code></span>
                  {post.publishedAt && <span>&bull; Published: {post.publishedAt}</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={`http://localhost:5173#blog`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on patient site"
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLinkIcon size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(post)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Edit3Icon size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePost(post.id)}
                  title="Delete article"
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #FEE2E2',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2Icon size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal / Drawer */}
      {isEditorOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '24px 28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editingPost ? 'Edit Clinical Article' : 'Compose New Patient Health Article'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title & Slug */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Article Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Type-2 Diabetes in Urban Lifestyles"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Infectious Disease">Infectious Disease</option>
                    <option value="Preventive Care">Preventive Care</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Summary / Excerpt (Shows on search results & preview cards)
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short 1-2 sentence overview for patients..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Cover Image URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Cover Photo URL
                </label>
                <input
                  type="url"
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Content Body Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                    Article Body (Sanitized Rich HTML)
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Scripts/event handlers stripped automatically (Rule R9)
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Status checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="isPublished" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  Publish immediately (Visible on live patient site)
                </label>
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0D5C46',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingPost ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0D5C46',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
