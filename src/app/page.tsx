
"use client"

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/lib/actions/products';
import { 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Hammer,
  ChevronRight,
  Quote
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        // Just take the first 4 for the featured section
        setFeaturedProducts(data.slice(0, 4));
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF4EB]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-primary font-bold uppercase tracking-widest text-[10px]">Curation in Progress...</p>
      </div>
    );
  }

  const collections = [
    { name: "Spiritual Space", slug: "spiritual", icon: "🕉️", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800" },
    { name: "Wall Decor", slug: "wall", icon: "🖼️", image: "https://images.unsplash.com/photo-1594913785162-e6785b4cd352?q=80&w=800" },
    { name: "Gifting Pieces", slug: "gift", icon: "🎁", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800" },
    { name: "Small Accents", slug: "accent", icon: "🐚", image: "https://images.unsplash.com/photo-1590502160462-0941847e090b?q=80&w=800" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      
      <main className="flex-1">
        
        {/* 1. HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3" /> Artisan Ceramics
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-semibold text-primary leading-[0.95] tracking-tighter">
                Preserving <span className="italic text-accent">Culture.</span> <br />
                Designing for <br /> Modern Homes.
              </h1>
              <p className="text-base md:text-xl text-muted-foreground max-w-lg leading-relaxed font-medium">
                Handcrafted décor inspired by Indian heritage, refined for contemporary living. Every piece carries the warmth of skilled hands.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all group">
                  <Link href="/products">
                    Explore Collection <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-primary/20 text-primary font-black text-base hover:bg-primary/5 transition-all">
                  <Link href="/about">Artisan Story</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl hidden lg:block"
            >
              <Image 
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200" 
                alt="Artisan at work" 
                fill 
                className="object-cover"
                priority
                sizes="50vw"
                data-ai-hint="pottery artisan"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </motion.div>
          </div>
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
        </section>

        {/* 2. CURATED COLLECTIONS */}
        <section className="py-24 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Discovery Path</h2>
                <h3 className="text-3xl md:text-5xl font-display font-semibold text-primary tracking-tight">Browse Collections</h3>
              </div>
              <Button asChild variant="link" className="text-primary font-black uppercase tracking-widest text-xs h-auto p-0 group">
                <Link href="/products" className="flex items-center">
                  View Full Catalog <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((cat, idx) => (
                <motion.div 
                  key={cat.slug}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/products?category=${cat.slug}`} className="group block relative aspect-square rounded-[2.5rem] overflow-hidden shadow-lg">
                    <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-8 left-8 right-8 text-white space-y-1">
                      <span className="text-2xl">{cat.icon}</span>
                      <h4 className="text-xl font-bold tracking-tight">{cat.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Explore &rarr;</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. FEATURED MASTERPIECES */}
        <section className="py-24 md:py-32 bg-[#FAF4EB]">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mx-auto">
                <Sparkles className="h-3 w-3" /> The Kalamic Edit
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-semibold text-primary tracking-tight">Artisan Masterpieces</h2>
              <p className="text-muted-foreground max-w-xl mx-auto font-medium">Curated selections of our most coveted handcrafted ceramic treasures.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  id={product._id} 
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.compare_at_price}
                  image={product.images?.[0] || 'https://placehold.co/600x600?text=Kalamic'}
                  rating={product.analytics?.average_rating || 4.8}
                  tag={product.tags?.[0]}
                />
              ))}
            </div>

            <div className="flex justify-center mt-20">
              <Button asChild size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-primary text-primary font-black hover:bg-primary hover:text-white transition-all">
                <Link href="/products">Browse All Pieces</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 4. BRAND PHILOSOPHY / ABOUT PREVIEW */}
        <section className="py-24 md:py-40 bg-primary text-white overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <Quote className="h-16 w-16 mx-auto text-accent opacity-40" />
              <h2 className="text-3xl md:text-6xl font-display font-semibold italic leading-tight tracking-tight">
                "When you bring a Kalamic piece into your home, you’re not adding an object — you’re anchoring a story."
              </h2>
              <div className="space-y-4">
                <p className="text-white/70 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                  We reimagine traditional Indian craftsmanship and present it in a way that fits seamlessly into modern spaces — without losing its soul.
                </p>
                <Button asChild variant="link" className="text-accent font-black uppercase tracking-[0.2em] text-xs h-auto p-0">
                  <Link href="/about">Read Our Beginning &rarr;</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
        </section>

        {/* 5. TRUST & QUALITY SECTION */}
        <section className="py-24 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
              <div className="space-y-6 text-center md:text-left">
                <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary mx-auto md:mx-0">
                  <Truck className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-black text-primary tracking-tight">FragileCare™ Shipping</h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">Expert packaging designed for handcrafted ceramics, ensuring a safe journey to your door.</p>
              </div>
              <div className="space-y-6 text-center md:text-left">
                <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary mx-auto md:mx-0">
                  <Hammer className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-black text-primary tracking-tight">Master Craftsmanship</h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">Every piece is hand-molded and kiln-fired using traditional methods and premium finishes.</p>
              </div>
              <div className="space-y-6 text-center md:text-left">
                <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary mx-auto md:mx-0">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-black text-primary tracking-tight">Secure Acquisition</h4>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">Verified payments, transparent pricing, and SSL-encrypted transactions for your peace of mind.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="py-20 md:py-40 bg-[#FAF4EB] relative overflow-hidden">
          <div className="container mx-auto px-4 text-center space-y-10 relative z-10">
            <h2 className="text-4xl md:text-7xl font-display font-semibold text-primary tracking-tighter">
              Bring Meaning Back <br /> Into Your Space.
            </h2>
            <Button asChild size="lg" className="h-20 px-16 rounded-[2rem] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Link href="/products">Shop the Full Collection</Link>
            </Button>
          </div>
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
