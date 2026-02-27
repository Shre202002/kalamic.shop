
'use client';

import React from 'react';
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
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  ShoppingCart as OrdersIcon, 
  People as UsersIcon, 
  Inventory as ProductsIcon, 
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const drawerWidth = 240;

const MENU_ITEMS = [
  { text: 'Overview', icon: <DashboardIcon />, href: '/admin/dashboard' },
  { text: 'Orders', icon: <OrdersIcon />, href: '/admin/orders' },
  { text: 'Collectors', icon: <UsersIcon />, href: '/admin/users' },
  { text: 'Inventory', icon: <ProductsIcon />, href: '/admin/products' },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/admin/analytics' },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

export function AdminSidebar({ mobileOpen, handleDrawerToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: -1 }}>
          KALAMIC ADMIN
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List sx={{ px: 2 }}>
          {MENU_ITEMS.map((item) => (
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
        <List sx={{ px: 2 }}>
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              href="/admin/settings" 
              sx={{ borderRadius: 2 }}
              onClick={isMobile ? handleDrawerToggle : undefined}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton sx={{ borderRadius: 2, color: 'error.main' }}>
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
      {/* Mobile Drawer */}
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

      {/* Desktop Drawer */}
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
