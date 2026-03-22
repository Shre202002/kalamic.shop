'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, Loader2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const hasRun = useRef(false);
  const [status, setStatus] = useState<'waiting' | 'clearing' | 'done'>('waiting');

  useEffect(() => {
    // CRITICAL: Wait for Firebase auth to initialize
    // Do NOT run if still loading auth state
    if (isUserLoading) return;
    
    // Prevent double execution
    if (hasRun.current) return;
    hasRun.current = true;

    const orderId = searchParams.get('order_id');

    const run = async () => {
      // Step 1: Trigger payment verification 
      // (best effort, don't block on it)
      if (orderId) {
        try {
          fetch(`/api/cashfree/verify?orderId=${orderId}`)
            .catch(() => {});
        } catch(e) {}
      }

      // Step 2: Clear cart if user is logged in
      if (user && firestore) {
        setStatus('clearing');
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
          console.log('[SUCCESS] Cart cleared:', snapshot.docs.length, 'items removed');
        } catch(e) {
          console.error('[SUCCESS] Cart clear failed:', e);
        }
      }

      setStatus('done');

      // Step 3: Redirect to order page or orders list
      setTimeout(() => {
        if (orderId) {
          router.push(`/orders/${orderId}`);
        } else {
          router.push('/orders');
        }
      }, 2000);
    };

    run();
  }, [user, isUserLoading, firestore, router, searchParams]);

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAF4EB',
      gap: '24px',
      padding: '24px',
      textAlign: 'center'
    }}>
      {status === 'done' ? (
        <CheckCircle2 
          size={80} 
          color="#EA781E" 
          strokeWidth={1.5}
        />
      ) : (
        <Loader2 
          size={64} 
          color="#EA781E" 
          className="animate-spin"
        />
      )}
      
      <div style={{ maxWidth: '400px' }}>
        <h1 style={{ 
          fontSize: '2rem',
          fontWeight: 900,
          color: '#271E1B',
          marginBottom: '8px'
        }}>
          {status === 'done' 
            ? 'Order Confirmed!' 
            : 'Processing...'}
        </h1>
        <p style={{ 
          color: '#6b7280',
          fontSize: '0.95rem',
          fontWeight: 500 
        }}>
          {status === 'waiting' && 'Verifying your payment...'}
          {status === 'clearing' && 'Clearing your bag...'}
          {status === 'done' && 'Redirecting to your order...'}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF4EB' }}>
        <Loader2 size={64} color="#EA781E" className="animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}