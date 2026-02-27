
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Tooltip, Skeleton, Button, Avatar, Switch } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Visibility, Add, Refresh } from '@mui/icons-material';
import { getAdminProducts, toggleProductVisibility, deleteProduct } from '@/lib/actions/admin-actions';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      await toggleProductVisibility('current-admin', id, !current);
      setProducts((prev: any) => prev.map((p: any) => p._id === id ? { ...p, is_active: !current } : p));
      toast({ title: "Visibility Updated", description: `Piece is now ${!current ? 'live' : 'hidden'}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to retire this piece from the catalog?")) return;
    try {
      await deleteProduct('current-admin', id);
      setProducts((prev) => prev.filter((p: any) => p._id !== id));
      toast({ title: "Piece Retired", description: "Successfully removed from catalog." });
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'images',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) => (
        <Avatar 
          variant="rounded" 
          src={params.value?.[0] || 'https://placehold.co/100x100'} 
          sx={{ width: 40, height: 40 }} 
        />
      )
    },
    { 
      field: 'name', 
      headerName: 'Piece Name', 
      width: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
        </Box>
      )
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      renderCell: (params) => `₹${(params.value ?? 0).toLocaleString()}`
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ?? 0} 
          size="small" 
          color={params.value > 10 ? 'success' : 'warning'} 
          variant="outlined"
        />
      )
    },
    { 
      field: 'is_active', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Switch 
            checked={params.value} 
            size="small" 
            onChange={() => handleToggleVisibility(params.row._id, params.value)}
          />
          <Typography variant="caption" sx={{ ml: 1, fontWeight: 700 }}>
            {params.value ? 'LIVE' : 'HIDDEN'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Piece">
            <IconButton size="small" component={Link} href={`/products/${params.row.slug}`} target="_blank"><Visibility /></IconButton>
          </Tooltip>
          <Tooltip title="Edit Piece">
            <IconButton size="small"><Edit /></IconButton>
          </Tooltip>
          <Tooltip title="Delete Piece">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}><Delete /></IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [products]);

  if (!mounted) return <Skeleton variant="rectangular" height={600} />;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">Artisan Inventory</Typography>
          <Typography variant="body2" color="text.secondary">Manage your handcrafted catalog and stock levels.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Refresh</Button>
          <Button variant="contained" color="primary" startIcon={<Add />} component={Link} href="/admin/products/new">
            Add New Piece
          </Button>
        </Box>
      </Box>

      <Paper>
        <DataGrid
          rows={products}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          initialState={{ 
            pagination: { paginationModel: { pageSize: 10 } } 
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-cell:focus': { outline: 'none' } }}
        />
      </Paper>
    </Box>
  );
}
