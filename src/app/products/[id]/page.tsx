
"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  MapPin
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
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Review Form State
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const wishlistDocQuery = useMemoFirebase(() => {
    const id = product?._id || product?.id;
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
  }, [firestore, user, product]);

  const { data: wishlistDoc } = useDoc(wishlistDocQuery);
  const isFavorited = !!wishlistDoc;

  useEffect(() => {
    async function loadData() {
      try {
        const id = params.id as string;
        const data = await getProductById(id);
        
        if (data) {
          setProduct(data);
          incrementProductViews(data._id); // Atomic backend increment

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

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF4EB]"><Loader2 className="animate-spin text-primary h-10 w-10" /><p className="mt-4 text-primary font-body font-bold uppercase tracking-widest text-[10px]">Curating Piece...</p></div>;
  if (!product) return <div className="p-20 text-center bg-[#FAF4EB] min-h-screen flex flex-col items-center justify-center"><h1 className="text-3xl font-display font-semibold text-primary mb-6">Piece Not Found</h1><Button asChild className="rounded-2xl h-12 px-8 font-body"><Link href="/products">Return to Shop</Link></Button></div>;

  const discountPercent = product.compare_at_price ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
  
  const stockInfo = product.stock > 5 
    ? { label: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' }
    : product.stock > 0 
      ? { label: `Only ${product.stock} pieces left`, color: 'text-orange-600', bg: 'bg-orange-50' }
      : { label: 'Currently Out of Stock', color: 'text-red-600', bg: 'bg-red-50' };

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const currentImage = galleryImages[selectedImage] || galleryImages[0] || { url: 'https://placehold.co/800x800?text=Kalamic', alt: 'Handcrafted Piece' };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      
      {/* SEO & Structured Data */}
      <title>{product.seo?.meta_title || `${product.name} | Kalamic Artisan Shop`}</title>
      <meta name="description" content={product.seo?.meta_description || product.short_description} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": galleryImages.map(i => i.url),
            "description": product.short_description || product.description,
            "sku": product.sku,
            "brand": { "@type": "Brand", "name": "Kalamic" },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": product.price,
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.analytics?.average_rating || 4.8,
              "reviewCount": product.analytics?.review_count || reviews.length || 1
            }
          })
        }}
      />

      <main className="flex-1 py-6 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-body font-bold uppercase tracking-widest text-muted-foreground mb-10 overflow-hidden">
            <Link href="/" className="hover:text-primary transition-colors shrink-0">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/products" className="hover:text-primary transition-colors shrink-0">Collection</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-20">
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-4 border-white group">
                <Image 
                  src={currentImage.url} 
                  alt={currentImage.alt || product.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  priority 
                />
                {discountPercent > 0 && (
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-primary text-white px-4 py-2 rounded-xl shadow-lg font-body font-black uppercase tracking-tighter text-sm border-none">
                      {discountPercent}% OFF
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                {galleryImages.map((img: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(i)} 
                    className={cn(
                      "relative min-w-[90px] h-[90px] rounded-2xl overflow-hidden border-4 transition-all duration-300 shadow-sm", 
                      selectedImage === i ? "border-primary scale-105 shadow-xl" : "border-white opacity-70 hover:opacity-100 hover:border-primary/20"
                    )}
                  >
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-[10px] font-body font-black tracking-[0.1em] uppercase">
                    <Star className="h-3 w-3 fill-current" />
                    {product.analytics?.average_rating || 4.8} / 5.0
                  </div>
                  <span className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-widest border-l pl-4 border-muted/30">
                    {product.analytics?.review_count || reviews.length} Collector Reviews
                  </span>
                </div>
                
                <h1 className="text-[32px] md:text-[44px] font-display font-semibold text-primary tracking-tight leading-[1.1]">{product.name}</h1>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground rounded-lg">
                    SKU: {product.sku || 'KAL-ART-001'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary/60 px-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Authentic Ceramic
                  </div>
                </div>

                <div className="flex items-baseline gap-4 py-2">
                  <span className="text-4xl font-black text-primary tracking-tight">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <div className="flex flex-col">
                      <span className="text-base text-muted-foreground line-through decoration-primary/30 opacity-50">₹{product.compare_at_price.toLocaleString()}</span>
                      <span className="text-[10px] font-black text-accent uppercase">Heritage Savings</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {product.short_description || "A masterfully handcrafted ceramic creation, breathing tradition and elegance into your modern sanctuary."}
                </p>
              </div>

              {/* Engagement Indicators */}
              <div className="flex items-center gap-6 py-4 px-6 bg-white rounded-3xl shadow-sm border border-primary/5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4 text-primary/40" />
                  <span className="text-[10px] font-black uppercase">{product.analytics?.total_views || 0} views</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4 text-accent/40" />
                  <span className="text-[10px] font-black uppercase">{product.analytics?.wishlist_count || 0} saves</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingCart className="h-4 w-4 text-green-600/40" />
                  <span className="text-[10px] font-black uppercase">{product.analytics?.cart_add_count || 0} bags</span>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white shadow-xl space-y-8 relative overflow-hidden">
                <div className="space-y-4">
                  <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", stockInfo.bg, stockInfo.color)}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", stockInfo.color.replace('text', 'bg'))} />
                    {stockInfo.label}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleAddToCart} 
                      disabled={product.stock <= 0} 
                      className="h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all tracking-tight active:scale-95"
                    >
                      <ShoppingCart className="mr-3 h-6 w-6" /> Add to Bag
                    </Button>
                    <Button 
                      onClick={handleAddToWishlist} 
                      variant="outline" 
                      className={cn("h-16 rounded-2xl border-2 font-black transition-all tracking-tight active:scale-95", isFavorited ? "bg-red-50 border-red-100 text-red-500" : "border-muted/30 hover:border-primary")}
                    >
                      <Heart className={cn("mr-3 h-6 w-6", isFavorited && "fill-current")} /> {isFavorited ? 'Favorited' : 'Wishlist'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button 
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied" }); }} 
                    variant="ghost" 
                    className="h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary rounded-xl"
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share Piece
                  </Button>
                  <div className="flex items-center justify-center gap-2 bg-[#FAF4EB] rounded-xl px-4 text-[10px] font-black text-accent uppercase">
                    <ShieldCheck className="h-4 w-4" /> Secure SSL
                  </div>
                </div>
              </div>

              {/* Tabs / Accordion for Rich Info */}
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="narrative" className="border-none">
                  <AccordionTrigger className="p-6 rounded-3xl bg-white shadow-md hover:no-underline group data-[state=open]:rounded-b-none">
                    <span className="flex items-center gap-3 font-display font-semibold text-primary uppercase tracking-widest text-xs">
                      <Info className="h-4 w-4 text-accent" /> The Artisan Narrative
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-8 pt-4 bg-white rounded-b-3xl text-sm font-body text-muted-foreground leading-relaxed italic whitespace-pre-wrap shadow-md border-t border-muted/10">
                    {product.description}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="specs" className="border-none">
                  <AccordionTrigger className="p-6 rounded-3xl bg-white shadow-md hover:no-underline data-[state=open]:rounded-b-none">
                    <span className="flex items-center gap-3 font-display font-semibold text-primary uppercase tracking-widest text-xs">
                      <Package className="h-4 w-4 text-accent" /> Technical Specs
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-8 pt-4 bg-white rounded-b-3xl font-body shadow-md border-t border-muted/10">
                    <div className="grid grid-cols-1 gap-4">
                      {product.specifications?.length > 0 ? product.specifications.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-muted/10 last:border-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.key}</span>
                          <span className="text-[11px] font-bold text-primary">{s.value}</span>
                        </div>
                      )) : <p className="text-xs italic text-muted-foreground">Traditional Hand-molded techniques used.</p>}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping" className="border-none">
                  <AccordionTrigger className="p-6 rounded-3xl bg-white shadow-md hover:no-underline data-[state=open]:rounded-b-none">
                    <span className="flex items-center gap-3 font-display font-semibold text-primary uppercase tracking-widest text-xs">
                      <Truck className="h-4 w-4 text-accent" /> FragileCare™ Shipping
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-8 pt-4 bg-white rounded-b-3xl font-body shadow-md border-t border-muted/10">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-[#FAF4EB] border space-y-1">
                          <div className="flex items-center gap-2 text-accent">
                            <Scale className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Gross Weight</span>
                          </div>
                          <p className="text-sm font-bold text-primary">{product.shipping?.weight_kg || '1.2'} KG</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF4EB] border space-y-1">
                          <div className="flex items-center gap-2 text-accent">
                            <Box className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Dimensions</span>
                          </div>
                          <p className="text-sm font-bold text-primary">
                            {product.shipping?.package_dimensions_cm?.length || '30'}x
                            {product.shipping?.package_dimensions_cm?.width || '30'}x
                            {product.shipping?.package_dimensions_cm?.height || '15'} CM
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 rounded-2xl border-2 border-dashed border-accent/20 bg-accent/[0.02]">
                        <MapPin className="h-5 w-5 text-accent shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-primary mb-1">Pan India Delivery</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Pieces are dispatched within 48-72 hours after artisan inspection. Fragile-specific reinforced packaging guaranteed.</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-primary/5 pb-8">
              <div className="space-y-2">
                <h2 className="text-[28px] md:text-[40px] font-display font-semibold text-primary tracking-tight">Collector Chronicles</h2>
                <p className="text-muted-foreground font-body font-bold text-[10px] uppercase tracking-widest">Validated feedback from the Kalamic community</p>
              </div>
              <div className="flex items-center gap-4 font-body">
                <div className="text-right hidden sm:block">
                  <p className="text-3xl font-black text-primary leading-none">{product.analytics?.average_rating || 4.8}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Studio Average</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center text-white shadow-2xl shadow-accent/20">
                  <MessageSquare className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Write a Review */}
              <div className="lg:col-span-4">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white sticky top-24">
                  <CardContent className="p-8 space-y-6">
                    <h3 className="text-xl font-black text-primary flex items-center gap-3">
                      <Zap className="h-5 w-5 text-accent" /> Share Your Review
                    </h3>
                    
                    {user ? (
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Artisan Rating</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                  reviewRating >= star ? "bg-accent text-white shadow-lg" : "bg-[#FAF4EB] text-muted-foreground"
                                )}
                              >
                                <Star className={cn("h-5 w-5", reviewRating >= star && "fill-current")} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Perspective</Label>
                          <textarea
                            required
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Describe the texture, the patterns, and the aesthetic fit..."
                            className="w-full h-32 p-4 rounded-2xl bg-[#FAF4EB] border-none focus:ring-2 focus:ring-accent text-sm font-medium resize-none"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={isSubmittingReview} 
                          className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/10"
                        >
                          {isSubmittingReview ? <Loader2 className="animate-spin h-5 w-5" /> : "Immortalize Review"}
                        </Button>
                      </form>
                    ) : (
                      <div className="p-8 rounded-3xl bg-muted/20 border border-dashed text-center space-y-4">
                        <Lock className="mx-auto h-8 w-8 text-muted-foreground opacity-30" />
                        <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">Please sign in to share your collector experience.</p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-primary text-primary font-black">
                          <Link href="/auth/login">Authenticated Login</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Review List */}
              <div className="lg:col-span-8 space-y-8">
                {reviews.length > 0 ? reviews.map((review, idx) => (
                  <div key={idx} className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-primary/5 space-y-4 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                          {review.user_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-primary">{review.user_name || 'Artisan Collector'}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dayjs(review.createdAt).format('DD MMM YYYY')}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-accent">
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
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                    <p className="text-lg font-display font-semibold text-muted-foreground">Be the first to share your perspective</p>
                    <p className="text-xs font-medium text-muted-foreground/60 mt-2">Acquire this piece and help other collectors decide.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sticky Add to Cart */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Total Piece Value</p>
            <p className="text-xl font-black text-primary">₹{product.price.toLocaleString()}</p>
          </div>
          <Button 
            onClick={handleAddToCart} 
            disabled={product.stock <= 0}
            className="flex-[2] h-14 rounded-2xl bg-primary text-white font-black text-base shadow-xl"
          >
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
