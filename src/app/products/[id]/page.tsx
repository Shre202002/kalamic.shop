import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { getProductById, getProducts } from '@/lib/actions/products';
import { getProductReviews, checkUserReviewEligibility } from '@/lib/actions/reviews';
import ProductDetailClient from './ProductDetailClient';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/firebase-admin';

/**
 * @fileOverview Product Detail Server Component (Next.js 15).
 * Orchestrates data fetching for the sticky-gallery detail page.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Product Not Found | Kalamic' };

  return {
    title: product.seo?.meta_title || `${product.name} | Kalamic`,
    description: product.seo?.meta_description || product.short_description,
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: [{ url: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url || '' }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  await dbConnect();

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // Fetch reviews and related products in parallel
  const [reviews, relatedProducts] = await Promise.all([
    getProductReviews(product._id.toString()),
    getProducts({ limit: 4 }) 
  ]);

  // Filter out the current product from related items
  const filteredRelated = relatedProducts.filter(
    (p: any) => p._id.toString() !== product._id.toString()
  );

  // Check review eligibility if user is logged in
  let isEligible = false;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (sessionCookie) {
      const decodedToken = await verifySession(sessionCookie);
      if (decodedToken) {
        isEligible = await checkUserReviewEligibility(decodedToken.uid, product._id.toString());
      }
    }
  } catch (error) {
    console.error("[PRODUCT_PAGE] Eligibility check failed:", error);
  }

  return (
    <ProductDetailClient
      initialProduct={JSON.parse(JSON.stringify(product))}
      initialReviews={JSON.parse(JSON.stringify(reviews))}
      relatedProducts={JSON.parse(JSON.stringify(filteredRelated))}
      isEligible={isEligible}
    />
  );
}
