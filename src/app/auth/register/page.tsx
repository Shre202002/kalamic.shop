'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  CheckAuthProvider
} from 'firebase/auth';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const auth = useAuth();

  const setSession = async (user: any) => {
    const idToken = await user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await setSession(result.user);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile with name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`.trim()
      });

      await setSession(result.user);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password should be at least 6 characters.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 text-white space-y-8 max-w-md">
          <Link href="/" className="font-display font-black text-6xl tracking-tighter">Kalamic</Link>
          <p className="text-xl font-medium text-white/80 leading-relaxed">
            Join our community of art collectors and heritage enthusiasts.
          </p>
          <div className="space-y-5">
            {[
              'Early Access to Kiln Firings',
              'Personalized Collection Management',
              'Direct Support from Kanpur Artisans'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <span className="font-bold text-sm uppercase tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - auth form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          
          <div className="lg:hidden text-center">
            <Link href="/" className="font-display font-black text-4xl text-primary tracking-tighter">Kalamic</Link>
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Create Account</h2>
            <p className="text-muted-foreground font-medium text-sm">Start your artisanal collection today</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl border-2 border-border bg-white flex items-center justify-center gap-3 font-black text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 shadow-sm hover:shadow-md text-xs uppercase tracking-widest"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground font-black uppercase tracking-widest">or register with email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
              />
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="w-full h-14 px-6 pr-14 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create Account'}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 animate-in shake-1">
              <AlertCircle size={18} className="text-destructive flex-shrink-0" />
              <p className="text-destructive text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground font-medium">
            Already have an account? <Link href="/auth/login" className="font-black text-primary hover:underline uppercase tracking-widest text-xs">Sign In</Link>
          </p>

        </div>
      </div>
    </div>
  );
}