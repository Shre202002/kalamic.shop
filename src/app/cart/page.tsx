
'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (!user) return;
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const itemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', itemId);
    updateDocumentNonBlocking(itemRef, { quantity: newQuantity, updatedAt: serverTimestamp() });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!user) return;
    const itemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', itemId);
    deleteDocumentNonBlocking(itemRef);
    toast({ title: "Item removed", description: "Your cart has been updated." });
  };

  const handleCheckout = async () => {
    if (!user || !cartItems?.length) return;
    
    // In a real app, this would trigger a payment gateway and then create an order
    // For this prototype, we'll simulate order creation
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);

    const orderData = {
      id: orderId,
      userId: user.uid,
      orderDate: new Date().toISOString(),
      totalAmount: subtotal + 150, // Including mock shipping
      orderStatus: 'pending',
      shippingCost: 150,
      discountAmount: 0,
      paymentId: 'SIMULATED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDoc(orderRef, orderData);

    // Add order items
    cartItems.forEach(item => {
      const orderItemRef = doc(firestore, 'users', user.uid, 'orders', orderId, 'items', item.id);
      setDoc(orderItemRef, {
        id: item.id,
        orderId: orderId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        priceAtOrder: item.priceAtAddToCart
      });
      // Remove from cart
      handleRemoveItem(item.id);
    });

    toast({
      title: "Order Placed!",
      description: `Your order ${orderId} has been successfully simulated.`,
    });
  };

  if (isUserLoading || isCartLoading) {
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
          <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-20" />
          <h1 className="text-2xl font-bold">Your Cart is Waiting</h1>
          <p className="text-muted-foreground">Sign in to see your artisan selections.</p>
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
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold text-primary mb-8">Shopping Bag</h1>

          {!cartItems?.length ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Your bag is empty</p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/products">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <Image 
                          src={item.imageUrl || `https://picsum.photos/seed/${item.productVariantId}/200/200`} 
                          alt="Product" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-primary line-clamp-1">{item.name || 'Ceramic Piece'}</h3>
                        <p className="text-sm text-muted-foreground">₹{item.priceAtAddToCart.toFixed(2)}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center border rounded-lg bg-muted/50">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{(item.priceAtAddToCart * item.quantity).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-md bg-white">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-primary border-b pb-4">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>₹150.00</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-4 border-t">
                      <span>Total</span>
                      <span className="text-primary">₹{(subtotal + 150).toFixed(2)}</span>
                    </div>
                    <Button className="w-full h-12 text-lg font-bold" onClick={handleCheckout}>
                      Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
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
