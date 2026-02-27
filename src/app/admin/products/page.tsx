
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
  CloudSync
} from '@mui/icons-material';
import { 
  getAdminProducts, 
  toggleProductVisibility, 
  deleteProduct,
  saveProduct,
  seedInitialCatalog
} from '@/lib/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SPECS = [
  { key: "Material", value: "" },
  { key: "Finish", value: "" },
  { key: "Color", value: "" },
  { key: "Size", value: "" },
  { key: "Weight", value: "" },
  { key: "Usage", value: "" }
];

const INITIAL_PRODUCT = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
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
      // Deep normalization to ensure all nested objects exist for the controlled inputs
      const normalizedProduct = {
        ...INITIAL_PRODUCT,
        ...product,
        images: Array.isArray(product.images) && product.images.length 
          ? product.images.map((img: any) => typeof img === 'string' ? { url: img, alt: '', is_primary: false } : { ...img })
          : INITIAL_PRODUCT.images,
        specifications: Array.isArray(product.specifications) && product.specifications.length 
          ? product.specifications.map((s: any) => ({ ...s }))
          : INITIAL_PRODUCT.specifications,
        shipping: {
          ...INITIAL_PRODUCT.shipping,
          ...(product.shipping || {}),
          package_dimensions_cm: {
            ...INITIAL_PRODUCT.shipping.package_dimensions_cm,
            ...(product.shipping?.package_dimensions_cm || {})
          }
        },
        seo: {
          ...INITIAL_PRODUCT.seo,
          ...(product.seo || {}),
          meta_keywords: Array.isArray(product.seo?.meta_keywords) ? [...product.seo.meta_keywords] : []
        }
      };
      setEditingProduct(normalizedProduct);
    } else {
      setEditingProduct({ ...INITIAL_PRODUCT, slug: `piece-${Date.now()}` });
    }
    setActiveTab(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct.name || !editingProduct.slug || !editingProduct.description) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Slug and Description are required." });
      return;
    }

    setIsSaving(true);
    try {
      await saveProduct('current-admin', editingProduct);
      toast({ title: "Masterpiece Saved", description: "The artisan catalog has been synchronized." });
      handleCloseDialog();
      load();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      await toggleProductVisibility('current-admin', id, !current);
      setProducts((prev: any) => prev.map((p: any) => p._id === id ? { ...p, is_active: !current } : p));
      toast({ title: "Visibility Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This piece will be archived.")) return;
    try {
      await deleteProduct('current-admin', id);
      setProducts((prev) => prev.filter((p: any) => p._id !== id));
      toast({ title: "Piece Archived" });
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const handleSeedCatalog = async () => {
    if (!confirm("Restore baseline collection? This recreates the dropped collection.")) return;
    setIsSeeding(true);
    try {
      await seedInitialCatalog('current-admin');
      toast({ title: "Catalog Restored", description: "The baseline handcrafted pieces are now live." });
      load();
    } catch (e) {
      toast({ variant: "destructive", title: "Restoration Failed" });
    } finally {
      setIsSeeding(false);
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
        const primaryImg = Array.isArray(params.value) ? (params.value.find((img: any) => img.is_primary) || params.value[0]) : null;
        const url = typeof primaryImg === 'string' ? primaryImg : (primaryImg?.url || '');
        return (
          <Avatar variant="rounded" src={url} sx={{ width: 44, height: 44, bgcolor: 'background.default', border: '1px solid divider' }} />
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
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.disabled">{params.row.sku || params.row.slug}</Typography>
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
        <Chip label={params.value ?? 0} size="small" color={(params.value ?? 0) > 5 ? 'success' : 'warning'} sx={{ fontWeight: 800 }} />
      )
    },
    { 
      field: 'is_active', 
      headerName: 'Live', 
      width: 100,
      renderCell: (params) => (
        <Switch checked={!!params.value} size="small" onChange={() => handleToggleVisibility(params.row._id, !!params.value)} />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      align: 'right',
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}><Delete fontSize="small" /></IconButton>
        </Box>
      )
    }
  ], [products]);

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5, gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Artisan Inventory</Typography>
          <Typography variant="body2" color="text.secondary">Management hub for your structured ceramic collection.</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <Search sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search pieces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
            />
          </Box>

          <Tooltip title="Restore Dropped Collection">
            <IconButton onClick={handleSeedCatalog} disabled={isSeeding} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3 }}>
              {isSeeding ? <CircularProgress size={20} /> : <CloudSync />}
            </IconButton>
          </Tooltip>

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
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth fullScreen={isMobile}>
          <DialogTitle sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{editingProduct._id ? 'Edit Masterpiece' : 'New Creation'}</Typography>
                <Typography variant="caption" color="text.secondary">{editingProduct.slug}</Typography>
              </Box>
              <IconButton onClick={handleCloseDialog} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
                <Tab icon={<HistoryEdu fontSize="small" />} iconPosition="start" label="General" />
                <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="Media" />
                <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start" label="Inventory" />
                <Tab icon={<SettingsSuggest fontSize="small" />} iconPosition="start" label="Specs" />
                <Tab icon={<LocalShipping fontSize="small" />} iconPosition="start" label="Shipping" />
                <Tab icon={<SeoIcon fontSize="small" />} iconPosition="start" label="SEO" />
              </Tabs>
            </Box>

            <Box sx={{ p: 4, maxHeight: isMobile ? 'none' : 600, overflowY: 'auto' }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Name" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Slug" value={editingProduct.slug} onChange={(e) => setEditingProduct({...editingProduct, slug: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth multiline rows={2} label="Short Hook" value={editingProduct.short_description} onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth multiline rows={4} label="Detailed Narrative" value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Visibility</Typography>
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_active} onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})} />} label="Live in Shop" />
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_featured} onChange={(e) => setEditingProduct({...editingProduct, is_featured: e.target.checked})} />} label="Featured Piece" />
                      <TextField fullWidth type="number" label="Sort Priority" value={editingProduct.visibility_priority} onChange={(e) => setEditingProduct({...editingProduct, visibility_priority: parseInt(e.target.value) || 0})} sx={{ mt: 2 }} />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Box>
                  {(editingProduct.images || []).map((img: any, idx: number) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <TextField fullWidth label="Image URL" size="small" value={img.url} onChange={(e) => {
                            const newImgs = [...editingProduct.images];
                            newImgs[idx] = { ...newImgs[idx], url: e.target.value };
                            setEditingProduct({...editingProduct, images: newImgs});
                          }} sx={{ mb: 2 }} />
                          <TextField fullWidth label="Alt Text" size="small" value={img.alt} onChange={(e) => {
                            const newImgs = [...editingProduct.images];
                            newImgs[idx] = { ...newImgs[idx], alt: e.target.value };
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
                  <Button startIcon={<Add />} onClick={() => setEditingProduct({...editingProduct, images: [...(editingProduct.images || []), { url: '', alt: '', is_primary: false }]})}>Add Image</Button>
                </Box>
              )}

              {activeTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="number" label="Price (₹)" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} sx={{ mb: 3 }} />
                    <TextField fullWidth type="number" label="Compare Price (₹)" value={editingProduct.compare_at_price || ''} onChange={(e) => setEditingProduct({...editingProduct, compare_at_price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="SKU" value={editingProduct.sku} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} sx={{ mb: 3 }} />
                    <TextField fullWidth type="number" label="Stock" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} />
                  </Grid>
                </Grid>
              )}

              {activeTab === 3 && (
                <Grid container spacing={2}>
                  {(editingProduct.specifications || []).map((spec: any, idx: number) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <TextField fullWidth label={spec.key} value={spec.value} onChange={(e) => {
                        const newSpecs = [...editingProduct.specifications];
                        newSpecs[idx] = { ...newSpecs[idx], value: e.target.value };
                        setEditingProduct({...editingProduct, specifications: newSpecs});
                      }} />
                    </Grid>
                  ))}
                </Grid>
              )}

              {activeTab === 4 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" label="Weight (kg)" value={editingProduct.shipping?.weight_kg || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...(editingProduct.shipping || {}), weight_kg: parseFloat(e.target.value) || 0}})} />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField label="Length (cm)" value={editingProduct.shipping?.package_dimensions_cm?.length || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...(editingProduct.shipping || {}), package_dimensions_cm: {...(editingProduct.shipping?.package_dimensions_cm || {}), length: parseFloat(e.target.value) || 0}}})} />
                      <TextField label="Width (cm)" value={editingProduct.shipping?.package_dimensions_cm?.width || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...(editingProduct.shipping || {}), package_dimensions_cm: {...(editingProduct.shipping?.package_dimensions_cm || {}), width: parseFloat(e.target.value) || 0}}})} />
                      <TextField label="Height (cm)" value={editingProduct.shipping?.package_dimensions_cm?.height || 0} onChange={(e) => setEditingProduct({...editingProduct, shipping: {...(editingProduct.shipping || {}), package_dimensions_cm: {...(editingProduct.shipping?.package_dimensions_cm || {}), height: parseFloat(e.target.value) || 0}}})} />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {activeTab === 5 && (
                <Box>
                  <TextField fullWidth label="SEO Title" value={editingProduct.seo?.meta_title || ''} onChange={(e) => setEditingProduct({...editingProduct, seo: {...(editingProduct.seo || {}), meta_title: e.target.value}})} sx={{ mb: 3 }} />
                  <TextField fullWidth multiline rows={3} label="SEO Description" value={editingProduct.seo?.meta_description || ''} onChange={(e) => setEditingProduct({...editingProduct, seo: {...(editingProduct.seo || {}), meta_description: e.target.value}})} sx={{ mb: 3 }} />
                  <TextField fullWidth label="Keywords (comma separated)" value={(editingProduct.seo?.meta_keywords || []).join(', ')} onChange={(e) => setEditingProduct({...editingProduct, seo: {...(editingProduct.seo || {}), meta_keywords: e.target.value.split(',').map(k => k.trim())}})} />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.divider, 0.02), borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={handleCloseDialog} color="inherit">Discard</Button>
            <Button variant="contained" startIcon={isSaving ? <CircularProgress size={20} /> : <Save />} onClick={handleSaveProduct} disabled={isSaving}>Save Masterpiece</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
