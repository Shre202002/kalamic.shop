
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Stack, 
  alpha, 
  useTheme, 
  TextField, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  ToggleButtonGroup, 
  ToggleButton, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  IconButton, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Switch, 
  FormControlLabel, 
  LinearProgress,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Image as ImageIcon, 
  Movie as VideoIcon, 
  Search, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  CloudUpload, 
  PlayArrow, 
  Star as StarIcon,
  FilterList
} from '@mui/icons-material';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getGalleryItems } from '@/lib/actions/gallery-actions';

const CATEGORIES = ['Pillars & Stambh', 'Photo Frames', 'Wall Art', 'Mandala', 'Gifting', 'Other'];

export default function GalleryStudio() {
  const theme = useTheme();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [mediaFilter, setMediaFilter] = useState('all');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingProduct] = useState<any>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    altText: '',
    caption: '',
    category: 'Other',
    description: '',
    isFeatured: false
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploading(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', selectedFile);
      uploadForm.append('name', formData.name);
      uploadForm.append('type', uploadType);

      const upRes = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: uploadForm
      });
      
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.message);

      const finalItem = {
        ...formData,
        ...upData,
        mediaType: uploadType,
        uploadedBy: user.uid
      };

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalItem)
      });

      if (res.ok) {
        toast({ title: 'Uploaded Successfully', description: 'Visual asset added to studio gallery.' });
        setUploadDialogOpen(false);
        resetUpload();
        loadItems();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !user) return;
    try {
      const res = await fetch(`/api/admin/gallery/${editingItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingItem, adminId: user.uid })
      });
      if (res.ok) {
        toast({ title: 'Asset Updated' });
        setEditDialogOpen(false);
        loadItems();
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !user) return;
    try {
      const res = await fetch(`/api/admin/gallery/${itemToDelete._id}?adminId=${user.uid}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast({ title: 'Permanently Deleted' });
        setDeleteDialogOpen(false);
        loadItems();
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Deletion Failed' });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({
      name: '',
      altText: '',
      caption: '',
      category: 'Other',
      description: '',
      isFeatured: false
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.altText.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesType = mediaFilter === 'all' || item.mediaType === mediaFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const stats = {
    total: items.length,
    images: items.filter(i => i.mediaType === 'image').length,
    videos: items.filter(i => i.mediaType === 'video').length,
    featured: items.filter(i => i.isFeatured).length
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 5, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Gallery Studio</Typography>
          <Typography variant="body2" color="text.secondary">Manage visual assets — high performance images and artisanal reels.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<ImageIcon />} 
            onClick={() => { setUploadType('image'); setUploadDialogOpen(true); }}
            sx={{ borderRadius: 3, px: 3, fontWeight: 800 }}
          >
            Upload Image
          </Button>
          <Button 
            variant="contained" 
            startIcon={<VideoIcon />} 
            onClick={() => { setUploadType('video'); setUploadDialogOpen(true); }}
            sx={{ 
              borderRadius: 3, 
              px: 3, 
              fontWeight: 800,
              bgcolor: theme.palette.primary.main,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            Upload Reel
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: 'Total Assets', value: stats.total, icon: <FilterList /> },
          { label: 'Images', value: stats.images, icon: <ImageIcon /> },
          { label: 'Videos/Reels', value: stats.videos, icon: <VideoIcon /> },
          { label: 'Featured', value: stats.featured, icon: <StarIcon /> }
        ].map((s, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ color: 'primary.main', opacity: 0.5, mb: 1 }}>{s.icon}</Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 4, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Search assets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.disabled' }} /> }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                <MenuItem value="All">All Categories</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <ToggleButtonGroup 
              value={mediaFilter} 
              exclusive 
              onChange={(_, v) => v && setMediaFilter(v)} 
              size="small"
              fullWidth
            >
              <ToggleButton value="all" sx={{ fontWeight: 700 }}>All</ToggleButton>
              <ToggleButton value="image" sx={{ fontWeight: 700 }}>Images</ToggleButton>
              <ToggleButton value="video" sx={{ fontWeight: 700 }}>Videos</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item._id}>
              <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: alpha('#000', 0.05) }}>
                <Box sx={{ position: 'relative', aspectSquare: '1/1', overflow: 'hidden' }}>
                  {item.mediaType === 'image' ? (
                    <CardMedia 
                      component="img" 
                      image={item.url} 
                      sx={{ height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <Box sx={{ height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CardMedia 
                        component="img" 
                        image={item.thumbnailUrl || '/video-placeholder.jpg'} 
                        sx={{ height: '100%', objectFit: 'cover', opacity: 0.6 }} 
                      />
                      <PlayArrow sx={{ position: 'absolute', fontSize: 60, color: 'white' }} />
                    </Box>
                  )}
                  {item.isFeatured && (
                    <Chip 
                      icon={<StarIcon sx={{ fontSize: '12px !important' }} />} 
                      label="FEATURED" 
                      size="small" 
                      color="primary" 
                      sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 900, fontSize: '0.6rem' }} 
                    />
                  )}
                  <Chip 
                    label={item.format.toUpperCase()} 
                    size="small" 
                    sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 900, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.9)' }} 
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, py: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{item.category}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={item.isActive ? "Active" : "Inactive"} size="small" variant="outlined" color={item.isActive ? "success" : "default"} sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700 }} />
                  </Stack>
                </CardContent>
                <CardActions sx={{ borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', px: 2 }}>
                  <IconButton size="small" onClick={() => { setEditingProduct(item); setEditDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{uploadType === 'image' ? 'Studio Image Upload' : 'Artisan Reel Upload'}</DialogTitle>
        <DialogContent dividers>
          <Box 
            sx={{ 
              border: '2px dashed', 
              borderColor: selectedFile ? 'primary.main' : 'divider',
              borderRadius: 4,
              p: 4,
              textAlign: 'center',
              mb: 3,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              cursor: 'pointer'
            }}
            component="label"
          >
            <input type="file" hidden accept={uploadType === 'image' ? "image/*" : "video/mp4,video/mov,video/webm"} onChange={handleFileSelect} />
            {previewUrl ? (
              uploadType === 'image' ? (
                <img src={previewUrl} style={{ width: '100%', height: 200, objectFit: 'contain' }} />
              ) : (
                <Box sx={{ p: 4 }}>
                  <VideoIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" fontWeight={700}>{selectedFile?.name}</Typography>
                </Box>
              )
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" fontWeight={700}>Click to select {uploadType} file</Typography>
                <Typography variant="caption" color="text.secondary">
                  {uploadType === 'image' ? 'JPG, PNG, WebP supported. Auto-conversion to WebP.' : 'Max 50MB, max 40 seconds.'}
                </Typography>
              </>
            )}
          </Box>

          <Stack spacing={3}>
            <TextField fullWidth label="Asset Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <TextField fullWidth label="Alt Text (SEO) *" value={formData.altText} onChange={(e) => setFormData({...formData, altText: e.target.value})} />
            <TextField fullWidth label="Display Caption" value={formData.caption} onChange={(e) => setFormData({...formData, caption: e.target.value})} />
            <FormControl fullWidth>
              <InputLabel>Category *</InputLabel>
              <Select value={formData.category} label="Category *" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel 
              control={<Switch checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} />} 
              label={<Typography variant="body2" fontWeight={700}>Feature on Homepage</Typography>}
            />
          </Stack>
          
          {uploading && <LinearProgress sx={{ mt: 3, borderRadius: 1 }} />}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile || !formData.name || !formData.altText}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            {uploading ? 'Processing...' : 'Upload to Gallery'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Asset Details</DialogTitle>
        <DialogContent dividers>
          {editingItem && (
            <Stack spacing={3}>
              <TextField fullWidth label="Asset Name" value={editingItem.name} onChange={(e) => setEditingProduct({...editingItem, name: e.target.value})} />
              <TextField fullWidth label="Alt Text" value={editingItem.altText} onChange={(e) => setEditingProduct({...editingItem, altText: e.target.value})} />
              <TextField fullWidth label="Caption" value={editingItem.caption} onChange={(e) => setEditingProduct({...editingItem, caption: e.target.value})} />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={editingItem.category} label="Category" onChange={(e) => setEditingProduct({...editingItem, category: e.target.value})}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth multiline rows={3} label="Description" value={editingItem.description} onChange={(e) => setEditingProduct({...editingItem, description: e.target.value})} />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <FormControlLabel control={<Switch checked={editingItem.isFeatured} onChange={(e) => setEditingProduct({...editingItem, isFeatured: e.target.checked})} />} label="Featured" />
                <FormControlLabel control={<Switch checked={editingItem.isActive} onChange={(e) => setEditingProduct({...editingItem, isActive: e.target.checked})} />} label="Active" />
              </Box>
              <TextField type="number" label="Sort Order" value={editingItem.sortOrder} onChange={(e) => setEditingProduct({...editingItem, sortOrder: parseInt(e.target.value)})} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Permanent Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <b>{itemToDelete?.name}</b>? This will remove the file from studio storage and our database permanently.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 800 }}>Confirm Deletion</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
