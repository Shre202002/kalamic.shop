
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Divider,
  Box,
  useMediaQuery,
  useTheme,
  ListSubheader,
  Tooltip,
  styled,
  Theme,
  CSSObject
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  ShoppingCart as OrdersIcon, 
  People as UsersIcon, 
  Inventory as ProductsIcon, 
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Storefront as StoreIcon,
  AutoAwesome as AboutIcon,
  PhotoLibrary as PhotoLibraryIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { getProfile } from '@/lib/actions/user-actions';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DesktopDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const MENU_ITEMS = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/admin/dashboard', roles: ['super_admin', 'admin', 'support'] },
  { text: 'Orders', icon: <OrdersIcon />, href: '/admin/orders', roles: ['super_admin', 'admin', 'support'] },
  { text: 'Gallery Studio', icon: <PhotoLibraryIcon />, href: '/admin/gallery', roles: ['super_admin', 'admin'] },
  { text: 'Users', icon: <UsersIcon />, href: '/admin/users', roles: ['super_admin', 'admin'] },
  { text: 'Products', icon: <ProductsIcon />, href: '/admin/products', roles: ['super_admin', 'admin'] },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/admin/analytics', roles: ['super_admin', 'admin'] },
];

const WEBSITE_LINKS = [
  { text: 'Home', icon: <HomeIcon />, href: '/' },
  { text: 'Products', icon: <StoreIcon />, href: '/products' },
  { text: 'About', icon: <AboutIcon />, href: '/about' },
];

interface AdminSidebarProps {
  open: boolean;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

export function AdminSidebar({ open, mobileOpen, handleDrawerToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useUser();
  const auth = useAuth();
  const [role, setRole] = useState<string>('user');

  useEffect(() => {
    async function fetchRole() {
      if (user) {
        const profile = await getProfile(user.uid);
        setRole(profile?.role || 'user');
      }
    }
    fetchRole();
  }, [user]);

  const drawerContent = (
    <>
      <Toolbar>
        {open ? (
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: -1 }}>
            KALAMIC ADMIN
          </Typography>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mx: 'auto' }}>
            K
          </Typography>
        )}
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        {/* Admin Section */}
        <List 
          sx={{ px: open ? 2 : 1 }}
          subheader={
            open ? (
              <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', lineHeight: '32px' }}>
                Management
              </ListSubheader>
            ) : null
          }
        >
          {MENU_ITEMS.filter(item => item.roles.includes(role)).map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={!open ? item.text : ""} placement="right">
                <ListItemButton 
                  component={Link} 
                  href={item.href}
                  selected={pathname === item.href}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                  sx={{ 
                    borderRadius: 2,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
                    '&.Mui-selected .MuiListItemIcon-root': { color: 'white' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Website Links Section */}
        <List 
          sx={{ px: open ? 2 : 1 }}
          subheader={
            open ? (
              <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', lineHeight: '32px' }}>
                Storefront
              </ListSubheader>
            ) : null
          }
        >
          {WEBSITE_LINKS.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={!open ? item.text : ""} placement="right">
                <ListItemButton 
                  component={Link} 
                  href={item.href}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                  sx={{ 
                    borderRadius: 2,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'secondary.main' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2, mx: 2 }} />
        
        <List sx={{ px: open ? 2 : 1 }}>
          {role === 'super_admin' && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={!open ? "Settings" : ""} placement="right">
                <ListItemButton 
                  component={Link} 
                  href="/admin/settings" 
                  selected={pathname === '/admin/settings'}
                  sx={{ borderRadius: 2, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )}
          <ListItem disablePadding>
            <Tooltip title={!open ? "Logout" : ""} placement="right">
              <ListItemButton 
                onClick={() => auth.signOut()}
                sx={{ borderRadius: 2, color: 'error.main', justifyContent: open ? 'initial' : 'center', px: 2.5 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <DesktopDrawer variant="permanent" open={open}>
      {drawerContent}
    </DesktopDrawer>
  );
}
