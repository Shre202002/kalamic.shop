
'use server';

import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

/**
 * Fetches all non-deleted, active products.
 */
export async function getProducts() {
  await dbConnect();
  try {
    const products = await Product.find({ 
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
 * Fetches featured products for the storefront.
 */
export async function getFeaturedProducts() {
  await dbConnect();
  try {
    const products = await Product.find({ 
      is_active: true, 
      is_featured: true,
      is_deleted: { $ne: true } 
    }).limit(8).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * Fetches a single product by MongoDB ID or slug.
 */
export async function getProductById(id: string) {
  if (!id) return null;
  await dbConnect();
  try {
    // Attempt ID find first (24 char check)
    let product = null;
    if (id.length === 24) {
      product = await Product.findOne({ _id: id, is_deleted: { $ne: true } }).lean();
    }
    
    if (!product) {
      product = await Product.findOne({ slug: id, is_deleted: { $ne: true } }).lean();
    }

    return product ? JSON.parse(JSON.stringify(product)) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductBySlug(slug: string) {
  return getProductById(slug);
}

/**
 * Atomic increment for product analytics.
 */
export async function trackProductAction(productId: string, field: 'wishlist_count' | 'share_count' | 'total_views' | 'cart_add_count') {
  await dbConnect();
  try {
    const updateField = `analytics.${field}`;
    await Product.findByIdAndUpdate(productId, {
      $inc: { [updateField]: 1 }
    });
  } catch (error) {
    console.error(`[ANALYTICS] Failed to track ${field} for product ${productId}:`, error);
  }
}

/**
 * Decrement wishlist count.
 */
export async function untrackWishlistAction(productId: string) {
  await dbConnect();
  try {
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.wishlist_count': -1 }
    });
  } catch (error) {
    console.error(`[ANALYTICS] Failed to untrack wishlist for product ${productId}:`, error);
  }
}
