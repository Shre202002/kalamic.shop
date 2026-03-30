
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useNavigation } from '@/hooks/useNavigation';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
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
  InputAdornment,
  Chip
} from '@mui/material';
import { 
  CreditCard, 
  ShieldCheck, 
  MapPin,
  ChevronLeft,
  Search,
  X,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { State, City } from 'country-state-city';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/utils/calculateShipping';

declare global {
  interface Window {
    Cashfree: any;
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
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chargesPreview, setChargesPreview] = useState<ChargesPreview | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Promo Code States
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

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

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;

  // Backup cart clearing if returning with order_id
  useEffect(() => {
    const orderIdFromUrl = searchParams?.get('order_id');
    if (orderIdFromUrl && user && firestore) {
      const clearCartBackup = async () => {
        try {
          const cartRef = collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
          const snapshot = await getDocs(cartRef);
          await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
          console.log('[BACKUP] Cart cleared via checkout safety effect');
        } catch (e) {}
      };
      clearCartBackup();
    }
  }, [searchParams, user, firestore]);

  const fetchCharges = async (city: string) => {
    if (subtotal === 0) return;
    setIsCalculating(true);
    try {
      const res = await fetch('/api/calculate-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal, city })
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
    if (mounted && subtotal > 0) {
      fetchCharges(formData.city);
    }
  }, [mounted, subtotal]);

  useEffect(() => {
    if (!mounted) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCharges(formData.city);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData.city]);

  useEffect(() => {
    async function loadUserData() {
      if (!user || !mounted) return;
      try {
        const profile = await getProfile(user.uid);
        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: `${profile.firstName} ${profile.lastName}`.trim(),
            email: user.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.pincode || '',
            landmark: profile.landmark || '',
          }));

          if (profile.state) {
            const foundState = statesList.find(s => s.name === profile.state);
            if (foundState) {
              setCitiesList(City.getCitiesOfState('IN', foundState.isoCode));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching auto-fill data:", err);
      }
    }
    loadUserData();
  }, [user, mounted, statesList]);

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

  const finalTotal = (chargesPreview ? chargesPreview.total : (subtotal + (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 150) + 60)) - promoDiscount;

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length) return;
    if (!formData.fullName || !formData.address || !formData.city || !formData.state || !formData.zip || !formData.phone) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "All shipping details are required." });
      return;
    }

    setIsProcessing(true);

    const payload = {
      userId: user.uid,
      customerName: formData.fullName,
      customerPhone: formData.phone,
      customerEmail: formData.email,
      items: cartItems.map(i => ({ productId: i.productVariantId, quantity: i.quantity })),
      shippingDetails: formData,
      promoCode: promoStatus === 'success' ? promoCode.trim().toUpperCase() : null,
      promoDiscount: promoStatus === 'success' ? promoDiscount : 0,
      promoDiscountType: promoStatus === 'success' ? promoDiscountType : null,
      totalAmount: finalTotal
    };

    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      if (result.isMock) {
        toast({ title: "Mock Payment", description: "Simulating successful transaction." });
        router.push(`/checkout/success?order_id=${result.orderId}`);
        return;
      }

      if (!cashfreeLoaded) throw new Error("Payment SDK failed to load.");

      const cashfree = new window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
      });

      cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self" 
      });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Failed", description: error.message });
      setIsProcessing(false);
    }
  };

  if (!mounted || isAuthLoading || isCartLoading) {
    return (
      <MuiBox sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAF4EB' }}>
        <CircularProgress sx={{ color: '#EA781E' }} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 2 }}>Securing session...</Typography>
      </MuiBox>
    );
  }

  if (!user) return null;

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" onLoad={() => setCashfreeLoaded(true)} />
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
                        <Typography sx={{ fontWeight: 800 }}>Cashfree Secure Gateway</Typography>
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

              {/* Promo Code UI */}
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
                
                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>FragileCare™ Shipping</Typography>
                  <Typography sx={{ fontWeight: 700, color: (chargesPreview?.charges.shipping ?? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 150)) === 0 ? 'success.main' : 'inherit' }}>
                    {(chargesPreview?.charges.shipping ?? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 150)) === 0 ? 'FREE' : `₹${chargesPreview?.charges.shipping ?? 150}`}
                  </Typography>
                </MuiBox>

                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Artisan Handling</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{chargesPreview?.charges.handling ?? 40}</Typography>
                </MuiBox>

                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Premium Protection</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{chargesPreview?.charges.premium ?? 20}</Typography>
                </MuiBox>

                {chargesPreview?.freeDelivery.isFree && (
                  <MuiBox sx={{ mt: 1, px: 2, py: 1, bgcolor: muiAlpha('#4caf50', 0.05), border: '1px dashed', borderColor: muiAlpha('#4caf50', 0.2), borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle2 size={12} /> {chargesPreview.freeDelivery.reason === 'city' ? `Local delivery to ${formData.city}` : `Order above ₹${FREE_DELIVERY_THRESHOLD}`} applied!
                    </Typography>
                  </MuiBox>
                )}

                {promoDiscount > 0 && (
                  <>
                    <Divider sx={{ my: 1, borderStyle: 'solid', opacity: 0.1 }} />
                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Before Discount</Typography>
                      <Typography sx={{ fontWeight: 700 }}>₹{(chargesPreview?.total || (subtotal + 60)).toLocaleString()}</Typography>
                    </MuiBox>
                    <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="success.main" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Promo ({promoCode.toUpperCase()})
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: 'success.main' }}>- ₹{promoDiscount.toLocaleString()}</Typography>
                    </MuiBox>
                  </>
                )}
              </Stack>
              
              <Divider sx={{ mb: 4 }} />
              
              <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
                <Typography sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Total</Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#EA781E', lineHeight: 1 }}>₹{finalTotal.toLocaleString()}</Typography>
              </MuiBox>
              
              <Button fullWidth variant="contained" disabled={isProcessing || isCalculating} onClick={handlePlaceOrder} sx={{ borderRadius: '1.5rem', height: '5rem', fontSize: '1.25rem', fontWeight: 900, bgcolor: '#EA781E', '&:hover': { bgcolor: '#D66A18' }, textTransform: 'none' }}>
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : `Confirm & Pay ₹${finalTotal.toLocaleString()}`}
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
