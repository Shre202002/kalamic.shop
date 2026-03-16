
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

  const primarySaffron = '#EA781E';
  const warmCream = '#FAF4EB';
  const darkTerracotta = '#271E1B';

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
    return primarySaffron;
  };

  if (isUserLoading || isLoading) {
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

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: warmCream }}>
        <Navbar />
        <Container maxWidth="sm" sx={{ flex: 1, py: 12, textAlign: 'center', pt: 32 }}>
          <Box sx={{ mb: 4, p: 6, bgcolor: 'white', borderRadius: '3rem', boxShadow: `0 20px 60px ${alpha(primarySaffron, 0.05)}` }}>
            <ShoppingBag size={64} color={primarySaffron} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: darkTerracotta, fontFamily: 'Playfair Display' }}>Sign In Required</Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>Please sign in to view your artisan order history.</Typography>
            <Button 
              component={Link} 
              href="/auth/login" 
              variant="contained" 
              fullWidth 
              sx={{ height: 64, borderRadius: '1.5rem', fontWeight: 900, bgcolor: primarySaffron, '&:hover': { bgcolor: '#D66A18' }, fontSize: '1rem' }}
            >
              Sign In to Studio
            </Button>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: warmCream }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 12, md: 16 } }}>
          <Box sx={{ mb: 6 }}>
            <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ mb: 2 }}>
              <MuiLink component={Link} href="/" underline="hover" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Home
              </MuiLink>
              <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: primarySaffron }}>
                Orders
              </Typography>
            </Breadcrumbs>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3" sx={{ fontWeight: 900, color: darkTerracotta, letterSpacing: '-0.03em', fontFamily: 'Playfair Display', fontSize: { xs: '2rem', md: '3.5rem' } }}>Order History</Typography>
              <Button 
                onClick={loadData} 
                startIcon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
                sx={{ borderRadius: '1.25rem', fontWeight: 800, color: primarySaffron, px: 3, border: '1px solid', borderColor: alpha(primarySaffron, 0.2) }}
              >
                Sync
              </Button>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>Complete acquisition & payment history for your handcrafted treasures.</Typography>
          </Box>

          {pendingInfo && pendingInfo.count > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 4, borderRadius: '2rem', bgcolor: alpha(primarySaffron, 0.05), border: '1px solid', borderColor: alpha(primarySaffron, 0.2), color: darkTerracotta }}
              action={
                <Button color="inherit" size="small" onClick={loadData} sx={{ fontWeight: 800, bgcolor: 'white', borderRadius: '1rem', px: 2 }}>
                  Check Status
                </Button>
              }
            >
              <AlertTitle sx={{ fontWeight: 900, fontSize: '0.9rem' }}>Verification Pending</AlertTitle>
              You have <b>{pendingInfo.count}</b> order(s) awaiting payment confirmation from the gateway.
            </Alert>
          )}

          {!orders || orders.length === 0 ? (
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: '4rem', border: `2px dashed ${alpha(primarySaffron, 0.2)}`, bgcolor: 'white', boxShadow: 'none' }}>
              <Package size={80} color={primarySaffron} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: darkTerracotta, fontFamily: 'Playfair Display' }}>No verified orders found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1, fontWeight: 500 }}>Your history will appear here once your acquisitions are fully reconciled.</Typography>
              <Button 
                component={Link} 
                href="/products" 
                variant="outlined" 
                sx={{ borderRadius: '1.5rem', px: 6, py: 1.5, fontWeight: 900, color: primarySaffron, borderColor: primarySaffron, '&:hover': { borderColor: '#D66A18', bgcolor: alpha(primarySaffron, 0.05) } }}
              >
                Browse Collection
              </Button>
            </Paper>
          ) : (
            <Stack spacing={4}>
              {orders.map((order: any) => {
                const isPaid = order.paymentStatus === 'paid' && order.paymentVerified;
                const itemsCount = order.items?.length || 0;
                
                return (
                  <Paper 
                    key={order.orderNumber}
                    elevation={0}
                    sx={{ 
                      p: { xs: 3, md: 5 }, 
                      borderRadius: '3rem', 
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: 'white',
                      border: `1px solid ${alpha(primarySaffron, 0.1)}`,
                      boxShadow: `0 10px 40px ${alpha(darkTerracotta, 0.03)}`,
                      '&:hover': { 
                        borderColor: primarySaffron,
                        transform: 'translateY(-6px)', 
                        boxShadow: `0 30px 60px ${alpha(primarySaffron, 0.1)}`
                      } 
                    }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 4 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: primarySaffron, fontFamily: 'monospace', letterSpacing: 1.5, fontSize: '0.9rem', bgcolor: alpha(primarySaffron, 0.05), px: 1.5, py: 0.5, borderRadius: 1 }}>
                          REF: {order.orderNumber}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: 'text.secondary', mt: 1.5 }}>
                          <Calendar size={16} color={primarySaffron} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{dayjs(order.createdAt).format('DD MMM YYYY')}</Typography>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={2}>
                        <Chip 
                          label={order.orderStatus?.toUpperCase() || 'PLACED'} 
                          size="small" 
                          sx={{ 
                            fontWeight: 900, 
                            borderRadius: '0.75rem', 
                            fontSize: '0.65rem', 
                            letterSpacing: 1,
                            px: 1,
                            bgcolor: order.orderStatus === 'Canceled' ? alpha(theme.palette.error.main, 0.1) : alpha(primarySaffron, 0.1),
                            color: order.orderStatus === 'Canceled' ? theme.palette.error.main : primarySaffron,
                            border: '1px solid',
                            borderColor: 'currentColor'
                          }} 
                        />
                        <Chip 
                          label={isPaid ? 'PAID' : (order.paymentStatus || 'PENDING').toUpperCase()} 
                          variant="filled"
                          size="small"
                          sx={{ 
                            fontWeight: 900, 
                            fontSize: '0.65rem', 
                            borderRadius: '0.75rem', 
                            px: 1,
                            bgcolor: isPaid ? '#4caf50' : '#ff9800',
                            color: 'white'
                          }}
                        />
                      </Stack>
                    </Stack>

                    <Divider sx={{ mb: 4, borderStyle: 'dashed', borderColor: alpha(primarySaffron, 0.2) }} />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ md: 'center' }} sx={{ mb: 4 }}>
                      <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1 }}>
                        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 56, height: 56, fontSize: '0.85rem', fontWeight: 900, border: '3px solid white', bgcolor: warmCream, color: primarySaffron } }}>
                          {order.items?.map((item: any, i: number) => (
                            <Avatar key={i} src={item.imageUrl} variant="rounded">
                              <ShoppingBag size={20} />
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', textTransform: 'uppercase', letterSpacing: 1, color: primarySaffron, fontSize: '0.7rem', mb: 0.5 }}>
                            {itemsCount} {itemsCount === 1 ? 'Handcrafted Piece' : 'Artisan Pieces'}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: darkTerracotta, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1.1rem' }}>
                            {order.items?.slice(0, 2).map((it: any) => it.name).join(', ')}
                            {itemsCount > 2 ? '...' : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ bgcolor: warmCream, px: 3, py: 1.5, borderRadius: '1.5rem', border: '1px solid', borderColor: alpha(primarySaffron, 0.1) }}>
                        <MapPin size={18} color={primarySaffron} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: darkTerracotta, fontSize: '0.75rem' }}>
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Box sx={{ bgcolor: alpha(primarySaffron, 0.02), p: 4, borderRadius: '2rem', mb: 4, border: '1px solid', borderColor: alpha(primarySaffron, 0.05) }}>
                      <Grid container spacing={3}>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>Subtotal</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: darkTerracotta }}>₹{order.subtotal?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>Shipping</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: darkTerracotta }}>₹{order.charges?.shipping?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>Handling</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: darkTerracotta }}>₹{order.charges?.handling?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>Protection</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: darkTerracotta }}>₹{order.charges?.premium?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={2.4} sx={{ textAlign: { sm: 'right' } }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 0.5, fontSize: '0.65rem', color: primarySaffron }}>Total Acquisition</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: primarySaffron }}>₹{order.totalAmount?.toLocaleString()}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between" alignItems="center">
                      <Tooltip title="Estimated completion & safe delivery window">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Truck size={20} color={getDeliveryColor(order.expectedDelivery)} />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: getDeliveryColor(order.expectedDelivery), textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                            Anticipated by {dayjs(order.expectedDelivery).format('DD MMM YYYY')}
                          </Typography>
                        </Stack>
                      </Tooltip>
                      
                      <Button 
                        component={Link}
                        href={`/orders/${order.orderNumber}`}
                        variant="contained" 
                        size="large"
                        endIcon={<ArrowRight size={18} />}
                        sx={{ 
                          borderRadius: '1.5rem', 
                          fontWeight: 900, 
                          px: 5,
                          height: 56,
                          textTransform: 'none',
                          bgcolor: primarySaffron,
                          '&:hover': { bgcolor: '#D66A18' },
                          boxShadow: `0 8px 25px ${alpha(primarySaffron, 0.2)}`
                        }}
                      >
                        Examine Dossier
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
