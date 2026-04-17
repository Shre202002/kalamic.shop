
import { getProducts } from '@/lib/actions/products';
import ProductsClient from './ProductsClient';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { Suspense } from 'react';
import { Metadata } from 'next';

/**
 * @fileOverview Products Archive Server Component.
 * Leverages ISR for superior performance and crawlability.
 */

// Re-generate page cache every hour
export const revalidate = 3600; 

const categoryMeta: Record<string, { title: string; description: string }> = {
  'wall-art': {
    title: 'Handcrafted Ceramic Wall Art | Kalamic',
    description: 'Shop handcrafted ceramic mandala wall art, decorative mirrors and wall decor by Kanpur artisans. Free delivery in Kanpur.'
  },
  'spiritual': {
    title: 'Spiritual Ceramic Decor | Kalamic',
    description: 'Handcrafted ceramic spiritual decor for pooja rooms and mandirs. Ganesha, peacock and traditional Indian motifs.'
  },
  'photo-frames': {
    title: 'Ceramic Photo Frames | Kalamic',
    description: 'Handmade ceramic photo frames with floral and ethnic designs. Perfect gifts for home decor and special occasions.'
  },
  'gifting': {
    title: 'Ceramic Gift Sets | Kalamic',
    description: 'Curated handcrafted ceramic gift sets for festivals, weddings and housewarming. Made by artisans in Kanpur.'
  },
  'home-decor': {
    title: 'Ceramic Home Decor | Kalamic',
    description: 'Handcrafted ceramic home decor pieces for living rooms, offices and spiritual spaces. Authentic Indian artistry.'
  },
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams;
  const meta = category ? categoryMeta[category] : null;
  
  const title = meta?.title || 'Handcrafted Ceramic Collection | Kalamic';
  const description = meta?.description || 'Shop our curated collection of handcrafted ceramic wall art, spiritual decor, and photo frames. Made by master artisans in Kanpur, India.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: category 
        ? `https://kalamic.shop/products?category=${category}`
        : 'https://kalamic.shop/products'
    }
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  
  // Data fetch happens on the server to ensure crawlers see the full list
  const products = await getProducts({ category });

  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsClient initialProducts={products} activeCategory={category} />
    </Suspense>
  );
}
