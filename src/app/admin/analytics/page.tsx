
'use client';

import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress, Divider } from '@mui/material';
import { PieChart, LineChart, BarChart } from '@mui/x-charts';
import { getDashboardChartData, getAdminDashboardStats } from '@/lib/actions/admin-actions';
import { TrendingUp, PieChart as PieIcon, Insights, ShowChart } from '@mui/icons-material';

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
      <Typography variant="h4" sx={{ mb: 1 }}>Artisan Insights</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Deep-dive analysis of collector behavior and catalog performance.</Typography>

      <Grid container spacing={3}>
        {/* Conversion & Growth */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: 450 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <Insights color="primary" />
              <Typography variant="h6">Sales vs Acquisition Trend</Typography>
            </Box>
            <LineChart
              xAxis={[{ data: charts.sales.map((s: any) => s.day), scaleType: 'point' }]}
              series={[
                { data: charts.sales.map((s: any) => s.value), color: '#EA781E', label: 'Revenue (₹)', area: true },
              ]}
              height={350}
            />
          </Paper>
        </Grid>

        {/* Category Mix */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, minHeight: 450 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <PieIcon color="secondary" />
              <Typography variant="h6">Category Distribution</Typography>
            </Box>
            <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <PieChart
                series={[{
                  data: charts.categories,
                  innerRadius: 60,
                  outerRadius: 100,
                  paddingAngle: 5,
                  cornerRadius: 5,
                }]}
                width={300}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Metrics Grid */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Conversion Rate</Typography>
                  <Typography variant="h4" color="primary">{stats.conversionRate}%</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption">Total orders relative to collector registrations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Wishlist Intensity</Typography>
                  <Typography variant="h4" color="secondary">{stats.wishlistActivity}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption">Total pieces saved by collectors this month</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">Collector LTV</Typography>
                  <Typography variant="h4" color="info">₹{(stats.revenue / (stats.users || 1)).toFixed(0)}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption">Average Lifetime Value per registered artisan</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Growth Bar */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <ShowChart color="success" />
              <Typography variant="h6">Collector Registration Velocity</Typography>
            </Box>
            <BarChart
              xAxis={[{ scaleType: 'band', data: charts.users.map((u: any) => u.month) }]}
              series={[{ data: charts.users.map((u: any) => u.count), color: '#8B9689', label: 'New Collectors' }]}
              height={300}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
