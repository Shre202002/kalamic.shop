'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  getAdditionalUserInfo 
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthButtonProps {
  label: string;
}

export function GoogleAuthButton({ label }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
      
      const idToken = await result.user.getIdToken(true);
      
      // Create session
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionRes.ok) throw new Error('Failed to create session');

      // Sync profile
      await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseId: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          photoURL: result.user.photoURL,
          emailVerified: true,
          phone: '',
          phoneVerified: false
        }),
      });

      if (isNewUser) {
        router.push('/auth/complete-profile');
      } else {
        router.push('/products');
      }
    } catch (err: any) {
      console.error('[GOOGLE AUTH ERROR]:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: err.message || 'Please try again or use another method.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGoogleSignIn} 
      disabled={isLoading} 
      className="w-full h-14 rounded-2xl border-2 border-border bg-white flex items-center justify-center gap-3 font-bold hover:bg-primary/5 transition-all shadow-sm text-sm"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {label}
    </button>
  );
}
