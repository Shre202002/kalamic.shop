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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Package, 
  Heart, 
  MapPin, 
  Plus, 
  LogOut, 
  Loader2, 
  ChevronRight,
  Settings,
  AlertCircle,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, getUserOrders, getWishlistItems, getUserAddresses, addAddress } from '@/lib/actions/user-actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [addressData, setAddressData] = useState({
    fullName: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const [profileData, ordersData, wishlistData, addressesData] = await Promise.all([
          getProfile(user.uid),
          getUserOrders(user.uid),
          getWishlistItems(user.uid),
          getUserAddresses(user.uid)
        ]);

        if (profileData) {
          setProfile(profileData);
          setFormData({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            phone: profileData.phone || ''
          });
        }
        setOrders(ordersData);
        setWishlistCount(wishlistData.length);
        setAddresses(addressesData);
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
    setIsUpdating(true);
    try {
      await updateProfile(user.uid, formData);
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your changes. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    if (!addressData.fullName || !addressData.street || !addressData.city || !addressData.zipCode) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all required address fields." });
      return;
    }
    setIsAddingAddress(true);
    try {
      const newAddr = await addAddress(user.uid, addressData);
      setAddresses([...addresses, newAddr] as any);
      setIsDialogOpen(false);
      setAddressData({
        fullName: '',
        street: '',
        landmark: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        isDefault: false
      });
      toast({ title: "Address Saved", description: "A new delivery location has been added to your profile." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add address." });
    } finally {
      setIsAddingAddress(false);
    }
  };

  const isProfileComplete = formData.firstName && formData.lastName && formData.phone;

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
                  <p className="text-sm opacity-80">Please complete your name and phone number to unlock ordering and delivery services.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/orders">
              <Card className="hover:shadow-xl hover:shadow-primary/5 transition-all border-none bg-white rounded-[2rem] group">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Package className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary">Order History</h3>
                      <p className="text-sm text-muted-foreground font-medium">{orders.length} Handcrafted Acquisitions</p>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full border flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/wishlist">
              <Card className="hover:shadow-xl hover:shadow-accent/5 transition-all border-none bg-white rounded-[2rem] group">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <Heart className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary">My Favorites</h3>
                      <p className="text-sm text-muted-foreground font-medium">{wishlistCount} Saved Masterpieces</p>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full border flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information Card */}
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                      <UserIcon className="h-6 w-6 text-accent" /> Personal Details
                    </CardTitle>
                    <CardDescription>Your identity within the Kalamic community.</CardDescription>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-full">
                    <Calendar className="h-3 w-3" /> Member Since 2024
                  </div>
                </div>
              </CardHeader>
              <Separator className="mx-8 opacity-50" />
              <CardContent className="p-8 pt-6">
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={formData.firstName} 
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                        placeholder="e.g. Aarav" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={formData.lastName} 
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                        placeholder="e.g. Sharma" 
                        className="rounded-2xl h-14 border-muted/30 focus-visible:ring-accent bg-[#FAF4EB]/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="phone" 
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

                  <div className="flex justify-end pt-4">
                    <Button 
                      disabled={isUpdating} 
                      className="bg-primary text-white px-12 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                      {isUpdating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
                      Save Artisan Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Sidebar Stats/Account Card */}
            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white p-8 space-y-6">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" /> Account Management
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                    <span className="text-sm font-medium text-muted-foreground">Identity Verified</span>
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border">
                    <span className="text-sm font-medium text-muted-foreground">Newsletter</span>
                    <Badge className="bg-primary/10 text-primary border-none">Active</Badge>
                  </div>
                </div>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-2 border-dashed border-muted transition-all"
                  onClick={() => auth.signOut()}
                >
                  <LogOut className="mr-3 h-5 w-5" /> Sign Out from Kalamic
                </Button>
              </Card>

              {/* Address Quick View Header (Redirects to full address section or just shows count) */}
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-primary text-white p-8 relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <MapPin className="h-24 w-24" />
                </div>
                <h3 className="text-xl font-bold mb-2">Saved Addresses</h3>
                <p className="text-3xl font-black mb-4">{addresses.length}</p>
                <p className="text-sm opacity-80 mb-6">Your delivery locations are securely stored for fast acquisitions.</p>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white w-full opacity-60"></div>
                </div>
              </Card>
            </div>
          </div>

          {/* Addresses Section */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-accent" /> Saved Addresses
                </CardTitle>
                <CardDescription>Manage where your ceramic masterpieces are delivered.</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 rounded-2xl gap-2 px-6 shadow-lg shadow-primary/10">
                    <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Add New Location</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-8 border-none shadow-2xl bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">New Artisan Address</DialogTitle>
                    <CardDescription>Register a new delivery destination.</CardDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                      <Input placeholder="Recipient Name" value={addressData.fullName} onChange={e => setAddressData({...addressData, fullName: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Street Address</Label>
                      <Input placeholder="House No, Street, Locality" value={addressData.street} onChange={e => setAddressData({...addressData, street: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nearest Landmark</Label>
                      <Input placeholder="e.g. Near Art Center" value={addressData.landmark} onChange={e => setAddressData({...addressData, landmark: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">City</Label>
                        <Input placeholder="City" value={addressData.city} onChange={e => setAddressData({...addressData, city: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Postal Code</Label>
                        <Input placeholder="110001" value={addressData.zipCode} onChange={e => setAddressData({...addressData, zipCode: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
                      <Input placeholder="+91 XXXXX XXXXX" value={addressData.phone} onChange={e => setAddressData({...addressData, phone: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddAddress} disabled={isAddingAddress} className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                      {isAddingAddress ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                      Save Address
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-8">
              {addresses.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No delivery locations saved yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {addresses.map((addr: any) => (
                    <div key={addr.id || addr._id} className="p-6 rounded-[2rem] border bg-muted/10 relative hover:bg-white hover:shadow-lg transition-all group">
                      {addr.isDefault && (
                        <Badge className="absolute top-4 right-4 text-[10px] bg-accent text-accent-foreground border-none">Default</Badge>
                      )}
                      <p className="font-bold text-primary text-lg">{addr.fullName}</p>
                      <Separator className="my-3 opacity-30" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{addr.street}</p>
                      {addr.landmark && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 text-[9px] text-accent font-black uppercase tracking-tighter">
                          Landmark: {addr.landmark}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                      <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm">
                        <Phone className="h-4 w-4 text-accent" /> {addr.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
