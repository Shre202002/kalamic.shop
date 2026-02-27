'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
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
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, getUserOrders, getWishlistItems, verifyUserEmail } from '@/lib/actions/user-actions';
import { sendOtp, verifyOtp } from '@/lib/actions/otp-actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

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
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        let profileData = await getProfile(user.uid);
        
        // Auto-provision basic profile if not exists
        if (!profileData) {
          profileData = await verifyUserEmail(user.uid, user.email || '');
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

  const handleSendOtp = async () => {
    if (!user?.email) return;
    setIsVerifying(true);
    try {
      await sendOtp(user.email);
      setIsOtpSent(true);
      toast({ title: "Verification Code Sent", description: "Please check your inbox." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !user?.email) return;
    setIsVerifying(true);
    try {
      const result = await verifyOtp(user.email, otpCode);
      if (result.success) {
        const updated = await verifyUserEmail(user.uid, user.email);
        setProfile(updated);
        toast({ title: "Email Verified", description: "Your artisan profile is now authenticated." });
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifying(false);
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
      toast({
        title: "Profile Updated",
        description: "Your artisan settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your changes. Ensure all fields are correctly formatted.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isProfileComplete = !!(formData.firstName && formData.lastName && formData.phone && formData.address && formData.state && formData.city && formData.pincode && formData.landmark);
  const isEmailVerified = profile?.emailVerified;
  const isFullyVerified = isProfileComplete && isEmailVerified;

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
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-10">
          {/* Header Summary */}
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

          {/* Verification Warning Card */}
          {(!isEmailVerified || !isProfileComplete) && (
            <Card className="bg-destructive/5 border-destructive/30 border-2 rounded-[2.5rem] overflow-hidden shadow-xl animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="h-20 w-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 border border-destructive/20 shadow-inner">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-black text-primary">Artisanal Verification Pending</h3>
                  <p className="text-muted-foreground text-base max-w-lg">
                    {!isEmailVerified 
                      ? "To protect our collection, email verification is compulsory. Please request and enter your 6-digit code." 
                      : "Your delivery credentials are incomplete. Fill out your workspace details to unlock handcrafted acquisitions."}
                  </p>
                </div>
                {!isEmailVerified && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {!isOtpSent ? (
                      <Button onClick={handleSendOtp} disabled={isVerifying} size="lg" className="h-14 rounded-2xl px-8 shadow-lg shadow-primary/20">
                        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Verification Code
                      </Button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Input 
                          placeholder="000000" 
                          maxLength={6} 
                          className="w-40 h-14 text-center text-2xl font-black tracking-[0.2em] rounded-2xl border-2 border-primary/20"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        <Button onClick={handleVerifyOtp} disabled={isVerifying} className="h-14 rounded-2xl px-8 shadow-lg shadow-primary/20">
                          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify
                        </Button>
                        <Button variant="ghost" onClick={() => setIsOtpSent(false)} className="h-14 w-14 rounded-2xl p-0">
                          <ChevronRight className="h-6 w-6 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Form */}
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
                    {/* Identity Section */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-accent flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Identity & Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">First Name *</Label>
                          <Input 
                            required
                            value={formData.firstName} 
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                            placeholder="Aarav" 
                            className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Last Name *</Label>
                          <Input 
                            required
                            value={formData.lastName} 
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                            placeholder="Sharma" 
                            className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Contact Phone *</Label>
                          <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              required
                              value={formData.phone} 
                              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                              placeholder="+91 XXXXX XXXXX" 
                              className="pl-14 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                            />
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Authenticated Email</Label>
                          <div className="flex items-center gap-3 p-4 bg-muted/5 rounded-2xl text-muted-foreground border border-dashed text-sm h-14 px-6">
                            <Mail className="h-4 w-4 opacity-50" /> 
                            <span className="truncate flex-1">{user?.email}</span>
                            {isEmailVerified && <Badge variant="outline" className="text-[9px] border-green-500 text-green-600 bg-green-50">Verified</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Section */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-accent flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Artisanal Shipping Destination
                      </h3>
                      
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Full Street Address *</Label>
                        <div className="relative">
                          <Home className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            required
                            value={formData.address} 
                            onChange={(e) => setFormData({...formData, address: e.target.value})} 
                            placeholder="House No, Street Name, Block" 
                            className="pl-14 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">City / Township *</Label>
                          <Input 
                            required
                            value={formData.city} 
                            onChange={(e) => setFormData({...formData, city: e.target.value})} 
                            placeholder="Jaipur" 
                            className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">State / Region *</Label>
                          <Input 
                            required
                            value={formData.state} 
                            onChange={(e) => setFormData({...formData, state: e.target.value})} 
                            placeholder="Rajasthan" 
                            className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Pincode *</Label>
                          <Input 
                            required
                            value={formData.pincode} 
                            onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                            placeholder="302001" 
                            className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Nearest Craft Landmark *</Label>
                          <Input 
                            required
                            value={formData.landmark} 
                            onChange={(e) => setFormData({...formData, landmark: e.target.value})} 
                            placeholder="e.g. Near City Palace" 
                            className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/20 text-lg font-medium px-6"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit"
                        disabled={isUpdating} 
                        className="bg-primary text-white px-12 h-16 rounded-[1.5rem] text-lg font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                      >
                        {isUpdating ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : null}
                        Save Artisan Settings
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Status & Stats */}
            <div className="lg:col-span-4 space-y-8">
              {/* Account Card */}
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                    <Settings className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black text-primary">Control Hub</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-[#FAF4EB]/50 border-2 border-primary/5 transition-all hover:border-primary/10">
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
                
                <Button 
                  variant="ghost" 
                  className="w-full h-16 rounded-[1.5rem] text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-2 border-dashed border-muted transition-all font-black text-base group"
                  onClick={() => auth.signOut()}
                >
                  <LogOut className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform" /> Sign Out from Studio
                </Button>
              </Card>

              {/* Quick Navigation Cards */}
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
