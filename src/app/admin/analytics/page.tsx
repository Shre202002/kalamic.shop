'use client';

import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress, Divider, Stack, alpha } from '@mui/material';
import { PieChart, LineChart, BarChart } from '@mui/x-charts';
import { getDashboardChartData, getAdminDashboardStats } from '@/lib/actions/admin-actions';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Insights, 
  ShowChart, 
  ShoppingCart, 
  Favorite, 
  AccountBalanceWallet,
  AutoGraph
} from '@mui/icons-material';

export default function AnalyticsPage() {
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

  if (!stats || !charts) return <LinearProgress color="primary" sx={{ mt: 4 }} />;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Artisan Insights</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
          Live performance analysis of the Kalamic collection and collector ecosystem.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* KPI Grid */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>Conversion Rate</Typography>
                    <AutoGraph sx={{ color: 'primary.main', opacity: 0.5 }} />
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.conversionRate}%</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Acquisitions relative to registrations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>Avg Order Value</Typography>
                    <AccountBalanceWallet sx={{ color: 'success.main', opacity: 0.5 }} />
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>₹{stats.avgOrderValue}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Mean transaction value recorded</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>Wishlist Intensity</Typography>
                    <Favorite sx={{ color: 'error.main', opacity: 0.5 }} />
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.wishlistActivity}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Pieces currently saved by community</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>Total Acquisitions</Typography>
                    <ShoppingCart sx={{ color: 'info.main', opacity: 0.5 }} />
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.orders}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Cumulative orders in archive</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Sales Journey Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 5, minHeight: 480 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#C97A40', 0.1) }}>
                <Insights sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Acquisition Revenue Trend</Typography>
                <Typography variant="caption" color="text.secondary">Daily successful transaction volume (Last 7 Days)</Typography>
              </Box>
            </Box>
            <LineChart
              xAxis={[{ data: charts.sales.map((s: any) => s.day), scaleType: 'point' }]}
              series={[
                { 
                  data: charts.sales.map((s: any) => s.value), 
                  color: '#C97A40', 
                  label: 'Revenue (₹)', 
                  area: true,
                  valueFormatter: (v) => `₹${v?.toLocaleString()}`
                },
              ]}
              height={350}
              margin={{ left: 60, right: 30, top: 30, bottom: 30 }}
            />
          </Paper>
        </Grid>

        {/* Top Product Mix */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, borderRadius: 5, minHeight: 480 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6F8A7A', 0.1) }}>
                <PieIcon sx={{ color: 'secondary.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Acquisition Mix</Typography>
                <Typography variant="caption" color="text.secondary">Top performing artisan pieces</Typography>
              </Box>
            </Box>
            <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <PieChart
                series={[{
                  data: charts.categories,
                  innerRadius: 70,
                  outerRadius: 110,
                  paddingAngle: 5,
                  cornerRadius: 10,
                  cx: '50%',
                  cy: '50%',
                }]}
                width={300}
                height={300}
                legend={{ hidden: true }}
              />
            </Box>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {charts.categories.map((cat: any) => (
                <Box key={cat.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{cat.label}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>{cat.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Growth Bar */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#4caf50', 0.1) }}>
                <ShowChart sx={{ color: 'success.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Collector Registration Velocity</Typography>
                <Typography variant="caption" color="text.secondary">Community growth trajectory (Last 6 Months)</Typography>
              </Box>
            </Box>
            <BarChart
              xAxis={[{ scaleType: 'band', data: charts.users.map((u: any) => u.month) }]}
              series={[
                { 
                  data: charts.users.map((u: any) => u.count), 
                  color: '#8B9689', 
                  label: 'New Collectors',
                  highlightScope: { faded: 'global', highlighted: 'item' },
                }
              ]}
              height={300}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
