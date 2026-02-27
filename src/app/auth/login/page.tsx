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

  // Redirect to profile as soon as a Firebase user exists
  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (auth && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
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
      setIsLoading(false);
      let friendlyMessage = err.message || "An authentication error occurred.";
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMessage = "Wrong credentials. Please check and try again.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === 'auth/invalid-phone-number') {
        friendlyMessage = "Invalid format. Use +[country code][number] (e.g., +919876543210).";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = "Too many attempts. Please try again later.";
      } else if (err.code === 'auth/quota-exceeded') {
        friendlyMessage = "SMS quota exceeded. Please contact support or try a different method.";
      } else if (err.code === 'auth/captcha-check-failed') {
        friendlyMessage = "Security check failed. Please refresh and try again.";
      }

      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: friendlyMessage,
      });
    };

    errorEmitter.on('login-error', handleLoginError);
    return () => errorEmitter.off('login-error', handleLoginError);
  }, [toast]);

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
        const defaultPassword = `OTP_SECURE_${email.split('@')[0]}_KALAMIC`;
        initiateEmailSignIn(auth, email, defaultPassword);
      } else {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Verification Failed", description: result.message });
      }
    } catch (err: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleRequestPhoneOtp = async () => {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Number Required", description: "Please enter your phone number." });
      return;
    }

    if (!recaptchaVerifier) {
      toast({ variant: "destructive", title: "Security Error", description: "reCAPTCHA is still initializing. Please wait a moment." });
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
      {/* Container for invisible reCAPTCHA */}
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
            <Tabs defaultValue="password" onValueChange={(v) => {
              setAuthMethod(v as any);
              setOtpSent(false);
              setOtpCode('');
            }} className="w-full">
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
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="artisan@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="pl-12 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Secret Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="pl-12 h-12 rounded-xl"
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
                      <Label htmlFor="otp-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="otp-email" 
                          type="email" 
                          placeholder="artisan@example.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                          className="pl-12 h-12 rounded-xl"
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
                      <Label htmlFor="otp">Enter 6-Digit Code</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="otp" 
                          type="text" 
                          maxLength={6}
                          placeholder="000000" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required 
                          className="pl-12 h-14 text-center text-2xl tracking-[0.5em] font-black rounded-xl"
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
                      <Label htmlFor="phoneNumber">Phone Number (with +)</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="phoneNumber" 
                          type="tel" 
                          placeholder="+919876543210" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required 
                          className="pl-12 h-12 rounded-xl"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Must start with + country code (e.g., +91 for India)</p>
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
                      <Label htmlFor="phone-otp">Enter 6-Digit Code</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="phone-otp" 
                          type="text" 
                          maxLength={6}
                          placeholder="000000" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required 
                          className="pl-12 h-14 text-center text-2xl tracking-[0.5em] font-black rounded-xl"
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
                if (isLogin) setAuthMethod('password');
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
