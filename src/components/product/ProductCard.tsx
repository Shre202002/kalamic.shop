
"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  category: string;
  badge?: string;
}

export function ProductCard({ id, name, price, originalPrice, image, rating, category, badge }: ProductCardProps) {
  const { toast } = useToast();
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Added to cart",
      description: `${name} has been added to your shopping bag.`,
    });
  };

  return (
    <Link href={`/products/${id}`} className="group block h-full">
      <Card className="product-card-hover border-none overflow-hidden h-full flex flex-col bg-white">
        <CardContent className="p-0 relative aspect-square overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {badge && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground z-10">
              {badge}
            </Badge>
          )}
          {discount && (
            <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground z-10">
              {discount}% OFF
            </Badge>
          )}
          <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-primary">
            <Heart className="h-4 w-4" />
          </button>
        </CardContent>
        <CardContent className="p-4 flex-1 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {category}
          </span>
          <h3 className="text-sm md:text-base font-semibold text-primary line-clamp-1 group-hover:text-accent transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{rating}</span>
          </div>
          <div className="mt-auto flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white transition-all transform active:scale-95 flex items-center gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
