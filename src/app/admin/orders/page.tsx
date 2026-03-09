'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton, 
  Tooltip, 
  Skeleton, 
  Select, 
  MenuItem, 
  FormControl, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Divider, 
  Grid, 
  Avatar, 
  Stack, 
  alpha, 
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Visibility, 
  CheckCircle, 
  Error as ErrorIcon, 
  ShoppingBag, 
  LocationOn, 
  CreditCard,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Flag as FlagIcon,
  LocalShipping
} from '@mui/icons-material';
import { getAllOrders } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const STATUS_OPTIONS = ["Initiated", "Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered", "Canceled"];

export default function OrdersManagement() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ id: '', status: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const handleStatusChangeClick = (id: string, newStatus: string) => {
    setStatusUpdate({ id, status: newStatus });
    setConfirmOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!user) return;
    setConfirmOpen(false);
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.uid,
          orderId: statusUpdate.id,
          newStatus: statusUpdate.status
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({ title: "Status Synchronized", description: `Order updated to ${statusUpdate.status}.` });
      setOrders((prev: any) => prev.map((o: any) => o._id === statusUpdate.id ? { ...o, orderStatus: statusUpdate.status } : o));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: 'orderNumber', 
      headerName: 'Reference', 
      width: 160,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'primary.main' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'userName', 
      headerName: 'Collector', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>{params.row.userPhone}</Typography>
        </Box>
      )
    },
    { 
      field: 'orderStatus', 
      headerName: 'State', 
      width: 180,
      renderCell: (params) => (
        <FormControl fullWidth size="small">
          <Select
            value={params.value || 'Initiated'}
            onChange={(e) => handleStatusChangeClick(params.row._id, e.target.value)}
            sx={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', bgcolor: alpha(theme.palette.primary.main, 0.05) }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: '0.7rem', fontWeight: 700 }}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    },
    { 
      field: 'paymentStatus', 
      headerName: 'Billing', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={(params.row.paymentStatus === 'paid' && params.row.paymentVerified) ? 'verified' : params.value} 
          size="small" 
          color={(params.row.paymentStatus === 'paid' && params.row.paymentVerified) ? 'success' : 'warning'} 
          sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.6rem', width: '100%' }}
        />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Tooltip title="Examine Dossier">
          <IconButton size="small" color="primary" onClick={() => { setSelectedOrder(params.row); setDetailOpen(true); }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme.palette]);

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Artisanal Acquisitions</Typography>
          <Typography variant="body2" color="text.secondary">Overseeing the studio logistics pipeline.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<LocalShipping />} onClick={load} size="small">Refresh</Button>
      </Box>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <DataGrid
          rows={orders}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Acquisition Dossier
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'primary.main' }}>
                  {selectedOrder.orderNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recorded on {dayjs(selectedOrder.createdAt).format('DD MMM YYYY')}
                </Typography>
              </Box>
              <IconButton
                aria-label="close"
                onClick={() => setDetailOpen(false)}
                sx={{
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
              {/* Customer Info Section */}
              <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 900 }}>
                    {(selectedOrder.userName || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedOrder.userName}</Typography>
                    <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 0.5 : 3}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14 }} /> {selectedOrder.userEmail || 'No Email Provided'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 14 }} /> {selectedOrder.userPhone}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Grid container>
                {/* Left Column: Ordered Items & Summary */}
                <Grid item xs={12} md={7} sx={{ p: 3, borderRight: isMobile ? 'none' : '1px solid', borderColor: 'divider' }}>
                  <Typography variant="overline" sx={{ fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>Artisanal Selections</Typography>
                  <List disablePadding>
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <React.Fragment key={idx}>
                        <ListItem sx={{ px: 0, py: 2 }}>
                          <ListItemAvatar sx={{ minWidth: 56 }}>
                            <Avatar variant="rounded" src={item.imageUrl} sx={{ width: 44, height: 44, bgcolor: alpha('#000', 0.05) }}>
                              <ShoppingBag sx={{ fontSize: 20 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}</Typography>}
                            secondary={<Typography variant="caption" fontWeight={600}>{item.quantity} × ₹{item.price.toLocaleString()}</Typography>}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </Typography>
                        </ListItem>
                        {idx < selectedOrder.items.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>

                  <Box sx={{ mt: 4, p: 2.5, borderRadius: 2, bgcolor: alpha('#000', 0.02) }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={8}><Typography variant="caption">Subtotal</Typography></Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}><Typography variant="caption" fontWeight={700}>₹{selectedOrder.subtotal?.toLocaleString()}</Typography></Grid>
                      
                      <Grid item xs={8}><Typography variant="caption">Shipping Charges</Typography></Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}><Typography variant="caption" fontWeight={700}>₹{selectedOrder.charges?.shipping?.toLocaleString()}</Typography></Grid>
                      
                      <Grid item xs={8}><Typography variant="caption">Handling Charges</Typography></Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}><Typography variant="caption" fontWeight={700}>₹{selectedOrder.charges?.handling?.toLocaleString()}</Typography></Grid>
                      
                      <Grid item xs={8}><Typography variant="caption">Premium Protection</Typography></Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}><Typography variant="caption" fontWeight={700}>₹{selectedOrder.charges?.premium?.toLocaleString()}</Typography></Grid>
                      
                      <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                      
                      <Grid item xs={8}><Typography variant="subtitle1" fontWeight={900}>TOTAL AMOUNT</Typography></Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight={900} color="primary.main">
                          ₹{selectedOrder.totalAmount?.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Right Column: Destination & Integrity */}
                <Grid item xs={12} md={5} sx={{ p: 3 }}>
                  {/* Shipping Address Section */}
                  <Typography variant="overline" sx={{ fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>Destination</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 4, mb: 4, bgcolor: alpha(theme.palette.primary.main, 0.02), borderStyle: 'dashed' }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <LocationOn color="primary" sx={{ mt: 0.5, fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedOrder.shippingAddress?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>{selectedOrder.shippingAddress?.phone}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', lineHeight: 1.5, fontWeight: 500 }}>
                          {selectedOrder.shippingAddress?.addressLine1}
                          {selectedOrder.shippingAddress?.addressLine2 && <><br />{selectedOrder.shippingAddress.addressLine2}</>}
                          <br />{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                        </Typography>
                        {selectedOrder.shippingAddress?.nearestLandmark && (
                          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FlagIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'primary.main' }}>
                              Landmark: {selectedOrder.shippingAddress.nearestLandmark}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Payment Details Section */}
                  <Typography variant="overline" sx={{ fontWeight: 900, mb: 2, display: 'block', letterSpacing: 1.5 }}>Integrity Ledger</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Protocol</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{selectedOrder.paymentMethod}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Provider</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{selectedOrder.paymentGateway}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Billing State</Typography>
                      <Chip 
                        label={selectedOrder.paymentStatus} 
                        size="small" 
                        color={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}
                        sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.55rem', height: 20, borderRadius: 1.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Verification</Typography>
                      {selectedOrder.paymentVerified ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'success.main' }}>
                          <CheckCircle sx={{ fontSize: 14 }} /> <Typography variant="caption" fontWeight={900}>VERIFIED</Typography>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'error.main' }}>
                          <ErrorIcon sx={{ fontSize: 14 }} /> <Typography variant="caption" fontWeight={900}>PENDING</Typography>
                        </Stack>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Transaction ID</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: alpha('#000', 0.03), p: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        {selectedOrder.transactionId || 'Awaiting Reconciliation'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>Settlement Date</Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {selectedOrder.paymentTimestamp ? dayjs(selectedOrder.paymentTimestamp).format('DD MMM YYYY, HH:mm:ss') : 'Processing...'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.1), border: '1px solid', borderColor: alpha(theme.palette.secondary.main, 0.2) }}>
                        <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 900, display: 'block', mb: 0.5, letterSpacing: 1 }}>EXPECTED HANDOVER</Typography>
                        <Typography variant="body2" fontWeight={800} color="secondary.main">
                          {dayjs(selectedOrder.expectedDelivery).format('DD MMM YYYY')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, bgcolor: alpha('#000', 0.02) }}>
              <Button onClick={() => setDetailOpen(false)} sx={{ fontWeight: 800, color: 'text.secondary' }}>Archive Dossier</Button>
              <Button variant="contained" onClick={() => window.print()} startIcon={<LocalShipping />} sx={{ fontWeight: 900, px: 4, borderRadius: 2 }}>
                Print Logistics Label
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Sync Logistics</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Transition this acquisition to <b>{statusUpdate.status}</b>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmOpen(false)}>Discard</Button>
          <Button variant="contained" onClick={confirmStatusUpdate}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
