
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Chip, List, ListItem, ListItemText, ListItemAvatar, Divider, Card, CardContent, Button, Tabs, Tab } from '@mui/material';
import { Security, History, Shield, AdminPanelSettings, PersonAdd } from '@mui/icons-material';
import { getAdminLogs, getAdmins } from '@/lib/actions/admin-actions';
import dayjs from 'dayjs';

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [value, setValue] = useState(0);
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [l, a] = await Promise.all([getAdminLogs(), getAdmins()]);
      setLogs(l);
      setAdmins(a);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">Governance Hub</Typography>
          <Typography variant="body2" color="text.secondary">Manage roles, security, and audit the studio journey.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />}>Provision Admin</Button>
      </Box>

      <Paper sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={value} onChange={(_, v) => setValue(v)} aria-label="settings tabs">
          <Tab icon={<Security />} label="Roles & Access" iconPosition="start" />
          <Tab icon={<History />} label="Audit Trail" iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={value} index={0}>
        <Grid container spacing={3}>
          {admins.map((admin: any) => (
            <Grid item xs={12} md={4} key={admin._id}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}>
                    {admin.firstName?.[0]}
                  </Avatar>
                  <Typography variant="h6">{admin.firstName} {admin.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{admin.email}</Typography>
                  <Chip 
                    label={admin.role} 
                    color={admin.role === 'super_admin' ? 'error' : 'primary'} 
                    size="small" 
                    sx={{ mt: 1, fontWeight: 700, textTransform: 'uppercase' }}
                  />
                  <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button size="small" variant="outlined">Manage</Button>
                    <Button size="small" variant="ghost" color="error">Revoke</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <List>
            {logs.length > 0 ? logs.map((log: any, index: number) => (
              <React.Fragment key={log._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: log.action.includes('DELETE') ? 'error.light' : 'info.light' }}>
                      {log.action.includes('UPDATE') ? <AdminPanelSettings /> : <Shield />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 700 }}>{log.action.replace('_', ' ')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(log.timestamp).format('DD MMM YYYY, HH:mm:ss')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', mt: 0.5 }}>
                          {log.adminName} ({log.role})
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, borderRadius: 1 }}>
                          {log.entityType} ID: {log.entityId}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{log.details}</Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            )) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No governance actions recorded yet.</Typography>
              </Box>
            )}
          </List>
        </Paper>
      </TabPanel>
    </Box>
  );
}
