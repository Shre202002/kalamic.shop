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
  useTheme 
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
  Flag as FlagIcon
} from '@mui/icons-material';
import { getAllOrders } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const STATUS_OPTIONS = ["Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered", "Canceled"];

export default function OrdersManagement() {
  const { user } = useUser();
  const theme = useTheme();
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
      width: 180,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'primary.main' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'userName', 
      headerName: 'Collector', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.userPhone}</Typography>
        </Box>
      )
    },
    { 
      field: 'totalAmount', 
      headerName: 'Total (₹)', 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 900 }}>₹{(params.value ?? 0).toLocaleString()}</Typography>
      )
    },
    { 
      field: 'orderStatus', 
      headerName: 'Status', 
      width: 200,
      renderCell: (params) => (
        <FormControl fullWidth size="small">
          <Select
            value={params.value}
            onChange={(e) => handleStatusChangeClick(params.row._id, e.target.value)}
            sx={{ 
              fontSize: '0.7rem', 
              fontWeight: 900, 
              textTransform: 'uppercase',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: '8px'
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
      headerName: 'Payment', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'pending'} 
          size="small" 
          color={params.value === 'paid' ? 'success' : 'error'} 
          variant={params.row.paymentVerified ? 'filled' : 'outlined'}
          sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.6rem', height: 24 }}
        />
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Date', 
      width: 160,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {dayjs(params.value).format('DD MMM YYYY')}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="primary" onClick={() => { setSelectedOrder(params.row); setDetailOpen(true); }}>
          <Visibility fontSize="small" />
        </IconButton>
      )
    }
  ], [theme.palette]);

  if (!mounted) return <Skeleton variant="rectangular" height={400} />;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Artisanal Acquisitions</Typography>
        <Typography variant="body2" color="text.secondary">Overseeing the finalized collection pipeline.</Typography>
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
            '& .MuiDataGrid-cell:focus': { outline: 'none' }
          }}
        />
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Synchronize Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Transition this acquisition to <b>{statusUpdate.status.toUpperCase()}</b>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmStatusUpdate}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Detail Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>Acquisition Dossier</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    REF: {selectedOrder.orderNumber} <Divider orientation="vertical" flexItem sx={{ mx: 1 }} /> {dayjs(selectedOrder.createdAt).format('DD MMMM YYYY')}
                  </Typography>
                </Box>
                <Chip 
                  label={selectedOrder.orderStatus.toUpperCase()} 
                  color="primary" 
                  sx={{ fontWeight: 900, height: 40, px: 2, borderRadius: 2 }} 
                />
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Left Column: Items and Summary */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ShoppingBag sx={{ fontSize: 18, color: 'primary.main' }} /> Curated Selections
                  </Typography>
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: alpha(theme.palette.common.black, 0.02), borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 64, height: 64, borderRadius: 3 }}><ShoppingBag /></Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Piece ID: {item.productId}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main' }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Financial Record</Typography>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Item Subtotal</Typography>
                        <Typography variant="body2" fontWeight={700}>₹{selectedOrder.subtotal?.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">FragileCare™ Shipping</Typography>
                        <Typography variant="body2" fontWeight={700}>₹{selectedOrder.charges?.shipping?.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Artisan Handling</Typography>
                        <Typography variant="body2" fontWeight={700}>₹{selectedOrder.charges?.handling?.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Premium Insurance</Typography>
                        <Typography variant="body2" fontWeight={700}>₹{selectedOrder.charges?.premium?.toLocaleString()}</Typography>
                      </Box>
                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Total Value</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>₹{selectedOrder.totalAmount?.toLocaleString()}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Right Column: User and Shipping Details */}
                <Grid item xs={12} md={5}>
                  <Stack spacing={4}>
                    {/* Collector Identity */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} /> Collector Identity
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '1rem', fontWeight: 900 }}>
                              {selectedOrder.userName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedOrder.userName}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                ID: {selectedOrder.userId}
                              </Typography>
                            </Box>
                          </Box>
                          <Divider />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                            <Typography variant="body2" fontWeight={600}>{selectedOrder.userEmail || 'No Email Registered'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PhoneIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                            <Typography variant="body2" fontWeight={600}>{selectedOrder.userPhone}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>

                    {/* Destination Details */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LocationOn sx={{ fontSize: 18, color: 'primary.main' }} /> Logistics Destination
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <HomeIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.5 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={800}>{selectedOrder.shippingAddress?.fullName}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                                {selectedOrder.shippingAddress?.addressLine1}
                                {selectedOrder.shippingAddress?.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ mt: 1, color: 'text.primary' }}>
                                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {selectedOrder.shippingAddress?.nearestLandmark && (
                            <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 3, border: '1px dashed', borderColor: 'warning.light' }}>
                              <FlagIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'warning.dark', textTransform: 'uppercase' }}>Landmark Reference</Typography>
                                <Typography variant="body2" fontWeight={600}>{selectedOrder.shippingAddress.nearestLandmark}</Typography>
                              </Box>
                            </Box>
                          )}

                          <Divider />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Destination Contact</Typography>
                            <Typography variant="body2" fontWeight={800}>{selectedOrder.shippingAddress?.phone}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>

                    {/* Transaction Security */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CreditCard sx={{ fontSize: 18, color: 'primary.main' }} /> Security Integrity
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Gateway Path</Typography>
                            <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{selectedOrder.paymentGateway} / {selectedOrder.paymentMethod}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Reconciliation</Typography>
                            <Chip 
                              label={selectedOrder.paymentVerified ? 'Verified' : 'Unverified'} 
                              size="small" 
                              color={selectedOrder.paymentVerified ? 'success' : 'warning'} 
                              sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }} 
                            />
                          </Box>
                          {selectedOrder.transactionId && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Archive Transaction ID</Typography>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'divider', px: 1, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
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
            
            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
              <Button 
                onClick={() => setDetailOpen(false)} 
                variant="outlined" 
                fullWidth 
                sx={{ borderRadius: 3, height: 48, fontWeight: 800, color: 'text.secondary', borderColor: 'divider' }}
              >
                Close Acquisition Record
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
