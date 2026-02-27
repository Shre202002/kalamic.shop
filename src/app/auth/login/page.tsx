
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
      // Ignore errors that we handle via the OTP bridge fallback (silent sign-up)
      if (authMethod === 'email-otp') {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') return;
      }

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

  /**
   * Temporarily disabled - OTP Login Section
   */
  const handleRequestEmailOtp = async () => {
    // Feature temporarily disabled
    toast({ title: "Maintenance", description: "Email OTP login is temporarily offline." });
    return;
  };

  /**
   * Temporarily disabled - OTP Login Section
   */
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Feature temporarily disabled
    return;
  };

  /**
   * Temporarily disabled - OTP Login Section
   */
  const handleRequestPhoneOtp = async () => {
    // Feature temporarily disabled
    toast({ title: "Maintenance", description: "Phone OTP login is temporarily offline." });
    return;
  };

  /**
   * Temporarily disabled - OTP Login Section
   */
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Feature temporarily disabled
    return;
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
                
                {/* Email OTP - Temporarily disabled */}
                <TabsTrigger 
                  value="email-otp" 
                  disabled={true} 
                  className="rounded-lg font-bold text-xs opacity-50 cursor-not-allowed"
                >
                  Email (Offline)
                </TabsTrigger>

                {/* Phone OTP - Temporarily disabled */}
                <TabsTrigger 
                  value="phone" 
                  disabled={true} 
                  className="rounded-lg font-bold text-xs opacity-50 cursor-not-allowed"
                >
                  Phone (Offline)
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
                        placeholder="••••••••"
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

              {/* Temporarily disabled Email OTP Content */}
              <TabsContent value="email-otp">
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Email verification login is currently undergoing maintenance.
                </div>
              </TabsContent>

              {/* Temporarily disabled Phone OTP Content */}
              <TabsContent value="phone">
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Phone verification login is currently undergoing maintenance.
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
