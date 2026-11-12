import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/services',
          '/doctors',
          '/specialties',
          '/facilities',
          '/health-packages',
          '/testimonials-faq',
          '/blog',
          '/contact',
        ],
        disallow: ['/cms', '/cms/*', '/api/v1/cms/*'],
      },
    ],
    sitemap: `${BASE_URL.replace(/\/+$/, '')}/sitemap.xml`,
  };
}

