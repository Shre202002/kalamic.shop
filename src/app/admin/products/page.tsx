
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton, 
  Tooltip, 
  Button, 
  Avatar, 
  Switch, 
  alpha,
  useTheme,
  useMediaQuery,
  InputBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Edit, 
  Delete, 
  Add, 
  Search, 
  Close,
  Save,
  Image as ImageIcon,
  Language as SeoIcon,
  LocalShipping,
  SettingsSuggest,
  HistoryEdu,
  Visibility as ViewIcon,
  ShoppingBag as OrderIcon,
  Favorite as WishIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { 
  getAdminProducts, 
  toggleProductVisibility, 
  toggleProductFeatured,
  deleteProduct,
  saveProduct
} from '@/lib/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const INITIAL_PRODUCT = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: '', 
  price: 0,
  compare_at_price: undefined,
  stock: 0,
  sku: '',
  is_active: true,
  is_featured: false,
  visibility_priority: 0,
  images: [{ url: '', alt: '', is_primary: true }],
  specifications: [{ key: "Material", value: "" }, { key: "Finish", value: "" }],
  shipping: {
    weight_kg: 0,
    package_dimensions_cm: { length: 0, width: 0, height: 0 }
  },
  seo: {
    meta_title: '',
    meta_description: '',
    meta_keywords: []
  },
  analytics: {
    total_views: 0,
    total_orders: 0,
    wishlist_count: 0,
    average_rating: 0,
    review_count: 0
  }
};

export default function ProductsManagement() {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct({
        ...INITIAL_PRODUCT,
        ...product,
        analytics: { ...INITIAL_PRODUCT.analytics, ...product.analytics },
        images: Array.isArray(product.images) && product.images.length ? product.images.map((i: any) => ({ ...i })) : INITIAL_PRODUCT.images,
        specifications: Array.isArray(product.specifications) && product.specifications.length ? product.specifications.map((s: any) => ({ ...s })) : INITIAL_PRODUCT.specifications,
        shipping: {
          ...INITIAL_PRODUCT.shipping,
          ...product.shipping,
          package_dimensions_cm: { ...INITIAL_PRODUCT.shipping.package_dimensions_cm, ...product.shipping?.package_dimensions_cm }
        },
        seo: {
          ...INITIAL_PRODUCT.seo,
          ...product.seo,
          meta_keywords: Array.isArray(product.seo?.meta_keywords) ? [...product.seo.meta_keywords] : []
        }
      });
    } else {
      setEditingProduct({ ...INITIAL_PRODUCT, slug: `piece-${Date.now()}` });
    }
    setActiveTab(0);
    setDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!user) return;
    if (!editingProduct.name || !editingProduct.slug || !editingProduct.description || !editingProduct.category_id) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Slug, Description, and Category are required." });
      return;
    }

    setIsSaving(true);
    try {
      await saveProduct(user.uid, editingProduct);
      toast({ title: "Product Saved", description: "Artisan piece updated in Kalamic_Products." });
      setDialogOpen(false);
      load();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const columns: GridColDef[] = useMemo(() => {
    const baseCols: GridColDef[] = [
      {
        field: 'images',
        headerName: 'Preview',
        width: 70,
        renderCell: (params) => {
          const primary = params.value?.find((img: any) => img.is_primary) || params.value?.[0];
          return <Avatar variant="rounded" src={primary?.url || ''} sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}><ImageIcon /></Avatar>;
        }
      },
      { 
        field: 'name', 
        headerName: 'Artisan Piece', 
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{params.value}</Typography>
            {!isMobile && <Typography variant="caption" color="text.disabled">{params.row.sku || params.row.slug}</Typography>}
          </Box>
        )
      },
      { field: 'price', headerName: 'Price', width: 100, renderCell: (params) => `₹${(params.value ?? 0).toLocaleString()}` },
    ];

    if (!isMobile) {
      baseCols.push({ field: 'stock', headerName: 'Stock', width: 80, renderCell: (params) => <Chip label={params.value ?? 0} size="small" color={(params.value ?? 0) > 5 ? 'success' : 'warning'} /> });
    }

    if (!isTablet) {
      baseCols.push({ 
        field: 'analytics', 
        headerName: 'Performance', 
        width: 240,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Tooltip title="Views"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ViewIcon sx={{ fontSize: 14, color: 'info.main' }} /><Typography variant="caption" fontWeight={700}>{params.value?.total_views || 0}</Typography></Box></Tooltip>
            <Tooltip title="Orders"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><OrderIcon sx={{ fontSize: 14, color: 'success.main' }} /><Typography variant="caption" fontWeight={700}>{params.value?.total_orders || 0}</Typography></Box></Tooltip>
            <Tooltip title="Wishlisted"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><WishIcon sx={{ fontSize: 14, color: 'error.main' }} /><Typography variant="caption" fontWeight={700}>{params.value?.wishlist_count || 0}</Typography></Box></Tooltip>
            <Tooltip title="Rating"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><StarIcon sx={{ fontSize: 14, color: 'warning.main' }} /><Typography variant="caption" fontWeight={700}>{params.value?.average_rating || 0}</Typography></Box></Tooltip>
          </Box>
        )
      });
    }

    baseCols.push(
      { field: 'is_active', headerName: 'Live', width: 70, renderCell: (params) => <Switch checked={!!params.value} size="small" onChange={() => toggleProductVisibility(user!.uid, params.row._id, !params.value).then(load)} /> },
      {
        field: 'actions',
        headerName: '',
        width: 90,
        align: 'right',
        renderCell: (params) => (
          <Box>
            <IconButton size="small" onClick={() => handleOpenDialog(params.row)}><Edit fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={() => { if(confirm("Archive piece?")) deleteProduct(user!.uid, params.row._id).then(load) }}><Delete fontSize="small" /></IconButton>
          </Box>
        )
      }
    );

    return baseCols;
  }, [user, isMobile, isTablet]);

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'flex-end' }, 
        mb: 4,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Artisan Catalog</Typography>
          <Typography variant="body2" color="text.secondary">Managing the primary Kalamic_Products collection.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Paper sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'white', 
            px: 2, 
            py: 0.5,
            borderRadius: 3, 
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: 'none',
            width: { xs: '100%', sm: 250 }
          }}>
            <Search sx={{ color: 'text.disabled', mr: 1 }} />
            <InputBase 
              fullWidth
              placeholder="Search pieces..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              sx={{ fontSize: '0.875rem' }}
            />
          </Paper>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => handleOpenDialog()} 
            sx={{ 
              borderRadius: 3, 
              px: 3, 
              fontWeight: 800,
              height: 42,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            New Piece
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ border: 'none', borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <DataGrid
          rows={products.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
          disableRowSelectionOnClick
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }
          }}
        />
      </Paper>

      {editingProduct && (
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>{editingProduct._id ? 'Refine Creation' : 'New Ceramic Piece'}</Typography>
              <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)} 
              variant="scrollable" 
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab icon={<HistoryEdu fontSize="small" />} label="General" />
              <Tab icon={<ImageIcon fontSize="small" />} label="Media" />
              <Tab icon={<SettingsSuggest fontSize="small" />} label="Specs" />
              <Tab icon={<LocalShipping fontSize="small" />} label="Shipping" />
              <Tab icon={<SeoIcon fontSize="small" />} label="SEO" />
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 4 }, maxHeight: isMobile ? 'none' : 600, overflowY: 'auto' }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Name *" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Slug *" value={editingProduct.slug} onChange={(e) => setEditingProduct({...editingProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Category ID *" value={editingProduct.category_id} onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth multiline rows={4} label="Full Description *" value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Short Description" value={editingProduct.short_description} onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                      <TextField fullWidth type="number" label="Price (₹) *" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} sx={{ mb: 2 }} />
                      <TextField fullWidth type="number" label="Compare Price" value={editingProduct.compare_at_price || ''} onChange={(e) => setEditingProduct({...editingProduct, compare_at_price: e.target.value ? parseFloat(e.target.value) : undefined})} sx={{ mb: 2 }} />
                      <TextField fullWidth type="number" label="Stock" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} sx={{ mb: 2 }} />
                      <TextField fullWidth label="SKU" value={editingProduct.sku} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} />
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_active} onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})} />} label="Active" />
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_featured} onChange={(e) => setEditingProduct({...editingProduct, is_featured: e.target.checked})} />} label="Featured" />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 700 }}>ARTISAN GALLERY (MIN 1)</Typography>
                  {(editingProduct.images || []).map((img: any, idx: number) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                      <TextField fullWidth size="small" label="Image URL" value={img.url} onChange={(e) => {
                        const next = [...editingProduct.images]; next[idx].url = e.target.value; setEditingProduct({...editingProduct, images: next});
                      }} />
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                        <FormControlLabel control={<Checkbox checked={!!img.is_primary} onChange={() => {
                          const next = editingProduct.images.map((i: any, ii: number) => ({ ...i, is_primary: ii === idx })); setEditingProduct({...editingProduct, images: next});
                        }} />} label="Cover" />
                        <IconButton size="small" color="error" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images.filter((_: any, ii: number) => ii !== idx)})}><Delete fontSize="small" /></IconButton>
                      </Stack>
                    </Paper>
                  ))}
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setEditingProduct({...editingProduct, images: [...editingProduct.images, { url: '', alt: '', is_primary: false }]})}>Add Image</Button>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 700 }}>TECHNICAL STACK</Typography>
                  {(editingProduct.specifications || []).map((spec: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                      <TextField label="Key" fullWidth={isMobile} value={spec.key} onChange={(e) => {
                        const next = [...editingProduct.specifications]; next[idx].key = e.target.value; setEditingProduct({...editingProduct, specifications: next});
                      }} />
                      <TextField label="Value" fullWidth value={spec.value} onChange={(e) => {
                        const next = [...editingProduct.specifications]; next[idx].value = e.target.value; setEditingProduct({...editingProduct, specifications: next});
                      }} />
                      <IconButton color="error" onClick={() => setEditingProduct({...editingProduct, specifications: editingProduct.specifications.filter((_: any, ii: number) => ii !== idx)})} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}><Delete /></IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setEditingProduct({...editingProduct, specifications: [...editingProduct.specifications, { key: '', value: '' }]})}>Add Spec</Button>
                </Box>
              )}

              {activeTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>FRAGILECARE™ LOGISTICS</Typography></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Weight (kg)" value={editingProduct.shipping?.weight_kg} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, weight_kg: parseFloat(e.target.value)}})} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="L (cm)" value={editingProduct.shipping?.package_dimensions_cm?.length} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, package_dimensions_cm: {...editingProduct.shipping.package_dimensions_cm, length: parseFloat(e.target.value)}}})} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="W (cm)" value={editingProduct.shipping?.package_dimensions_cm?.width} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, package_dimensions_cm: {...editingProduct.shipping.package_dimensions_cm, width: parseFloat(e.target.value)}}})} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="H (cm)" value={editingProduct.shipping?.package_dimensions_cm?.height} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, package_dimensions_cm: {...editingProduct.shipping.package_dimensions_cm, height: parseFloat(e.target.value)}}})} /></Grid>
                </Grid>
              )}

              {activeTab === 4 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>DISCOVERY METADATA</Typography>
                  <TextField fullWidth label="Search Title" value={editingProduct.seo?.meta_title} onChange={(e) => setEditingProduct({...editingProduct, seo: {...editingProduct.seo, meta_title: e.target.value}})} />
                  <TextField fullWidth multiline rows={3} label="Meta Description" value={editingProduct.seo?.meta_description} onChange={(e) => setEditingProduct({...editingProduct, seo: {...editingProduct.seo, meta_description: e.target.value}})} />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Discard</Button>
            <Button 
              variant="contained" 
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />} 
              onClick={handleSaveProduct} 
              disabled={isSaving}
              sx={{ borderRadius: 2, px: 4, fontWeight: 800 }}
            >
              Save Creation
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
