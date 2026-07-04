import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/actions/products';
import { getProductReviews, checkUserReviewEligibility } from '@/lib/actions/reviews';
import ProductDetailClient from './ProductDetailClient';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/firebase-admin';

/**
 * @fileOverview Product Detail Server Component (Next.js 15).
 * Optimized for high-impact SEO and sticky-layout presentation.
 */

export const revalidate = 3600; 

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const products = await getProducts();
    if (!products) return [];
    return products.map((product: any) => ({
      id: (product.slug || product._id).toString(),
    }));
  } catch (e) {
    console.error("[PRODUCT_SSR] Static Params error:", e);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  
  if (!product) return { title: 'Piece Not Found | Kalamic' };

  const imageUrl = Array.isArray(product.images) 
    ? (product.images.find((i: any) => i.is_primary)?.url || product.images[0]?.url)
    : '';

  return {
    title: `${product.name} | Kalamic Artisan Shop`,
    description: product.seo?.meta_description || product.short_description || product.description.substring(0, 160),
    keywords: product.seo?.meta_keywords?.join(', '),
    openGraph: {
      title: `${product.name} | Handcrafted Ceramic Artistry`,
      description: product.short_description || product.description.substring(0, 160),
      type: 'website',
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    alternates: {
      canonical: `https://kalamic.shop/products/${product.slug || product._id}`
    }
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  
  const [product, allProducts] = await Promise.all([
    getProductById(id),
    getProducts()
  ]);

  if (!product) notFound();

  // Review Eligibility Check
  const sessionCookie = (await cookies()).get('__session')?.value;
  let isEligible = false;
  if (sessionCookie) {
    const decoded = await verifySession(sessionCookie);
    if (decoded) {
      isEligible = await checkUserReviewEligibility(decoded.uid, product._id.toString());
    }
  }

  const reviews = await getProductReviews(product._id.toString());

  const relatedProducts = allProducts
    .filter((p: any) => p.category_id?.toString() === product.category_id?.toString() && p._id?.toString() !== product._id?.toString())
    .slice(0, 4);

  return (
    <ProductDetailClient 
      initialProduct={JSON.parse(JSON.stringify(product))} 
      initialReviews={JSON.parse(JSON.stringify(reviews))} 
      relatedProducts={JSON.parse(JSON.stringify(relatedProducts))}
      isEligible={isEligible}
    />
  );
}
