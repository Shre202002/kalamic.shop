
'use server';

import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

/**
 * Fetches all active products from the database.
 */
export async function getProducts() {
  await dbConnect();
  try {
    const products = await Product.find({ is_active: true }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

/**
 * Fetches featured products (currently first 4 active products).
 */
export async function getFeaturedProducts() {
  await dbConnect();
  try {
    const products = await Product.find({ is_active: true }).limit(4).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * Fetches a single product by its MongoDB ID.
 */
export async function getProductById(id: string) {
  if (!id || id.length !== 24) return null; // Basic MongoID check
  await dbConnect();
  try {
    const product = await Product.findById(id).lean();
    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

/**
 * Fetches a single product by its slug.
 */
export async function getProductBySlug(slug: string) {
  await dbConnect();
  try {
    const product = await Product.findOne({ slug }).lean();
    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}
