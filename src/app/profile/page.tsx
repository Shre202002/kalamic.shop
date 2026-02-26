'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, getUserOrders, getWishlistItems, getUserAddresses, addAddress } from '@/lib/actions/user-actions';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-5xl font-extrabold text-primary tracking-tight">My Profile</h1>
            <Badge variant={isProfileComplete ? "default" : "destructive"} className="h-8 rounded-full">
              {isProfileComplete ? "Profile Complete" : "Profile Incomplete"}
            </Badge>
          </div>

          {!isProfileComplete && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-3 text-destructive animate-pulse">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-bold">Please complete your profile details (First Name, Last Name, Phone) to place orders.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Link href="/orders">
              <Card className="hover:bg-muted/30 transition-all border-none shadow-sm active:scale-95">
                <CardContent className="p-4 md:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">My Orders</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{orders.length} items acquired</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/wishlist">
              <Card className="hover:bg-muted/30 transition-all border-none shadow-sm active:scale-95">
                <CardContent className="p-4 md:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                      <Heart className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">Wishlist</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{wishlistCount} favorites saved</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex items-center gap-2 text-primary text-lg md:text-xl">
                <UserIcon className="h-5 w-5" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Registered Email</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-xl text-muted-foreground border border-dashed text-sm">
                    <Mail className="h-4 w-4" /> {user.email}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName} 
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                      placeholder="Enter your first name" 
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName} 
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                      placeholder="Enter your last name" 
                      className="rounded-xl h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+91 XXXXX XXXXX" 
                    className="rounded-xl h-12"
                  />
                </div>
                <Button disabled={isUpdating} className="w-full md:w-auto bg-primary text-white px-10 h-12 rounded-xl font-bold shadow-lg shadow-primary/10">
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-white border-b">
              <CardTitle className="flex items-center gap-2 text-primary text-lg md:text-xl">
                <MapPin className="h-5 w-5" /> Saved Addresses
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1 md:gap-2">
                    <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Add New Delivery Address</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="Recipient Name" value={addressData.fullName} onChange={e => setAddressData({...addressData, fullName: e.target.value})} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input placeholder="House No, Street, Locality" value={addressData.street} onChange={e => setAddressData({...addressData, street: e.target.value})} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nearest Landmark</Label>
                      <Input placeholder="e.g. Near Art Center" value={addressData.landmark} onChange={e => setAddressData({...addressData, landmark: e.target.value})} className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input placeholder="City" value={addressData.city} onChange={e => setAddressData({...addressData, city: e.target.value})} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input placeholder="110001" value={addressData.zipCode} onChange={e => setAddressData({...addressData, zipCode: e.target.value})} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input placeholder="+91 XXXXX XXXXX" value={addressData.phone} onChange={e => setAddressData({...addressData, phone: e.target.value})} className="rounded-xl" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddAddress} disabled={isAddingAddress} className="w-full h-12 rounded-xl font-bold">
                      {isAddingAddress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Artisan Address
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No delivery locations saved yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr: any) => (
                    <div key={addr.id || addr._id} className="p-4 rounded-2xl border bg-muted/10 relative hover:bg-white transition-colors">
                      {addr.isDefault && (
                        <Badge className="absolute top-4 right-4 text-[10px] bg-accent text-accent-foreground border-none">Default</Badge>
                      )}
                      <p className="font-bold text-primary">{addr.fullName}</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2">{addr.street}</p>
                      {addr.landmark && <p className="text-[10px] text-accent font-bold uppercase mt-0.5">Landmark: {addr.landmark}</p>}
                      <p className="text-xs md:text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                      <p className="text-xs md:text-sm text-primary font-medium mt-2 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-dashed"
              onClick={() => auth.signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out from Kalamic
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
