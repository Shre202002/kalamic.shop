
'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Category as CategoryIcon,
  Refresh,
  Save
} from '@mui/icons-material';
import { getCategories, saveCategory, deleteCategory } from '@/lib/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const INITIAL_CATEGORY = {
  name: '',
  slug: '',
  description: ''
};

export default function CategoriesManagement() {
  const { user } = useUser();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const theme = useTheme();
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const handleOpenDialog = (cat?: any) => {
    if (cat) {
      setEditingCategory({ ...cat });
    } else {
      setEditingCategory({ ...INITIAL_CATEGORY });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!editingCategory.name || !editingCategory.slug) {
      toast({ variant: "destructive", title: "Required", description: "Name and Slug are required." });
      return;
    }

    setIsSaving(true);
    try {
      await saveCategory(user.uid, editingCategory);
      toast({ title: "Category Saved", description: "The collection classification has been updated." });
      setDialogOpen(false);
      load();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Are you sure? This action cannot be undone if no products are linked.")) return;
    try {
      await deleteCategory(user.uid, id);
      toast({ title: "Category Deleted" });
      load();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    }
  };

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Collection Categories</Typography>
          <Typography variant="body2" color="text.secondary">Classify artisan pieces for the Kalamic shop ecosystem.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} size="small" disabled={loading}>Sync</Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 3, px: 3, fontWeight: 800 }}
          >
            New Category
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {loading && <CircularProgress sx={{ display: 'block', m: '40px auto' }} />}
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem' }}>Classification</TableCell>
              <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem' }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem' }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat: any) => (
              <TableRow key={cat._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <CategoryIcon fontSize="small" />
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{cat.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{cat.slug}</Typography></TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{cat.description || '—'}</Typography></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(cat)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(cat._id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10 }}><Typography color="text.secondary">No categories created yet.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          {editingCategory?._id ? 'Refine Classification' : 'New Collection Group'}
        </DialogTitle>
        <DialogContent dividers>
          {editingCategory && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Category Name *"
                value={editingCategory.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingCategory({ 
                    ...editingCategory, 
                    name: val, 
                    slug: !editingCategory._id ? val.toLowerCase().replace(/\s+/g, '-') : editingCategory.slug 
                  });
                }}
              />
              <TextField
                fullWidth
                label="URL Slug *"
                value={editingCategory.slug}
                onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                helperText="Permanent identifier for internal cataloging."
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editingCategory.description}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Discard</Button>
          <Button 
            variant="contained" 
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />} 
            onClick={handleSave} 
            disabled={isSaving}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            Save Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
