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
  Home
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, getUserOrders, getWishlistItems } from '@/lib/actions/user-actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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
    async function loadData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        let profileData = await getProfile(user.uid);
        
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Check all fields are present
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode || !formData.landmark) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields to complete your profile.",
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
        description: "Could not save your changes. Ensure all fields are filled.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isProfileComplete = !!(formData.firstName && formData.lastName && formData.phone && formData.address && formData.state && formData.city && formData.pincode && formData.landmark);

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <UserIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Artisan Profile</h1>
          <p className="text-muted-foreground mb-8 max-sm">Sign in to manage your collection, track orders, and save your favorites.</p>
          <Button asChild className="w-full max-w-xs h-12 rounded-xl"><Link href="/auth/login">Sign In</Link></Button>
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
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" /> Secure Artisan Account
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight">Artisan Workspace</h1>
              <p className="text-muted-foreground text-sm md:text-lg">Manage your handcrafted treasures and delivery preferences.</p>
            </div>
            <div className="flex items-center gap-3">
               <Badge variant={isProfileComplete ? "default" : "destructive"} className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider">
                {isProfileComplete ? "Verified Collector" : "Profile Incomplete"}
              </Badge>
            </div>
          </div>

          {!isProfileComplete && (
            <Card className="bg-destructive/5 border-destructive/20 border-2 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 flex items-center gap-4 text-destructive">
                <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">Attention Required</p>
                  <p className="text-sm opacity-80">Please complete all required personal details below to enable shopping and acquisitions.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information Card */}
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                      <UserIcon className="h-6 w-6 text-accent" /> Personal Details
                    </CardTitle>
                    <CardDescription>All fields below are required for verified shipping.</CardDescription>
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
                      <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name *</Label>
                      <Input 
                        id="firstName" 
                        required
                        value={formData.firstName} 
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                        placeholder="Aarav" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name *</Label>
                      <Input 
                        id="lastName" 
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
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="phone" 
                          required
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                          placeholder="+91 XXXXX XXXXX" 
                          className="pl-12 rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Registered Email</Label>
                      <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl text-muted-foreground border border-dashed text-sm h-14">
                        <Mail className="h-4 w-4" /> {user.email}
                        <Badge variant="outline" className="ml-auto text-[10px] border-muted-foreground/30">Primary</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-50" />
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                      <Home className="h-4 w-4 text-accent" /> Profile Address
                    </h3>
                    
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Street Address *</Label>
                      <Input 
                        id="address" 
                        required
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})} 
                        placeholder="House No, Street Name" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">City *</Label>
                        <Input 
                          id="city" 
                          required
                          value={formData.city} 
                          onChange={(e) => setFormData({...formData, city: e.target.value})} 
                          placeholder="Jaipur" 
                          className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="state" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">State *</Label>
                        <Input 
                          id="state" 
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
                        <Label htmlFor="pincode" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pincode *</Label>
                        <Input 
                          id="pincode" 
                          required
                          value={formData.pincode} 
                          onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                          placeholder="302001" 
                          className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="landmark" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nearest Landmark *</Label>
                        <Input 
                          id="landmark" 
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
                      Save & Verify Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white p-8 space-y-6">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" /> Account Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                    <span className="text-sm font-medium text-muted-foreground">Identity Status</span>
                    {isProfileComplete ? (
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                    <span className="text-sm font-medium text-muted-foreground">Collector Tier</span>
                    <Badge className="bg-primary/10 text-primary border-none">Artisan</Badge>
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
                      <p className="text-xs opacity-70">Track your acquisitions</p>
                    </Card>
                 </Link>
                 <Link href="/wishlist" className="group">
                    <Card className="bg-accent text-accent-foreground rounded-[2rem] p-6 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <Heart className="h-8 w-8 opacity-40 group-hover:scale-110 transition-transform" />
                        <span className="text-3xl font-black">{wishlistCount}</span>
                      </div>
                      <p className="font-bold text-lg">Favorites</p>
                      <p className="text-xs opacity-70">Saved masterpieces</p>
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
