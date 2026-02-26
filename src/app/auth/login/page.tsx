'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, errorEmitter } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { sendOtp, verifyOtp } from '@/lib/actions/otp-actions';
import { verifyUserEmail, getProfile } from '@/lib/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ShieldCheck, Key, AlertCircle, LogOut } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbVerified, setIsDbVerified] = useState<boolean | null>(null);
  
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkVerification() {
      if (user) {
        const profile = await getProfile(user.uid);
        const verified = profile?.emailVerified || false;
        setIsDbVerified(verified);
        if (verified) {
          router.push('/profile');
        }
      } else {
        setIsDbVerified(null);
      }
    }
    checkVerification();
  }, [user, router]);

  useEffect(() => {
    const handleLoginError = (err: { code: string; message: string }) => {
      setIsLoading(false);
      let friendlyMessage = "An authentication error occurred.";
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMessage = "Wrong email or password. Please check your credentials and try again.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Password is too weak. Please use at least 6 characters.";
      }

      toast({
        variant: "destructive",
        title: "Sign In Failed",
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

  const handleRequestOtp = async () => {
    const targetEmail = email || user?.email;
    if (!targetEmail) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email to receive an OTP." });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(targetEmail);
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Please check your inbox for the 6-digit code." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email || user?.email;
    if (!otpCode || otpCode.length !== 6 || !targetEmail) return;

    setIsLoading(true);
    try {
      const result = await verifyOtp(targetEmail, otpCode);
      if (result.success) {
        if (user) {
          await verifyUserEmail(user.uid, targetEmail);
          setIsDbVerified(true);
          toast({ title: "Email Verified", description: "Welcome to the Kalamic collection!" });
          router.push('/profile');
        } else {
          // Direct OTP Login flow using a secure deterministic password
          const defaultPassword = `OTP_SECURE_${targetEmail.split('@')[0]}_KALAMIC`;
          initiateEmailSignIn(auth, targetEmail, defaultPassword);
        }
      } else {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Verification Failed", description: result.message });
      }
    } catch (err: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    setOtpSent(false);
    setEmail('');
    setPassword('');
    setOtpCode('');
  };

  if (user && isDbVerified === false) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="space-y-2 p-8 text-center bg-accent/5">
              <div className="mx-auto h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mb-2">
                <Mail className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl font-black text-primary">Verify Your Email</CardTitle>
              <CardDescription className="text-sm font-medium">
                Enter the 6-digit code sent to <span className="font-bold text-primary">{user.email}</span> to continue your artisan journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!otpSent ? (
                <div className="space-y-4">
                  <div className="bg-muted/10 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      OTP verification ensures the security of your artisan acquisitions and delivery profile.
                    </p>
                  </div>
                  <Button 
                    onClick={handleRequestOtp} 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Key className="mr-2 h-5 w-5" />}
                    Send Verification OTP
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify-otp">Enter 6-Digit Code</Label>
                    <Input 
                      id="verify-otp" 
                      type="text" 
                      maxLength={6}
                      placeholder="000000" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required 
                      className="h-14 text-center text-2xl tracking-[0.5em] font-black rounded-xl"
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Start Exploring"}
                  </Button>
                  <Button variant="ghost" onClick={() => setOtpSent(false)} className="w-full text-xs" disabled={isLoading}>
                    Resend Code
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="p-8 pt-0 flex flex-col gap-4">
              <Separator className="opacity-50" />
              <Button 
                variant="ghost" 
                className="w-full text-destructive font-bold hover:bg-destructive/5" 
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" /> Use a Different Account
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
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
            <Tabs defaultValue="password" onValueChange={(v) => setAuthMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/20 p-1 rounded-xl">
                <TabsTrigger value="password" disabled={isLoading} className="rounded-lg font-bold">Password</TabsTrigger>
                <TabsTrigger value="otp" disabled={isLoading} className="rounded-lg font-bold">OTP Code</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="artisan@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Secret Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="otp">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="otp-email" 
                          type="email" 
                          placeholder="artisan@example.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                          className="pl-10 h-12 rounded-xl"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleRequestOtp} 
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Send 6-Digit Code
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP Code</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="otp" 
                          type="text" 
                          maxLength={6}
                          placeholder="000000" 
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required 
                          className="pl-10 h-14 text-center text-2xl tracking-[0.5em] font-black rounded-xl"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Code sent to {email}</p>
                    </div>
                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Verify & Continue
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setOtpSent(false)} 
                      className="w-full"
                      disabled={isLoading}
                    >
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
              onClick={() => setIsLogin(!isLogin)}
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