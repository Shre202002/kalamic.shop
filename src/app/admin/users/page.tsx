
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
  Chip,
  Skeleton,
  InputBase,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Visibility, 
  Close, 
  LocationOn, 
  ContactPhone, 
  Mail, 
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getAllUsers, toggleUserStatus } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setMounted(true);
    let isCurrent = true;
    async function load() {
      try {
        const data = await getAllUsers();
        if (isCurrent) {
          setUsers(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
        if (isCurrent) setLoading(false);
      }
    }
    load();
    return () => { isCurrent = false; };
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await toggleUserStatus('current-admin-id', userId, newStatus);
      setUsers((prev: any) => prev.map((u: any) => u._id === userId ? { ...u, status: newStatus } : u));
    } catch (e) {
      console.error("Status update failed:", e);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((u: any) => 
      (u.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: 'name', 
      headerName: 'Collector', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.8rem', fontWeight: 700 }}>
            {(params.row.firstName || params.row.email || '?')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true }}>
              {params.row.firstName ? `${params.row.firstName} ${params.row.lastName || ''}` : 'New Collector'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', noWrap: true }}>
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'buyer'} 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem', height: 20 }} 
        />
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 140,
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
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.7rem', fontWeight: 700 } }}
        />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Profile Details">
          <IconButton size="small" onClick={() => { setSelectedUser(params.row); setDetailsOpen(true); }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], []);

  if (!mounted) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>Collector Directory</Typography>
          <Typography variant="body2" color="text.secondary">Manage account access and delivery credentials.</Typography>
        </Box>
        
        {/* Search Bar */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: 'white', 
          px: 2, 
          py: 0.5, 
          borderRadius: 2, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          width: { xs: '100%', sm: '300px' },
          border: '1px solid rgba(0,0,0,0.08)'
        }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Find a collector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
        <DataGrid
          rows={filteredUsers}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(0,0,0,0.02)',
            },
            '& .MuiDataGrid-cell:focus': { outline: 'none' }
          }}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      {/* User Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', boxShadow: '0 4px 12px rgba(234,120,30,0.2)' }}>
              {(selectedUser?.firstName || selectedUser?.email || '?')[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : 'Collector Profile'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                ID: {selectedUser?.firebaseId || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailsOpen(false)} sx={{ bgcolor: 'grey.100' }}><Close /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ mt: 3, spaceY: 4 }}>
            {/* Communication Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Mail color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                  Communication Credentials
                </Typography>
              </Box>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderStyle: 'dashed' }}>
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.6 }}>Email:</span>
                  <span style={{ fontWeight: 600 }}>{selectedUser?.email}</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.6 }}>Phone:</span>
                  <span style={{ fontWeight: 600 }}>{selectedUser?.phone || 'Not provided'}</span>
                </Typography>
              </Paper>
            </Box>
            
            <Divider sx={{ my: 3, opacity: 0.5 }} />

            {/* Address Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOn color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                  Shipping Destination
                </Typography>
              </Box>
              <Box sx={{ pl: 1 }}>
                {selectedUser?.address ? (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{selectedUser.address}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.city}, {selectedUser.state} - {selectedUser.pincode}
                    </Typography>
                    {selectedUser.landmark && (
                      <Chip 
                        label={`Landmark: ${selectedUser.landmark}`} 
                        size="small" 
                        sx={{ mt: 1.5, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.7rem' }} 
                      />
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', bgcolor: 'grey.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                    No delivery address recorded yet.
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3, opacity: 0.5 }} />

            {/* Meta Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ContactPhone color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                  Account Metadata
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Role</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                      {selectedUser?.role || 'buyer'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Joined Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedUser?.createdAt ? dayjs(selectedUser.createdAt).format('DD MMM YYYY') : 'Recently'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: 2 }}>Close</Button>
          <Button variant="contained" fullWidth sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(234,120,30,0.2)' }}>Edit Profile</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
