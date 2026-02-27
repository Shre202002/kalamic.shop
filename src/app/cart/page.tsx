
'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;
  const shipping = cartItems && cartItems.length > 0 ? 150 : 0;

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (!user || !firestore) return;
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const itemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', itemId);
    updateDocumentNonBlocking(itemRef, { quantity: newQuantity, updatedAt: serverTimestamp() });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!user || !firestore) return;
    const itemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', itemId);
    deleteDocumentNonBlocking(itemRef);
    toast({ title: "Item removed", description: "Your bag has been updated." });
  };

  const handleCheckoutRedirect = () => {
    if (!cartItems?.length) return;
    router.push('/checkout');
  };

  if (isUserLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">Your Bag is Waiting</h1>
          <p className="text-xs text-muted-foreground mb-8 max-w-xs">Sign in to retrieve your artisan selections and complete your acquisition.</p>
          <Button asChild className="w-full max-w-xs h-10 rounded-xl"><Link href="/auth/login">Sign In</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-4xl font-extrabold text-primary tracking-tight">Shopping Bag</h1>
            <Badge variant="outline" className="h-7 rounded-full border-primary/20 text-primary text-[10px]">
              {cartItems?.length || 0} Items
            </Badge>
          </div>

          {!cartItems?.length ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed px-6">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-6" />
              <p className="text-lg font-medium text-muted-foreground">Your shopping bag is empty</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">Explore our catalog to find unique handcrafted ceramics for your space.</p>
              <Button asChild className="mt-8 h-10 px-10 rounded-xl" variant="default">
                <Link href="/products">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-all rounded-2xl">
                    <CardContent className="p-4 md:p-5 flex items-center gap-4">
                      <div className="relative h-16 w-16 md:h-24 md:w-24 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 bg-muted shadow-inner">
                        <Image 
                          src={item.imageUrl || `https://picsum.photos/seed/${item.productVariantId}/200/200`} 
                          alt={item.name} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary text-sm md:text-base line-clamp-1">{item.name || 'Ceramic Piece'}</h3>
                        <p className="text-xs text-accent font-bold mt-0.5">₹{item.priceAtAddToCart.toFixed(2)}</p>
                        
                        <div className="flex items-center justify-between mt-3 md:mt-4">
                          <div className="flex items-center border rounded-xl bg-muted/30 p-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-primary text-base">₹{(item.priceAtAddToCart * item.quantity).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary gap-2 mt-4 px-0 h-auto text-xs">
                  <Link href="/products">
                    <ChevronLeft className="h-3 w-3" /> Continue Shopping
                  </Link>
                </Button>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-xl bg-white rounded-3xl sticky top-24">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <h3 className="text-lg font-bold text-primary border-b pb-4">Order Summary</h3>
                    <div className="space-y-3 text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FragileCare™ Shipping</span>
                        <span className="font-medium text-accent">₹{shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] md:text-xs text-green-600 font-medium">
                        <span>Heritage Discount</span>
                        <span>- ₹0.00</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg md:text-xl pt-6 border-t text-primary">
                      <span>Total</span>
                      <span>₹{(subtotal + shipping).toFixed(2)}</span>
                    </div>

                    <div className="pt-4 space-y-4">
                      <Button className="w-full h-12 text-base font-extrabold rounded-2xl shadow-lg shadow-primary/20" onClick={handleCheckoutRedirect}>
                        Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                        Secure SSL Encryption Guaranteed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
