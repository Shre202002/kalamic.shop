
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
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Edit, 
  Delete, 
  Add, 
  Search, 
  Inventory as InventoryIcon,
  Close,
  Save,
  Image as ImageIcon,
  Language as SeoIcon,
  LocalShipping,
  SettingsSuggest,
  HistoryEdu,
  Visibility as ViewIcon,
  ShoppingBag as OrderIcon
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

const DEFAULT_SPECS = [
  { key: "Material", value: "" },
  { key: "Finish", value: "" },
  { key: "Dimensions", value: "" }
];

const INITIAL_PRODUCT = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: '', // Note: In a real app, this would be a selection from a categories collection
  price: 0,
  compare_at_price: undefined,
  stock: 0,
  sku: '',
  is_active: true,
  is_featured: false,
  visibility_priority: 0,
  images: [{ url: '', alt: '', is_primary: true }],
  specifications: [...DEFAULT_SPECS],
  shipping: {
    weight_kg: 0,
    package_dimensions_cm: { length: 0, width: 0, height: 0 }
  },
  seo: {
    meta_title: '',
    meta_description: '',
    meta_keywords: []
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
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failed" });
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
      // Normalization for the complex Kalamic schema
      setEditingProduct({
        ...INITIAL_PRODUCT,
        ...product,
        images: product.images?.length ? product.images.map((i: any) => ({ ...i })) : INITIAL_PRODUCT.images,
        specifications: product.specifications?.length ? product.specifications.map((s: any) => ({ ...s })) : INITIAL_PRODUCT.specifications,
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
    
    // Validations
    if (!editingProduct.name || !editingProduct.slug || !editingProduct.description || !editingProduct.category_id) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Slug, Category, and Description are mandatory." });
      return;
    }

    if (editingProduct.compare_at_price && Number(editingProduct.compare_at_price) <= Number(editingProduct.price)) {
      toast({ variant: "destructive", title: "Price Error", description: "Compare price must be greater than current price." });
      return;
    }

    const hasPrimary = editingProduct.images.some((img: any) => img.is_primary);
    if (!hasPrimary && editingProduct.images.length > 0) {
      editingProduct.images[0].is_primary = true;
    }

    setIsSaving(true);
    try {
      await saveProduct(user.uid, editingProduct);
      toast({ title: "Masterpiece Saved", description: "The Kalamic catalog has been updated." });
      setDialogOpen(false);
      load();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    if (!user) return;
    try {
      await toggleProductVisibility(user.uid, id, !current);
      setProducts((prev: any) => prev.map((p: any) => p._id === id ? { ...p, is_active: !current } : p));
      toast({ title: "Visibility Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    if (!user) return;
    try {
      await toggleProductFeatured(user.uid, id, !current);
      setProducts((prev: any) => prev.map((p: any) => p._id === id ? { ...p, is_featured: !current } : p));
      toast({ title: "Featured Status Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Move this piece to archive? it will be hidden from storefront.")) return;
    try {
      await deleteProduct(user.uid, id);
      setProducts((prev) => prev.filter((p: any) => p._id !== id));
      toast({ title: "Piece Archived" });
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'images',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) => {
        const primary = params.value?.find((img: any) => img.is_primary) || params.value?.[0];
        return (
          <Avatar variant="rounded" src={primary?.url || ''} sx={{ width: 44, height: 44, bgcolor: 'background.default', border: '1px solid divider' }}>
            <ImageIcon />
          </Avatar>
        );
      }
    },
    { 
      field: 'name', 
      headerName: 'Artisan Piece', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.disabled">{params.row.sku || params.row.slug}</Typography>
        </Box>
      )
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 110,
      renderCell: (params) => `₹${(params.value ?? 0).toLocaleString()}`
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      width: 90,
      renderCell: (params) => (
        <Chip label={params.value ?? 0} size="small" color={(params.value ?? 0) > 5 ? 'success' : 'warning'} sx={{ fontWeight: 800 }} />
      )
    },
    { 
      field: 'analytics', 
      headerName: 'Stats', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', height: '100%' }}>
          <Tooltip title="Views">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ViewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{params.value?.total_views || 0}</Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Orders">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <OrderIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{params.value?.total_orders || 0}</Typography>
            </Box>
          </Tooltip>
        </Box>
      )
    },
    { 
      field: 'is_active', 
      headerName: 'Live', 
      width: 80,
      renderCell: (params) => (
        <Switch checked={!!params.value} size="small" onChange={() => handleToggleVisibility(params.row._id, !!params.value)} />
      )
    },
    { 
      field: 'is_featured', 
      headerName: 'Star', 
      width: 80,
      renderCell: (params) => (
        <Switch checked={!!params.value} size="small" color="secondary" onChange={() => handleToggleFeatured(params.row._id, !!params.value)} />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      align: 'right',
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}><Delete fontSize="small" /></IconButton>
        </Box>
      )
    }
  ], [user]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(q) || 
      p.sku?.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 5, gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Kalamic Catalog</Typography>
          <Typography variant="body2" color="text.secondary">Manage handcrafted masterpieces and track their studio performance.</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}>
            <Search sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search pieces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
            />
          </Box>

          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 3, px: 3, fontWeight: 800 }}>
            New Piece
          </Button>
        </Box>
      </Box>

      <Paper sx={{ border: 'none', borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <DataGrid
          rows={filteredProducts}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
        />
      </Paper>

      {editingProduct && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
          <DialogTitle sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{editingProduct._id ? 'Refine Creation' : 'New Ceramic Piece'}</Typography>
                <Typography variant="caption" color="text.secondary">{editingProduct.slug}</Typography>
              </Box>
              <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
                <Tab icon={<HistoryEdu fontSize="small" />} iconPosition="start" label="General" />
                <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="Media" />
                <Tab icon={<SettingsSuggest fontSize="small" />} iconPosition="start" label="Specs" />
                <Tab icon={<LocalShipping fontSize="small" />} iconPosition="start" label="Shipping" />
                <Tab icon={<SeoIcon fontSize="small" />} iconPosition="start" label="SEO" />
              </Tabs>
            </Box>

            <Box sx={{ p: 4, maxHeight: isMobile ? 'none' : 600, overflowY: 'auto' }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Product Name *" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth label="URL Slug (lowercase) *" value={editingProduct.slug} onChange={(e) => setEditingProduct({...editingProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Category ID *" value={editingProduct.category_id} onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth multiline rows={2} label="Short Hook" value={editingProduct.short_description} onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth multiline rows={4} label="Detailed Narrative *" value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02), mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Pricing & Stock</Typography>
                      <TextField fullWidth type="number" label="Price (₹)" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} sx={{ mb: 2 }} />
                      <TextField fullWidth type="number" label="Compare Price (₹)" value={editingProduct.compare_at_price || ''} onChange={(e) => setEditingProduct({...editingProduct, compare_at_price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} sx={{ mb: 2 }} />
                      <TextField fullWidth type="number" label="Stock Quantity" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} sx={{ mb: 2 }} />
                      <TextField fullWidth label="SKU" value={editingProduct.sku || ''} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} />
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Visibility</Typography>
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_active} onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})} />} label="Live in Shop" />
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_featured} onChange={(e) => setEditingProduct({...editingProduct, is_featured: e.target.checked})} />} label="Featured Piece" />
                      <TextField fullWidth type="number" label="Priority Weight" value={editingProduct.visibility_priority} onChange={(e) => setEditingProduct({...editingProduct, visibility_priority: parseInt(e.target.value) || 0})} sx={{ mt: 2 }} />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>At least one image URL is required. Mark one as Primary.</Typography>
                  {(editingProduct.images || []).map((img: any, idx: number) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <TextField fullWidth label="Image URL" size="small" value={img.url} onChange={(e) => {
                            const newImgs = [...editingProduct.images];
                            newImgs[idx].url = e.target.value;
                            setEditingProduct({...editingProduct, images: newImgs});
                          }} sx={{ mb: 2 }} />
                          <TextField fullWidth label="Alt Text" size="small" value={img.alt} onChange={(e) => {
                            const newImgs = [...editingProduct.images];
                            newImgs[idx].alt = e.target.value;
                            setEditingProduct({...editingProduct, images: newImgs});
                          }} />
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                          <FormControlLabel control={<Checkbox checked={!!img.is_primary} onChange={() => {
                            const newImgs = editingProduct.images.map((i: any, ii: number) => ({ ...i, is_primary: ii === idx }));
                            setEditingProduct({...editingProduct, images: newImgs});
                          }} />} label="Primary" />
                          <Button color="error" size="small" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images.filter((_: any, ii: number) => ii !== idx)})}>Remove</Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button startIcon={<Add />} onClick={() => setEditingProduct({...editingProduct, images: [...editingProduct.images, { url: '', alt: '', is_primary: false }]})}>Add Media</Button>
                </Box>
              )}

              {activeTab === 2 && (
                <Grid container spacing={2}>
                  {(editingProduct.specifications || []).map((spec: any, idx: number) => (
                    <Grid item xs={12} md={6} key={idx} sx={{ display: 'flex', gap: 1 }}>
                      <TextField fullWidth label="Key" value={spec.key} onChange={(e) => {
                        const s = [...editingProduct.specifications];
                        s[idx].key = e.target.value;
                        setEditingProduct({...editingProduct, specifications: s});
                      }} />
                      <TextField fullWidth label="Value" value={spec.value} onChange={(e) => {
                        const s = [...editingProduct.specifications];
                        s[idx].value = e.target.value;
                        setEditingProduct({...editingProduct, specifications: s});
                      }} />
                      <IconButton color="error" onClick={() => setEditingProduct({...editingProduct, specifications: editingProduct.specifications.filter((_: any, ii: number) => ii !== idx)})}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <Button startIcon={<Add />} onClick={() => setEditingProduct({...editingProduct, specifications: [...editingProduct.specifications, { key: '', value: '' }]})}>Add Spec</Button>
                  </Grid>
                </Grid>
              )}

              {activeTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" label="Weight (kg)" value={editingProduct.shipping?.weight_kg || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, weight_kg: parseFloat(e.target.value) || 0}})} />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField fullWidth label="Length (cm)" value={editingProduct.shipping?.package_dimensions_cm?.length || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, package_dimensions_cm: {...editingProduct.shipping.package_dimensions_cm, length: parseFloat(e.target.value) || 0}}})} />
                      <TextField fullWidth label="Width (cm)" value={editingProduct.shipping?.package_dimensions_cm?.width || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, package_dimensions_cm: {...editingProduct.shipping.package_dimensions_cm, width: parseFloat(e.target.value) || 0}}})} />
                      <TextField fullWidth label="Height (cm)" value={editingProduct.shipping?.package_dimensions_cm?.height || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...editingProduct.shipping, package_dimensions_cm: {...editingProduct.shipping.package_dimensions_cm, height: parseFloat(e.target.value) || 0}}})} />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {activeTab === 4 && (
                <Box>
                  <TextField fullWidth label="SEO Meta Title" value={editingProduct.seo?.meta_title || ''} onChange={(e) => setEditingProduct({...editingProduct, seo: {...editingProduct.seo, meta_title: e.target.value}})} sx={{ mb: 3 }} />
                  <TextField fullWidth multiline rows={3} label="SEO Meta Description" value={editingProduct.seo?.meta_description || ''} onChange={(e) => setEditingProduct({...editingProduct, seo: {...editingProduct.seo, meta_description: e.target.value}})} sx={{ mb: 3 }} />
                  <TextField fullWidth label="Keywords (comma separated)" value={(editingProduct.seo?.meta_keywords || []).join(', ')} onChange={(e) => setEditingProduct({...editingProduct, seo: {...editingProduct.seo, meta_keywords: e.target.value.split(',').map(k => k.trim())}})} />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Discard</Button>
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={20} /> : <Save />} onClick={handleSaveProduct} disabled={isSaving}>
              Save Masterpiece
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
