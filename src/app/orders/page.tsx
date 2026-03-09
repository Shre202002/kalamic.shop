
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useNavigation } from '@/hooks/useNavigation';
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
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Package, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  Truck,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { getUserOrders } from '@/lib/actions/user-actions';

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const router = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingInfo, setPendingInfo] = useState<{ count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [orderData, pendingData] = await Promise.all([
        getUserOrders(user.uid),
        fetch(`/api/orders/pending?userId=${user.uid}`).then(res => res.json())
      ]);
      setOrders(orderData);
      setPendingInfo(pendingData);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isUserLoading || isLoading) {
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

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5EFE9' }}>
        <Navbar />
        <Container maxWidth="sm" sx={{ flex: 1, py: 12, textAlign: 'center' }}>
          <Box sx={{ mb: 4, p: 4, bgcolor: 'white', borderRadius: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <ShoppingBag size={64} color="#C97A40" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>Sign In Required</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>Please sign in to view your order history.</Typography>
            <Button component={Link} href="/auth/login" variant="contained" fullWidth sx={{ height: 56, borderRadius: '1rem', fontWeight: 900 }}>
              Sign In
            </Button>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5EFE9' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
          <Box sx={{ mb: 6 }}>
            <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/" underline="hover" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Home
              </MuiLink>
              <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: '#C97A40' }}>
                Orders
              </Typography>
            </Breadcrumbs>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.03em' }}>Order History</Typography>
              <Button 
                onClick={loadData} 
                startIcon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
                sx={{ borderRadius: '1rem', fontWeight: 800, color: 'primary.main' }}
              >
                Sync
              </Button>
            </Stack>
            <Typography color="text.secondary">Detailed log of your handcrafted acquisitions.</Typography>
          </Box>

          {pendingInfo && pendingInfo.count > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 4, borderRadius: '1.5rem', border: '1px solid', borderColor: 'warning.light' }}
              action={
                <Button color="inherit" size="small" onClick={loadData} sx={{ fontWeight: 800 }}>
                  Check Status
                </Button>
              }
            >
              <AlertTitle sx={{ fontWeight: 800 }}>Verification Pending</AlertTitle>
              You have <b>{pendingInfo.count}</b> order(s) awaiting payment confirmation. These will appear in your archive once verified by the studio.
            </Alert>
          )}

          {!orders || orders.length === 0 ? (
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: '3rem', border: '2px dashed rgba(0,0,0,0.05)', bgcolor: 'white', boxShadow: 'none' }}>
              <Package size={64} color="#C97A40" style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>No verified orders found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1 }}>Your history will appear here once your acquisitions are verified.</Typography>
              <Button component={Link} href="/products" variant="outlined" sx={{ borderRadius: '1rem', px: 4, fontWeight: 800 }}>Browse Products</Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {orders.map((order: any) => {
                const isPaid = order.paymentStatus === 'paid' && order.paymentVerified;
                
                return (
                  <Grid item xs={12} key={order.orderNumber}>
                    <Paper 
                      component={Link}
                      href={`/orders/${order.orderNumber}`}
                      sx={{ 
                        p: 3, 
                        borderRadius: '2rem', 
                        transition: 'all 0.3s',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        border: '1px solid transparent',
                        '&:hover': { 
                          transform: 'translateY(-4px)', 
                          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                          borderColor: '#C97A40'
                        } 
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#C97A40', textTransform: 'uppercase', letterSpacing: 1 }}>ID: {order.orderNumber}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                              <Calendar size={14} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{dayjs(order.createdAt).format('DD MMM YYYY')}</Typography>
                            </Stack>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <Stack spacing={1}>
                            <Chip 
                              label={(order.orderStatus || 'Placed').toUpperCase()} 
                              size="small" 
                              sx={{ 
                                fontWeight: 900, 
                                bgcolor: order.orderStatus === 'Delivered' ? '#6F8A7A' : '#C97A40',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '0.65rem'
                              }} 
                            />
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                              <Truck size={14} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{order.orderStatus || 'Placed'}</Typography>
                            </Stack>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                          <Stack spacing={1}>
                            <Chip 
                              label={isPaid ? 'PAID' : (order.paymentStatus || 'pending').toUpperCase()} 
                              variant="outlined"
                              size="small"
                              color={isPaid ? 'success' : 'warning'}
                              sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: '6px' }}
                            />
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                              <CreditCard size={14} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {order.paymentVerified ? 'Payment Verified' : 'Verification Pending'}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={2} sx={{ textAlign: { sm: 'right' } }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#271E1B' }}>₹{order.totalAmount?.toLocaleString()}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>
      </main>
      <Footer />
    </Box>
  );
}
