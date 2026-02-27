
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getProfile } from '@/lib/actions/user-actions';
import { createCashfreeOrder, verifyCashfreePayment } from '@/lib/actions/cashfree';
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
  ShieldCheck, 
  Loader2, 
  ShoppingBag,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    paymentMethod: 'card'
  });

  // Strict profile and verification enforcement
  useEffect(() => {
    async function checkVerify() {
      if (!isUserLoading && user) {
        const profile = await getProfile(user.uid);
        
        const isComplete = profile?.firstName && profile?.lastName && profile?.phone && profile?.address && profile?.city && profile?.pincode;
        const isVerified = profile?.emailVerified;

        if (!isVerified || !isComplete) {
          toast({
            variant: "destructive",
            title: "Collector Profile Incomplete",
            description: "Please verify your email and complete your delivery details in the workspace first.",
          });
          router.push('/profile');
        }
      } else if (!isUserLoading && !user) {
        router.push('/auth/login');
      }
    }
    checkVerify();
  }, [user, isUserLoading, router, toast]);

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  // Auto-fill from DB
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      try {
        const profile = await getProfile(user.uid);
        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: `${profile.firstName} ${profile.lastName}`.trim(),
            email: user.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            landmark: profile.landmark || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.pincode || '',
          }));
        }
      } catch (err) {
        console.error("Error fetching auto-fill data:", err);
      }
    }
    loadUserData();
  }, [user]);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;
  const shipping = cartItems && cartItems.length > 0 ? 150 : 0;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length || !firestore) return;
    
    if (!formData.fullName || !formData.address || !formData.city || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please complete the shipping address fields.",
      });
      return;
    }

    if (!cashfreeLoaded) {
      toast({ variant: "destructive", title: "System Error", description: "Payment gateway is still initializing. Please wait a moment." });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create a "Pending" order in Firestore first
      const orderId = `KAL-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);

      const orderData = {
        id: orderId,
        userId: user.uid,
        orderDate: new Date().toISOString(),
        totalAmount: total,
        orderStatus: 'pending_payment',
        shippingCost: shipping,
        discountAmount: 0,
        paymentId: '', // To be filled after success
        shippingDetails: { ...formData },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderData);

      // Save items to order subcollection
      const itemPromises = cartItems.map(async (item) => {
        const orderItemRef = doc(firestore, 'users', user.uid, 'orders', orderId, 'items', item.id);
        return setDoc(orderItemRef, {
          id: item.id,
          orderId: orderId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtAddToCart,
          name: item.name,
          imageUrl: item.imageUrl
        });
      });
      await Promise.all(itemPromises);

      // 2. Create Cashfree Order on Server
      const { paymentSessionId } = await createCashfreeOrder({
        orderId,
        orderAmount: total,
        orderCurrency: 'INR',
        customerDetails: {
          customerId: user.uid,
          customerPhone: formData.phone.replace(/\D/g, '').slice(-10), // Clean 10 digit phone
          customerEmail: user.email || 'guest@kalamic.shop',
          customerName: formData.fullName,
        }
      });

      // 3. Initiate Cashfree Checkout
      const cashfree = new window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
      });

      cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self" // Or "_modal" for a bridge experience
      }).then(async (result: any) => {
        if (result.error) {
          toast({ variant: "destructive", title: "Payment Failed", description: result.error.message });
          setIsProcessing(false);
          return;
        }

        if (result.redirect) {
          // If redirected, verification will happen on the return URL
          return;
        }

        // 4. Verify Payment on Success (for non-redirect flows)
        if (result.paymentDetails) {
          const verification = await verifyCashfreePayment(orderId);
          if (verification.success) {
            // Finalize order status in Firestore
            await updateDoc(orderRef, {
              orderStatus: 'placed',
              paymentId: verification.paymentId,
              updatedAt: serverTimestamp()
            });

            // Clear Cart
            const clearPromises = cartItems.map(item => 
              deleteDoc(doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', item.id))
            );
            await Promise.all(clearPromises);

            toast({ title: "Order Successful!", description: `Acquisition complete. Order ID: ${orderId}` });
            router.push(`/orders/${orderId}`);
          } else {
            throw new Error("Payment verification failed. Please contact support.");
          }
        }
      });

    } catch (error: any) {
      console.error("Order failed:", error);
      toast({
        variant: "destructive",
        title: "Order Process Failed",
        description: error.message || "There was an error initiating your payment.",
      });
    } finally {
      // Don't set isProcessing false here if redirecting
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <Script 
        src="https://sdk.cashfree.com/js/v3/cashfree.js" 
        onLoad={() => setCashfreeLoaded(true)}
      />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-primary tracking-tight">Checkout</h1>
              <p className="text-muted-foreground mt-1">Complete your acquisition of handcrafted art.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary bg-white px-4 py-2 rounded-full border shadow-sm">
              <ShieldCheck className="h-4 w-4 text-accent" /> Secure Cashfree Transaction
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-xl">Shipping Address</CardTitle>
                  </div>
                  <CardDescription>Verified delivery details from your artisan profile.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      value={formData.fullName} 
                      onChange={handleInputChange} 
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
                        className="rounded-xl h-12 border-muted/30 focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone (Required for SMS tracking)</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      placeholder="+91XXXXXXXXXX"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      className="rounded-xl h-12 border-muted/30 focus-visible:ring-accent"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-xl">Payment Method</CardTitle>
                  </div>
                  <CardDescription>Select your preferred acquisition method.</CardDescription>
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
                        <span className="text-sm font-bold">Safe Online Payment</span>
                        <span className="text-[10px] text-muted-foreground mt-1">Cards, UPI, Netbanking</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-primary/20 flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You will be redirected to Cashfree's secure payment page. All sensitive information is encrypted via industry-standard SSL.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {cartItems?.map((item) => (
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

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-primary">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping (FragileCare™)</span>
                      <span className="font-medium text-accent">₹{shipping.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-primary">Total Amount</span>
                    <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
                  </div>

                  <Button 
                    onClick={handlePlaceOrder} 
                    disabled={isProcessing || !cashfreeLoaded}
                    className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 text-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 mt-4"
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Initiating Gateway...</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-6 w-6" /> Pay with Cashfree</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
