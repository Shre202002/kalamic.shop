
"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { trackProductAction, untrackWishlistAction } from '@/lib/actions/products';
import { motion } from 'framer-motion';

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
  const imageAlt = typeof image === 'object' && image?.alt ? image.alt : (name || 'Handcrafted Ceramic Piece');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to add items to your bag." });
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
    toast({ title: "Added to Bag", description: `${name} has been added to your collection.` });
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
      toast({ title: "Please sign in", description: "You need an account to save pieces." });
      return;
    }

    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    
    try {
      if (isFavorited) {
        setIsFavorited(false);
        await deleteDoc(wishlistItemRef);
        await untrackWishlistAction(id);
        toast({ title: "Removed from Favorites" });
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
        toast({ title: "Saved to Collection" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating collection." });
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card 
        className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[1.5rem] overflow-hidden bg-white cursor-pointer h-full flex flex-col"
        onClick={() => router.push(`/products/${slug || id}`)}
      >
        <div className="relative aspect-square overflow-hidden bg-[#F6F1E9]">
          <Image
            src={displayImage}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          
          {/* Top Overlays */}
          <div className="absolute top-4 left-4 z-10">
            <Badge className="gradient-saffron text-white border-none text-[9px] font-body font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
              {tag || "Artisan"}
            </Badge>
          </div>
          
          <button 
            onClick={handleAddToWishlist}
            className={cn(
              "absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl z-10",
              isFavorited ? "bg-white scale-110" : "bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-white"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-colors", isFavorited ? "fill-primary text-primary" : "text-[#2E2E2E]")} />
          </button>
        </div>

        <CardHeader className="p-5 pb-2 space-y-1">
          <div className="flex items-center gap-1 text-accent mb-1">
            {[1,2,3,4,5].map(i => <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "fill-current" : "opacity-20")} />)}
            <span className="text-[10px] font-bold text-muted-foreground ml-1">{rating.toFixed(1)}</span>
          </div>
          <h3 className="font-display text-xl font-semibold text-primary leading-tight line-clamp-2 min-h-[3rem]">
            {name}
          </h3>
        </CardHeader>

        <CardContent className="px-5 pb-4 flex-1">
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-5 pb-6 flex flex-col gap-4 mt-auto">
          <div className="w-full flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary tracking-tighter">₹{price.toLocaleString()}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through decoration-primary/20 opacity-50 font-bold">₹{originalPrice.toLocaleString()}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline"
              className="h-11 rounded-xl border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest gap-2 transition-all active:scale-95"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" /> Bag
            </Button>
            <Button 
              className="h-11 rounded-xl gradient-saffron text-white border-none text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
              onClick={handleBuyNow}
            >
              <Zap className="h-4 w-4" /> Buy
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
