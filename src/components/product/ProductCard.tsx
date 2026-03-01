"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Zap, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { trackProductAction, untrackWishlistAction } from '@/lib/actions/products';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isHovered, setIsHovered] = useState(false);

  const displayImage = typeof image === 'string' ? image : (image?.url || 'https://placehold.co/600x800?text=Kalamic');
  const imageAlt = typeof image === 'object' && image?.alt ? image.alt : (name || 'Handcrafted Ceramic Piece');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Welcome back", description: "Please sign in to add this treasure to your bag." });
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
    toast({ title: "Bag Updated", description: `${name} has been added to your collection.` });
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
      toast({ title: "Save for later", description: "Sign in to keep track of your favorite artisan pieces." });
      return;
    }

    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    
    try {
      if (isFavorited) {
        setIsFavorited(false);
        await deleteDoc(wishlistItemRef);
        await untrackWishlistAction(id);
        toast({ title: "Removed", description: "Item removed from your favorites." });
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
        toast({ title: "Saved", description: "Piece added to your private collection." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className="group border-none bg-white rounded-[2.5rem] overflow-hidden premium-shadow transition-all duration-700 hover:-translate-y-3 cursor-pointer h-full flex flex-col relative"
        onClick={() => router.push(`/products/${slug || id}`)}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#F6F1E9]">
          <Image
            src={displayImage}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700" />
          
          <div className="absolute top-6 left-6 z-10">
            <Badge className="bg-white/90 backdrop-blur-md text-primary border-none text-[8px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-[0.2em] animate-in slide-in-from-left duration-700">
              {tag || "Artisan"}
            </Badge>
          </div>
          
          <button 
            onClick={handleAddToWishlist}
            className={cn(
              "absolute top-6 right-6 p-3 rounded-2xl backdrop-blur-xl transition-all duration-500 shadow-2xl z-10",
              isFavorited ? "bg-primary text-white scale-110" : "bg-white/80 opacity-0 group-hover:opacity-100 text-primary hover:bg-white"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-colors", isFavorited && "fill-current")} />
          </button>

          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-primary/90 text-white p-4 rounded-full shadow-2xl backdrop-blur-sm">
                  <Eye className="h-6 w-6" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <CardHeader className="p-8 pb-2 space-y-2">
          <div className="flex items-center gap-1.5 text-accent mb-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "fill-current" : "opacity-20")} />
            ))}
            <span className="text-[10px] font-black text-muted-foreground ml-1 tabular-nums">{rating.toFixed(1)}</span>
          </div>
          <h3 className="font-display text-2xl font-semibold text-primary leading-[1.1] line-clamp-2 min-h-[3.3rem]">
            {name}
          </h3>
        </CardHeader>

        <CardContent className="px-8 pb-6 flex-1">
          {description && (
            <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 leading-relaxed opacity-70">
              {description}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-8 pb-10 flex flex-col gap-6 mt-auto">
          <div className="w-full flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-primary tracking-tighter tabular-nums">₹{price.toLocaleString()}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through decoration-primary/20 opacity-40 font-bold tabular-nums">₹{originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <Button 
              variant="outline"
              className="h-14 rounded-2xl border-primary/10 text-primary hover:bg-primary/5 text-[9px] font-black uppercase tracking-[0.2em] gap-2 transition-all active:scale-95 premium-shadow"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" /> Add
            </Button>
            <Button 
              className="h-14 rounded-2xl gradient-saffron text-white border-none text-[9px] font-black uppercase tracking-[0.2em] gap-2 shadow-2xl shadow-primary/20 transition-all active:scale-95"
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