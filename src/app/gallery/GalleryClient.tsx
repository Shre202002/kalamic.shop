'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, ChevronLeft, ChevronRight, 
  Play, Camera, Grid3x3, 
  LayoutGrid, Film, ArrowRight,
  Maximize2, Volume2, VolumeX,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IGalleryItem } from '@/lib/models/GalleryItem';

const CATEGORIES = ['All', 'Pillars & Stambh', 'Photo Frames', 'Wall Art', 'Mandala', 'Gifting', 'Other'];

export default function GalleryClient({ items }: { items: any[] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [lightboxItem, setLightboxItem] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  // Scroll detection for sticky filter bar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesMedia = mediaFilter === 'all' || item.mediaType === mediaFilter;
      return matchesCategory && matchesMedia;
    });
  }, [items, activeCategory, mediaFilter]);

  const featuredVideo = useMemo(() => {
    return items.find(i => i.isFeatured && i.mediaType === 'video');
  }, [items]);

  const displayedItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  const openLightbox = (item: any) => {
    setLightboxItem(item);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = useCallback(() => {
    setLightboxItem(null);
    document.body.style.overflow = 'unset';
  }, []);

  const nextItem = useCallback(() => {
    if (!lightboxItem) return;
    const currentIndex = filteredItems.findIndex(i => i._id === lightboxItem._id);
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    setLightboxItem(filteredItems[nextIndex]);
  }, [lightboxItem, filteredItems]);

  const prevItem = useCallback(() => {
    if (!lightboxItem) return;
    const currentIndex = filteredItems.findIndex(i => i._id === lightboxItem._id);
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setLightboxItem(filteredItems[prevIndex]);
  }, [lightboxItem, filteredItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxItem) return;
      if (e.key === 'ArrowRight') nextItem();
      if (e.key === 'ArrowLeft') prevItem();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxItem, nextItem, prevItem, closeLightbox]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        
        {/* Section 1: Hero */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
          <div className="container mx-auto px-6 max-w-6xl relative z-10 text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Visual Archive</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              
              <h1 className="text-4xl md:text-7xl font-serif font-bold text-foreground leading-tight tracking-tight">
                The Kalamic Gallery
              </h1>
              
              <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                Handcrafted ceramic art — captured in every detail. Browse our collection of artisan pieces and studio reels.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <div className="px-6 py-3 rounded-2xl bg-primary text-white flex items-center gap-3 shadow-xl shadow-primary/20">
                  <Camera className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {items.filter(i => i.mediaType === 'image').length} Artisan Pieces
                  </span>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-accent text-foreground flex items-center gap-3 shadow-xl shadow-accent/20">
                  <Film className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {items.filter(i => i.mediaType === 'video').length} Studio Reels
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Filter Bar */}
        <section className={cn(
          "sticky top-16 z-40 transition-all duration-500 py-4",
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-primary/5" : "bg-transparent"
        )}>
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none w-full lg:w-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                      activeCategory === cat 
                        ? "gradient-saffron text-white shadow-lg" 
                        : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* View & Media Toggles */}
              <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex bg-muted p-1 rounded-xl">
                  <button 
                    onClick={() => setMediaFilter('all')}
                    className={cn("p-2 rounded-lg transition-all", mediaFilter === 'all' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setMediaFilter('image')}
                    className={cn("p-2 rounded-lg transition-all", mediaFilter === 'image' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setMediaFilter('video')}
                    className={cn("p-2 rounded-lg transition-all", mediaFilter === 'video' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >
                    <Film className="h-4 w-4" />
                  </button>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block" />

                <div className="flex bg-muted p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >
                    <Grid3x3 className="h-3.5 w-3.5" /> GRID
                  </button>
                  <button 
                    onClick={() => setViewMode('masonry')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all", viewMode === 'masonry' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> MASONRY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Featured Reel */}
        {featuredVideo && activeCategory === 'All' && mediaFilter !== 'image' && (
          <section className="py-20 bg-foreground text-white overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative aspect-video lg:aspect-[4/5] max-h-[600px] rounded-[2rem] overflow-hidden group cursor-pointer"
                  onClick={() => openLightbox(featuredVideo)}
                >
                  <video 
                    src={featuredVideo.url} 
                    autoPlay 
                    muted={isVideoMuted}
                    loop 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute top-6 right-6 flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsVideoMuted(!isVideoMuted); }}
                      className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-all"
                    >
                      {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <Film className="h-3 w-3 text-primary" /> Reel
                    </div>
                  </div>
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="h-6 w-6 fill-current text-white ml-1" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Featured Reel</span>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight">{featuredVideo.name}</h2>
                    {featuredVideo.caption && (
                      <p className="text-white/70 text-lg font-medium italic">"{featuredVideo.caption}"</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 py-6 border-y border-white/10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Category</p>
                      <p className="text-sm font-bold">{featuredVideo.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Duration</p>
                      <p className="text-sm font-bold">0:{featuredVideo.duration || '32'}</p>
                    </div>
                  </div>

                  <Button asChild size="lg" className="h-14 px-10 rounded-full bg-primary text-white font-black uppercase tracking-widest text-xs border-none shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    <Link href="/products" className="flex items-center gap-3">
                      View All Creations <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Main Gallery Grid */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            
            {filteredItems.length === 0 ? (
              <div className="py-32 text-center bg-card rounded-[3rem] border-2 border-dashed border-primary/20">
                <Camera className="mx-auto h-16 w-16 text-primary opacity-10 mb-6" />
                <h3 className="font-serif text-2xl text-foreground/60">No pieces in this collection yet</h3>
                <p className="text-muted-foreground text-sm mt-2">Check back soon — our studio is always creating.</p>
              </div>
            ) : (
              <>
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" 
                    : "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 md:gap-8 space-y-6 md:space-y-8"
                )}>
                  {displayedItems.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (idx % 4) * 0.1 }}
                      className={cn(viewMode === 'masonry' && "break-inside-avoid")}
                    >
                      <div 
                        onClick={() => openLightbox(item)}
                        className="group relative rounded-[2rem] overflow-hidden bg-card border border-border shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-500 cursor-pointer"
                      >
                        <div className={cn(
                          "relative overflow-hidden",
                          viewMode === 'grid' ? "aspect-square" : "h-auto min-h-[250px]"
                        )}>
                          <Image
                            src={item.mediaType === 'video' ? (item.thumbnailUrl || '/video-placeholder.jpg') : item.url}
                            alt={item.altText}
                            width={item.width || 800}
                            height={item.height || 800}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                          
                          {item.mediaType === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="h-12 w-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Play className="h-5 w-5 fill-current ml-1" />
                              </div>
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-end p-6">
                            <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <p className="text-white font-black text-sm uppercase tracking-wider">{item.name}</p>
                              {item.caption && (
                                <p className="text-white/70 text-xs mt-1 font-medium italic line-clamp-2">"{item.caption}"</p>
                              )}
                            </div>
                          </div>

                          <div className="absolute top-4 right-4">
                            <button className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 flex items-center justify-between bg-white">
                          <Badge className="gradient-saffron text-white text-[8px] font-black uppercase tracking-[0.15em] border-none py-1 px-3">
                            {item.mediaType === 'video' ? 'Reel' : item.category}
                          </Badge>
                          <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">
                            {item.format === 'webp' ? 'Optimized WebP' : 'Studio MP4'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-20 flex justify-center">
                    <Button 
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="h-14 px-12 rounded-full gradient-saffron text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Explore More Pieces ({filteredItems.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Section 5: Bottom CTA */}
        <section className="py-20 md:py-40 relative overflow-hidden">
          <div className="absolute inset-0 gradient-maroon" />
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="container mx-auto max-w-4xl relative z-10 text-center text-white space-y-10"
          >
            <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-tight leading-tight">Love What You See?</h2>
            <p className="text-lg md:text-2xl opacity-80 max-w-2xl mx-auto font-medium italic">
              "Every piece in this gallery is available to bring home. Handcrafted, shipped with care."
            </p>
            <div className="pt-6">
              <Button asChild size="lg" className="h-16 px-12 rounded-full bg-accent hover:bg-accent/90 text-foreground font-black text-lg shadow-2xl transition-all active:scale-95">
                <Link href="/products" className="flex items-center gap-3">
                  Shop the Collection <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

      </main>

      <Footer />

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button 
              onClick={closeLightbox}
              className="absolute top-8 right-8 z-[110] text-white/50 hover:text-white transition-colors"
            >
              <X className="h-10 w-10" />
            </button>

            {/* Navigation */}
            <button 
              onClick={(e) => { e.stopPropagation(); prevItem(); }}
              className="absolute left-4 md:left-8 z-[110] h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextItem(); }}
              className="absolute right-4 md:right-8 z-[110] h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            {/* Content Container */}
            <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
              <div className="relative w-full h-[70vh] flex items-center justify-center">
                {lightboxItem.mediaType === 'video' ? (
                  <video 
                    src={lightboxItem.url} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-full rounded-2xl shadow-2xl"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image 
                      src={lightboxItem.url} 
                      alt={lightboxItem.altText} 
                      fill 
                      className="object-contain"
                      sizes="90vw"
                      priority
                    />
                  </div>
                )}
              </div>

              {/* Info Bar */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-8 text-center text-white space-y-2 max-w-2xl"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Badge variant="outline" className="text-accent border-accent text-[9px] font-black tracking-widest px-3 uppercase">
                    {lightboxItem.category}
                  </Badge>
                  {lightboxItem.mediaType === 'video' && (
                    <Badge variant="outline" className="text-primary border-primary text-[9px] font-black tracking-widest px-3 uppercase">
                      Studio Reel
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">{lightboxItem.name}</h3>
                {lightboxItem.caption && (
                  <p className="text-white/60 font-medium italic text-sm md:text-lg">"{lightboxItem.caption}"</p>
                )}
                <div className="pt-4 flex items-center justify-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                    Piece {filteredItems.findIndex(i => i._id === lightboxItem._id) + 1} of {filteredItems.length}
                  </p>
                  <Button asChild variant="link" className="text-accent font-black uppercase text-[10px] tracking-widest p-0 h-auto">
                    <Link href="/products">Shop Artisan Creations</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
