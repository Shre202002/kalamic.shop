
'use client';

import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress } from '@mui/material';
import { 
  TrendingUp, 
  ShoppingCart, 
  People, 
  AttachMoney,
  ArrowUpward
} from '@mui/icons-material';
import { LineChart, BarChart } from '@mui/x-charts';
import { getAdminDashboardStats, getDashboardChartData } from '@/lib/actions/admin-actions';

function StatCard({ title, value, icon, color, trend }: any) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ bgcolor: `${color}.light`, p: 1, borderRadius: 2, color: `${color}.main`, display: 'flex' }}>
            {icon}
          </Box>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', fontSize: '0.75rem', fontWeight: 700 }}>
              <ArrowUpward sx={{ fontSize: '1rem', mr: 0.5 }} /> {trend}
            </Box>
          )}
        </Box>
        <Typography color="text.secondary" variant="overline" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [s, c] = await Promise.all([getAdminDashboardStats(), getDashboardChartData()]);
      setStats(s);
      setCharts(c);
    }
    loadData();
  }, []);

  if (!stats || !charts) return <LinearProgress color="primary" />;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Operations Overview</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Revenue" 
            value={`₹${(stats.revenue ?? 0).toLocaleString()}`} 
            icon={<AttachMoney />} 
            color="primary" 
            trend="12%" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Orders" 
            value={(stats.orders ?? 0).toLocaleString()} 
            icon={<ShoppingCart />} 
            color="secondary" 
            trend="8%" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Users" 
            value={(stats.activeUsers ?? 0).toLocaleString()} 
            icon={<People />} 
            color="info" 
            trend="5%" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Acquisitions" 
            value={(stats.pendingOrders ?? 0).toLocaleString()} 
            icon={<TrendingUp />} 
            color="warning" 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>Sales Journey (Last 7 Days)</Typography>
            <LineChart
              xAxis={[{ data: (charts.sales || []).map((s: any) => s.day), scaleType: 'point' }]}
              series={[{ data: (charts.sales || []).map((s: any) => s.value || 0), color: '#EA781E', area: true }]}
              height={300}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>Collector Growth</Typography>
            <BarChart
              xAxis={[{ scaleType: 'band', data: (charts.users || []).map((u: any) => u.month) }]}
              series={[{ data: (charts.users || []).map((u: any) => u.count || 0), color: '#ECC444' }]}
              height={300}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
