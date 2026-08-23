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
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  RotateCcw,
  Palette,
  Flame,
  Image as ImageIcon,
  Gift,
  Home as HomeIcon,
  Clock,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestimonialsColumn, type Testimonial } from '@/components/ui/testimonials-columns';
import dayjs from 'dayjs';

const BLOG_PLACEHOLDER = "https://picsum.photos/seed/kalamic-blog/1200/675";

const getCoverImage = (url?: string) => {
  if (!url || url.trim() === "") return BLOG_PLACEHOLDER;
  return url;
};

// --- ANIMATION VARIANTS ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
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
    link: '/products?category=wall-art',
    badge: 'Limited Edition'
  },
];

const categories = [
  { key: 'wall-art', label: 'Wall Art', icon: Palette, href: '/products?category=wall-art', desc: 'Mandalas & Mirrors' },
  { key: 'spiritual', label: 'Spiritual Decor', icon: Flame, href: '/products?category=spiritual', desc: 'Pooja & Mandirs' },
  { key: 'photo-frames', label: 'Photo Frames', icon: ImageIcon, href: '/products?category=photo-frames', desc: 'Ceramic Keepsakes' },
  { key: 'gifting', label: 'Gifting', icon: Gift, href: '/products?category=gifting', desc: 'Curated Sets' },
  { key: 'home-decor', label: 'Home Decor', icon: HomeIcon, href: '/products?category=home-decor', desc: 'For Every Space' },
];

const testimonials: Testimonial[] = [
  { name: "Priya Sharma", location: "Delhi", rating: 5, text: "The mandala wall art is absolutely stunning. The craftsmanship is unlike anything I've seen online. Arrived perfectly packaged.", product: "Ganesha Mandala Wall Art" },
  { name: "Rahul Verma", location: "Mumbai", rating: 5, text: "Bought as a Diwali gift. My mother loved it. The ceramic quality and the packaging both exceeded expectations.", product: "Peacock Mor Stambh" },
  { name: "Anita Joshi", location: "Bangalore", rating: 5, text: "Ordered a custom size and the team was incredibly helpful. The piece arrived exactly as described. Will buy again!", product: "Custom Photo Frame" }
];

export default function HomeClient({ 
  initialProducts = [], 
  categoryCounts = {},
  featuredBlogs = []
}: { 
  initialProducts?: any[], 
  categoryCounts?: Record<string, number>,
  featuredBlogs?: any[]
}) {
  const visibleCategories = [...categories]
    .sort((a, b) => (categoryCounts[b.key] || 0) - (categoryCounts[a.key] || 0))
    .slice(0, 5);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  // Logic for blog section redesign
  const mainPost = featuredBlogs[0];
  const sidebarPosts = featuredBlogs.slice(1, 3);
  const scrollPosts = featuredBlogs.slice(3);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main>
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background pt-20 md:pt-0">
          <div className="absolute inset-0 pattern-paisley opacity-[0.03] pointer-events-none" />
          <div className="container max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="relative z-10 lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
                <AnimatePresence mode="wait">
                  <motion.div key={currentSlide} initial="hidden" animate="visible" exit="hidden" variants={stagger} className="space-y-8">
                    <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="h-3 w-3" /> {slide.badge}
                    </motion.span>
                    <motion.h1 variants={fadeUp} className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-foreground leading-[1.05]">
                      {slide.title} <br /> <span className="italic text-primary font-normal">{slide.highlight}</span>
                    </motion.h1>
                    <motion.p variants={fadeUp} className="text-base md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
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
                  <motion.div key={currentSlide} initial={{ opacity: 0, scale: 0.9, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.95, rotate: 5 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[450px] aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-[80px] opacity-40 animate-pulse" />
                    <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl bg-white border-8 border-white/50">
                      <Image src={slide.image} alt={`${slide.title} ${slide.highlight} - Kalamic handcrafted ceramics`} fill className="object-contain p-4" priority sizes="(max-width: 768px) 92vw, 400px" quality={75} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary/40 hidden md:flex">
            <span className="text-[9px] uppercase tracking-[0.3em] font-black">Explore</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </section>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4 py-12 px-6 md:px-12 bg-white border-y border-primary/10">
          {[
            { icon: <Truck className="h-6 w-6" />, title: 'Free Delivery', desc: 'On orders above ₹499' },
            { icon: <ShieldCheck className="h-6 w-6" />, title: 'Secure Gateway', desc: 'SSL-encrypted Checkout' },
            { icon: <RotateCcw className="h-6 w-6" />, title: 'Damage Support', desc: 'Replacement for transit damage' },
            { icon: <Sparkles className="h-6 w-6" />, title: '100% Handmade', desc: 'By Kanpur Artisans' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="flex flex-col items-center text-center gap-3 p-4 group">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">{item.icon}</div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          {/* FEATURED PRODUCTS */}
          <section className="py-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideLeft} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4"><div className="h-1 w-16 bg-primary rounded-full" /><span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Latest Kiln Firing</span></div>
                <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-foreground">Artisan Masterpieces</h2>
              </div>
              <Link href="/products"><Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-full border border-primary/10 hover:bg-primary/5">View Full Catalog <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
              {initialProducts.map((product, index) => (
                <motion.div key={product._id} variants={fadeUp}>
                  <ProductCard id={product._id} slug={product.slug} name={product.name} description={product.short_description} price={product.price} originalPrice={product.compare_at_price} image={product.images?.[0]} rating={product.analytics?.average_rating || 4.8} priority={index === 0} />
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* BROWSE CATEGORIES */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="py-24 border-t border-primary/5">
            <motion.div variants={fadeUp} className="mb-12"><span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Browse by Style</span><h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-foreground mt-2">Find Your Perfect Piece</h2></motion.div>
            <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {visibleCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <motion.a key={i} href={cat.href} variants={fadeUp} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="min-w-[220px] p-8 rounded-[2.5rem] bg-white border border-border shadow-sm flex-shrink-0 flex flex-col gap-4 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                    <div className="relative z-10 h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-colors duration-500"><Icon className="h-7 w-7" /></div>
                    <div className="relative z-10">
                      <p className="font-black text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">{cat.label}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1 opacity-70">{cat.desc}</p>
                      {categoryCounts && (
                        <p className="text-[9px] font-black text-primary/50 mt-3 uppercase tracking-widest">{categoryCounts[cat.key] || 0} pieces</p>
                      )}
                    </div>
                    <div className="relative z-10 mt-2 text-primary opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-[9px] font-black uppercase translate-x-2 group-hover:translate-x-0">Explore <ChevronRight className="h-3 w-3" /></div>
                  </motion.a>
                );
              })}
            </div>
          </motion.section>

          {/* STUDIO STORY */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="py-24 bg-white rounded-[4rem] px-10 md:px-20 my-12 shadow-2xl shadow-primary/5 border border-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <motion.div variants={slideLeft} className="space-y-8">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Our Studio Story</span>
                <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-foreground leading-tight">Handcrafted with Heart in Kanpur</h2>
                <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-lg">Every Kalamic piece carries the soul of Indian heritage. We work with local master-craftsmen to bring authentic, hand-molded ceramic treasures into modern homes.</p>
                <div className="flex flex-wrap gap-4 pt-6"><Link href="/about"><button className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Our Studio Story</button></Link><Link href="/gallery"><button className="h-14 px-10 rounded-2xl border-2 border-primary/20 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all">View Gallery</button></Link></div>
              </motion.div>
              <motion.div variants={slideRight} className="grid grid-cols-2 gap-6">
                {[ { number: '15+', label: 'Years of Craft' }, { number: '500+', label: 'Pieces Created' }, { number: '4.8★', label: 'Collector Rating' }, { number: '100%', label: 'Handmade' } ].map((stat, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.05 }} className="p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-2 group hover:bg-primary hover:border-primary transition-all duration-500"><p className="font-black text-4xl text-primary tracking-tighter group-hover:text-white transition-colors">{stat.number}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white/70 transition-colors">{stat.label}</p></motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* REDESIGNED BLOG SECTION */}
          {featuredBlogs.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="py-24 bg-[#FDFAF6] rounded-[4rem] px-6 md:px-12 -mx-4 md:-mx-10 my-24">
              <motion.div variants={slideLeft} className="flex items-end justify-between mb-16">
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">From The Studio</p>
                  <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight">
                    Heritage Stories &<br/>Artisan Insights
                  </h2>
                </div>
                <Link href="/blog" className="hidden md:flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all px-6 py-3 rounded-full border border-primary/20 bg-white shadow-sm">
                  View All Stories <ChevronRight size={16} />
                </Link>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Featured Post - 60% wide on desktop */}
                {mainPost && (
                  <motion.div variants={fadeUp} className="lg:col-span-7 group">
                    <Link href={`/blog/${mainPost.slug}`} className="block space-y-6">
                      <div className="relative aspect-video rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <Image src={getCoverImage(mainPost.coverImage?.url)} alt={mainPost.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" sizes="(max-width: 1024px) 100vw, 800px" />
                        <div className="absolute top-6 left-6">
                          <Badge className="bg-primary text-white text-[10px] font-black uppercase tracking-widest border-none px-4 py-1.5 shadow-lg">{mainPost.category}</Badge>
                        </div>
                      </div>
                      <div className="space-y-4 px-2">
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{mainPost.title}</h3>
                        <p className="text-muted-foreground text-base md:text-lg line-clamp-2 max-w-2xl font-medium leading-relaxed">{mainPost.excerpt}</p>
                        <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                             <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {mainPost.readTime} MIN READ</span>
                             <span className="hidden sm:flex items-center gap-2"><Calendar className="h-4 w-4" /> {isMounted ? dayjs(mainPost.publishedAt).format('MMM D, YYYY') : ''}</span>
                          </div>
                          <span className="text-primary font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all">Read Story <ArrowRight size={16}/></span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* Sidebar Posts - Stacked */}
                <div className="lg:col-span-5 space-y-8">
                  {sidebarPosts.map((post) => (
                    <motion.article key={post._id} variants={fadeUp} className="group bg-white p-4 rounded-[2rem] border border-primary/5 shadow-sm hover:shadow-xl transition-all duration-500">
                      <Link href={`/blog/${post.slug}`} className="flex gap-6 items-center">
                        <div className="relative w-1/3 aspect-square rounded-2xl overflow-hidden flex-shrink-0">
                          <Image src={getCoverImage(post.coverImage?.url)} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="150px" />
                        </div>
                        <div className="flex-1 space-y-2 pr-4">
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/10 text-primary mb-1">{post.category}</Badge>
                          <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">{post.title}</h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{post.readTime} MIN READ</p>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                  
                  <div className="pt-4 px-4">
                    <div className="p-8 rounded-[2rem] bg-primary/[0.03] border border-dashed border-primary/20 space-y-4">
                      <p className="text-xs font-black text-primary uppercase tracking-widest text-center">Collector Newsletter</p>
                      <p className="text-sm text-center font-medium text-muted-foreground leading-relaxed">Join 2,000+ collectors. Get kiln firing updates and first-access to limited pieces.</p>
                      <div className="flex gap-2">
                        <input suppressHydrationWarning value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="flex-1 h-12 px-4 rounded-xl bg-white border border-border text-sm focus:outline-none focus:border-primary transition-all" />
                        <button onClick={handleSubscribe} className="h-12 px-6 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest">Join</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Horizontal Scrollable Row for remaining */}
              {scrollPosts.length > 0 && (
                <div className="mt-20 pt-16 border-t border-primary/10 overflow-x-auto no-scrollbar -mx-6 px-6">
                  <div className="flex gap-8 w-max pb-4">
                    {scrollPosts.map((post) => (
                      <Link key={post._id} href={`/blog/${post.slug}`} className="block w-[280px] space-y-4 group">
                         <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                           <Image src={getCoverImage(post.coverImage?.url)} alt={post.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="280px" />
                         </div>
                         <div className="space-y-1">
                           <h5 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h5>
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{post.readTime} MIN READ</p>
                         </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* NEWSLETTER (Original) */}
          <section className="py-24"><div className="bg-primary rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-white/10 blur-[100px] -translate-x-1/2 -translate-y-1/2" /><div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-[100px] translate-x-1/2 translate-y-1/2" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
              <div className="space-y-4"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Stay in the Studio Loop</span><h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">Be First to See New <br /> Kalamic Masterpieces</h2><p className="text-white/80 font-medium text-lg max-w-xl mx-auto leading-relaxed">Get notified about limited edition launches, exclusive collector offers, and studio updates before anyone else.</p></div>
              {subStatus === 'done' ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-4 bg-white/10 rounded-[2.5rem] p-8 border border-white/20 backdrop-blur-md"><CheckCircle2 className="h-8 w-8 text-white" /><p className="text-white font-black text-xl uppercase tracking-widest">Welcome to the List!</p></motion.div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                  <input suppressHydrationWarning type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()} placeholder="Enter your email" className="flex-1 h-16 px-8 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/60 font-bold text-base focus:outline-none focus:bg-white/30 focus:border-white/60 transition-all backdrop-blur-xl shadow-inner" />
                  <button onClick={handleSubscribe} disabled={subStatus === 'loading'} className="h-16 px-10 rounded-2xl bg-white text-primary font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex-shrink-0">{subStatus === 'loading' ? 'Joining...' : 'Notify Me'}</button>
                </div>
              )}
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><ShieldCheck className="h-3 w-3" /> Secure Heritage. No spam. Unsubscribe anytime.</p>
            </div>
          </div></section>

          {/* TESTIMONIALS */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative py-24">
            <motion.div variants={fadeUp} className="mx-auto max-w-2xl text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Collector Stories</span>
              <h2 className="mt-3 font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">Loved by the Community</h2>
              <p className="mt-5 text-sm font-medium leading-7 text-muted-foreground sm:text-base">Real words from collectors who brought Kalamic craftsmanship into their homes.</p>
            </motion.div>
            <div className="relative mx-auto mt-12 flex max-h-[620px] max-w-6xl justify-center gap-5 overflow-hidden px-1 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] md:max-h-[740px] md:gap-6">
              <TestimonialsColumn testimonials={testimonials} duration={22} />
              <TestimonialsColumn testimonials={testimonials.slice().reverse()} duration={27} className="hidden md:block" />
              <TestimonialsColumn testimonials={[testimonials[1], testimonials[2], testimonials[0]]} duration={24} className="hidden lg:block" />
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
