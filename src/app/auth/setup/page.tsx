'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { 
  EmailAuthProvider, 
  linkWithCredential 
} from 'firebase/auth';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SetupPage() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const [step, setStep] = useState<'details' | 'verify-email'>('details');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    const phone = sessionStorage.getItem('reg_phone');
    if (!phone) {
      router.replace('/auth/register');
      return;
    }
    setVerifiedPhone(phone);
  }, [router]);

  const handleContinue = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 chars');
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
        body: JSON.stringify({ email: formData.email }),
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

  const handleCreateAccount = async (code: string) => {
    if (code.length < 6) return;
    if (!user) {
      setError('Session expired. Please restart registration.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Step 1: Verify email OTP in DB
      const verifyRes = await fetch('/api/auth/email-otp/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: code }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || 'Invalid OTP');
      
      // Step 2: Link email/pass to existing phone user
      const emailCredential = EmailAuthProvider.credential(formData.email, formData.password);
      await linkWithCredential(user, emailCredential);
      
      // Step 3: Refresh session
      const idToken = await user.getIdToken(true);
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      // Step 4: Finalize MongoDB Profile
      await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseId: user.uid,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: verifiedPhone,
          phoneVerified: true,
          emailVerified: true,
        }),
      });
      
      sessionStorage.removeItem('reg_phone');
      router.push('/profile');
    } catch (err: any) {
      console.error('[SETUP ERROR]:', err);
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already linked to another account.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.',
        'auth/provider-already-linked': 'Email already linked to this account.',
      };
      setError(msgs[err.code] || err.message);
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 py-20">
      <div className="w-full max-w-xl space-y-10">
        
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[
            { label: 'Phone', done: true },
            { label: 'Details', done: step === 'verify-email' },
            { label: 'Email', done: false },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest",
                s.done ? "text-primary" : "text-muted-foreground opacity-40"
              )}>
                {s.done ? <CheckCircle2 size={12} /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                {s.label}
              </div>
              {i < 2 && <div className="h-px w-8 bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-16 space-y-10 border border-primary/5">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-display font-black text-primary tracking-tight">
              {step === 'details' ? 'Complete Your Profile' : 'Verify Your Email'}
            </h2>
            <p className="text-muted-foreground font-medium text-sm">
              {step === 'details' ? `Phone ${verifiedPhone} verified ✓` : `Code sent to ${formData.email}`}
            </p>
          </div>

          <div className="space-y-6">
            {step === 'details' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">First Name</Label>
                    <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Aarav" className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Last Name</Label>
                    <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Sharma" className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Email Address</Label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="aarav@example.com" className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Set Password</Label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full h-14 px-6 pr-14 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Confirm Password</Label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="••••••••" className="w-full h-14 px-6 pr-14 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] font-medium text-muted-foreground italic pl-1">Min 8 characters required.</p>

                <button onClick={handleContinue} disabled={isLoading} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 mt-4">
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Continue →'}
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                        if (newOtp.every(d => d)) handleCreateAccount(newOtp.join(''));
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i - 1].current?.focus();
                      }}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border bg-white focus:border-primary focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleCreateAccount(otpDigits.join(''))}
                  disabled={isLoading || otpDigits.join('').length < 6}
                  className="w-full h-16 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Create Account
                </button>
                <button 
                  onClick={() => { setStep('details'); setOtpDigits(['', '', '', '', '', '']); setError(''); }}
                  className="w-full text-xs text-muted-foreground font-bold hover:text-primary transition-colors"
                >
                  ← Change email
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 animate-in shake-1">
                <AlertCircle size={18} className="text-destructive flex-shrink-0" />
                <p className="text-destructive text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
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
            {step === 'details' ? 'Sending Code...' : 'Creating your account...'}
          </p>
        </div>
      )}
    </div>
  );
}
