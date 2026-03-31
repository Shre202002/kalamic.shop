
import { getProducts } from '@/lib/actions/products';
import { getAllBlogSlugs } from '@/lib/actions/blog-actions';

/**
 * @fileOverview Generates a dynamic XML sitemap for search engines.
 * Optimized for strict XML compliance with zero leading whitespace.
 * Includes all active artisan pieces and journal stories.
 */

export async function GET() {
  const baseUrl = 'https://kalamic.shop';
  
  let products = [];
  let blogs = [];
  
  try {
    const [pData, bData] = await Promise.all([
      getProducts(),
      getAllBlogSlugs()
    ]);
    products = pData;
    blogs = bData;
  } catch (error) {
    console.error('[SITEMAP_ERROR] Failed to fetch dynamic data:', error);
  }

  const staticPages = [
    '',
    '/products',
    '/gallery',
    '/blog',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/returns',
    '/sitemap'
  ];

  const now = new Date().toISOString();

  // Map static pages
  const staticXml = staticPages
    .map((url) => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === '' ? '1.0' : '0.8'}</priority>
  </url>`)
    .join('');

  // Map products
  const productXml = products
    .map((p: any) => `
  <url>
    <loc>${baseUrl}/products/${p.slug || p._id}</loc>
    <lastmod>${new Date(p.updatedAt || now).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`)
    .join('');

  // Map blogs
  const blogXml = blogs
    .map((b: any) => `
  <url>
    <loc>${baseUrl}/blog/${b.slug}</loc>
    <lastmod>${new Date(b.updatedAt || now).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('');

  // Construct final XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticXml}
  ${productXml}
  ${blogXml}
</urlset>`;

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
    },
  });
}
