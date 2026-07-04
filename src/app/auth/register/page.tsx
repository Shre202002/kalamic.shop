'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<'credentials' | 'verify-email'>('credentials');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSendOtp = async () => {
    const { email, password, confirmPassword } = formData;
    
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/email-otp/send-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setStep('verify-email');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSignup = async (code: string) => {
    if (code.length < 6) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Verify email OTP in DB
      const verifyRes = await fetch('/api/auth/email-otp/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: code }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || 'Invalid or expired OTP');
      
      // 2. Create Firebase User
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 3. Setup Session
      const idToken = await result.user.getIdToken(true);
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      // 4. Sync Initial Profile to MongoDB
      await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseId: result.user.uid,
          email: formData.email,
          firstName: '',
          lastName: '',
          phone: '',
          phoneVerified: false,
          emailVerified: true,
        }),
      });
      
      router.push('/auth/complete-profile');
    } catch (err: any) {
      console.error('[REGISTRATION ERROR]:', err);
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.',
      };
      setError(msgs[err.code] || err.message);
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 text-white space-y-8 max-w-md">
          <Link href="/" className="font-display font-black text-6xl tracking-tighter text-white hover:text-white">Kalamic</Link>
          <p className="text-xl font-medium text-white/80 leading-relaxed">
            Join our community of art collectors and heritage enthusiasts.
          </p>
          <div className="space-y-5">
            {[
              'Early Access to Kiln Firings',
              'Personalized Collection Management',
              'Verified Artisan Support'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <CheckCircle2 size={16} /> <span className="font-bold text-sm uppercase tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Register Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">
              {step === 'credentials' ? 'Create Account' : 'Verify Email'}
            </h2>
            <p className="text-muted-foreground font-medium text-sm">
              {step === 'credentials' ? 'Start your artisan journey' : `OTP sent to ${formData.email}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'credentials' ? (
              <motion.div 
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Email Address</Label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="aarav@example.com" 
                      className="w-full h-14 px-5 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium"
                      suppressHydrationWarning
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Password</Label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="••••••••" 
                        className="w-full h-14 px-5 pr-14 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" 
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Confirm Password</Label>
                    <div className="relative">
                      <input 
                        type={showConfirm ? 'text' : 'password'} 
                        value={formData.confirmPassword} 
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                        placeholder="••••••••" 
                        className="w-full h-14 px-5 pr-14 rounded-2xl border-2 border-border focus:border-primary transition-all text-sm font-medium" 
                      />
                      <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSendOtp} 
                  disabled={isLoading} 
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Register Now'}
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-background px-4 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <GoogleAuthButton label="Sign up with Google" />
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
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
                        if (next.every(d => d)) handleVerifyAndSignup(next.join(''));
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i-1].current?.focus();
                      }}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border focus:border-primary transition-all"
                    />
                  ))}
                </div>
                
                <div className="text-center">
                  <button onClick={() => setStep('credentials')} className="text-xs text-muted-foreground font-bold hover:text-primary transition-colors">
                    ← Change email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground font-medium">
            Already have an account? <Link href="/auth/login" className="font-black text-primary hover:underline uppercase tracking-widest text-xs">Sign In</Link>
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-sm font-black text-foreground uppercase tracking-widest">Processing...</p>
        </div>
      )}
    </div>
  );
}