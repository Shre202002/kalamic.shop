import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/BlogPost';
import KalamicProduct from '@/lib/models/KalamicProduct';

const SITE_URL = 'https://www.kalamic.shop';

// Refresh the index at most hourly while keeping it current as products and
// stories are published. If the database is temporarily unavailable, the
// public static routes are still returned instead of failing sitemap delivery.
export const revalidate = 3600;

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
  { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/gallery`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/guides`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/returns`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await dbConnect();
    const [posts, products] = await Promise.all([
      BlogPost.find({ status: 'published' }).select('slug updatedAt').lean(),
      KalamicProduct.find({ is_active: true, is_deleted: { $ne: true } })
        .select('slug updatedAt')
        .lean(),
    ]);

    const blogRoutes: MetadataRoute.Sitemap = posts
      .filter((post: any) => post.slug)
      .map((post: any) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const productRoutes: MetadataRoute.Sitemap = products
      .filter((product: any) => product.slug)
      .map((product: any) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: product.updatedAt || undefined,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));

    return [...staticRoutes, ...productRoutes, ...blogRoutes];
  } catch (error) {
    console.error('[SITEMAP] Dynamic entries unavailable:', error instanceof Error ? error.message : 'unknown error');
    return staticRoutes;
  }
}
