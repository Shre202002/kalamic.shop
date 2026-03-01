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

      {/* Detail Dialog omitted for brevity but would include Initiated/Placed checks */}
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
