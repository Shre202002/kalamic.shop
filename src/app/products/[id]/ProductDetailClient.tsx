
"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Paper,
  alpha as muiAlpha
} from '@mui/material';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  ShieldCheck, 
  Loader2, 
  Maximize2,
  ArrowLeft,
  X,
  MessageSquare,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

export default function ProductDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Review Form State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const hasInitialized = useRef<string | null>(null);

  const productId = typeof params?.id === 'string' ? params.id : '';

  const wishlistDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !productId) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
  }, [firestore, user, productId]);

  const { data: wishlistDoc } = useDoc(wishlistDocRef);
  const isFavorited = !!wishlistDoc;

  async function loadData() {
    if (!productId || hasInitialized.current === productId) return;
    
    try {
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
        hasInitialized.current = data._id;
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
      name: product.name,
      priceAtAddToCart: product.price ?? 0,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    trackProductAction(id, 'cart_add_count');
    toast({ title: "Added to cart", description: `${product.name} added to bag.` });
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    if (!reviewText.trim()) {
      toast({ variant: "destructive", title: "Missing feedback", description: "Please share your thoughts about this piece." });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await submitReview({
        productId: product._id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous Collector',
        userAvatar: user.photoURL || undefined,
        rating,
        reviewText
      });
      
      const updatedReviews = await getProductReviews(product._id);
      setReviews(updatedReviews);
      setReviewText('');
      setRating(5);
      toast({ title: "Feedback shared", description: "Your testimonial has been added to our records." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission failed", description: error.message });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (!product) return <div className="p-20 text-center"><h1 className="text-2xl font-bold mb-4">Piece Not Found</h1><Button asChild><Link href="/products">Back to Shop</Link></Button></div>;

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link href="/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-3 w-3" /> Back to Collection
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-7 space-y-6">
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-white border-4 border-white group">
                <Image 
                  src={galleryImages[activeImageIndex]?.url} 
                  alt={product.name} 
                  fill 
                  className="object-cover cursor-zoom-in" 
                  onClick={() => { setLightboxImage(galleryImages[activeImageIndex].url); setIsLightboxOpen(true); }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10" />
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative h-20 w-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all",
                      activeImageIndex === idx ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={img.url} alt={`Angle ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(product.analytics?.average_rating || 5) ? "fill-current" : "opacity-20")} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">({product.analytics?.review_count || 0} reviews)</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-semibold text-foreground tracking-tight leading-tight">{product.name}</h1>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-black text-primary">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through opacity-40">₹{product.compare_at_price.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed text-base">{product.short_description}</p>
              </div>

              <div className="flex flex-col gap-4">
                <Button size="lg" onClick={handleAddToCart} className="h-16 rounded-2xl gradient-saffron text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95">
                  <ShoppingCart className="mr-3 h-6 w-6" /> Add to Bag
                </Button>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleAddToWishlist} variant="outline" className={cn("h-14 rounded-2xl border-primary/20", isFavorited && "bg-primary/5 text-primary border-primary")}>
                    <Heart className={cn("mr-2 h-5 w-5 transition-colors", isFavorited && "fill-current")} /> {isFavorited ? "Saved" : "Save for later"}
                  </Button>
                  <Button variant="outline" className="h-14 rounded-2xl border-primary/20" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link Copied", description: "Share this masterpiece with others." });
                  }}>
                    <Share2 className="mr-2 h-5 w-5" /> Share
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-primary/10">
                <div className="text-center space-y-1">
                  <ShieldCheck className="h-5 w-5 mx-auto text-primary/60" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Certified</p>
                </div>
                <div className="text-center space-y-1">
                  <Star className="h-5 w-5 mx-auto text-primary/60" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">High Rated</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="h-5 w-5 mx-auto text-primary/60 flex items-center justify-center font-bold text-[10px]">100%</div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Handmade</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="description" className="mb-20">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start p-0 h-auto mb-10 overflow-x-auto no-scrollbar">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">Description</TabsTrigger>
              <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">Specifications</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="prose prose-stone max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">{product.description}</p>
            </TabsContent>
            
            <TabsContent value="specs">
              <TableContainer component={Paper} elevation={0} className="rounded-[2.5rem] border border-primary/10 overflow-hidden bg-white">
                <Table>
                  <TableBody>
                    {(product.specifications || []).map((spec: any, i: number) => (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: muiAlpha('#C97A40', 0.02) } }}>
                        <TableCell className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-6 pl-10 border-primary/5">{spec.key}</TableCell>
                        <TableCell align="right" className="font-bold text-primary py-6 pr-10 border-primary/5 text-sm">{spec.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Review Form / Summary */}
                <div className="lg:col-span-4 space-y-8">
                  <Card className="rounded-[2.5rem] border-none bg-primary/[0.03] p-8 space-y-6">
                    <h3 className="text-2xl font-black text-primary tracking-tight">Collector Feedback</h3>
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
                  </Card>

                  {user ? (
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-lg font-black text-primary uppercase tracking-tight">Share Your Experience</h4>
                        <p className="text-xs text-muted-foreground font-medium">How would you describe this handcrafted piece?</p>
                      </div>
                      
                      <form onSubmit={handleReviewSubmit} className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Rating</Label>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="group focus:outline-none"
                              >
                                <Star className={cn(
                                  "h-8 w-8 transition-all duration-300",
                                  star <= rating ? "text-accent fill-current scale-110" : "text-muted-foreground opacity-30 hover:scale-105"
                                )} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Testimonial</Label>
                          <Textarea 
                            placeholder="Write your review here..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="min-h-[120px] rounded-2xl bg-muted/30 border-none focus-visible:ring-primary p-4"
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={isSubmittingReview}
                          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10"
                        >
                          {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Testimonial"}
                        </Button>
                      </form>
                    </Card>
                  ) : (
                    <Card className="rounded-[2.5rem] border-none bg-muted/50 p-10 text-center space-y-6">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
                      <div className="space-y-2">
                        <h4 className="font-bold text-foreground">Sign In to Review</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Only verified members can share testimonials in our gallery.</p>
                      </div>
                      <Button asChild variant="outline" className="w-full h-12 rounded-xl border-primary/20">
                        <Link href="/auth/login">Access Studio Account</Link>
                      </Button>
                    </Card>
                  )}
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-8 space-y-6">
                  {reviews.length === 0 ? (
                    <div className="py-20 text-center bg-muted/20 rounded-[3rem] border border-dashed border-primary/10 px-8">
                      <p className="text-muted-foreground font-medium italic">"Every masterpiece awaits its first collector's voice."</p>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-primary opacity-40">— Be the first to review —</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <Card key={review._id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-8 flex gap-6">
                            <div className="hidden sm:block">
                              <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/5">
                                {review.user_avatar ? (
                                  <Image src={review.user_avatar} alt={review.user_name} width={56} height={56} className="rounded-2xl object-cover" />
                                ) : (
                                  <UserIcon className="h-6 w-6 opacity-40" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-black text-primary text-base">{review.user_name}</h5>
                                    {review.is_verified_purchase && (
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-[8px] font-black uppercase text-green-600 border border-green-100">
                                        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex text-accent gap-0.5">
                                    {[1,2,3,4,5].map(i => (
                                      <Star key={i} className={cn("h-3 w-3", i <= review.rating ? "fill-current" : "opacity-20")} />
                                    ))}
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                  {dayjs(review.createdAt).format('DD MMM YYYY')}
                                </span>
                              </div>
                              <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {isLightboxOpen && lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
              <X className="h-10 w-10" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-square"
              onClick={e => e.stopPropagation()}
            >
              <Image src={lightboxImage} alt="Fullscreen" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
