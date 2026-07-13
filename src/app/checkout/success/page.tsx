'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, Loader2, 
  RefreshCw, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Suspense } from 'react';
import { trackEvent } from '@/lib/analytics';

type PaymentState = 'checking' | 'success' | 'failed' | 'pending';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const orderId = searchParams.get('order_id');
  
  const [state, setState] = useState<PaymentState>('checking');
  const [orderNumber, setOrderNumber] = useState('');
  const [failReason, setFailReason] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const clearCart = async () => {
    if (!user || !firestore) return;
    try {
      const cartRef = collection(
        firestore,
        'users', user.uid,
        'cart', 'cart', 'items'
      );
      const snapshot = await getDocs(cartRef);
      await Promise.all(
        snapshot.docs.map(d => deleteDoc(d.ref))
      );
      console.log('[CART] Cleared successfully');
    } catch (e) {
      console.error('[CART CLEAR ERROR]:', e);
    }
  };

  useEffect(() => {
    if (isUserLoading) return;
    if (hasRun) return;
    setHasRun(true);

    if (!orderId) {
      setState('failed');
      setFailReason('No order reference found.');
      return;
    }

    const verify = async () => {
      try {
        console.log('[SUCCESS] Verifying:', orderId);

        // Wait 2 seconds for webhook to potentially settle
        await new Promise(r => setTimeout(r, 2000));

        // Call verify endpoint
        const res = await fetch('/api/cashfree/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });

        const data = await res.json();
        console.log('[SUCCESS] Verify data:', data);

        // Determine payment result
        const isPaid =
          data.paymentVerified === true &&
          data.paymentStatus === 'paid' &&
          data.paymentId !== null &&
          data.paymentId !== undefined &&
          data.paymentId !== '';

        const isFailed =
          data.paymentStatus === 'failed' ||
          data.paymentStatus === 'cancelled' ||
          (!data.paymentVerified && 
           data.paymentId === null &&
           data.orderStatus === 'Cancelled');

        if (isPaid) {
          const transactionId = data.ecommerce?.transactionId || data.orderNumber || orderId;
          const storageKey = `kalamic:ga4-purchase:${transactionId}`;
          if (data.ecommerce && !window.localStorage.getItem(storageKey)) {
            const tracked = trackEvent('purchase', {
              transaction_id: transactionId,
              value: data.ecommerce.value,
              tax: data.ecommerce.tax,
              shipping: data.ecommerce.shipping,
              currency: data.ecommerce.currency || 'INR',
              items: data.ecommerce.items,
            });
            if (tracked) window.localStorage.setItem(storageKey, '1');
          }
          await clearCart();
          setState('success');
          setOrderNumber(data.orderNumber || orderId);
          
          setTimeout(() => {
            router.push(`/orders/${data.orderNumber || orderId}`);
          }, 3000);

        } else if (isFailed) {
          setState('failed');
          setFailReason(data.message || 'Your payment was not completed. No amount was charged.');

        } else {
          setState('pending');
          setOrderNumber(data.orderNumber || orderId);
        }

      } catch (err: any) {
        console.error('[VERIFY ERROR]:', err);
        setState('failed');
        setFailReason('Could not verify payment status. Please contact support if amount was deducted.');
      }
    };

    verify();
  }, [isUserLoading, orderId, firestore, router, user, hasRun]);

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 px-4">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl text-foreground">Verifying Payment...</h1>
              <p className="text-muted-foreground text-sm font-medium">Please wait. Do not close this page.</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-100" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-200" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl text-foreground">Order Confirmed! 🎉</h1>
              <p className="text-muted-foreground font-medium">Payment successful. Your handcrafted piece is on its way!</p>
              {orderNumber && (
                <p className="text-sm font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full inline-block">
                  REF: {orderNumber}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Redirecting to your order details...</p>
            <Link href={`/orders/${orderNumber}`}>
              <button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                View Order →
              </button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <RefreshCw className="h-12 w-12 text-yellow-600" style={{ animation: 'spin 3s linear infinite' }} />
            </div>
            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl text-foreground">Payment Processing</h1>
              <p className="text-muted-foreground font-medium text-sm">
                Your transaction is being confirmed by the payment gateway. This can take 2-5 minutes.
              </p>
            </div>
            <div className="space-y-3">
              <Link href={`/orders/${orderNumber}`}>
                <button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  Check Order Status
                </button>
              </Link>
              <Link href="/">
                <button className="w-full h-12 rounded-2xl border-2 border-border text-foreground font-bold text-sm hover:border-primary/30 transition-colors">
                  Return Home
                </button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-2xl">
              If your account was debited, your order will confirm automatically. Contact{' '}
              <a href="mailto:kalamicshop@gmail.com" className="text-primary font-bold">kalamicshop@gmail.com</a> if not confirmed within 24 hours.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-black text-3xl text-foreground">Payment Failed</h1>
            <p className="text-muted-foreground font-medium text-sm">
              {failReason || 'Your payment could not be completed.'}
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-2xl text-left space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-foreground">What happened?</p>
            <ul className="text-xs text-muted-foreground space-y-1 font-medium">
              <li>• No amount was deducted from your account</li>
              <li>• Your cart items are still saved</li>
              <li>• You can try again immediately</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/cart">
              <button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <ShoppingBag size={18} />
                Try Again
              </button>
            </Link>
            <Link href="/products">
              <button className="w-full h-12 rounded-2xl border-2 border-border text-foreground font-bold text-sm hover:border-primary/30 transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="mailto:kalamicshop@gmail.com" className="flex items-center gap-2 text-xs text-primary font-bold hover:underline">
              📧 kalamicshop@gmail.com
            </a>
            <span className="text-border">|</span>
            <a href="tel:+917376761679" className="flex items-center gap-2 text-xs text-primary font-bold hover:underline">
              📞 7376761679
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
