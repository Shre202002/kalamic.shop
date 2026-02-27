
"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { trackProductAction, untrackWishlistAction } from '@/lib/actions/products';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string | { url: string; alt: string; is_primary: boolean };
  rating: number;
  tag?: string;
  description?: string;
  isInitiallyFavorited?: boolean;
}

export function ProductCard({ id, slug, name, price, originalPrice, image, tag, description, rating, isInitiallyFavorited = false }: ProductCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited);

  const displayImage = typeof image === 'string' ? image : (image?.url || 'https://placehold.co/600x800?text=Kalamic');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to add items to your cart." });
      return;
    }

    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      cartId: user.uid,
      name,
      priceAtAddToCart: price,
      imageUrl: displayImage,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await trackProductAction(id, 'cart_add_count');
    toast({ title: "Added to cart", description: `${name} has been added to your shopping bag.` });
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await handleAddToCart(e);
    if (user) router.push('/checkout');
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to save favorites." });
      return;
    }

    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    
    try {
      if (isFavorited) {
        setIsFavorited(false);
        await deleteDoc(wishlistItemRef);
        await untrackWishlistAction(id);
        toast({ title: "Removed from wishlist" });
      } else {
        setIsFavorited(true);
        await setDoc(wishlistItemRef, {
          id,
          productId: id,
          wishlistId: user.uid,
          slug,
          name,
          price,
          imageUrl: displayImage,
          addedAt: new Date().toISOString()
        }, { merge: true });

        await trackProductAction(id, 'wishlist_count');
        toast({ title: "Saved to wishlist" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating favorites." });
    }
  };

  return (
    <Card 
      className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white cursor-pointer h-full flex flex-col"
      onClick={() => router.push(`/products/${slug || id}`)}
    >
      <CardContent className="p-4 pb-0 relative">
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-muted shadow-inner">
          <Image
            src={displayImage}
            alt={name || 'Ceramic Piece'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {tag && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-white border-none text-[9px] font-black px-3 py-1 rounded-full shadow-lg">
                {tag}
              </Badge>
            </div>
          )}
          <button 
            onClick={handleAddToWishlist}
            className={cn(
              "absolute top-4 right-4 p-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 shadow-xl z-10",
              isFavorited ? "bg-white scale-110" : "bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-white"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5 transition-colors", isFavorited ? "fill-red-500 text-red-500" : "text-primary")} />
          </button>
        </div>
      </CardContent>

      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1 text-accent mb-1.5">
          {[1,2,3,4,5].map(i => <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "fill-current" : "opacity-20")} />)}
          <span className="text-[9px] font-black text-muted-foreground ml-1">{rating || 4.8}</span>
        </div>
        
        <h3 className="text-lg font-black text-primary tracking-tight leading-tight line-clamp-2 mb-1.5 group-hover:text-accent transition-colors duration-300">
          {name || 'Handcrafted Piece'}
        </h3>
        {description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed font-medium">
            {description}
          </p>
        )}
        
        <div className="mt-auto flex items-baseline gap-2 mb-4">
          <span className="text-xl font-black text-primary tracking-tight">₹{(price ?? 0).toLocaleString()}</span>
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through opacity-40 font-bold">₹{originalPrice.toLocaleString()}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            className="h-10 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-black gap-1.5 transition-all active:scale-95"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Bag
          </Button>
          <Button 
            className="h-10 rounded-2xl bg-primary text-white hover:bg-primary/90 text-[10px] font-black gap-1.5 shadow-xl shadow-primary/20 transition-all active:scale-95"
            onClick={handleBuyNow}
          >
            <Zap className="h-3.5 w-3.5" /> Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
