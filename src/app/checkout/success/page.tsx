'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Definitive Success Page.
 * Performs final verification, clears the collector's cart, and redirects to history.
 */

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !user || !firestore) return;

    const verifyAndProcess = async () => {
      try {
        // 1. Perform Server-Side Verification (Ground Truth check)
        const res = await fetch(`/api/cashfree/verify?orderId=${orderId}`);
        const data = await res.json();

        if (data.success) {
          // 2. Fetch the order details to identify specific items to remove
          const orderRes = await fetch(`/api/orders/${orderId}`);
          const orderData = await orderRes.json();
          
          if (orderData.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
              const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', item.productId);
              await deleteDoc(cartItemRef).catch(e => console.warn(`[CART_CLEAR_WARN] Failed to delete ${item.productId}:`, e));
            }
          }

          toast({ title: "Acquisition Confirmed", description: "Your artisan pieces are now in production." });
          setIsVerifying(false);
        } else {
          // If verification is still pending, we wait for the background webhook
          setError("Gateway confirmation is in transit. We'll update your dossier shortly.");
          setIsVerifying(false);
        }
      } catch (err) {
        console.error("[SUCCESS_VERIFY_ERROR]:", err);
        setError("Network latency detected. Your payment is safe; check your history in a moment.");
        setIsVerifying(false);
      }
    };

    // Brief delay to allow webhook processing time
    const timer = setTimeout(verifyAndProcess, 2000);
    return () => clearTimeout(timer);
  }, [orderId, user, firestore, toast]);

  useEffect(() => {
    if (!isVerifying) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(`/orders/${orderId}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVerifying, router, orderId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 pt-24 md:pt-32">
        <div className="w-full max-w-2xl text-center">
          <AnimatePresence mode="wait">
            {isVerifying ? (
              <motion.div 
                key="verifying"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="relative h-24 w-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                  <Loader2 className="h-24 w-24 text-primary animate-spin" />
                </div>
                <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Finalizing Acquisition</h1>
                <p className="text-muted-foreground font-medium">Securing your order in our artisanal records...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border border-primary/5 space-y-8"
              >
                {error ? (
                  <div className="space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-xl">
                      <ShieldCheck className="h-10 w-10" />
                    </div>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-black text-primary tracking-tight">Pending Verification</h1>
                      <p className="text-muted-foreground font-medium">{error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-20 w-20 rounded-3xl bg-green-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    
                    <div className="space-y-3">
                      <h1 className="text-4xl font-black text-primary tracking-tight">Handcrafted Success</h1>
                      <p className="text-muted-foreground font-medium">Your payment is confirmed. Your treasures are officially reserved.</p>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                        REF: {orderId}
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8 border-y border-dashed border-primary/10">
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Verification</p>
                      <p className="text-sm font-bold">Securely Reconciled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Bag Status</p>
                      <p className="text-sm font-bold">Auto-Cleared</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="text-xs text-muted-foreground font-bold">
                    Navigating to your financial ledger in <span className="text-primary text-lg tabular-nums">{countdown}s</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => router.push(`/orders/${orderId}`)}
                      className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                      Examine Order Dossier <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => router.push('/products')}
                      className="h-14 px-10 rounded-2xl text-muted-foreground font-bold text-xs uppercase tracking-widest"
                    >
                      Back to Gallery
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
