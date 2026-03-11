import { getProducts } from '@/lib/actions/products';

/**
 * @fileOverview Generates a dynamic XML sitemap for search engines.
 * Optimized for strict XML compliance with zero leading whitespace.
 */

export async function GET() {
  const baseUrl = 'https://kalamic.shop';
  
  let products = [];
  try {
    products = await getProducts();
  } catch (error) {
    console.error('[SITEMAP_ERROR] Failed to fetch products:', error);
  }

  const staticPages = [
    '',
    '/products',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/returns',
    '/sitemap'
  ];

  // Map static pages to XML tags
  const staticXml = staticPages
    .map((url) => `<url><loc>${baseUrl}${url}</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
    .join('');

  // Map products to XML tags
  const productXml = products
    .map((p: any) => `<url><loc>${baseUrl}/products/${p.slug || p._id}</loc><lastmod>${new Date(p.updatedAt || new Date()).toISOString()}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`)
    .join('');

  // Construct final XML string - MUST start with <?xml at index 0
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticXml}${productXml}</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
    },
  });
}
