'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithCustomToken
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* 
 FIREBASE CONSOLE SETUP REQUIRED:
 1. Authentication → Sign-in method → Google → Enable
 2. Add authorized domains:
    - kalamic.shop
    - studio-6917027295-9c66e.firebaseapp.com
    - studio-6917027295-9c66e.web.app
    - localhost
*/

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'email'>('password');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const auth = useAuth();

  // Handle Google Redirect Result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const authInstance = getAuth();
        const result = await getRedirectResult(authInstance);
        
        if (!result) return; 
        
        setIsLoading(true);
        const idToken = await result.user.getIdToken(true);
        
        const sessionRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        
        if (!sessionRes.ok) {
          const errData = await sessionRes.json();
          throw new Error(errData.message || 'Session failed');
        }
        
        await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseId: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL,
          }),
        });
        
        router.push('/');
      } catch (err: any) {
        console.error('[GOOGLE REDIRECT ERROR]:', err);
        if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Google sign-in failed. Try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    handleRedirectResult();
  }, [router]);

  useEffect(() => {
    if (user) {
      const from = searchParams.get('from') || '/';
      router.push(from);
    }
  }, [user, router, searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const authInstance = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      await setPersistence(authInstance, browserLocalPersistence);
      
      try {
        await signInWithRedirect(authInstance, provider);
      } catch (redirectErr: any) {
        console.warn('[GOOGLE] Redirect failed, trying popup:', redirectErr.code);
        const result = await signInWithPopup(authInstance, provider);
        const idToken = await result.user.getIdToken(true);
        
        const sessionRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        
        if (!sessionRes.ok) {
          const e = await sessionRes.json();
          throw new Error(e.message || 'Session creation failed');
        }
        
        await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseId: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL,
          }),
        });
        
        router.push('/');
      }
    } catch (err: any) {
      console.error('[GOOGLE ERROR]:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const authInstance = getAuth();
      const result = await signInWithEmailAndPassword(authInstance, email, password);
      
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      router.push('/');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setIsLoading(true);
    try {
      const authInstance = getAuth();
      await sendPasswordResetEmail(authInstance, forgotEmail);
      setForgotSent(true);
    } catch (err: any) {
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    if (!email) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      const authInstance = getAuth();
      await signInWithCustomToken(authInstance, data.token);
      
      const idToken = await authInstance.currentUser?.getIdToken();
      if (idToken) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      }
      
      router.push('/');
    } catch (err: any) {
      setError(err.message);
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
            Heritage in Every Curve. Artisan ceramics for the modern home.
          </p>
          <div className="space-y-5">
            {[
              '500+ Handcrafted Ceramic Pieces',
              'Artisans from Kanpur, India',
              'FragileCare™ Delivery Nationwide'
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
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium text-sm">Sign in to access your collection</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl border-2 border-border bg-white flex items-center justify-center gap-3 font-bold text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 shadow-sm hover:shadow-md text-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground font-bold uppercase tracking-wider">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
            {['Password', 'Email OTP'].map((tab) => {
              const tabId = tab.toLowerCase().replace(' otp', '');
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tabId as any);
                    setStep('input');
                    setError('');
                  }}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200",
                    activeTab === tabId ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'password' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-14 px-5 rounded-2xl border-2 border-border bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordSignIn()}
                      placeholder="Password"
                      className="w-full h-14 px-5 pr-14 rounded-2xl border-2 border-border bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button onClick={() => setShowForgot(true)} className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
                </div>

                <button
                  onClick={handlePasswordSignIn}
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sign In'}
                </button>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {step === 'input' ? (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendEmailOTP()}
                      placeholder="Your email address"
                      className="w-full h-14 px-5 rounded-2xl border-2 border-border bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={handleSendEmailOTP}
                      disabled={isLoading || !email}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-6 text-center">
                    <p className="text-sm text-muted-foreground font-medium">OTP sent to <span className="text-primary font-bold block">{email}</span></p>
                    <div className="flex gap-2 justify-center">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={otpRefs[i]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newOtp = [...otpDigits];
                            newOtp[i] = val;
                            setOtpDigits(newOtp);
                            if (val && i < 5) otpRefs[i+1].current?.focus();
                            if (newOtp.every(d => d)) handleVerifyEmailOTP(newOtp.join(''));
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i-1].current?.focus();
                          }}
                          className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border bg-white focus:border-primary focus:outline-none transition-colors"
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleVerifyEmailOTP(otpDigits.join(''))}
                      disabled={isLoading || otpDigits.join('').length < 6}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify & Sign In'}
                    </button>
                    <button onClick={() => setStep('input')} className="w-full text-xs text-muted-foreground font-bold hover:text-primary transition-colors">← Change email</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
              <AlertCircle size={16} className="text-destructive flex-shrink-0" />
              <p className="text-destructive text-xs font-bold">{error}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground font-medium">
            New to Kalamic? <Link href="/auth/register" className="font-black text-primary hover:underline">Create Account</Link>
          </p>

        </div>
      </div>

      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-foreground">Reset Password</h3>
                <button onClick={() => { setShowForgot(false); setForgotEmail(''); setForgotSent(false); }} className="text-muted-foreground hover:text-primary transition-colors"><X size={20} /></button>
              </div>
              
              {forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={32} className="text-green-600" /></div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">Reset Link Dispatched</p>
                    <p className="text-sm text-muted-foreground">Check your inbox at <span className="text-primary font-bold">{forgotEmail}</span></p>
                  </div>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="w-full h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Back to Sign In</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground font-medium">Enter your email and we'll send a reset link.</p>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="your@email.com" className="w-full h-14 px-5 rounded-2xl border-2 border-border text-sm font-medium focus:outline-none focus:border-primary transition-colors" />
                  <button onClick={handleForgotPassword} disabled={isLoading || !forgotEmail} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send Reset Link'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
