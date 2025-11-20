'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function NotificationsAdmin() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState({ email: [], sms: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testForm, setTestForm] = useState({ userId: '', channel: 'email', dateKey: '', overrideQuietHours: false });
  const [testResult, setTestResult] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: '',
    messageType: '',
    limit: 50
  });

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.messageType) params.append('messageType', filters.messageType);
      params.append('limit', filters.limit);

      const response = await fetch(`/api/admin/notifications/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/notifications/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLogs(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Reload logs when filters change
  useEffect(() => {
    if (activeTab === 1) {
      fetchLogs();
    }
  }, [filters, activeTab]);

  // Handle test notification
  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm)
      });

      const data = await response.json();
      setTestResult(data);
      
      if (data.success) {
        setTimeout(() => {
          setTestDialogOpen(false);
          setTestResult(null);
          setTestForm({ userId: '', channel: 'email', dateKey: '', overrideQuietHours: false });
          fetchStats();
          fetchLogs();
        }, 2000);
      }
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Notifications Management
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchStats();
              fetchLogs();
              fetchUsers();
            }}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setTestDialogOpen(true)}
          >
            Test Notification
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Email Statistics</Typography>
                </Box>
                <Typography variant="h4">{stats.email.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total emails sent
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2">
                    Success: <strong>{stats.email.successful}</strong> | 
                    Failed: <strong>{stats.email.failed}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Success Rate: <strong>{stats.email.successRate}%</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 24h: {stats.email.recent24h}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SmsIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6">SMS Statistics</Typography>
                </Box>
                <Typography variant="h4">{stats.sms.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total SMS sent
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2">
                    Success: <strong>{stats.sms.successful}</strong> | 
                    Failed: <strong>{stats.sms.failed}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Success Rate: <strong>{stats.sms.successRate}%</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 24h: {stats.sms.recent24h}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>User Preferences</Typography>
                <Typography variant="body2">
                  Email Enabled: <strong>{stats.users.emailEnabled}</strong>
                </Typography>
                <Typography variant="body2">
                  SMS Enabled: <strong>{stats.users.smsEnabled}</strong>
                </Typography>
                <Typography variant="body2">
                  App Enabled: <strong>{stats.users.appEnabled}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Logs" />
          <Tab label="User Preferences" />
        </Tabs>
      </Paper>

      {/* Logs Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Message Type</InputLabel>
                  <Select
                    value={filters.messageType}
                    label="Message Type"
                    onChange={(e) => setFilters({ ...filters, messageType: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="daily_reflection">Daily Reflection</MenuItem>
                    <MenuItem value="step10_reminder">Step 10 Reminder</MenuItem>
                    <MenuItem value="step4_checkin">Step 4 Check-in</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Limit"
                  type="number"
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 50 })}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Email Logs */}
          {(filters.type === 'all' || filters.type === 'email') && (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Email Logs ({logs.email.length})</Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sent At</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.email.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No email logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.email.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDate(log.sentAt)}</TableCell>
                        <TableCell>{log.user?.name || 'N/A'}</TableCell>
                        <TableCell>{log.email}</TableCell>
                        <TableCell>{log.messageType || 'N/A'}</TableCell>
                        <TableCell>{log.subject || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={getStatusColor(log.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* SMS Logs */}
          {(filters.type === 'all' || filters.type === 'sms') && (
            <TableContainer component={Paper}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">SMS Logs ({logs.sms.length})</Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sent At</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.sms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No SMS logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.sms.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDate(log.sentAt)}</TableCell>
                        <TableCell>{log.user?.name || 'N/A'}</TableCell>
                        <TableCell>{log.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>{log.messageType || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={getStatusColor(log.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* User Preferences Tab */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Channels</TableCell>
                <TableCell>Morning Time</TableCell>
                <TableCell>Evening Time</TableCell>
                <TableCell>Quiet Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {user.notifications.channels.app && (
                          <Chip label="App" size="small" color="primary" />
                        )}
                        {user.notifications.channels.email && (
                          <Chip label="Email" size="small" color="secondary" />
                        )}
                        {user.notifications.channels.sms && (
                          <Chip label="SMS" size="small" color="info" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{user.notifications.morningTime || 'N/A'}</TableCell>
                    <TableCell>{user.notifications.eveningTime || 'N/A'}</TableCell>
                    <TableCell>
                      {user.notifications.quietHoursStart && user.notifications.quietHoursEnd
                        ? `${user.notifications.quietHoursStart} - ${user.notifications.quietHoursEnd}`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Test Notification Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Notification</DialogTitle>
        <DialogContent>
          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              {testResult.message || testResult.error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="User ID"
            value={testForm.userId}
            onChange={(e) => setTestForm({ ...testForm, userId: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Channel</InputLabel>
            <Select
              value={testForm.channel}
              label="Channel"
              onChange={(e) => setTestForm({ ...testForm, channel: e.target.value })}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Date Key (optional, MM-DD format)"
            value={testForm.dateKey}
            onChange={(e) => setTestForm({ ...testForm, dateKey: e.target.value })}
            placeholder="e.g., 01-15"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={testForm.overrideQuietHours}
                onChange={(e) => setTestForm({ ...testForm, overrideQuietHours: e.target.checked })}
              />
            }
            label="Override quiet hours (send even during user's quiet hours)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTestNotification} variant="contained">
            Send Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

