
import { getProducts, getCategoryCounts } from '@/lib/actions/products';
import { getFeaturedBlogs } from '@/lib/actions/blog-actions';
import HomeClient from './HomeClient';

/**
 * @fileOverview Homepage entry point.
 * Optimised as a Server Component to pre-fetch featured pieces and journal stories.
 */

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export default async function HomePage() {
  // Fetch featured products, category counts and blog stories in parallel with safe fallbacks
  try {
    const [products, categoryCounts, featuredBlogs] = await Promise.all([
      getProducts({ limit: 8, featured: true }).then(res => Array.isArray(res) ? res : []),
      getCategoryCounts().then(res => res || {}),
      getFeaturedBlogs(3).then(res => Array.isArray(res) ? res : [])
    ]);
    
    return (
      <HomeClient 
        initialProducts={products} 
        categoryCounts={categoryCounts} 
        featuredBlogs={featuredBlogs}
      />
    );
  } catch (error) {
    console.error("[HOME_PAGE] Data pre-fetch failed:", error);
    // Return with empty states to allow the client to handle the error or show empty UI
    return (
      <HomeClient 
        initialProducts={[]} 
        categoryCounts={{}} 
        featuredBlogs={[]}
      />
    );
  }
}
