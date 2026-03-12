
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
  Package,
  Star
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
  {
    title: 'Timeless Art for',
    highlight: 'Your Walls',
    subtitle: 'Elevate your interiors with hand-molded mirrors and decorative plates that anchor a story in every room.',
    image: 'https://ik.imagekit.io/ari07rsa2/kalamic/products/6_ZMDHVtT3vw.png?updatedAt=1772658985377',
    cta: 'Browse Wall Art',
    link: '/products?category=wall-art',
    badge: 'New Arrivals'
  },
];

const CategoryCard = ({ name, slug, description }: { name: string, slug: string, description?: string }) => (
  <Link href={`/products?category=${slug}`}>
    <motion.div 
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] p-6 md:p-10 text-center hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col justify-center"
    >
      <h3 className="text-lg md:text-2xl font-display font-bold text-foreground text-balance">{name}</h3>
      {description && <p className="text-[10px] md:text-sm text-muted-foreground mt-2 font-medium line-clamp-2">{description}</p>}
      <div className="mt-4 inline-flex items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary/60">
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
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((index + heroSlides.length) % heroSlides.length);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        
        {/* 1. HERO SLIDER */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background">
          <div className="absolute inset-0 pattern-paisley opacity-[0.03] pointer-events-none" />
          
          <div className="container mx-auto px-6 md:px-10 py-8 md:py-24 max-w-[1400px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center min-h-[500px] md:min-h-[650px]">
              
              {/* Text Content */}
              <div className="relative z-10 lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`text-${currentSlide}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-6 md:space-y-10"
                  >
                    <Badge label={slide.badge} />
                    
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-semibold text-foreground leading-[1.05] tracking-tight text-balance">
                      {slide.title} <br />
                      <span className="italic text-primary font-normal">{slide.highlight}</span>
                    </h1>
                    
                    <p className="text-base md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium text-balance">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 md:gap-6 pt-4">
                      <Button asChild size="lg" className="h-14 md:h-16 px-10 md:px-12 rounded-full gradient-saffron text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95">
                        <Link href={slide.link} className="flex items-center gap-3">
                          {slide.cta} <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="h-14 md:h-16 px-10 md:px-12 rounded-full border-2 border-primary/20 text-primary font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all">
                        <Link href="/about">Our Studio Story</Link>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Image */}
              <div className="relative lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`img-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.95, rotate: 2 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-[320px] sm:max-w-[450px] lg:max-w-[550px] aspect-square"
                  >
                    {/* Glowing background behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-[80px] md:blur-[120px] scale-110 opacity-40 animate-pulse" />
                    
                    <div className="relative w-full h-full rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] bg-white border-8 border-white/50 group">
                      <Image 
                        src={slide.image} 
                        alt={slide.title} 
                        fill 
                        className="object-contain p-0 md:p-0 drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-1000"
                        priority
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Slider Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 mt-12 md:mt-20">
              <div className="flex gap-4">
                <button 
                  onClick={() => goToSlide(currentSlide - 1)} 
                  className="h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-primary/10 bg-white/80 backdrop-blur-md flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 shadow-xl shadow-black/5 active:scale-90"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={() => goToSlide(currentSlide + 1)} 
                  className="h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-primary/10 bg-white/80 backdrop-blur-md flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 shadow-xl shadow-black/5 active:scale-90"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className="relative h-2 group"
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <div className={cn(
                      "h-full rounded-full transition-all duration-700 ease-in-out",
                      i === currentSlide ? "w-12 md:w-16 bg-primary" : "w-2 md:w-3 bg-primary/20 group-hover:bg-primary/40"
                    )} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. TRUST BAR */}
        <section className="relative z-20 border-y border-primary/5 bg-white/80 backdrop-blur-xl py-8 md:py-14">
          <div className="container mx-auto px-6 md:px-10 max-w-[1200px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              {[
                { icon: Truck, text: 'Free Delivery', sub: 'On orders above ₹999' },
                { icon: ShieldCheck, text: 'Secure Checkout', sub: 'SSL-encrypted payments' },
                { icon: RotateCcw, text: 'Artisan Warranty', sub: '7-day easy returns' },
                { icon: Sparkles, text: '100% Handmade', sub: 'Crafted by local masters' },
              ].map(({ icon: Icon, text, sub }, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 text-center md:text-left">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner group hover:bg-primary hover:text-white transition-all duration-500">
                    <Icon className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">{text}</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold leading-tight max-w-[120px] md:max-w-none">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. CATEGORIES */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 md:px-10 max-w-[1200px]">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-20 space-y-4"
            >
              <div className="flex items-center justify-center gap-3 text-accent font-black text-[10px] uppercase tracking-[0.3em]">
                <div className="h-px w-8 bg-accent/30" /> Discover Heritage <div className="h-px w-8 bg-accent/30" />
              </div>
              <h2 className="text-3xl md:text-6xl font-display font-semibold text-foreground tracking-tight">Shop by Collection</h2>
              <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto font-medium">Explore curated artisanal ceramics designed for every corner of your contemporary home.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              <CategoryCard name="Spiritual Decor" slug="temple" description="Handcrafted Sthambs and Mandala wheels for your sacred spaces." />
              <CategoryCard name="Wall Artistry" slug="wall-art" description="Hand-painted mirrors and decorative plates that tell a story." />
              <div className="sm:col-span-2 md:col-span-1">
                <CategoryCard name="Home Accents" slug="decor" description="Small ceramic treasures designed to bring character to any room." />
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURED PRODUCTS */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container mx-auto px-6 md:px-10 max-w-[1200px]">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 md:mb-20 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 text-center md:text-left"
              >
                <div className="flex items-center justify-center md:justify-start gap-3 text-accent font-black text-[10px] uppercase tracking-[0.3em]">
                  <Package className="h-4 w-4" /> Artisan Selects
                </div>
                <h2 className="text-3xl md:text-6xl font-display font-semibold text-foreground tracking-tight">Latest Kiln Firing</h2>
                <p className="text-sm md:text-lg text-muted-foreground font-medium">Handcrafted favorites from our studio in Kanpur.</p>
              </motion.div>
              <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/5 h-12 px-8 rounded-full border border-primary/10">
                <Link href="/products" className="flex items-center gap-3">
                  View Full Catalog <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              ) : products.slice(0, 8).map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
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
        <section className="py-20 md:py-40 bg-background relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-10 max-w-[1200px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-primary rounded-[3rem] md:rounded-[5rem] px-8 py-16 md:p-28 overflow-hidden text-center text-white shadow-2xl shadow-primary/20"
            >
              <div className="relative z-10 space-y-8 md:space-y-12">
                <h2 className="text-2xl sm:text-5xl md:text-7xl font-display font-semibold tracking-tight text-balance leading-tight">Handcrafted with Heart <br className="hidden md:block" /> by Kanpur Artisans</h2>
                <p className="text-base md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed font-medium text-balance">
                  Support local master-craftsmen by bringing authentic, hand-molded ceramic treasures into your home. Every acquisition helps sustain a generational heritage.
                </p>
                <div className="pt-6">
                  <Button asChild size="lg" className="h-16 md:h-20 px-12 md:px-16 rounded-full bg-[#1E1E1E] hover:bg-black text-white font-black text-base md:text-lg uppercase tracking-widest shadow-2xl transition-all active:scale-95 w-full sm:w-auto">
                    <Link href="/products" className="flex items-center gap-4 justify-center">
                      Browse Full Collection <ArrowRight className="h-6 w-6" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
              <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-[80px] md:blur-[120px] -mr-32 -mt-32 md:-mr-48 md:-mt-48" />
              <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-accent/20 rounded-full blur-[80px] md:blur-[120px] -ml-32 -mb-32 md:-ml-48 md:-mb-48" />
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
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center gap-3 px-5 py-2 md:px-6 md:py-2.5 rounded-full bg-primary/10 border-2 border-primary/20 text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.25em] shadow-lg backdrop-blur-sm"
  >
    <div className="relative">
      <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary animate-pulse" />
      <div className="absolute inset-0 h-3.5 w-3.5 md:h-4 md:w-4 bg-primary/20 blur-md rounded-full" />
    </div>
    {label}
  </motion.span>
);
