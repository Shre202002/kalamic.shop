
'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  ShoppingBag,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    paymentMethod: 'card'
  });

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;
  const shipping = cartItems && cartItems.length > 0 ? 150 : 0;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length || !firestore) return;
    
    // Simple validation
    if (!formData.fullName || !formData.address || !formData.city) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please complete the shipping address fields.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);

      const orderData = {
        id: orderId,
        userId: user.uid,
        orderDate: new Date().toISOString(),
        totalAmount: total,
        orderStatus: 'processing',
        shippingCost: shipping,
        discountAmount: 0,
        paymentId: `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        shippingDetails: {
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderData);

      // Add order items and clear cart
      const clearPromises = cartItems.map(async (item) => {
        const orderItemRef = doc(firestore, 'users', user.uid, 'orders', orderId, 'items', item.id);
        await setDoc(orderItemRef, {
          id: item.id,
          orderId: orderId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtAddToCart,
          name: item.name,
          imageUrl: item.imageUrl
        });
        
        // Remove from cart
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', item.id);
        await deleteDoc(cartItemRef);
      });

      await Promise.all(clearPromises);

      toast({
        title: "Order Successful!",
        description: `Thank you for your purchase. Order ID: ${orderId}`,
      });
      router.push('/orders');
    } catch (error) {
      console.error("Order failed:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading || isCartLoading) {
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

  if (!user || !cartItems?.length) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
          <h1 className="text-2xl font-bold text-primary">Your bag is empty</h1>
          <p className="text-muted-foreground mb-8">Add some artisan treasures to your bag before checking out.</p>
          <Button asChild rounded-xl><Link href="/products">Browse Collection</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-primary tracking-tight">Checkout</h1>
              <p className="text-muted-foreground mt-1">Complete your acquisition of handcrafted art.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary bg-white px-4 py-2 rounded-full border shadow-sm">
              <ShieldCheck className="h-4 w-4 text-accent" /> Secure Transaction
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Forms */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address */}
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-xl">Shipping Address</CardTitle>
                  </div>
                  <CardDescription>Where should we send your handcrafted treasures?</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      value={formData.fullName} 
                      onChange={handleInputChange} 
                      placeholder="Enter your full name" 
                      className="rounded-xl h-12 border-muted/30 focus-visible:ring-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      placeholder="123 Ceramic Lane" 
                      className="rounded-xl h-12 border-muted/30 focus-visible:ring-accent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        placeholder="New Delhi" 
                        className="rounded-xl h-12 border-muted/30 focus-visible:ring-accent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input 
                        id="zip" 
                        name="zip" 
                        value={formData.zip} 
                        onChange={handleInputChange} 
                        placeholder="110001" 
                        className="rounded-xl h-12 border-muted/30 focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-xl">Payment Details</CardTitle>
                  </div>
                  <CardDescription>Select your preferred payment method.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <RadioGroup 
                    defaultValue="card" 
                    onValueChange={(v) => setFormData({...formData, paymentMethod: v})}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <Label
                        htmlFor="card"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer transition-all"
                      >
                        <CreditCard className="mb-3 h-6 w-6" />
                        <span className="text-sm font-bold">Credit / Debit Card</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                      <Label
                        htmlFor="upi"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer transition-all"
                      >
                        <div className="mb-3 h-6 flex items-center justify-center text-xs font-black italic tracking-tighter">UPI</div>
                        <span className="text-sm font-bold">UPI / QR Code</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {formData.paymentMethod === 'card' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input placeholder="0000 0000 0000 0000" className="rounded-xl h-12" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input placeholder="MM/YY" className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input placeholder="123" className="rounded-xl h-12" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  {/* Items list */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-primary">₹{(item.priceAtAddToCart * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Calculations */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-primary">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping (FragileCare™)</span>
                      <span className="font-medium text-accent">₹{shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-bold">
                      <span>Artisan Discount</span>
                      <span>- ₹0.00</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-primary">Total Amount</span>
                    <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
                  </div>

                  <Button 
                    onClick={handlePlaceOrder} 
                    disabled={isProcessing}
                    className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 text-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 mt-4"
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Finalizing...</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-6 w-6" /> Complete Purchase</>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex flex-col items-center gap-1 opacity-50">
                      <Truck className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Insured</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-50">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-50">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Secure</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back to Cart Link */}
              <div className="text-center">
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary rounded-full">
                  <Link href="/cart">
                    <ChevronRight className="rotate-180 mr-2 h-4 w-4" /> Review Cart Items
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
