
'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth, errorEmitter } from '@/firebase';
import { initiatePhoneSignIn, confirmPhoneCode } from '@/firebase/non-blocking-login';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Package, 
  Heart, 
  LogOut, 
  Loader2, 
  Settings,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Home,
  ChevronRight,
  CheckCircle2,
  Key
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, getUserOrders, getWishlistItems, verifyUserEmail, verifyUserPhone, getOrCreateProfile } from '@/lib/actions/user-actions';
import { sendOtp, verifyOtp } from '@/lib/actions/otp-actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier } from 'firebase/auth';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Email verification state
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // Phone verification state (Firebase Real)
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    pincode: '',
    landmark: ''
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  // Recaptcha for Profile Phone Verification
  useEffect(() => {
    if (auth && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-profile', {
          size: 'invisible'
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error("Profile Recaptcha Init Error:", error);
      }
    }
  }, [auth, recaptchaVerifier]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        let profileData = await getProfile(user.uid);
        if (!profileData) {
          profileData = await getOrCreateProfile(user.uid, user.email || '');
        }

        const [ordersData, wishlistData] = await Promise.all([
          getUserOrders(user.uid),
          getWishlistItems(user.uid)
        ]);

        if (profileData) {
          setProfile(profileData);
          setFormData({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            state: profileData.state || '',
            city: profileData.city || '',
            pincode: profileData.pincode || '',
            landmark: profileData.landmark || ''
          });
        }
        setOrders(ordersData);
        setWishlistCount(wishlistData.length);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [user]);

  // Handle Email Verification
  const handleSendEmailOtp = async () => {
    if (!user?.email) return;
    setIsVerifyingEmail(true);
    try {
      await sendOtp(user.email);
      setIsEmailOtpSent(true);
      toast({ title: "Email OTP Sent", description: "Check your inbox for the code." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode || !user?.email) return;
    setIsVerifyingEmail(true);
    try {
      const result = await verifyOtp(user.email, emailOtpCode);
      if (result.success) {
        const updated = await verifyUserEmail(user.uid, user.email);
        setProfile(updated);
        setIsEmailOtpSent(false);
        setEmailOtpCode('');
        toast({ title: "Email Verified", description: "Your email is now authenticated." });
      } else {
        toast({ variant: "destructive", title: "Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Handle Phone Verification (REAL Firebase)
  const handleSendPhoneOtp = async () => {
    if (!formData.phone) {
      toast({ variant: "destructive", title: "Phone Required", description: "Please enter your phone number." });
      return;
    }
    if (!formData.phone.startsWith('+')) {
      toast({ variant: "destructive", title: "Invalid Format", description: "Include '+' and country code (e.g., +91...)" });
      return;
    }
    if (!auth || !recaptchaVerifier) {
      toast({ variant: "destructive", title: "System Busy", description: "Verification services are starting..." });
      return;
    }

    setIsVerifyingPhone(true);
    try {
      const success = await initiatePhoneSignIn(auth, formData.phone.trim(), recaptchaVerifier);
      if (success) {
        setIsPhoneOtpSent(true);
        toast({ title: "OTP Sent", description: "A verification code has been sent via SMS." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode) return;
    setIsVerifyingPhone(true);
    try {
      const success = await confirmPhoneCode(phoneOtpCode);
      if (success) {
        const updated = await verifyUserPhone(user!.uid, formData.phone);
        setProfile(updated);
        setIsPhoneOtpSent(false);
        setPhoneOtpCode('');
        toast({ title: "Phone Verified", description: "Your contact number is now verified." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: "Verification code is incorrect." });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const updated = await updateProfile(user.uid, {
        ...formData,
        email: user.email || ''
      } as any);
      setProfile(updated);
      toast({ title: "Profile Updated", description: "Your settings have been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
      setIsUpdating(false);
    }
  };

  const isProfileComplete = !!(formData.firstName && formData.lastName && formData.phone && formData.address && formData.state && formData.city && formData.pincode && formData.landmark);
  const isEmailVerified = profile?.emailVerified;
  const isPhoneVerified = profile?.phoneVerified;
  const isFullyVerified = isProfileComplete && isEmailVerified && isPhoneVerified;

  const memberSinceYear = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : 2024;

  if (isUserLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <div id="recaptcha-profile"></div>
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary/10 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                <ShieldCheck className="h-4 w-4 text-accent" /> Collector Dashboard
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Artisan Workspace</h1>
              <p className="text-muted-foreground text-sm md:text-lg max-w-xl">
                Fine-tune your personal credentials and artisanal delivery preferences.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <Badge variant={isFullyVerified ? "default" : "destructive"} className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                {isFullyVerified ? "Fully Verified Master" : "Action Required"}
              </Badge>
               <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white border px-4 py-3 rounded-2xl shadow-sm">
                <Calendar className="h-3 w-3 text-accent" /> Since {memberSinceYear}
              </div>
            </div>
          </div>

          {(!isFullyVerified) && (
            <Card className="bg-destructive/5 border-destructive/30 border-2 rounded-[2.5rem] overflow-hidden shadow-xl animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="h-20 w-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 border border-destructive/20 shadow-inner">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-black text-primary">Verification Required</h3>
                  <p className="text-muted-foreground text-base max-w-lg">
                    {!isEmailVerified && "• Email verification pending. "}
                    {!isPhoneVerified && "• Phone verification pending. "}
                    {!isProfileComplete && "• Complete your delivery details to start acquiring art."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-6 bg-primary/[0.02]">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-primary">Collector Profile</CardTitle>
                      <CardDescription className="text-base">Enter the credentials we use for artisan certificates and delivery.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator className="mx-10 opacity-30" />
                <CardContent className="p-10 pt-8">
                  <form onSubmit={handleUpdateProfile} className="space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-accent flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Identity & Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">First Name *</Label>
                          <Input required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="Aarav" className="pl-6 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium" />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Last Name *</Label>
                          <Input required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Sharma" className="pl-6 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Contact Phone *</Label>
                          <div className="space-y-3">
                            <div className="relative">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                              <Input required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" className="pl-14 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium pr-24" />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                {isPhoneVerified ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Button type="button" size="sm" variant="ghost" className="text-[10px] font-bold text-accent" onClick={handleSendPhoneOtp}>Verify</Button>
                                )}
                              </div>
                            </div>
                            {!isPhoneVerified && isPhoneOtpSent && (
                              <div className="flex items-center gap-2 animate-in slide-in-from-top-2 bg-accent/5 p-3 rounded-2xl border border-accent/20">
                                <div className="relative flex-1">
                                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/50 z-10" />
                                  <Input placeholder="6-digit OTP" maxLength={6} value={phoneOtpCode} onChange={(e) => setPhoneOtpCode(e.target.value)} className="pl-10 h-10 rounded-xl font-bold tracking-[0.2em] text-center" />
                                </div>
                                <Button type="button" size="sm" className="h-10 rounded-xl px-6" onClick={handleVerifyPhoneOtp} disabled={isVerifyingPhone}>
                                  {isVerifyingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Authenticated Email</Label>
                          <div className="space-y-3">
                            <div className="relative">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                              <Input disabled value={user?.email || ''} className="pl-14 rounded-2xl h-14 border-muted/30 bg-muted/20 text-lg font-medium pr-24" />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                {isEmailVerified ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Button type="button" size="sm" variant="ghost" className="text-[10px] font-bold text-accent" onClick={handleSendEmailOtp}>Verify</Button>
                                )}
                              </div>
                            </div>
                            {!isEmailVerified && isEmailOtpSent && (
                              <div className="flex items-center gap-2 animate-in slide-in-from-top-2 bg-accent/5 p-3 rounded-2xl border border-accent/20">
                                <div className="relative flex-1">
                                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/50 z-10" />
                                  <Input placeholder="6-digit OTP" maxLength={6} value={emailOtpCode} onChange={(e) => setEmailOtpCode(e.target.value)} className="pl-10 h-10 rounded-xl font-bold tracking-[0.2em] text-center" />
                                </div>
                                <Button type="button" size="sm" className="h-10 rounded-xl px-6" onClick={handleVerifyEmailOtp} disabled={isVerifyingEmail}>
                                  {isVerifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-accent flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Artisanal Shipping Destination
                      </h3>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Full Street Address *</Label>
                        <div className="relative">
                          <Home className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                          <Input required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="House No, Street Name, Block" className="pl-14 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium pr-6" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">City / Township *</Label>
                          <Input required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Jaipur" className="pl-6 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium" />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">State / Region *</Label>
                          <Input required value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="Rajasthan" className="pl-6 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px) font-black uppercase tracking-widest ml-1 opacity-60">Pincode *</Label>
                          <Input required value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} placeholder="302001" className="pl-6 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium" />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Nearest Craft Landmark *</Label>
                          <Input required value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} placeholder="e.g. Near City Palace" className="pl-6 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isUpdating} className="bg-primary text-white px-12 h-16 rounded-[1.5rem] text-lg font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                        {isUpdating ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : null}
                        Save Artisan Settings
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                    <Settings className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black text-primary">Control Hub</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-[#FAF4EB]/50 border-2 border-primary/5">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Auth Status</span>
                    {isFullyVerified ? (
                      <Badge className="bg-green-500 hover:bg-green-600 px-3 py-1 text-[10px] font-bold">VERIFIED</Badge>
                    ) : (
                      <Badge variant="destructive" className="px-3 py-1 text-[10px] font-bold">PENDING</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-[#FAF4EB]/50 border-2 border-primary/5">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loyalty Level</span>
                    <span className="text-sm font-black text-primary italic">Silver Artisan</span>
                  </div>
                </div>
                <Separator className="my-8 opacity-50" />
                <Button variant="ghost" className="w-full h-16 rounded-[1.5rem] text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-2 border-dashed border-muted transition-all font-black text-base group" onClick={() => auth.signOut()}>
                  <LogOut className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform" /> Sign Out from Studio
                </Button>
              </Card>

              <div className="grid grid-cols-1 gap-6">
                 <Link href="/orders" className="group">
                    <Card className="bg-primary text-white rounded-[2.5rem] p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                          <Package className="h-6 w-6" />
                        </div>
                        <span className="text-4xl font-black tracking-tighter">{orders.length}</span>
                      </div>
                      <p className="font-black text-xl relative z-10">Artisan Acquisitions</p>
                      <p className="text-xs opacity-60 mt-1 uppercase tracking-widest">Track your orders</p>
                    </Card>
                 </Link>
                 
                 <Link href="/wishlist" className="group">
                    <Card className="bg-accent text-accent-foreground rounded-[2.5rem] p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-16 -mb-16 group-hover:scale-150 transition-transform duration-700" />
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center backdrop-blur-sm">
                          <Heart className="h-6 w-6" />
                        </div>
                        <span className="text-4xl font-black tracking-tighter">{wishlistCount}</span>
                      </div>
                      <p className="font-black text-xl relative z-10">Saved Treasures</p>
                      <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest">Your curated wishlist</p>
                    </Card>
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
