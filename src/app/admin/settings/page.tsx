
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Avatar, 
  Chip, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Divider, 
  Card, 
  CardContent, 
  Button, 
  Tabs, 
  Tab, 
  Select, 
  MenuItem, 
  FormControl, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  alpha,
  useTheme
} from '@mui/material';
import { Security, History, Shield, AdminPanelSettings, PersonAdd, Mail } from '@mui/icons-material';
import { getAdminLogs, getAdmins, updateAdminRole, removeAdminAccess, provisionAdmin } from '@/lib/actions/admin-actions';
import { getProfile } from '@/lib/actions/user-actions';
import { useUser } from '@/firebase';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/use-toast';

const ROLES = ['super_admin', 'admin', 'support'];
const PERMANENT_SUPER_ADMIN_EMAIL = 'sriyanshgupta24@gmail.com';

export default function SettingsPage() {
  const theme = useTheme();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');

  const loadData = async () => {
    if (!user) return;
    try {
      const [l, a, p] = await Promise.all([
        getAdminLogs(), 
        getAdmins(), 
        getProfile(user.uid)
      ]);
      setLogs(l);
      setAdmins(a);
      setCurrentUserProfile(p);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRoleChange = async (targetId: string, newRole: string) => {
    if (!user) return;
    try {
      await updateAdminRole(user.uid, targetId, newRole);
      toast({ title: "Role Updated", description: `User level changed to ${newRole}.` });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    }
  };

  const handleRevoke = async (targetId: string) => {
    if (!user || !confirm("Are you sure? This user will lose all administrative access.")) return;
    try {
      await removeAdminAccess(user.uid, targetId);
      toast({ title: "Access Revoked" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    }
  };

  const handleProvision = async () => {
    if (!user || !newAdminEmail) return;
    try {
      await provisionAdmin(user.uid, newAdminEmail, newAdminRole);
      toast({ title: "Admin Provisioned", description: "The collector has been granted administrative access." });
      setProvisionOpen(false);
      setNewAdminEmail('');
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Provisioning Failed", description: e.message });
    }
  };

  if (isLoading) return <Box sx={{ p: 4 }}>Loading Governance Hub...</Box>;

  if (currentUserProfile?.role !== 'super_admin' && currentUserProfile?.email !== PERMANENT_SUPER_ADMIN_EMAIL) {
    return (
      <Box sx={{ p: 10, textAlign: 'center' }}>
        <Shield sx={{ fontSize: 80, color: 'error.light', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Restricted Access</Typography>
        <Typography variant="body1" color="text.secondary">Only the Super Admin can access the Governance Hub.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Governance Hub</Typography>
          <Typography variant="body2" color="text.secondary">Unified control for administrative clearance and audit trails.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={() => setProvisionOpen(true)}
          sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
        >
          Provision Admin
        </Button>
      </Box>

      <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, borderRadius: 4, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
          <Tab icon={<Security sx={{ fontSize: 20 }} />} label="Administrative Ranks" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<History sx={{ fontSize: 20 }} />} label="Artisan Audit Trail" iconPosition="start" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {admins.map((admin: any) => (
            <Grid item xs={12} md={4} key={admin._id}>
              <Card sx={{ borderRadius: 5, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontWeight: 900 }}>
                    {(admin.firstName || admin.email)[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{admin.firstName} {admin.lastName || 'Collector'}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{admin.email}</Typography>
                  
                  <FormControl fullWidth size="small" sx={{ mt: 3, mb: 2 }}>
                    <Select
                      value={admin.role}
                      onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                      sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.8rem' }}
                      disabled={admin.email === PERMANENT_SUPER_ADMIN_EMAIL}
                    >
                      {ROLES.map(r => <MenuItem key={r} value={r} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.toUpperCase()}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {admin.email !== PERMANENT_SUPER_ADMIN_EMAIL && (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="error" 
                      onClick={() => handleRevoke(admin._id)}
                      sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                    >
                      Revoke Privileges
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 0, borderRadius: 5, overflow: 'hidden', border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
          <List sx={{ py: 0 }}>
            {logs.length > 0 ? logs.map((log: any, index: number) => (
              <React.Fragment key={log._id}>
                <ListItem alignItems="flex-start" sx={{ py: 3, px: 4, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: log.action.includes('DELETE') || log.action.includes('REVOKE') ? 'error.light' : 'info.light', borderRadius: 3 }}>
                      {log.action.includes('UPDATE') ? <AdminPanelSettings /> : <Shield />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: -0.5 }}>{log.action.replace('_', ' ')}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>
                          {dayjs(log.timestamp).format('DD MMM YYYY, HH:mm:ss')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography component="div" variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                          {log.adminName} ({log.role.toUpperCase()})
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', bgcolor: alpha(theme.palette.common.black, 0.03), p: 2, borderRadius: 3 }}>
                          "{log.details}"
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider variant="inset" component="li" sx={{ opacity: 0.5 }} />}
              </React.Fragment>
            )) : (
              <Box sx={{ p: 10, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>The audit vault is currently empty.</Typography>
              </Box>
            )}
          </List>
        </Paper>
      )}

      {/* Provision Dialog */}
      <Dialog open={provisionOpen} onClose={() => setProvisionOpen(false)} PaperProps={{ sx: { borderRadius: 6, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Provision Access</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Elevate an existing collector to the administrative team.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Collector Email"
            placeholder="artisan@kalamic.shop"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            sx={{ mb: 3 }}
          />
          <FormControl fullWidth>
            <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, ml: 1 }}>SELECT CLEARANCE LEVEL</Typography>
            <Select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value)}
              sx={{ borderRadius: 3 }}
            >
              <MenuItem value="super_admin">SUPER ADMIN (Full CRUD + Governance)</MenuItem>
              <MenuItem value="admin">ADMIN (Catalog + Orders)</MenuItem>
              <MenuItem value="support">SUPPORT (Read Only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setProvisionOpen(false)} sx={{ fontWeight: 700 }}>Discard</Button>
          <Button variant="contained" onClick={handleProvision} sx={{ borderRadius: 3, px: 4, fontWeight: 800 }}>Confirm Rank</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
