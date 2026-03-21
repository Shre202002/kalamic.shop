
"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Paper,
  Box as MuiBox,
  alpha as muiAlpha
} from '@mui/material';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  Package, 
  MessageSquare, 
  Lock, 
  CheckCircle2, 
  Box, 
  Scale, 
  MapPin, 
  Maximize2, 
  ArrowLeft,
  X,
  RefreshCcw,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, trackProductAction, untrackWishlistAction, incrementProductViews, getProducts } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { ProductCard } from '@/components/product/ProductCard';

const primarySaffron = '#EA781E';
const warmCream = '#FAF4EB';
const darkTerracotta = '#271E1B';

const alpha = (color: string, opacity: number) => {
  return muiAlpha(color, opacity);
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const productId = typeof params?.id === 'string' ? params.id : '';

  const wishlistDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !productId) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
  }, [firestore, user, productId]);

  const { data: wishlistDoc } = useDoc(wishlistDocRef);
  const isFavorited = !!wishlistDoc;

  useEffect(() => {
    if (!product?.images?.length || isSliderPaused) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [product, isSliderPaused]);

  async function loadData() {
    if (!productId) return;
    try {
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
        incrementProductViews(data._id);
        
        // Fetch Parallel Data
        const [reviewData, allProducts] = await Promise.all([
          getProductReviews(data._id),
          getProducts()
        ]);
        
        setReviews(reviewData);
        
        // Filter Related Products (same category, excluding current)
        const related = allProducts
          .filter((p: any) => p.category_id === data.category_id && p._id !== data._id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!user || !firestore || !product) {
      toast({ title: "Please sign in", description: "You need an account to add items to your cart." });
      router.push('/auth/login');
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
    if (!user || !firestore || !product) {
      toast({ title: "Please sign in", description: "You need an account to save pieces." });
      return;
    }
    const id = product._id;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    try {
      if (isFavorited) {
        await deleteDoc(wishlistItemRef);
        await untrackWishlistAction(id);
        toast({ title: "Removed from favorites" });
      } else {
        await setDoc(wishlistItemRef, {
          id,
          productId: id,
          name: product.name,
          price: product.price ?? 0,
          imageUrl: product.images?.[0]?.url,
          addedAt: new Date().toISOString()
        });
        await trackProductAction(id, 'wishlist_count');
        toast({ title: "Saved to wishlist" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  const handleShare = async () => {
    if (!product) return;
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
      const response = await submitReview({
        productId: product._id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Collector",
        userAvatar: user.photoURL || undefined,
        rating: reviewRating,
        reviewText: reviewComment,
      });
      
      if (response.success) {
        setReviewComment('');
        setReviewRating(5);
        await loadData();
        toast({ title: "Feedback Saved", description: "Your experience has been shared." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (!product) return <div className="p-20 text-center"><h1 className="text-3xl font-display font-semibold mb-6">Piece Not Found</h1><Button asChild><Link href="/products">Return to Shop</Link></Button></div>;

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl pt-6 md:pt-12">
          
          {/* Back Navigation */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
            <Link href="/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to Collection
            </Link>
          </motion.div>

          {/* Top Header Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 items-start">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="lg:col-span-7 space-y-6 lg:sticky lg:top-28 self-start">
              <div 
                className="relative aspect-square rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl bg-white border-2 sm:border-4 border-white group"
                onMouseEnter={() => setIsSliderPaused(true)}
                onMouseLeave={() => setIsSliderPaused(false)}
              >
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={cn("absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-zoom-in", activeImageIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0")}
                    onClick={() => { setLightboxImage(img.url); setIsLightboxOpen(true); }}
                  >
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority={idx === 0} sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                ))}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-20 flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 drop-shadow-xl" />
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {galleryImages.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("h-1.5 rounded-full transition-all", activeImageIndex === idx ? "w-8 bg-primary shadow-lg" : "w-2 bg-white/50 hover:bg-white")} />
                  ))}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="px-4">
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                      {galleryImages.map((img, idx) => (
                        <CarouselItem key={idx} className="pl-4 basis-1/4 sm:basis-1/5 md:basis-1/6">
                          <div className={cn("relative aspect-square rounded-2xl overflow-hidden border-2 shadow-md cursor-pointer transition-all", activeImageIndex === idx ? "border-primary scale-90 ring-4 ring-primary/10" : "border-white hover:border-primary/30")} onClick={() => setActiveImageIndex(idx)}>
                            <Image src={img.url} alt={img.alt || `Angle ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 25vw, 15vw" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-5 space-y-8 sm:space-y-10">
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-display font-semibold text-foreground tracking-tight leading-[1.1]">{product.name}</h1>
                
                {product.short_description && (
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4">
                    {product.short_description}
                  </p>
                )}

                <div className="flex items-baseline gap-5 py-2">
                  <span className="text-3xl sm:text-4xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <span className="text-lg text-muted-foreground line-through decoration-primary/30 opacity-40 font-semibold">₹{product.compare_at_price.toLocaleString()}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button size="lg" onClick={handleBuyNow} className="w-full h-16 md:h-20 rounded-2xl gradient-saffron text-primary-foreground font-bold text-lg px-10 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <ShoppingCart className="mr-3 h-6 w-6" /> Buy Now
                  </Button>
                </div>

                {/* Delivery Info Strip */}
                <div className="grid grid-cols-3 gap-px bg-border border rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-white p-4 flex flex-col items-center text-center gap-2">
                    <Truck className="h-4 w-4 text-primary/80" />
                    <div>
                      <p className="font-black text-[10px] leading-tight uppercase">5–7 Business Days</p>
                      <p className="text-muted-foreground text-[8px] font-medium leading-tight">FragileCare™ Shipping</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 flex flex-col items-center text-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-primary/80" />
                    <div>
                      <p className="font-black text-[10px] leading-tight uppercase">48hr Damage Claims</p>
                      <p className="text-muted-foreground text-[8px] font-medium leading-tight">Report within 48 hours</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary/80" />
                    <div>
                      <p className="font-black text-[10px] leading-tight uppercase">100% Handmade</p>
                      <p className="text-muted-foreground text-[8px] font-medium leading-tight">Certified artisan craft</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-14 md:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-primary/20 text-primary font-black text-sm"><Link href={`https://wa.me/916387562920?text=Hi, I am interested in ${encodeURIComponent(product.name)}`} target="_blank">Enquire Now</Link></Button>
                  <Button onClick={handleShare} variant="outline" className="h-14 md:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-border text-muted-foreground font-black text-sm">Share Piece</Button>
                </div>
              </div>

              {/* Trust Indicators Row */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary/60" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Secure SSL</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <MapPin className="h-5 w-5 text-primary/60" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pan India</p>
                </div>
                <button onClick={handleAddToWishlist} className="flex flex-col items-center text-center gap-2 group outline-none">
                  <div className={cn("h-10 w-10 rounded-full transition-all flex items-center justify-center", isFavorited ? "bg-primary/10 text-primary" : "bg-muted text-primary/60 group-hover:bg-primary/5")}>
                    <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">{isFavorited ? "In Wishlist" : "Wishlist"}</p>
                </button>
              </div>
            </motion.div>
          </div>

          {/* BODY CONTENT - LINEAR SECTIONS */}
          
          {/* Section 1: The Artisan's Narrative */}
          <section className="py-20 border-t border-primary/10">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-10 bg-primary rounded-full" />
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">The Artisan's Narrative</h2>
              </div>
              <div className="prose prose-stone max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {product.description}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Technical Precision */}
          <section className="py-20 border-t border-primary/10">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-10 bg-primary rounded-full" />
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Technical Precision</h2>
              </div>
              <TableContainer component={Paper} elevation={0} className="rounded-[2.5rem] border border-primary/10 overflow-hidden bg-white/50 backdrop-blur-sm">
                <Table>
                  <TableBody>
                    {(product.specifications || []).map((spec: any, i: number) => (
                      <TableRow key={i} className="hover:bg-primary/[0.02] transition-colors" sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:nth-of-type(odd)': { bgcolor: muiAlpha('#C97A40', 0.01) } }}>
                        <TableCell className="border-primary/5 py-5 sm:py-6"><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">{spec.key}</span></TableCell>
                        <TableCell align="right" className="border-primary/5 py-5 sm:py-6"><span className="text-xs sm:text-sm font-bold text-primary">{spec.value}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </section>

          {/* Section 3: Gallery of Details */}
          <section className="py-20 border-t border-primary/10">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-1 w-10 bg-primary rounded-full" />
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Gallery of Details</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {galleryImages.map((img, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="relative aspect-square rounded-[2rem] overflow-hidden bg-white shadow-lg cursor-zoom-in"
                  onClick={() => { setLightboxImage(img.url); setIsLightboxOpen(true); }}
                >
                  <Image src={img.url} alt={img.alt || `View ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Section 4: You May Also Cherish (Related Products) */}
          {relatedProducts.length > 0 && (
            <section className="py-20 border-t border-primary/10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-10 bg-primary rounded-full" />
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">You May Also Cherish</h2>
                </div>
                <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px]">
                  <Link href="/products" className="flex items-center gap-2">View All <ChevronRight size={14} /></Link>
                </Button>
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
                    tag={p.tags?.[0]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Collector's Testimonials (Reviews) */}
          <section className="py-20 border-t border-primary/10">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-1 w-10 bg-primary rounded-full" />
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Collector's Testimonials</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                <Paper sx={{ p: 4, borderRadius: '2.5rem', bgcolor: alpha(primarySaffron, 0.03), border: 'none' }}>
                  <h3 className="text-xl font-black text-primary tracking-tight mb-6">Aggregate Rating</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-primary">{product.analytics?.average_rating?.toFixed(1) || '5.0'}</div>
                    <div className="space-y-1">
                      <div className="flex text-accent">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={cn("h-4 w-4", i <= Math.round(product.analytics?.average_rating || 5) ? "fill-current" : "opacity-20")} />
                        ))}
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Based on {reviews.length} reviews</p>
                    </div>
                  </div>
                </Paper>

                {user ? (
                  <Paper sx={{ p: 4, borderRadius: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
                    <div className="space-y-2 mb-6">
                      <h4 className="text-lg font-black text-primary uppercase tracking-tight">Share Your Experience</h4>
                      <p className="text-xs text-muted-foreground font-medium">How would you describe this handcrafted piece?</p>
                    </div>
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Your Rating</Label>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map((star) => (
                            <button key={star} type="button" onClick={() => setReviewRating(star)} className="group focus:outline-none">
                              <Star className={cn("h-8 w-8 transition-all duration-300", star <= reviewRating ? "text-accent fill-current scale-110" : "text-muted-foreground opacity-30 hover:scale-105")} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Testimonial</Label>
                        <textarea required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Describe the texture, the intricate patterns..." className="w-full h-32 p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm font-medium resize-none shadow-inner" />
                      </div>
                      <Button type="submit" disabled={isSubmittingReview} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10">
                        {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Testimonial"}
                      </Button>
                    </form>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 5, borderRadius: '2.5rem', bgcolor: alpha('#000', 0.02), border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                    <Lock className="mx-auto h-8 w-8 text-primary opacity-20 mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase leading-relaxed tracking-widest mb-6">Sign in to share your experience.</p>
                    <Button asChild variant="outline" className="w-full rounded-2xl border-primary text-primary font-black text-xs h-12 hover:bg-primary hover:text-white transition-all"><Link href="/auth/login">Join the Community</Link></Button>
                  </Paper>
                )}
              </div>

              <div className="lg:col-span-8 space-y-6">
                {reviews.length === 0 ? (
                  <div className="py-20 text-center bg-muted/20 rounded-[3rem] border border-dashed border-primary/10 px-8">
                    <MessageSquare className="mx-auto h-16 w-16 text-primary opacity-10 mb-6" />
                    <p className="text-muted-foreground font-medium italic">"Every masterpiece awaits its first collector's voice."</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviews.map((review, idx) => (
                      <Paper key={idx} sx={{ p: 4, borderRadius: '2.5rem', bgcolor: 'white', border: '1px solid', borderColor: 'divider', transition: 'all 0.3s', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.05)' } }}>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black overflow-hidden shadow-inner text-sm uppercase">
                              {review.user_avatar ? <img src={review.user_avatar} className="h-full w-full object-cover" /> : review.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground flex items-center gap-2">{review.user_name || 'Collector'} {review.is_verified_purchase && <CheckCircle2 className="h-3 w-3 text-green-500" />}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{dayjs(review.createdAt).format('DD MMM YYYY')}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-primary">
                            {[...Array(5)].map((_, i) => <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-current" : "opacity-20")} />)}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">"{review.comment || review.review_text}"</p>
                      </Paper>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 6: Shipping & FAQs (Rest Page Content) */}
          <section className="py-20 border-t border-primary/10">
            <div className="text-center space-y-4 mb-16 px-4">
              <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground tracking-tight">FragileCare™ Shipping</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">Expert Logistics for Handcrafted Masterpieces</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-20">
              <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white shadow-xl border border-border space-y-4 transition-all hover:border-primary/20">
                <Scale className="h-6 w-6 text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Weight Metrics</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">Artisan weight verified at {product.shipping?.weight_kg || '1.2'} KG.</p>
              </div>
              <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white shadow-xl border border-border space-y-4 transition-all hover:border-primary/20">
                <Box className="h-6 w-6 text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Package Profile</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">Dimensions: {product.shipping?.package_dimensions_cm?.length || '30'}x{product.shipping?.package_dimensions_cm?.width || '30'}x{product.shipping?.package_dimensions_cm?.height || '15'} CM.</p>
              </div>
              <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-primary text-white shadow-xl space-y-4 md:col-span-2 lg:col-span-1">
                <Truck className="h-6 w-6" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">FragileCare™ Priority</h4>
                <p className="text-sm opacity-80 leading-relaxed text-white font-medium">Every ceramic treasure is encased in reinforced honeycomb padding and insured transit.</p>
              </div>
            </div>

            {product.faqs?.length > 0 && (
              <div className="max-w-4xl mx-auto px-4">
                <div className="text-center space-y-4 mb-16">
                  <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground">Curiosity Corner</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Artisanal FAQ & Preservation</p>
                </div>
                <Accordion type="single" collapsible className="space-y-4">
                  {product.faqs.map((faq: any, i: number) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-white overflow-hidden data-[state=open]:border-primary/30 transition-all shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <span className="text-left font-black text-foreground text-sm sm:text-base">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 text-muted-foreground leading-relaxed text-sm font-medium">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
              <X className="h-10 w-10" />
            </button>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl aspect-square" onClick={e => e.stopPropagation()}>
              <Image src={lightboxImage} alt="Fullscreen" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
