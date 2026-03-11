
'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  CloudUpload as CloudUploadIcon, 
  PlayArrow, 
  Star as StarIcon,
  FilterList,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getGalleryItems } from '@/lib/actions/gallery-actions';

const CATEGORIES = ['Pillars & Stambh', 'Photo Frames', 'Wall Art', 'Mandala', 'Gifting', 'Other'];

export default function GalleryStudio() {
  const theme = useTheme();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [mediaFilter, setMediaFilter] = useState('all');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDialogType, setUploadDialogType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    altText: '',
    caption: '',
    category: 'Other',
    description: '',
    isFeatured: false
  });

  const loadGalleryItems = async () => {
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
    loadGalleryItems();
  }, []);

  const handleFileSelect = (f: File) => {
    if (uploadDialogType === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 40) {
          toast({ 
            variant: 'destructive', 
            title: 'Reel Too Long', 
            description: `This reel is ${Math.round(video.duration)}s. Max allowed is 40s.` 
          });
          setFile(null);
          setPreview(null);
          setVideoDuration(null);
        } else {
          setVideoDuration(video.duration);
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }
      };
      video.src = URL.createObjectURL(f);
    } else {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadForm.name || !uploadForm.altText || !user) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Name, Alt Text, and File are required.' });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', uploadForm.name);
      formData.append('mediaType', uploadDialogType);

      const upRes = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: formData
      });
      
      const text = await upRes.text();
      let upData: any;
      
      try {
        upData = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Non-JSON response from server:', text.substring(0, 200));
        throw new Error('Server returned an invalid response format.');
      }

      if (!upRes.ok || !upData.success) throw new Error(upData.error || 'Upload failed');

      const finalItem = {
        ...uploadForm,
        url: upData.url,
        fileId: upData.fileId,
        format: upData.format,
        width: upData.width,
        height: upData.height,
        duration: videoDuration || upData.duration,
        mediaType: uploadDialogType,
        uploadedBy: user.uid
      };

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalItem)
      });

      const saveResult = await res.json();
      if (!res.ok) throw new Error(saveResult.message || 'Database sync failed');

      toast({ title: '✅ Upload Successful', description: `${uploadForm.name} added to visual archive.` });
      setUploadDialogOpen(false);
      resetForm();
      loadGalleryItems();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
      setIsUploading(false);
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
        loadGalleryItems();
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
        loadGalleryItems();
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Deletion Failed' });
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setVideoDuration(null);
    setUploadForm({
      name: '',
      altText: '',
      caption: '',
      category: 'Other',
      description: '',
      isFeatured: false
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (item.altText || '').toLowerCase().includes(search.toLowerCase());
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
            onClick={() => { resetForm(); setUploadDialogType('image'); setUploadDialogOpen(true); }}
            sx={{ borderRadius: 3, px: 3, fontWeight: 800 }}
          >
            Upload Image
          </Button>
          <Button 
            variant="contained" 
            startIcon={<VideoIcon />} 
            onClick={() => { resetForm(); setUploadDialogType('video'); setUploadDialogOpen(true); }}
            sx={{ 
              borderRadius: 3, 
              px: 3, 
              fontWeight: 800,
              background: 'linear-gradient(135deg, hsl(28,89%,52%), hsl(35,85%,55%))',
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
                    label={(item.format || 'file').toUpperCase()} 
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
                  <IconButton size="small" onClick={() => { setEditingItem(item); setEditDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* REFINED UPLOAD DIALOG */}
      <Dialog open={uploadDialogOpen} 
              onClose={() => !isUploading && setUploadDialogOpen(false)}
              maxWidth="sm" fullWidth
              PaperProps={{ sx: { borderRadius: 4 } }}>
        
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              p: 1.5, borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1) 
            }}>
              {uploadDialogType === 'image' ? <ImageIcon sx={{ color: 'primary.main' }} /> : <VideoIcon sx={{ color: 'primary.main' }} />}
            </Box>
            <Box>
              <Typography fontWeight={900}>Upload Gallery {uploadDialogType === 'image' ? 'Image' : 'Reel'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {uploadDialogType === 'image' ? 'Auto-converted to WebP for optimal performance' : 'Max 50MB, MP4/MOV/WebM supported'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>

            {/* Drag & Drop Zone */}
            <Box
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) handleFileSelect(dropped);
              }}
              onClick={() => !preview && fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: isDragging 
                  ? 'primary.main' 
                  : preview ? 'success.main' : 'divider',
                borderRadius: 3,
                p: 3,
                textAlign: 'center',
                cursor: preview ? 'default' : 'pointer',
                bgcolor: isDragging 
                  ? alpha(theme.palette.primary.main, 0.04) 
                  : 'background.default',
                transition: 'all 0.2s',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {preview ? (
                <>
                  {uploadDialogType === 'image' ? (
                    <Box component="img" src={preview} sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 2 }} />
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <VideoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                      <Typography variant="caption" fontWeight={700} display="block">{file?.name}</Typography>
                      {videoDuration && (
                        <Chip label={`${Math.round(videoDuration)}s`} size="small" color="primary" sx={{ mt: 1, fontWeight: 800 }} />
                      )}
                    </Box>
                  )}
                  {uploadDialogType === 'image' && (
                    <Chip
                      label="⚡ Will be converted to WebP"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backdropFilter: 'blur(4px)',
                        bgcolor: alpha('#000', 0.7),
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                      }}
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); resetForm(); }}
                    sx={{
                      position: 'absolute',
                      top: 8, right: 8,
                      bgcolor: alpha('#000', 0.6),
                      color: 'white',
                      '&:hover': { bgcolor: 'error.main' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Stack spacing={1.5} alignItems="center">
                  <Box sx={{ p: 2, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                    <CloudUploadIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.6 }} />
                  </Box>
                  <Typography fontWeight={700} color="text.secondary">Drag & drop {uploadDialogType} here</Typography>
                  <Typography variant="caption" color="text.disabled">or click to browse</Typography>
                </Stack>
              )}
            </Box>
            
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept={uploadDialogType === 'image' ? 'image/*' : 'video/*'}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {file && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} noWrap>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{(file.size / 1024 / 1024).toFixed(2)} MB</Typography>
                  </Box>
                  {uploadDialogType === 'image' && <Chip label="→ .webp" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />}
                </Stack>
              </Paper>
            )}

            <TextField
              label="Asset Name *"
              value={uploadForm.name}
              onChange={(e) => setUploadForm(p => ({ ...p, name: e.target.value }))}
              fullWidth size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              label="Alt Text * (for SEO)"
              value={uploadForm.altText}
              onChange={(e) => setUploadForm(p => ({ ...p, altText: e.target.value }))}
              fullWidth size="small"
              helperText="Describe the visual for search engines"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              label="Display Caption"
              value={uploadForm.caption}
              onChange={(e) => setUploadForm(p => ({ ...p, caption: e.target.value }))}
              fullWidth size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Category *</InputLabel>
              <Select
                value={uploadForm.category}
                onChange={(e) => setUploadForm(p => ({ ...p, category: e.target.value }))}
                label="Category *"
                sx={{ borderRadius: 2 }}
              >
                {CATEGORIES.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" justifyContent="space-between" alignItems="center"
                   sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Featured Item</Typography>
                <Typography variant="caption" color="text.secondary">Show on gallery hero</Typography>
              </Box>
              <Switch
                checked={uploadForm.isFeatured}
                onChange={(e) => setUploadForm(p => ({ ...p, isFeatured: e.target.checked }))}
                color="primary"
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || !uploadForm.name || !uploadForm.altText || isUploading}
            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
            sx={{ 
              borderRadius: 2, fontWeight: 900, minWidth: 140,
              background: isUploading ? undefined : 'linear-gradient(135deg, hsl(28,89%,52%), hsl(35,85%,55%))'
            }}
          >
            {isUploading ? 'Uploading...' : `Upload ${uploadDialogType === 'image' ? 'Image' : 'Reel'}`}
          </Button>
        </DialogActions>

        {isUploading && (
          <LinearProgress sx={{ height: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, hsl(28,89%,52%), hsl(45,85%,55%))' } }} />
        )}
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Asset Details</DialogTitle>
        <DialogContent dividers>
          {editingItem && (
            <Stack spacing={3}>
              <TextField fullWidth label="Asset Name" value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
              <TextField fullWidth label="Alt Text" value={editingItem.altText} onChange={(e) => setEditingItem({...editingItem, altText: e.target.value})} />
              <TextField fullWidth label="Caption" value={editingItem.caption} onChange={(e) => setEditingItem({...editingItem, caption: e.target.value})} />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={editingItem.category} label="Category" onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth multiline rows={3} label="Description" value={editingItem.description} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <FormControlLabel control={<Switch checked={editingItem.isFeatured} onChange={(e) => setEditingItem({...editingItem, isFeatured: e.target.checked})} />} label="Featured" />
                <FormControlLabel control={<Switch checked={editingItem.isActive} onChange={(e) => setEditingItem({...editingItem, isActive: e.target.checked})} />} label="Active" />
              </Box>
              <TextField type="number" label="Sort Order" value={editingItem.sortOrder} onChange={(e) => setEditingItem({...editingItem, sortOrder: parseInt(e.target.value)})} />
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
