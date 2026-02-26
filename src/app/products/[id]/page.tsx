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
  CheckCircle2,
  Tag,
  Package,
  StarHalf,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, getProductBySlug, getFeaturedProducts } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
            getProductReviews(data._id)
          ]);
          setRelatedProducts(featured.filter((p: any) => p._id !== data._id).slice(0, 4));
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

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to save favorites." });
      return;
    }

    const id = product._id || product.id;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    await setDoc(wishlistItemRef, {
      id,
      productId: id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0] || `https://picsum.photos/seed/${id}/600/600`,
      addedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Saved to wishlist",
      description: `${product.name} is now in your favorites.`,
    });
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
        productId: product._id,
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
  const averageRating = product.averageRating || 4.8;
  const reviewCount = reviews.length || product.reviewCount || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-primary">Collection</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* Gallery */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24">
                <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-lg border border-primary/5">
                  <Image src={images[selectedImage]} alt={product.name} fill className="object-cover animate-fade-in" priority />
                  {product.compare_at_price && (
                    <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">SALE</Badge>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img: string, i: number) => (
                      <button key={i} onClick={() => setSelectedImage(i)} className={`relative min-w-[80px] h-[80px] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
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
                <p className="text-xs font-bold text-accent uppercase tracking-widest">{product.category_id || 'Handcrafted Ceramic'}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 py-1">
                  <div className="flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-100">
                    <span className="text-sm font-bold text-green-700 mr-1">{averageRating}</span>
                    <Star className="h-3 w-3 fill-green-700 text-green-700" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium underline underline-offset-4 cursor-pointer">
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

              <div className="p-4 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2 text-accent font-bold text-sm"><Tag className="h-4 w-4" /> Available Offers</div>
                <ul className="space-y-2 text-xs md:text-sm">
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span><b>Bank Offer</b> 10% instant discount on Axis Bank Credit Cards.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span><b>Artisan Direct</b> Get 5% extra off on your first handcrafted order.</span></li>
                </ul>
              </div>

              {product.short_description && (
                <p className="text-sm italic text-muted-foreground border-l-4 border-accent pl-4">
                  {product.short_description}
                </p>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-primary">Product Highlights</h3>
                <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                  {product.tags?.map((tag: string, i: number) => (
                    <li key={i} className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> {tag}</li>
                  )) || (
                    <>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Genuine Indian Ceramic</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Kiln-fired for durability</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Hand-painted heritage motifs</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="font-bold text-primary">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold">{product.stock > 0 ? 'In Stock' : 'Limited Edition'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold">FAST SHIP</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Button onClick={handleAddToCart} className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
                      </Button>
                      <Button onClick={() => router.push('/cart')} variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-bold rounded-xl">
                        Buy Now
                      </Button>
                    </div>

                    <div className="pt-4 space-y-3 text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground"><Truck className="h-4 w-4 text-accent" /><span>Delivery by <b>Tuesday, Mar 4</b></span></div>
                      <div className="flex items-center gap-3 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" /><span>7 Days Replacement Policy</span></div>
                      <div className="flex items-center gap-3 text-muted-foreground"><Undo2 className="h-4 w-4 text-accent" /><span>Authentic Artisan Product</span></div>
                    </div>

                    <Separator />
                    
                    <div className="flex items-center justify-center gap-4 pt-2">
                      <Button variant="ghost" size="sm" onClick={handleAddToWishlist} className="text-xs font-bold gap-2 rounded-full"><Heart className="h-4 w-4" /> Save to Wishlist</Button>
                      <Button variant="ghost" size="sm" className="text-xs font-bold gap-2 rounded-full"><Share2 className="h-4 w-4" /> Share Piece</Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">K</div>
                  <div>
                    <p className="text-xs font-bold">Sold by Kalamic Studio</p>
                    <p className="text-[10px] text-muted-foreground font-medium">4.9 ★ Rating over 1000+ sales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t">
            <div className="lg:col-span-2 space-y-12">
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-primary">Technical Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {product.technical_details && Object.entries(product.technical_details).length > 0 ? (
                    Object.entries(product.technical_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b py-2">
                        <span className="text-sm font-bold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-primary font-medium">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between border-b py-2"><span className="text-sm font-bold text-muted-foreground">Material</span><span className="text-sm text-primary font-medium">Clay/Ceramic</span></div>
                      <div className="flex justify-between border-b py-2"><span className="text-sm font-bold text-muted-foreground">Firing Method</span><span className="text-sm text-primary font-medium">Kiln-fired (1200°C)</span></div>
                    </>
                  )}
                </div>
              </section>

              {/* Reviews */}
              <section className="space-y-8" id="reviews">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-primary">Customer Reviews</h2>
                  
                  {user ? (
                    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full">Write a Review</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Rate this Masterpiece</DialogTitle>
                          <DialogDescription>Share your experience with other ceramic enthusiasts.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <Label>Artisan Rating</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })} className="focus:outline-none">
                                  <Star className={`h-8 w-8 ${newReview.rating >= star ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Your Comment</Label>
                            <Textarea 
                              value={newReview.comment} 
                              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} 
                              placeholder="What do you love about this piece? How was the packaging?" 
                              className="min-h-[120px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="w-full">
                            {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Submit Artisan Review
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-full" asChild><Link href="/auth/login">Login to Review</Link></Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center md:text-left">
                    <p className="text-5xl font-extrabold text-primary">{averageRating}</p>
                    <div className="flex justify-center md:justify-start gap-1 my-2">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${averageRating >= i ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />)}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Based on {reviewCount} verified reviews</p>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white shadow-sm border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                <Image src={review.userAvatar || `https://picsum.photos/seed/${review.userId}/100/100`} alt={review.userName} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">{review.userName}</p>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => <Star key={i} className={`h-2.5 w-2.5 ${review.rating > i ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />)}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed italic">"{review.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
                        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                        <p className="text-sm text-muted-foreground">No reviews yet for this masterpiece. Be the first!</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-primary">Similar Treasures</h2>
              <div className="grid grid-cols-1 gap-6">
                {relatedProducts.map(related => (
                  <ProductCard key={related._id} id={related._id} slug={related.slug} name={related.name} price={related.price} image={related.images?.[0] || 'https://placehold.co/200x200'} rating={4.8} category="Recommended" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
