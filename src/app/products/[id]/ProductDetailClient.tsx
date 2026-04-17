
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Box as MuiBox,
  alpha as muiAlpha
} from '@mui/material';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  Package, 
  MessageSquare, 
  CheckCircle2, 
  Box, 
  Scale, 
  MapPin, 
  Maximize2, 
  ArrowLeft,
  X,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  Hammer,
  Zap,
  HelpCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ProductCard } from '@/components/product/ProductCard';

interface ProductDetailClientProps {
  initialProduct: any;
  initialReviews: any[];
  relatedProducts: any[];
}

export default function ProductDetailClient({ initialProduct, initialReviews, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [product, setProduct] = useState(initialProduct);
  const [reviews, setReviews] = useState(initialReviews);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Scroll Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollInterval = useRef<NodeJS.Timeout>();
  const isPausedRef = useRef(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Offer Countdown
  const [timeLeft, setTimeLeft] = useState('');

  const productId = product._id;

  const wishlistDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !productId) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
  }, [firestore, user, productId]);

  const { data: wishlistDoc } = useDoc(wishlistDocRef);
  const isFavorited = !!wishlistDoc;

  useEffect(() => {
    // Increment views on mount
    incrementProductViews(product._id);
    
    // Start infinite scroll
    const startScroll = () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      scrollInterval.current = setInterval(() => {
        if (isPausedRef.current) return;
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft += 1;
        if (el.scrollLeft >= el.scrollWidth / 3) {
          el.scrollLeft = 0;
        }
      }, 20);
    };
    startScroll();

    // Offer Timer
    const endTime = Date.now() + 48 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      clearInterval(timer);
    };
  }, [product._id]);

  useEffect(() => {
    if (!product?.images?.length || isSliderPaused) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product.images, isSliderPaused]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus('loading');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), subtotal: product.price })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPromoDiscount(data.discountAmount);
        setPromoMessage(data.message);
        setPromoStatus('success');
      } else {
        setPromoDiscount(0);
        setPromoMessage(data.message || 'Invalid code');
        setPromoStatus('error');
      }
    } catch {
      setPromoStatus('error');
    }
  };

  const handleAddToCart = async () => {
    if (!user || !firestore) {
      router.push('/auth/login');
      return;
    }
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', productId);
    await setDoc(cartItemRef, {
      id: productId,
      productVariantId: productId,
      cartId: user.uid,
      name: product.name,
      priceAtAddToCart: product.price,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      requiresHandling: product.requiresHandling ?? true,
      requiresPremiumProtection: product.requiresPremiumProtection ?? true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    trackProductAction(productId, 'cart_add_count');
    toast({ title: "Added to Bag", description: `${product.name} is saved.` });
  };

  const handleAddToWishlist = async () => {
    if (!user || !firestore) return;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
    if (isFavorited) {
      await deleteDoc(wishlistItemRef);
      untrackWishlistAction(productId);
    } else {
      await setDoc(wishlistItemRef, {
        id: productId,
        productId,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0]?.url,
        addedAt: new Date().toISOString()
      });
      trackProductAction(productId, 'wishlist_count');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingReview(true);
    try {
      const response = await submitReview({
        productId,
        userId: user.uid,
        userName: user.displayName || 'Collector',
        rating: reviewRating,
        reviewText: reviewComment,
      });
      if (response.success) {
        setReviewComment('');
        setReviews([response.review, ...reviews]);
        toast({ title: "Review Shared" });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const glanceCards = [
    { icon: Scale, label: 'Weight', value: `${product.shipping?.weight_kg || '0'} KG` },
    { icon: Box, label: 'Dimensions', value: product.shipping?.package_dimensions_cm?.diameter ? `${product.shipping.package_dimensions_cm.diameter}cm Dia` : `${product.shipping?.package_dimensions_cm?.length || 0}x${product.shipping?.package_dimensions_cm?.width || 0}cm` },
    { icon: Package, label: 'Stock', value: `${product.stock} pieces` },
    { icon: Hammer, label: 'Craft', value: 'Wheel Thrown' },
    { icon: Zap, label: 'Firing', value: 'High Kiln' },
    ...(product.specifications || []).map((s: any) => ({ icon: Sparkles, label: s.key, value: s.value }))
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl pt-24 md:pt-28 pb-20">
          
          <div className="mb-8">
            <Link href="/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to Collection
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 items-start">
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-28">
              <div className="relative aspect-square rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl bg-white border-2 sm:border-4 border-white group">
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={cn("absolute inset-0 transition-opacity duration-1000", activeImageIndex === idx ? "opacity-100 z-10" : "opacity-0")}
                    onClick={() => { setLightboxImage(img.url); setIsLightboxOpen(true); }}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover cursor-zoom-in" priority={idx === 0} />
                  </div>
                ))}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {galleryImages.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("h-1.5 rounded-full transition-all", activeImageIndex === idx ? "w-8 bg-primary" : "w-2 bg-white/50")} />
                  ))}
                </div>
              </div>

              <div className="px-4">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-4">
                    {galleryImages.map((img, idx) => (
                      <CarouselItem key={idx} className="pl-4 basis-1/5">
                        <div className={cn("relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all", activeImageIndex === idx ? "border-primary" : "border-white")} onClick={() => setActiveImageIndex(idx)}>
                          <Image src={img.url} alt={img.alt} fill className="object-cover" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-display font-semibold text-foreground tracking-tight leading-tight">{product.name}</h1>
                <div className="flex items-baseline gap-5">
                  <span className="text-5xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && <span className="text-2xl text-muted-foreground line-through opacity-40">₹{product.compare_at_price.toLocaleString()}</span>}
                </div>

                <div className="space-y-4 py-6 border-y border-primary/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Promo Savings</label>
                    <div className="text-[9px] font-black text-primary uppercase">Offer ends in: {timeLeft}</div>
                  </div>
                  <div className="flex gap-2">
                    <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="ENTER CODE" className="rounded-2xl font-bold h-12 uppercase" />
                    <Button onClick={handleApplyPromo} className="h-12 px-8 rounded-2xl font-black text-xs">Test</Button>
                  </div>
                  {promoStatus === 'success' && <p className="text-[10px] text-green-600 font-bold uppercase">{promoMessage}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button size="lg" onClick={handleAddToCart} className="w-full h-20 rounded-2xl gradient-saffron text-white font-bold text-xl shadow-xl hover:scale-[1.02] transition-all">
                    <ShoppingCart className="mr-3 h-6 w-6" /> Add to Bag
                  </Button>
                  <Button variant="outline" onClick={handleAddToWishlist} className="h-14 rounded-2xl border-2 gap-2">
                    <Heart className={cn("h-5 w-5", isFavorited && "fill-current text-primary")} /> {isFavorited ? 'Saved to Favorites' : 'Save for Later'}
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full bg-primary/5 p-1 rounded-2xl h-14">
                  <TabsTrigger value="details" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Story</TabsTrigger>
                  <TabsTrigger value="specs" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Precision</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-8 space-y-6">
                  <p className="text-lg text-muted-foreground leading-relaxed font-medium italic">"{product.short_description}"</p>
                  <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
                </TabsContent>
                <TabsContent value="specs" className="mt-8">
                  {product.specifications?.some((s: any) => s.commonValue) ? (
                    <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-sm">
                      <div className="grid grid-cols-3 bg-primary/5 px-6 py-4 border-b border-primary/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Feature</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">🏺 Kalamic</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🏭 Common</span>
                      </div>
                      {product.specifications.map((spec: any, i: number) => (
                        <div key={i} className={cn("grid grid-cols-3 px-6 py-5 border-b border-primary/5 last:border-0 items-center", i % 2 === 0 ? "bg-white" : "bg-primary/[0.01]")}>
                          <span className="text-[11px] font-black uppercase text-foreground">{spec.key}</span>
                          <span className="text-xs font-bold text-primary">{spec.value}</span>
                          <span className="text-xs text-muted-foreground">{spec.commonValue || '—'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {product.specifications?.map((spec: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-white border border-primary/5 shadow-sm">
                          <span className="text-[11px] font-black uppercase text-foreground">{spec.key}</span>
                          <span className="text-xs font-bold text-primary">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <section className="py-12 border-t border-primary/10">
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight font-display mb-8">Piece at a Glance</h2>
            <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {[...glanceCards, ...glanceCards].map((card, i) => (
                <div key={i} className="min-w-[160px] p-8 rounded-3xl bg-white border border-border shadow-sm flex-shrink-0 space-y-4 hover:border-primary/30 transition-all">
                  <card.icon className="h-8 w-8 text-primary/60" />
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{card.label}</p>
                    <p className="font-black text-sm text-primary uppercase">{card.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="py-24 border-t border-primary/10">
              <div className="flex items-center justify-between mb-16">
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tight font-display">Similar Works</h2>
                <Button asChild variant="ghost" className="text-primary font-black uppercase text-xs border border-primary/10 rounded-full px-8">
                  <Link href="/products">View All</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                {relatedProducts.map((p) => (
                  <ProductCard key={p._id} id={p._id} slug={p.slug} name={p.name} price={p.price} image={p.images?.[0]} rating={p.analytics?.average_rating || 5} />
                ))}
              </div>
            </section>
          )}

          <section className="py-24 border-t border-primary/10">
            <h2 className="text-4xl font-black text-foreground uppercase tracking-tight font-display mb-16 text-center">Testimonials</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4 space-y-10">
                <Card className="rounded-[3rem] p-8 bg-primary/5 border-none">
                  <div className="text-6xl font-black text-primary tracking-tighter mb-4">{product.analytics?.average_rating?.toFixed(1) || '5.0'}</div>
                  <div className="flex text-amber-500 gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Based on {reviews.length} reviews</p>
                </Card>
                {user && (
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Share your experience</Label>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required placeholder="Describe the texture, the intricate patterns..." className="w-full h-40 p-6 rounded-[2rem] bg-muted border-none focus:ring-2 focus:ring-primary text-base" />
                    <Button type="submit" disabled={isSubmittingReview} className="w-full h-16 rounded-2xl font-black uppercase">Post Review</Button>
                  </form>
                )}
              </div>
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.map((r, idx) => (
                  <Card key={idx} className="rounded-[2.5rem] p-8 border-primary/5 hover:border-primary/20 transition-all">
                    <div className="flex gap-1 text-amber-500 mb-6">
                      {[...Array(r.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="text-lg italic font-medium text-muted-foreground leading-relaxed mb-8">"{r.comment}"</p>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">{r.user_name?.charAt(0)}</div>
                      <span className="font-bold text-sm">{r.user_name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <AnimatePresence>
        {isLightboxOpen && lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
            <button className="absolute top-10 right-10 text-white/50 hover:text-white"><X className="h-12 w-12" /></button>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-6xl aspect-square">
              <Image src={lightboxImage} alt="Fullscreen" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
