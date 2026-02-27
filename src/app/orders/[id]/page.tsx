
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  Loader2, 
  Hammer, 
  Zap, 
  Box, 
  Award 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const STATUS_STEPS = [
  { id: 'placed', label: 'Placed', icon: Clock, description: 'Order confirmed' },
  { id: 'crafting', label: 'Crafting', icon: Hammer, description: 'Shaping the clay' },
  { id: 'developing', label: 'Developing', icon: Zap, description: 'Kiln firing & Glazing' },
  { id: 'packed', label: 'Packed', icon: Box, description: 'FragileCare™ packaging' },
  { id: 'dispatched', label: 'Dispatched', icon: Truck, description: 'In transit' },
  { id: 'delivered', label: 'Delivered', icon: Award, description: 'Piece arrived' }
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const orderId = params.id as string;

  const orderDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !orderId) return null;
    return doc(firestore, 'users', user.uid, 'orders', orderId);
  }, [firestore, user, orderId]);

  const itemsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user || !orderId) return null;
    return collection(firestore, 'users', user.uid, 'orders', orderId, 'items');
  }, [firestore, user, orderId]);

  const { data: order, isLoading: isOrderLoading } = useDoc(orderDocRef);
  const { data: items, isLoading: isItemsLoading } = useCollection(itemsCollectionRef);

  if (isUserLoading || isOrderLoading || isItemsLoading) {
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

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Package className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">We couldn't retrieve the details for this acquisition.</p>
          <Button asChild><Link href="/orders">Back to History</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(step => step.id === order.orderStatus.toLowerCase());
  const displayStatusIndex = currentStatusIndex === -1 ? 0 : currentStatusIndex;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4 text-muted-foreground hover:text-primary -ml-2">
              <Link href="/orders">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Acquisitions
              </Link>
            </Button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-primary tracking-tight">Order {order.id}</h1>
                  <Badge className="bg-accent text-accent-foreground uppercase text-[10px] font-bold tracking-widest px-3">
                    {order.orderStatus}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-medium">
                  Acquired on {new Date(order.orderDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Value</p>
                <p className="text-3xl font-black text-primary">₹{order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Status Stepper */}
            <Card className="lg:col-span-12 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-accent" /> Artisan Journey Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="relative pt-12 pb-8">
                  {/* Progress Line */}
                  <div className="absolute top-[68px] left-[10%] right-[10%] h-1 bg-muted hidden md:block" />
                  <div 
                    className="absolute top-[68px] left-[10%] h-1 bg-primary transition-all duration-1000 hidden md:block" 
                    style={{ width: `${(displayStatusIndex / (STATUS_STEPS.length - 1)) * 80}%` }}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-y-12 relative z-10">
                    {STATUS_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index <= displayStatusIndex;
                      const isCurrent = index === displayStatusIndex;

                      return (
                        <div key={step.id} className="flex flex-col items-center text-center px-2">
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 border-4",
                            isCompleted ? "bg-primary text-white border-primary/20 shadow-lg shadow-primary/20" : "bg-white text-muted-foreground border-muted shadow-sm",
                            isCurrent && "ring-4 ring-accent/30 scale-110"
                          )}>
                            {isCompleted && index < displayStatusIndex ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : (
                              <Icon className="h-6 w-6" />
                            )}
                          </div>
                          <p className={cn(
                            "text-sm font-black uppercase tracking-widest mb-1",
                            isCompleted ? "text-primary" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold hidden md:block">
                            {step.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4 border-b">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Package className="h-5 w-5 text-accent" /> Included Treasures
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {items?.map((item) => (
                      <div key={item.id} className="p-6 flex items-center gap-6 group hover:bg-muted/5 transition-colors">
                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-inner">
                          <Image 
                            src={item.imageUrl || 'https://placehold.co/200x200'} 
                            alt={item.name} 
                            fill 
                            className="object-cover transition-transform group-hover:scale-110" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-primary truncate group-hover:text-accent transition-colors">{item.name}</h3>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-primary">₹{item.priceAtOrder.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Info */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Delivery Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF4EB]/50 border-2 border-primary/5 space-y-1">
                    <p className="text-sm font-black text-primary">{order.shippingDetails?.fullName}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {order.shippingDetails?.address},<br />
                      {order.shippingDetails?.landmark && <span>{order.shippingDetails.landmark}, </span>}
                      {order.shippingDetails?.city}, {order.shippingDetails?.state} - {order.shippingDetails?.zip}
                    </p>
                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</p>
                      <p className="text-xs font-bold text-primary">{order.shippingDetails?.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                    Acquisition Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase">Subtotal</span>
                    <span className="text-primary">₹{(order.totalAmount - order.shippingCost).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase">FragileCare™ Shipping</span>
                    <span className="text-accent">₹{order.shippingCost.toLocaleString()}</span>
                  </div>
                  <Separator className="my-2 opacity-50" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-black text-primary uppercase">Total</span>
                    <span className="text-xl font-black text-primary">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-4">
                    <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Verified Payment Successful</span>
                    </div>
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
