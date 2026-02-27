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
        {/* Hero Section - Soft Cream Background */}
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
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">New Artisan Drops Live</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.95]">
                  Elevate Your <br /> 
                  Home With <br />
                  <span className="text-primary underline decoration-primary/10">Ceramic Art</span>.
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl font-medium">
                  Crafted with devotion, designed for elegance. Discover India's finest handcrafted ceramic collection.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-primary hover:bg-[#A95C2B] text-white text-lg h-16 px-10 rounded-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <Link href="/products">
                    Shop Collection <ShoppingBag className="ml-3 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-primary text-primary hover:bg-primary/5 text-lg h-16 px-10 rounded-lg transition-all"
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trusted by 2,000+ Collectors</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges - Muted Sage Support */}
        <section className="py-12 bg-white border-y border-[#E8DFC9]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Sparkles, title: "100% Handmade", sub: "Authentic Indian Craft" },
                { icon: ShieldCheck, title: "Secure Payment", sub: "SSL Certified Checkout" },
                { icon: Truck, title: "Pan India Delivery", sub: "Safe Kiln to Door" },
                { icon: PackageCheck, title: "Safe Packaging", sub: "FragileCare™ Guaranteed" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-lg bg-[#E5EFEA] flex items-center justify-center text-[#6F8A7A] group-hover:bg-[#6F8A7A] group-hover:text-white transition-all duration-500">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-[#2E2E2E] uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[10px] font-bold text-[#6B6B6B] uppercase opacity-60">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="featured" className="py-20 bg-[#E8DFC9]/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em]">
                  <TrendingUp className="h-4 w-4" /> The Artisan Collection
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-[#2E2E2E] tracking-tighter leading-none">Best Selling Pieces</h2>
              </div>
              <Button asChild variant="link" className="text-primary font-black uppercase tracking-widest text-xs p-0 group">
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

        {/* Dynamic Trending Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="bg-[#C97A40] rounded-[2rem] p-10 md:p-20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 -skew-x-12 translate-x-1/2" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-4">
                    <Badge className="bg-[#E8DFC9] text-[#2E2E2E] rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Community Favorites
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[0.95]">
                      Most Loved <br /> by Collectors
                    </h2>
                    <p className="text-white/80 text-base font-medium leading-relaxed">
                      Pieces that have found their space in homes across India. Curated by popularity.
                    </p>
                  </div>
                  
                  <div className="space-y-6 pt-4">
                    {trendingProducts.map((p, i) => (
                      <div key={p._id} className="flex items-center gap-4 text-white/90 group cursor-pointer" onClick={() => window.location.href = `/products/${p.slug}`}>
                        <span className="text-2xl font-black text-white/30 italic">0{i+1}</span>
                        <div className="flex-1 border-b border-white/10 pb-4 flex justify-between items-center group-hover:border-white transition-colors">
                          <span className="font-bold text-base">{p.name}</span>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Eye className="h-3 w-3" /> {p.analytics?.total_views}</div>
                            <ArrowRight className="h-5 w-5 text-[#E8DFC9]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="relative aspect-square md:aspect-video rounded-[1.5rem] overflow-hidden shadow-2xl border-8 border-white/5">
                    <Image 
                      src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1500" 
                      alt="Artisan Display" 
                      fill 
                      className="object-cover"
                      data-ai-hint="ceramic display"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2E2E2E]/60 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-white font-black text-xl tracking-tight">Kalamic Mor Stambh</p>
                        <p className="text-[#E8DFC9] font-bold text-[10px] uppercase tracking-widest">Our #1 Gift Selection</p>
                      </div>
                      <Button asChild size="icon" className="h-12 w-12 rounded-lg bg-[#E8DFC9] text-[#2E2E2E] shadow-xl">
                        <Link href="/products/mor_stambh"><ArrowRight /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-[#E8DFC9] rounded-[2rem] p-12 md:p-24 text-center space-y-8 relative overflow-hidden group shadow-xl">
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity" />
              <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                <h2 className="text-3xl md:text-6xl font-black text-foreground tracking-tighter leading-[0.9]">
                  Start Your <br /> Artisan Journey.
                </h2>
                <p className="text-primary text-base font-bold uppercase tracking-widest">Free Shipping on your first order</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 relative z-10">
                <Button asChild size="lg" className="bg-primary hover:bg-[#A95C2B] text-white h-14 px-12 rounded-lg shadow-2xl text-lg font-black hover:scale-105 transition-transform">
                  <Link href="/products">Shop All Masterpieces</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Mobile Shop Now Button */}
      <div className={cn(
        "md:hidden fixed bottom-6 left-6 right-6 z-50 transition-all duration-500 translate-y-20 opacity-0",
        showStickyCta && "translate-y-0 opacity-100"
      )}>
        <Button asChild size="lg" className="w-full h-14 rounded-lg bg-primary text-white shadow-2xl font-black text-base">
          <Link href="/products">Shop The Collection — ₹1,499+</Link>
        </Button>
      </div>

      <Footer />
    </div>
  );
}