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
  Skeleton,
  StepConnector,
  stepConnectorClasses,
  styled
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
  Sparkles,
  XCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';

const STEPS = ["Initiated", "Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered"];

const primarySaffron = '#EA781E';
const warmCream = '#FAF4EB';
const darkTerracotta = '#271E1B';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient( 95deg, ${primarySaffron} 0%, #ff9800 50%, #ffc107 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient( 95deg, ${primarySaffron} 0%, #4caf50 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: alpha(darkTerracotta, 0.1),
    borderRadius: 1,
  },
}));

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
      if (['Delivered', 'Canceled', 'Cancelled'].includes(orderStatusRef.current)) {
        clearInterval(interval);
        return;
      }
      fetchOrder(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [mounted, params?.id, user]);

  if (!mounted || isAuthLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: warmCream }}>
        <Navbar />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: primarySaffron }} />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (!user) return null;

  if (isLoadingOrder) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: warmCream }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 16 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '3rem', mb: 4 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '3rem' }} />
        </Container>
        <Footer />
      </Box>
    );
  }

  const isPaid = 
    order?.paymentVerified === true &&
    order?.paymentStatus === 'paid' &&
    order?.paymentId != null;

  const isFailed =
    order?.paymentStatus === 'failed' ||
    order?.paymentStatus === 'cancelled' ||
    order?.orderStatus === 'Cancelled' ||
    order?.orderStatus === 'Canceled';

  const isPending = !isPaid && !isFailed;

  const currentStatus = order?.orderStatus || 'Initiated';
  const currentStep = STEPS.indexOf(currentStatus);
  const isCanceled = currentStatus === 'Canceled' || currentStatus === 'Cancelled';

  const formatDate = (date: any) => {
    if (!date) return 'TBD';
    return dayjs(date).format('DD MMM YYYY');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: warmCream, overflowX: 'hidden' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 12, md: 16 }, px: { xs: 2, sm: 4 } }}>
          
          <Box sx={{ mb: { xs: 4, md: 8 } }}>
            <Breadcrumbs separator={<ChevronLeft size={12} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/orders" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Orders
              </MuiLink>
            </Breadcrumbs>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
              spacing={2}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: darkTerracotta, letterSpacing: '-0.04em', mb: 1.5, fontSize: { xs: '2rem', md: '3.5rem' }, fontFamily: 'Playfair Display' }}>
                  Acquisition Dossier
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: primarySaffron, bgcolor: alpha(primarySaffron, 0.08), px: 2, py: 0.75, borderRadius: 1.5, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    REF: {order?.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Recorded on {formatDate(order?.createdAt)}
                  </Typography>
                </Stack>
              </Box>
              {isPaid && (
                <Chip 
                  label={currentStatus.toUpperCase()} 
                  sx={{ 
                    fontWeight: 900, 
                    borderRadius: '1.25rem', 
                    px: 3, 
                    height: 48,
                    fontSize: '0.75rem',
                    letterSpacing: 1.5,
                    width: { xs: '100%', sm: 'auto' },
                    bgcolor: isCanceled ? theme.palette.error.main : primarySaffron,
                    color: 'white',
                    boxShadow: `0 12px 30px ${alpha(isCanceled ? theme.palette.error.main : primarySaffron, 0.25)}`
                  }} 
                />
              )}
            </Stack>
          </Box>

          {isFailed ? (
            <Paper sx={{ p: { xs: 6, md: 10 }, borderRadius: '4rem', textAlign: 'center', bgcolor: 'white', border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`, boxShadow: `0 20px 60px ${alpha(theme.palette.error.main, 0.05)}` }}>
              <Stack spacing={4} alignItems="center" sx={{ maxWidth: 500, mx: 'auto' }}>
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: darkTerracotta, fontFamily: 'Playfair Display' }}>Payment Failed</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.8 }}>
                    This order was not completed. No amount was charged to your account.
                  </Typography>
                </Box>
                <div className="flex gap-3 justify-center w-full">
                  <Link href="/cart" className="flex-1">
                    <Button fullWidth variant="contained" sx={{ height: 56, borderRadius: '1.25rem', fontWeight: 900, bgcolor: primarySaffron }}>
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/products" className="flex-1">
                    <Button fullWidth variant="outlined" sx={{ height: 56, borderRadius: '1.25rem', fontWeight: 900, color: primarySaffron, borderColor: primarySaffron }}>
                      Browse Products
                    </Button>
                  </Link>
                </div>
              </Stack>
            </Paper>
          ) : isPending ? (
            <Paper sx={{ p: { xs: 6, md: 10 }, borderRadius: '4rem', textAlign: 'center', bgcolor: 'white', border: `1px solid ${alpha(primarySaffron, 0.1)}`, boxShadow: `0 20px 60px ${alpha(primarySaffron, 0.05)}` }}>
              <Stack spacing={4} alignItems="center" sx={{ maxWidth: 500, mx: 'auto' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress size={100} sx={{ color: primarySaffron }} thickness={2} />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={40} color={primarySaffron} className="animate-spin" style={{ animationDuration: '3s' }} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: darkTerracotta, fontFamily: 'Playfair Display' }}>Payment Confirming</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.8 }}>
                    Your transaction is being processed. This page refreshes automatically.
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                    Contact <a href="mailto:kalamicshop@gmail.com" style={{ color: primarySaffron, fontWeight: 800 }}>kalamicshop@gmail.com</a> if not resolved in 24 hours.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ) : (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: '3rem', boxShadow: `0 15px 50px ${alpha(darkTerracotta, 0.03)}`, border: '1px solid', borderColor: alpha(primarySaffron, 0.05), bgcolor: 'white' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 5, textTransform: 'uppercase', letterSpacing: 2, color: primarySaffron, display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.8rem' }}>
                    <Truck size={22} /> Generational Logistics Path
                  </Typography>
                  <Box sx={{ width: '100%' }}>
                    <Stepper 
                      activeStep={currentStep} 
                      orientation={isMobile ? "vertical" : "horizontal"}
                      alternativeLabel={!isMobile}
                      connector={<ColorlibConnector />}
                      sx={{ 
                        '& .MuiStepLabel-label': { fontWeight: 900, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1, mt: isMobile ? 0 : 2, color: alpha(darkTerracotta, 0.4) },
                        '& .MuiStepLabel-label.Mui-active': { color: primarySaffron },
                        '& .MuiStepLabel-label.Mui-completed': { color: theme.palette.success.main },
                        '& .MuiStepIcon-root': { width: 28, height: 28 },
                        '& .MuiStepIcon-root.Mui-active': { color: primarySaffron },
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
                </Paper>
              </Grid>

              <Grid item xs={12} lg={8}>
                <Stack spacing={4}>
                  <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '3rem', bgcolor: 'white', border: `1px solid ${alpha(primarySaffron, 0.05)}` }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 5, display: 'flex', alignItems: 'center', gap: 2, color: darkTerracotta, fontFamily: 'Playfair Display' }}>
                      <Package size={24} color={primarySaffron} /> Artisan Selections
                    </Typography>
                    <Stack spacing={5}>
                      {(order?.items || []).map((item: any, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 3, md: 5 } }}>
                          <Box sx={{ position: 'relative', width: { xs: '100%', sm: 120 }, height: { xs: 240, sm: 120 }, borderRadius: '2rem', overflow: 'hidden', flexShrink: 0, bgcolor: warmCream, border: '4px solid white', boxShadow: `0 10px 30px ${alpha(darkTerracotta, 0.05)}` }}>
                            <Image src={item.imageUrl || 'https://placehold.co/200x200?text=Ceramic'} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 120px" />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: darkTerracotta, mb: 1, lineHeight: 1.2, fontFamily: 'Playfair Display' }}>{item.name}</Typography>
                            <Stack direction="row" spacing={3} alignItems="center">
                              <Typography variant="caption" sx={{ fontWeight: 900, color: primarySaffron, textTransform: 'uppercase', letterSpacing: 1.5, bgcolor: alpha(primarySaffron, 0.05), px: 1.5, py: 0.5, borderRadius: 1 }}>Qty: {item.quantity}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>₹{item.price.toLocaleString()} / unit</Typography>
                            </Stack>
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: primarySaffron, textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' } }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 5, borderRadius: '3rem', height: '100%', border: '1px solid', borderColor: alpha(primarySaffron, 0.1), bgcolor: 'white' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 2, textTransform: 'uppercase', letterSpacing: 2, color: primarySaffron, fontSize: '0.75rem' }}><MapPin size={20} /> Destination</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 900, mb: 1, fontSize: '1.1rem', color: darkTerracotta }}>{order?.shippingAddress?.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, fontWeight: 600, fontSize: '0.9rem' }}>
                          {order?.shippingAddress?.addressLine1}
                          {order?.shippingAddress?.addressLine2 && <><br />{order.shippingAddress.addressLine2}</>}
                          <br />{order?.shippingAddress?.city}, {order?.shippingAddress?.state}
                          <br /><span style={{ fontWeight: 900, color: primarySaffron, letterSpacing: 1 }}>{order?.shippingAddress?.pincode}</span>
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 5, borderRadius: '3rem', height: '100%', border: '1px solid', borderColor: alpha(primarySaffron, 0.1), bgcolor: 'white' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 2, textTransform: 'uppercase', letterSpacing: 2, color: primarySaffron, fontSize: '0.75rem' }}><CreditCard size={20} /> Integrity Ledger</Typography>
                        <Stack spacing={3}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Gateway</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: darkTerracotta, textTransform: 'uppercase' }}>{order?.paymentGateway}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Protocol</Typography>
                            <Chip label={(order?.paymentStatus || 'pending').toUpperCase()} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem', height: 24, bgcolor: order?.paymentStatus === 'paid' ? '#4caf50' : '#ff9800', color: 'white' }} />
                          </Box>
                          {order?.promoCode && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Promo Applied</Typography>
                              <Chip label={order.promoCode} variant="outlined" color="success" size="small" sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '0.65rem' }} />
                            </Box>
                          )}
                          {order?.paymentVerified && (
                            <Box sx={{ p: 2, bgcolor: alpha('#4caf50', 0.08), borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: 2, border: '1px dashed #4caf50' }}>
                              <ShieldCheck size={20} color="#4caf50" />
                              <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>Verified Transaction</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 6, borderRadius: '3rem', position: { lg: 'sticky' }, top: { lg: 120 }, bgcolor: 'white', boxShadow: `0 30px 80px ${alpha(darkTerracotta, 0.08)}`, border: `1px solid ${alpha(primarySaffron, 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 5, color: darkTerracotta, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', textAlign: 'center' }}>Acquisition Summary</Typography>
                  <Stack spacing={2.5} sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Subtotal</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: darkTerracotta }}>₹{order?.subtotal?.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Shipping</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: darkTerracotta }}>₹{order?.charges?.shipping?.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Artisan Handling</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: darkTerracotta }}>₹{order?.charges?.handling?.toLocaleString()}</Typography>
                    </Box>

                    {order?.promoCode && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>Promo Discount</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'success.main', fontWeight: 800 }}>{order.promoCode}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={800} sx={{ color: 'success.main' }}>- ₹{order.promoDiscount?.toLocaleString()}</Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2, borderStyle: 'dashed', borderColor: alpha(primarySaffron, 0.2) }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Typography variant="body1" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', color: primarySaffron, letterSpacing: 1 }}>Total Investment</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: primarySaffron, lineHeight: 1 }}>₹{order?.totalAmount?.toLocaleString()}</Typography>
                    </Box>
                  </Stack>
                  
                  <Stack spacing={2}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      startIcon={<MessageCircle size={20} />} 
                      sx={{ height: 64, borderRadius: '1.5rem', fontWeight: 900, bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' }, textTransform: 'none', fontSize: '1rem', boxShadow: '0 10px 30px rgba(37, 211, 102, 0.2)' }} 
                      component={Link} 
                      href={`https://wa.me/917376761679?text=Inquiry regarding order ${order?.orderNumber}`} 
                      target="_blank"
                    >
                      Studio WhatsApp
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      startIcon={<Sparkles size={18} />} 
                      sx={{ height: 56, borderRadius: '1.5rem', fontWeight: 900, color: primarySaffron, borderColor: primarySaffron, textTransform: 'none', '&:hover': { bgcolor: alpha(primarySaffron, 0.05) } }} 
                      component={Link} 
                      href="/products"
                    >
                      Browse More Art
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
