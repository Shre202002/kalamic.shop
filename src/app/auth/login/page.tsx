'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword,
  signInWithCustomToken
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Mail,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

type LoginTab = 'password' | 'email-otp' | 'google';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<LoginTab>('password');
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const auth = useAuth();
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handlePasswordSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!sessionRes.ok) throw new Error('Session creation failed');
      router.push('/products');
    } catch (err: any) {
      console.error('[LOGIN ERROR]:', err);
      const msgs: Record<string, string> = {
        'auth/wrong-password': 'Incorrect password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/invalid-credential': 'Invalid login credentials.',
        'auth/too-many-requests': 'Account locked temporarily. Please try again later.'
      };
      setError(msgs[err.code] || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) { setError('Email is required.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/email-otp/login-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setOtpStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length < 6) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/email-otp/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      
      const result = await signInWithCustomToken(auth, data.customToken);
      const idToken = await result.user.getIdToken();
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      router.push('/products');
    } catch (err: any) {
      setError(err.message);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
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
          <Link href="/" className="font-display font-black text-6xl tracking-tighter text-white hover:text-white">Kalamic</Link>
          <p className="text-xl font-medium text-white/80 leading-relaxed">
            Heritage in Every Curve. Sign in to access your curated artisan collection.
          </p>
          <div className="space-y-5">
            {['Secure Handcrafted Deliveries', 'Exclusive Collector Stories', 'Studio Rewards Program'].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <CheckCircle2 size={16} /> <span className="font-bold text-sm uppercase tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium text-sm">Access your studio account</p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-2xl">
            {(['password', 'email-otp', 'google'] as const).map((tab) => (
              <button 
                key={tab} 
                onClick={() => { setActiveTab(tab); setError(''); }} 
                className={cn(
                  "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", 
                  activeTab === tab ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              {activeTab === 'password' && (
                <motion.form 
                  key="password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handlePasswordSignIn}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="aarav@example.com" 
                        className="w-full h-14 px-14 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full h-14 px-14 pr-14 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading} 
                    className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign In'}
                  </button>
                </motion.form>
              )}

              {activeTab === 'email-otp' && (
                <motion.div 
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {otpStep === 'email' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Login Email</Label>
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="aarav@example.com" 
                          className="w-full h-14 px-5 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" 
                        />
                      </div>
                      <button 
                        onClick={handleSendOtp} 
                        disabled={isLoading || !email} 
                        className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg"
                      >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Send Code'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 text-center">
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
                              const next = [...otpDigits];
                              next[i] = val;
                              setOtpDigits(next);
                              if (val && i < 5) otpRefs[i+1].current?.focus();
                              if (next.every(d => d)) handleVerifyOtp(next.join(''));
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i-1].current?.focus();
                            }}
                            className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border focus:border-primary transition-all"
                          />
                        ))}
                      </div>
                      <button onClick={() => setOtpStep('email')} className="text-xs text-muted-foreground font-bold hover:text-primary">
                        ← Change email
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'google' && (
                <motion.div 
                  key="google"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 pt-4"
                >
                  <GoogleAuthButton label="Continue with Google" />
                  <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                    Instantly sync your collection across all devices via your Google identity.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in shake-1">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground font-medium">
            New to Kalamic? <Link href="/auth/register" className="font-black text-primary hover:underline uppercase tracking-widest text-xs">Create Account</Link>
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-sm font-black text-foreground uppercase tracking-widest">Verifying Identity...</p>
        </div>
      )}
    </div>
  );
}
