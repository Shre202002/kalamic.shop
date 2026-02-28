'use client';

import React, { useState } from 'react';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Toolbar, 
  AppBar, 
  IconButton, 
  Typography, 
  Avatar, 
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  Search as SearchIcon,
  Menu as MenuIcon 
} from '@mui/icons-material';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const adminTheme = createTheme({
  palette: {
    primary: { main: '#C97A40' }, // Terracotta
    secondary: { main: '#6F8A7A' }, // Muted Sage
    background: { default: '#F6F1E9' } // Soft Cream
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSize: 13,
    h4: { fontWeight: 700, fontSize: '1.5rem', fontFamily: '"Playfair Display", serif' },
    h6: { fontWeight: 600, fontSize: '0.9rem', fontFamily: '"Playfair Display", serif' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600, fontFamily: '"Inter", sans-serif' }
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1, 
            bgcolor: 'white', 
            color: 'text.primary', 
            boxShadow: 'none', 
            borderBottom: '1px solid rgba(0,0,0,0.08)' 
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#C97A40', fontWeight: 700 }}>
                Control Hub
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
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
        
        <AdminSidebar 
          mobileOpen={mobileOpen} 
          handleDrawerToggle={handleDrawerToggle} 
        />

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, 
            bgcolor: 'background.default', 
            minHeight: '100vh',
            width: { md: `calc(100% - 240px)` }
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
