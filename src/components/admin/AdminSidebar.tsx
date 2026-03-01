
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
  ListSubheader
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
  AutoAwesome as AboutIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { getProfile } from '@/lib/actions/user-actions';

const drawerWidth = 240;

const MENU_ITEMS = [
  { text: 'Overview', icon: <DashboardIcon />, href: '/admin/dashboard', roles: ['super_admin', 'admin', 'support'] },
  { text: 'Orders', icon: <OrdersIcon />, href: '/admin/orders', roles: ['super_admin', 'admin', 'support'] },
  { text: 'Collectors', icon: <UsersIcon />, href: '/admin/users', roles: ['super_admin', 'admin'] },
  { text: 'Inventory', icon: <ProductsIcon />, href: '/admin/products', roles: ['super_admin', 'admin'] },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/admin/analytics', roles: ['super_admin', 'admin'] },
];

const WEBSITE_LINKS = [
  { text: 'Studio Home', icon: <HomeIcon />, href: '/' },
  { text: 'Live Catalog', icon: <StoreIcon />, href: '/products' },
  { text: 'Our Story', icon: <AboutIcon />, href: '/about' },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

export function AdminSidebar({ mobileOpen, handleDrawerToggle }: AdminSidebarProps) {
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
        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: -1 }}>
          KALAMIC ADMIN
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        {/* Admin Section */}
        <List 
          sx={{ px: 2 }}
          subheader={
            <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', lineHeight: '32px' }}>
              Control Hub
            </ListSubheader>
          }
        >
          {MENU_ITEMS.filter(item => item.roles.includes(role)).map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                component={Link} 
                href={item.href}
                selected={pathname === item.href}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{ 
                  borderRadius: 2,
                  '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
                  '&.Mui-selected .MuiListItemIcon-root': { color: 'white' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Website Links Section */}
        <List 
          sx={{ px: 2 }}
          subheader={
            <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', lineHeight: '32px' }}>
              Public Studio
            </ListSubheader>
          }
        >
          {WEBSITE_LINKS.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                component={Link} 
                href={item.href}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'secondary.main' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2, mx: 2 }} />
        
        <List sx={{ px: 2 }}>
          {role === 'super_admin' && (
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                href="/admin/settings" 
                selected={pathname === '/admin/settings'}
                sx={{ borderRadius: 2 }}
                onClick={isMobile ? handleDrawerToggle : undefined}
              >
                <ListItemIcon sx={{ minWidth: 40 }}><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Governance" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => auth.signOut()}
              sx={{ borderRadius: 2, color: 'error.main' }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(0,0,0,0.08)' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
