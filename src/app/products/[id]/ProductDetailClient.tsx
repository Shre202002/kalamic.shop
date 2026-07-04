'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  Package, 
  MessageCircle, 
  CheckCircle2, 
  Box, 
  Scale, 
  MapPin, 
  Maximize2, 
  ArrowLeft,
  X,
  ChevronRight,
  ChevronLeft,
  Hammer,
  Zap,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
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
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  const product = initialProduct;
  const reviews = initialReviews;
  const productId = product._id;

  const wishlistDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !productId) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
  }, [firestore, user, productId]);

  const { data: wishlistDoc } = useDoc(wishlistDocRef);
  const isFavorited = !!wishlistDoc;

  useEffect(() => {
    incrementProductViews(product._id);
    
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

    return () => clearInterval(timer);
  }, [product._id]);

  const handleAddToCart = async () => {
    if (!user || !firestore) {
      router.push('/auth/login');
      return;
    }
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', productId);
    await setDoc(cartItemRef, {
      id: productId,
      productVariantId: productId,
      name: product.name,
      priceAtAddToCart: product.price,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      requiresHandling: product.requiresHandling ?? true,
      requiresPremiumProtection: product.requiresPremiumProtection ?? true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    trackProductAction(productId, 'cart_add_count');
    toast({ title: "Added to Bag", description: `${product.name} is saved for your acquisition.` });
  };

  const handleBuyNow = async () => {
    if (!user || !firestore) {
      router.push('/auth/login');
      return;
    }
    await handleAddToCart();
    router.push('/checkout');
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
      await submitReview({
        productId,
        userId: user.uid,
        userName: user.displayName || 'Collector',
        rating: reviewRating,
        reviewText: reviewComment,
      });
      setReviewComment('');
      toast({ title: "Review Shared", description: "Thank you for contributing to our heritage stories." });
      router.refresh();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  
  const ratingStats = {
    avg: product.analytics?.average_rating || 5.0,
    count: product.analytics?.review_count || 0,
    distribution: [
      { stars: 5, count: reviews.filter(r => r.rating === 5).length },
      { stars: 4, count: reviews.filter(r => r.rating === 4).length },
      { stars: 3, count: reviews.filter(r => r.rating === 3).length },
      { stars: 2, count: reviews.filter(r => r.rating === 2).length },
      { stars: 1, count: reviews.filter(r => r.rating === 1).length },
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFAF5]">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl pt-24 md:pt-32 pb-20">
          
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <ArrowLeft className="h-3 w-3" /> All Creations
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-primary truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-white border border-border group">
                <Image 
                  src={galleryImages[activeImageIndex]?.url} 
                  alt={galleryImages[activeImageIndex]?.alt || product.name} 
                  fill 
                  className="object-cover cursor-zoom-in"
                  priority
                  onClick={() => { setLightboxImage(galleryImages[activeImageIndex].url); setIsLightboxOpen(true); }}
                />
                <button 
                  onClick={() => { setLightboxImage(galleryImages[activeImageIndex].url); setIsLightboxOpen(true); }}
                  className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-white/80 backdrop-blur-md shadow-xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {galleryImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0",
                        activeImageIndex === idx ? "border-primary shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image src={img.url} alt={img.alt} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Panel */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
                     Bestseller
                   </Badge>
                   <div className="flex items-center gap-1 text-accent">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">({ratingStats.count} Reviews)</span>
                   </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-heading tracking-tight leading-tight">
                  {product.name}
                </h1>
                <p className="text-lg text-body leading-relaxed font-medium italic opacity-80">
                  {product.short_description}
                </p>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-muted font-medium line-through">₹{product.compare_at_price.toLocaleString()}</span>
                      <Badge className="bg-terracotta text-white border-none text-[10px] font-black px-2 py-0.5">
                        SAVE {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="p-6 rounded-[2rem] bg-surface border border-border space-y-4">
                <div className="flex items-center gap-3 text-body">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-inner">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">FragileCare™ Guaranteed</p>
                    <p className="text-[10px] text-muted font-medium">Double-walled impact protection packaging.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-body">
                  <div className="h-10 w-10 rounded-xl bg-sage/10 flex items-center justify-center text-sage shadow-inner">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">Lead-Free Certified</p>
                    <p className="text-[10px] text-muted font-medium">100% non-toxic artisanal glazes used.</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Button 
                    onClick={handleAddToCart}
                    className="h-16 rounded-2xl bg-gold text-heading font-black uppercase tracking-widest text-xs hover:bg-gold-light shadow-xl shadow-gold/10 transition-all active:scale-95"
                   >
                     <ShoppingCart className="mr-2 h-4 w-4" /> Add to Bag
                   </Button>
                   <Button 
                    onClick={handleBuyNow}
                    variant="outline"
                    className="h-16 rounded-2xl border-gold text-gold font-black uppercase tracking-widest text-xs hover:bg-gold hover:text-heading transition-all active:scale-95"
                   >
                     <Zap className="mr-2 h-4 w-4" /> Buy Now
                   </Button>
                </div>
                <Button 
                  onClick={handleAddToWishlist}
                  variant="ghost" 
                  className={cn(
                    "w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2",
                    isFavorited ? "text-primary" : "text-muted hover:text-primary"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
                  {isFavorited ? 'Piece Saved in Favorites' : 'Save Piece for Later'}
                </Button>
              </div>

              {/* Delivery Meta */}
              <div className="flex items-center justify-between py-6 border-t border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-sage uppercase">
                    <CheckCircle2 size={12} /> In Stock
                  </div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Ready to ship in 2 days</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Free Delivery</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Across India</p>
                </div>
              </div>

              {/* WhatsApp Link */}
              <div className="text-center pt-2">
                <a 
                  href={`https://wa.me/916387562920?text=I'm interested in the ${product.name}. Could you share more details?`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-[10px] font-black text-muted hover:text-primary transition-colors uppercase tracking-widest"
                >
                  <MessageCircle size={14} className="text-green-500" /> Have questions? Usually replies in 15 mins
                </a>
              </div>
            </div>
          </div>

          {/* Trust Strip */}
          <section className="py-12 border-y border-border mb-20 overflow-x-auto no-scrollbar">
            <div className="flex justify-between min-w-[800px] gap-8">
              {[
                { icon: MapPin, label: 'Origin', val: 'Handmade in Kanpur' },
                { icon: Hammer, label: 'Technique', val: 'Wheel Thrown' },
                { icon: ShieldCheck, label: 'Guarantee', val: 'Breakage Protection' },
                { icon: Truck, label: 'Logistics', val: 'FragileCare™ Shipping' },
                { icon: Info, label: 'Safety', val: 'Lead-Free Glaze' },
                { icon: MessageCircle, label: 'Support', val: 'Artisan Direct' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center text-gold">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-[10px] font-bold text-heading whitespace-nowrap">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Content Tabs */}
          <section className="max-w-4xl mx-auto mb-32">
            <Tabs defaultValue="story" className="w-full">
              <TabsList className="w-full bg-surface h-16 rounded-2xl border border-border p-1.5 mb-12">
                <TabsTrigger value="story" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white">The Studio Story</TabsTrigger>
                <TabsTrigger value="specs" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white">Precision & Specs</TabsTrigger>
                <TabsTrigger value="care" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white">Care Card</TabsTrigger>
              </TabsList>
              
              <TabsContent value="story" className="space-y-8 animate-in fade-in duration-500">
                <div className="prose prose-stone max-w-none">
                  <p className="text-xl text-heading font-medium leading-relaxed font-display">
                    Each curve and motif in this piece is a testament to the heritage of Uttar Pradesh. 
                    Molded by hand and fired in our studio kiln, it carries the physical memory of the artisan's touch.
                  </p>
                  <p className="text-lg text-body leading-relaxed">
                    {product.description}
                  </p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-primary/[0.03] border border-dashed border-primary/20">
                   <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                     <Package size={16} /> What's in the box
                   </h4>
                   <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        `The ${product.name} itself`,
                        'Artisan Heritage Care Card',
                        'Certificate of Authenticity',
                        'FragileCare™ Eco-safe Packaging',
                        'Studio Brand Label'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-body">
                          <CheckCircle2 size={16} className="text-sage" /> {item}
                        </li>
                      ))}
                   </ul>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="animate-in fade-in duration-500">
                <div className="overflow-hidden rounded-[2.5rem] border border-border bg-white shadow-sm">
                  <div className="grid grid-cols-3 bg-surface px-8 py-5 border-b border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Feature</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">🏺 Kalamic Artisan</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">🏭 Mass Produced</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {[
                      { key: 'Material', val: 'High-fire Studio Clay', common: 'Synthetic Resin/Plastic' },
                      { key: 'Weight', val: `${product.shipping?.weight_kg || '1.2'} KG`, common: 'Approx 0.3 KG' },
                      { key: 'Firing', val: '1200°C Kiln Fired', common: 'Unfired / Air Dried' },
                      { key: 'Glaze', val: 'Hand-painted Lead-free', common: 'Industrial Toxic Print' },
                      ...(product.specifications || []).map((s: any) => ({ key: s.key, val: s.value, common: s.commonValue || 'Standard' }))
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-3 px-8 py-6 items-center">
                        <span className="text-xs font-black uppercase text-heading">{row.key}</span>
                        <span className="text-sm font-bold text-primary">{row.val}</span>
                        <span className="text-sm font-medium text-muted/60">{row.common}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="care" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="p-8 rounded-[2rem] bg-surface border border-border space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-heading">Preservation</h4>
                      <p className="text-sm text-body leading-relaxed">
                        To maintain the vibrant glazes, we recommend dusting with a soft, dry microfibre cloth. 
                        Avoid using abrasive chemical cleaners which may dull the hand-painted finish over decades.
                      </p>
                   </div>
                   <div className="p-8 rounded-[2rem] bg-surface border border-border space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-heading">Placement</h4>
                      <p className="text-sm text-body leading-relaxed">
                        This piece is weather-resistant, but for longevity, we suggest placing it away from 
                        prolonged direct sunlight to preserve the organic pigments.
                      </p>
                   </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Reviews Overhaul */}
          <section id="reviews" className="mb-32">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-border pb-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Verified Collector Stories</p>
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-heading">What the Community Says</h2>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-center">
                      <p className="text-4xl font-black text-heading leading-none mb-1">{ratingStats.avg.toFixed(1)}</p>
                      <div className="flex text-accent mb-1 justify-center">
                         {[...Array(5)].map((_, i) => <Star key={i} size={14} className={cn("fill-current", i >= Math.round(ratingStats.avg) && "opacity-20")} />)}
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted">{ratingStats.count} Reviews</p>
                   </div>
                   <div className="space-y-1 w-32 hidden sm:block">
                      {ratingStats.distribution.map((tier) => (
                        <div key={tier.stars} className="flex items-center gap-2">
                           <span className="text-[8px] font-bold text-muted w-4">{tier.stars}★</span>
                           <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${(tier.count / (ratingStats.count || 1)) * 100}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                   <Card className="rounded-[2.5rem] bg-white border border-border shadow-xl p-8 sticky top-32">
                      <h4 className="text-lg font-bold text-heading mb-2">Have this piece?</h4>
                      <p className="text-sm text-body mb-8">Share your studio experience with other collectors.</p>
                      {user ? (
                        <form onSubmit={handleSubmitReview} className="space-y-6">
                           <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted">Investment Rating</Label>
                              <div className="flex gap-2 text-accent">
                                {[1,2,3,4,5].map(i => (
                                  <button key={i} type="button" onClick={() => setReviewRating(i)}>
                                    <Star className={cn("h-6 w-6 transition-all", i <= reviewRating ? "fill-current scale-110" : "opacity-20 hover:opacity-50")} />
                                  </button>
                                ))}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted">Your Story</Label>
                              <textarea 
                                value={reviewComment} 
                                onChange={(e) => setReviewComment(e.target.value)} 
                                required 
                                placeholder="How does the piece feel?..." 
                                className="w-full h-32 p-4 rounded-xl bg-surface border border-border text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                              />
                           </div>
                           <Button type="submit" disabled={isSubmittingReview} className="w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                             {isSubmittingReview ? <Loader2 className="animate-spin" /> : 'Post Review'}
                           </Button>
                        </form>
                      ) : (
                        <Link href="/auth/login" className="block">
                          <Button variant="outline" className="w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-widest border-primary text-primary hover:bg-primary/5">
                            Sign In to Write a Review
                          </Button>
                        </Link>
                      )}
                   </Card>
                </div>
                <div className="lg:col-span-8 space-y-8">
                   {reviews.length === 0 ? (
                     <div className="text-center py-20 bg-surface rounded-[2.5rem] border border-dashed border-border">
                        <MessageCircle size={48} className="mx-auto text-muted opacity-20 mb-4" />
                        <p className="text-sm font-bold text-muted">No collector stories shared yet. Be the first!</p>
                     </div>
                   ) : (
                     reviews.map((review, idx) => (
                       <Card key={idx} className="rounded-[2.5rem] bg-white border border-border p-8 hover:shadow-lg transition-all">
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                  {review.user_name?.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-bold text-heading text-sm">{review.user_name}</p>
                                   <div className="flex items-center gap-2">
                                      <div className="flex text-gold">
                                         {[...Array(5)].map((_, i) => <Star key={i} size={12} className={cn("fill-current", i >= review.rating && "opacity-20")} />)}
                                      </div>
                                      <span className="text-[8px] font-black uppercase text-sage flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Confirmed Collector
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold text-muted">{dayjs(review.createdAt).format('DD MMM YYYY')}</span>
                          </div>
                          <p className="text-body leading-relaxed font-medium">"{review.comment}"</p>
                       </Card>
                     ))
                   )}
                </div>
             </div>
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="pt-20 border-t border-border">
               <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-display font-bold text-heading">You May Also Like</h2>
                  <Link href="/products" className="text-[10px] font-black uppercase text-primary hover:underline">View All</Link>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {relatedProducts.map((p) => (
                    <ProductCard 
                      key={p._id} 
                      id={p._id} 
                      slug={p.slug} 
                      name={p.name} 
                      price={p.price} 
                      image={p.images?.[0]} 
                      rating={p.analytics?.average_rating || 5} 
                    />
                  ))}
               </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4" 
            onClick={() => setIsLightboxOpen(false)}
          >
            <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-all"><X size={48} /></button>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="relative w-full max-w-5xl aspect-square"
            >
              <Image src={lightboxImage} alt="Fullscreen" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky WhatsApp */}
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3 group">
         <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-2xl border border-border whitespace-nowrap">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest">Questions about this piece?</p>
            </div>
         </div>
         <a 
          href={`https://wa.me/916387562920?text=I'm inquiring about the ${product.name}. Reference: ${product.sku || product.slug}`}
          target="_blank"
          className="h-16 w-16 rounded-full bg-green-500 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
         >
           <MessageCircle size={32} />
         </a>
      </div>
    </div>
  );
}
