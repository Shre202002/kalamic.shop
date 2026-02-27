
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
  Zap,
  Info
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, getFeaturedProducts, trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
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
  
  const wishlistDocQuery = useMemoFirebase(() => {
    const id = product?._id || product?.id;
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
  }, [firestore, user, product]);

  const { data: wishlistDoc } = useDoc(wishlistDocQuery);
  const isFavorited = !!wishlistDoc;

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const id = params.id as string;
        const data = await getProductById(id);
        
        if (data) {
          setProduct(data);
          
          // Increment views via Server Action (atomic $inc)
          incrementProductViews(data._id);

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
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url || `https://picsum.photos/seed/${id}/600/600`,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    trackProductAction(id, 'cart_add_count');

    toast({ title: "Added to cart", description: `${product.name} has been added to your shopping bag.` });
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (user) router.push('/checkout');
  };

  const handleAddToWishlist = async () => {
    if (!user || !firestore) {
      toast({ title: "Please sign in", description: "You need an account to save favorites." });
      return;
    }

    const productId = product._id;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
    
    try {
      if (isFavorited) {
        await deleteDoc(wishlistItemRef);
        untrackWishlistAction(productId);
        toast({ title: "Removed from favorites" });
      } else {
        await setDoc(wishlistItemRef, {
          id: productId,
          productId,
          wishlistId: user.uid,
          slug: product.slug,
          name: product.name,
          price: product.price ?? 0,
          imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url || `https://picsum.photos/seed/${productId}/600/600`,
          addedAt: new Date().toISOString()
        }, { merge: true });

        trackProductAction(productId, 'wishlist_count');
        toast({ title: "Saved to wishlist" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update favorites." });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Kalamic | ${product.name}`,
      text: product.short_description || `Check out this handcrafted ${product.name} from Kalamic!`,
      url: window.location.href,
    };

    try {
      trackProductAction(product._id, 'share_count');
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!" });
      }
    } catch (err) { console.error("Share error:", err); }
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    if (!newReview.comment.trim()) {
      toast({ variant: "destructive", title: "Review Required" });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const review = await submitReview({
        productId: product._id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous Collector',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        rating: newReview.rating,
        comment: newReview.comment
      });

      setReviews([review, ...reviews]);
      setIsReviewDialogOpen(false);
      setNewReview({ rating: 5, comment: '' });
      toast({ title: "Review Submitted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error submitting review" });
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
          <Button onClick={() => router.push('/products')}>Back to Catalog</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = (product.images || []).map((img: any) => img.url);
  if (images.length === 0) images.push('https://placehold.co/800x800?text=Kalamic');
  const currentImageUrl = images[selectedImage] || images[0];

  const averageRating = reviews.length > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)) 
    : (product.averageRating || 4.8);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* SEO Head Injection via standard Next.js Head is usually done in layout, 
          but we can output metadata here if it's a server component. 
          Since it's client, we rely on the component rendering. */}
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
                  <Image src={currentImageUrl} alt={product.name} fill className="object-cover" priority />
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
                <p className="text-xs font-bold text-accent uppercase tracking-widest">{product.tags?.[0] || 'Handcrafted'}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 py-1">
                  <div className="flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-100">
                    <span className="text-sm font-bold text-green-700 mr-1">{averageRating}</span>
                    <Star className="h-3 w-3 fill-green-700 text-green-700" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {reviews.length || product.reviewCount || 0} Ratings
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">₹{(product.price ?? 0).toLocaleString()}</span>
                  {product.compare_at_price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">₹{product.compare_at_price.toLocaleString()}</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                      </Badge>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Inclusive of all taxes</p>
              </div>

              {product.short_description && (
                <p className="text-sm italic text-muted-foreground border-l-4 border-accent pl-4 py-1 bg-accent/5 rounded-r-lg">
                  {product.short_description}
                </p>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-primary flex items-center gap-2"><Info className="h-4 w-4" /> Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Specs Loop Render */}
              {product.specifications?.length > 0 && (
                <section className="space-y-4 pt-4">
                  <h3 className="font-bold text-primary">Specifications</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {product.specifications.map((spec: any, i: number) => (
                      <div key={i} className="flex justify-between border-b border-muted/20 pb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{spec.key}</span>
                        <span className="text-xs font-medium text-primary">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Checkout */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24 space-y-4">
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className="text-sm font-bold text-primary">{product.stock > 0 ? `In Stock (${product.stock})` : 'Crafting Soon'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button onClick={handleAddToCart} disabled={product.stock <= 0} className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-lg">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
                      </Button>
                      <Button onClick={handleBuyNow} disabled={product.stock <= 0} variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-bold rounded-xl">
                        <Zap className="mr-2 h-5 w-5 fill-current" /> Buy It Now
                      </Button>
                    </div>

                    <div className="pt-4 space-y-3 text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Truck className="h-4 w-4 text-accent" />
                        <span>Weight: <b>{product.shipping?.weight_kg || 0}kg</b></span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-accent" />
                        <span>Authentic Handcrafted Piece</span>
                      </div>
                    </div>

                    <Separator className="opacity-50" />
                    
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAddToWishlist} 
                        className={cn(
                          "text-xs font-bold gap-2 rounded-full",
                          isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} /> {isFavorited ? 'Favorited' : 'Wishlist'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleShare} className="text-xs font-bold gap-2 rounded-full text-muted-foreground hover:text-primary">
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Related */}
          <section className="space-y-8 pt-12 border-t">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent fill-accent" />
              <h2 className="text-2xl font-bold text-primary">Artisan Treasures You Might Love</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(related => (
                <ProductCard 
                  key={related._id} 
                  id={related._id} 
                  slug={related.slug} 
                  name={related.name} 
                  price={related.price} 
                  image={related.images?.find((img: any) => img.is_primary)?.url || related.images?.[0]?.url || 'https://placehold.co/400x400'} 
                  rating={related.averageRating || 4.8} 
                  tag={related.tags?.[0] || "Artisan"} 
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
