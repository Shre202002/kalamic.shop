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
  Award,
  HelpCircle
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
        <main className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Syncing with Artisan Studio...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-center px-4">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
          <h1 className="text-3xl font-black text-primary mb-2 tracking-tight">Acquisition Not Found</h1>
          <p className="text-muted-foreground mb-10 max-w-sm mx-auto">We couldn't retrieve the details for this order. It may have been archived or the ID is incorrect.</p>
          <Button asChild className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
            <Link href="/orders">View All Acquisitions</Link>
          </Button>
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
      <main className="flex-1 py-6 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Top Navigation & Status Header */}
          <div className="mb-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary -ml-2 font-bold gap-2">
                <Link href="/orders">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Link>
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Journey Tracking</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter">Order {order.id}</h1>
                  <Badge className="bg-accent text-accent-foreground uppercase text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                    {order.orderStatus}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Acquired on {new Date(order.orderDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-xl flex flex-col md:items-end">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Acquisition Value</p>
                <p className="text-4xl font-black text-primary tracking-tighter">₹{order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Progress and Items */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Tracker Card */}
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-8 md:p-10 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                      <Hammer className="h-6 w-6 text-accent" /> Artisan Journey
                    </CardTitle>
                    <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help opacity-50" />
                  </div>
                </CardHeader>
                <CardContent className="p-8 md:p-10">
                  {/* Desktop Stepper */}
                  <div className="hidden md:block relative pt-12 pb-8">
                    <div className="absolute top-[68px] left-[10%] right-[10%] h-1 bg-muted rounded-full" />
                    <div 
                      className="absolute top-[68px] left-[10%] h-1 bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(234,120,30,0.5)]" 
                      style={{ width: `${(displayStatusIndex / (STATUS_STEPS.length - 1)) * 80}%` }}
                    />

                    <div className="grid grid-cols-6 relative z-10">
                      {STATUS_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= displayStatusIndex;
                        const isCurrent = index === displayStatusIndex;

                        return (
                          <div key={step.id} className="flex flex-col items-center text-center px-2">
                            <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-700 border-4",
                              isCompleted ? "bg-primary text-white border-primary/20 shadow-lg shadow-primary/20" : "bg-white text-muted-foreground border-muted shadow-sm",
                              isCurrent && "ring-8 ring-accent/20 scale-110"
                            )}>
                              {isCompleted && index < displayStatusIndex ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : (
                                <Icon className="h-6 w-6" />
                              )}
                            </div>
                            <p className={cn(
                              "text-[10px] font-black uppercase tracking-widest mb-1",
                              isCompleted ? "text-primary" : "text-muted-foreground"
                            )}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Timeline */}
                  <div className="md:hidden space-y-10">
                    {STATUS_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index <= displayStatusIndex;
                      const isCurrent = index === displayStatusIndex;

                      return (
                        <div key={step.id} className="flex gap-6 relative">
                          {/* Connector Line */}
                          {index < STATUS_STEPS.length - 1 && (
                            <div className={cn(
                              "absolute left-7 top-14 bottom-[-40px] w-1 rounded-full",
                              isCompleted ? "bg-primary/20" : "bg-muted"
                            )} />
                          )}
                          
                          <div className={cn(
                            "h-14 w-14 rounded-[1.25rem] flex items-center justify-center shrink-0 z-10 border-4 transition-all duration-500",
                            isCompleted ? "bg-primary text-white border-primary/10 shadow-lg" : "bg-white text-muted-foreground border-muted shadow-sm",
                            isCurrent && "ring-4 ring-accent/30 scale-105"
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>
                          
                          <div className="flex flex-col justify-center">
                            <p className={cn(
                              "text-xs font-black uppercase tracking-widest",
                              isCompleted ? "text-primary" : "text-muted-foreground"
                            )}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium mt-0.5">
                              {step.description}
                            </p>
                            {isCompleted && (
                              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 w-fit">
                                <CheckCircle2 className="h-3 w-3" /> Verified Step
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Items Card */}
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 md:p-10 pb-4 border-b bg-primary/[0.01]">
                  <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                    <Package className="h-6 w-6 text-accent" /> Artisan Treasures
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-primary/5">
                    {items?.map((item) => (
                      <div key={item.id} className="p-8 flex flex-col sm:flex-row items-center gap-8 group hover:bg-primary/[0.02] transition-all">
                        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-[2rem] overflow-hidden bg-muted flex-shrink-0 shadow-2xl border-4 border-white group-hover:scale-105 transition-transform duration-500">
                          <Image 
                            src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`} 
                            alt={item.name} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <h3 className="text-xl font-black text-primary tracking-tight leading-tight group-hover:text-accent transition-colors">
                            {item.name || 'Handcrafted Masterpiece'}
                          </h3>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
                              Quantity: <span className="text-primary">{item.quantity}</span>
                            </p>
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-lg border-primary/10">
                              Artisan SKU: {item.productVariantId?.slice(-6).toUpperCase() || 'UNQ-TR-01'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Price per Piece</p>
                          <p className="text-2xl font-black text-primary">₹{item.priceAtOrder.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Summaries */}
            <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
              
              {/* Shipping Details */}
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.25em] text-accent flex items-center gap-3">
                    <MapPin className="h-4 w-4" /> Destination Studio
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-6 rounded-[2rem] bg-[#FAF4EB] border-2 border-primary/5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-primary leading-none mb-1">{order.shippingDetails?.fullName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{order.shippingDetails?.phone}</p>
                      </div>
                    </div>
                    
                    <Separator className="opacity-10" />
                    
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium italic">
                      "{order.shippingDetails?.address},<br />
                      {order.shippingDetails?.landmark && <span>{order.shippingDetails.landmark}, </span>}
                      {order.shippingDetails?.city}, {order.shippingDetails?.state} - {order.shippingDetails?.zip}"
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.25em] text-accent flex items-center gap-3">
                    Acquisition Logic
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Original Value</span>
                      <span className="text-primary">₹{(order.totalAmount - order.shippingCost).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">FragileCare™ Shipping</span>
                      <span className="text-accent">₹{order.shippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-green-600">
                      <span>Artisan Discount</span>
                      <span>- ₹0.00</span>
                    </div>
                  </div>
                  
                  <Separator className="opacity-30" />
                  
                  <div className="flex justify-between items-end py-2">
                    <span className="text-lg font-black text-primary uppercase tracking-tighter">Net Total</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">₹{order.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="pt-4">
                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-lg shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Transaction Secured</p>
                        <p className="text-[10px] font-bold text-green-600 truncate max-w-[150px]">Ref: {order.paymentId || 'Verified'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support */}
              <div className="p-8 rounded-[2.5rem] bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center text-center gap-4">
                <HelpCircle className="h-8 w-8 text-primary opacity-40" />
                <p className="text-sm font-bold text-primary italic leading-relaxed">
                  Need assistance with your handcrafted treasure?
                </p>
                <Button variant="outline" className="w-full rounded-2xl border-primary text-primary font-bold h-12 hover:bg-primary hover:text-white transition-all">
                  Contact Artisan Studio
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

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
