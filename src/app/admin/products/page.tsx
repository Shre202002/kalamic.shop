
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
  Divider,
  FormHelperText,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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
  Star as StarIcon,
  CloudUpload,
  QuestionAnswer as FaqIcon
} from '@mui/icons-material';
import {
  getAdminProducts,
  toggleProductVisibility,
  deleteProduct,
  getCategories
} from '@/lib/actions/admin-actions';
import { uploadToImageKit } from '@/lib/actions/upload-actions';
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
  specifications: [{ key: "Material", value: "Handcrafted Ceramic", commonValue: "Mass produced plastic/resin" }],
  faqs: [{ question: "", answer: "" }],
  shipping: {
    weight_kg: 0,
    shape: 'rectangular',
    package_dimensions_cm: { length: 0, width: 0, height: 0, diameter: 0 }
  },
  requiresHandling: true,
  requiresPremiumProtection: true,
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

const NEW_PRODUCT_DRAFT_KEY = 'kalamic-admin-new-product-draft-v1';

export default function ProductsManagement() {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [shippingShape, setShippingShape] = useState('rectangular');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [pData, cData] = await Promise.all([getAdminProducts(), getCategories()]);
      setProducts(pData);
      setCategories(cData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  // Keep an unsaved new-product draft for this browser tab. sessionStorage
  // survives dialog close/navigation within the tab but is cleared on refresh.
  useEffect(() => {
    if (!dialogOpen || !editingProduct || editingProduct._id) return;
    try {
      sessionStorage.setItem(NEW_PRODUCT_DRAFT_KEY, JSON.stringify({
        product: editingProduct,
        shippingShape,
        activeTab,
      }));
    } catch (error) {
      console.warn('[PRODUCT_DRAFT_SAVE_FAILED]', error);
    }
  }, [dialogOpen, editingProduct, shippingShape, activeTab]);

  const handleOpenDialog = (product?: any) => {
    if (product) {
      const dims = product.shipping?.package_dimensions_cm || {};
      let detectedShape = product.shipping?.shape || 'rectangular';
      
      if (!product.shipping?.shape) {
        if (dims.diameter) detectedShape = 'circular';
        else if (dims.length === dims.width && dims.length > 0) detectedShape = 'square';
      }

      setShippingShape(detectedShape);
      setEditingProduct({
        ...INITIAL_PRODUCT,
        ...product,
        category_id: product.category_id?.toString() || '',
        analytics: { ...INITIAL_PRODUCT.analytics, ...product.analytics },
        images: Array.isArray(product.images) && product.images.length ? product.images.map((i: any) => ({ ...i })) : INITIAL_PRODUCT.images,
        specifications: Array.isArray(product.specifications) && product.specifications.length ? product.specifications.map((s: any) => ({ 
          key: s.key || '', 
          value: s.value || '', 
          commonValue: s.commonValue || '' 
        })) : INITIAL_PRODUCT.specifications,
        faqs: Array.isArray(product.faqs) && product.faqs.length ? product.faqs.map((f: any) => ({ ...f })) : INITIAL_PRODUCT.faqs,
        shipping: {
          ...INITIAL_PRODUCT.shipping,
          ...product.shipping,
          shape: detectedShape,
          package_dimensions_cm: { 
            length: dims.length || 0,
            width: dims.width || 0,
            height: dims.height || 0,
            diameter: dims.diameter || 0
          }
        },
        requiresHandling: product.requiresHandling ?? true,
        requiresPremiumProtection: product.requiresPremiumProtection ?? true,
        seo: {
          ...INITIAL_PRODUCT.seo,
          ...product.seo,
          meta_keywords: Array.isArray(product.seo?.meta_keywords) ? product.seo.meta_keywords : []
        }
      });
    } else {
      let restoredDraft: any = null;
      try {
        const saved = sessionStorage.getItem(NEW_PRODUCT_DRAFT_KEY);
        if (saved) restoredDraft = JSON.parse(saved);
      } catch (error) {
        console.warn('[PRODUCT_DRAFT_RESTORE_FAILED]', error);
      }

      if (restoredDraft?.product) {
        const savedProduct = restoredDraft.product;
        setShippingShape(restoredDraft.shippingShape || savedProduct.shipping?.shape || 'rectangular');
        setEditingProduct({
          ...INITIAL_PRODUCT,
          ...savedProduct,
          shipping: {
            ...INITIAL_PRODUCT.shipping,
            ...savedProduct.shipping,
            package_dimensions_cm: {
              ...INITIAL_PRODUCT.shipping.package_dimensions_cm,
              ...savedProduct.shipping?.package_dimensions_cm,
            },
          },
          seo: { ...INITIAL_PRODUCT.seo, ...savedProduct.seo },
        });
        if (typeof restoredDraft.activeTab === 'number') setActiveTab(restoredDraft.activeTab);
        toast({ title: 'Draft Restored', description: 'Your unsaved product details are back.' });
      } else {
        setShippingShape('rectangular');
        setEditingProduct({ ...INITIAL_PRODUCT, slug: `piece-${Date.now()}` });
      }
    }
    if (product) setActiveTab(0);
    setDialogOpen(true);
  };

  const handleFileChange = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', '/kalamic/products');

      const productName = editingProduct.name?.trim() || 'kalamic ceramic decor Kanpur';
      const seoName = `${productName} img ${idx + 1} handcrafted ceramic Kanpur`;
      formData.append('seoName', seoName);

      const result = await uploadToImageKit(formData);

      const next = [...editingProduct.images];
      next[idx].url = result.url;
      setEditingProduct({ ...editingProduct, images: next });
      toast({ title: "Image Uploaded", description: "Media successfully stored in ImageKit." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSaveProduct = async () => {
    if (!user) return;

    if (!editingProduct.name || !editingProduct.slug || !editingProduct.description || !editingProduct.category_id) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name, Slug, Description, and Category are required." });
      return;
    }

    let finalDims = { ...editingProduct.shipping.package_dimensions_cm };
    const cleanNum = (val: any) => (isNaN(val) || val === '' || val === undefined) ? null : Number(val);

    if (shippingShape === 'circular' || shippingShape === 'cylinder') {
      finalDims.length = null;
      finalDims.width = null;
      finalDims.diameter = cleanNum(finalDims.diameter);
    } else if (shippingShape === 'square') {
      finalDims.width = cleanNum(finalDims.length);
      finalDims.length = cleanNum(finalDims.length);
      finalDims.diameter = null;
    } else {
      finalDims.length = cleanNum(finalDims.length);
      finalDims.width = cleanNum(finalDims.width);
      finalDims.diameter = null;
    }
    finalDims.height = cleanNum(finalDims.height);

    const payload = {
      ...editingProduct,
      adminId: user.uid,
      shipping: {
        ...editingProduct.shipping,
        shape: shippingShape,
        package_dimensions_cm: finalDims
      },
      specifications: editingProduct.specifications.map((s: any) => ({
        key: s.key?.trim() || '',
        value: s.value?.trim() || '',
        commonValue: s.commonValue?.trim() || ''
      }))
    };

    setIsSaving(true);
    try {
      const method = editingProduct._id ? 'PATCH' : 'POST';
      const url = editingProduct._id ? `/api/admin/products/${editingProduct._id}` : '/api/admin/products';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Save operation failed');

      toast({ title: "Product Saved", description: "Artisan piece updated in catalog." });
      if (!editingProduct._id) {
        try { sessionStorage.removeItem(NEW_PRODUCT_DRAFT_KEY); } catch { /* storage unavailable */ }
      }
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
            <IconButton size="small" color="error" onClick={() => { if (confirm("Archive piece?")) deleteProduct(user!.uid, params.row._id).then(load) }}><Delete fontSize="small" /></IconButton>
          </Box>
        )
      }
    );

    return baseCols;
  }, [user, isMobile, isTablet]);

  const updateSpec = (idx: number, field: string, val: string) => {
    const next = [...editingProduct.specifications];
    next[idx][field] = val;
    setEditingProduct({ ...editingProduct, specifications: next });
  };

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
          <Typography variant="body2" color="text.secondary">Managing the primary Kalamic_Products collection with comparison data.</Typography>
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
              <Tab icon={<FaqIcon fontSize="small" />} label="FAQs" />
              <Tab icon={<LocalShipping fontSize="small" />} label="Shipping" />
              <Tab icon={<SeoIcon fontSize="small" />} label="SEO" />
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 4 }, maxHeight: isMobile ? 'none' : 600, overflowY: 'auto' }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Name *" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Slug *" value={editingProduct.slug} onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} sx={{ mb: 3 }} />
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Artisan Classification (Category) *</InputLabel>
                      <Select
                        value={editingProduct.category_id}
                        label="Artisan Classification (Category) *"
                        onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                      >
                        {categories.map((cat: any) => (
                          <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField fullWidth multiline rows={4} label="Full Description *" value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} sx={{ mb: 3 }} />
                    <TextField fullWidth label="Short Description" value={editingProduct.short_description} onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                      <TextField fullWidth type="number" label="Price (₹) *" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} sx={{ mb: 2 }} />
                      <TextField fullWidth type="number" label="Compare Price" value={editingProduct.compare_at_price || ''} onChange={(e) => setEditingProduct({ ...editingProduct, compare_at_price: e.target.value ? parseFloat(e.target.value) : undefined })} sx={{ mb: 2 }} />
                      <TextField fullWidth type="number" label="Stock" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} sx={{ mb: 2 }} />
                      <TextField fullWidth label="SKU" value={editingProduct.sku} onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_active} onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })} />} label="Active" />
                      <FormControlLabel control={<Switch checked={!!editingProduct.is_featured} onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })} />} label="Featured" />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 700 }}>ARTISAN GALLERY (MIN 1)</Typography>
                  {(editingProduct.images || []).map((img: any, idx: number) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 3, borderStyle: 'dashed', borderColor: alpha(theme.palette.divider, 0.2) }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Box sx={{
                            position: 'relative',
                            width: '100%',
                            height: 140,
                            bgcolor: alpha(theme.palette.background.default, 0.8),
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}>
                            {img.url ? (
                              <>
                                <img src={img.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <IconButton
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    '&:hover': { bgcolor: 'white' },
                                    boxShadow: theme.shadows[2]
                                  }}
                                  onClick={() => {
                                    const next = [...editingProduct.images];
                                    next[idx].url = '';
                                    setEditingProduct({ ...editingProduct, images: next });
                                  }}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
                              <Button
                                component="label"
                                disabled={uploadingIdx === idx}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  flexDirection: 'column',
                                  gap: 1,
                                  color: 'text.secondary'
                                }}
                              >
                                {uploadingIdx === idx ? (
                                  <CircularProgress size={32} thickness={5} />
                                ) : (
                                  <>
                                    <CloudUpload sx={{ fontSize: 32, opacity: 0.5 }} />
                                    <Typography variant="caption" fontWeight={700}>Select File</Typography>
                                  </>
                                )}
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(idx, e)}
                                />
                              </Button>
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Image ALT Text (SEO) *"
                            placeholder="Example: Handmade Ceramic Mandala Wheel with Golden Finish"
                            value={img.alt}
                            error={img.url && img.alt.length < 5}
                            onChange={(e) => {
                              const next = [...editingProduct.images]; next[idx].alt = e.target.value; setEditingProduct({ ...editingProduct, images: next });
                            }}
                            sx={{ mb: 1 }}
                          />
                          <FormHelperText sx={{ mb: 2 }}>Tip: Describe what is visible in the image (min 5 chars). Required for search engines.</FormHelperText>

                          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <FormControlLabel control={<Checkbox checked={!!img.is_primary} onChange={() => {
                              const next = editingProduct.images.map((i: any, ii: number) => ({ ...i, is_primary: ii === idx })); setEditingProduct({ ...editingProduct, images: next });
                            }} />} label={<Typography variant="caption" fontWeight={700}>Primary Cover</Typography>} />
                            <Button size="small" color="error" startIcon={<Delete />} onClick={() => setEditingProduct({ ...editingProduct, images: editingProduct.images.filter((_: any, ii: number) => ii !== idx) })}>Remove Slot</Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setEditingProduct({ ...editingProduct, images: [...editingProduct.images, { url: '', alt: '', is_primary: false }] })}>Add Another Image</Button>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                      TECHNICAL PRECISION — COMPARISON
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                      Add Kalamic value and common market comparison for each specification row.
                    </Typography>
                  </Box>

                  {(editingProduct.specifications || []).map((spec: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                      <Box sx={{ width: '25%' }}>
                        <TextField 
                          fullWidth size="small" label="Feature Key" 
                          placeholder="e.g. Material"
                          value={spec.key} 
                          onChange={(e) => updateSpec(idx, 'key', e.target.value)} 
                        />
                      </Box>
                      <Box sx={{ width: '35%' }}>
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, mb: 0.5, display: 'block', fontSize: '0.6rem' }}>
                          🏺 KALAMIC VALUE
                        </Typography>
                        <TextField 
                          fullWidth size="small" 
                          placeholder="e.g. Handcrafted Ceramic"
                          value={spec.value} 
                          onChange={(e) => updateSpec(idx, 'value', e.target.value)} 
                        />
                      </Box>
                      <Box sx={{ width: '35%' }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, mb: 0.5, display: 'block', fontSize: '0.6rem' }}>
                          🏭 COMMON VALUE
                        </Typography>
                        <TextField 
                          fullWidth size="small" 
                          placeholder="e.g. Mass produced resin"
                          value={spec.commonValue} 
                          onChange={(e) => updateSpec(idx, 'commonValue', e.target.value)} 
                        />
                      </Box>
                      <Box sx={{ pt: 3 }}>
                        <IconButton color="error" size="small" onClick={() => setEditingProduct({ ...editingProduct, specifications: editingProduct.specifications.filter((_: any, ii: number) => ii !== idx) })}>
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setEditingProduct({ ...editingProduct, specifications: [...editingProduct.specifications, { key: '', value: '', commonValue: '' }] })}>
                    Add Comparison Row
                  </Button>

                  {editingProduct.specifications?.length > 0 && (
                    <Box sx={{ mt: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block' }}>
                        STUDIO PREVIEW
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase' }}>Feature</TableCell>
                              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', color: 'primary.main' }}>🏺 Kalamic</TableCell>
                              <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', color: 'text.disabled' }}>🏭 Common</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {editingProduct.specifications.filter((s: any) => s.key).map((spec: any, i: number) => (
                              <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: alpha('#000', 0.01) } }}>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{spec.key}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.7rem' }}>{spec.value}</TableCell>
                                <TableCell sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>{spec.commonValue || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 700 }}>PRODUCT-SPECIFIC FAQS</Typography>
                  {(editingProduct.faqs || []).map((faq: any, idx: number) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="caption" fontWeight={800} color="primary">FAQ #{idx + 1}</Typography>
                        <IconButton size="small" color="error" onClick={() => {
                          const next = editingProduct.faqs.filter((_: any, ii: number) => ii !== idx);
                          setEditingProduct({ ...editingProduct, faqs: next.length ? next : [{ question: '', answer: '' }] });
                        }}><Delete fontSize="small" /></IconButton>
                      </Box>
                      <TextField
                        fullWidth
                        label="Question"
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...editingProduct.faqs];
                          next[idx] = { ...next[idx], question: e.target.value };
                          setEditingProduct({ ...editingProduct, faqs: next });
                        }}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Answer"
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...editingProduct.faqs];
                          next[idx] = { ...next[idx], answer: e.target.value };
                          setEditingProduct({ ...editingProduct, faqs: next });
                        }}
                      />
                    </Paper>
                  ))}
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setEditingProduct({ ...editingProduct, faqs: [...editingProduct.faqs, { question: '', answer: '' }] })}>Add FAQ</Button>
                </Box>
              )}

              {activeTab === 4 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>FRAGILECARE™ LOGISTICS</Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Product Shape</InputLabel>
                        <Select
                          value={shippingShape}
                          label="Product Shape"
                          onChange={(e) => setShippingShape(e.target.value)}
                        >
                          <MenuItem value="rectangular">Rectangular / Square Box</MenuItem>
                          <MenuItem value="circular">Circular / Round</MenuItem>
                          <MenuItem value="square">Square</MenuItem>
                          <MenuItem value="cylinder">Cylindrical / Pillar</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField 
                        fullWidth type="number" label="Weight (kg)" 
                        value={editingProduct.shipping?.weight_kg || ''} 
                        onChange={(e) => setEditingProduct({ ...editingProduct, shipping: { ...editingProduct.shipping, weight_kg: e.target.value === '' ? null : parseFloat(e.target.value) } })} 
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, mb: 2, display: 'block', color: 'primary.main' }}>PACKAGE DIMENSIONS (CM)</Typography>
                    
                    <Grid container spacing={3}>
                      {shippingShape === 'rectangular' && (
                        <>
                          <Grid item xs={4}><TextField fullWidth label="L (cm)" value={editingProduct.shipping?.package_dimensions_cm?.length || ''} onChange={(e) => setEditingProduct({ ...editingProduct, shipping: { ...editingProduct.shipping, package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, length: e.target.value === '' ? null : parseFloat(e.target.value) } } })} /></Grid>
                          <Grid item xs={4}><TextField fullWidth label="W (cm)" value={editingProduct.shipping?.package_dimensions_cm?.width || ''} onChange={(e) => setEditingProduct({ ...editingProduct, shipping: { ...editingProduct.shipping, package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, width: e.target.value === '' ? null : parseFloat(e.target.value) } } })} /></Grid>
                        </>
                      )}
                      
                      {(shippingShape === 'circular' || shippingShape === 'cylinder') && (
                        <Grid item xs={8}><TextField fullWidth label="Diameter (cm)" value={editingProduct.shipping?.package_dimensions_cm?.diameter || ''} onChange={(e) => setEditingProduct({ ...editingProduct, shipping: { ...editingProduct.shipping, package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, diameter: e.target.value === '' ? null : parseFloat(e.target.value) } } })} /></Grid>
                      )}

                      {shippingShape === 'square' && (
                        <Grid item xs={8}><TextField fullWidth label="Side (cm)" value={editingProduct.shipping?.package_dimensions_cm?.length || ''} onChange={(e) => setEditingProduct({ ...editingProduct, shipping: { ...editingProduct.shipping, package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, length: e.target.value === '' ? null : parseFloat(e.target.value), width: e.target.value === '' ? null : parseFloat(e.target.value) } } })} /></Grid>
                      )}

                      <Grid item xs={4}><TextField fullWidth label="H (cm)" value={editingProduct.shipping?.package_dimensions_cm?.height || ''} onChange={(e) => setEditingProduct({ ...editingProduct, shipping: { ...editingProduct.shipping, package_dimensions_cm: { ...editingProduct.shipping.package_dimensions_cm, height: e.target.value === '' ? null : parseFloat(e.target.value) } } })} /></Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 900, 
                      mb: 3,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontSize: '0.75rem'
                    }}>
                      Logistics Charges
                    </Typography>

                    {/* Handling Toggle */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2.5,
                      borderRadius: '1rem',
                      border: '1px solid',
                      borderColor: editingProduct.requiresHandling ? theme.palette.primary.main : 'divider',
                      bgcolor: editingProduct.requiresHandling ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                      mb: 2,
                      transition: 'all 0.2s'
                    }}>
                      <Box>
                        <Typography fontWeight={800} fontSize="0.85rem">
                          Artisan Handling — ₹40
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {editingProduct.requiresHandling ? 'Charged to customer' : 'FREE for this product'}
                        </Typography>
                      </Box>
                      <Switch
                        checked={editingProduct.requiresHandling}
                        onChange={(e) => setEditingProduct({ ...editingProduct, requiresHandling: e.target.checked })}
                        color="primary"
                      />
                    </Box>

                    {/* Premium Protection Toggle */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2.5,
                      borderRadius: '1rem',
                      border: '1px solid',
                      borderColor: editingProduct.requiresPremiumProtection ? theme.palette.primary.main : 'divider',
                      bgcolor: editingProduct.requiresPremiumProtection ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                      transition: 'all 0.2s'
                    }}>
                      <Box>
                        <Typography fontWeight={800} fontSize="0.85rem">
                          Premium Protection — ₹20
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {editingProduct.requiresPremiumProtection ? 'Charged to customer' : 'FREE for this product'}
                        </Typography>
                      </Box>
                      <Switch
                        checked={editingProduct.requiresPremiumProtection}
                        onChange={(e) => setEditingProduct({ ...editingProduct, requiresPremiumProtection: e.target.checked })}
                        color="primary"
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic', fontSize: '0.65rem' }}>
                      💡 Disable handling for small/light products (fridge magnets, photo frames). Disable premium protection for non-fragile items.
                    </Typography>
                  </Box>
                </Box>
              )}

              {activeTab === 5 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>DISCOVERY METADATA</Typography>
                  <TextField
                    fullWidth
                    label="Search Title"
                    value={editingProduct.seo?.meta_title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seo: { ...editingProduct.seo, meta_title: e.target.value } })}
                  />
                  <TextField
                    fullWidth
                    label="Meta Keywords (Comma separated)"
                    placeholder="handmade, ceramic, indian decor"
                    value={Array.isArray(editingProduct.seo?.meta_keywords) ? editingProduct.seo.meta_keywords.join(', ') : (editingProduct.seo?.meta_keywords || '')}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seo: { ...editingProduct.seo, meta_keywords: e.target.value.split(',').map((k: string) => k.trim()) }
                    })}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Meta Description"
                    value={editingProduct.seo?.meta_description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seo: { ...editingProduct.seo, meta_description: e.target.value } })}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>
              Close &amp; Keep Draft
            </Button>
            <Button
              variant="contained"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleSaveProduct}
              disabled={isSaving || uploadingIdx !== null}
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
