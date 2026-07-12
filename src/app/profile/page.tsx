'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
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
  LogOut, 
  Loader2, 
  Settings,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Home,
  CheckCircle2,
  Key,
  Flag,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, verifyUserEmail, getOrCreateProfile } from '@/lib/actions/user-actions';
import { sendOtp, verifyOtp } from '@/lib/actions/otp-actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { State, City } from 'country-state-city';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, loading: isUserLoading } = useProtectedRoute();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // Address validation states
  const [statesList] = useState(State.getStatesOfCountry('IN'));
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

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

  // Helper to find state ISO code by name
  const getStateCode = (stateName: string) => {
    return statesList.find(s => s.name.toLowerCase() === stateName.toLowerCase())?.isoCode || '';
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        let profileData = await getProfile(user.uid);
        if (!profileData) {
          profileData = await getOrCreateProfile(user.uid, user.email || '');
        }

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

          // Pre-populate cities if state exists
          if (profileData.state) {
            const code = getStateCode(profileData.state);
            if (code) {
              setCitiesList(City.getCitiesOfState('IN', code));
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [user]);

  // Handle Pincode Auto-fill
  const handlePincodeChange = async (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: cleanVal }));
    setPincodeError('');

    if (cleanVal.length === 6) {
      setIsPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanVal}`);
        const data = await response.json();

        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          const foundState = statesList.find(s => 
            s.name.toLowerCase().includes(postOffice.State.toLowerCase()) || 
            postOffice.State.toLowerCase().includes(s.name.toLowerCase())
          );
          
          if (foundState) {
            const stateCities = City.getCitiesOfState('IN', foundState.isoCode);
            const apiDistrict = postOffice.District;
            let matchedCityName = apiDistrict;

            const existingCity = stateCities.find(c => 
              c.name.toLowerCase() === apiDistrict.toLowerCase() || 
              apiDistrict.toLowerCase().includes(c.name.toLowerCase()) ||
              c.name.toLowerCase().includes(apiDistrict.toLowerCase())
            );

            if (existingCity) {
              matchedCityName = existingCity.name;
            }

            setCitiesList(stateCities);
            if (!existingCity) {
              setCitiesList(prev => [{ name: apiDistrict }, ...prev]);
            }

            setFormData(prev => ({
              ...prev,
              state: foundState.name,
              city: matchedCityName
            }));
            
            toast({ title: "Location Detected", description: `${matchedCityName}, ${foundState.name}` });
          }
        } else {
          setPincodeError('Invalid Pincode');
        }
      } catch (err) {
        console.error("Pincode fetch failed", err);
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

  const handleStateChange = (stateName: string) => {
    const stateObj = statesList.find(s => s.name === stateName);
    if (stateObj) {
      setFormData(prev => ({ ...prev, state: stateName, city: '' }));
      setCitiesList(City.getCitiesOfState('IN', stateObj.isoCode));
    }
  };

  const handleSendEmailOtp = async () => {
    if (!user?.email) return;
    setIsVerifyingEmail(true);
    try {
      await sendOtp(user.email);
      setIsEmailOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your inbox for the verification code." });
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
        toast({ title: "Email Verified", description: "Your email has been successfully authenticated." });
      } else {
        toast({ variant: "destructive", title: "Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifyingEmail(false);
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
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isProfileComplete = !!(formData.firstName && formData.lastName && formData.address && formData.city && formData.state && formData.pincode);
  const isEmailVerified = profile?.emailVerified;
  const isFullyVerified = isProfileComplete && isEmailVerified;

  const memberSinceYear = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : 2024;

  if (isUserLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-8 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                <ShieldCheck className="h-4 w-4 text-primary" /> Account Dashboard
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">My Profile</h1>
              <p className="text-muted-foreground text-sm md:text-lg max-w-xl">
                Manage your personal details and delivery preferences.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <Badge variant={isFullyVerified ? "default" : "destructive"} className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                {isFullyVerified ? "Verified Member" : "Verification Required"}
              </Badge>
               <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white border border-border px-4 py-3 rounded-2xl shadow-sm">
                <Calendar className="h-3 w-3 text-primary" /> Member Since {memberSinceYear}
              </div>
            </div>
          </div>

          {!isFullyVerified && (
            <Card className="bg-destructive/5 border-destructive/30 border-2 rounded-[2.5rem] overflow-hidden shadow-xl animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="h-20 w-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0 border border-destructive/20 shadow-inner">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-black text-primary">Information Required</h3>
                  <p className="text-muted-foreground text-base max-w-lg">
                    {!isEmailVerified && "• Please verify your email address. "}
                    {!isProfileComplete && "• Complete your profile to enable checkout."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white border border-border">
                <CardHeader className="p-10 pb-6 bg-primary/[0.02]">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-primary">Personal Details</CardTitle>
                      <CardDescription className="text-base">Your credentials used for billing and delivery.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator className="mx-10 opacity-30" />
                <CardContent className="p-10 pt-8">
                  <form onSubmit={handleUpdateProfile} className="space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Identity
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">First Name *</Label>
                          <Input required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="Aarav" className="pl-6 rounded-2xl h-14 border-border focus-visible:ring-primary bg-background text-lg font-medium" />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Last Name *</Label>
                          <Input required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Sharma" className="pl-6 rounded-2xl h-14 border-border focus-visible:ring-primary bg-background text-lg font-medium" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Contact Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                            <Input
                              disabled
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+91 XXXXX XXXXX"
                              className="pl-14 rounded-2xl h-14 border-border focus-visible:ring-primary bg-background text-lg font-medium"
                            />
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                            <Input disabled value={user?.email || ''} className="pl-14 rounded-2xl h-14 border-border bg-muted text-lg font-medium pr-24" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isEmailVerified ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Button type="button" size="sm" variant="ghost" className="text-[10px] font-bold text-primary" onClick={handleSendEmailOtp}>Verify</Button>
                              )}
                            </div>
                          </div>
                          {!isEmailVerified && isEmailOtpSent && (
                            <div className="flex items-center gap-2 mt-2 animate-in slide-in-from-top-2 bg-primary/5 p-3 rounded-2xl border border-primary/20">
                              <div className="relative flex-1">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50 z-10" />
                                <Input placeholder="OTP" maxLength={6} value={emailOtpCode} onChange={(e) => setEmailOtpCode(e.target.value)} className="pl-14 h-10 rounded-xl font-bold text-center tracking-widest border-border" />
                              </div>
                              <Button type="button" size="sm" onClick={handleVerifyEmailOtp} disabled={isVerifyingEmail}>
                                {isVerifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Shipping Address
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Street Address *</Label>
                          <div className="relative">
                            <Home className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                            <Input required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="House No, Street Name" className="pl-14 rounded-2xl h-14 border-border focus-visible:ring-primary bg-background text-lg font-medium" />
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Landmark</Label>
                          <div className="relative">
                            <Flag className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                            <Input value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} placeholder="Near Public Park" className="pl-14 rounded-2xl h-14 border-border focus-visible:ring-primary bg-background text-lg font-medium" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Pincode *</Label>
                          <div className="relative">
                            <Input 
                              required 
                              value={formData.pincode} 
                              onChange={(e) => handlePincodeChange(e.target.value)} 
                              placeholder="302001" 
                              className={cn(
                                "pl-6 rounded-2xl h-14 border-border focus-visible:ring-primary bg-background text-lg font-medium",
                                pincodeError && "border-destructive focus-visible:ring-destructive"
                              )} 
                            />
                            {isPincodeLoading && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                          {pincodeError && <p className="text-[10px] font-bold text-destructive ml-1">{pincodeError}</p>}
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">State *</Label>
                          <Select value={formData.state} onValueChange={handleStateChange}>
                            <SelectTrigger className="h-14 rounded-2xl border-border bg-background text-lg font-medium px-6 focus:ring-primary">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl max-h-[300px]">
                              {statesList.map((state) => (
                                <SelectItem key={state.isoCode} value={state.name} className="rounded-xl py-3 px-4 focus:bg-primary/5">
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">City *</Label>
                          <Select 
                            value={formData.city} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
                            disabled={!formData.state || citiesList.length === 0}
                          >
                            <SelectTrigger className="h-14 rounded-2xl border-border bg-background text-lg font-medium px-6 focus:ring-primary">
                              <SelectValue placeholder={!formData.state ? "Select State first" : "Select City"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl max-h-[300px]">
                              {citiesList.map((city, idx) => (
                                <SelectItem key={`${city.name}-${idx}`} value={city.name} className="rounded-xl py-3 px-4 focus:bg-primary/5">
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdating} className="bg-primary text-white px-12 h-16 rounded-[1.5rem] text-lg font-black shadow-2xl shadow-primary/20 transition-all active:scale-95">
                        {isUpdating ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : null}
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white p-8 border border-border">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Settings className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black text-primary">Settings</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-muted border-2 border-primary/5">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Status</span>
                    {isFullyVerified ? (
                      <Badge className="bg-green-500 px-3 py-1 text-[10px] font-bold">VERIFIED</Badge>
                    ) : (
                      <Badge variant="destructive" className="px-3 py-1 text-[10px] font-bold">PENDING</Badge>
                    )}
                  </div>
                </div>
                <Separator className="my-8 opacity-50" />
                <Button variant="ghost" className="w-full h-16 rounded-[1.5rem] text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-2 border-dashed border-border font-black" onClick={handleSignOut}>
                  <LogOut className="mr-3 h-5 w-5" /> Sign Out
                </Button>
              </Card>
            </div>
          </div>
        </div>
        {isVerifyingEmail && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest">
              Verifying Email...
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
