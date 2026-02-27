
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
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getAllUsers, toggleUserStatus } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export default function UsersManagement() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not retrieve collector directory." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    if (!user) return;
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await toggleUserStatus(user.uid, userId, newStatus);
      setUsers((prev: any) => prev.map((u: any) => u._id === userId ? { ...u, status: newStatus } : u));
      toast({ title: "Account Updated", description: `Collector status changed to ${newStatus}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not modify account status." });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u: any) => 
      (u.firstName?.toLowerCase() || '').includes(q) ||
      (u.lastName?.toLowerCase() || '').includes(q) ||
      (u.email?.toLowerCase() || '').includes(q) ||
      (u.phone?.toLowerCase() || '').includes(q)
    );
  }, [users, searchQuery]);

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: 'name', 
      headerName: 'Collector', 
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: 'primary.main', 
              fontSize: '0.9rem', 
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(234,120,30,0.2)'
            }}
          >
            {(params.row.firstName || params.row.email || '?')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>
              {params.row.firstName ? `${params.row.firstName} ${params.row.lastName || ''}` : 'New Collector'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', opacity: 0.8 }}>
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: 'role', 
      headerName: 'Level', 
      width: 110,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'buyer'} 
          size="small" 
          variant="filled"
          sx={{ 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            fontSize: '0.65rem', 
            height: 24,
            bgcolor: params.value === 'super_admin' ? 'error.light' : alpha(theme.palette.secondary.main, 0.1),
            color: params.value === 'super_admin' ? 'error.main' : 'secondary.main',
            borderRadius: '6px'
          }} 
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
              color="primary"
              onChange={() => handleStatusChange(params.row._id, params.value)}
            />
          }
          label={params.value === 'active' ? 'Active' : 'Disabled'}
          sx={{ 
            m: 0,
            '& .MuiFormControlLabel-label': { 
              fontSize: '0.75rem', 
              fontWeight: 700,
              color: params.value === 'active' ? 'success.main' : 'text.disabled'
            } 
          }}
        />
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Joined', 
      width: 130,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {params.value ? dayjs(params.value).format('DD MMM YYYY') : 'N/A'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      align: 'right',
      renderCell: (params) => (
        <Tooltip title="Examine Profile">
          <IconButton 
            size="small" 
            onClick={() => { setSelectedUser(params.row); setDetailsOpen(true); }}
            sx={{ color: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme.palette, user]);

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
            Collector Directory
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.7 }}>
            Oversee artisanal relationships and administrative clearance levels.
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          width: { xs: '100%', md: 'auto' }
        }}>
          {/* Enhanced Search Bar */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'white', 
            px: 2.5, 
            py: 1, 
            borderRadius: 3, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            flex: 1,
            minWidth: { md: '340px' },
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.2s',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
            }
          }}>
            <SearchIcon sx={{ color: 'text.disabled', mr: 1.5, fontSize: 22 }} />
            <InputBase
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}
            />
          </Box>
          
          <Tooltip title="Refresh Directory">
            <IconButton 
              onClick={loadData} 
              disabled={loading}
              sx={{ bgcolor: 'white', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 3 }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} className={loading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        border: 'none', 
        borderRadius: 4,
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
        bgcolor: 'white'
      }}>
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
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              minHeight: '56px !important',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              color: 'text.secondary'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}`,
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.01),
            },
            '& .MuiDataGrid-cell:focus': { outline: 'none' }
          }}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Reimagined User Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ 
          sx: { 
            borderRadius: isMobile ? 0 : 6, 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
          } 
        }}
      >
        <DialogTitle sx={{ 
          p: 4, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0)} 100%)` 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'primary.main', 
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                border: '4px solid white'
              }}>
                {(selectedUser?.firstName || selectedUser?.email || '?')[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  {selectedUser?.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : 'Artisan Collector'}
                </Typography>
                <Chip 
                  label={selectedUser?.role || 'buyer'} 
                  size="small" 
                  sx={{ 
                    mt: 1, 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    fontSize: '0.6rem', 
                    borderRadius: '4px',
                    bgcolor: 'white',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    color: 'primary.main'
                  }} 
                />
              </Box>
            </Box>
            <IconButton onClick={() => setDetailsOpen(false)} sx={{ bgcolor: alpha(theme.palette.common.black, 0.05) }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, pb: 4 }}>
          <Box sx={{ mt: 2 }}>
            {/* Communication Section */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Mail sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.7rem', color: 'text.secondary' }}>
                  Digital Credentials
                </Typography>
              </Box>
              <Paper variant="outlined" sx={{ 
                p: 3, 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.primary.main, 0.01), 
                borderStyle: 'dashed',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>Verified Email</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedUser?.email}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}><Divider sx={{ opacity: 0.5 }} /></Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>Contact Line</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedUser?.phone || 'Not Registered'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Destination Section */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <LocationOn sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.7rem', color: 'text.secondary' }}>
                  Shipping Archetype
                </Typography>
              </Box>
              <Box sx={{ pl: 1 }}>
                {selectedUser?.address ? (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ mt: 0.5, h: 8, w: 2, bgcolor: 'primary.main', borderRadius: 1 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>{selectedUser.address}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', opacity: 0.8 }}>
                        {selectedUser.city}, {selectedUser.state} — {selectedUser.pincode}
                      </Typography>
                      {selectedUser.landmark && (
                        <Chip 
                          label={`Near ${selectedUser.landmark}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ mt: 2, borderRadius: 2, fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary' }} 
                        />
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 4, 
                    borderRadius: 4, 
                    bgcolor: alpha(theme.palette.divider, 0.03), 
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}>
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontWeight: 600 }}>
                      Collector has not defined a studio destination.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Meta Attributes */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <ContactPhone sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.7rem', color: 'text.secondary' }}>
                  Studio Log
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>Access Status</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: selectedUser?.status === 'active' ? 'success.main' : 'error.main', textTransform: 'capitalize' }}>
                      {selectedUser?.status || 'Active'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>First Discovery</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {selectedUser?.createdAt ? dayjs(selectedUser.createdAt).format('DD MMM YYYY') : 'Ancient'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, gap: 2, bgcolor: alpha(theme.palette.divider, 0.02) }}>
          <Button 
            onClick={() => setDetailsOpen(false)} 
            variant="text" 
            fullWidth 
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, color: 'text.secondary' }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            fullWidth 
            sx={{ 
              borderRadius: 3, 
              py: 1.5, 
              fontWeight: 900, 
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}` 
            }}
          >
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
