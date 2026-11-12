import type { MetadataRoute } from 'next';
import { CLINICAL_BLOG_POSTS } from '@/lib/blogPosts';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/about', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/doctors', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/specialties', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/services', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/facilities', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/health-packages', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/testimonials-faq', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.95, changeFrequency: 'weekly' },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE_URL}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  for (const post of CLINICAL_BLOG_POSTS) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    });
  }

  return entries;
}

