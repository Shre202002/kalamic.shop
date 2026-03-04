
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

const heroSlides = [
  {
    title: 'Handmade Ceramics,',
    highlight: 'With Passion',
    subtitle: 'Discover beautiful handcrafted ceramic products made by Kanpur\'s finest artisans.',
    image: 'https://i.imgur.com/wqfAvmq.png',
    cta: 'Shop Now',
    link: '/products',
  },
  {
    title: 'Stunning Mandala',
    highlight: 'Wheels',
    subtitle: 'Divine beauty crafted in ceramic — perfect for Jhula, mandir, or wall decor.',
    image: 'https://i.imgur.com/wqfAvmq.png',
    cta: 'Explore Collection',
    link: '/products',
  },
  {
    title: 'Artisan Wall',
    highlight: 'Masterpieces',
    subtitle: 'Elevate your space with hand-painted ceramic mirrors and decorative plates.',
    image: 'https://i.imgur.com/CjkQ8p3.png',
    cta: 'Shop Decor',
    link: '/products?category=wall-art',
  },
];

const CategoryCard = ({ name, slug, description }: { name: string, slug: string, description?: string }) => (
  <Link href={`/products?category=${slug}`}>
    <motion.div 
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] p-8 md:p-10 text-center hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col justify-center"
    >
      <h3 className="text-xl md:text-2xl font-display font-bold text-primary">{name}</h3>
      {description && <p className="text-xs md:text-sm text-muted-foreground mt-2 font-medium">{description}</p>}
      <div className="mt-4 inline-flex items-center text-[10px] font-black uppercase tracking-widest text-primary/60">
        Explore <ChevronRight className="ml-1 h-3 w-3" />
      </div>
    </motion.div>
  </Link>
);

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

  // Auto-slide logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((index + heroSlides.length) % heroSlides.length);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE9] selection:bg-primary/10">
      <Navbar />
      
      <main className="flex-1">
        
        {/* 1. HERO SLIDER */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-12 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[450px] md:min-h-[550px]">
              
              {/* Text Content */}
              <div className="relative z-10 order-2 lg:order-1 text-center lg:text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`text-${currentSlide}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-6 md:space-y-8"
                  >
                    <Badge label="New Arrivals" />
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-semibold text-[#271E1B] leading-[1.1] tracking-tight">
                      {slide.title} <br />
                      <span className="italic text-primary font-normal">{slide.highlight}</span>
                    </h1>
                    <p className="text-base md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                      <Button asChild size="lg" className="h-14 px-10 rounded-full bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                        <Link href={slide.link}>{slide.cta} <ArrowRight className="ml-2 h-5 w-5" /></Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full border-primary/20 text-primary font-bold text-sm hover:bg-primary/5">
                        <Link href="/about">Our Story</Link>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Image */}
              <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`img-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="relative w-full max-w-[400px] aspect-square"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-[80px] scale-110 opacity-50" />
                    <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl bg-white border-4 border-white/50">
                      <Image 
                        src={slide.image} 
                        alt={slide.title} 
                        fill 
                        className="object-contain p-8 md:p-12 drop-shadow-2xl"
                        priority
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Slider Navigation */}
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-12 md:mt-16">
              <div className="flex gap-3">
                <button 
                  onClick={() => goToSlide(currentSlide - 1)} 
                  className="h-12 w-12 rounded-full border border-primary/10 bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => goToSlide(currentSlide + 1)} 
                  className="h-12 w-12 rounded-full border border-primary/10 bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-primary' : 'w-2.5 bg-primary/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. TRUST BAR */}
        <section className="border-y border-primary/5 bg-white/50 backdrop-blur-sm py-8 md:py-10">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { icon: Truck, text: 'Free Delivery above ₹999' },
                { icon: ShieldCheck, text: 'Secure Payments' },
                { icon: RotateCcw, text: '7-Day Returns' },
                { icon: Sparkles, text: '100% Handmade' },
              ].map(({ icon: Icon, text }, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#271E1B]/70 leading-tight">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. CATEGORIES */}
        <section className="py-24">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-display font-semibold text-[#271E1B]">Shop by Category</h2>
              <p className="text-sm md:text-base text-muted-foreground font-medium max-w-lg mx-auto">Explore our curated artisanal collections for every corner of your home.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <CategoryCard name="Spiritual Decor" slug="temple" description="Pillars and Mandala wheels for your sacred spaces." />
              <CategoryCard name="Wall Artistry" slug="wall-art" description="Hand-molded mirrors and decorative plates." />
              <CategoryCard name="Home Accents" slug="decor" description="Small ceramic treasures that anchor a story." />
            </div>
          </div>
        </section>

        {/* 4. FEATURED PRODUCTS */}
        <section className="py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-2 text-center md:text-left"
              >
                <div className="flex items-center justify-center md:justify-start gap-2 text-accent font-bold text-[10px] uppercase tracking-widest">
                  <Package className="h-4 w-4" /> Artisan Selects
                </div>
                <h2 className="text-3xl md:text-5xl font-display font-semibold text-[#271E1B]">Special Collection</h2>
                <p className="text-sm md:text-base text-muted-foreground font-medium">Curated favorites from our latest kiln firing.</p>
              </motion.div>
              <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                <Link href="/products" className="flex items-center gap-2">
                  View Full Catalog <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              ) : products.slice(0, 8).map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ProductCard 
                    id={product._id} 
                    slug={product.slug}
                    name={product.name}
                    description={product.short_description || product.description}
                    price={product.price}
                    originalPrice={product.compare_at_price}
                    image={product.images?.[0] || 'https://placehold.co/600x800?text=Kalamic'}
                    rating={product.analytics?.average_rating || 4.8}
                    tag={product.tags?.[0] || "Artisan"}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CRAFT CTA */}
        <section className="py-24 md:py-32 bg-[#F5EFE9]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-primary rounded-[3rem] md:rounded-[4rem] p-12 md:p-24 overflow-hidden text-center text-white shadow-2xl shadow-primary/20"
            >
              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tight">Made with ❤️ by <br className="hidden md:block" /> Kanpur Artisans</h2>
                <p className="text-base md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed font-medium">
                  Support local craftsmanship by bringing authentic, hand-molded ceramics into your home. Every purchase sustains a heritage.
                </p>
                <div className="pt-4">
                  <Button asChild size="lg" className="h-16 px-12 rounded-full bg-[#1E1E1E] hover:bg-black text-white font-bold text-lg shadow-2xl transition-all active:scale-95">
                    <Link href="/products">Explore the Collection</Link>
                  </Button>
                </div>
              </div>
              
              {/* Subtle background decoration */}
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -ml-32 -mb-32" />
            </motion.div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}

const Badge = ({ label }: { label: string }) => (
  <motion.span 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
  >
    <Sparkles className="h-3 w-3" />{label}
  </motion.span>
);
