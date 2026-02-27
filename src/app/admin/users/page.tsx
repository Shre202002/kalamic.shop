
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Avatar, Switch, FormControlLabel } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { getAllUsers, toggleUserStatus } from '@/lib/actions/admin-actions';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getAllUsers();
      setUsers(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    await toggleUserStatus('current-admin-id', userId, newStatus);
    // Optimistic UI update
    setUsers((prev: any) => prev.map((u: any) => u._id === userId ? { ...u, status: newStatus } : u));
  };

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Collector', 
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }}>{params.row.firstName?.[0]}</Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{params.row.firstName} {params.row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{params.row.email}</Typography>
          </Box>
        </Box>
      )
    },
    { field: 'phone', headerName: 'Contact', width: 150 },
    { field: 'city', headerName: 'City', width: 120 },
    { 
      field: 'status', 
      headerName: 'Account Status', 
      width: 180,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch 
              checked={params.value === 'active'} 
              size="small" 
              onChange={() => handleStatusChange(params.row._id, params.value)}
            />
          }
          label={params.value === 'active' ? 'Active' : 'Disabled'}
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 700 } }}
        />
      )
    }
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Collector Directory</Typography>
      <Paper>
        <DataGrid
          rows={users}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none' }}
        />
      </Paper>
    </Box>
  );
}
