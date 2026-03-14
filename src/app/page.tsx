
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { getProducts } from '@/lib/actions/products';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const heroSlides = [
  {
    title: 'Heritage in Every',
    highlight: 'Curve',
    subtitle: 'Reviving the soul of traditional Indian ceramics for modern spaces. Handcrafted in Kanpur, delivered to your doorstep.',
    image: 'https://ik.imagekit.io/ari07rsa2/kalamic/products/22_IvfYSYJoa.png?updatedAt=1772308420053',
    cta: 'Explore Collection',
    link: '/products',
    badge: 'Artisan Heritage'
  },
  {
    title: 'Sacred Geometry for',
    highlight: 'Modern Homes',
    subtitle: 'Exquisite Mandala wheels designed to bring spiritual harmony and aesthetic balance to your sacred spaces.',
    image: 'https://ik.imagekit.io/ari07rsa2/kalamic/products/Untitled%20design%20(4).png',
    cta: 'Shop Mandalas',
    link: '/products?category=mandala',
    badge: 'Limited Edition'
  },
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background">
          <div className="absolute inset-0 pattern-paisley opacity-[0.03] pointer-events-none" />

          <div className="container mx-auto px-6 md:px-10 py-12 md:py-24 max-w-[1400px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[500px]">
              <div className="relative z-10 lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.7 }}
                    className="space-y-6"
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="h-3 w-3" /> {slide.badge}
                    </span>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-semibold leading-[1.05] tracking-tight">
                      {slide.title} <br />
                      <span className="italic text-primary font-normal">{slide.highlight}</span>
                    </h1>
                    <p className="text-base md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                      <Button asChild size="lg" className="h-14 px-10 rounded-full gradient-saffron text-white font-black text-sm shadow-2xl active:scale-95 transition-all">
                        <Link href={slide.link} className="flex items-center gap-3">
                          {slide.cta} <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full border-2 border-primary/20 text-primary font-black text-sm">
                        <Link href="/about">Our Studio Story</Link>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.9 }}
                    className="relative w-full max-w-[450px] aspect-square"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-[80px] opacity-40" />
                    <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl bg-white border-8 border-white/50">
                      <Image src={slide.image} alt={slide.title} fill className="object-contain" priority />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="border-y border-primary/5 bg-white/80 backdrop-blur-xl py-10">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Truck, text: 'Free Delivery', sub: 'On orders above ₹999' },
                { icon: ShieldCheck, text: 'Secure Checkout', sub: 'SSL-encrypted' },
                { icon: RotateCcw, text: 'Artisan Warranty', sub: '7-day easy returns' },
                { icon: Sparkles, text: '100% Handmade', sub: 'By Kanpur Artisans' },
              ].map(({ icon: Icon, text, sub }, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">{text}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-accent font-black text-[10px] uppercase tracking-widest">
                  <Package className="h-4 w-4" /> Artisan Selects
                </div>
                <h2 className="text-3xl md:text-6xl font-display font-semibold tracking-tight text-balance">Latest Kiln Firing</h2>
              </div>
              <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-full border border-primary/10">
                <Link href="/products" className="flex items-center gap-3">
                  View Full Catalog <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  slug={product.slug}
                  name={product.name}
                  description={product.short_description}
                  price={product.price}
                  originalPrice={product.compare_at_price}
                  image={product.images?.[0] || ''}
                  rating={product.analytics?.average_rating || 4.8}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CRAFT CTA */}
        <section className="py-20 md:py-40 bg-background relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <div className="relative bg-primary rounded-[3rem] md:rounded-[5rem] px-8 py-16 md:p-28 overflow-hidden text-center text-white shadow-2xl shadow-primary/20">
              <div className="relative z-10 space-y-8 md:space-y-12">
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-semibold tracking-tight text-balance leading-tight">
                  Handcrafted with Heart <br /> by Kanpur Artisans
                </h2>
                <p className="text-sm md:text-2xl opacity-90 max-w-3xl mx-auto font-medium text-balance">
                  Support local master-craftsmen by bringing authentic, hand-molded ceramic treasures into your home. Every acquisition sustains a generational heritage.
                </p>
                <Button asChild size="lg" className="h-14 md:h-20 px-10 md:px-16 rounded-full bg-[#1E1E1E] hover:bg-black text-white font-black text-sm md:text-lg uppercase tracking-wider shadow-2xl transition-all">
                  <Link href="/products" className="flex items-center gap-3">
                    Browse Collection <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
