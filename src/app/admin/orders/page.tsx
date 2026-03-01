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
  useMediaQuery
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
  MoreVert,
  LocalShipping
} from '@mui/icons-material';
import { getAllOrders } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const STATUS_OPTIONS = ["Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered", "Canceled"];

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
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'primary.main', fontSize: '0.75rem' }}>
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
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>{params.row.userPhone}</Typography>
        </Box>
      )
    },
    { 
      field: 'totalAmount', 
      headerName: 'Total', 
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 900 }}>₹{(params.value ?? 0).toLocaleString()}</Typography>
      )
    },
    { 
      field: 'orderStatus', 
      headerName: 'Logistics State', 
      width: 180,
      renderCell: (params) => (
        <FormControl fullWidth size="small" sx={{ my: 1 }}>
          <Select
            value={params.value || 'Placed'}
            onChange={(e) => handleStatusChangeClick(params.row._id, e.target.value)}
            sx={{ 
              fontSize: '0.65rem', 
              fontWeight: 900, 
              textTransform: 'uppercase',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: '6px',
              '& .MuiSelect-select': { py: 0.5 }
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{opt}</MenuItem>
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
          label={params.value || 'pending'} 
          size="small" 
          color={params.value === 'paid' ? 'success' : 'warning'} 
          sx={{ 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            fontSize: '0.6rem', 
            height: 22,
            width: '100%',
            borderRadius: '4px'
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Examine Dossier">
          <IconButton size="small" color="primary" onClick={() => { setSelectedOrder(params.row); setDetailOpen(true); }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme.palette]);

  if (!mounted) return <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />;

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 0 } }}>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>Artisanal Acquisitions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>Overseeing the finalized collection pipeline and studio logistics.</Typography>
        </Box>
        {!isMobile && (
          <Button variant="outlined" startIcon={<LocalShipping />} onClick={load} size="small" sx={{ borderRadius: 2, fontWeight: 800 }}>
            Refresh Feed
          </Button>
        )}
      </Box>

      <Paper sx={{ border: 'none', borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <DataGrid
          rows={orders}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: 1
            }
          }}
        />
      </Paper>

      {/* Status Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle color="primary" /> Synchronize Logistics
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to transition this acquisition to the <b>{statusUpdate.status.toUpperCase()}</b> state? This will be reflected in the collector's workspace immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ fontWeight: 700, color: 'text.disabled' }}>Discard</Button>
          <Button variant="contained" onClick={confirmStatusUpdate} sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}>
            Confirm Transition
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Detail Dossier Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 6, overflow: 'hidden' } }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ p: { xs: 3, md: 4 }, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>Acquisition Dossier</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      REF: {selectedOrder.orderNumber}
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {dayjs(selectedOrder.createdAt).format('DD MMMM YYYY')}
                    </Typography>
                  </Stack>
                </Box>
                <Chip 
                  label={selectedOrder.orderStatus.toUpperCase()} 
                  color="primary" 
                  sx={{ fontWeight: 900, height: 32, px: 1, borderRadius: '6px', fontSize: '0.65rem' }} 
                />
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fafafa' }}>
              <Grid container spacing={4}>
                {/* Left Section: Items and Financials */}
                <Grid item xs={12} md={7}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                        <ShoppingBag sx={{ fontSize: 18, color: 'primary.main' }} /> Curated Selections
                      </Typography>
                      <Stack spacing={2}>
                        {(selectedOrder.items || []).map((item: any, idx: number) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'white' }}>
                            <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                              <ShoppingBag sx={{ fontSize: 20, color: alpha(theme.palette.primary.main, 0.2) }} />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, noWrap: true }}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>SKU: {item.productId.slice(-8).toUpperCase()}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>{item.quantity} × ₹{item.price.toLocaleString()}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 900, ml: 'auto' }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Financial Ledger</Typography>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Acquisition Subtotal</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{selectedOrder.subtotal?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>FragileCare™ Logistics</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{selectedOrder.charges?.shipping?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Artisan Handling Fee</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{selectedOrder.charges?.handling?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Premium Protection</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{selectedOrder.charges?.premium?.toLocaleString()}</Typography>
                          </Box>
                          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Typography variant="body1" sx={{ fontWeight: 900 }}>Total Recorded Value</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>₹{selectedOrder.totalAmount?.toLocaleString()}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>
                  </Stack>
                </Grid>

                {/* Right Section: Collector & Logistics */}
                <Grid item xs={12} md={5}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} /> Collector Profile
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: '1.1rem', fontWeight: 900, boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` }}>
                              {selectedOrder.userName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedOrder.userName}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem' }}>
                                Collector ID: {selectedOrder.userId.slice(-10)}
                              </Typography>
                            </Box>
                          </Box>
                          <Divider sx={{ opacity: 0.5 }} />
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <EmailIcon sx={{ fontSize: 16, color: alpha(theme.palette.text.primary, 0.3) }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{selectedOrder.userEmail || 'No Email Provided'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <PhoneIcon sx={{ fontSize: 16, color: alpha(theme.palette.text.primary, 0.3) }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{selectedOrder.userPhone}</Typography>
                            </Box>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                        <HomeIcon sx={{ fontSize: 18, color: 'primary.main' }} /> Logistics Destination
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: 'white' }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>{selectedOrder.shippingAddress?.fullName}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.6, fontWeight: 500 }}>
                                {selectedOrder.shippingAddress?.addressLine1}
                                {selectedOrder.shippingAddress?.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1, fontWeight: 800, color: 'primary.main', fontSize: '0.85rem' }}>
                                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {selectedOrder.shippingAddress?.nearestLandmark && (
                            <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2, border: '1px dashed', borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                              <FlagIcon sx={{ fontSize: 16, color: 'warning.dark', mt: 0.2 }} />
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'warning.dark', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5 }}>Precision Landmark</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{selectedOrder.shippingAddress.nearestLandmark}</Typography>
                              </Box>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                        <CreditCard sx={{ fontSize: 18, color: 'primary.main' }} /> Transaction Integrity
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Gateway Protocol</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{selectedOrder.paymentGateway} / {selectedOrder.paymentMethod}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Reconciliation Status</Typography>
                            <Chip 
                              label={selectedOrder.paymentVerified ? 'Verified' : 'Verification Pending'} 
                              size="small" 
                              color={selectedOrder.paymentVerified ? 'success' : 'warning'} 
                              sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900, borderRadius: '4px' }} 
                            />
                          </Box>
                          {selectedOrder.transactionId && (
                            <Box sx={{ pt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Archive Transaction ID</Typography>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: alpha(theme.palette.common.black, 0.05), px: 1, py: 0.5, borderRadius: 1, fontWeight: 700, fontSize: '0.65rem' }}>
                                {selectedOrder.transactionId}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
              <Button 
                onClick={() => setDetailOpen(false)} 
                variant="outlined" 
                fullWidth 
                sx={{ borderRadius: 3, height: 44, fontWeight: 800, color: 'text.secondary', borderColor: 'divider' }}
              >
                Close Record
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
