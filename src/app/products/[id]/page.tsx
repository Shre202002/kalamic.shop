"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  ShieldCheck, 
  Undo2, 
  Loader2, 
  ChevronRight,
  Package,
  MessageSquare,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, getProductBySlug, getFeaturedProducts } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { addToWishlist, getWishlistItems, removeFromWishlist } from '@/lib/actions/user-actions';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Review Form State
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const id = params.id as string;
        let data = await getProductById(id);
        if (!data) data = await getProductBySlug(id);
        
        if (data) {
          setProduct(data);
          const [featured, reviewData] = await Promise.all([
            getFeaturedProducts(),
            getProductReviews(data._id || data.id)
          ]);
          setRelatedProducts(featured.filter((p: any) => (p._id || p.id) !== (data._id || data.id)).slice(0, 4));
          setReviews(reviewData);

          // Check if favorited
          if (user) {
            const wishlist = await getWishlistItems(user.uid);
            const productId = data._id || data.id;
            setIsFavorited(wishlist.some((item: any) => item.productId === productId));
          }
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.id, user]);

  const handleAddToCart = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to add items to your cart." });
      return;
    }

    const id = product._id || product.id;
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      name: product.name,
      priceAtAddToCart: product.price,
      imageUrl: product.images?.[0] || `https://picsum.photos/seed/${id}/600/600`,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your shopping bag.`,
    });
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to checkout." });
      return;
    }

    const id = product._id || product.id;
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      name: product.name,
      priceAtAddToCart: product.price,
      imageUrl: product.images?.[0] || `https://picsum.photos/seed/${id}/600/600`,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    router.push('/cart');
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to save favorites." });
      return;
    }

    const productId = product._id || product.id;
    try {
      if (isFavorited) {
        await removeFromWishlist(user.uid, productId);
        setIsFavorited(false);
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your favorites.`,
        });
      } else {
        await addToWishlist(user.uid, product);
        setIsFavorited(true);
        toast({
          title: "Saved to wishlist",
          description: `${product.name} is now in your favorites.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Wishlist Error",
        description: "Could not update favorites. Please try again.",
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Kalamic | ${product.name}`,
      text: product.short_description || `Check out this handcrafted ${product.name} from Kalamic!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Product link copied to clipboard.",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    if (!newReview.comment.trim()) {
      toast({ variant: "destructive", title: "Review Required", description: "Please write a comment for your review." });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const review = await submitReview({
        productId: product._id || product.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous Artisan',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        rating: newReview.rating,
        comment: newReview.comment
      });

      setReviews([review, ...reviews]);
      setIsReviewDialogOpen(false);
      setNewReview({ rating: 5, comment: '' });
      toast({ title: "Review Submitted", description: "Thank you for sharing your experience with this creation." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit review at this time." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Piece Not Found</h1>
          <p className="text-muted-foreground mb-8">The artisan treasure you're looking for might have been retired.</p>
          <Button onClick={() => router.push('/products')}>Back to Catalog</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [`https://picsum.photos/seed/${product.slug}/800/800`];
  
  // Dynamic Review Calculations
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)) 
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-primary transition-colors">Collection</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 relative">
            
            {/* Gallery */}
            <div className="lg:col-span-5 space-y-4">
              <div className="lg:sticky lg:top-24">
                <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-lg border border-primary/5">
                  <Image src={images[selectedImage]} alt={product.name} fill className="object-cover animate-fade-in" priority />
                  {product.compare_at_price && (
                    <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">SALE</Badge>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img: string, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedImage(i)} 
                        className={`relative min-w-[80px] h-[80px] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-accent uppercase tracking-widest">{product.tags?.[0] || 'Handcrafted Ceramic'}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 py-1">
                  <div className="flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-100">
                    <span className="text-sm font-bold text-green-700 mr-1">{averageRating || 'New'}</span>
                    <Star className="h-3 w-3 fill-green-700 text-green-700" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium underline underline-offset-4 cursor-pointer hover:text-primary transition-colors" onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}>
                    {reviewCount} Ratings & Reviews
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">₹{(product.price).toFixed(2)}</span>
                  {product.compare_at_price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">₹{Number(product.compare_at_price).toFixed(2)}</span>
                      <span className="text-sm font-bold text-green-600">
                        {Math.round(((Number(product.compare_at_price) - product.price) / Number(product.compare_at_price)) * 100)}% off
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">inclusive of all taxes</p>
              </div>

              {product.short_description && (
                <p className="text-sm italic text-muted-foreground border-l-4 border-accent pl-4 py-1 bg-accent/5 rounded-r-lg">
                  {product.short_description}
                </p>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" /> Product Highlights
                </h3>
                <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                  {product.tags && product.tags.length > 0 ? product.tags.map((tag: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" /> {tag}
                    </li>
                  )) : (
                    <>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Genuine Indian Ceramic</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Kiln-fired for durability</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Hand-painted heritage motifs</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-primary">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>

            {/* Sidebar Actions - Fixed on Scroll */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24 space-y-4">
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className="text-sm font-bold text-primary">{product.stock > 0 ? 'Available Now' : 'Limited Edition'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold border-accent text-accent">FAST SHIP</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <Button onClick={handleAddToCart} className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
                      </Button>
                      <Button onClick={handleBuyNow} variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-bold rounded-xl transition-all active:scale-95">
                        <Zap className="mr-2 h-5 w-5 fill-current" /> Buy It Now
                      </Button>
                    </div>

                    <div className="pt-4 space-y-3 text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Truck className="h-4 w-4 text-accent" />
                        <span>Expected Delivery: <b>Within 5-7 Days</b></span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-accent" />
                        <span>Authenticity Guaranteed</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Undo2 className="h-4 w-4 text-accent" />
                        <span>Fragile-Safe Packaging</span>
                      </div>
                    </div>

                    <Separator className="opacity-50" />
                    
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAddToWishlist} 
                        className={cn(
                          "text-xs font-bold gap-2 rounded-full transition-colors",
                          isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} /> {isFavorited ? 'Favorited' : 'Wishlist'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleShare} className="text-xs font-bold gap-2 rounded-full text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 rounded-xl border bg-white flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">K</div>
                  <div>
                    <p className="text-xs font-bold text-primary">Kalamic Artisan Studio</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Verified Master Craftsman</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t">
            <div className="lg:col-span-2 space-y-12">
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-primary border-b pb-2">Technical Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {product.technical_details ? (
                    Object.entries(product.technical_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-muted/30 py-2">
                        <span className="text-sm font-bold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-primary font-medium">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center bg-muted/20 rounded-xl border border-dashed">
                      <p className="text-sm text-muted-foreground">Technical specifications are being verified by our artisans.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Reviews */}
              <section className="space-y-8" id="reviews">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-primary">Collector Reviews</h2>
                  
                  {user ? (
                    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full font-bold">Write Your Story</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-background">
                        <DialogHeader>
                          <DialogTitle className="text-primary font-bold">Rate this Creation</DialogTitle>
                          <DialogDescription>Your feedback helps our community discover unique craftsmanship.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label className="font-bold text-primary">Overall Experience</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })} className="focus:outline-none transition-transform active:scale-90">
                                  <Star className={`h-8 w-8 ${newReview.rating >= star ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold text-primary">Detailed Feedback</Label>
                            <Textarea 
                              value={newReview.comment} 
                              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} 
                              placeholder="Describe the texture, the glaze, and how it fits your space..." 
                              className="min-h-[120px] rounded-xl"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="w-full h-12 font-bold shadow-lg shadow-primary/20">
                            {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Share Artisan Review
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full font-bold" asChild><Link href="/auth/login">Login to Review</Link></Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center md:text-left bg-white p-8 rounded-3xl shadow-sm border border-primary/5">
                    <p className="text-6xl font-extrabold text-primary">{averageRating}</p>
                    <div className="flex justify-center md:justify-start gap-1 my-3">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-5 w-5 ${averageRating >= i ? 'fill-accent text-accent' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">
                      {reviewCount} Verified collector{reviewCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white shadow-sm border border-primary/5 space-y-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted border-2 border-primary/5">
                                <Image src={review.userAvatar || `https://picsum.photos/seed/${review.userId}/100/100`} alt={review.userName} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">{review.userName}</p>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-3 w-3 ${review.rating > i ? 'fill-accent text-accent' : 'text-muted-foreground/20'}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-accent/20 pl-4">
                            "{review.comment}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-bold text-muted-foreground/50">Become the First Storyteller</p>
                        <p className="text-sm text-muted-foreground/40 mt-1 max-w-xs mx-auto">Share your experience with this handcrafted piece and help other collectors.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Sticky Similar Treasures Column */}
            <div className="space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  <h2 className="text-xl font-bold text-primary">Similar Treasures</h2>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {relatedProducts.map(related => (
                    <ProductCard 
                      key={related._id || related.id} 
                      id={related._id || related.id} 
                      slug={related.slug} 
                      name={related.name} 
                      price={related.price} 
                      image={related.images?.[0] || 'https://placehold.co/200x200'} 
                      rating={related.averageRating || 4.8} 
                      tag={related.tags?.[0] || "Artisan"} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
