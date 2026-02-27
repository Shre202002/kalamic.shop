
'use server';

import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';

/**
 * Fetches all non-deleted, active Kalamic products.
 */
export async function getProducts() {
  await dbConnect();
  try {
    const products = await KalamicProduct.find({ 
      is_active: true, 
      is_deleted: { $ne: true } 
    }).sort({ visibility_priority: -1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

/**
 * Fetches featured Kalamic products for the storefront.
 */
export async function getFeaturedProducts() {
  await dbConnect();
  try {
    const products = await KalamicProduct.find({ 
      is_active: true, 
      is_featured: true,
      is_deleted: { $ne: true } 
    }).sort({ visibility_priority: -1 }).limit(8).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * Fetches a single Kalamic product by MongoDB ID or slug.
 */
export async function getProductById(id: string) {
  if (!id) return null;
  await dbConnect();
  try {
    let product = null;
    // Check if ID is likely a MongoDB ObjectId (24 chars)
    if (id.length === 24) {
      product = await KalamicProduct.findOne({ _id: id, is_deleted: { $ne: true } }).lean();
    }
    
    // Fallback or secondary check for Slug
    if (!product) {
      product = await KalamicProduct.findOne({ slug: id.toLowerCase(), is_deleted: { $ne: true } }).lean();
    }

    return product ? JSON.parse(JSON.stringify(product)) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

/**
 * Server-side View Tracking.
 * Increments total_views atomically.
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
