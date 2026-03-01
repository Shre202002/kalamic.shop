'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
  alpha
} from '@mui/material';
import { 
  Package, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  Truck,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'orders'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  if (isUserLoading || isOrdersLoading) {
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
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>Secure Workspace</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>Please sign in to view your artisanal acquisition history.</Typography>
            <Button component={Link} href="/auth/login" variant="contained" fullWidth sx={{ height: 56, borderRadius: '1rem', fontWeight: 900 }}>
              Sign In to Studio
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
                Acquisitions
              </Typography>
            </Breadcrumbs>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.03em' }}>My Collection</Typography>
            <Typography color="text.secondary">History of your handcrafted treasures.</Typography>
          </Box>

          {!orders || orders.length === 0 ? (
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: '3rem', border: '2px dashed rgba(0,0,0,0.05)', bgcolor: 'white', boxShadow: 'none' }}>
              <Package size={64} color="#C97A40" style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>No acquisitions yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, mt: 1 }}>Your curated ceramic history will appear here once you place an order.</Typography>
              <Button component={Link} href="/products" variant="outlined" sx={{ borderRadius: '1rem', px: 4, fontWeight: 800 }}>Explore Collection</Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {orders.map((order: any) => (
                <Grid item xs={12} key={order.id}>
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
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#C97A40', textTransform: 'uppercase', letterSpacing: 1 }}>REF: {order.orderNumber}</Typography>
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
                            label={(order.paymentStatus || 'pending').toUpperCase()} 
                            variant="outlined"
                            size="small"
                            color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                            sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: '6px' }}
                          />
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                            <CreditCard size={14} />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              {order.paymentVerified ? 'Verified Transaction' : 'Verification Pending'}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} sm={2} sx={{ textAlign: { sm: 'right' } }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#271E1B' }}>₹{order.totalAmount?.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Value</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </main>
      <Footer />
    </Box>
  );
}