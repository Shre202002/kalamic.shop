
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Tooltip, Skeleton, Select, MenuItem, FormControl } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility, FileDownload, Save } from '@mui/icons-material';
import { getAllOrders, updateOrderStatus } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS = ['Placed', 'Crafting', 'Developing', 'Packed', 'Dispatched', 'Delivered', 'cancelled', 'refunded'];

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateOrderStatus('current-admin', id, newStatus);
      toast({ title: "Status Updated", description: `Order is now marked as ${newStatus}.` });
      setOrders((prev: any) => prev.map((o: any) => o._id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not change order status." });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: 'order_number', 
      headerName: 'Order #', 
      width: 180,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'user_name', 
      headerName: 'Collector', 
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.user_phone}</Typography>
        </Box>
      )
    },
    { 
      field: 'total_amount', 
      headerName: 'Amount', 
      width: 120,
      renderCell: (params) => `₹${(params.value ?? 0).toLocaleString()}`
    },
    { 
      field: 'status', 
      headerName: 'Workflow Status', 
      width: 200,
      renderCell: (params) => (
        <FormControl fullWidth size="small">
          <Select
            value={params.value}
            onChange={(e) => handleStatusChange(params.row._id, e.target.value)}
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: '0.75rem' }}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    },
    { 
      field: 'payment_status', 
      headerName: 'Payment', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'pending'} 
          size="small" 
          color={params.value === 'paid' ? 'success' : 'error'} 
          variant={params.row.payment_verified ? 'filled' : 'outlined'}
          sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}
        />
      )
    },
    { 
      field: 'created_at', 
      headerName: 'Acquired On', 
      width: 180,
      renderCell: (params) => params.value ? dayjs(params.value).format('DD MMM YYYY, HH:mm') : 'N/A'
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Full Details">
          <IconButton size="small"><Visibility /></IconButton>
        </Tooltip>
      )
    }
  ], []);

  if (!mounted) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">Logistics Command</Typography>
          <Typography variant="body2" color="text.secondary">Oversee the artisanal journey from kiln to collector.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Export Acquisition Log">
            <IconButton sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.1)' }}><FileDownload /></IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Paper sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <DataGrid
          rows={orders}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          initialState={{ 
            pagination: { 
              paginationModel: { pageSize: 10 } 
            } 
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'rgba(234,120,30,0.03)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }
          }}
        />
      </Paper>
    </Box>
  );
}
