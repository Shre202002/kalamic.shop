'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { getProfile } from '@/lib/actions/user-actions';
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
  Skeleton,
  Chip
} from '@mui/material';
import { 
  CreditCard, 
  ShieldCheck, 
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';

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

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chargesPreview, setChargesPreview] = useState<ChargesPreview | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // Live Charge Calculation
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
      // Immediate fetch for initial mount or subtotal change
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
    async function checkVerify() {
      if (mounted && !isUserLoading && user) {
        const profile = await getProfile(user.uid);
        const isComplete = profile?.firstName && profile?.lastName && profile?.phone && profile?.address && profile?.city && profile?.state && profile?.pincode;
        
        if (!isComplete) {
          toast({
            variant: "destructive",
            title: "Collector Profile Incomplete",
            description: "Please complete your delivery details in your workspace first.",
          });
          router.push('/profile');
        }
      } else if (mounted && !isUserLoading && !user) {
        router.push('/auth/login');
      }
    }
    checkVerify();
  }, [user, isUserLoading, router, toast, mounted]);

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
        }
      } catch (err) {
        console.error("Error fetching auto-fill data:", err);
      }
    }
    loadUserData();
  }, [user, mounted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length) return;
    
    if (!formData.fullName || !formData.address || !formData.city || !formData.state || !formData.zip || !formData.phone) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "All shipping details are required." });
      return;
    }

    if (isCalculating || !chargesPreview) {
      toast({ title: "Please wait", description: "Calculating the final logistics ledger..." });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          items: cartItems.map(i => ({ productId: i.productVariantId, quantity: i.quantity })),
          shippingDetails: formData,
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      if (result.isMock) {
        toast({ title: "Mock Mode", description: "Simulating success..." });
        setTimeout(() => router.push(`/orders/${result.orderId}`), 2000);
        return;
      }

      if (!cashfreeLoaded) {
        throw new Error("Payment SDK failed to load.");
      }

      const cashfree = new window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
      });

      cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self" 
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error.message || "Error starting payment.",
      });
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  if (isUserLoading || isCartLoading) {
    return (
      <MuiBox sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAF4EB' }}>
        <CircularProgress sx={{ color: '#EA781E' }} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 2 }}>Securing your session...</Typography>
      </MuiBox>
    );
  }

  return (
    <MuiBox sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FAF4EB' }}>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" onLoad={() => setCashfreeLoaded(true)} />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <MuiBox sx={{ mb: 6 }}>
          <Breadcrumbs separator={<ChevronLeft size={14} />} sx={{ mb: 2 }}>
            <MuiLink component={Link} href="/cart" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Back to Bag
            </MuiLink>
          </Breadcrumbs>
          <MuiBox sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
            <MuiBox>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.03em', mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>Checkout</Typography>
              <Typography color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '1rem' } }}>Confirm your artisan acquisitions.</Typography>
            </MuiBox>
            <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', px: 3, py: 1.5, borderRadius: '1rem', border: '1px solid', borderColor: muiAlpha('#EA781E', 0.1) }}>
              <ShieldCheck size={18} color="#EA781E" />
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#EA781E', fontSize: '0.65rem' }}>Secure Checkout</Typography>
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
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Shipping Destination</Typography>
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
                    <TextField fullWidth label="Nearest Landmark" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="e.g. Near City Temple" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="ZIP / Pincode" name="zip" value={formData.zip} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }} />
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
                    <FormControlLabel value="card" control={<Radio sx={{ color: '#EA781E', '&.Mui-checked': { color: '#EA781E' } }} />} label={
                      <MuiBox sx={{ ml: 1 }}>
                        <Typography sx={{ fontWeight: 800 }}>Cashfree Secure Gateway</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>UPI, Cards, Net Banking</Typography>
                      </MuiBox>
                    } sx={{ width: '100%', m: 0 }} />
                  </Paper>
                </RadioGroup>

                <MuiBox sx={{ mt: 3, p: 3, bgcolor: '#FAF4EB', borderRadius: '1.25rem', display: 'flex', gap: 2 }}>
                  <AlertTriangle size={20} color="#EA781E" style={{ flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                    You will be redirected to our secure payment partner to complete the transaction.
                  </Typography>
                </MuiBox>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper elevation={10} sx={{ borderRadius: '3rem', p: { xs: 4, md: 6 }, position: 'sticky', top: '100px', bgcolor: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#271E1B' }}>Acquisition Summary</Typography>
              
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

              <Stack spacing={2} sx={{ mb: 4 }}>
                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Subtotal</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{subtotal.toLocaleString()}</Typography>
                </MuiBox>
                
                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>FragileCare™ Shipping</Typography>
                  {isCalculating ? (
                    <Skeleton width={40} height={20} />
                  ) : (
                    <Typography sx={{ fontWeight: 700, color: chargesPreview?.charges.shipping === 0 ? '#6F8A7A' : 'inherit' }}>
                      {chargesPreview?.charges.shipping === 0 ? 'FREE' : `₹${chargesPreview?.charges.shipping || 150}`}
                    </Typography>
                  )}
                </MuiBox>

                {chargesPreview?.freeDelivery.isFree && !isCalculating && (
                  <Chip 
                    icon={<CheckCircle2 size={12} />} 
                    label={chargesPreview.freeDelivery.reason === 'city' ? `Free local delivery to ${formData.city}` : "Free delivery on orders above ₹999"} 
                    size="small" 
                    sx={{ bgcolor: muiAlpha('#6F8A7A', 0.1), color: '#6F8A7A', fontWeight: 800, fontSize: '0.6rem', border: 'none', height: 24 }} 
                  />
                )}

                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Artisan Handling</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{chargesPreview?.charges.handling || 80}</Typography>
                </MuiBox>

                <MuiBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Premium Protection</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{chargesPreview?.charges.premium || 50}</Typography>
                </MuiBox>
              </Stack>

              <Divider sx={{ mb: 4 }} />

              <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
                <Typography sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Total</Typography>
                {isCalculating ? (
                  <Skeleton width={100} height={40} />
                ) : (
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#EA781E', lineHeight: 1 }}>
                    ₹{chargesPreview?.total.toLocaleString() || (subtotal + 280).toLocaleString()}
                  </Typography>
                )}
              </MuiBox>

              <Button
                fullWidth
                variant="contained"
                disabled={isProcessing || isCalculating}
                onClick={handlePlaceOrder}
                sx={{ borderRadius: '1.5rem', height: '5rem', fontSize: '1.25rem', fontWeight: 900, bgcolor: '#EA781E', '&:hover': { bgcolor: '#D66A18' }, textTransform: 'none' }}
              >
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : `Confirm & Pay ₹${(chargesPreview?.total || subtotal + 280).toLocaleString()}`}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MuiBox>
  );
}
