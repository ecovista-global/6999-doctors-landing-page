'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCmsShell } from '@/components/cms/CmsShellContext';
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
  EyeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ImageIcon,
} from '@/components/Icons';
import { sanitizeHtml, generateSlug, calculateReadTime, extractPlainText } from '@/lib/htmlSanitizer';

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
  updatedAt?: string | undefined;
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
<div class="clinical-callout emergency-alert"><strong>Emergency Red Flags:</strong> Persistent vomiting, mucosal bleeding, severe abdominal pain, and sudden lethargy warrant urgent hospital presentation.</div>
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
  const { searchQuery: shellSearch } = useCmsShell();
  const [posts, setPosts] = useState<BlogPost[]>(DEFAULT_POSTS);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [slugCollision, setSlugCollision] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    category: 'General Medicine',
    readTime: '4 min read',
    coverImageUrl: '',
    content: '',
    isPublished: true,
  });

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const getTenantId = () => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000001';
  };

  const fetchPostsFromApi = async () => {
    try {
      const tenantId = getTenantId();
      const res = await fetch(`/api/v1/cms/posts?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
          if (typeof window !== 'undefined') {
            localStorage.setItem('demo_clinic_posts', JSON.stringify(data.posts));
          }
          return;
        }
      }
    } catch {
      // Fallback to localStorage
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_clinic_posts');
      if (saved) {
        try {
          setPosts(JSON.parse(saved));
          return;
        } catch {
          // ignore
        }
      }
    }
    setPosts(DEFAULT_POSTS);
  };

  useEffect(() => {
    fetchPostsFromApi();
  }, []);

  const savePostsToStorage = (updated: BlogPost[]) => {
    setPosts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_clinic_posts', JSON.stringify(updated));
    }
  };

  const checkSlugUniqueness = (slugToCheck: string, currentId?: string): boolean => {
    const isTaken = posts.some(
      (p) => p.slug.toLowerCase() === slugToCheck.toLowerCase() && p.id !== currentId
    );
    setSlugCollision(isTaken);
    return !isTaken;
  };

  const handleOpenNew = () => {
    setEditingPost(null);
    setActiveTab('editor');
    setSlugCollision(false);
    const initialContent = `<p>Write your patient health education article here...</p>
<div class="clinical-callout"><strong>Clinical Pearl:</strong> Highlight crucial clinical advice or dietary tips for patients.</div>`;
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      category: 'General Medicine',
      readTime: '3 min read',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=640',
      content: initialContent,
      isPublished: true,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setActiveTab('editor');
    setSlugCollision(false);
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
    const derivedSlug = generateSlug(val);
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: derivedSlug,
    }));
    checkSlugUniqueness(derivedSlug, editingPost?.id);
  };

  const handleSlugChange = (val: string) => {
    const clean = generateSlug(val);
    setFormData((prev) => ({ ...prev, slug: clean }));
    checkSlugUniqueness(clean, editingPost?.id);
  };

  const handleContentChange = (val: string) => {
    const newReadTime = calculateReadTime(val);
    setFormData((prev) => ({
      ...prev,
      content: val,
      readTime: newReadTime,
    }));
  };

  // Helper to insert formatting tags into textarea
  const insertFormatting = (tagOrSnippet: string, wrapText?: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = formData.content;
    const selected = current.substring(start, end) || wrapText || 'formatted text';

    let replacement = '';
    if (tagOrSnippet === 'h2') {
      replacement = `\n<h2>${selected}</h2>\n`;
    } else if (tagOrSnippet === 'h3') {
      replacement = `\n<h3>${selected}</h3>\n`;
    } else if (tagOrSnippet === 'bold') {
      replacement = `<strong>${selected}</strong>`;
    } else if (tagOrSnippet === 'italic') {
      replacement = `<em>${selected}</em>`;
    } else if (tagOrSnippet === 'pearl') {
      replacement = `\n<div class="clinical-callout"><strong>Clinical Pearl:</strong> ${selected}</div>\n`;
    } else if (tagOrSnippet === 'emergency') {
      replacement = `\n<div class="clinical-callout emergency-alert"><strong>Emergency Warning:</strong> ${selected}</div>\n`;
    } else if (tagOrSnippet === 'ul') {
      replacement = `\n<ul>\n  <li>${selected}</li>\n  <li>Second key point</li>\n</ul>\n`;
    } else if (tagOrSnippet === 'ol') {
      replacement = `\n<ol>\n  <li>${selected}</li>\n  <li>Next step in regimen</li>\n</ol>\n`;
    } else if (tagOrSnippet === 'quote') {
      replacement = `\n<blockquote>${selected}</blockquote>\n`;
    } else if (tagOrSnippet === 'p') {
      replacement = `\n<p>${selected}</p>\n`;
    }

    const updated = current.substring(0, start) + replacement + current.substring(end);
    handleContentChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter an article title.');
      return;
    }

    const finalSlug = formData.slug.trim() || generateSlug(formData.title);
    if (!checkSlugUniqueness(finalSlug, editingPost?.id)) {
      showToast('Slug conflict: this URL slug is already taken.');
      return;
    }

    setIsSaving(true);
    const sanitizedContent = sanitizeHtml(formData.content);
    const autoReadTime = calculateReadTime(sanitizedContent);
    const tenantId = getTenantId();

    const isUuid =
      !!editingPost &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingPost.id);

    try {
      if (editingPost && isUuid) {
        // PUT update existing Postgres row
        const res = await fetch(`/api/v1/cms/posts/${editingPost.id}?tenantId=${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            slug: finalSlug,
            content: sanitizedContent,
            readTime: autoReadTime,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updated = posts.map((p) => (p.id === editingPost.id ? data.post : p));
          savePostsToStorage(updated);
          showToast('Article updated successfully.');
        } else {
          showToast('Failed to save article to database. Please retry.');
          return;
        }
      } else {
        // POST create (new article or promoting a local fallback draft to Postgres)
        const res = await fetch(`/api/v1/cms/posts?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            slug: finalSlug,
            content: sanitizedContent,
            readTime: autoReadTime,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updated = editingPost
            ? posts.map((p) => (p.id === editingPost.id ? data.post : p))
            : [data.post, ...posts];
          savePostsToStorage(updated);
          showToast(editingPost ? 'Article saved to database.' : 'New clinical article published.');
        } else {
          showToast('Failed to publish article to database. Please retry.');
          return;
        }
      }

      setIsEditorOpen(false);
    } catch {
      showToast('Network error saving article. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('Are you sure you want to delete this clinical article?')) {
      const tenantId = getTenantId();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const res = await fetch(`/api/v1/cms/posts/${id}?tenantId=${tenantId}`, { method: 'DELETE' });
        if (!res.ok) {
          showToast('Delete failed. Please retry.');
          return;
        }
      }
      const updated = posts.filter((p) => p.id !== id);
      savePostsToStorage(updated);
      showToast('Article deleted.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories = ['all', 'General Medicine', 'Infectious Disease', 'Preventive Care', 'Cardiology', 'Pediatrics'];

  const filteredPosts = posts.filter((p) => {
    const effectiveSearch = (shellSearch || search).trim().toLowerCase();
    const matchesSearch =
      !effectiveSearch ||
      p.title.toLowerCase().includes(effectiveSearch) ||
      p.excerpt.toLowerCase().includes(effectiveSearch) ||
      p.slug.toLowerCase().includes(effectiveSearch);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'var(--font-sans, system-ui)' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <FileTextIcon size={20} color="var(--color-brand-primary, #183C4A)" />
            <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--color-text-main, #121B1F)', margin: 0, letterSpacing: '-0.02em' }}>
              Clinical Health <span className="ms-serif-italic">Blog &amp; Education</span> Guides
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'var(--color-brand-surface, #E7F2F5)',
                color: 'var(--color-brand-primary, #183C4A)',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid var(--color-border-subtle, #DFE8EB)',
              }}
            >
              WYSIWYG &bull; MT-121
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted, #5A6B72)', margin: 0 }}>
            Author, sanitize, and publish evidence-backed patient guidance articles with clinical callout boxes and automatic XSS filtering.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="ms-pill-dark"
        >
          <span>Write New Article</span>
          <span className="ms-pill-circle">
            <PlusIcon size={14} color="#183C4A" />
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <input
            type="search"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              borderRadius: '9999px',
              border: '1px solid var(--color-border-subtle, #DFE8EB)',
              background: 'var(--color-bg-surface, #FFFFFF)',
              color: 'var(--color-text-main, #121B1F)',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '10px', color: 'var(--color-text-muted, #5A6B72)' }}>
            <SearchIcon size={16} />
          </span>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--color-brand-primary, #183C4A)' : 'var(--color-border-subtle, #DFE8EB)',
                background: selectedCategory === cat ? 'var(--color-brand-primary, #183C4A)' : 'var(--color-bg-surface, #FFFFFF)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--color-text-muted, #5A6B72)',
                fontSize: '12px',
                fontWeight: selectedCategory === cat ? 700 : 600,
                cursor: 'pointer',
              }}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Posts List */}
      {filteredPosts.length === 0 ? (
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <FileTextIcon size={32} color="#94A3B8" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', margin: '12px 0 6px 0' }}>
            No clinical articles found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
            No articles match the current filter. Write your first patient health education article.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="ms-pill-dark"
            style={{ padding: '9px 18px', fontSize: '13px' }}
          >
            Create Article
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Cover thumbnail */}
              {post.coverImageUrl ? (
                <div
                  style={{
                    width: '100px',
                    height: '75px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#F1F5F9',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '75px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    flexShrink: 0,
                  }}
                >
                  <ImageIcon size={24} />
                </div>
              )}

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748B',
                    margin: '0 0 8px 0',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {post.excerpt || extractPlainText(post.content).slice(0, 120)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted, #5A6B72)' }}>
                  <span>Slug: <code style={{ color: 'var(--color-brand-primary, #183C4A)', background: 'var(--color-brand-surface, #E7F2F5)', padding: '2px 6px', borderRadius: '6px' }}>/blog/{post.slug}</code></span>
                  {post.publishedAt && <span>&bull; Published: {post.publishedAt}</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <a
                  href={`/blog/${post.slug}`}
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
            background: 'rgba(15, 23, 42, 0.5)',
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
              maxWidth: '860px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              padding: '24px 28px',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3Icon size={18} color="var(--color-brand-primary, #183C4A)" />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main, #121B1F)', margin: 0 }}>
                  {editingPost ? 'Edit Clinical Article' : 'Compose Patient Health Article'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Article Headline */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Article Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Type-2 Diabetes in Urban Lifestyles: A Clinician's Guide"
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

              {/* URL Slug & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      URL Slug *
                    </label>
                    {slugCollision ? (
                      <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertCircleIcon size={12} color="#DC2626" />
                        Slug already taken
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#065F46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircleIcon size={12} color="#065F46" />
                        Slug available
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '8px 10px',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        fontSize: '12px',
                        color: '#64748B',
                      }}
                    >
                      /blog/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '0 6px 6px 0',
                        border: `1px solid ${slugCollision ? '#EF4444' : '#CBD5E1'}`,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Clinical Category
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
                  Summary / Excerpt (Used in search cards and SEO previews)
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Concise 1-2 sentence clinical summary for patients..."
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

              {/* Cover Image URL & Live Thumbnail */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Cover Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Tip: Use direct image link or choose from Media Library.
                  </span>
                </div>

                {/* Thumbnail Preview */}
                {formData.coverImageUrl ? (
                  <div
                    style={{
                      width: '90px',
                      height: '60px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                      background: '#F1F5F9',
                    }}
                  >
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {/* Rich-Text Formatting Toolbar & Tab Switcher */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      Article Body (Rich HTML with Clinical Callouts)
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ClockIcon size={12} />
                      {formData.readTime}
                    </span>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        background: activeTab === 'editor' ? '#FFFFFF' : 'transparent',
                        color: activeTab === 'editor' ? '#0F172A' : '#64748B',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: activeTab === 'editor' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Edit3Icon size={12} />
                      <span>Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        background: activeTab === 'preview' ? '#FFFFFF' : 'transparent',
                        color: activeTab === 'preview' ? '#0F172A' : '#64748B',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <EyeIcon size={12} />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                {activeTab === 'editor' ? (
                  <div>
                    {/* WYSIWYG / HTML Quick Action Toolbar */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderBottom: 'none',
                        borderRadius: '8px 8px 0 0',
                        padding: '6px 8px',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => insertFormatting('h2', 'Main Clinical Section')}
                        title="Add Section Heading (H2)"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('h3', 'Sub-heading')}
                        title="Add Sub-heading (H3)"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('bold', 'key clinical term')}
                        title="Bold Text"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('italic', 'emphasized note')}
                        title="Italic Text"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontStyle: 'italic',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('ul', 'Key symptom to observe')}
                        title="Bulleted List"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        &bull; List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('ol', 'Initial evaluation step')}
                        title="Numbered List"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        1. 2. Steps
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('quote', 'Clinical citation or advisory')}
                        title="Quote Block"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('pearl', 'Take medications 30 minutes before breakfast for optimal absorption.')}
                        title="Insert Medical Pearl Callout Box"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #A7F3D0',
                          background: '#ECFDF5',
                          color: '#065F46',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ShieldCheckIcon size={12} color="#065F46" />
                        <span>+ Clinical Pearl</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('emergency', 'Persistent high fever exceeding 103 F or sudden breathlessness requires emergency admission.')}
                        title="Insert Emergency Warning Box"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #FECACA',
                          background: '#FEF2F2',
                          color: '#991B1B',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertCircleIcon size={12} color="#991B1B" />
                        <span>+ Red Flag</span>
                      </button>
                    </div>

                    <textarea
                      ref={contentTextareaRef}
                      rows={10}
                      required
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Write your article in structured HTML with clinical callouts..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '0 0 8px 8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        lineHeight: 1.6,
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
                      <span>HTML tags sanitized per Rule R9: scripts, iframes, and onclick handlers are stripped.</span>
                      <span>Word count: {extractPlainText(formData.content).split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  </div>
                ) : (
                  /* Live Preview Tab */
                  <div
                    style={{
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '24px',
                      background: '#FFFFFF',
                      minHeight: '260px',
                      maxHeight: '380px',
                      overflowY: 'auto',
                    }}
                  >
                    <style>{`
                      .live-preview-box h2 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 16px 0 8px 0; }
                      .live-preview-box h3 { font-size: 16px; font-weight: 700; color: #0F172A; margin: 14px 0 6px 0; }
                      .live-preview-box p { font-size: 14px; color: #334155; line-height: 1.7; margin: 0 0 12px 0; }
                      .live-preview-box ul, .live-preview-box ol { margin: 0 0 14px 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6; }
                      .live-preview-box blockquote { border-left: 4px solid var(--color-brand-primary, #183C4A); background: var(--color-bg-base, #F5F8F9); margin: 12px 0; padding: 10px 16px; font-style: italic; color: var(--color-text-muted, #5A6B72); }
                      .live-preview-box .clinical-callout { background: var(--color-brand-surface, #E7F2F5); border-left: 4px solid var(--color-brand-primary, #183C4A); padding: 12px 16px; border-radius: 10px; margin: 14px 0; color: var(--color-brand-primary, #183C4A); font-size: 13px; line-height: 1.6; }
                      .live-preview-box .clinical-callout.emergency-alert { background: #FEF2F2; border-left-color: #DC2626; color: #991B1B; }
                    `}</style>
                    <div
                      className="live-preview-box"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) }}
                    />
                  </div>
                )}
              </div>

              {/* Status checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand-primary, #183C4A)' }}
                />
                <label htmlFor="isPublished" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  Publish immediately (Visible on live patient health blog)
                </label>
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
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
                  disabled={isSaving || slugCollision}
                  className={slugCollision ? undefined : 'ms-pill-dark'}
                  style={
                    slugCollision
                      ? {
                          padding: '9px 22px',
                          borderRadius: '9999px',
                          border: 'none',
                          background: '#94A3B8',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }
                      : { padding: '9px 22px', fontSize: '13px' }
                  }
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : editingPost ? (
                    <span>Save Changes</span>
                  ) : (
                    <span>Publish Article</span>
                  )}
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
            background: 'var(--color-brand-primary, #183C4A)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(18, 46, 57, 0.2)',
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
