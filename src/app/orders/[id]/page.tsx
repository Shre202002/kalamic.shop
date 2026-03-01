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
  alpha,
  useTheme,
  useMediaQuery
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 10 }, px: { xs: 2.5, sm: 4 } }}>
          
          {/* Header Navigation */}
          <Box sx={{ mb: { xs: 5, md: 8 } }}>
            <Breadcrumbs separator={<ChevronLeft size={12} />} sx={{ mb: 3 }}>
              <MuiLink component={Link} href="/orders" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Orders History
              </MuiLink>
            </Breadcrumbs>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
              spacing={3}
            >
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#271E1B', letterSpacing: '-0.04em', mb: 1.5, fontSize: { xs: '2rem', md: '3rem' } }}>
                  Order Dossier
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#C97A40', bgcolor: alpha('#C97A40', 0.08), px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.85rem' }}>
                    REF: {order?.orderNumber}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', display: { xs: 'none', sm: 'block' } }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Recorded on {formatDate(order?.createdAt)}
                  </Typography>
                </Stack>
              </Box>
              <Chip 
                label={currentStatus.toUpperCase()} 
                color={isCanceled ? "error" : "primary"}
                sx={{ 
                  fontWeight: 900, 
                  borderRadius: '1rem', 
                  px: 2, 
                  height: 44,
                  fontSize: '0.75rem',
                  letterSpacing: 1,
                  width: { xs: '100%', sm: 'auto' },
                  boxShadow: `0 8px 20px ${alpha(isCanceled ? theme.palette.error.main : theme.palette.primary.main, 0.15)}`
                }} 
              />
            </Stack>
          </Box>

          <Grid container spacing={4}>
            {/* Status Timeline Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid', borderColor: alpha('#000', 0.03) }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 4, textTransform: 'uppercase', letterSpacing: 1.5, color: '#271E1B', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Truck size={20} color="#C97A40" /> Logistics Journey
                </Typography>
                {isCanceled ? (
                  <Alert severity="error" variant="outlined" sx={{ borderRadius: '1.5rem', fontWeight: 700, p: 3 }}>
                    The journey of this handcrafted acquisition has been halted. This record is now archived.
                  </Alert>
                ) : (
                  <Box sx={{ width: '100%' }}>
                    <Stepper 
                      activeStep={currentStep} 
                      orientation={isMobile ? "vertical" : "horizontal"}
                      alternativeLabel={!isMobile}
                      sx={{ 
                        '& .MuiStepLabel-label': { fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5, mt: 1 },
                        '& .MuiStepIcon-root': { width: 28, height: 28 },
                        '& .MuiStepIcon-root.Mui-active': { color: '#C97A40' },
                        '& .MuiStepIcon-root.Mui-completed': { color: '#6F8A7A' },
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

            {/* Left Content Area: Pieces & Logistics */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={4}>
                {/* Items List */}
                <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '2.5rem' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: '#271E1B' }}>
                    <Package size={22} color="#C97A40" /> Curated Selections
                  </Typography>
                  <Stack spacing={3}>
                    {(order?.items || []).map((item: any, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 4 } }}>
                        <Box sx={{ position: 'relative', width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 }, borderRadius: '1.5rem', overflow: 'hidden', flexShrink: 0, bgcolor: '#F5EFE9', border: '1px solid', borderColor: alpha('#000', 0.05) }}>
                          <Image 
                            src={item.imageUrl || 'https://placehold.co/200x200?text=Ceramic'} 
                            alt={item.name} 
                            fill 
                            style={{ objectFit: 'cover' }} 
                            sizes="(max-width: 768px) 80px, 100px"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: '#271E1B', mb: 0.5, lineClamp: 1 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Quantity: {item.quantity}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#C97A40', mt: 0.5 }}>
                            ₹{item.price.toLocaleString()} per piece
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#271E1B', textAlign: 'right' }}>
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>

                {/* Logistics & Payment Detail Grid */}
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: '2.5rem', height: '100%', border: '1px solid', borderColor: alpha('#000', 0.02) }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary' }}>
                        <MapPin size={18} color="#C97A40" /> Destination
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 900, mb: 1.5 }}>{order?.shippingAddress?.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, fontWeight: 500, fontSize: '0.9rem' }}>
                        {order?.shippingAddress?.addressLine1}
                        {order?.shippingAddress?.addressLine2 && <><br />{order.shippingAddress.addressLine2}</>}
                        <br />{order?.shippingAddress?.city}, {order?.shippingAddress?.state}
                        <br /><span style={{ fontWeight: 800, color: '#271E1B' }}>{order?.shippingAddress?.pincode}</span>
                      </Typography>
                      
                      {order?.shippingAddress?.nearestLandmark && (
                        <Box sx={{ mt: 2.5, p: 2, bgcolor: alpha('#C97A40', 0.05), borderRadius: 2, border: '1px dashed', borderColor: alpha('#C97A40', 0.2) }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#C97A40', textTransform: 'uppercase', fontSize: '0.65rem' }}>Precision Landmark</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{order.shippingAddress.nearestLandmark}</Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: alpha('#000', 0.05) }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                          Contact: <span style={{ color: '#271E1B' }}>{order?.shippingAddress?.phone || order?.userPhone}</span>
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: '2.5rem', height: '100%', border: '1px solid', borderColor: alpha('#000', 0.02) }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', letterSpacing: 1.5, color: 'text.secondary' }}>
                        <CreditCard size={18} color="#C97A40" /> Integrity
                      </Typography>
                      <Stack spacing={2.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Protocol</Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
                            {order?.paymentGateway} / {order?.paymentMethod}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Verification</Typography>
                          <Chip 
                            label={(order?.paymentStatus || 'pending').toUpperCase()} 
                            size="small" 
                            color={order?.paymentStatus === 'paid' ? 'success' : 'warning'} 
                            sx={{ fontWeight: 900, fontSize: '0.6rem', height: 24, borderRadius: '6px' }} 
                          />
                        </Box>
                        
                        {order?.paymentVerified && (
                          <Box sx={{ p: 2, bgcolor: alpha('#6F8A7A', 0.08), borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ShieldCheck size={18} color="#6F8A7A" />
                            <Typography variant="caption" sx={{ color: '#6F8A7A', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Transaction Reconciled
                            </Typography>
                          </Box>
                        )}
                        
                        {order?.transactionId && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                              Gateway Reference
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: alpha('#000', 0.04), px: 1.5, py: 1, borderRadius: '6px', display: 'block', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
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

            {/* Right Sidebar: Summary & Support */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '3rem', position: { lg: 'sticky' }, top: { lg: 120 }, bgcolor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, color: '#271E1B', textTransform: 'uppercase', letterSpacing: 1 }}>Financial Ledger</Typography>
                
                <Stack spacing={2.5} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Acquisition Subtotal</Typography>
                    <Typography variant="body2" fontWeight={800}>₹{order?.subtotal?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>FragileCare™ Shipping</Typography>
                    <Typography variant="body2" fontWeight={800}>₹{order?.charges?.shipping?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Artisan Handling</Typography>
                    <Typography variant="body2" fontWeight={800}>₹{order?.charges?.handling?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Premium Protection</Typography>
                    <Typography variant="body2" fontWeight={800}>₹{order?.charges?.premium?.toLocaleString()}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Total Recorded</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#C97A40', lineHeight: 1 }}>₹{order?.totalAmount?.toLocaleString()}</Typography>
                  </Box>
                </Stack>

                <Stack spacing={3}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: '1.5rem', bgcolor: '#FAF4EB', border: '1px solid', borderColor: alpha('#C97A40', 0.15) }}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha('#C97A40', 0.1), color: '#C97A40', width: 44, height: 44, boxShadow: '0 4px 12px rgba(201, 122, 64, 0.1)' }}>
                        <Clock size={22} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#C97A40', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', letterSpacing: 1 }}>
                          Expected Arrival
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 900, color: '#271E1B' }}>
                          {formatDate(order?.expectedDelivery)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                  
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<MessageCircle size={20} />}
                    sx={{ 
                      height: 64, 
                      borderRadius: '1.5rem', 
                      fontWeight: 900, 
                      fontSize: '0.9rem', 
                      bgcolor: '#25D366',
                      '&:hover': { bgcolor: '#128C7E' },
                      textTransform: 'none',
                      boxShadow: '0 12px 24px rgba(37, 211, 102, 0.25)',
                      letterSpacing: 0.5
                    }}
                    component={Link}
                    href={`https://wa.me/916387562920?text=Hi, I need assistance with my Kalamic Order: ${order?.orderNumber}`}
                    target="_blank"
                  >
                    Contact Studio Support
                  </Button>
                  
                  <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.disabled', fontWeight: 600, display: 'block', px: 2 }}>
                    Our master artisans are available for logistics inquiries via WhatsApp.
                  </Typography>
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
