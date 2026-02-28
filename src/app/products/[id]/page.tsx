"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  ChevronRight,
  Zap,
  Info,
  Package,
  MessageSquare,
  Lock,
  Eye,
  CheckCircle2,
  Box,
  Scale,
  MapPin,
  Maximize2,
  MessageCircle,
  HelpCircle,
  Hammer
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  
  // Slider State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // UI State
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const wishlistDocQuery = useMemoFirebase(() => {
    const id = product?._id || product?.id;
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
  }, [firestore, user, product]);

  const { data: wishlistDoc } = useDoc(wishlistDocQuery);
  const isFavorited = !!wishlistDoc;

  // Track scroll for sticky bar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-slider logic
  useEffect(() => {
    if (!product?.images?.length || isSliderPaused) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [product, isSliderPaused]);

  useEffect(() => {
    async function loadData() {
      try {
        const id = params.id as string;
        const data = await getProductById(id);
        
        if (data) {
          setProduct(data);
          incrementProductViews(data._id);

          const reviewData = await getProductReviews(data._id);
          setReviews(reviewData);
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!user || !firestore) {
      toast({ title: "Please sign in", description: "You need an account to add items to your cart." });
      return;
    }

    const id = product._id;
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      cartId: user.uid,
      name: product.name,
      priceAtAddToCart: product.price ?? 0,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    trackProductAction(id, 'cart_add_count');
    toast({ title: "Added to cart", description: `${product.name} has been added to your bag.` });
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (user) router.push('/checkout');
  };

  const handleAddToWishlist = async () => {
    if (!user || !firestore) {
      toast({ title: "Please sign in" });
      return;
    }

    const productId = product._id;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
    
    try {
      if (isFavorited) {
        await deleteDoc(wishlistItemRef);
        await untrackWishlistAction(productId);
        toast({ title: "Removed from favorites" });
      } else {
        await setDoc(wishlistItemRef, {
          id: productId,
          productId,
          name: product.name,
          price: product.price ?? 0,
          imageUrl: product.images?.[0]?.url,
          addedAt: new Date().toISOString()
        });
        await trackProductAction(productId, 'wishlist_count');
        toast({ title: "Saved to wishlist" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: window.location.href,
        });
        trackProductAction(product._id, 'share_count');
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "You can now paste it anywhere." });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await submitReview({
        productId: product._id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Collector",
        rating: reviewRating,
        comment: reviewComment
      });
      
      const updatedReviews = await getProductReviews(product._id);
      setReviews(updatedReviews);
      setReviewComment('');
      toast({ title: "Review Shared", description: "Your feedback has been immortalized." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /><p className="mt-4 text-primary font-bold uppercase tracking-widest text-[10px]">Curation in Progress...</p></div>;
  if (!product) return <div className="p-20 text-center bg-background min-h-screen flex flex-col items-center justify-center"><h1 className="text-3xl font-display font-semibold text-primary mb-6">Piece Not Found</h1><Button asChild className="rounded-2xl h-12 px-8 font-body"><Link href="/products">Return to Shop</Link></Button></div>;

  const discountPercent = product.compare_at_price ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
  const highlights = product.specifications?.slice(0, 3) || [];
  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl pt-6 md:pt-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors shrink-0">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/products" className="hover:text-primary transition-colors shrink-0">Catalog</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 items-start">
            {/* Left: Premium Hero Slider */}
            <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-28 self-start">
              <div 
                className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-white border-4 border-white group"
                onMouseEnter={() => setIsSliderPaused(true)}
                onMouseLeave={() => setIsSliderPaused(false)}
              >
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-zoom-in",
                      activeImageIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <Image 
                      src={img.url} 
                      alt={img.alt || product.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      priority={idx === 0}
                    />
                  </div>
                ))}
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-20 flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 drop-shadow-xl" />
                </div>

                {discountPercent > 0 && (
                  <div className="absolute top-8 left-8 z-30">
                    <Badge className="bg-primary text-white px-5 py-2.5 rounded-2xl shadow-xl font-black uppercase tracking-tighter text-sm border-none">
                      {discountPercent}% SAVINGS
                    </Badge>
                  </div>
                )}

                {/* Slider Controls Overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {galleryImages.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        activeImageIndex === idx ? "w-8 bg-primary shadow-lg" : "w-2 bg-white/50 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnails below slider */}
              {galleryImages.length > 1 && (
                <div className="px-4">
                  <Carousel 
                    setApi={setThumbnailApi}
                    opts={{ align: "start", loop: true }} 
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {galleryImages.map((img, idx) => (
                        <CarouselItem key={idx} className="pl-4 basis-1/4 sm:basis-1/5 md:basis-1/6">
                          <div 
                            className={cn(
                              "relative aspect-square rounded-2xl overflow-hidden border-2 shadow-md cursor-pointer transition-all",
                              activeImageIndex === idx ? "border-primary scale-90 ring-4 ring-primary/10" : "border-white hover:border-primary/30"
                            )}
                            onClick={() => setActiveImageIndex(idx)}
                          >
                            <Image 
                              src={img.url} 
                              alt={img.alt || `Angle ${idx + 1}`} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </div>

            {/* Right: Premium Information Stack */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-4 py-2 rounded-2xl text-[10px] font-black tracking-[0.1em] uppercase">
                    <Star className="h-3 w-3 fill-current" />
                    {product.analytics?.average_rating || 4.8} / 5.0
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l pl-4 border-border">
                    {reviews.length} Collector Verified Reviews
                  </span>
                </div>
                
                <h1 className="text-[36px] md:text-[52px] font-display font-semibold text-primary tracking-tight leading-[1.05]">{product.name}</h1>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground rounded-xl border-border px-3 py-1">
                    SKU: {product.sku || 'KAL-ART-001'}
                  </Badge>
                  <div className={cn(
                    "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border",
                    product.stock > 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {product.stock > 0 ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {product.stock > 5 ? "In Artisan Studio" : product.stock > 0 ? `Only ${product.stock} Left` : "Out of Stock"}
                  </div>
                </div>

                <div className="flex items-baseline gap-5 py-4">
                  <span className="text-5xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <div className="flex flex-col">
                      <span className="text-lg text-muted-foreground line-through decoration-primary/30 opacity-40">₹{product.compare_at_price.toLocaleString()}</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Heritage Pricing</span>
                    </div>
                  )}
                </div>

                <p className="text-base text-muted-foreground leading-relaxed font-medium">
                  {product.short_description || "A masterfully handcrafted ceramic creation, breathing tradition and elegance into your modern sanctuary."}
                </p>
              </div>

              {/* Highlights Strip */}
              {highlights.length > 0 && (
                <div className="flex divide-x divide-border bg-white border border-border rounded-3xl p-6 shadow-sm">
                  {highlights.map((h: any, i: number) => (
                    <div key={i} className="flex-1 px-4 first:pl-0 last:pr-0 text-center">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{h.key}</p>
                      <p className="text-xs font-bold text-primary truncate">{h.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Premium CTA Stack - 4 Buttons */}
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleAddToCart} 
                    disabled={product.stock <= 0} 
                    className="h-16 rounded-[1.5rem] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all tracking-tight active:scale-95 border-none"
                  >
                    <ShoppingCart className="mr-3 h-6 w-6" /> Add to Bag
                  </Button>
                  <Button 
                    onClick={handleBuyNow} 
                    disabled={product.stock <= 0}
                    className="h-16 rounded-[1.5rem] bg-[#1E1E1E] text-white font-black text-lg shadow-2xl hover:bg-black hover:scale-[1.02] transition-all tracking-tight active:scale-95 border-none"
                  >
                    <Zap className="mr-3 h-6 w-6" /> Buy Now
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    asChild
                    variant="outline"
                    className="h-16 rounded-[1.5rem] border-2 border-primary/20 text-primary font-black hover:bg-primary/5 hover:border-primary active:scale-95 transition-all"
                  >
                    <Link href={`https://wa.me/916387562920?text=Hi, I am interested in ${encodeURIComponent(product.name)}`} target="_blank">
                      <MessageCircle className="mr-3 h-6 w-6" /> Enquire Now
                    </Link>
                  </Button>
                  <Button 
                    onClick={handleShare}
                    variant="outline"
                    className="h-16 rounded-[1.5rem] border-2 border-border text-muted-foreground font-black hover:text-primary hover:border-primary active:scale-95 transition-all"
                  >
                    <Share2 className="mr-3 h-6 w-6" /> Share Piece
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-primary/60">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Secure SSL</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-primary/60">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pan India</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-primary/60">
                    <Heart className={cn("h-5 w-5", isFavorited && "fill-primary text-primary")} onClick={handleAddToWishlist} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground" onClick={handleAddToWishlist}>Wishlist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Artisan Narrative & Specs Tabs */}
          <section className="mb-32">
            <Tabs defaultValue="narrative" className="w-full">
              <TabsList className="flex w-full h-auto bg-transparent border-b border-border p-0 gap-8 mb-12">
                <TabsTrigger value="narrative" className="px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-black uppercase tracking-[0.25em] text-muted-foreground data-[state=active]:text-primary transition-all">Artisan Narrative</TabsTrigger>
                <TabsTrigger value="specs" className="px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-black uppercase tracking-[0.25em] text-muted-foreground data-[state=active]:text-primary transition-all">Technical Specs</TabsTrigger>
                <TabsTrigger value="shipping" className="px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-black uppercase tracking-[0.25em] text-muted-foreground data-[state=active]:text-primary transition-all">FragileCare™ Shipping</TabsTrigger>
                <TabsTrigger value="reviews" className="px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-black uppercase tracking-[0.25em] text-muted-foreground data-[state=active]:text-primary transition-all">Reviews ({reviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="narrative" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-display font-semibold text-primary">Behind the Craft</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                  <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <Image 
                      src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" 
                      alt="Artisan Process" 
                      fill 
                      className="object-cover"
                      data-ai-hint="pottery workshop"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 bg-white p-12 rounded-[3rem] shadow-xl border border-border">
                  {product.specifications?.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-border/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.key}</span>
                      <span className="text-sm font-bold text-primary">{s.value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="p-10 rounded-[3rem] bg-white shadow-xl border border-border space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Scale className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-primary">Weight Metrics</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">Artisan weight verified at {product.shipping?.weight_kg || '1.2'} KG for safe transit balancing.</p>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-white shadow-xl border border-border space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Box className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-primary">Package Profile</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Box Dimensions: {product.shipping?.package_dimensions_cm?.length || '30'} x {product.shipping?.package_dimensions_cm?.width || '30'} x {product.shipping?.package_dimensions_cm?.height || '15'} CM
                    </p>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-primary text-white shadow-xl border-none space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Truck className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold">FragileCare™ Priority</h4>
                    <p className="text-sm opacity-80 leading-relaxed">Reinforced honeycomb padding and shock-absorbent layers used for every ceramic masterpiece.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-4 space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-white shadow-xl border border-border">
                      <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-primary" /> Collector Verdict
                      </h3>
                      <div className="flex items-center gap-6 mb-8">
                        <p className="text-6xl font-black text-primary tracking-tighter">{product.analytics?.average_rating || 4.8}</p>
                        <div>
                          <div className="flex gap-1 text-primary mb-1">
                            {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Community Trust Score</p>
                        </div>
                      </div>
                      
                      {user ? (
                        <form onSubmit={handleSubmitReview} className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Your Rating</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    reviewRating >= star ? "bg-primary text-white shadow-lg" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Star className={cn("h-5 w-5", reviewRating >= star && "fill-current")} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Share Your Experience</Label>
                            <textarea
                              required
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Describe the texture, the patterns..."
                              className="w-full h-32 p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm font-medium resize-none"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            disabled={isSubmittingReview} 
                            className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-xl"
                          >
                            {isSubmittingReview ? <Loader2 className="animate-spin h-5 w-5" /> : "Post Review"}
                          </Button>
                        </form>
                      ) : (
                        <div className="p-6 rounded-2xl bg-muted border border-dashed border-border text-center space-y-4">
                          <Lock className="mx-auto h-6 w-6 text-muted-foreground opacity-30" />
                          <p className="text-[10px] font-black text-muted-foreground uppercase leading-relaxed tracking-widest">Sign in to share your collector experience.</p>
                          <Button asChild variant="outline" className="w-full rounded-xl border-primary text-primary font-black text-xs">
                            <Link href="/auth/login">Join the Community</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-8">
                    {reviews.length > 0 ? reviews.map((review, idx) => (
                      <div key={idx} className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-border space-y-4 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                              {review.user_name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-primary">{review.user_name || 'Collector'}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dayjs(review.createdAt).format('DD MMM YYYY')}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-primary">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-current" : "opacity-20")} />
                            ))}
                          </div>
                        </div>
                        <Separator className="opacity-10" />
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      </div>
                    )) : (
                      <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-border">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                        <p className="text-lg font-display font-semibold text-muted-foreground">Be the first to share your verdict</p>
                        <p className="text-xs font-medium text-muted-foreground/60 mt-2">Help other collectors discover this masterpiece.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Artisan Branding Section */}
          <section className="mb-32 py-20 bg-primary/[0.03] rounded-[4rem] px-8 md:px-20 border border-primary/5">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl">
                <Hammer className="h-10 w-10" />
              </div>
              <h2 className="text-[32px] md:text-[48px] font-display font-semibold text-primary tracking-tight">Handcrafted Heritage</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At Kalamic, every piece is more than just home decor; it's a labor of love from India's master artisans. 
                Using centuries-old molding and firing techniques, we ensure that no two pieces are identical, giving you a truly unique masterpiece for your sanctuary.
              </p>
              <div className="flex flex-wrap justify-center gap-10 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">100% Authentic</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Fair Wages</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Eco-Friendly Clay</span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section - Product Specific */}
          {product.faqs && product.faqs.length > 0 && (
            <section className="mb-32 max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-[32px] md:text-[40px] font-display font-semibold text-primary tracking-tight">Curiosity Corner</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Collector FAQ for this specific piece</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full space-y-4">
                {product.faqs.map((faq: any, idx: number) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="border-none">
                    <AccordionTrigger className="p-8 rounded-[2rem] bg-white shadow-md hover:no-underline data-[state=open]:rounded-b-none border border-border group transition-all">
                      <span className="flex items-center gap-4 text-left font-bold text-primary group-data-[state=open]:text-accent text-sm md:text-base">
                        <HelpCircle className="h-5 w-5 shrink-0 opacity-40" /> {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="p-8 pt-2 bg-white rounded-b-[2rem] text-sm text-muted-foreground leading-relaxed border-t border-border/50 shadow-md">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>Artisan Detail View</DialogTitle>
            <DialogDescription>High resolution examination of {product.name}</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full min-h-[85vh] flex items-center justify-center">
            <Image 
              src={activeImage.url} 
              alt={activeImage.alt || product.name} 
              fill 
              className="object-contain"
              priority
            />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 text-white text-center shadow-2xl">
              <p className="text-xl font-display font-bold">{product.name}</p>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mt-2">{activeImage.alt || 'Artisan Focus'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky CTA Bar */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-border z-50 shadow-[0_-15px_50px_rgba(0,0,0,0.1)] transition-transform duration-500",
        isScrolled ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex items-center gap-6">
          <div className="shrink-0 pl-2">
            <p className="text-[10px] font-black text-primary/50 uppercase tracking-widest mb-0.5">Value</p>
            <p className="text-2xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</p>
          </div>
          <Button 
            onClick={handleAddToCart} 
            disabled={product.stock <= 0}
            className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-base shadow-xl active:scale-95 transition-all"
          >
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
