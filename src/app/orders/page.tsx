
'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Clock, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * @fileOverview Real-time Order List Page.
 * Subscribes to Firestore for instant updates while linking to MongoDB-driven detail pages.
 */

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'orders'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

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
          <Package className="h-16 w-16 text-muted-foreground opacity-20" />
          <h1 className="text-2xl font-bold">Your Orders</h1>
          <p className="text-muted-foreground">Sign in to track your acquisitions.</p>
          <Link href="/auth/login" className="bg-primary text-white px-6 py-2 rounded-lg">Sign In</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-primary mb-8">Order History</h1>

          {!orders?.length ? (
            <div className="text-center py-20 bg-white rounded-3xl border">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-4" />
              <p className="text-xl font-medium text-muted-foreground">No orders yet</p>
              <Link href="/products" className="text-primary hover:underline mt-4 inline-block font-semibold">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-none shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Order <span className="text-primary">{order.orderNumber}</span>
                      </div>
                      <Badge className={
                        order.orderStatus === 'Canceled' ? 'bg-destructive text-white' : 
                        order.orderStatus === 'Delivered' ? 'bg-green-600 text-white' :
                        'bg-accent text-accent-foreground'
                      }>
                        {order.orderStatus}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date N/A'}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">Total Amount</p>
                          <p className="text-lg font-extrabold text-primary">₹{(order.totalAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" color={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          Payment: {order.paymentStatus?.toUpperCase() || 'PENDING'}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders/${order.orderNumber}`} className="flex items-center">
                            Details <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
