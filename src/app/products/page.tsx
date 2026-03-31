import { getProducts } from '@/lib/actions/products';
import ProductsClient from './ProductsClient';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { Suspense } from 'react';
import { Metadata } from 'next';

/**
 * @fileOverview Products Archive.
 * Leverages ISR and Server Components for superior performance metrics.
 */

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Handcrafted Ceramic Collection | Kalamic',
    description: 'Shop our curated collection of handcrafted ceramic wall art, spiritual decor, and photo frames. Made by master artisans in Kanpur, India.',
    openGraph: {
      title: 'Kalamic Ceramic Collection',
      description: 'Artisanal masterpieces for modern homes.',
      type: 'website',
    }
  };
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsClient initialProducts={products} />
    </Suspense>
  );
}
