
"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Share2, Star, Truck, ShieldCheck, Undo2, Loader2, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, getProductBySlug } from '@/lib/actions/products';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  
  useEffect(() => {
    async function loadProduct() {
      try {
        const id = params.id as string;
        let data = await getProductById(id);
        if (!data) data = await getProductBySlug(id);
        
        if (data) {
          setProduct(data);
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-6 md:py-12">
        <div className="container mx-auto px-4">
          {/* Mobile Back Button */}
          <button 
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 md:hidden"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-xl border border-primary/5">
                <Image 
                  src={images[selectedImage]} 
                  alt={product.name} 
                  fill 
                  className="object-cover animate-fade-in" 
                  priority 
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                  {images.map((img: string, i: number) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative aspect-square rounded-lg md:rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="space-y-4 mb-6 md:mb-8">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-xs">
                    {product.category || 'Artisan Ceramic'}
                  </Badge>
                  <div className="flex gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10" onClick={handleAddToWishlist}>
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-primary leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold ml-1">{product.rating || '4.9'}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({product.reviews || '24'} reviews)</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl md:text-4xl font-bold text-primary">₹{(product.price).toFixed(2)}</span>
                  {product.compare_at_price && (
                    <span className="text-sm md:text-lg text-muted-foreground line-through">₹{Number(product.compare_at_price).toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div className="space-y-6 mb-8 md:mb-10">
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{product.description}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-auto">
                <Button 
                  size="lg" 
                  className="flex-1 h-12 md:h-14 bg-primary text-white hover:bg-primary/90 text-base md:text-lg font-bold shadow-lg shadow-primary/20" 
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mt-10 pt-8 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-5 w-5 text-accent" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Safe Ship</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secure Pay</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Undo2 className="h-5 w-5 text-accent" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Artisan</span>
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
