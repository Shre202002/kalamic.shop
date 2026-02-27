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
  InputBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Edit, 
  Delete, 
  Visibility, 
  Add, 
  Search, 
  Star,
  StarOutline,
  Inventory as InventoryIcon,
  Close,
  Save,
  Image as ImageIcon,
  Language as SeoIcon,
  LocalShipping,
  SettingsSuggest,
  HistoryEdu
} from '@mui/icons-material';
import { 
  getAdminProducts, 
  toggleProductVisibility, 
  toggleProductFeature,
  deleteProduct,
  saveProduct
} from '@/lib/actions/admin-actions';
import Link from 'next/link';
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
  compare_at_price: 0,
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
  
  // CRUD Dialog State
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

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct({ ...product });
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
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Slug and Description are required." });
      return;
    }

    setIsSaving(true);
    try {
      await saveProduct('current-admin', editingProduct);
      toast({ title: editingProduct._id ? "Piece Updated" : "Piece Created", description: "The artisan catalog has been synchronized." });
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
    if (!confirm("Are you sure you want to retire this piece? It will be archived.")) return;
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
            <IconButton size="small" onClick={() => handleOpenDialog(params.row)} sx={{ color: 'secondary.main' }}>
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
            Complete lifecycle management for your handcrafted ceramic treasures.
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
            onClick={() => handleOpenDialog()}
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

      {/* CRUD DIALOG */}
      {editingProduct && (
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, overflow: 'hidden' } }}
        >
          <DialogTitle sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {editingProduct._id ? 'Refine Masterpiece' : 'New Artisan Piece'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingProduct.slug || 'Draft Piece'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small"><Close /></IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)} 
                variant="scrollable" 
                scrollButtons="auto"
                sx={{ px: 2 }}
              >
                <Tab icon={<HistoryEdu fontSize="small" />} iconPosition="start" label="General" />
                <Tab icon={<ImageIcon fontSize="small" />} iconPosition="start" label="Media" />
                <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start" label="Stock & Price" />
                <Tab icon={<SettingsSuggest fontSize="small" />} iconPosition="start" label="Specs" />
                <Tab icon={<LocalShipping fontSize="small" />} iconPosition="start" label="Logistics" />
                <Tab icon={<SeoIcon fontSize="small" />} iconPosition="start" label="SEO" />
              </Tabs>
            </Box>

            <Box sx={{ p: 4, maxHeight: isMobile ? 'calc(100vh - 180px)' : 600, overflowY: 'auto' }}>
              {/* Tab 0: General Info */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField 
                      fullWidth 
                      label="Piece Name" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      sx={{ mb: 3 }}
                    />
                    <TextField 
                      fullWidth 
                      label="URL Slug" 
                      value={editingProduct.slug}
                      onChange={(e) => setEditingProduct({...editingProduct, slug: e.target.value})}
                      sx={{ mb: 3 }}
                    />
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={2} 
                      label="Short Hook" 
                      placeholder="Catchy 1-sentence description"
                      value={editingProduct.short_description}
                      onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})}
                      sx={{ mb: 3 }}
                    />
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={4} 
                      label="Detailed Narrative" 
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Catalog Status</Typography>
                      <FormControlLabel
                        control={<Switch checked={editingProduct.is_active} onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})} />}
                        label="Visible in Shop"
                        sx={{ mb: 1, display: 'block' }}
                      />
                      <FormControlLabel
                        control={<Switch checked={editingProduct.is_featured} onChange={(e) => setEditingProduct({...editingProduct, is_featured: e.target.checked})} />}
                        label="Featured in Spotlight"
                        sx={{ mb: 2, display: 'block' }}
                      />
                      <TextField 
                        fullWidth 
                        type="number" 
                        label="Display Priority" 
                        value={editingProduct.visibility_priority}
                        onChange={(e) => setEditingProduct({...editingProduct, visibility_priority: parseInt(e.target.value)})}
                        helperText="Higher numbers appear first"
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Tab 1: Media */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Product Imagery</Typography>
                  {editingProduct.images.map((img: any, idx: number) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 3, position: 'relative' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <TextField 
                            fullWidth 
                            label="Image URL" 
                            size="small" 
                            value={img.url}
                            onChange={(e) => {
                              const newImgs = [...editingProduct.images];
                              newImgs[idx].url = e.target.value;
                              setEditingProduct({...editingProduct, images: newImgs});
                            }}
                            sx={{ mb: 2 }}
                          />
                          <TextField 
                            fullWidth 
                            label="Alt Text" 
                            size="small" 
                            value={img.alt}
                            onChange={(e) => {
                              const newImgs = [...editingProduct.images];
                              newImgs[idx].alt = e.target.value;
                              setEditingProduct({...editingProduct, images: newImgs});
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                          <FormControlLabel
                            control={<Checkbox checked={img.is_primary} onChange={(e) => {
                              const newImgs = editingProduct.images.map((i: any, iidx: number) => ({ ...i, is_primary: iidx === idx }));
                              setEditingProduct({...editingProduct, images: newImgs});
                            }} />}
                            label="Primary Image"
                          />
                          {editingProduct.images.length > 1 && (
                            <Button color="error" size="small" onClick={() => {
                              const newImgs = editingProduct.images.filter((_: any, iidx: number) => iidx !== idx);
                              setEditingProduct({...editingProduct, images: newImgs});
                            }}>Remove</Button>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button startIcon={<Add />} onClick={() => setEditingProduct({...editingProduct, images: [...editingProduct.images, { url: '', alt: '', is_primary: false }]})}>
                    Add Image Layer
                  </Button>
                </Box>
              )}

              {/* Tab 2: Pricing & Inventory */}
              {activeTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Pricing Structure</Typography>
                      <TextField 
                        fullWidth 
                        type="number" 
                        label="Selling Price (₹)" 
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                        sx={{ mb: 3 }}
                      />
                      <TextField 
                        fullWidth 
                        type="number" 
                        label="Compare at Price (₹)" 
                        value={editingProduct.compare_at_price}
                        onChange={(e) => setEditingProduct({...editingProduct, compare_at_price: parseFloat(e.target.value)})}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>Kiln Inventory</Typography>
                      <TextField 
                        fullWidth 
                        label="Artisan SKU" 
                        value={editingProduct.sku}
                        onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                        sx={{ mb: 3 }}
                      />
                      <TextField 
                        fullWidth 
                        type="number" 
                        label="Available Stock" 
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Tab 3: Specifications */}
              {activeTab === 3 && (
                <Grid container spacing={2}>
                  {editingProduct.specifications.map((spec: any, idx: number) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <TextField 
                        fullWidth 
                        label={spec.key} 
                        value={spec.value}
                        onChange={(e) => {
                          const newSpecs = [...editingProduct.specifications];
                          newSpecs[idx].value = e.target.value;
                          setEditingProduct({...editingProduct, specifications: newSpecs});
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Tab 4: Logistics */}
              {activeTab === 4 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      fullWidth 
                      type="number" 
                      label="Weight (kg)" 
                      value={editingProduct.shipping.weight_kg}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct, 
                        shipping: { ...editingProduct.shipping, weight_kg: parseFloat(e.target.value) }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 800 }}>Dimensions (L x W x H cm)</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField 
                        type="number" 
                        label="L" 
                        size="small"
                        value={editingProduct.shipping.package_dimensions_cm.length}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          shipping: { 
                            ...editingProduct.shipping, 
                            package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, length: parseFloat(e.target.value) } 
                          }
                        })}
                      />
                      <TextField 
                        type="number" 
                        label="W" 
                        size="small"
                        value={editingProduct.shipping.package_dimensions_cm.width}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          shipping: { 
                            ...editingProduct.shipping, 
                            package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, width: parseFloat(e.target.value) } 
                          }
                        })}
                      />
                      <TextField 
                        type="number" 
                        label="H" 
                        size="small"
                        value={editingProduct.shipping.package_dimensions_cm.height}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          shipping: { 
                            ...editingProduct.shipping, 
                            package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, height: parseFloat(e.target.value) } 
                          }
                        })}
                      />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Tab 5: SEO */}
              {activeTab === 5 && (
                <Box>
                  <TextField 
                    fullWidth 
                    label="Search Title" 
                    value={editingProduct.seo.meta_title}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seo: { ...editingProduct.seo, meta_title: e.target.value }
                    })}
                    sx={{ mb: 3 }}
                  />
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={3} 
                    label="Search Description" 
                    value={editingProduct.seo.meta_description}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seo: { ...editingProduct.seo, meta_description: e.target.value }
                    })}
                    sx={{ mb: 3 }}
                  />
                  <TextField 
                    fullWidth 
                    label="Keywords (Comma separated)" 
                    value={editingProduct.seo.meta_keywords.join(', ')}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seo: { ...editingProduct.seo, meta_keywords: e.target.value.split(',').map(k => k.trim()) }
                    })}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.divider, 0.02), borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={handleCloseDialog} color="inherit">Discard</Button>
            <Button 
              variant="contained" 
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />} 
              onClick={handleSaveProduct}
              disabled={isSaving}
              sx={{ px: 4, borderRadius: 2 }}
            >
              {isSaving ? 'Syncing...' : 'Save Masterpiece'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
