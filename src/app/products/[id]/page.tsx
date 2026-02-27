
"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
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
  Info
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, getFeaturedProducts, trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { getProductReviews } from '@/lib/actions/reviews';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';
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

  useEffect(() => {
    async function loadData() {
      try {
        const id = params.id as string;
        const data = await getProductById(id);
        
        if (data) {
          setProduct(data);
          incrementProductViews(data._id); // Server-side increment

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
    
    if (isFavorited) {
      await deleteDoc(wishlistItemRef);
      untrackWishlistAction(productId);
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
      trackProductAction(productId, 'wishlist_count');
      toast({ title: "Saved to wishlist" });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!product) return <div className="p-20 text-center"><h1 className="text-2xl font-bold">Piece Not Found</h1><Button onClick={() => router.push('/products')}>Return to Shop</Button></div>;

  const images = (product.images || []).map((img: any) => img.url);
  const currentImageUrl = images[selectedImage] || 'https://placehold.co/800x800?text=Kalamic';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-primary">Collection</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border border-primary/5">
                <Image src={currentImageUrl} alt={product.name} fill className="object-cover" priority />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={cn("relative min-w-[80px] h-[80px] rounded-xl overflow-hidden border-2 transition-all", selectedImage === i ? "border-primary scale-105" : "border-transparent opacity-60")}>
                    <Image src={img} alt={product.name} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-accent uppercase tracking-widest">{product.tags?.[0] || 'Handcrafted'}</Badge>
                <h1 className="text-3xl font-black text-primary tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-bold">{product.averageRating || 4.8}</span>
                  <span className="text-muted-foreground text-sm">({product.reviewCount || 0} reviews)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-primary">₹{product.price.toLocaleString()}</span>
                {product.compare_at_price && (
                  <span className="text-xl text-muted-foreground line-through">₹{product.compare_at_price.toLocaleString()}</span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed italic border-l-4 border-accent pl-4 py-2 bg-accent/5 rounded-r-xl">
                {product.short_description || product.description.slice(0, 100) + '...'}
              </p>

              <div className="space-y-4">
                <h3 className="font-black text-primary flex items-center gap-2"><Info className="h-4 w-4" /> The Artisan Narrative</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>

              {product.specifications?.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="font-bold text-primary">Technical Specs</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {product.specifications.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between border-b pb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{s.key}</span>
                        <span className="text-xs font-bold text-primary">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <Card className="p-6 space-y-6 rounded-3xl shadow-xl border-none sticky top-24">
                <div className="flex items-center justify-between">
                  <div className={cn("h-3 w-3 rounded-full animate-pulse", product.stock > 0 ? "bg-green-500" : "bg-orange-500")} />
                  <span className="text-sm font-bold">{product.stock > 0 ? `Artisan Stock: ${product.stock}` : 'Crafting Now'}</span>
                </div>
                <div className="space-y-3">
                  <Button onClick={handleAddToCart} disabled={product.stock <= 0} className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20">Add to Bag</Button>
                  <Button onClick={() => { handleAddToCart(); router.push('/checkout'); }} disabled={product.stock <= 0} variant="outline" className="w-full h-14 border-primary text-primary font-black rounded-2xl">Buy It Now</Button>
                </div>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3"><Truck className="h-4 w-4 text-accent" /> FragileCare™ Shipping: {product.shipping?.weight_kg || 0}kg</div>
                  <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-accent" /> Authentic Studio Original</div>
                </div>
                <Separator />
                <div className="flex justify-center gap-4">
                  <Button variant="ghost" onClick={handleAddToWishlist} className={cn("text-xs font-bold", isFavorited && "text-red-500")}><Heart className={cn("mr-2 h-4 w-4", isFavorited && "fill-current")} /> {isFavorited ? 'Favorited' : 'Wishlist'}</Button>
                  <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied" }); }} className="text-xs font-bold"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
