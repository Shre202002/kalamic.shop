
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  LinearProgress, 
  Divider, 
  Stack, 
  alpha, 
  Avatar, 
  Tooltip 
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PieChart, LineChart, BarChart } from '@mui/x-charts';
import { 
  getDashboardChartData, 
  getAdminDashboardStats, 
  getProductPerformanceData 
} from '@/lib/actions/admin-actions';
import { 
  Insights, 
  ShowChart, 
  ShoppingCart, 
  Favorite, 
  AccountBalanceWallet,
  AutoGraph,
  PieChart as PieIcon,
  Visibility as ViewIcon,
  ShoppingBag as OrderIcon,
  Share as ShareIcon,
  Inventory as InventoryIcon,
  Image as ImageIcon
} from '@mui/icons-material';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [productData, setProductPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [s, c, p] = await Promise.all([
          getAdminDashboardStats(), 
          getDashboardChartData(), 
          getProductPerformanceData()
        ]);
        setStats(s);
        setCharts(c);
        setProductPerformance(p);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const productColumns: GridColDef[] = useMemo(() => [
    {
      field: 'images',
      headerName: 'Piece',
      width: 60,
      renderCell: (params) => {
        const primary = params.value?.find((img: any) => img.is_primary) || params.value?.[0];
        return <Avatar variant="rounded" src={primary?.url} sx={{ width: 32, height: 32, bgcolor: alpha('#C97A40', 0.1) }}><ImageIcon sx={{ fontSize: 16 }} /></Avatar>;
      }
    },
    {
      field: 'name',
      headerName: 'Artisan piece',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', lineHeight: 1.2 }}>{params.value}</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>{params.row.sku || 'NO-SKU'}</Typography>
        </Box>
      )
    },
    {
      field: 'total_views',
      headerName: 'Views',
      width: 90,
      valueGetter: (value, row) => row.analytics?.total_views || 0,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <ViewIcon sx={{ fontSize: 14, color: 'info.main', opacity: 0.6 }} />
          <Typography variant="caption" fontWeight={700}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'total_orders',
      headerName: 'Sold',
      width: 90,
      valueGetter: (value, row) => row.analytics?.total_orders || 0,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <OrderIcon sx={{ fontSize: 14, color: 'success.main', opacity: 0.6 }} />
          <Typography variant="caption" fontWeight={900} color="success.main">{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'cart_add_count',
      headerName: 'Carted',
      width: 90,
      valueGetter: (value, row) => row.analytics?.cart_add_count || 0,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <ShoppingCart sx={{ fontSize: 14, color: 'warning.main', opacity: 0.6 }} />
          <Typography variant="caption" fontWeight={700}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'wishlist_count',
      headerName: 'Saved',
      width: 90,
      valueGetter: (value, row) => row.analytics?.wishlist_count || 0,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Favorite sx={{ fontSize: 14, color: 'error.main', opacity: 0.6 }} />
          <Typography variant="caption" fontWeight={700}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'share_count',
      headerName: 'Shared',
      width: 90,
      valueGetter: (value, row) => row.analytics?.share_count || 0,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <ShareIcon sx={{ fontSize: 14, color: 'secondary.main', opacity: 0.6 }} />
          <Typography variant="caption" fontWeight={700}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'conversion',
      headerName: 'Conv %',
      width: 100,
      valueGetter: (value, row) => {
        const views = row.analytics?.total_views || 0;
        const orders = row.analytics?.total_orders || 0;
        return views > 0 ? ((orders / views) * 100).toFixed(1) : '0.0';
      },
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', mb: 0.5 }}>{params.value}%</Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(parseFloat(params.value as string) * 5, 100)} 
            sx={{ height: 3, borderRadius: 1, bgcolor: alpha('#eee', 0.5) }} 
            color={parseFloat(params.value as string) > 5 ? "success" : "primary"}
          />
        </Box>
      )
    }
  ], []);

  if (loading || !stats || !charts) return <LinearProgress color="primary" sx={{ mt: 4 }} />;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: -0.5 }}>Artisan Insights</Typography>
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

        {/* Product performance list */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 5, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#EA781E', 0.1) }}>
                <InventoryIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Artisan Piece Performance</Typography>
                <Typography variant="caption" color="text.secondary">Deep analysis of piece discovery, intent, and acquisitions.</Typography>
              </Box>
            </Box>
            <DataGrid
              rows={productData}
              getRowId={(row) => row._id}
              columns={productColumns}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              sx={{ 
                border: 'none',
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha('#FAF4EB', 0.5),
                  borderBottom: `1px solid ${alpha('#000', 0.05)}`
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: 1,
                  color: 'text.secondary'
                }
              }}
            />
          </Paper>
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
