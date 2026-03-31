
import { getProducts, getCategoryCounts } from '@/lib/actions/products';
import { getFeaturedBlogs } from '@/lib/actions/blog-actions';
import HomeClient from './HomeClient';

/**
 * @fileOverview Homepage entry point.
 * Optimised as a Server Component to pre-fetch featured pieces and journal stories.
 */

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export default async function HomePage() {
  // Fetch featured products, category counts and blog stories in parallel
  const [products, categoryCounts, featuredBlogs] = await Promise.all([
    getProducts({ limit: 8, featured: true }),
    getCategoryCounts(),
    getFeaturedBlogs(3)
  ]);
  
  return (
    <HomeClient 
      initialProducts={products.slice(0, 8)} 
      categoryCounts={categoryCounts} 
      featuredBlogs={featuredBlogs}
    />
  );
}
