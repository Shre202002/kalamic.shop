'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, errorEmitter } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiatePhoneSignIn, confirmPhoneCode } from '@/firebase/non-blocking-login';
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
      setIsLoading(false);
      let friendlyMessage = err.message || "An authentication error occurred.";
      
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === 'auth/invalid-phone-number') {
        friendlyMessage = "Invalid format. Use +[country code][number] (e.g., +919876543210).";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = "Too many attempts. Please try again later.";
      } else if (err.code === 'auth/wrong-password') {
        friendlyMessage = "Incorrect password. Please try again.";
      } else if (err.code === 'auth/invalid-credential') {
        friendlyMessage = "Invalid credentials. Please check your details.";
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

  const handleRequestPhoneOtp = async () => {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Missing Phone", description: "Please enter your phone number." });
      return;
    }

    if (!phoneNumber.startsWith('+')) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Format", 
        description: "Phone number must include '+' and country code (e.g., +91...)" 
      });
      return;
    }

    if (!recaptchaVerifier || !auth) {
      toast({ variant: "destructive", title: "System Error", description: "Auth service is initializing. Please wait." });
      return;
    }
    
    setIsLoading(true);
    const success = await initiatePhoneSignIn(auth, phoneNumber.trim(), recaptchaVerifier);
    if (success) {
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "A verification code has been sent to your phone." });
    }
    setIsLoading(false);
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setIsLoading(true);
    const success = await confirmPhoneCode(otpCode);
    if (success) {
      router.push('/profile');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            <Tabs value={authMethod} onValueChange={(v) => {
              setAuthMethod(v as any);
              setOtpSent(false);
              setOtpCode('');
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted p-1 rounded-xl">
                <TabsTrigger value="password" disabled={isLoading} className="rounded-lg font-bold text-xs">Password</TabsTrigger>
                <TabsTrigger value="email-otp" disabled={true} className="rounded-lg font-bold text-xs opacity-50 cursor-not-allowed">Email (Offline)</TabsTrigger>
                <TabsTrigger value="phone" disabled={isLoading} className="rounded-lg font-bold text-xs">Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="artisan@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="pl-14 h-12 rounded-xl focus-visible:ring-primary border-border bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="ml-1">Secret Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="pl-14 h-12 rounded-xl focus-visible:ring-primary border-border bg-background"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                <div className="space-y-4">
                  {!otpSent ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="ml-1">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                          <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="+919876543210" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required 
                            className="pl-14 h-12 rounded-xl focus-visible:ring-primary border-border bg-background"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1 font-bold">Must include + and country code.</p>
                      </div>
                      <Button onClick={handleRequestPhoneOtp} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/10" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Send Verification Code
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="ml-1">Verification Code</Label>
                        <div className="relative">
                          <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                          <Input 
                            id="otp" 
                            type="text" 
                            placeholder="6-digit code" 
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            required 
                            className="pl-14 h-12 rounded-xl text-center tracking-[0.5em] font-black"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Verify & Sign In
                      </Button>
                      <Button variant="ghost" onClick={() => setOtpSent(false)} className="w-full text-xs font-bold text-muted-foreground">
                        Try a different number
                      </Button>
                    </form>
                  )}
                </div>
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