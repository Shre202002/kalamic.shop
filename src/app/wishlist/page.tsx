
'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { getWishlistItems, removeFromWishlist } from '@/lib/actions/user-actions';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function WishlistPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      if (!user) {
        setIsLoadingItems(false);
        return;
      }
      try {
        const data = await getWishlistItems(user.uid);
        setItems(data);
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setIsLoadingItems(false);
      }
    }
    loadWishlist();
  }, [user]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    try {
      await removeFromWishlist(user.uid, productId);
      setItems(items.filter(item => item.productId !== productId));
      toast({
        title: "Removed from favorites",
        description: "Your wishlist has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove item. Please try again.",
      });
    }
  };

  if (isUserLoading || isLoadingItems) {
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
          <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center">
            <Heart className="h-10 w-10 text-muted-foreground opacity-20" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Your Wishlist</h1>
          <p className="text-muted-foreground max-w-sm">Sign in to save and manage your favorite artisan crafts.</p>
          <Button asChild className="h-12 px-8 rounded-xl"><Link href="/auth/login">Sign In</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">My Favorites</h1>
            <Badge variant="outline" className="h-8 rounded-full border-primary/20 text-primary">
              {items.length} Items
            </Badge>
          </div>

          {!items.length ? (
            <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-primary/20 px-8">
              <div className="h-24 w-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-muted-foreground opacity-20" />
              </div>
              <h2 className="text-2xl font-bold text-primary">Nothing saved yet</h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Explore our catalog and save the masterpieces that speak to you.</p>
              <Button asChild className="mt-8 h-12 px-10 rounded-xl" variant="default">
                <Link href="/products">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map((item) => (
                <div key={item.productId} className="relative group">
                  <ProductCard 
                    id={item.productId}
                    slug={item.slug || item.productId}
                    name={item.name || 'Handmade Craft'}
                    price={item.price || 0}
                    image={item.imageUrl || `https://picsum.photos/seed/${item.productId}/600/600`}
                    rating={5}
                    tag="Favorite"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl rounded-xl"
                    onClick={() => handleRemove(item.productId)}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
