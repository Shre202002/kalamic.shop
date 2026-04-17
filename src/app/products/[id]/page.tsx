
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/actions/products';
import { getProductReviews } from '@/lib/actions/reviews';
import ProductDetailClient from './ProductDetailClient';

/**
 * @fileOverview Product Detail Server Component (Next.js 15).
 * Handles high-impact SEO: Server-side data fetching, Metadata, and JSON-LD.
 */

export const revalidate = 60; // ISR: Revalidate every minute

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Pre-renders all product pages at build time for maximum performance.
 */
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product: any) => ({
    id: product.slug || product._id,
  }));
}

/**
 * Generates dynamic SEO metadata for each artisan piece.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  
  if (!product) return { title: 'Piece Not Found | Kalamic' };

  const title = product.seo?.meta_title || `${product.name} | Handcrafted Ceramic | Kalamic`;
  const description = product.seo?.meta_description || product.short_description || product.description.substring(0, 160);

  return {
    title,
    description,
    keywords: product.seo?.meta_keywords?.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: product.images?.find((i: any) => i.is_primary)?.url || product.images?.[0]?.url }],
    },
    alternates: {
      canonical: `https://kalamic.shop/products/${product.slug || product._id}`
    }
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  
  // Parallel data fetching for performance
  const [product, allProducts] = await Promise.all([
    getProductById(id),
    getProducts()
  ]);

  if (!product) notFound();

  // Fetch reviews (no cache needed for reviews generally or handled in action)
  const reviews = await getProductReviews(product._id);

  // Filter related products
  const relatedProducts = allProducts
    .filter((p: any) => p.category_id === product.category_id && p._id !== product._id)
    .slice(0, 4);

  // Schema.org JSON-LD for Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map((img: any) => img.url),
    "description": product.short_description || product.description,
    "sku": product.sku || product._id,
    "brand": {
      "@type": "Brand",
      "name": "Kalamic"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://kalamic.shop/products/${product.slug || product._id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": product.analytics?.review_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.analytics.average_rating,
      "reviewCount": product.analytics.review_count
    } : undefined
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient 
        initialProduct={product} 
        initialReviews={reviews} 
        relatedProducts={relatedProducts} 
      />
    </>
  );
}
