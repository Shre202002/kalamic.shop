
'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const wishlistQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items');
  }, [firestore, user]);

  const { data: items, isLoading } = useCollection(wishlistQuery);

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground opacity-20" />
          <h1 className="text-2xl font-bold">Your Wishlist</h1>
          <p className="text-muted-foreground">Sign in to save your favorite artisan crafts.</p>
          <Button asChild><Link href="/auth/login">Sign In</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary mb-8">My Favorites</h1>

          {!items?.length ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Nothing saved yet</p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/products">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <ProductCard 
                    id={item.productId}
                    slug={item.slug || item.productId}
                    name={item.name || 'Handmade Craft'}
                    price={item.price || 0}
                    image={item.imageUrl || `https://picsum.photos/seed/${item.productId}/600/600`}
                    rating={5}
                    category="Wishlist"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const ref = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', item.id);
                      deleteDocumentNonBlocking(ref);
                    }}
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
