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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ConfirmationNumber as PromoIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  TrendingUp,
  HistoryToggleOff
} from '@mui/icons-material';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';

export default function PromoManagement() {
  const theme = useTheme();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 0,
    minOrderValue: 0,
    maxUses: 0,
    expiresAt: '',
    isActive: true
  });

  const loadCodes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promo?adminId=${user.uid}`);
      const data = await res.json();
      setCodes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, [user]);

  const handleOpenDialog = (promo?: any) => {
    if (promo) {
      setEditingId(promo._id);
      setFormData({
        code: promo.code,
        description: promo.description || '',
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderValue: promo.minOrderValue,
        maxUses: promo.maxUses,
        expiresAt: promo.expiresAt ? dayjs(promo.expiresAt).format('YYYY-MM-DD') : '',
        isActive: promo.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: 0,
        minOrderValue: 0,
        maxUses: 0,
        expiresAt: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const url = editingId ? `/api/admin/promo/${editingId}` : '/api/admin/promo';
      const method = editingId ? 'PATCH' : 'POST';
      
      const payload = { 
        ...formData, 
        adminId: user.uid,
        code: formData.code.toUpperCase(),
        expiresAt: formData.expiresAt || null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Action failed');
      }

      toast({ title: editingId ? 'Code Updated' : 'Code Created' });
      setDialogOpen(false);
      loadCodes();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (promo: any) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/promo/${promo._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.uid, isActive: !promo.isActive })
      });
      if (res.ok) loadCodes();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Toggle Failed' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Permanently delete this promo code?')) return;
    try {
      const res = await fetch(`/api/admin/promo/${id}?adminId=${user.uid}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Code Purged' });
        loadCodes();
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  };

  const stats = {
    total: codes.length,
    active: codes.filter(c => c.isActive).length,
    uses: codes.reduce((acc, c) => acc + (c.usedCount || 0), 0),
    expired: codes.filter(c => c.expiresAt && dayjs(c.expiresAt).isBefore(dayjs())).length
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Promo Codes</Typography>
          <Typography variant="body2" color="text.secondary">Create and manage discount codes for the Kalamic collection.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 3, px: 4, fontWeight: 800, height: 48 }}
        >
          Create New Code
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: 'Total Codes', value: stats.total, icon: <PromoIcon /> },
          { label: 'Active Codes', value: stats.active, icon: <ActiveIcon color="success" /> },
          { label: 'Total Redemptions', value: stats.uses, icon: <TrendingUp color="primary" /> },
          { label: 'Expired', value: stats.expired, icon: <HistoryToggleOff color="error" /> }
        ].map((s, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
              <Box sx={{ opacity: 0.5, mb: 1 }}>{s.icon}</Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1), overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Min Order</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Used / Max</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Expires</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {codes.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.secondary' }}>No promo codes in the vault.</TableCell></TableRow>
            ) : codes.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'primary.main', fontSize: '1rem' }}>{row.code}</TableCell>
                <TableCell>
                  <Chip label={row.discountType.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{row.discountType === 'percent' ? `${row.discountValue}%` : `₹${row.discountValue}`}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>₹{row.minOrderValue}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{row.usedCount} / {row.maxUses === 0 ? '∞' : row.maxUses}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.expiresAt ? dayjs(row.expiresAt).format('DD MMM YYYY') : 'Never'}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.isActive ? 'Active' : 'Inactive'} 
                    color={row.isActive ? 'success' : 'default'} 
                    size="small" 
                    sx={{ fontWeight: 900, fontSize: '0.6rem' }} 
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Toggle Status">
                      <IconButton size="small" onClick={() => toggleActive(row)}>
                        {row.isActive ? <InactiveIcon fontSize="small" color="disabled" /> : <ActiveIcon fontSize="small" color="success" />}
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => handleOpenDialog(row)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !isSaving && setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{editingId ? 'Edit Promo Code' : 'New Promo Code'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              fullWidth 
              label="Promo Code" 
              placeholder="e.g. WELCOME20" 
              value={formData.code} 
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
              inputProps={{ style: { textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1 } }}
            />
            <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select 
                    value={formData.discountType} 
                    label="Discount Type" 
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                  >
                    <MenuItem value="percent">Percentage (%)</MenuItem>
                    <MenuItem value="flat">Flat Amount (₹)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Discount Value" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: parseFloat(e.target.value)})} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Min Order Value (₹)" value={formData.minOrderValue} onChange={(e) => setFormData({...formData, minOrderValue: parseFloat(e.target.value)})} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Max Uses (0=∞)" value={formData.maxUses} onChange={(e) => setFormData({...formData, maxUses: parseInt(e.target.value)})} />
              </Grid>
            </Grid>

            <TextField fullWidth type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} value={formData.expiresAt} onChange={(e) => setFormData({...formData, expiresAt: e.target.value})} />
            
            <FormControlLabel 
              control={<Switch checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />} 
              label="Code is Active" 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>
            {isSaving ? 'Saving...' : 'Save Creation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
