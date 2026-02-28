"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Loader2, 
  ArrowRight, 
  Star, 
  TrendingUp,
  PackageCheck,
  Eye
} from 'lucide-react';
import Image from 'next/image';
import { getFeaturedProducts, getTrendingProducts } from '@/lib/actions/products';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export default function Home() {
  const { user } = useUser();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [featured, trending] = await Promise.all([
          getFeaturedProducts(),
          getTrendingProducts()
        ]);
        setFeaturedProducts(featured);
        setTrendingProducts(trending);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    const handleScroll = () => {
      setShowStickyCta(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden py-20 lg:py-0 bg-[#F6F1E9]">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F6F1E9] via-[#F6F1E9]/80 to-transparent z-10" />
            <Image 
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=2000"
              alt="Handcrafted Kalamic Hero"
              fill
              className="object-cover object-right animate-in fade-in duration-1000"
              priority
              data-ai-hint="pottery workshop"
            />
          </div>
          
          <div className="container mx-auto px-4 relative z-20">
            <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-8 duration-700 ease-out">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-body font-black uppercase tracking-[0.2em] text-primary">New Artisan Drops Live</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-[32px] md:text-[56px] font-display font-semibold text-foreground tracking-tight leading-[1.15]">
                  Elevate Your <br className="hidden md:block" /> 
                  Home with <br className="hidden md:block" />
                  <span className="text-primary italic">Ceramic Art</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl font-body">
                  Crafted with devotion, designed for elegance. Discover India's finest handcrafted ceramic collection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-primary hover:bg-[#A95C2B] text-white text-lg h-16 px-10 rounded-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all font-body font-semibold tracking-[0.3px]"
                >
                  <Link href="/products">
                    Shop Collection <ShoppingBag className="ml-3 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-primary text-primary hover:bg-primary/5 text-lg h-16 px-10 rounded-lg transition-all font-body font-semibold tracking-[0.3px]"
                >
                  <Link href="#featured">
                    Explore Best Sellers
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-8">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden shadow-sm">
                      <Image src={`https://picsum.photos/seed/${i+100}/40/40`} alt="Collector" width={40} height={40} />
                    </div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-primary">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  <p className="text-[10px] font-body font-bold uppercase tracking-widest text-muted-foreground">Trusted by 2,000+ Collectors</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="featured" className="py-20 bg-[#E8DFC9]/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-body font-bold text-[10px] uppercase tracking-[0.25em]">
                  <TrendingUp className="h-4 w-4" /> The Artisan Collection
                </div>
                <h2 className="text-[24px] md:text-[32px] font-display font-semibold text-[#2E2E2E] leading-tight">Best Selling Pieces</h2>
              </div>
              <Button asChild variant="link" className="text-primary font-body font-bold uppercase tracking-widest text-xs p-0 group">
                <Link href="/products" className="flex items-center gap-2">
                  View Full Catalog <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.slice(0, 4).map((product) => (
                  <div key={product._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ProductCard 
                      id={product._id} 
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.compare_at_price}
                      image={product.images?.[0] || 'https://placehold.co/600x600?text=No+Image'}
                      rating={product.analytics?.average_rating || 4.8}
                      tag={product.analytics?.total_orders > 10 ? "Best Seller" : "Artisan"}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
