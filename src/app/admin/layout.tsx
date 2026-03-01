
'use client';

import React, { useState, useEffect } from 'react';
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
  useTheme,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  Button
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  Search as SearchIcon,
  Menu as MenuIcon,
  FiberManualRecord,
  Launch as ViewSiteIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { getAdminNotifications, markNotificationsAsRead } from '@/lib/actions/admin-actions';
import Link from 'next/link';

const DRAWER_WIDTH = 240;

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
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const loadNotifications = async () => {
    try {
      const data = await getAdminNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
    if (notifications.some(n => !n.isRead)) {
      markNotificationsAsRead().then(loadNotifications);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            width: '100%',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#C97A40', fontWeight: 700 }}>
                Control Hub
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              {!isMobile && (
                <Button 
                  component={Link} 
                  href="/" 
                  startIcon={<ViewSiteIcon sx={{ fontSize: 16 }} />}
                  sx={{ 
                    mr: 2, 
                    color: 'secondary.main', 
                    fontWeight: 800, 
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: alpha(adminTheme.palette.secondary.main, 0.05) }
                  }}
                >
                  View Store
                </Button>
              )}
              
              <IconButton><SearchIcon /></IconButton>
              <IconButton onClick={handleOpenNotifications}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseNotifications}
                PaperProps={{
                  sx: { width: 320, maxHeight: 400, borderRadius: 4, mt: 1.5, boxShadow: '0 15px 50px rgba(0,0,0,0.1)' }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>Studio Events</Typography>
                  {unreadCount > 0 && <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>{unreadCount} New</Typography>}
                </Box>
                <Divider />
                <List sx={{ p: 0 }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">No recent events recorded.</Typography>
                    </Box>
                  ) : (
                    notifications.map((n) => (
                      <MenuItem 
                        key={n._id} 
                        component={Link} 
                        href={n.link || '#'} 
                        onClick={handleCloseNotifications}
                        sx={{ 
                          py: 1.5, 
                          px: 2, 
                          whiteSpace: 'normal',
                          bgcolor: n.isRead ? 'transparent' : alpha('#C97A40', 0.03),
                          borderLeft: n.isRead ? '3px solid transparent' : '3px solid #C97A40'
                        }}
                      >
                        <ListItemText
                          primary={n.title}
                          secondary={n.message}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: n.isRead ? 600 : 800, fontSize: '0.8rem' }}
                          secondaryTypographyProps={{ variant: 'caption', sx: { display: 'block', mt: 0.5 } }}
                        />
                        {!n.isRead && <FiberManualRecord sx={{ fontSize: 8, color: 'primary.main', ml: 1 }} />}
                      </MenuItem>
                    ))
                  )}
                </List>
              </Menu>

              <Avatar src="https://picsum.photos/seed/admin/100/100" sx={{ width: 32, height: 32 }} />
            </Box>
          </Toolbar>
        </AppBar>
        
        <AdminSidebar 
          open={open}
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
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            width: isMobile ? '100%' : `calc(100% - ${open ? DRAWER_WIDTH : 70}px)`
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
