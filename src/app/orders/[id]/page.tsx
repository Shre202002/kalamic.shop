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
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight
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
  const orderStatusRef = useRef<string>('');

  const fetchOrder = async (isSilent = false) => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data);
      orderStatusRef.current = data.orderStatus;
      if (!isSilent) setIsLoading(false);
    } catch (err) {
      console.error(err);
      if (!isSilent) router.push('/orders');
    }
  };

  const reconcilePayment = async () => {
    try {
      await fetch(`/api/orders/${params.id}/status`);
      await fetchOrder(true);
    } catch (err) {
      console.error("Reconciliation failed:", err);
    }
  };

  useEffect(() => {
    fetchOrder();
    reconcilePayment();

    const interval = setInterval(() => {
      // Don't poll if order is final
      if (['Delivered', 'Canceled'].includes(orderStatusRef.current)) {
        clearInterval(interval);
        return;
      }
      fetchOrder(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [params.id]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5EFE9' }}>
        <Navbar />
        <Box sx={{ flex: 1, display: 'flex', items: 'center', justifyContent: 'center' }}>
          <CircularProgress color="primary" />
        </Box>
        <Footer />
      </Box>
    );
  }

  const currentStep = STEPS.indexOf(order.orderStatus);
  const isCanceled = order.orderStatus === 'Canceled';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5EFE9' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
          <Box sx={{ mb: 6 }}>
            <Breadcrumbs separator={<ChevronLeft size={14} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/orders" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Back to Collection
              </MuiLink>
            </Breadcrumbs>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={2}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.03em', mb: 1 }}>Acquisition Record</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#C97A40' }}>REF: {order.orderNumber}</Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{dayjs(order.createdAt).format('MMMM DD, YYYY')}</Typography>
                </Stack>
              </Box>
              <Chip 
                label={order.orderStatus.toUpperCase()} 
                color={isCanceled ? "error" : "primary"}
                sx={{ fontWeight: 900, borderRadius: '1rem', px: 2, height: 40 }} 
              />
            </Stack>
          </Box>

          <Grid container spacing={4}>
            {/* Status & Timeline */}
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '3rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                {isCanceled ? (
                  <Alert severity="error" sx={{ borderRadius: '1.5rem', fontWeight: 700 }}>
                    This acquisition has been canceled.
                  </Alert>
                ) : (
                  <Box sx={{ width: '100%', overflowX: 'auto', py: 2 }}>
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
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>{label}</Typography>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Items List */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                <Paper sx={{ p: 4, borderRadius: '2.5rem' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Package size={20} color="#C97A40" /> Curated Items
                  </Typography>
                  <Stack spacing={3}>
                    {(order.items || []).map((item: any, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ position: 'relative', width: 80, height: 80, borderRadius: '1.5rem', overflow: 'hidden', flexShrink: 0, bgcolor: '#F5EFE9' }}>
                          <Image src={item.imageUrl || 'https://placehold.co/200x200?text=Ceramic'} alt={item.name} fill style={{ objectFit: 'cover' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#271E1B' }}>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 900 }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 4, borderRadius: '2.5rem', height: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MapPin size={20} color="#C97A40" /> Destination
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, mb: 1 }}>{order.shippingAddress?.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                        {order.shippingAddress?.addressLine1}<br />
                        {order.shippingAddress?.nearestLandmark && `Near ${order.shippingAddress.nearestLandmark}, `}
                        {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                        {order.shippingAddress?.pincode}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 2, fontWeight: 700 }}>
                        Contact: {order.shippingAddress?.phone || order.userPhone}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 4, borderRadius: '2.5rem', height: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CreditCard size={20} color="#C97A40" /> Payment
                      </Typography>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>Method</Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>{order.paymentGateway} {order.paymentMethod}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>Status</Typography>
                          <Chip label={order.paymentStatus.toUpperCase()} size="small" color={order.paymentStatus === 'paid' ? 'success' : 'warning'} sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                        </Box>
                        {order.paymentVerified && (
                          <Box sx={{ p: 2, bgcolor: alpha('#6F8A7A', 0.1), borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ShieldCheck size={16} color="#6F8A7A" />
                            <Typography variant="caption" sx={{ color: '#6F8A7A', fontWeight: 800 }}>Payment Verified Successfully</Typography>
                          </Box>
                        )}
                        {order.transactionId && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>TXN: {order.transactionId}</Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            {/* Financial Record */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 4, borderRadius: '3rem', position: 'sticky', top: 100, bgcolor: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 4 }}>Financial Record</Typography>
                <Stack spacing={2.5} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Subtotal</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{order.subtotal?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>FragileCare™ Shipping</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{order.charges?.shipping?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Handling & Packaging</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{order.charges?.handling?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Premium Insurance</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{order.charges?.premium?.toLocaleString()}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Total Value</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#C97A40' }}>₹{order.totalAmount?.toLocaleString()}</Typography>
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Box sx={{ p: 3, bgcolor: '#FAF4EB', borderRadius: '1.5rem', border: '1px solid', borderColor: alpha('#C97A40', 0.1) }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha('#C97A40', 0.1), color: '#C97A40' }}><Clock size={20} /></Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#C97A40', textTransform: 'uppercase' }}>Expected Discovery</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{dayjs(order.expectedDelivery).format('DD MMM YYYY')}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<ExternalLink size={16} />}
                    sx={{ height: 56, borderRadius: '1.25rem', fontWeight: 800, color: 'text.secondary', borderColor: 'divider' }}
                    component={Link}
                    href="/contact"
                  >
                    Support Enquiry
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
