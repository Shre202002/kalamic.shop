import { MetadataRoute } from 'next';

/**
 * @fileOverview Standard robots.txt configuration for Kalamic.
 * Ensures crawlers find the correct XML sitemap and avoid restricted areas.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/profile/',
        '/cart/',
        '/checkout/'
      ],
    },
    sitemap: 'https://kalamic.shop/sitemap.xml',
  };
}
