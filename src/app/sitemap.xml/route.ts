import { getProducts } from '@/lib/actions/products';

/**
 * @fileOverview Generates a dynamic XML sitemap for search engines.
 * Includes static routes and dynamic product links.
 */

export async function GET() {
  const baseUrl = 'https://kalamic.shop';
  const products = await getProducts();

  const staticPages = [
    '',
    '/products',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/returns',
    '/survey',
    '/sitemap'
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages
        .map((url) => {
          return `
            <url>
              <loc>${baseUrl}${url}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.8</priority>
            </url>
          `;
        })
        .join('')}
      ${products
        .map((p: any) => {
          return `
            <url>
              <loc>${baseUrl}/products/${p.slug || p._id}</loc>
              <lastmod>${new Date(p.updatedAt || new Date()).toISOString()}</lastmod>
              <changefreq>daily</changefreq>
              <priority>1.0</priority>
            </url>
          `;
        })
        .join('')}
    </urlset>
  `;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
