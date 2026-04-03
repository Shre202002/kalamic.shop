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
  RecaptchaVerifier,
  signInWithPhoneNumber,
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

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'email' | 'phone'>('password');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const recaptchaVerifierRef = useRef<any>(null);
  const confirmationResultRef = useRef<any>(null);

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
        
        if (!result) return; // no redirect in progress
        
        console.log('[GOOGLE REDIRECT] Got result:', result.user.email);
        setIsLoading(true);
        
        // Get fresh ID token
        const idToken = await result.user.getIdToken(true);
        
        console.log('[GOOGLE REDIRECT] Got ID token, calling session API...');
        
        // Create server session
        const sessionRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        
        if (!sessionRes.ok) {
          const errData = await sessionRes.json();
          throw new Error(errData.message || `Session failed: ${sessionRes.status}`);
        }
        
        // Ensure profile exists in MongoDB
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
        
        console.log('[GOOGLE REDIRECT] Success, redirecting...');
        router.push('/');
        router.refresh();
        
      } catch (err: any) {
        console.error('[GOOGLE REDIRECT ERROR]:', err);
        if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Google sign-in failed. Please try again.');
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

  useEffect(() => {
    if (activeTab === 'phone' && !recaptchaVerifierRef.current) {
      const authInstance = getAuth();
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(authInstance, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (e) {
        console.error('reCAPTCHA init failed', e);
      }
    }
  }, [activeTab]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const authInstance = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 
        prompt: 'select_account' 
      });
      // This redirects away and comes back — result handled in useEffect above
      await signInWithRedirect(authInstance, provider);
    } catch (err: any) {
      console.error('[GOOGLE ERROR]:', err);
      setError('Could not start Google sign-in.');
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
      router.refresh();
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(msgs[err.code] || 'Authentication failed.');
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
      const result = await signInWithCustomToken(authInstance, data.token);
      
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    setError('');
    try {
      const authInstance = getAuth();
      const fullPhone = `+91${phone}`;
      confirmationResultRef.current = await signInWithPhoneNumber(authInstance, fullPhone, recaptchaVerifierRef.current);
      setStep('otp');
    } catch (err: any) {
      setError('Failed to send SMS. Please check the number or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await confirmationResultRef.current.confirm(code);
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div id="recaptcha-container" />
      
      {/* Left Panel - Desktop Only */}
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
              'Traditional Artisans from Kanpur, India',
              'Secure FragileCare™ Nationwide Delivery'
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

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          
          <div className="lg:hidden text-center">
            <Link href="/" className="font-display font-black text-4xl text-primary tracking-tighter">Kalamic</Link>
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium text-sm">Access your private artisan collection</p>
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
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground font-black uppercase tracking-widest">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted rounded-2xl">
            {['Password', 'Email OTP', 'Phone'].map((tab) => {
              const tabId = tab.toLowerCase().replace(' otp', '').replace(' ', '-');
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tabId as any);
                    setStep('input');
                    setError('');
                  }}
                  className={cn(
                    "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    activeTab === tabId ? "bg-white shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
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
                    className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordSignIn()}
                      placeholder="Password"
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
                </div>
                
                <div className="flex justify-end">
                  <button onClick={() => setShowForgot(true)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot password?</button>
                </div>

                <button
                  onClick={handlePasswordSignIn}
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
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
                      className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
                    />
                    <button
                      onClick={handleSendEmailOTP}
                      disabled={isLoading || !email}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-6 text-center">
                    <p className="text-sm text-muted-foreground font-medium">OTP sent to <span className="text-primary font-bold">{email}</span></p>
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
                          className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border bg-white focus:border-primary focus:outline-none transition-all"
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleVerifyEmailOTP(otpDigits.join(''))}
                      disabled={isLoading || otpDigits.join('').length < 6}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify & Sign In'}
                    </button>
                    <button onClick={() => setStep('input')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">← Change email</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'phone' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {step === 'input' ? (
                  <>
                    <div className="flex gap-2">
                      <div className="h-14 px-4 rounded-2xl border-2 border-border bg-muted flex items-center text-sm font-black text-foreground">🇮🇳 +91</div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                        onKeyDown={e => e.key === 'Enter' && handleSendPhoneOTP()}
                        placeholder="Mobile number"
                        className="flex-1 h-14 px-6 rounded-2xl border-2 border-border bg-white text-sm font-bold focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSendPhoneOTP}
                      disabled={isLoading || phone.length < 10}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-6 text-center">
                    <p className="text-sm text-muted-foreground font-medium">OTP sent to <span className="text-primary font-bold">+91 {phone}</span></p>
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
                            if (newOtp.every(d => d)) handleVerifyPhoneOTP(newOtp.join(''));
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i-1].current?.focus();
                          }}
                          className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-border bg-white focus:border-primary focus:outline-none transition-all"
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleVerifyPhoneOTP(otpDigits.join(''))}
                      disabled={isLoading || otpDigits.join('').length < 6}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify & Sign In'}
                    </button>
                    <button onClick={() => setStep('input')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">← Change number</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 animate-in shake-1">
              <AlertCircle size={18} className="text-destructive flex-shrink-0" />
              <p className="text-destructive text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground font-medium">
            New to Kalamic? <Link href="/auth/register" className="font-black text-primary hover:underline uppercase tracking-widest text-xs">Create Account</Link>
          </p>

        </div>
      </div>

      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md space-y-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowForgot(false); setForgotEmail(''); setForgotSent(false); }} className="absolute top-8 right-8 text-muted-foreground hover:text-primary transition-colors"><X size={24} /></button>
              <div className="space-y-2">
                <h3 className="font-display font-black text-2xl text-foreground tracking-tight">Reset Password</h3>
                <p className="text-muted-foreground text-sm font-medium">Recover your artisanal credentials</p>
              </div>
              
              {forgotSent ? (
                <div className="text-center space-y-6 py-4">
                  <div className="h-20 w-20 rounded-[2rem] bg-green-100 flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={40} className="text-green-600" /></div>
                  <div className="space-y-2">
                    <p className="font-black text-foreground uppercase tracking-widest">Reset Link Dispatched</p>
                    <p className="text-sm text-muted-foreground">Check your inbox at <span className="text-primary font-bold">{forgotEmail}</span></p>
                  </div>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Back to Sign In</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="your@email.com" className="w-full h-14 px-6 rounded-2xl border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all" />
                  <button onClick={handleForgotPassword} disabled={isLoading || !forgotEmail} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-primary/20">
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
