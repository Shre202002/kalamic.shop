
"use client"

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  category: string;
  description?: string;
}

export function ProductCard({ id, slug, name, price, originalPrice, image, category, description }: ProductCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

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
      name,
      priceAtAddToCart: price,
      imageUrl: image,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast({
      title: "Added to cart",
      description: `${name} has been added to your shopping bag.`,
    });
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to checkout." });
      return;
    }

    // Add to cart first
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      name,
      priceAtAddToCart: price,
      imageUrl: image,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    router.push('/cart');
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to save favorites." });
      return;
    }

    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    await setDoc(wishlistItemRef, {
      id,
      productId: id,
      slug,
      name,
      price,
      imageUrl: image,
      addedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Saved to wishlist",
      description: `${name} is now in your favorites.`,
    });
  };

  return (
    <Card 
      className="group border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-white cursor-pointer h-full flex flex-col"
      onClick={() => router.push(`/products/${slug || id}`)}
    >
      {/* Image Container */}
      <CardContent className="p-4 pb-0 relative">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {/* Badge */}
          <Badge className="absolute top-3 left-3 bg-primary text-white hover:bg-primary border-none text-[10px] font-bold px-3 py-1 rounded-lg">
            {category}
          </Badge>
          {/* Wishlist Button */}
          <button 
            onClick={handleAddToWishlist}
            className="absolute top-3 right-3 p-2.5 rounded-xl bg-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white text-primary shadow-lg"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </CardContent>

      {/* Content */}
      <CardContent className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-primary leading-tight line-clamp-2 mb-1 group-hover:text-accent transition-colors duration-300">
          {name}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {description}
          </p>
        )}
        
        <div className="mt-auto flex items-baseline gap-2 mb-4">
          <span className="text-xl font-extrabold text-primary">₹{price.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through opacity-50">₹{originalPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            className="h-10 rounded-xl border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 active:scale-95 text-xs font-bold gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Bag
          </Button>
          <Button 
            className="h-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all duration-300 active:scale-95 text-xs font-bold gap-2 shadow-lg shadow-primary/20"
            onClick={handleBuyNow}
          >
            <Zap className="h-3.5 w-3.5" /> Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
