
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Tooltip, Skeleton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility, Edit, FileDownload } from '@mui/icons-material';
import { getAllOrders, updateOrderStatus } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    async function load() {
      try {
        const data = await getAllOrders();
        if (isMounted) {
          setOrders(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load orders:", error);
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: '_id', 
      headerName: 'Order ID', 
      width: 220,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'userId', 
      headerName: 'Collector ID', 
      width: 200,
      renderCell: (params) => <Typography variant="caption">{params.value}</Typography>
    },
    { 
      field: 'totalAmount', 
      headerName: 'Amount', 
      width: 120,
      renderCell: (params) => `₹${(params.value ?? 0).toLocaleString()}`
    },
    { 
      field: 'orderStatus', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'pending'} 
          size="small" 
          color={params.value === 'delivered' ? 'success' : 'warning'} 
          sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
        />
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Date', 
      width: 180,
      renderCell: (params) => params.value ? dayjs(params.value).format('DD MMM YYYY, HH:mm') : 'N/A'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: () => (
        <Box>
          <IconButton size="small"><Visibility /></IconButton>
          <IconButton size="small"><Edit /></IconButton>
        </Box>
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
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Acquisition Log</Typography>
        <Tooltip title="Export to CSV">
          <IconButton sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.1)' }}><FileDownload /></IconButton>
        </Tooltip>
      </Box>
      <Paper>
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
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
