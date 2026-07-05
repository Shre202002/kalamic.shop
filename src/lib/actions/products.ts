'use server';

import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import Category from '@/lib/models/Category'; // Import Category for population
import { unstable_cache } from 'next/cache';

/**
 * @fileOverview Products Data Layer with caching.
 * Leverages Next.js unstable_cache for high-performance data retrieval.
 */

const categoryMap: Record<string, string[]> = {
  'wall-art': ['Wall Art', 'wall art', 'Wall Decor', 'Mandala', 'Mirror'],
  'spiritual': ['Spiritual', 'spiritual', 'Temple', 'Pooja', 'Religious', 'Ganesha'],
  'photo-frames': ['Photo Frame', 'photo frame', 'Frame', 'Picture Frame'],
  'gifting': ['Gift', 'Gifting', 'gift set', 'Gift Set', 'Festival'],
  'home-decor': ['Home Decor', 'home decor', 'Decorative', 'Pillar', 'Stambh'],
};

/**
 * Fetches all non-deleted, active Kalamic products with optional filtering.
 */
export async function getProducts(options?: {
  limit?: number;
  featured?: boolean;
  category?: string | null;
}) {
  return unstable_cache(
    async () => {
      await dbConnect();
      try {
        const query: any = { 
          is_active: true, 
          is_deleted: { $ne: true } 
        };
        
        if (options?.featured) {
          query.is_featured = true;
        }

        if (options?.category && categoryMap[options.category]) {
          const keywords = categoryMap[options.category];
          query.$or = [
            { tags: { $in: keywords } },
            { name: { $regex: keywords.join('|'), $options: 'i' } },
            { 'specifications.value': { $regex: keywords.join('|'), $options: 'i' } }
          ];
        }

        const products = await KalamicProduct.find(query)
          .sort({ visibility_priority: -1, createdAt: -1 })
          .limit(options?.limit || 100)
          .lean();
          
        return JSON.parse(JSON.stringify(products));
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    ['products-list', JSON.stringify(options)],
    { revalidate: 60, tags: ['products'] }
  )();
}

/**
 * Fetches product counts for the homepage category cards.
 */
export async function getCategoryCounts() {
  return unstable_cache(
    async () => {
      await dbConnect();
      const counts: Record<string, number> = {};
      
      for (const [slug, keywords] of Object.entries(categoryMap)) {
        const count = await KalamicProduct.countDocuments({
          is_active: true,
          is_deleted: { $ne: true },
          $or: [
            { tags: { $in: keywords } },
            { name: { $regex: keywords.join('|'), $options: 'i' } }
          ]
        });
        counts[slug] = count;
      }
      
      return counts;
    },
    ['category-counts'],
    { revalidate: 300, tags: ['products'] }
  )();
}

/**
 * Fetches a single Kalamic product by MongoDB ID or slug.
 */
export async function getProductById(id: string) {
  if (!id) return null;
  return unstable_cache(
    async () => {
      await dbConnect();
      try {
        let product = null;
        
        // Use Type-safe population to ensure UI fields are available
        if (id.length === 24) {
          product = await KalamicProduct.findOne({ _id: id, is_deleted: { $ne: true } })
            .populate('category_id')
            .lean();
        }
        
        if (!product) {
          product = await KalamicProduct.findOne({ slug: id.toLowerCase(), is_deleted: { $ne: true } })
            .populate('category_id')
            .lean();
        }

        return product ? JSON.parse(JSON.stringify(product)) : null;
      } catch (error) {
        console.error("Error fetching product:", error);
        return null;
      }
    },
    [`product-detail-${id}`],
    { revalidate: 60, tags: ['products'] }
  )();
}

/**
 * Server-side View Tracking.
 */
export async function incrementProductViews(productId: string) {
  await dbConnect();
  try {
    await KalamicProduct.findByIdAndUpdate(productId, {
      $inc: { 'analytics.total_views': 1 }
    });
  } catch (error) {
    console.error("[ANALYTICS] Failed to increment views:", error);
  }
}

/**
 * Atomic increments for other product actions.
 */
export async function trackProductAction(productId: string, field: 'wishlist_count' | 'share_count' | 'cart_add_count' | 'total_orders') {
  await dbConnect();
  try {
    const updateField = `analytics.${field}`;
    await KalamicProduct.findByIdAndUpdate(productId, {
      $inc: { [updateField]: 1 }
    });
  } catch (error) {
    console.error(`[ANALYTICS] Failed to track ${field}:`, error);
  }
}

export async function untrackWishlistAction(productId: string) {
  await dbConnect();
  try {
    await KalamicProduct.findByIdAndUpdate(productId, {
      $inc: { 'analytics.wishlist_count': -1 }
    });
  } catch (error) {
    console.error(`[ANALYTICS] Failed to untrack wishlist:`, error);
  }
}
