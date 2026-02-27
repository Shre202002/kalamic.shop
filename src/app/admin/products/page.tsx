
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
  Button, 
  Avatar, 
  Switch,
  alpha,
  useTheme,
  useMediaQuery,
  InputBase
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Edit, 
  Delete, 
  Visibility, 
  Add, 
  Refresh, 
  Search, 
  Star,
  StarOutline,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { 
  getAdminProducts, 
  toggleProductVisibility, 
  toggleProductFeature,
  deleteProduct 
} from '@/lib/actions/admin-actions';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      toast({ variant: "destructive", title: "Sync Failed" });
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

  const handleToggleFeature = async (id: string, current: boolean) => {
    try {
      await toggleProductFeature('current-admin', id, !current);
      setProducts((prev: any) => prev.map((p: any) => p._id === id ? { ...p, is_featured: !current } : p));
      toast({ title: "Featured Updated", description: `Piece ${!current ? 'is now' : 'no longer'} featured.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Featured Update Failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to retire this piece from the catalog? It will be archived.")) return;
    try {
      await deleteProduct('current-admin', id);
      setProducts((prev) => prev.filter((p: any) => p._id !== id));
      toast({ title: "Piece Archived", description: "Successfully removed from active catalog." });
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(q) || 
      p.sku?.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'images',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) => {
        const primaryImg = params.value?.find((img: any) => img.is_primary) || params.value?.[0];
        return (
          <Avatar 
            variant="rounded" 
            src={primaryImg?.url || 'https://placehold.co/100x100?text=K'} 
            sx={{ 
              width: 44, 
              height: 44, 
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }} 
          />
        );
      }
    },
    { 
      field: 'name', 
      headerName: 'Artisan Piece', 
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>{params.value}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', display: 'block' }}>
            {params.row.sku || params.row.slug}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ₹{(params.value ?? 0).toLocaleString()}
        </Typography>
      )
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ?? 0} 
          size="small" 
          color={params.value > 5 ? 'success' : 'warning'} 
          variant={params.value === 0 ? 'filled' : 'outlined'}
          sx={{ fontWeight: 800, fontSize: '0.7rem', height: 24, borderRadius: '6px' }}
        />
      )
    },
    { 
      field: 'is_active', 
      headerName: 'Visibility', 
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch 
            checked={params.value} 
            size="small" 
            onChange={() => handleToggleVisibility(params.row._id, params.value)}
          />
          <Typography variant="caption" sx={{ fontWeight: 800, color: params.value ? 'success.main' : 'text.disabled', fontSize: '0.65rem' }}>
            {params.value ? 'LIVE' : 'HIDDEN'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 160,
      sortable: false,
      align: 'right',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={params.row.is_featured ? "Remove from Spotlight" : "Feature Piece"}>
            <IconButton size="small" onClick={() => handleToggleFeature(params.row._id, params.row.is_featured)}>
              {params.row.is_featured ? <Star sx={{ color: 'accent.main' }} /> : <StarOutline />}
            </IconButton>
          </Tooltip>
          <Tooltip title="View Piece">
            <IconButton size="small" component={Link} href={`/products/${params.row.slug}`} target="_blank">
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Piece">
            <IconButton size="small" sx={{ color: 'secondary.main' }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Retire Piece">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [products]);

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'flex-end' }, 
        mb: 5, 
        gap: 3 
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 1 }}>
            Artisan Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.7 }}>
            Manage the lifecycle of your handcrafted ceramic treasures.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'white', 
            px: 2, 
            py: 0.5, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            flex: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Search sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
            />
          </Box>
          
          <Button 
            variant="contained" 
            disableElevation 
            startIcon={<Add />} 
            component={Link} 
            href="/admin/products/new"
            sx={{ borderRadius: 3, px: 3, fontWeight: 800 }}
          >
            Create Piece
          </Button>
        </Box>
      </Box>

      <Paper sx={{ 
        border: 'none', 
        borderRadius: 4, 
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)', 
        overflow: 'hidden' 
      }}>
        <DataGrid
          rows={filteredProducts}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) }
          }}
        />
      </Paper>
    </Box>
  );
}
