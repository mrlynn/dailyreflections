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
  Stack,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import MediumIcon from '@mui/icons-material/Remove';
import LowIcon from '@mui/icons-material/ArrowDownward';
import FaceIcon from '@mui/icons-material/Face';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function AmendsStats({ inventoryId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchStats();
  }, [inventoryId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/step9/stats');

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

  if (!stats || stats.totalEntries === 0) {
    return (
      <Alert severity="info">
        No statistics available. Add amends entries to see your progress.
      </Alert>
    );
  }

  // Prepare data for pie chart
  const statusData = [
    { name: 'Not Started', value: stats.statusCounts.not_started, color: theme.palette.error.main },
    { name: 'Planned', value: stats.statusCounts.planned, color: theme.palette.info.main },
    { name: 'In Progress', value: stats.statusCounts.in_progress, color: theme.palette.warning.main },
    { name: 'Completed', value: stats.statusCounts.completed, color: theme.palette.success.main },
    { name: 'Deferred', value: stats.statusCounts.deferred, color: theme.palette.grey[500] },
    { name: 'Not Possible', value: stats.statusCounts.not_possible, color: theme.palette.grey[700] }
  ].filter(item => item.value > 0);

  // Prepare data for method bar chart
  const methodData = [
    { name: 'In Person', value: stats.methodCounts.in_person, color: theme.palette.primary.main },
    { name: 'Phone', value: stats.methodCounts.phone, color: theme.palette.secondary.main },
    { name: 'Letter', value: stats.methodCounts.letter, color: theme.palette.warning.main },
    { name: 'Email', value: stats.methodCounts.email, color: theme.palette.info.main },
    { name: 'Indirect', value: stats.methodCounts.indirect, color: theme.palette.error.light },
    { name: 'Other', value: stats.methodCounts.other, color: theme.palette.grey[500] }
  ].filter(item => item.value > 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your 9th Step Progress
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Track your progress in making direct amends to those you've harmed.
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
                  value={stats.plannedPercentage}
                  color="primary"
                  sx={{ height: 10, borderradius: 1 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.plannedPercentage}%
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Amends planned or in progress
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
                    <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
                    <Typography>In Progress</Typography>
                  </Box>
                  <Chip
                    label={stats.entriesInProgress}
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventNoteIcon color="info" sx={{ mr: 1 }} />
                    <Typography>Planned</Typography>
                  </Box>
                  <Chip
                    label={stats.entriesPlanned}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    <Typography>Not Started</Typography>
                  </Box>
                  <Chip
                    label={stats.statusCounts.not_started}
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PauseCircleOutlineIcon sx={{ mr: 1, color: theme.palette.grey[500] }} />
                    <Typography>Deferred</Typography>
                  </Box>
                  <Chip
                    label={stats.entriesDeferred}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BlockIcon sx={{ mr: 1, color: theme.palette.grey[700] }} />
                    <Typography>Not Possible</Typography>
                  </Box>
                  <Chip
                    label={stats.entriesNotPossible}
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

        {/* Status Breakdown Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Status Distribution
            </Typography>

            <Box sx={{ height: 300, mt: 2 }}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend layout="vertical" verticalAlign="bottom" align="center" />
                    <Tooltip formatter={(value) => [`${value} entries`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No status data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Method Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Amends Methods Used
            </Typography>

            <Box sx={{ height: 300, mt: 2 }}>
              {methodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={methodData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Count">
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No method data available yet</Typography>
                </Box>
              )}
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