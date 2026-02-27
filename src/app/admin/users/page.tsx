
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Switch, 
  FormControlLabel, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Grid, 
  Divider,
  Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility, Close, LocationOn, ContactPhone, Mail } from '@mui/icons-material';
import { getAllUsers, toggleUserStatus } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function load() {
      const data = await getAllUsers();
      setUsers(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    await toggleUserStatus('current-admin-id', userId, newStatus);
    setUsers((prev: any) => prev.map((u: any) => u._id === userId ? { ...u, status: newStatus } : u));
  };

  const handleOpenDetails = (user: any) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: 'name', 
      headerName: 'Collector', 
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>{params.row.firstName?.[0]}</Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">{params.row.email}</Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'buyer'} 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }} 
        />
      )
    },
    { field: 'phone', headerName: 'Contact', width: 150 },
    { field: 'city', headerName: 'City', width: 120 },
    { 
      field: 'status', 
      headerName: 'Account Status', 
      width: 180,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch 
              checked={params.value === 'active'} 
              size="small" 
              onChange={() => handleStatusChange(params.row._id, params.value)}
            />
          }
          label={params.value === 'active' ? 'Active' : 'Disabled'}
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 700 } }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="View Profile Details">
          <IconButton size="small" onClick={() => handleOpenDetails(params.row)}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], []);

  if (!mounted) return null;

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Collector Directory</Typography>
      <Paper>
        <DataGrid
          rows={users}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none' }}
          autoHeight
        />
      </Paper>

      {/* User Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {selectedUser?.firstName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {selectedUser?.firebaseId || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailsOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Mail color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Communication Credentials</Typography>
              </Box>
              <Typography variant="body2" sx={{ ml: 4 }}>Email: {selectedUser?.email}</Typography>
              <Typography variant="body2" sx={{ ml: 4 }}>Phone: {selectedUser?.phone || 'Not provided'}</Typography>
            </Grid>
            
            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Shipping Destination</Typography>
              </Box>
              <Box sx={{ ml: 4 }}>
                <Typography variant="body2">{selectedUser?.address || 'No address recorded'}</Typography>
                <Typography variant="body2">
                  {selectedUser?.city}, {selectedUser?.state} - {selectedUser?.pincode}
                </Typography>
                {selectedUser?.landmark && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Landmark: {selectedUser.landmark}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ContactPhone color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Account Meta</Typography>
              </Box>
              <Grid container sx={{ ml: 4 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Account Role</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                    {selectedUser?.role || 'buyer'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Joined Date</Typography>
                  <Typography variant="body2">
                    {selectedUser?.createdAt ? dayjs(selectedUser.createdAt).format('DD MMM YYYY') : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
          <Button variant="contained" sx={{ borderRadius: 2 }}>Edit User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
