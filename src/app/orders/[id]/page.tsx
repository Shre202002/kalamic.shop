
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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

const STEPS = ["Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered"];
const STEP_MAP: Record<string, number> = {
  'Placed': 0,
  'Confirmed': 1,
  'Preparing': 2,
  'Developing': 3,
  'Completed': 4,
  'Dispatched': 5,
  'Delivered': 6,
};

export default function OrderDetailPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to store current status to avoid stale closure in polling interval
  const statusRef = useRef<string>('');

  const orderId = params.id as string;

  const fetchOrder = useCallback(async () => {
    try {
      // Proactively reconcile with gateway
      await fetch(`/api/orders/${orderId}/status`);
      
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      setOrder(data);
      statusRef.current = data.orderStatus;
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isUserLoading && user) {
      fetchOrder();

      const interval = setInterval(() => {
        const terminalStates = ['Delivered', 'Canceled'];
        if (statusRef.current && !terminalStates.includes(statusRef.current)) {
          console.log('[POLLING] Refreshing order status:', orderId);
          fetchOrder();
        } else if (terminalStates.includes(statusRef.current)) {
          console.log('[POLLING] Terminal state reached. Stopping poll.');
          clearInterval(interval);
        }
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [user, isUserLoading, fetchOrder, orderId]);

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
        <Button component={Link} href="/" variant="contained" sx={{ bgcolor: '#EA781E' }}>Return Home</Button>
      </Container>
    );
  }

  const currentStep = STEP_MAP[order.orderStatus] ?? 0;
  const isCanceled = order.orderStatus === 'Canceled';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF4EB', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button component={Link} href="/profile" startIcon={<ChevronLeft size={18} />} sx={{ color: 'text.secondary', fontWeight: 800 }}>
            Back to Workspace
          </Button>
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 1.5 }}>
            REF: {order.orderNumber}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={4}>
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2rem' }}>
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Acquisition Journey</Typography>
                  <Typography variant="body2" color="text.secondary">Expected: {dayjs(order.expectedDelivery).format('DD MMM YYYY')}</Typography>
                </Box>

                {isCanceled ? (
                  <Alert severity="error" sx={{ borderRadius: '1rem' }}>
                    <AlertTitle sx={{ fontWeight: 800 }}>Acquisition Canceled</AlertTitle>
                    This creation process has been halted.
                  </Alert>
                ) : (
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {STEPS.map((label) => (
                      <Step key={label}>
                        <StepLabel>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>{label}</Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}
              </Paper>

              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2rem' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 4 }}>Curated Items</Typography>
                <Stack spacing={3}>
                  {order.items.map((item: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 64, height: 64 }}><ShoppingBag size={24} /></Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Qty: {item.quantity}</Typography>
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
              <Paper sx={{ p: 4, borderRadius: '2.5rem' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Financial Summary</Typography>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Payment Status</Typography>
                    <Chip label={order.paymentStatus.toUpperCase()} color={order.paymentStatus === 'paid' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                  </Box>
                  {order.paymentVerified && (
                    <Alert severity="success" sx={{ py: 0, px: 1, mt: 1, '& .MuiAlert-message': { p: 0.5, fontSize: '0.7rem', fontWeight: 700 } }}>
                      ✔ Payment Verified Successfully
                    </Alert>
                  )}
                </Box>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{order.subtotal?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Logistics Charges</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(order.charges?.shipping + order.charges?.handling + order.charges?.premium).toLocaleString()}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem' }}>Total</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#EA781E' }}>₹{order.totalAmount?.toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper sx={{ p: 4, borderRadius: '2rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <MapPin size={20} color="#EA781E" />
                  <Typography sx={{ fontWeight: 900 }}>Destination</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.shippingAddress?.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress?.addressLine1}<br />
                  {order.shippingAddress?.nearestLandmark && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EA781E' }}>
                      Landmark: {order.shippingAddress.nearestLandmark}<br />
                    </span>
                  )}
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}
