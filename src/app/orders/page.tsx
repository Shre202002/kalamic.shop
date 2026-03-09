
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
  AlertTitle,
  Divider,
  Avatar,
  AvatarGroup,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import { 
  Package, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  Truck,
  ShoppingBag,
  RefreshCw,
  MapPin,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { getUserOrders } from '@/lib/actions/user-actions';

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const theme = useTheme();
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

  const getStatusColor = (status: string) => {
    const map: Record<string, any> = {
      Delivered: 'success',
      Canceled: 'error',
      Dispatched: 'info',
      Confirmed: 'primary',
      Completed: 'primary',
      default: 'warning'
    };
    return map[status] || map.default;
  };

  const getDeliveryColor = (date: Date) => {
    const d = dayjs(date);
    const now = dayjs();
    if (d.isBefore(now, 'day')) return theme.palette.error.main;
    if (d.diff(now, 'day') <= 3) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  if (isUserLoading || isLoading) {
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

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
        <Navbar />
        <Container maxWidth="sm" sx={{ flex: 1, py: 12, textAlign: 'center' }}>
          <Box sx={{ mb: 4, p: 4, bgcolor: 'white', borderRadius: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <ShoppingBag size={64} color={theme.palette.primary.main} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
          <Box sx={{ mb: 6 }}>
            <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/" underline="hover" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Home
              </MuiLink>
              <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: theme.palette.primary.main }}>
                Financial Ledger
              </Typography>
            </Breadcrumbs>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3" sx={{ fontWeight: 900, color: theme.palette.text.primary, letterSpacing: '-0.03em' }}>Financial Ledger</Typography>
              <Button 
                onClick={loadData} 
                startIcon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
                sx={{ borderRadius: '1rem', fontWeight: 800, color: theme.palette.primary.main }}
              >
                Sync
              </Button>
            </Stack>
            <Typography color="text.secondary">Complete acquisition & payment history for your studio orders.</Typography>
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
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: '3rem', border: `2px dashed ${alpha(theme.palette.divider, 0.5)}`, bgcolor: 'white', boxShadow: 'none' }}>
              <Package size={64} color={theme.palette.primary.main} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>No verified orders found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1 }}>Your history will appear here once your acquisitions are verified.</Typography>
              <Button component={Link} href="/products" variant="outlined" sx={{ borderRadius: '1rem', px: 4, fontWeight: 800 }}>Browse Products</Button>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {orders.map((order: any) => {
                const isPaid = order.paymentStatus === 'paid' && order.paymentVerified;
                const itemsCount = order.items?.length || 0;
                
                return (
                  <Paper 
                    key={order.orderNumber}
                    elevation={0}
                    sx={{ 
                      p: { xs: 3, md: 4 }, 
                      borderRadius: '2.5rem', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      '&:hover': { 
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-4px)', 
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.12)}`
                      } 
                    }}
                  >
                    {/* Section A: Header */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: theme.palette.primary.main, fontFamily: 'monospace', letterSpacing: 1, fontSize: '0.8rem' }}>
                          REF: {order.orderNumber}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          <Calendar size={14} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{dayjs(order.createdAt).format('DD MMM YYYY')}</Typography>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1.5}>
                        <Chip 
                          label={(order.orderStatus || 'Placed').toUpperCase()} 
                          size="small" 
                          color={getStatusColor(order.orderStatus)}
                          sx={{ fontWeight: 900, borderRadius: '6px', fontSize: '0.65rem' }} 
                        />
                        <Chip 
                          label={isPaid ? 'PAID' : (order.paymentStatus || 'pending').toUpperCase()} 
                          variant="outlined"
                          size="small"
                          color={isPaid ? 'success' : 'warning'}
                          sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: '6px' }}
                        />
                      </Stack>
                    </Stack>

                    <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

                    {/* Section B: Items Preview */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ md: 'center' }} sx={{ mb: 4 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 40, height: 40, fontSize: '0.75rem', fontWeight: 800, border: '2px solid white' } }}>
                          {order.items?.map((item: any, i: number) => (
                            <Avatar key={i} src={item.imageUrl} variant="rounded">
                              <ShoppingBag size={16} />
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.items?.slice(0, 2).map((it: any) => it.name).join(', ')}
                            {itemsCount > 2 ? '...' : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: 'white', px: 2, py: 1, borderRadius: '1rem', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }}>
                        <Truck size={16} color={theme.palette.text.secondary} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Section C: Financial Ledger */}
                    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: '1.5rem', mb: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.3) }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Subtotal</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{order.subtotal?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Shipping</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{order.charges?.shipping?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Handling</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{order.charges?.handling?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Protection</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{order.charges?.premium?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={2.4} sx={{ textAlign: { sm: 'right' } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Total</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>₹{order.totalAmount?.toLocaleString()}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Section D: Footer */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
                      <Tooltip title="Estimated completion & delivery">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Calendar size={16} color={getDeliveryColor(order.expectedDelivery)} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: getDeliveryColor(order.expectedDelivery), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Delivery by {dayjs(order.expectedDelivery).format('DD MMM YYYY')}
                          </Typography>
                        </Stack>
                      </Tooltip>
                      
                      <Button 
                        component={Link}
                        href={`/orders/${order.orderNumber}`}
                        variant="outlined" 
                        size="small"
                        endIcon={<ArrowRight size={14} />}
                        sx={{ 
                          borderRadius: '2rem', 
                          fontWeight: 800, 
                          px: 3,
                          textTransform: 'none',
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2 }
                        }}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Container>
      </main>
      <Footer />
    </Box>
  );
}
