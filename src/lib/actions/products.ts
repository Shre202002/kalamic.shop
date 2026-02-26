'use server';

import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

export async function getProducts() {
  await dbConnect();
  const products = await Product.find({}).lean();
  return JSON.parse(JSON.stringify(products));
}

export async function getFeaturedProducts() {
  await dbConnect();
  const products = await Product.find({ isFeatured: true }).limit(4).lean();
  return JSON.parse(JSON.stringify(products));
}

export async function getProductById(id: string) {
  await dbConnect();
  const product = await Product.findById(id).lean();
  if (!product) return null;
  return JSON.parse(JSON.stringify(product));
}

export async function getProductBySlug(slug: string) {
  await dbConnect();
  const product = await Product.findOne({ slug }).lean();
  if (!product) return null;
  return JSON.parse(JSON.stringify(product));
}