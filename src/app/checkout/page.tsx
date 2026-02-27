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
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';

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

  // Verification of profile status
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
            description: "Please verify your email and complete your delivery details in your workspace first.",
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

  // Auto-fill from Profile
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

  const finalizeOrder = async (orderId: string, paymentId: string) => {
    if (!user || !firestore || !cartItems) return;
    
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);
    
    await updateDoc(orderRef, {
      orderStatus: 'placed',
      paymentId: paymentId,
      updatedAt: serverTimestamp()
    });

    const clearPromises = cartItems.map(item => 
      deleteDoc(doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', item.id))
    );
    await Promise.all(clearPromises);

    toast({ title: "Acquisition Successful!", description: `Order ID: ${orderId} has been confirmed.` });
    router.push(`/orders/${orderId}`);
  };

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length || !firestore) return;
    
    if (!formData.fullName || !formData.address || !formData.city || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Incomplete Details",
        description: "Please ensure all shipping fields are completed for a safe delivery.",
      });
      return;
    }

    setIsProcessing(true);
    try {
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
        shippingDetails: { ...formData },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderData);

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

      const result = await createCashfreeOrder({
        orderId,
        orderAmount: total,
        orderCurrency: 'INR',
        customerDetails: {
          customerId: user.uid,
          customerPhone: formData.phone.replace(/\D/g, '').slice(-10),
          customerEmail: user.email || 'guest@kalamic.shop',
          customerName: formData.fullName,
        }
      });

      if (result.isMock) {
        toast({
          title: "Mock Mode Active",
          description: "No real transaction will occur. Simulating successful acquisition...",
        });
        
        setTimeout(async () => {
          const verification = await verifyCashfreePayment(orderId);
          if (verification.success) {
            await finalizeOrder(orderId, verification.paymentId);
          }
        }, 2000);
        return;
      }

      if (!cashfreeLoaded) {
        toast({ variant: "destructive", title: "System Error", description: "Payment SDK failed to load. Please refresh." });
        setIsProcessing(false);
        return;
      }

      const cashfree = new window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
      });

      cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self" 
      }).then(async (sdkResult: any) => {
        if (sdkResult.error) {
          toast({ variant: "destructive", title: "Payment Failed", description: sdkResult.error.message });
          setIsProcessing(false);
          return;
        }

        if (sdkResult.redirect) return;

        if (sdkResult.paymentDetails) {
          setIsProcessing(true);
          const verification = await verifyCashfreePayment(orderId);
          
          if (verification.success) {
            await finalizeOrder(orderId, verification.paymentId);
          } else {
            toast({ 
              variant: "destructive", 
              title: "Verification Pending", 
              description: "We are waiting for final confirmation from the payment gateway." 
            });
            router.push('/orders');
          }
        }
      });

    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      toast({
        variant: "destructive",
        title: "Secure Checkout Failed",
        description: error.message || "Encountered an error connecting to our payment partner.",
      });
      setIsProcessing(false);
    }
  };

  if (isUserLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium">Securing your session...</p>
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
            <div className="space-y-1">
              <Link href="/cart" className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                <ChevronLeft className="h-3 w-3" /> Back to Bag
              </Link>
              <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight">Checkout</h1>
              <p className="text-muted-foreground">Confirm your selection and shipping destination.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-white px-6 py-3 rounded-2xl shadow-sm border">
              <ShieldCheck className="h-4 w-4 text-accent" /> Secure Cashfree® Integration
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-black text-primary">Shipping Credentials</CardTitle>
                  </div>
                  <CardDescription className="text-base">Verified delivery details for your artisan pieces.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-4 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      value={formData.fullName} 
                      onChange={handleInputChange} 
                      className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-muted/5 font-medium px-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Street Address</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-muted/5 font-medium px-6"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">City</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-muted/5 font-medium px-6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">ZIP / Pincode</Label>
                      <Input 
                        id="zip" 
                        name="zip" 
                        value={formData.zip} 
                        onChange={handleInputChange} 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-muted/5 font-medium px-6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Contact Phone (For SMS Tracking)</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      placeholder="+91XXXXXXXXXX"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-muted/5 font-medium px-6"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-black text-primary">Payment Architecture</CardTitle>
                  </div>
                  <CardDescription className="text-base">Choose your method of acquisition.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-4 space-y-8">
                  <RadioGroup 
                    defaultValue="card" 
                    onValueChange={(v) => setFormData({...formData, paymentMethod: v})}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <Label
                        htmlFor="card"
                        className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-muted bg-white p-8 hover:bg-primary/5 hover:border-primary/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                      >
                        <CreditCard className="mb-4 h-8 w-8 text-primary" />
                        <span className="text-lg font-black text-primary">Secure Online</span>
                        <span className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Cards, UPI, Banking</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="p-6 bg-[#FAF4EB] rounded-[1.5rem] border border-dashed border-primary/20 flex gap-4 items-start">
                    <AlertTriangle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      Note: You will be redirected to a secure Cashfree environment to complete your transaction. Your order will be confirmed once verification is received.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-3xl font-black text-primary">Acquisition Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-4 space-y-8">
                  <div className="space-y-6 max-h-[350px] overflow-y-auto pr-4 scrollbar-hide">
                    {cartItems?.map((item) => (
                      <div key={item.id} className="flex gap-6 items-center group">
                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-inner">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-primary truncate">{item.name}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-lg font-black text-primary">₹{(item.priceAtAddToCart * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="opacity-30" />

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-primary">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">FragileCare™ Shipping</span>
                      <span className="text-accent">₹{shipping.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator className="opacity-30" />

                  <div className="flex justify-between items-end">
                    <span className="text-xl font-black text-primary uppercase tracking-tighter">Total Amount</span>
                    <div className="text-right">
                      <p className="text-4xl font-black text-primary tracking-tighter">₹{total.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inclusive of taxes</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePlaceOrder} 
                    disabled={isProcessing}
                    className="w-full h-20 rounded-[2rem] bg-primary text-white hover:bg-primary/90 text-2xl font-black shadow-2xl shadow-primary/20 transition-all active:scale-95 mt-6"
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-3 h-8 w-8 animate-spin" /> Securing...</>
                    ) : (
                      <><CheckCircle2 className="mr-3 h-8 w-8" /> Pay ₹{total.toLocaleString()}</>
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 opacity-40">
                    <div className="h-px bg-muted flex-1" />
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">Verified Artisan Transaction</p>
                    <div className="h-px bg-muted flex-1" />
                  </div>
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
