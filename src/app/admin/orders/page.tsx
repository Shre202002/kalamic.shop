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
import { Visibility, CheckCircle, Error as ErrorIcon, ShoppingBag, LocationOn, CreditCard } from '@mui/icons-material';
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

  const [selectedOrder, setSelectedUserOrder] = useState<any>(null);
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
        <IconButton size="small" color="primary" onClick={() => { setSelectedUserOrder(params.row); setDetailOpen(true); }}>
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Acquisition Breakdown</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>REF: {selectedOrder.orderNumber}</Typography>
                </Box>
                <Chip label={selectedOrder.orderStatus.toUpperCase()} color="primary" sx={{ fontWeight: 900 }} />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3 }}>Curated Items</Typography>
                  <Stack spacing={2}>
                    {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: alpha(theme.palette.common.black, 0.02), borderRadius: 3 }}>
                        <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 48, height: 48 }}><ShoppingBag /></Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>Financial Record</Typography>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" fontWeight={700}>Subtotal</Typography>
                          <Typography variant="caption">₹{selectedOrder.subtotal?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" fontWeight={700}>Logistics (Charges)</Typography>
                          <Typography variant="caption">₹{(selectedOrder.charges?.shipping + selectedOrder.charges?.handling + selectedOrder.charges?.premium).toLocaleString()}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" fontWeight={900}>Total Amount</Typography>
                          <Typography variant="caption" fontWeight={900} color="primary.main">₹{selectedOrder.totalAmount?.toLocaleString()}</Typography>
                        </Box>
                      </Paper>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>Destination</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <LocationOn sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" fontWeight={800}>{selectedOrder.shippingAddress?.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedOrder.shippingAddress?.addressLine1}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setDetailOpen(false)} fullWidth>Close Record</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
