import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/BlogPost';
import KalamicProduct from '@/lib/models/KalamicProduct';

const SITE_URL = 'https://www.kalamic.shop';

// Keep the sitemap current with the product catalog instead of freezing dynamic
// product and article URLs at build time.
export const dynamic = 'force-dynamic';

const staticEntries: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
  { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/ceramic-gift-shop-kanpur`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/gallery`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/returns`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await dbConnect();

    const [products, posts] = await Promise.all([
      KalamicProduct.find({ is_active: true, is_deleted: { $ne: true } })
        .select('slug updatedAt')
        .lean(),
      BlogPost.find({ status: 'published' })
        .select('slug updatedAt publishedAt')
        .lean(),
    ]);

    const productEntries: MetadataRoute.Sitemap = products
      .filter((product: any) => product.slug)
      .map((product: any) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

    const blogEntries: MetadataRoute.Sitemap = posts
      .filter((post: any) => post.slug)
      .map((post: any) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

    return [...staticEntries, ...productEntries, ...blogEntries];
  } catch (error) {
    console.error('[SITEMAP] Falling back to static URLs:', error);
    return staticEntries;
  }
}
