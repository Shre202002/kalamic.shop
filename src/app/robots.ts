import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/api/feed/'],
        disallow: ['/api/', '/admin/', '/profile/', '/cart/', '/checkout/'],
      },
    ],
    host: 'https://www.kalamic.shop',
    sitemap: 'https://www.kalamic.shop/sitemap.xml',
  };
}
