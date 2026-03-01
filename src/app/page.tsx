
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
  Star,
  ArrowUpRight
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

  const categories = [
    { name: "Tableware", slug: "tableware", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800", desc: "Thoughtfully crafted for your home and table." },
    { name: "Decorative", slug: "decorative", image: "https://images.unsplash.com/photo-1594913785162-e6785b4cd352?q=80&w=800", desc: "Statement pieces that anchor a story." },
    { name: "Limited Editions", slug: "limited", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800", desc: "Rare finds from our latest kiln firing." },
  ];

  const testimonials = [
    { name: "Sarah J.", text: "The texture of the speckled mug is just divine. It has become my favorite morning ritual." },
    { name: "Michael R.", text: "Absolute masterpieces. I bought the dining set and every guest asks where it's from." },
    { name: "Elena W.", text: "Beautifully packaged and even more stunning in person. Truly unique artisanal quality." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE9] selection:bg-primary/10">
      <Navbar />
      
      <main className="flex-1">
        
        {/* 1. HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center pt-12 pb-24 overflow-hidden">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Since 1994</span>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-semibold text-[#271E1B] leading-[1.1] tracking-tight">
                  The Art of <br />
                  <span className="italic text-primary font-normal">Slow Living</span>
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed font-medium">
                Thoughtfully crafted pieces for your home and table, born from clay and fired by passion.
              </p>
              <Button asChild size="lg" className="h-14 px-10 rounded-full bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                <Link href="/products">Shop the Collection</Link>
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] bg-white"
            >
              <Image 
                src="https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=1200" 
                alt="Minimal ceramic jug" 
                fill 
                className="object-cover"
                priority
                sizes="50vw"
                data-ai-hint="ceramic jug"
              />
            </motion.div>
          </div>
        </section>

        {/* 2. FEATURED CATEGORIES */}
        <section className="py-24 bg-white/30">
          <div className="container mx-auto px-4">
            <div className="mb-16 space-y-2">
              <h2 className="text-3xl font-display font-semibold text-[#271E1B]">Featured Categories</h2>
              <p className="text-sm text-muted-foreground font-medium">Explore our curated selections</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((cat, idx) => (
                <motion.div 
                  key={cat.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                >
                  <Link href={`/products?category=${cat.slug}`} className="group block space-y-6">
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-sm bg-[#F6F1E9]">
                      <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-[2s] group-hover:scale-110" sizes="33vw" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-700" />
                      <div className="absolute bottom-10 left-10 text-white">
                        <h4 className="text-2xl font-display font-semibold mb-1">{cat.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                          Explore <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. HANDPICKED PIECES */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 space-y-3">
              <h2 className="text-4xl font-display font-semibold text-[#271E1B]">Handpicked Pieces</h2>
              <p className="text-sm text-muted-foreground font-medium">Curated favorites from our latest firing</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {featuredProducts.map((product) => (
                <div key={product._id} className="space-y-4 group cursor-pointer" onClick={() => window.location.href = `/products/${product.slug}`}>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F5EFE9] transition-all duration-500 group-hover:shadow-xl">
                    <Image 
                      src={product.images?.[0]?.url || 'https://placehold.co/600x600?text=Kalamic'} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      sizes="25vw"
                    />
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#271E1B] leading-tight">{product.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{product.tags?.[0] || 'Ceramics'}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">₹{product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. BRAND STORY / ARTISAN PROCESS */}
        <section className="py-24 bg-[#F5EFE9]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200" 
                  alt="Artisan hands" 
                  fill 
                  className="object-cover" 
                  sizes="50vw"
                  data-ai-hint="artisan pottery"
                />
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">The Maker's Touch</span>
                  <h2 className="text-4xl font-display font-semibold text-[#271E1B]">Handmade with Heart</h2>
                  <div className="prose prose-stone text-muted-foreground font-medium leading-relaxed space-y-6">
                    <p>At Kalamic, we believe every piece should tell a story. Our ceramics are crafted using traditional techniques passed down through generations.</p>
                    <p>From the initial centering on the wheel to the final glaze firing, each item is handled with care and intention. We prioritize sustainable materials and ethical production.</p>
                  </div>
                </div>
                <Link href="/about" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-1 hover:border-primary transition-all">
                  Learn more about our process <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. KIND WORDS (Social Proof) */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-semibold text-[#271E1B] text-center mb-20 tracking-tight">Kind Words</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, idx) => (
                <div key={idx} className="p-10 rounded-[2.5rem] bg-[#F5EFE9]/50 border border-primary/5 space-y-6 text-center">
                  <div className="flex justify-center gap-1 text-primary">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  <p className="text-sm font-medium text-[#271E1B]/80 leading-relaxed italic italic">"{t.text}"</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. NEWSLETTER CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="relative bg-primary rounded-[3rem] p-12 md:p-24 overflow-hidden text-center text-white space-y-8">
              <div className="relative z-10 space-y-4">
                <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">Join the Kalamic Circle</h2>
                <p className="text-sm md:text-base font-medium opacity-80 max-w-xl mx-auto leading-relaxed">Subscribe for early access to new drops, behind-the-scenes content, and 10% off your first order.</p>
                <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 pt-4">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 h-14 rounded-full px-8 bg-white text-[#271E1B] font-medium outline-none focus:ring-4 focus:ring-white/20 transition-all shadow-inner"
                  />
                  <Button className="h-14 px-10 rounded-full bg-[#1E1E1E] hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all">
                    Sign Up
                  </Button>
                </div>
              </div>
              {/* Subtle background decoration */}
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
            </div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
