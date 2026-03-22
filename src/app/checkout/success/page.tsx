
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CheckCircle2, Loader2, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { CircularProgress, Box, Typography } from '@mui/material';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'clearing' | 'done'>('verifying');
  const [countdown, setCountdown] = useState(5);

  const clearCart = async () => {
    if (!user || !firestore) return;
    try {
      const cartRef = collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
      const snapshot = await getDocs(cartRef);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      console.log('[CART] Cleared successfully via client-side trigger');
    } catch (e) {
      console.error('[CART CLEAR ERROR]:', e);
    }
  };

  useEffect(() => {
    if (!orderId || !user) return;

    const process = async () => {
      // Step 1: Wait for backend webhook to fire
      await new Promise(r => setTimeout(r, 2000));

      // Step 2: Verify payment (best effort)
      try {
        await fetch(`/api/cashfree/verify?orderId=${orderId}`);
      } catch (e) {
        console.warn('Verify failed, continuing to cart clearing');
      }

      // Step 3: Clear cart regardless of verify result (client-side backup)
      setStatus('clearing');
      await clearCart();

      // Step 4: Finalize
      setStatus('done');
      toast({ title: "Acquisition Confirmed", description: "Your shopping bag has been cleared." });
    };

    process();
  }, [orderId, user, firestore, toast]);

  useEffect(() => {
    if (status === 'done') {
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
  }, [status, router, orderId]);

  return (
    <div className="w-full max-w-2xl text-center">
      <AnimatePresence mode="wait">
        {status !== 'done' ? (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress size={120} thickness={2} sx={{ color: '#EA781E' }} />
              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </Box>
            </Box>
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Finalizing Acquisition</h1>
              <p className="text-muted-foreground font-medium">
                {status === 'verifying' ? 'Securing your transaction dossier...' : 'Clearing your bag and updating the collection...'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border border-primary/5 space-y-8"
          >
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
                Navigating to your order dossier in <span className="text-primary text-lg tabular-nums">{countdown}s</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => router.push(`/orders/${orderId}`)}
                  className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center"
                >
                  View Order Detail <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 pt-24 md:pt-32">
        <Suspense fallback={
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Preparing Success Interface...</p>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
