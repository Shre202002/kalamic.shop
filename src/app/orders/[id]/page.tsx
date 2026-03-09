'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Chip, 
  Button, 
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  alpha,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  MessageCircle,
  Clock,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';

const STEPS = ["Initiated", "Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered"];

export default function OrderDetailPage() {
  const { user, loading: isAuthLoading } = useProtectedRoute();
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { toast } = useToast();
  
  const [order, setOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [mounted, setMounted] = useState(false);
  const orderStatusRef = useRef<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrder = async (isSilent = false) => {
    if (!params?.id) return;
    
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Acquisition record not found");
      }
      const data = await res.json();
      setOrder(data);
      orderStatusRef.current = data.orderStatus;
      if (!isSilent) setIsLoadingOrder(false);
    } catch (err: any) {
      console.error("[FETCH_ORDER_ERROR]:", err.message);
      if (!isSilent) {
        toast({ variant: "destructive", title: "Sync Failed", description: err.message });
        router.push('/orders');
      }
    }
  };

  const reconcilePayment = async () => {
    if (!params?.id) return;
    try {
      await fetch(`/api/orders/${params.id}/status`);
      await fetchOrder(true);
    } catch (err) {
      console.error("[RECONCILIATION_ERROR]:", err);
    }
  };

  useEffect(() => {
    if (!mounted || !params?.id || !user) return;

    fetchOrder();
    reconcilePayment();

    const interval = setInterval(() => {
      if (['Delivered', 'Canceled'].includes(orderStatusRef.current)) {
        clearInterval(interval);
        return;
      }
      fetchOrder(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [mounted, params?.id, user]);

  if (!mounted || isAuthLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
        <Navbar />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress color="primary" />
        </Box>
        <Footer />
      </Box>
    );
  }

  // Final guard: if no user (and middleware hasn't redirected yet), render nothing
  if (!user) return null;

  if (isLoadingOrder) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '2rem', mb: 4 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '2rem' }} />
        </Container>
        <Footer />
      </Box>
    );
  }

  const currentStatus = order?.orderStatus || 'Initiated';
  const currentStep = STEPS.indexOf(currentStatus);
  const isCanceled = currentStatus === 'Canceled';
  const isPaymentPending = order?.isPaymentPending ?? false;

  const formatDate = (date: any) => {
    if (!date) return 'TBD';
    return dayjs(date).format('DD MMM YYYY');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 10 }, px: { xs: 2, sm: 4 } }}>
          
          <Box sx={{ mb: { xs: 4, md: 8 } }}>
            <Breadcrumbs separator={<ChevronLeft size={12} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/orders" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Orders History
              </MuiLink>
            </Breadcrumbs>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
              spacing={2}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: theme.palette.text.primary, letterSpacing: '-0.04em', mb: 1.5, fontSize: { xs: '1.75rem', md: '3rem' } }}>
                  Order Dossier
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.08), px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.75rem' }}>
                    REF: {order?.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Recorded on {formatDate(order?.createdAt)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mt: 2 }}>
                  {order?.userEmail && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Mail size={14} color={theme.palette.text.secondary} />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {order.userEmail}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Phone size={14} color={theme.palette.text.secondary} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {order?.userPhone}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              {!isPaymentPending && (
                <Chip 
                  label={currentStatus.toUpperCase()} 
                  color={isCanceled ? "error" : "primary"}
                  sx={{ 
                    fontWeight: 900, 
                    borderRadius: '1rem', 
                    px: 2, 
                    height: 40,
                    fontSize: '0.7rem',
                    letterSpacing: 1,
                    width: { xs: '100%', sm: 'auto' },
                    boxShadow: `0 8px 20px ${alpha(isCanceled ? theme.palette.error.main : theme.palette.primary.main, 0.15)}`
                  }} 
                />
              )}
            </Stack>
          </Box>

          {isPaymentPending ? (
            <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: '2.5rem', textAlign: 'center', bgcolor: 'white', border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
              <Stack spacing={4} alignItems="center">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress size={80} sx={{ color: theme.palette.primary.main }} thickness={2} />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                    <Clock size={32} color={theme.palette.primary.main} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: theme.palette.text.primary }}>Payment Verification In Progress</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
                    Your payment is being reconciled with our payment gateway. This page will automatically refresh every 20 seconds. Please do not close this tab.
                  </Typography>
                </Box>
                <Alert severity="warning" sx={{ borderRadius: '1.5rem', width: '100%', maxWidth: 600, textAlign: 'left', fontWeight: 600 }}>
                  <AlertTitle sx={{ fontWeight: 800 }}>Integrity Check</AlertTitle>
                  Order details will be unlocked once the gateway confirms the financial transfer.
                </Alert>
              </Stack>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.3) }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 3, textTransform: 'uppercase', letterSpacing: 1.5, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Truck size={20} color={theme.palette.primary.main} /> Logistics Journey
                  </Typography>
                  {isCanceled ? (
                    <Alert severity="error" variant="outlined" sx={{ borderRadius: '1.5rem', fontWeight: 700, p: 2 }}>
                      The journey of this handcrafted acquisition has been halted.
                    </Alert>
                  ) : (
                    <Box sx={{ width: '100%' }}>
                      <Stepper 
                        activeStep={currentStep} 
                        orientation={isMobile ? "vertical" : "horizontal"}
                        alternativeLabel={!isMobile}
                        sx={{ 
                          '& .MuiStepLabel-label': { fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5, mt: isMobile ? 0 : 1 },
                          '& .MuiStepIcon-root': { width: 24, height: 24 },
                          '& .MuiStepIcon-root.Mui-active': { color: theme.palette.primary.main },
                          '& .MuiStepIcon-root.Mui-completed': { color: theme.palette.success.main },
                        }}
                      >
                        {STEPS.map((label) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} lg={8}>
                <Stack spacing={3}>
                  <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: '2rem', overflow: 'hidden' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: theme.palette.text.primary }}>
                      <Package size={22} color={theme.palette.primary.main} /> Curated Selections
                    </Typography>
                    <Stack spacing={4}>
                      {(order?.items || []).map((item: any, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, md: 4 } }}>
                          <Box sx={{ position: 'relative', width: { xs: '100%', sm: 100 }, height: { xs: 200, sm: 100 }, borderRadius: '1.5rem', overflow: 'hidden', flexShrink: 0, bgcolor: theme.palette.background.default, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }}>
                            <Image src={item.imageUrl || 'https://placehold.co/200x200?text=Ceramic'} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 100px" />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: theme.palette.text.primary, mb: 0.5, lineHeight: 1.3 }}>{item.name}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Quantity: {item.quantity}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, mt: 0.5 }}>₹{item.price.toLocaleString()} per piece</Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.text.primary, textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' } }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: '2rem', height: '100%', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.2) }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary', fontSize: '0.75rem' }}><MapPin size={18} color={theme.palette.primary.main} /> Destination</Typography>
                        
                        <Typography variant="body1" sx={{ fontWeight: 900, mb: 0.5, fontSize: '1rem' }}>{order?.shippingAddress?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1.5 }}>
                          📞 {order?.shippingAddress?.phone}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontWeight: 500, fontSize: '0.85rem' }}>
                          {order?.shippingAddress?.addressLine1}
                          {order?.shippingAddress?.addressLine2 && <><br />{order.shippingAddress.addressLine2}</>}
                          <br />{order?.shippingAddress?.city}, {order?.shippingAddress?.state}
                          <br /><span style={{ fontWeight: 800, color: theme.palette.text.primary }}>{order?.shippingAddress?.pincode}</span>
                        </Typography>

                        {order?.shippingAddress?.nearestLandmark && (
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mt: 1.5, 
                            color: theme.palette.primary.main,
                            fontWeight: 700 
                          }}>
                            📍 Near: {order.shippingAddress.nearestLandmark}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: '2rem', height: '100%', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.2) }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary', fontSize: '0.75rem' }}><CreditCard size={18} color={theme.palette.primary.main} /> Integrity</Typography>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Protocol</Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{order?.paymentGateway} / {order?.paymentMethod}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Verification</Typography>
                            <Chip label={(order?.paymentStatus || 'pending').toUpperCase()} size="small" color={order?.paymentStatus === 'paid' ? 'success' : 'warning'} sx={{ fontWeight: 900, fontSize: '0.55rem', height: 22, borderRadius: '4px' }} />
                          </Box>
                          {order?.paymentVerified && (
                            <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <ShieldCheck size={16} color={theme.palette.success.main} />
                              <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Transaction Reconciled</Typography>
                            </Box>
                          )}

                          {order?.transactionId && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Transaction ID</Typography>
                              <Typography variant="caption" fontWeight={800} sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: theme.palette.primary.main }}>{order.transactionId}</Typography>
                            </Box>
                          )}

                          {order?.gatewayOrderId && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Gateway Ref</Typography>
                              <Typography variant="caption" fontWeight={800} sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{order.gatewayOrderId}</Typography>
                            </Box>
                          )}

                          {order?.paymentTimestamp && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Paid At</Typography>
                              <Typography variant="caption" fontWeight={800} fontSize="0.75rem">{dayjs(order.paymentTimestamp).format('DD MMM YYYY, hh:mm A')}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: '2.5rem', position: { lg: 'sticky' }, top: { lg: 120 }, bgcolor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, color: theme.palette.text.primary, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.9rem' }}>Financial Ledger</Typography>
                  
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Subtotal</Typography>
                      <Typography variant="body2" fontWeight={800}>₹{order?.subtotal?.toLocaleString()}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Shipping</Typography>
                      <Typography variant="body2" fontWeight={800}>₹{order?.charges?.shipping?.toLocaleString()}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Handling</Typography>
                      <Typography variant="body2" fontWeight={800}>₹{order?.charges?.handling?.toLocaleString()}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Premium</Typography>
                      <Typography variant="body2" fontWeight={800}>₹{order?.charges?.premium?.toLocaleString()}</Typography>
                    </Box>

                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Typography variant="body1" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem' }}>Total</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>₹{order?.totalAmount?.toLocaleString()}</Typography>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '1rem', 
                      bgcolor: alpha(theme.palette.success.main, 0.06),
                      border: '1px dashed',
                      borderColor: alpha(theme.palette.success.main, 0.2)
                    }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', display: 'block', mb: 0.5 }}>Expected Delivery</Typography>
                      <Typography variant="body1" fontWeight={900} color={theme.palette.success.main}>{formatDate(order?.expectedDelivery)}</Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={2.5}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      startIcon={<MessageCircle size={20} />} 
                      sx={{ 
                        height: 56, 
                        borderRadius: '1.25rem', 
                        fontWeight: 900, 
                        bgcolor: '#25D366', 
                        '&:hover': { bgcolor: '#128C7E', transform: 'translateY(-2px)' }, 
                        textTransform: 'none',
                        boxShadow: '0 8px 20px rgba(37, 211, 102, 0.25)'
                      }} 
                      component={Link} 
                      href={`https://wa.me/916387562920?text=Order ID: ${order?.orderNumber}`} 
                      target="_blank"
                    >
                      Contact Support
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Container>
      </main>
      <Footer />
    </Box>
  );
}
