'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import MediumIcon from '@mui/icons-material/Remove';
import LowIcon from '@mui/icons-material/ArrowDownward';

export default function AmendsStats({ inventoryId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [inventoryId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/step8/stats');

      if (!response.ok) {
        throw new Error('Failed to load statistics');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load your progress statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        No statistics available.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your 8th Step Progress
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Track your progress with becoming willing to make amends to all the people on your list.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Overall Progress */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Overall Progress
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.willingnessPercentage}
                  color="primary"
                  sx={{ height: 10, borderradius: 1 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.willingnessPercentage}%
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Willingness to make amends
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.completedPercentage}
                  color="success"
                  sx={{ height: 10, borderradius: 1 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.completedPercentage}%
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Completed amends
            </Typography>
          </Paper>
        </Grid>

        {/* Counts by Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom>
              Summary
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="column" spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography>Completed</Typography>
                  </Box>
                  <Chip
                    label={stats.entriesCompleted}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HourglassEmptyIcon color="info" sx={{ mr: 1 }} />
                    <Typography>Willing (Not Yet Done)</Typography>
                  </Box>
                  <Chip
                    label={stats.entriesWilling - stats.entriesCompleted}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    <Typography>Not Willing Yet</Typography>
                  </Box>
                  <Chip
                    label={stats.totalEntries - stats.entriesWilling}
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle2">Total Entries</Typography>
                  </Box>
                  <Chip
                    label={stats.totalEntries}
                    color="primary"
                    size="small"
                  />
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Priority Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Priority Breakdown
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <PriorityHighIcon fontSize="large" />
                  </Box>
                  <Typography variant="h4">{stats.priorityCounts.high}</Typography>
                  <Typography variant="body2">High Priority</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'warning.light',
                    color: 'warning.contrastText',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <MediumIcon fontSize="large" />
                  </Box>
                  <Typography variant="h4">{stats.priorityCounts.medium}</Typography>
                  <Typography variant="body2">Medium Priority</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'success.light',
                    color: 'success.contrastText',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <LowIcon fontSize="large" />
                  </Box>
                  <Typography variant="h4">{stats.priorityCounts.low}</Typography>
                  <Typography variant="body2">Low Priority</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}