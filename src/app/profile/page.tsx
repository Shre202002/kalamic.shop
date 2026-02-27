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
  Key
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
    
    // Validate all fields are present
    const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'pincode', 'landmark'];
    const missing = requiredFields.filter(f => !formData[f as keyof typeof formData]);
    
    if (missing.length > 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Profile",
        description: "Please fill in all address and contact details to proceed.",
      });
      return;
    }

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

  // Dynamic Member Since Year from DB
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
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" /> Secure Artisan Account
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight">Artisan Workspace</h1>
              <p className="text-muted-foreground text-sm md:text-lg">Manage your handcrafted treasures and delivery preferences.</p>
            </div>
            <div className="flex items-center gap-3">
               <Badge variant={isFullyVerified ? "default" : "destructive"} className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider">
                {isFullyVerified ? "Verified Collector" : "Verification Required"}
              </Badge>
            </div>
          </div>

          {/* Verification Warning Card */}
          {(!isEmailVerified || !isProfileComplete) && (
            <Card className="bg-destructive/5 border-destructive/20 border-2 rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black text-primary mb-1">Incomplete Collector Profile</h3>
                  <p className="text-muted-foreground text-sm">
                    {!isEmailVerified 
                      ? "Your email is not verified. Please request an OTP to authenticate your account." 
                      : "Please fill out all address and contact details to enable acquisitions."}
                  </p>
                </div>
                {!isEmailVerified && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {!isOtpSent ? (
                      <Button onClick={handleSendOtp} disabled={isVerifying} className="h-12 rounded-xl">
                        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Verification OTP
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="000000" 
                          maxLength={6} 
                          className="w-32 h-12 text-center font-bold tracking-widest"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        <Button onClick={handleVerifyOtp} disabled={isVerifying} className="h-12 rounded-xl">
                          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify
                        </Button>
                        <Button variant="ghost" onClick={() => setIsOtpSent(false)} className="h-12 px-2">
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                      <UserIcon className="h-6 w-6 text-accent" /> Personal Details
                    </CardTitle>
                    <CardDescription>Mandatory information for artisanal delivery and acquisition.</CardDescription>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-full">
                    <Calendar className="h-3 w-3" /> Member Since {memberSinceYear}
                  </div>
                </div>
              </CardHeader>
              <Separator className="mx-8 opacity-50" />
              <CardContent className="p-8 pt-6">
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name *</Label>
                      <Input 
                        required
                        value={formData.firstName} 
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                        placeholder="Aarav" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name *</Label>
                      <Input 
                        required
                        value={formData.lastName} 
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                        placeholder="Sharma" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          required
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                          placeholder="+91 XXXXX XXXXX" 
                          className="pl-12 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Artisan Email</Label>
                      <div className="flex items-center gap-3 p-4 bg-muted/10 rounded-2xl text-muted-foreground border border-dashed text-sm h-14">
                        <Mail className="h-4 w-4" /> {user?.email}
                        {isEmailVerified && <Badge variant="outline" className="ml-auto text-[10px] border-green-500 text-green-600">Verified</Badge>}
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-50" />
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                      <Home className="h-4 w-4 text-accent" /> Shipping Address
                    </h3>
                    
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Street Address *</Label>
                      <Input 
                        required
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})} 
                        placeholder="House No, Street Name" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">City *</Label>
                        <Input 
                          required
                          value={formData.city} 
                          onChange={(e) => setFormData({...formData, city: e.target.value})} 
                          placeholder="Jaipur" 
                          className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">State *</Label>
                        <Input 
                          required
                          value={formData.state} 
                          onChange={(e) => setFormData({...formData, state: e.target.value})} 
                          placeholder="Rajasthan" 
                          className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pincode *</Label>
                        <Input 
                          required
                          value={formData.pincode} 
                          onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                          placeholder="302001" 
                          className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nearest Landmark *</Label>
                        <Input 
                          required
                          value={formData.landmark} 
                          onChange={(e) => setFormData({...formData, landmark: e.target.value})} 
                          placeholder="Opposite Art Gallery" 
                          className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit"
                      disabled={isUpdating} 
                      className="bg-primary text-white px-12 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                      {isUpdating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
                      Update Workspace
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white p-8 space-y-6">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" /> Account Control
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                    <span className="text-sm font-medium text-muted-foreground">Verification</span>
                    {isFullyVerified ? (
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <Badge className="bg-primary/10 text-primary border-none">{isFullyVerified ? 'Verified' : 'Pending'}</Badge>
                  </div>
                </div>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-2 border-dashed border-muted transition-all"
                  onClick={() => auth.signOut()}
                >
                  <LogOut className="mr-3 h-5 w-5" /> Sign Out
                </Button>
              </Card>

              <div className="grid grid-cols-1 gap-6">
                 <Link href="/orders" className="group">
                    <Card className="bg-primary text-white rounded-[2rem] p-6 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <Package className="h-8 w-8 opacity-40 group-hover:scale-110 transition-transform" />
                        <span className="text-3xl font-black">{orders.length}</span>
                      </div>
                      <p className="font-bold text-lg">My Orders</p>
                    </Card>
                 </Link>
                 <Link href="/wishlist" className="group">
                    <Card className="bg-accent text-accent-foreground rounded-[2rem] p-6 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <Heart className="h-8 w-8 opacity-40 group-hover:scale-110 transition-transform" />
                        <span className="text-3xl font-black">{wishlistCount}</span>
                      </div>
                      <p className="font-bold text-lg">My Wishlist</p>
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
