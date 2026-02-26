
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
  MapPin, 
  Plus, 
  LogOut, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, getUserOrders, getWishlistItems, getUserAddresses } from '@/lib/actions/user-actions';

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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
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
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <UserIcon className="h-16 w-16 text-muted-foreground opacity-20" />
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Sign in to manage your account and orders.</p>
          <Button asChild><Link href="/auth/login">Sign In</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h1 className="text-4xl font-bold text-primary">My Profile</h1>

          {/* Personal Information */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <UserIcon className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-muted-foreground border">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName} 
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                      placeholder="Enter your last name" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+91 XXXXX XXXXX" 
                  />
                </div>
                <Button disabled={isUpdating} className="bg-primary text-white px-8">
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Stats Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/orders">
              <Card className="hover:bg-muted/30 transition-colors border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">My Orders</h3>
                    <p className="text-sm text-muted-foreground">Track & manage orders ({orders.length})</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/wishlist">
              <Card className="hover:bg-muted/30 transition-colors border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">Wishlist</h3>
                    <p className="text-sm text-muted-foreground">Saved products ({wishlistCount})</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Saved Addresses */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <MapPin className="h-5 w-5 text-primary" /> Saved Addresses
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No saved addresses yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr: any) => (
                    <div key={addr._id} className="p-4 rounded-xl border bg-muted/10 relative">
                      {addr.isDefault && <Badge className="absolute top-2 right-2 text-[10px]">Default</Badge>}
                      <p className="font-bold text-primary">{addr.fullName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{addr.street}</p>
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                      <p className="text-sm text-muted-foreground mt-1">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Button 
            variant="outline" 
            className="w-full h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            onClick={() => auth.signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
