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
  signInWithCustomToken,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X,
  ChevronLeft,
  Phone,
  Key
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'email' | 'phone'>('password');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const recaptchaVerifierRef = useRef<any>(null);
  const confirmationResultRef = useRef<any>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const auth = useAuth();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result) return; 
        
        setIsLoading(true);
        const idToken = await result.user.getIdToken(true);
        
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        
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
        
        router.push('/profile');
      } catch (err: any) {
        console.error('[GOOGLE REDIRECT ERROR]:', err);
        if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Google sign-in failed.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    handleRedirectResult();
  }, [auth, router]);

  useEffect(() => {
    if (user) {
      const from = searchParams.get('from') || '/profile';
      router.push(from);
    }
  }, [user, router, searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await setPersistence(auth, browserLocalPersistence);
      
      try {
        await signInWithRedirect(auth, provider);
      } catch {
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken(true);
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
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
        router.push('/profile');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      router.push('/profile');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Account locked temporarily. Try later.'
      };
      setError(msgs[err.code] || 'Login failed.');
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
      
      await signInWithCustomToken(auth, data.token);
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      }
      router.push('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    const raw = phoneInput.replace(/\D/g, '');
    if (raw.length < 10) { setError('Valid 10-digit number required'); return; }
    
    setIsLoading(true);
    setError('');
    try {
      if (recaptchaVerifierRef.current) recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      
      const phoneE164 = `+91${raw.slice(-10)}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmation;
      setStep('otp');
    } catch (err: any) {
      setError('SMS delivery failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (code: string) => {
    if (!confirmationResultRef.current) return;
    setIsLoading(true);
    try {
      const result = await confirmationResultRef.current.confirm(code);
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      router.push('/profile');
    } catch {
      setError('Incorrect code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 text-white space-y-8 max-w-md">
          <Link href="/" className="font-display font-black text-6xl tracking-tighter">Kalamic</Link>
          <p className="text-xl font-medium text-white/80 leading-relaxed">Heritage in Every Curve. Artisan ceramics for the modern home.</p>
          <div className="space-y-5">
            {['Handcrafted Ceramic Pieces', 'Direct Artisan Support', 'FragileCare™ Delivery'].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <CheckCircle2 size={16} /> <span className="font-bold text-sm uppercase tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium text-sm">Sign in to access your collection</p>
          </div>

          <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full h-14 rounded-2xl border-2 border-border bg-white flex items-center justify-center gap-3 font-bold hover:bg-primary/5 transition-all shadow-sm text-sm">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-4 text-muted-foreground font-bold uppercase">or</span></div></div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-2xl">
            {['Password', 'Email OTP', 'Phone'].map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab.toLowerCase().replace(' otp', '') as any); setStep('input'); setError(''); }} className={cn("py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", activeTab === tab.toLowerCase().replace(' otp', '') ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}>
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'password' && (
              <div className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full h-14 px-5 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordSignIn()} placeholder="Password" className="w-full h-14 px-5 pr-14 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <button onClick={handlePasswordSignIn} disabled={isLoading} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20">Sign In</button>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                {step === 'input' ? (
                  <>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full h-14 px-5 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" />
                    <button onClick={handleSendEmailOTP} disabled={isLoading || !email} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest">Send OTP</button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-2 justify-center">
                      {otpDigits.map((digit, i) => (
                        <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => { const val = e.target.value.replace(/\D/g, ''); const next = [...otpDigits]; next[i] = val; setOtpDigits(next); if (val && i < 5) otpRefs[i+1].current?.focus(); if (next.every(d => d)) handleVerifyEmailOTP(next.join('')); }} onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i-1].current?.focus(); }} className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border" />
                      ))}
                    </div>
                    <button onClick={() => setStep('input')} className="w-full text-xs text-muted-foreground font-bold">← Change email</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'phone' && (
              <div className="space-y-4">
                {step === 'input' ? (
                  <>
                    <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit Phone" className="w-full h-14 px-5 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" />
                    <button onClick={handleSendPhoneOTP} disabled={isLoading || phoneInput.length < 10} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest">Send SMS</button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-2 justify-center">
                      {otpDigits.map((digit, i) => (
                        <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => { const val = e.target.value.replace(/\D/g, ''); const next = [...otpDigits]; next[i] = val; setOtpDigits(next); if (val && i < 5) otpRefs[i+1].current?.focus(); if (next.every(d => d)) handleVerifyPhoneOTP(next.join('')); }} onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i-1].current?.focus(); }} className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border" />
                      ))}
                    </div>
                    <button onClick={() => setStep('input')} className="w-full text-xs text-muted-foreground font-bold">← Change number</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold"><AlertCircle size={16} />{error}</div>}

          <p className="text-center text-sm text-muted-foreground font-medium">New to Kalamic? <Link href="/auth/register" className="font-black text-primary hover:underline uppercase tracking-widest text-xs">Create Account</Link></p>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
          <p className="text-sm font-black text-foreground uppercase tracking-widest">Processing...</p>
        </div>
      )}

      <div id="recaptcha-container" />
    </div>
  );
}
