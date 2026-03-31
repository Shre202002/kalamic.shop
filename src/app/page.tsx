'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronDown, 
  Truck, 
  ShieldCheck, 
  Heart,
  Hammer, 
  Package, 
  Sparkles, 
  Star,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { getProducts } from '@/lib/actions/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- ANIMATION VARIANTS ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

const stagger = {
  visible: { 
    transition: { staggerChildren: 0.1 } 
  }
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { 
    opacity: 1, x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

// --- CONSTANTS ---
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

const categories = [
  { label: 'Wall Art', icon: '🎨', href: '/products?category=wall-art', desc: 'Mandalas & Mirrors' },
  { label: 'Spiritual Decor', icon: '🪔', href: '/products?category=temple', desc: 'Pooja & Mandirs' },
  { label: 'Photo Frames', icon: '🖼', href: '/products?category=frames', desc: 'Ceramic Keepsakes' },
  { label: 'Gifting', icon: '🎁', href: '/products?category=gifting', desc: 'Curated Sets' },
  { label: 'Home Decor', icon: '🏺', href: '/products', desc: 'For Every Space' },
];

const whyItems = [
  { icon: <Hammer className="h-6 w-6" />, title: '100% Handcrafted', desc: 'Every piece shaped by skilled artisan hands in Kanpur' },
  { icon: <Truck className="h-6 w-6" />, title: 'FragileCare™ Shipping', desc: 'Honeycomb-padded, insured delivery across India' },
  { icon: <ShieldCheck className="h-6 w-6" />, title: '7-Day Returns', desc: 'Damage claims within 48 hours, hassle-free' },
  { icon: <Heart className="h-6 w-6" />, title: 'Support Heritage', desc: 'Every purchase sustains generational craft' },
  { icon: <Sparkles className="h-6 w-6" />, title: 'Customisable', desc: 'Size, glaze, and engraving on request' },
  { icon: <Package className="h-6 w-6" />, title: 'Gift Ready', desc: 'Premium packaging for every occasion' },
];

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Delhi",
    rating: 5,
    text: "The mandala wall art is absolutely stunning. The craftsmanship is unlike anything I've seen online. Arrived perfectly packaged.",
    product: "Ganesha Mandala Wall Art"
  },
  {
    name: "Rahul Verma",
    location: "Mumbai",
    rating: 5,
    text: "Bought as a Diwali gift. My mother loved it. The ceramic quality and the packaging both exceeded expectations.",
    product: "Peacock Mor Stambh"
  },
  {
    name: "Anita Joshi",
    location: "Bangalore",
    rating: 5,
    text: "Ordered a custom size and the team was incredibly helpful. The piece arrived exactly as described. Will buy again!",
    product: "Custom Photo Frame"
  }
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'done'>('idle');

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

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setSubStatus('loading');
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstName: 'Newsletter',
          lastName: 'Subscriber',
          email,
          message: 'Newsletter subscription from homepage'
        })
      });
      setSubStatus('done');
    } catch {
      setSubStatus('done');
    }
  };

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <main>
        {/* SECTION 1 — HERO */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background pt-20 md:pt-0">
          <div className="absolute inset-0 pattern-paisley opacity-[0.03] pointer-events-none" />
          
          <div className="container max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="relative z-10 lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={stagger}
                    className="space-y-8"
                  >
                    <motion.span 
                      variants={fadeUp}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
                    >
                      <Sparkles className="h-3 w-3" /> {slide.badge}
                    </motion.span>
                    
                    <motion.h1 
                      variants={fadeUp}
                      className="font-display font-black text-5xl sm:text-6xl md:text-8xl tracking-tight text-foreground leading-[1.05]"
                    >
                      {slide.title} <br />
                      <span className="italic text-primary font-normal">{slide.highlight}</span>
                    </motion.h1>
                    
                    <motion.p 
                      variants={fadeUp}
                      className="text-base md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
                    >
                      {slide.subtitle}
                    </motion.p>
                    
                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                      <Link href={slide.link}>
                        <button className="h-14 sm:h-16 px-8 sm:px-12 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center gap-3">
                          {slide.cta} <ArrowRight className="h-5 w-5" />
                        </button>
                      </Link>
                      <Link href="/about">
                        <button className="h-14 sm:h-16 px-8 sm:px-12 rounded-2xl border-2 border-primary/20 text-primary font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all duration-300">
                          Our Studio Story
                        </button>
                      </Link>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.95, rotate: 5 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-[450px] aspect-square"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-[80px] opacity-40 animate-pulse" />
                    <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl bg-white border-8 border-white/50">
                      <Image 
                        src={slide.image} 
                        alt={slide.title} 
                        fill 
                        className="object-contain p-4" 
                        priority 
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary/40 hidden md:flex"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] font-black">Explore</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </section>

        {/* SECTION 2 — TRUST BAR */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 py-12 px-6 md:px-12 bg-white border-y border-primary/10"
        >
          {[
            { icon: <Truck className="h-6 w-6" />, title: 'Free Delivery', desc: 'On orders above ₹499' },
            { icon: <ShieldCheck className="h-6 w-6" />, title: 'Secure Gateway', desc: 'SSL-encrypted Checkout' },
            { icon: <RotateCcw className="h-6 w-6" />, title: 'Artisan Warranty', desc: '7-day easy returns' },
            { icon: <Sparkles className="h-6 w-6" />, title: '100% Handmade', desc: 'By Kanpur Artisans' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="flex flex-col items-center text-center gap-3 p-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          
          {/* SECTION 3 — FEATURED PRODUCTS */}
          <section className="py-24">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideLeft} 
              className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-1 w-16 bg-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Latest Kiln Firing</span>
                </div>
                <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-foreground">
                  Artisan Masterpieces
                </h2>
              </div>
              <Link href="/products">
                <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-full border border-primary/10 hover:bg-primary/5">
                  View Full Catalog <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12"
            >
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : products.slice(0, 8).map((product) => (
                <motion.div key={product._id} variants={fadeUp}>
                  <ProductCard
                    id={product._id}
                    slug={product.slug}
                    name={product.name}
                    description={product.short_description}
                    price={product.price}
                    originalPrice={product.compare_at_price}
                    image={product.images?.[0] || ''}
                    rating={product.analytics?.average_rating || 4.8}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* SECTION 4 — CATEGORIES STRIP */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="py-24 border-t border-primary/5"
          >
            <motion.div variants={fadeUp} className="mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                Browse by Style
              </span>
              <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-foreground mt-2">
                Find Your Perfect Piece
              </h2>
            </motion.div>

            <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat, i) => (
                <motion.a
                  key={i}
                  href={cat.href}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="min-w-[220px] p-8 rounded-[2.5rem] bg-white border border-border shadow-sm flex-shrink-0 flex flex-col gap-4 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <span className="text-4xl filter drop-shadow-md">{cat.icon}</span>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1 opacity-70">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[9px] font-black uppercase">
                    Explore <ChevronRight className="h-3 w-3" />
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>

          {/* SECTION 5 — BRAND STORY */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="py-24 bg-white rounded-[4rem] px-10 md:px-20 my-12 shadow-2xl shadow-primary/5 border border-primary/5 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <motion.div variants={slideLeft} className="space-y-8">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Our Studio Story</span>
                <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-foreground leading-tight">
                  Handcrafted with Heart in Kanpur
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-lg">
                  Every Kalamic piece carries the soul of Indian heritage. We work with local master-craftsmen to bring authentic, hand-molded ceramic treasures into modern homes. 
                  <br /><br />
                  Supporting us means sustaining a generational craft passed down through centuries.
                </p>
                <div className="flex flex-wrap gap-4 pt-6">
                  <Link href="/about">
                    <button className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                      Our Studio Story
                    </button>
                  </Link>
                  <Link href="/gallery">
                    <button className="h-14 px-10 rounded-2xl border-2 border-primary/20 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all">
                      View Gallery
                    </button>
                  </Link>
                </div>
              </motion.div>

              <motion.div variants={slideRight} className="grid grid-cols-2 gap-6">
                {[
                  { number: '15+', label: 'Years of Craft' },
                  { number: '500+', label: 'Pieces Created' },
                  { number: '4.8★', label: 'Collector Rating' },
                  { number: '100%', label: 'Handmade' },
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.05 }}
                    className="p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-2 group hover:bg-primary hover:border-primary transition-all duration-500"
                  >
                    <p className="font-black text-4xl text-primary tracking-tighter group-hover:text-white transition-colors">
                      {stat.number}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white/70 transition-colors">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* SECTION 6 — WHY KALAMIC */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="py-24"
          >
            <motion.div variants={fadeUp} className="mb-16 text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                Why Choose Kalamic
              </span>
              <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-foreground mt-2">
                The Kalamic Promise
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyItems.map((item, i) => (
                <motion.div key={i} variants={fadeUp}
                  whileHover={{ y: -8 }}
                  className="p-10 rounded-[3rem] bg-white border border-border shadow-sm hover:border-primary/20 hover:shadow-2xl transition-all duration-500 flex flex-col gap-6 group"
                >
                  <div className="h-14 w-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-lg uppercase tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* SECTION 7 — NEWSLETTER */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="py-24"
          >
            <div className="bg-primary rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-white/10 blur-[100px] -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-[100px] translate-x-1/2 translate-y-1/2" />
              
              <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                    Stay in the Studio Loop
                  </span>
                  <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight leading-tight">
                    Be First to See New <br /> Kiln Masterpieces
                  </h2>
                  <p className="text-white/70 font-medium text-lg max-w-xl mx-auto leading-relaxed">
                    Get notified about limited edition launches, exclusive collector offers, and studio updates before anyone else.
                  </p>
                </div>
                
                {subStatus === 'done' ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-4 bg-white/10 rounded-[2.5rem] p-8 border border-white/20 backdrop-blur-md">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                    <p className="text-white font-black text-xl uppercase tracking-widest">Welcome to the List!</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                      placeholder="Enter your email"
                      className="flex-1 h-16 px-8 rounded-2xl bg-white/15 border border-white/30 text-white placeholder-white/50 font-bold text-base focus:outline-none focus:bg-white/20 focus:border-white/60 transition-all backdrop-blur-xl shadow-inner"
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={subStatus === 'loading'}
                      className="h-16 px-10 rounded-2xl bg-white text-primary font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex-shrink-0"
                    >
                      {subStatus === 'loading' ? 'Joining...' : 'Notify Me'}
                    </button>
                  </div>
                )}
                
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Secure Heritage. No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </motion.section>

          {/* SECTION 8 — TESTIMONIALS */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="py-24"
          >
            <motion.div variants={fadeUp} className="mb-16">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                Collector Stories
              </span>
              <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-foreground mt-2">
                Loved by the Community
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {testimonials.map((t, i) => (
                <motion.div key={i} variants={fadeUp}
                  whileHover={{ y: -12 }}
                  className="p-10 rounded-[3rem] bg-white border border-border shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 space-y-8 relative"
                >
                  <div className="flex gap-1 text-primary">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
                    "{t.text}"
                  </p>
                  <div className="pt-6 border-t border-primary/5 flex items-center justify-between">
                    <div>
                      <p className="font-black text-base text-foreground tracking-tight">{t.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        {t.location}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black border-primary/10 text-primary py-1 px-3 rounded-full">
                      {t.product}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* SECTION 9 — FINAL CTA */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="py-32 md:py-48"
          >
            <div className="text-center space-y-10 max-w-4xl mx-auto px-4">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                <Package className="h-4 w-4" /> Start Your Collection Today
              </div>
              <h2 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tighter text-foreground leading-[1] text-balance">
                Own a Piece <br /> of Indian Heritage
              </h2>
              <p className="text-lg md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto text-balance">
                Each ceramic creation is one of a kind, handcrafted with love. Browse our collection before your favourite masterpiece sells out.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Link href="/products">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-20 px-16 rounded-3xl bg-primary text-white font-black text-base uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center gap-4 group"
                  >
                    Shop Collection <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </motion.button>
                </Link>
                <Link href="/gallery">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-20 px-16 rounded-3xl border-2 border-primary/20 text-primary font-black text-base uppercase tracking-[0.2em] hover:bg-primary/5 transition-all"
                  >
                    View Gallery
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.section>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
