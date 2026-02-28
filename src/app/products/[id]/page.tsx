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
  Lock
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
        await untrackWishlistAction(productId); // Backend $inc: -1
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
        await trackProductAction(productId, 'wishlist_count'); // Backend $inc: +1
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

  const currentImage = product.images?.[selectedImage] || product.images?.[0] || { url: 'https://placehold.co/800x800?text=Kalamic', alt: 'Handcrafted Piece' };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 py-6 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-body font-bold uppercase tracking-widest text-muted-foreground mb-10 overflow-hidden">
            <Link href="/" className="hover:text-primary transition-colors shrink-0">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/products" className="hover:text-primary transition-colors shrink-0">Catalog</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 mb-20">
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-4 border-white">
                <Image 
                  src={currentImage.url} 
                  alt={currentImage.alt || product.name} 
                  fill 
                  className="object-cover" 
                  priority 
                  loading="eager"
                />
                <div className="absolute top-6 left-6">
                  <Badge className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full shadow-lg font-body font-bold uppercase tracking-widest text-[10px] border-none">
                    {product.tags?.[0] || 'Original'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {product.images?.map((img: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(i)} 
                    className={cn(
                      "relative min-w-[80px] h-[80px] rounded-3xl overflow-hidden border-4 transition-all duration-300 shadow-md", 
                      selectedImage === i ? "border-primary scale-105" : "border-white opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-body font-bold tracking-widest uppercase">
                    <Star className="h-3 w-3 fill-current" />
                    {product.analytics?.average_rating || 4.8}
                  </div>
                  <span className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-widest">
                    {product.analytics?.review_count || reviews.length} Authenticated Reviews
                  </span>
                </div>
                <h1 className="text-[32px] md:text-[48px] font-display font-semibold text-primary tracking-tight leading-[1.15]">{product.name}</h1>
                <div className="flex items-center gap-4 font-body">
                  <span className="text-3xl font-bold text-primary tracking-tight">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <span className="text-lg text-muted-foreground line-through decoration-primary/30 opacity-50">₹{product.compare_at_price.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-white shadow-xl space-y-6 font-body">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", product.stock > 0 ? "bg-green-500" : "bg-orange-500")} />
                    <span>{product.stock > 0 ? `Artisan Stock: ${product.stock}` : 'Kiln Processing'}</span>
                  </div>
                  <span className="text-accent">Limited Creation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={handleAddToCart} disabled={product.stock <= 0} className="h-14 rounded-2xl bg-primary text-white font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all tracking-[0.3px]">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
                  </Button>
                  <Button onClick={handleAddToWishlist} variant="outline" className={cn("h-14 rounded-2xl border-2 font-bold transition-all tracking-[0.3px]", isFavorited ? "bg-red-50 border-red-100 text-red-500" : "border-muted/30 hover:border-primary")}>
                    <Heart className={cn("mr-2 h-5 w-5", isFavorited && "fill-current")} /> {isFavorited ? 'Favorited' : 'Wishlist'}
                  </Button>
                </div>

                <Button onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied" }); }} variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
                  <Share2 className="mr-2 h-4 w-4" /> Share Creation
                </Button>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="narrative" className="border-none">
                  <AccordionTrigger className="p-6 rounded-3xl bg-white shadow-md hover:no-underline group">
                    <span className="flex items-center gap-3 font-display font-semibold text-primary uppercase tracking-widest text-xs">
                      <Info className="h-4 w-4 text-accent" /> The Artisan Narrative
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-8 pt-4 text-xs font-body text-muted-foreground leading-[1.6] italic whitespace-pre-wrap">
                    {product.description}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="specs" className="border-none">
                  <AccordionTrigger className="p-6 rounded-3xl bg-white shadow-md hover:no-underline">
                    <span className="flex items-center gap-3 font-display font-semibold text-primary uppercase tracking-widest text-xs">
                      <Package className="h-4 w-4 text-accent" /> Technical Specs
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-8 pt-4 font-body">
                    <div className="grid grid-cols-1 gap-3">
                      {product.specifications?.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-muted/10 last:border-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.key}</span>
                          <span className="text-[10px] font-bold text-primary">{s.value}</span>
                        </div>
                      ))}
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
                <h2 className="text-[24px] md:text-[32px] font-display font-semibold text-primary tracking-tight">Collector Chronicles</h2>
                <p className="text-muted-foreground font-body font-bold text-[10px] uppercase tracking-widest">Voices from the artisan community</p>
              </div>
              <div className="flex items-center gap-4 font-body">
                <div className="text-right hidden sm:block">
                  <p className="text-xl font-bold text-primary leading-none">{product.analytics?.average_rating || 4.8}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Studio Average</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-xl shadow-accent/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-12">
                <p className="text-muted-foreground font-body text-center py-10 italic">Redesigned typography is now live across the platform.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
