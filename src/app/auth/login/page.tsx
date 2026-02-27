
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, errorEmitter } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiatePhoneSignIn, confirmPhoneCode } from '@/firebase/non-blocking-login';
import { sendOtp, verifyOtp } from '@/lib/actions/otp-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ShieldCheck, Key, Phone } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'password' | 'email-otp' | 'phone'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);

  useEffect(() => {
    if (auth && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          }
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error("reCAPTCHA initialization failed:", error);
      }
    }
  }, [auth, recaptchaVerifier]);

  useEffect(() => {
    const handleLoginError = (err: { code: string; message: string }) => {
      // Ignore errors that we handle via the OTP bridge fallback
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        if (authMethod === 'email-otp') return;
      }

      setIsLoading(false);
      let friendlyMessage = err.message || "An authentication error occurred.";
      
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === 'auth/invalid-phone-number') {
        friendlyMessage = "Invalid format. Use +[country code][number] (e.g., +919876543210).";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = "Too many attempts. Please try again later.";
      }

      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: friendlyMessage,
      });
    };

    errorEmitter.on('login-error', handleLoginError);
    return () => errorEmitter.off('login-error', handleLoginError);
  }, [toast, authMethod]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    if (isLogin) {
      initiateEmailSignIn(auth, email, password);
    } else {
      initiateEmailSignUp(auth, email, password);
    }
  };

  const handleRequestEmailOtp = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email." });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      toast({ title: "Email OTP Sent", description: "Please check your inbox." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delivery Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6 || !email) return;

    setIsLoading(true);
    try {
      const result = await verifyOtp(email, otpCode);
      if (result.success) {
        // Step 1: Successful DB verification.
        // Step 2: Bridge to Firebase Auth using a deterministic shadow password.
        const shadowPassword = `KAL_OTP_SEC_${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        
        try {
          // Attempt Sign In first
          await initiateEmailSignIn(auth, email, shadowPassword);
        } catch (signInErr: any) {
          // If user doesn't exist, Create Account (Sign Up)
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
             await initiateEmailSignUp(auth, email, shadowPassword);
          } else {
             throw signInErr;
          }
        }
      } else {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Verification Failed", description: result.message });
      }
    } catch (err: any) {
      setIsLoading(false);
      if (err.message && !err.code) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    }
  };

  const handleRequestPhoneOtp = async () => {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Number Required", description: "Please enter your phone number." });
      return;
    }

    if (!recaptchaVerifier) {
      toast({ variant: "destructive", title: "Security Error", description: "reCAPTCHA is still initializing. Please wait." });
      return;
    }

    setIsLoading(true);
    const success = await initiatePhoneSignIn(auth, phoneNumber, recaptchaVerifier);
    if (success) {
      setOtpSent(true);
      toast({ title: "SMS Sent", description: "A verification code has been sent to your phone." });
    }
    setIsLoading(false);
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) return;

    setIsLoading(true);
    const success = await confirmPhoneCode(otpCode);
    if (!success) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <div id="recaptcha-container"></div>
      
      <main className="flex-1 flex items-center justify-center p-4 py-12 md:py-20">
        <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="space-y-2 p-8 text-center bg-primary/5">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-black text-primary">
              {isLogin ? 'Welcome Back' : 'Join Kalamic'}
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              {isLogin 
                ? 'Enter your details to access your collection' 
                : 'Create an account to start your ceramic journey'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/20 p-1 rounded-xl">
                <TabsTrigger value="password" disabled={isLoading} className="rounded-lg font-bold text-xs">Password</TabsTrigger>
                <TabsTrigger 
                  value="email-otp" 
                  disabled={isLoading || !isLogin} 
                  className="rounded-lg font-bold text-xs"
                >
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="phone" 
                  disabled={isLoading || !isLogin} 
                  className="rounded-lg font-bold text-xs"
                >
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="artisan@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="pl-14 h-12 rounded-xl focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="ml-1">Secret Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="pl-14 h-12 rounded-xl focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email-otp">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email" className="ml-1">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="otp-email" 
                          type="email" 
                          placeholder="artisan@example.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                          className="pl-14 h-12 rounded-xl focus-visible:ring-accent"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleRequestEmailOtp} 
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Send Email Code
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="ml-1">Enter 6-Digit Code</Label>
                      <div className="relative">
                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="otp" 
                          type="text" 
                          maxLength={6}
                          placeholder="000000" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required 
                          className="pl-14 h-14 text-center text-2xl tracking-[0.5em] font-black rounded-xl"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Sent to {email}</p>
                    </div>
                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Verify & Continue
                    </Button>
                    <Button variant="ghost" onClick={() => setOtpSent(false)} className="w-full" disabled={isLoading}>
                      Resend Code
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="phone">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="ml-1">Phone Number (with +)</Label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="phoneNumber" 
                          type="tel" 
                          placeholder="+919876543210" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required 
                          className="pl-14 h-12 rounded-xl focus-visible:ring-accent"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Must start with + country code</p>
                    </div>
                    <Button 
                      onClick={handleRequestPhoneOtp} 
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Send SMS Code
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-otp" className="ml-1">Enter 6-Digit Code</Label>
                      <div className="relative">
                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="phone-otp" 
                          type="text" 
                          maxLength={6}
                          placeholder="000000" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required 
                          className="pl-14 h-14 text-center text-2xl tracking-[0.5em] font-black rounded-xl"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Sent to {phoneNumber}</p>
                    </div>
                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Verify & Continue
                    </Button>
                    <Button variant="ghost" onClick={() => setOtpSent(false)} className="w-full" disabled={isLoading}>
                      Resend Code
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-8 pt-0">
            <Separator className="opacity-50" />
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthMethod('password');
                setOtpSent(false);
                setOtpCode('');
              }}
            >
              {isLogin ? "New to Kalamic? Create an Account" : "Already a Collector? Sign In"}
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
