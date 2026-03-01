'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getProfile } from '@/lib/actions/user-actions';
import { createCashfreeOrder, verifyCashfreePayment } from '@/lib/actions/cashfree';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Divider, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
  alpha,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { 
  CreditCard, 
  ShieldCheck, 
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ShoppingBag
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

export default function CheckoutPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    paymentMethod: 'card'
  });

  useEffect(() => {
    async function checkVerify() {
      if (!isUserLoading && user) {
        const profile = await getProfile(user.uid);
        const isComplete = profile?.firstName && profile?.lastName && profile?.phone && profile?.address && profile?.city && profile?.pincode;
        
        if (!isComplete) {
          toast({
            variant: "destructive",
            title: "Collector Profile Incomplete",
            description: "Please complete your delivery details in your workspace first.",
          });
          router.push('/profile');
        }
      } else if (!isUserLoading && !user) {
        router.push('/auth/login');
      }
    }
    checkVerify();
  }, [user, isUserLoading, router, toast]);

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection(cartQuery);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      try {
        const profile = await getProfile(user.uid);
        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: `${profile.firstName} ${profile.lastName}`.trim(),
            email: user.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            landmark: profile.landmark || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.pincode || '',
          }));
        }
      } catch (err) {
        console.error("Error fetching auto-fill data:", err);
      }
    }
    loadUserData();
  }, [user]);

  const subtotal = cartItems?.reduce((acc, item) => acc + (item.priceAtAddToCart * item.quantity), 0) || 0;
  const shipping = cartItems && cartItems.length > 0 ? 150 : 0;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const finalizeOrder = async (orderId: string, paymentId: string) => {
    if (!user || !firestore || !cartItems) return;
    
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);
    await updateDoc(orderRef, {
      orderStatus: 'placed',
      paymentId: paymentId,
      updatedAt: serverTimestamp()
    });

    const clearPromises = cartItems.map(item => 
      deleteDoc(doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', item.id))
    );
    await Promise.all(clearPromises);

    toast({ title: "Acquisition Successful!", description: `Order ID: ${orderId} has been confirmed.` });
    router.push(`/orders/${orderId}`);
  };

  const handlePlaceOrder = async () => {
    if (!user || !cartItems?.length || !firestore) return;
    
    if (!formData.fullName || !formData.address || !formData.city || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Incomplete Details",
        description: "Please ensure all shipping fields are completed for a safe delivery.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = `KAL-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);

      await setDoc(orderRef, {
        id: orderId,
        userId: user.uid,
        orderDate: new Date().toISOString(),
        totalAmount: total,
        orderStatus: 'pending_payment',
        shippingCost: shipping,
        discountAmount: 0,
        shippingDetails: { ...formData },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const itemPromises = cartItems.map(async (item) => {
        const orderItemRef = doc(firestore, 'users', user.uid, 'orders', orderId, 'items', item.id);
        return setDoc(orderItemRef, {
          id: item.id,
          orderId: orderId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtAddToCart,
          name: item.name,
          imageUrl: item.imageUrl
        });
      });
      await Promise.all(itemPromises);

      const result = await createCashfreeOrder({
        orderId,
        orderAmount: total,
        orderCurrency: 'INR',
        customerDetails: {
          customerId: user.uid,
          customerPhone: formData.phone.replace(/\D/g, '').slice(-10),
          customerEmail: user.email || 'collector@kalamic.shop',
          customerName: formData.fullName,
        }
      });

      if (result.isMock) {
        toast({ title: "Mock Mode Active", description: "Simulating successful artisan transaction..." });
        setTimeout(async () => {
          const verification = await verifyCashfreePayment(orderId);
          if (verification.success) await finalizeOrder(orderId, verification.paymentId);
        }, 2000);
        return;
      }

      if (!cashfreeLoaded) {
        toast({ variant: "destructive", title: "System Error", description: "Payment SDK failed to load." });
        setIsProcessing(false);
        return;
      }

      const cashfree = new window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
      });

      cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self" 
      }).then(async (sdkResult: any) => {
        if (sdkResult.error) {
          toast({ variant: "destructive", title: "Payment Failed", description: sdkResult.error.message });
          setIsProcessing(false);
          return;
        }
        if (sdkResult.paymentDetails) {
          setIsProcessing(true);
          const verification = await verifyCashfreePayment(orderId);
          if (verification.success) {
            await finalizeOrder(orderId, verification.paymentId);
          } else {
            router.push('/orders');
          }
        }
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Secure Checkout Failed",
        description: error.message || "Error connecting to our payment partner.",
      });
      setIsProcessing(false);
    }
  };

  if (isUserLoading || isCartLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAF4EB' }}>
        <CircularProgress sx={{ color: '#EA781E' }} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>Securing your session...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FAF4EB' }}>
      <Navbar />
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" onLoad={() => setCashfreeLoaded(true)} />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Box sx={{ mb: 6 }}>
          <Breadcrumbs separator={<ChevronLeft size={14} />} sx={{ mb: 2 }}>
            <MuiLink component={Link} href="/cart" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
              Back to Bag
            </MuiLink>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.02em', mb: 1 }}>Checkout</Typography>
              <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Confirm your selection and shipping destination.</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', px: 3, py: 1.5, borderRadius: '1rem', border: '1px solid', borderColor: alpha('#EA781E', 0.1), boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <ShieldCheck size={18} color="#EA781E" />
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#EA781E' }}>Secure Cashfree® Integration</Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} lg={7}>
            <Stack spacing={4}>
              {/* Shipping Section */}
              <Paper elevation={0} sx={{ borderRadius: '2.5rem', p: { xs: 4, md: 6 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: alpha('#EA781E', 0.1), color: '#EA781E', width: 48, height: 48, borderRadius: '1rem' }}>
                    <MapPin size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Shipping Credentials</Typography>
                    <Typography variant="body2" color="text.secondary">Verified delivery details for your artisan pieces.</Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      variant="outlined"
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ZIP / Pincode"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      name="phone"
                      placeholder="+91XXXXXXXXXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem' } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Section */}
              <Paper elevation={0} sx={{ borderRadius: '2.5rem', p: { xs: 4, md: 6 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: alpha('#EA781E', 0.1), color: '#EA781E', width: 48, height: 48, borderRadius: '1rem' }}>
                    <CreditCard size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Payment Architecture</Typography>
                    <Typography variant="body2" color="text.secondary">Choose your method of acquisition.</Typography>
                  </Box>
                </Box>

                <RadioGroup defaultValue="card" onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      borderRadius: '1.5rem', 
                      mb: 3, 
                      cursor: 'pointer',
                      borderColor: formData.paymentMethod === 'card' ? '#EA781E' : 'divider',
                      bgcolor: formData.paymentMethod === 'card' ? alpha('#EA781E', 0.03) : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FormControlLabel 
                      value="card" 
                      control={<Radio sx={{ color: '#EA781E', '&.Mui-checked': { color: '#EA781E' } }} />} 
                      label={
                        <Box sx={{ ml: 1 }}>
                          <Typography sx={{ fontWeight: 800 }}>Secure Online</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Cards, UPI, Banking</Typography>
                        </Box>
                      } 
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Paper>
                </RadioGroup>

                <Box sx={{ p: 3, bgcolor: '#FAF4EB', borderRadius: '1.25rem', border: '1px dashed', borderColor: alpha('#EA781E', 0.3), display: 'flex', gap: 2 }}>
                  <AlertTriangle size={20} color="#EA781E" style={{ flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Note: You will be redirected to a secure Cashfree environment to complete your transaction.
                  </Typography>
                </Box>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper elevation={10} sx={{ borderRadius: '3rem', p: { xs: 4, md: 6 }, position: 'sticky', top: '100px', bgcolor: 'white', border: 'none', overflow: 'hidden' }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#271E1B' }}>Acquisition Summary</Typography>
              
              <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 2, mb: 4, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#EA781E', 0.2), borderRadius: '10px' } }}>
                <Stack spacing={3}>
                  {cartItems?.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ position: 'relative', width: 64, height: 64, borderRadius: '1rem', overflow: 'hidden', bgcolor: 'muted.main', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}>
                        <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="64px" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 800, color: '#271E1B' }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Qty: {item.quantity}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 900 }}>₹{(item.priceAtAddToCart * item.quantity).toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ mb: 4, borderStyle: 'dashed' }} />

              <Stack spacing={2} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Subtotal</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹{subtotal.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>FragileCare™ Shipping</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#EA781E' }}>₹{shipping.toLocaleString()}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 4 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
                <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Total</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#EA781E', lineHeight: 1 }}>₹{total.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Inclusive of taxes</Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                size="large"
                variant="contained"
                disabled={isProcessing}
                onClick={handlePlaceOrder}
                sx={{ 
                  borderRadius: '2rem', 
                  height: '5rem', 
                  fontSize: '1.5rem', 
                  fontWeight: 900, 
                  bgcolor: '#EA781E',
                  boxShadow: `0 12px 32px ${alpha('#EA781E', 0.3)}`,
                  '&:hover': { bgcolor: '#D66A18' },
                  textTransform: 'none'
                }}
              >
                {isProcessing ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={24} color="inherit" />
                    <span>Securing...</span>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CheckCircle2 size={28} />
                    <span>Pay ₹{total.toLocaleString()}</span>
                  </Stack>
                )}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}
