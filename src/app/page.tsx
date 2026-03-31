import { getProducts } from '@/lib/actions/products';
import HomeClient from './HomeClient';

/**
 * @fileOverview Homepage entry point.
 * Optimised as a Server Component to pre-fetch featured pieces and eliminate the client-side waterfall.
 */

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export default async function HomePage() {
  // Fetch featured products on the server for instant rendering
  const products = await getProducts();
  
  return <HomeClient initialProducts={products.slice(0, 8)} />;
}
