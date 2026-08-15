import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/api/feed/'],
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/account/',
          '/profile/',
          '/cart/',
          '/checkout/',
          '/orders/',
          '/wishlist/',
        ],
      },
    ],
    host: 'https://www.kalamic.shop',
    sitemap: 'https://www.kalamic.shop/sitemap.xml',
  };
}
