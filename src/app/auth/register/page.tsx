'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from 'firebase/auth';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  Phone,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const recaptchaVerifierRef = useRef<any>(null);
  const confirmationResultRef = useRef<any>(null);
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleSendOtp = async () => {
    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setError('Enter a valid 10-digit number');
      return;
    }
    
    const phoneE164 = `+91${rawPhone.slice(-10)}`;
    setIsLoading(true);
    setError('');
    
    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
      
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { 
          size: 'invisible',
          callback: () => console.log('[reCAPTCHA] Solved')
        }
      );
      
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneE164,
        recaptchaVerifierRef.current
      );
      
      confirmationResultRef.current = confirmation;
      setStep('verify');
    } catch (err: any) {
      console.error('[REGISTER OTP]:', err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
      const msgs: Record<string, string> = {
        'auth/invalid-phone-number': 'Invalid phone number.',
        'auth/too-many-requests': 'Too many attempts. Try later.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length < 6 || !confirmationResultRef.current) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await confirmationResultRef.current.confirm(code);
      const idToken = await result.user.getIdToken(true);
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      sessionStorage.setItem('reg_phone', result.user.phoneNumber || '');
      router.push('/auth/setup');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/invalid-verification-code': 'Incorrect OTP.',
        'auth/code-expired': 'OTP expired. Request new one.',
      };
      setError(msgs[err.code] || err.message);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel */}
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
              'Verified Artisan Support'
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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <Link href="/" className="font-display font-black text-4xl text-primary tracking-tighter">Kalamic</Link>
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">
              {step === 'phone' ? 'Create Account' : 'Verify Identity'}
            </h2>
            <p className="text-muted-foreground font-medium text-sm">
              {step === 'phone' ? 'Start with your phone number' : `OTP sent to +91 ${phone}`}
            </p>
          </div>

          <div className="space-y-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="h-14 px-4 rounded-2xl border-2 border-border bg-white flex items-center text-sm font-bold flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder="10-digit number"
                    maxLength={10}
                    className="flex-1 h-14 px-5 rounded-2xl border-2 border-border bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || phone.length < 10}
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
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
                        if (val && i < 5) otpRefs[i + 1].current?.focus();
                        if (newOtp.every(d => d)) handleVerifyOtp(newOtp.join(''));
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i - 1].current?.focus();
                      }}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border bg-white focus:border-primary focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleVerifyOtp(otpDigits.join(''))}
                  disabled={isLoading || otpDigits.join('').length < 6}
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  Verify & Continue
                </button>
                <button 
                  onClick={() => { setStep('phone'); setOtpDigits(['', '', '', '', '', '']); setError(''); }}
                  className="w-full text-xs text-muted-foreground font-bold hover:text-primary transition-colors"
                >
                  ← Change number
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 animate-in shake-1">
                <AlertCircle size={16} className="text-destructive flex-shrink-0" />
                <p className="text-destructive text-xs font-bold">{error}</p>
              </div>
            )}

            {step === 'phone' && (
              <p className="text-center text-sm text-muted-foreground font-medium">
                Already have an account? <Link href="/auth/login" className="font-black text-primary hover:underline uppercase tracking-widest text-xs">Sign In</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-sm font-black text-foreground uppercase tracking-widest">
            {step === 'phone' ? 'Sending OTP...' : 'Verifying...'}
          </p>
        </div>
      )}

      <div id="recaptcha-container" />
    </div>
  );
}
