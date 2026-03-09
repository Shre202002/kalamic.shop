
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useNavigation } from '@/hooks/useNavigation';
import { Heart, ShoppingBag, ShoppingCart, Star, Eye } from 'lucide-react';
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

export function ProductCard({ 
  id, 
  slug, 
  name, 
  price, 
  originalPrice, 
  image, 
  tag, 
  description, 
  rating, 
  isInitiallyFavorited = false
}: ProductCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useNavigation();
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited);
  const [isHovered, setIsHovered] = useState(false);

  const displayImage = typeof image === 'string' ? image : (image?.url || 'https://placehold.co/600x800?text=Kalamic');
  const imageAlt = typeof image === 'object' && image?.alt ? image.alt : (name || 'Handcrafted Ceramic Piece');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Welcome back", description: "Please sign in to add this treasure to your bag." });
      router.push('/auth/login');
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
    if (!user) {
      toast({ title: "Welcome back", description: "Please sign in to buy this treasure." });
      router.push('/auth/login');
      return;
    }

    try {
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
      router.push('/checkout');
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not initiate checkout." });
    }
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
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className="group border-none bg-card rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 cursor-pointer h-full flex flex-col relative"
        onClick={() => router.push(`/products/${slug || id}`)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
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
          
          <div className="absolute top-4 left-4 z-10">
            <Badge className="gradient-saffron text-primary-foreground border-none text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-[0.15em] animate-in slide-in-from-left duration-700">
              {tag || "Artisan"}
            </Badge>
          </div>
          
          <button 
            onClick={handleAddToWishlist}
            className={cn(
              "absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-xl transition-all duration-500 shadow-xl z-10",
              isFavorited ? "bg-primary text-white scale-110" : "bg-white/80 opacity-0 group-hover:opacity-100 text-primary hover:bg-white"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-colors", isFavorited && "fill-current")} />
          </button>

          <AnimatePresence>
            {isHovered && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-primary/90 text-white p-4 rounded-full shadow-2xl backdrop-blur-sm">
                  <Eye className="h-5 w-5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <CardHeader className="p-6 pb-2 space-y-1.5">
          <div className="flex items-center gap-1 text-accent mb-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "fill-current" : "opacity-20")} />
            ))}
            <span className="text-[10px] font-bold text-muted-foreground ml-1 tabular-nums">{rating.toFixed(1)}</span>
          </div>
          <Link href={`/products/${slug || id}`} className="hover:text-primary transition-colors">
            <h3 className="font-serif text-xl font-semibold text-black line-clamp-2 leading-snug min-h-[2.8rem]">
              {name}
            </h3>
          </Link>
        </CardHeader>

        <CardContent className="px-6 pb-4 flex-1">
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-6 pb-8 flex flex-col gap-4 mt-auto">
          <div className="w-full flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-primary tracking-tight tabular-nums">₹{price.toLocaleString()}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through opacity-40 font-semibold tabular-nums">₹{originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline"
              className="h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 text-[9px] font-black uppercase tracking-[0.15em] gap-2 transition-all active:scale-95"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" /> Add
            </Button>
            <Button 
              className="h-12 rounded-xl gradient-saffron text-primary-foreground border-none text-[9px] font-black uppercase tracking-[0.15em] gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
              onClick={handleBuyNow}
            >
              <ShoppingCart className="h-4 w-4" /> Buy Now
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
