'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress,
  Button,
  Avatar,
  Stack,
  Alert,
  AlertTitle,
  alpha
} from '@mui/material';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ShoppingBag, 
  Truck, 
  Clock, 
  MapPin, 
  CreditCard,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';

const STEPS = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
const STEP_MAP: Record<string, number> = {
  'pending': 0,
  'confirmed': 0,
  'processing': 1,
  'shipped': 2,
  'out_for_delivery': 2,
  'delivered': 3,
};

export default function OrderDetailPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  const fetchOrder = useCallback(async () => {
    try {
      // 1. Reconcile payment status first
      await fetch(`/api/orders/${orderId}/status`);
      
      // 2. Fetch full details from DB
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      setOrder(data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isUserLoading && user) {
      fetchOrder();
      
      // Polling for updates every 20 seconds if order is not delivered or cancelled
      const interval = setInterval(() => {
        if (order && !['delivered', 'cancelled'].includes(order.status)) {
          fetchOrder();
        }
      }, 20000);
      
      return () => clearInterval(interval);
    }
  }, [user, isUserLoading, fetchOrder, order?.status]);

  if (isUserLoading || isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAF4EB' }}>
        <CircularProgress sx={{ color: '#EA781E' }} />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <AlertCircle size={64} color="#EA781E" style={{ marginBottom: 24 }} />
        <Typography variant="h4" gutterBottom>Acquisition Not Found</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>We couldn't retrieve the details for order {orderId}.</Typography>
        <Button component={Link} href="/orders" variant="contained" sx={{ bgcolor: '#EA781E' }}>Return to History</Button>
      </Container>
    );
  }

  const currentStep = STEP_MAP[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF4EB', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button component={Link} href="/orders" startIcon={<ChevronLeft size={18} />} sx={{ color: 'text.secondary', fontWeight: 800 }}>
            Back to Orders
          </Button>
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            ID: {order.order_number}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={4}>
              {/* Progress Card */}
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Acquisition Journey</Typography>
                  <Typography variant="body2" color="text.secondary">Estimated Delivery: {dayjs(order.expected_delivery).format('DD MMM YYYY')}</Typography>
                </Box>

                {isCancelled ? (
                  <Alert severity="error" sx={{ borderRadius: '1rem' }}>
                    <AlertTitle sx={{ fontWeight: 800 }}>Acquisition Cancelled</AlertTitle>
                    This order was cancelled and is no longer being processed.
                  </Alert>
                ) : (
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {STEPS.map((label) => (
                      <Step key={label}>
                        <StepLabel StepIconProps={{ sx: { color: currentStep >= STEPS.indexOf(label) ? '#EA781E' : 'inherit' } }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>{label}</Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}
              </Paper>

              {/* Items Card */}
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 4 }}>Curation Breakdown</Typography>
                <Stack spacing={3}>
                  {order.items.map((item: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 64, height: 64, borderRadius: '1rem', border: '1px solid', borderColor: 'divider' }}>
                        <ShoppingBag size={24} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Qty: {item.quantity}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 900 }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Stack spacing={4}>
              {/* Payment Summary */}
              <Paper sx={{ p: 4, borderRadius: '2.5rem', bgcolor: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Financial Record</Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase' }}>Payment Status</Typography>
                    <Chip 
                      label={order.payment_status.toUpperCase()} 
                      size="small"
                      color={order.payment_status === 'paid' ? 'success' : order.payment_status === 'failed' ? 'error' : 'warning'}
                      sx={{ fontWeight: 900, fontSize: '0.6rem', borderRadius: '6px' }}
                    />
                  </Box>
                  {order.payment_verified ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CheckCircle2 size={14} color="#2e7d32" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>Directly Verified with Gateway</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Reconciling with secure server...</Typography>
                  )}
                </Box>

                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Net Acquisition</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(order.total_amount - 150).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">FragileCare™ Shipping</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹150</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem' }}>Grand Total</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#EA781E', lineHeight: 1 }}>₹{order.total_amount.toLocaleString()}</Typography>
                  </Box>
                </Stack>

                {order.transaction_id && (
                  <Box sx={{ mt: 4, p: 2, bgcolor: alpha('#EA781E', 0.05), borderRadius: '1rem', border: '1px dashed', borderColor: alpha('#EA781E', 0.2) }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.disabled', mb: 0.5 }}>TRANSACTION REF</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#EA781E' }}>{order.transaction_id}</Typography>
                  </Box>
                )}
              </Paper>

              {/* Destination */}
              <Paper sx={{ p: 4, borderRadius: '2rem', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <MapPin size={20} color="#EA781E" />
                  <Typography sx={{ fontWeight: 900 }}>Destination</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.shipping_address.full_name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {order.shipping_address.address_line1}<br />
                  {order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, fontWeight: 800 }}>{order.shipping_address.phone}</Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}
