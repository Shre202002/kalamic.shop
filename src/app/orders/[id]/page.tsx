'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
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
  Avatar,
  Alert,
  alpha
} from '@mui/material';
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  MessageCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';

const STEPS = ["Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      if (!isSilent) setIsLoading(false);
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
    if (!mounted || !params?.id) return;

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
  }, [mounted, params?.id]);

  if (!mounted) return null;

  if (isLoading || !params?.id) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5EFE9' }}>
        <Navbar />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress color="primary" />
        </Box>
        <Footer />
      </Box>
    );
  }

  const currentStatus = order?.orderStatus || 'Placed';
  const currentStep = STEPS.indexOf(currentStatus);
  const isCanceled = currentStatus === 'Canceled';

  const formatDate = (date: any) => {
    if (!date) return 'TBD';
    return dayjs(date).format('DD MMM YYYY');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5EFE9' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 8 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Breadcrumbs separator={<ChevronLeft size={12} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/orders" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Orders
              </MuiLink>
            </Breadcrumbs>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
              spacing={3}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.03em', mb: 1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                  Order Details
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#C97A40', fontSize: '0.75rem' }}>
                    #{order?.orderNumber}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', display: { xs: 'none', sm: 'block' } }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {formatDate(order?.createdAt)}
                  </Typography>
                </Stack>
              </Box>
              <Chip 
                label={currentStatus.toUpperCase()} 
                color={isCanceled ? "error" : "primary"}
                sx={{ 
                  fontWeight: 900, 
                  borderRadius: '0.75rem', 
                  px: 1.5, 
                  height: 36,
                  fontSize: '0.7rem',
                  width: { xs: '100%', sm: 'auto' }
                }} 
              />
            </Stack>
          </Box>

          <Grid container spacing={3}>
            {/* Status Timeline */}
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 2, md: 5 }, borderRadius: { xs: '1.5rem', md: '3rem' }, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                {isCanceled ? (
                  <Alert severity="error" sx={{ borderRadius: '1rem', fontWeight: 700, fontSize: '0.875rem' }}>
                    This acquisition has been canceled.
                  </Alert>
                ) : (
                  <Box sx={{ width: '100%', overflowX: 'auto', pb: 1 }}>
                    <Box sx={{ minWidth: { xs: '600px', md: '100%' } }}>
                      <Stepper activeStep={currentStep} alternativeLabel>
                        {STEPS.map((label) => (
                          <Step key={label}>
                            <StepLabel
                              StepIconProps={{
                                sx: {
                                  '&.Mui-active': { color: '#C97A40' },
                                  '&.Mui-completed': { color: '#6F8A7A' },
                                }
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.55rem', letterSpacing: 0.5 }}>
                                {label}
                              </Typography>
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Main Content Area */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                {/* Items List */}
                <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: { xs: '1.5rem', md: '2.5rem' } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#271E1B' }}>
                    <Package size={18} color="#C97A40" /> Artisan Pieces
                  </Typography>
                  <Stack spacing={2.5}>
                    {(order?.items || []).map((item: any, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
                        <Box sx={{ position: 'relative', width: { xs: 64, md: 80 }, height: { xs: 64, md: 80 }, borderRadius: '1rem', overflow: 'hidden', flexShrink: 0, bgcolor: '#F5EFE9', border: '1px solid', borderColor: alpha('#000', 0.05) }}>
                          <Image 
                            src={item.imageUrl || 'https://placehold.co/200x200?text=Ceramic'} 
                            alt={item.name} 
                            fill 
                            style={{ objectFit: 'cover' }} 
                            sizes="(max-width: 768px) 64px, 80px"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#271E1B', mb: 0.5, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                            {item.quantity} × ₹{item.price.toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#271E1B', textAlign: 'right' }}>
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>

                {/* Logistics & Payment Info */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: { xs: '1.5rem', md: '2.5rem' }, height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, color: '#271E1B' }}>
                        <MapPin size={18} color="#C97A40" /> Destination
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>{order?.shippingAddress?.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, fontWeight: 500, display: 'block', fontSize: '0.8rem' }}>
                        {order?.shippingAddress?.addressLine1}
                        {order?.shippingAddress?.addressLine2 && <><br />{order.shippingAddress.addressLine2}</>}
                        {order?.shippingAddress?.nearestLandmark && <><br /><span style={{ color: '#C97A40', fontWeight: 700 }}>Near {order.shippingAddress.nearestLandmark}</span></>}
                        <br />{order?.shippingAddress?.city}, {order?.shippingAddress?.state}
                        <br />{order?.shippingAddress?.pincode}
                      </Typography>
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          Contact: {order?.shippingAddress?.phone || order?.userPhone}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: { xs: '1.5rem', md: '2.5rem' }, height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, color: '#271E1B' }}>
                        <CreditCard size={18} color="#C97A40" /> Payment
                      </Typography>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Method</Typography>
                          <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                            {order?.paymentGateway} {order?.paymentMethod}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Verification</Typography>
                          <Chip 
                            label={(order?.paymentStatus || 'pending').toUpperCase()} 
                            size="small" 
                            color={order?.paymentStatus === 'paid' ? 'success' : 'warning'} 
                            sx={{ fontWeight: 900, fontSize: '0.55rem', height: 20, borderRadius: '4px' }} 
                          />
                        </Box>
                        
                        {order?.paymentVerified && (
                          <Box sx={{ p: 1.5, bgcolor: alpha('#6F8A7A', 0.08), borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShieldCheck size={14} color="#6F8A7A" />
                            <Typography variant="caption" sx={{ color: '#6F8A7A', fontWeight: 800, fontSize: '0.65rem' }}>
                              Securely Verified
                            </Typography>
                          </Box>
                        )}
                        
                        {order?.transactionId && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
                              Transaction Reference
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: alpha('#000', 0.03), px: 1, py: 0.5, borderRadius: '4px', display: 'inline-block', fontSize: '0.65rem' }}>
                              {order.transactionId}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            {/* Summary Sidebar */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: { xs: '1.5rem', md: '3rem' }, position: { lg: 'sticky' }, top: { lg: 100 }, bgcolor: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 3, color: '#271E1B' }}>Financial Record</Typography>
                
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Subtotal</Typography>
                    <Typography variant="caption" fontWeight={700}>₹{order?.subtotal?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>FragileCare™ Shipping</Typography>
                    <Typography variant="caption" fontWeight={700}>₹{order?.charges?.shipping?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Studio Handling</Typography>
                    <Typography variant="caption" fontWeight={700}>₹{order?.charges?.handling?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Premium Protection</Typography>
                    <Typography variant="caption" fontWeight={700}>₹{order?.charges?.premium?.toLocaleString()}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography variant="body1" sx={{ fontWeight: 900 }}>Total Value</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#C97A40' }}>₹{order?.totalAmount?.toLocaleString()}</Typography>
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Box sx={{ p: 2.5, bgcolor: '#FAF4EB', borderRadius: '1.25rem', border: '1px solid', borderColor: alpha('#C97A40', 0.1) }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha('#C97A40', 0.1), color: '#C97A40', width: 36, height: 36 }}><Clock size={18} /></Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#C97A40', textTransform: 'uppercase', fontSize: '0.6rem', display: 'block' }}>
                          Target Discovery
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                          {formatDate(order?.expectedDelivery)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<MessageCircle size={18} />}
                    sx={{ 
                      height: 52, 
                      borderRadius: '1.25rem', 
                      fontWeight: 900, 
                      fontSize: '0.85rem', 
                      bgcolor: '#25D366',
                      '&:hover': { bgcolor: '#128C7E' },
                      textTransform: 'none',
                      boxShadow: '0 8px 20px rgba(37, 211, 102, 0.2)'
                    }}
                    component={Link}
                    href={`https://wa.me/916387562920?text=Hi, I need assistance with my Kalamic Order: ${order?.orderNumber}`}
                    target="_blank"
                  >
                    Logistics Support
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </main>
      <Footer />
    </Box>
  );
}