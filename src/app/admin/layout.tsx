
'use client';

import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Toolbar, AppBar, IconButton, Typography, Avatar, Badge } from '@mui/material';
import { Notifications as NotificationsIcon, Search as SearchIcon } from '@mui/icons-material';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const adminTheme = createTheme({
  palette: {
    primary: { main: '#EA781E' },
    secondary: { main: '#8B9689' },
    background: { default: '#F8F9FA' }
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: { fontWeight: 800 },
    h6: { fontWeight: 700 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 700 }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }
      }
    }
  }
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', color: 'text.primary', boxShadow: 'none', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Control Hub
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton><SearchIcon /></IconButton>
              <IconButton>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Avatar src="https://picsum.photos/seed/admin/100/100" sx={{ width: 32, height: 32 }} />
            </Box>
          </Toolbar>
        </AppBar>
        <AdminSidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
