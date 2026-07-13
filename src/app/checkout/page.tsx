'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useNavigation } from '@/hooks/useNavigation';
import { collection } from 'firebase/firestore';
import { getProfile } from '@/lib/actions/user-actions';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box as MuiBox, 
  TextField, 
  Button, 
  Divider, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
  Avatar,
  alpha as muiAlpha,
  Autocomplete,
  Chip,
  Skeleton
} from '@mui/material';
import { 
  CreditCard, 
  ShieldCheck, 
  MapPin,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import { toAnalyticsItem, trackEvent } from '@/lib/analytics';
import { useSearchParams } from 'next/navigation';
import { State, City } from 'country-state-city';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: new (options: any) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

interface ChargesPreview {
  charges: {
    shipping: number;
    handling: number;
    premium: number;
  };
  total: number;
  freeDelivery: {
    isFree: boolean;
    reason: 'city' | 'threshold' | null;
  };
}

function CheckoutContent() {
  const { user, loading: isAuthLoading } = useProtectedRoute();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useNavigation();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chargesPreview, setChargesPreview] = useState<ChargesPreview | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // States for old cart item fallback logic
  const [dbRequiresHandling, setDbRequiresHandling] = useState(true);
  const [dbRequiresPremium, setDbRequiresPremium] = useState(true);
  const [flagsLoaded, setFlagsLoaded] = useState(false);

  // Promo Code States
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

  // Policy Acceptance State
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Address lookup states
  const [statesList] = useState(State.getStatesOfCountry('IN'));
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    landmark: '',
    paymentMethod: 'card'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const profile = await getProfile(user.uid);
        setUserProfile(profile);
      } catch (e) {
        console.error('Profile load failed:', e);
      } finally {
        setIsProfileLoading(false);
      }
    };
    if (user) loadProfile();
    else if (!isAuthLoading) setIsProfileLoading(false);
  }, [user, isAuthLoading]);

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;

  const fetchProductFlags = async (items: any[]) => {
    const results = await Promise.all(
      items.map(async (item) => {
        const productId = item.productVariantId || item.id;
        try {
          const res = await fetch(`/api/products/${productId}/flags`);
          return res.ok ? await res.json() : { requiresHandling: true, requiresPremiumProtection: true };
        } catch {
          return { requiresHandling: true, requiresPremiumProtection: true };
        }
      })
    );
    
    return {
      requiresHandling: results.some(r => r.requiresHandling !== false),
      requiresPremiumProtection: results.some(r => r.requiresPremiumProtection !== false)
    };
  };

  const fetchCharges = async (city: string, handlingFlag?: boolean, premiumFlag?: boolean) => {
    if (subtotal === 0) return;
    setIsCalculating(true);
    
    const useHandling = handlingFlag ?? (cartItems?.every(i => i.requiresHandling !== undefined) 
      ? cartItems.some(i => i.requiresHandling !== false) 
      : dbRequiresHandling);
      
    const usePremium = premiumFlag ?? (cartItems?.every(i => i.requiresPremiumProtection !== undefined)
      ? cartItems.some(i => i.requiresPremiumProtection !== false)
      : dbRequiresPremium);

    try {
      const res = await fetch('/api/calculate-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subtotal, 
          city,
          requiresHandling: useHandling,
          requiresPremiumProtection: usePremium
        })
      });
      const data = await res.json();
      if (res.ok) setChargesPreview(data);
    } catch (e) {
      console.error("Charges sync failed", e);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (!mounted || !cartItems?.length || subtotal === 0) return;
    
    const initialize = async () => {
      const hasFlags = cartItems.every(
        item => item.requiresHandling !== undefined && item.requiresPremiumProtection !== undefined
      );
      
      let finalFlags;
      if (hasFlags) {
        finalFlags = {
          requiresHandling: cartItems.some(item => item.requiresHandling !== false),
          requiresPremiumProtection: cartItems.some(item => item.requiresPremiumProtection !== false)
        };
      } else {
        finalFlags = await fetchProductFlags(cartItems);
      }

      setDbRequiresHandling(finalFlags.requiresHandling);
      setDbRequiresPremium(finalFlags.requiresPremiumProtection);
      setFlagsLoaded(true);

      await fetchCharges(formData.city, finalFlags.requiresHandling, finalFlags.requiresPremiumProtection);
    };
    
    initialize();
  }, [mounted, cartItems, subtotal]);

  useEffect(() => {
    if (!mounted || !flagsLoaded) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCharges(formData.city);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData.city]);

  const requiresHandling = cartItems?.every(item => item.requiresHandling !== undefined)
    ? (cartItems?.some(item => item.requiresHandling !== false) ?? true)
    : dbRequiresHandling;

  const requiresPremiumProtection = cartItems?.every(item => item.requiresPremiumProtection !== undefined)
    ? (cartItems?.some(item => item.requiresPremiumProtection !== false) ?? true)
    : dbRequiresPremium;

  useEffect(() => {
    async function loadUserData() {
      if (!user || !mounted || !userProfile) return;
      setFormData(prev => ({
        ...prev,
        fullName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        email: user.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zip: userProfile.pincode || '',
        landmark: userProfile.landmark || '',
      }));

      if (userProfile.state) {
        const foundState = statesList.find(s => s.name === userProfile.state);
        if (foundState) {
          setCitiesList(City.getCitiesOfState('IN', foundState.isoCode));
        }
      }
    }
    loadUserData();
  }, [user, mounted, userProfile, statesList]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus('loading');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), subtotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPromoDiscount(data.discountAmount);
        setPromoDiscountType(data.discountType);
        setPromoMessage(data.message);
        setPromoStatus('success');
        toast({ title: "Promo Applied", description: data.message });
      } else {
        setPromoDiscount(0);
        setPromoMessage(data.message || 'Validation failed');
        setPromoStatus('error');
      }
    } catch (e) {
      setPromoStatus('error');
      setPromoMessage('Network error. Try again.');
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoDiscountType(null);
    setPromoMessage('');
    setPromoStatus('idle');
  };

  const handlePincodeChange = async (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, zip: cleanVal }));

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
              apiDistrict.toLowerCase().includes(c.name.toLowerCase())
            );

            if (existingCity) matchedCityName = existingCity.name;
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
          toast({ variant: "destructive", title: "Invalid Pincode", description: "Could not find location for this code." });
        }
      } catch (err) {
        console.error("Pincode fetch failed", err);
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

  const handleStateChange = (stateName: string | null) => {
    if (!stateName) {
      setFormData(prev => ({ ...prev, state: '', city: '' }));
      setCitiesList([]);
      return;
    }
    const foundState = statesList.find(s => s.name === stateName);
    if (foundState) {
      setFormData(prev => ({ ...prev, state: stateName, city: '' }));
      setCitiesList(City.getCitiesOfState('IN', foundState.isoCode));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!mounted || isAuthLoading || isCartLoading || !flagsLoaded || isProfileLoading) {
    return (
      <MuiBox sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAF4EB' }}>
        <CircularProgress sx={{ color: '#EA781E' }} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 2 }}>Securing session...</Typography>
      </MuiBox>
    );
  }

  const isEmailVerified = userProfile?.emailVerified === true;
  const isVerified = isEmailVerified;

  if (!isVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-md text-center space-y-8">
            
            <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-12 w-12 text-destructive" />
            </div>
            
            <div className="space-y-3">
              <h1 className="font-display font-black text-3xl text-foreground">Verify to Continue</h1>
              <p className="text-muted-foreground font-medium">Please complete email verification before placing an order.</p>
            </div>
            
            <div className="space-y-3 text-left">
              <div className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-2",
                isEmailVerified ? "border-green-200 bg-green-50" : "border-destructive/20 bg-destructive/5"
              )}>
                {isEmailVerified 
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                }
                <div>
                  <p className="font-bold text-sm">Email Verification</p>
                  <p className="text-xs text-muted-foreground">{isEmailVerified ? 'Verified ✓' : 'Not verified yet'}</p>
                </div>
              </div>
            </div>
            
            <Link href="/profile">
              <button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                Complete Verification →
              </button>
            </Link>
            
            <p className="text-xs text-muted-foreground">Takes less than a minute</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const chargesReady = chargesPreview !== null;
  const finalTotal = (chargesPreview ? chargesPreview.total : 0) - promoDiscount;

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length) return;
    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.state || !formData.zip || !formData.phone) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "All shipping details are required." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Enter a valid customer email for the payment receipt.' });
      return;
    }

    if (!policyAccepted) {
      toast({ variant: "destructive", title: "Policy Agreement Required", description: "You must agree to our Privacy Policy and Refund & Return Policy to proceed." });
      return;
    }

    setIsProcessing(true);

    trackEvent('add_shipping_info', {
      currency: 'INR',
      value: finalTotal,
      shipping_tier: 'Standard',
      items: cartItems.map((item) => toAnalyticsItem(item, item.quantity)),
    });

    const payload = {
      userId: user.uid,
      customerName: formData.fullName,
      customerPhone: formData.phone,
      customerEmail: formData.email,
      items: cartItems.map(i => ({ productId: i.productVariantId || i.id, quantity: i.quantity })),
      shippingDetails: formData,
      promoCode: promoStatus === 'success' ? promoCode.trim().toUpperCase() : null,
      promoDiscount: promoStatus === 'success' ? promoDiscount : 0,
      promoDiscountType: promoStatus === 'success' ? promoDiscountType : null,
      totalAmount: finalTotal,
      requiresHandling,
      requiresPremiumProtection
    };

    try {
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Secure payment checkout is still loading. Please try again.');
      }

      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      const razorpay = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: result.currency,
        name: 'Kalamic',
        description: `Order ${result.orderId}`,
        order_id: result.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone.replace(/\D/g, '').slice(-10),
        },
        notes: {
          kalamic_order_number: result.orderId,
        },
        theme: { color: '#EA781E' },
        retry: { enabled: true, max_count: 2 },
        modal: {
          confirm_close: true,
          ondismiss: () => setIsProcessing(false),
        },
        handler: async (payment: any) => {
          try {
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: result.orderId,
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
              }),
            });
            const verification = await verifyResponse.json();
            if (!verifyResponse.ok || !verification.paymentVerified) {
              throw new Error(verification.message || 'Payment confirmation is pending');
            }
            router.push(`/checkout/success?order_id=${result.orderId}`);
          } catch (verificationError: any) {
            toast({
              variant: 'destructive',
              title: 'Payment Confirmation Pending',
              description: verificationError.message || 'Please check your order status before retrying.',
            });
            router.push(`/checkout/success?order_id=${result.orderId}`);
          }
        },
      });

      razorpay.on('payment.failed', (failure: any) => {
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: failure?.error?.description || 'The payment was not completed. Please try again.',
        });
        setIsProcessing(false);
      });

      razorpay.open();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Failed", description: error.message });
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 12, md: 16 } }}>
        <MuiBox sx={{ mb: 6 }}>
          <Breadcrumbs separator={<ChevronLeft size={14} />} sx={{ mb: 2 }}>
            <MuiLink component={Link} href="/cart" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Back to Bag
            </MuiLink>
          </Breadcrumbs>
          <MuiBox sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
            <MuiBox>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.03em', mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>Checkout</Typography>
              <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Confirm your artisan acquisitions.</Typography>
            </MuiBox>
            <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', px: 3, py: 1.5, borderRadius: '1rem', border: '1px solid', borderColor: muiAlpha('#EA781E', 0.1) }}>
              <ShieldCheck size={18} color="#EA781E" />
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#EA781E', fontSize: '0.65rem' }}>Secure Transaction</Typography>
            </MuiBox>
          </MuiBox>
        </MuiBox>

        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} lg={7}>
            <Stack spacing={4}>
              <Paper elevation={0} sx={{ borderRadius: '2.5rem', p: { xs: 4, md: 6 }, border: '1px solid', borderColor: 'divider' }}>
                <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: muiAlpha('#EA781E', 0.1), color: '#EA781E', width: 48, height: 48, borderRadius: '1rem' }}>
                    <MapPin size={24} />
                  </Avatar>
                  <MuiBox>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Destination</Typography>
                    <Typography variant="body2" color="text.secondary">Where should we deliver your treasures?</Typography>
                  </MuiBox>
                </MuiBox>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth required type="email" label="Email for Receipt" name="email" value={formData.email} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Street Address" name="address" value={formData.address} onChange={handleInputChange} multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nearest Landmark" name="landmark" value={formData.landmark} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="ZIP / Pincode" 
                      name="zip" 
                      value={formData.zip} 
                      onChange={(e) => handlePincodeChange(e.target.value)} 
                      InputProps={{
                        endAdornment: isPincodeLoading ? <CircularProgress size={20} /> : null
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={statesList.map(s => s.name)}
                      value={formData.state}
                      onChange={(_, val) => handleStateChange(val)}
                      renderInput={(params) => (
                        <TextField {...params} label="State" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={citiesList.map(c => c.name)}
                      value={formData.city}
                      onChange={(_, val) => setFormData(p => ({ ...p, city: val || '' }))}
                      disabled={!formData.state}
                      renderInput={(params) => (
                        <TextField {...params} label="City" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Contact Phone" name="phone" value={formData.phone} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper elevation={0} sx={{ borderRadius: '2.5rem', p: { xs: 4, md: 6 }, border: '1px solid', borderColor: 'divider' }}>
                <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: muiAlpha('#EA781E', 0.1), color: '#EA781E', width: 48, height: 48, borderRadius: '1rem' }}>
                    <CreditCard size={24} />
                  </Avatar>
                  <MuiBox>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Payment Method</Typography>
                    <Typography variant="body2" color="text.secondary">Securely process your transaction.</Typography>
                  </MuiBox>
                </MuiBox>
                <RadioGroup defaultValue="card">
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '1.25rem', borderColor: '#EA781E', bgcolor: muiAlpha('#EA781E', 0.03) }}>
                    <FormControlLabel value="card" control={<Radio sx={{ color: '#EA781E' }} />} label={
                      <MuiBox sx={{ ml: 1 }}>
                        <Typography sx={{ fontWeight: 800 }}>Razorpay Secure Gateway</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>UPI, Cards, Net Banking</Typography>
                      </MuiBox>
                    } sx={{ width: '100%', m: 0 }} />
                  </Paper>
                </RadioGroup>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper elevation={10} sx={{ borderRadius: '3rem', p: { xs: 4, md: 6 }, position: 'sticky', top: '100px', bgcolor: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#271E1B' }}>Summary</Typography>
              <Stack spacing={3} sx={{ mb: 4 }}>
                {cartItems?.map((item) => (
                  <MuiBox key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <MuiBox sx={{ position: 'relative', width: 56, height: 56, borderRadius: '1rem', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                      <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.name} fill style={{ objectFit: 'cover' }} />
                    </MuiBox>
                    <MuiBox sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.875rem' }}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Qty: {item.quantity}</Typography>
                    </MuiBox>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.875rem' }}>₹{(item.priceAtAddToCart * item.quantity).toLocaleString()}</Typography>
                  </MuiBox>
                ))}
              </Stack>
              
              <Divider sx={{ mb: 4, borderStyle: 'dashed' }} />

              <MuiBox sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 900, color: 'text.disabled', fontSize: '0.6rem', display: 'block', mb: 1.5 }}>
                  Promo Code
                </Typography>
                
                {promoStatus === 'success' ? (
                  <Chip 
                    label={promoCode.toUpperCase()} 
                    onDelete={handleRemovePromo}
                    deleteIcon={<X size={14} />}
                    sx={{ 
                      bgcolor: muiAlpha('#4caf50', 0.1), 
                      color: '#2e7d32', 
                      fontWeight: 900, 
                      borderRadius: 2,
                      px: 1,
                      '& .MuiChip-deleteIcon': { color: '#2e7d32', '&:hover': { color: '#1b5e20' } }
                    }}
                  />
                ) : (
                  <Stack direction="row" spacing={1}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      placeholder="Enter code" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoStatus === 'loading'}
                      error={promoStatus === 'error'}
                      helperText={promoStatus === 'error' ? promoMessage : ''}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || promoStatus === 'loading'}
                      sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
                    >
                      {promoStatus === 'loading' ? <CircularProgress size={16} /> : 'Apply'}
                    </Button>
                  </Stack>
                )}
              </MuiBox>

              <Stack spacing={2} sx={{ mb: 4 }}>
                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Subtotal</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{subtotal.toLocaleString()}</Typography>
                </MuiBox>

                {!chargesReady ? (
                  <>
                    {['FragileCare™ Shipping', 'Artisan Handling', 'Premium Protection'].map((label) => (
                      <MuiBox key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>{label}</Typography>
                        <Skeleton variant="text" width={50} height={24} sx={{ borderRadius: 1 }} />
                      </MuiBox>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Total</Typography>
                      <Skeleton variant="text" width={100} height={48} sx={{ borderRadius: 1 }} />
                    </MuiBox>
                  </>
                ) : (
                  <>
                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>FragileCare™ Shipping</Typography>
                      <Typography sx={{ fontWeight: 700, color: chargesPreview.charges.shipping === 0 ? 'success.main' : 'inherit' }}>
                        {chargesPreview.charges.shipping === 0 ? 'FREE' : `₹${chargesPreview.charges.shipping}`}
                      </Typography>
                    </MuiBox>

                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Artisan Handling</Typography>
                      <Typography sx={{ fontWeight: 700 }}>₹{chargesPreview.charges.handling}</Typography>
                    </MuiBox>

                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Premium Protection</Typography>
                      <Typography sx={{ fontWeight: 700 }}>₹{chargesPreview.charges.premium}</Typography>
                    </MuiBox>

                    {chargesPreview.freeDelivery.isFree && (
                      <Chip
                        icon={<CheckCircle2 size={12} />}
                        label={chargesPreview.freeDelivery.reason === 'city' ? 'Free delivery to Kanpur' : 'Free delivery on orders above ₹499'}
                        size="small"
                        sx={{ bgcolor: muiAlpha('#6F8A7A', 0.1), color: '#6F8A7A', fontWeight: 800, fontSize: '0.6rem', border: 'none', height: 24, alignSelf: 'flex-start' }}
                      />
                    )}

                    <Divider sx={{ mb: 2 }} />
                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Typography sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Total</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#EA781E', lineHeight: 1 }}>₹{finalTotal.toLocaleString()}</Typography>
                    </MuiBox>
                  </>
                )}
              </Stack>

              <MuiBox sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1.5,
                p: 2,
                borderRadius: '1rem',
                bgcolor: policyAccepted ? muiAlpha('#6F8A7A', 0.05) : muiAlpha('#EA781E', 0.03),
                border: '1px solid',
                borderColor: policyAccepted ? muiAlpha('#6F8A7A', 0.2) : muiAlpha('#EA781E', 0.1),
                transition: 'all 0.2s',
                mb: 2
              }}>
                <input
                  type="checkbox"
                  id="policy-checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: '#EA781E', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
                />
                <label htmlFor="policy-checkbox" style={{ cursor: 'pointer' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.5 }}>
                    I have read and agree to the{' '}
                    <Link href="/privacy" target="_blank" style={{ color: '#EA781E', fontWeight: 800, textDecoration: 'underline' }}>Privacy Policy</Link>
                    {' '}and{' '}
                    <Link href="/returns" target="_blank" style={{ color: '#EA781E', fontWeight: 800, textDecoration: 'underline' }}>Refund & Return Policy</Link>
                  </Typography>
                </label>
              </MuiBox>
              
              <Button 
                fullWidth 
                variant="contained" 
                disabled={isProcessing || !chargesReady || !policyAccepted} 
                onClick={handlePlaceOrder} 
                sx={{ 
                  borderRadius: '1.5rem', 
                  height: '5rem', 
                  fontSize: '1.25rem', 
                  fontWeight: 900, 
                  bgcolor: '#EA781E', 
                  '&:hover': { bgcolor: '#D66A18' }, 
                  textTransform: 'none',
                  opacity: (chargesReady && policyAccepted) ? 1 : 0.5,
                  cursor: (chargesReady && policyAccepted) ? 'pointer' : 'not-allowed'
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : !chargesReady ? (
                  'Calculating...'
                ) : (
                  `Confirm & Pay ₹${finalTotal.toLocaleString()}`
                )}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <MuiBox sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FAF4EB' }}>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={
          <MuiBox sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#EA781E' }} />
          </MuiBox>
        }>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </MuiBox>
  );
}
