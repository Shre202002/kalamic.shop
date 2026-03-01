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
  Quote,
  Palette,
  Eye,
  Gem
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
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="mt-6 text-primary font-black uppercase tracking-[0.3em] text-[10px]">Curation in Progress</p>
      </div>
    );
  }

  const collections = [
    { name: "Spiritual Space", slug: "spiritual", icon: "🕉️", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800", desc: "Pillars and accents for your sacred corners." },
    { name: "Wall Masterpieces", slug: "wall", icon: "🖼️", image: "https://images.unsplash.com/photo-1594913785162-e6785b4cd352?q=80&w=800", desc: "Artisanal mirrors and mandala wheels." },
    { name: "Cultural Gifting", slug: "gift", icon: "🎁", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800", desc: "Handcrafted treasures for meaningful moments." },
    { name: "Small Accents", slug: "accent", icon: "🐚", image: "https://images.unsplash.com/photo-1590502160462-0941847e090b?q=80&w=800", desc: "Detailed ceramics for contemporary setups." },
  ];

  const trustPoints = [
    { icon: Truck, title: "FragileCare™ Shipping", desc: "Reinforced double-walled packaging designed for ceramics." },
    { icon: Hammer, title: "Artisan Precision", desc: "Hand-molded and kiln-fired at 1200°C for eternal durability." },
    { icon: ShieldCheck, title: "Secure Acquisition", desc: "SSL-encrypted transactions and verified collector support." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB] selection:bg-primary/10">
      <Navbar />
      
      <main className="flex-1">
        
        {/* 1. HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-10"
            >
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] shadow-sm">
                <Sparkles className="h-3 w-3 animate-pulse" /> The Collection 2024
              </div>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-semibold text-primary leading-[0.9] tracking-tighter">
                Preserving <span className="italic text-accent">Culture.</span> <br />
                Designing <br /> <span className="text-foreground">Modernity.</span>
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-xl leading-relaxed font-medium italic opacity-80">
                "We do not manufacture products. We curate stories in form, texture, and handcrafted detail."
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                <Button asChild size="lg" className="h-20 px-12 rounded-3xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group border-none">
                  <Link href="/products" className="flex items-center gap-4">
                    Explore Catalog <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-20 px-12 rounded-3xl border-primary/10 bg-white/20 backdrop-blur-md text-primary font-black text-base hover:bg-white hover:premium-shadow transition-all">
                  <Link href="/about">Artisan Story</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative aspect-[4/5] rounded-[4rem] overflow-hidden premium-shadow hidden lg:block border-[12px] border-white"
            >
              <Image 
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200" 
                alt="Artisan at work" 
                fill 
                className="object-cover transition-transform duration-[10s] hover:scale-110"
                priority
                sizes="50vw"
                data-ai-hint="pottery artisan"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-60" />
            </motion.div>
          </div>
          
          <div className="absolute inset-0 pattern-paisley opacity-10 pointer-events-none" />
        </section>

        {/* 2. CURATED COLLECTIONS */}
        <section className="py-32 md:py-48 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-primary/20" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">The Discovery Path</h2>
                </div>
                <h3 className="text-4xl md:text-7xl font-display font-semibold text-primary tracking-tighter">Browse Collections</h3>
              </div>
              <Button asChild variant="link" className="text-primary font-black uppercase tracking-[0.2em] text-xs h-auto p-0 group outline-none">
                <Link href="/products" className="flex items-center gap-2">
                  View Full Catalog <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {collections.map((cat, idx) => (
                <motion.div 
                  key={cat.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                >
                  <Link href={`/products?category=${cat.slug}`} className="group block space-y-8">
                    <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden premium-shadow bg-[#F6F1E9]">
                      <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-110" sizes="25vw" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-700" />
                      <div className="absolute top-10 left-10 text-white">
                        <span className="text-4xl drop-shadow-2xl">{cat.icon}</span>
                      </div>
                      <div className="absolute bottom-10 left-10 right-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Explore Piece &rarr;</p>
                      </div>
                    </div>
                    <div className="px-4">
                      <h4 className="text-2xl font-display font-semibold tracking-tight text-primary mb-2 group-hover:text-accent transition-colors">{cat.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium opacity-60">{cat.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[40%] h-full pattern-paisley opacity-[0.03] rotate-180 pointer-events-none" />
        </section>

        {/* 3. FEATURED MASTERPIECES */}
        <section className="py-32 md:py-48 bg-[#FAF4EB]">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-8 mb-24 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-accent/5 border border-accent/10 text-accent font-black text-[10px] uppercase tracking-[0.3em] mx-auto">
                <Gem className="h-3 w-3" /> The Kalamic Edit
              </div>
              <h2 className="text-5xl md:text-8xl font-display font-semibold text-primary tracking-tighter leading-[0.95]">Artisan <br /><span className="italic">Masterpieces.</span></h2>
              <p className="text-base md:text-xl text-muted-foreground font-medium opacity-70 leading-relaxed italic">"Every curve, motif, and pattern is designed to evoke warmth and timeless elegance."</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
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

            <div className="flex justify-center mt-32">
              <Button asChild size="lg" variant="outline" className="h-20 px-16 rounded-3xl border-primary/10 text-primary font-black text-sm uppercase tracking-[0.2em] hover:bg-primary hover:text-white hover:premium-shadow transition-all">
                <Link href="/products">Shop Full Collection</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 4. BRAND PHILOSOPHY / QUOTE */}
        <section className="py-48 md:py-64 bg-primary text-white overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="max-w-5xl mx-auto text-center space-y-16"
            >
              <Quote className="h-20 w-20 mx-auto text-accent opacity-20" />
              <h2 className="text-4xl md:text-7xl font-display font-semibold italic leading-[1.1] tracking-tight">
                "When you bring a Kalamic piece into your home, you’re not adding an object — you’re <span className="text-accent">anchoring a story.</span>"
              </h2>
              <div className="space-y-10">
                <p className="text-white/60 font-medium text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">
                  We reimagined traditional Indian craftsmanship to fit seamlessly into modern spaces, without losing its ancient soul.
                </p>
                <div className="flex justify-center">
                  <Link href="/about" className="group inline-flex flex-col items-center gap-4 text-accent outline-none">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] group-hover:tracking-[0.6em] transition-all">Our Beginning</span>
                    <div className="h-px w-16 bg-accent group-hover:w-24 transition-all" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
        </section>

        {/* 5. TRUST & QUALITY SECTION */}
        <section className="py-32 md:py-48 bg-white border-b border-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20 lg:gap-32">
              {trustPoints.map((point, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2, duration: 0.8 }}
                  className="space-y-8 text-center md:text-left group"
                >
                  <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary mx-auto md:mx-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 premium-shadow">
                    <point.icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{point.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-70 italic">"{point.desc}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="py-48 md:py-64 bg-[#FAF4EB] relative overflow-hidden">
          <div className="container mx-auto px-4 text-center space-y-16 relative z-10">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-9xl font-display font-semibold text-primary tracking-tighter leading-[0.85]">
                Bring Meaning <br /> <span className="italic">Home.</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">Heritage Redefined for Modern Spaces</p>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg" className="h-24 px-20 rounded-[3rem] bg-primary text-white font-black text-xl shadow-[0_30px_60px_-15px_rgba(201,122,64,0.4)] hover:scale-105 active:scale-95 transition-all duration-500">
                <Link href="/products">Shop the Full Collection</Link>
              </Button>
            </div>
          </div>
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-125" />
        </section>

      </main>
      
      <Footer />
    </div>
  );
}