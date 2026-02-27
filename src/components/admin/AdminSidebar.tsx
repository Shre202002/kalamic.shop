
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
  Box
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
  { text: 'Customers', icon: <UsersIcon />, href: '/admin/users' },
  { text: 'Inventory', icon: <ProductsIcon />, href: '/admin/products' },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/admin/analytics' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid rgba(0,0,0,0.08)' },
      }}
    >
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
            <ListItemButton component={Link} href="/admin/settings" sx={{ borderRadius: 2 }}>
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
    </Drawer>
  );
}
