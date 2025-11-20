'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FeedbackIcon from '@mui/icons-material/Feedback';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import FeedbackAnalyticsTab from '@/components/Admin/Volunteer/FeedbackAnalyticsTab';

// Chart color constants
const COLORS = {
  primary: '#5DA6A7',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  pending: '#FFC107',
  approved: '#4CAF50',
  rejected: '#F44336',
  total: '#5DA6A7',
};

/**
 * Admin Volunteer Analytics Page
 */
export default function AdminVolunteerAnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('6months'); // 'all', '30days', '6months', '12months'
  const [tabValue, setTabValue] = useState(0);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/volunteers/analytics?timeRange=${timeRange}`);

        if (!response.ok) {
          throw new Error(`Error fetching analytics data: ${response.status}`);
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if user is admin
  const isAdmin = session?.user?.isAdmin === true;

  // If not authenticated or not admin
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated' || !isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Alert>
        <Button
          component={Link}
          href="/admin"
          startIcon={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Prepare pie chart data for application status
  const getApplicationStatusData = () => {
    if (!analytics || !analytics.applicationStats) return [];

    return [
      { name: 'Pending', value: analytics.applicationStats.pending, color: COLORS.pending },
      { name: 'Approved', value: analytics.applicationStats.approved, color: COLORS.approved },
      { name: 'Rejected', value: analytics.applicationStats.rejected, color: COLORS.rejected },
    ];
  };

  // Prepare pie chart data for volunteer status
  const getVolunteerStatusData = () => {
    if (!analytics || !analytics.volunteerStats) return [];

    return [
      { name: 'Active', value: analytics.volunteerStats.active, color: COLORS.approved },
      { name: 'Inactive', value: analytics.volunteerStats.inactive, color: COLORS.warning },
    ];
  };

  // Format processing time for display
  const formatProcessingDays = (days) => {
    if (days === 0) return 'Less than 1 day';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Button
            component={Link}
            href="/admin"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Volunteer Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Statistical insights for the volunteer program
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
          >
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="6months">Last 6 Months</MenuItem>
            <MenuItem value="12months">Last 12 Months</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      ) : !analytics ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No analytics data available.
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      Total Applications
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
                    {analytics.applicationStats.total}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    During selected period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon sx={{ color: COLORS.approved, mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      Approval Rate
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
                    {analytics.applicationStats.approvalRate}%
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {analytics.applicationStats.approved} approved out of {analytics.applicationStats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon sx={{ color: COLORS.success, mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      Active Volunteers
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
                    {analytics.volunteerStats.active}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {analytics.volunteerStats.activityRate}% of volunteers are active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      Review Time
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
                    {analytics.processingTimeMetrics.averageProcessingTime}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Average days to process applications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for different chart views */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Applications" />
              <Tab label="Volunteers" />
              <Tab label="Processing Times" />
              <Tab label="Engagement" />
              <Tab label="Feedback" icon={<FeedbackIcon />} iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Applications Tab */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardHeader title="Applications Over Time" />
                      <CardContent>
                        <Box sx={{ height: 400 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={analytics.timeBasedMetrics.applications.labels.map((label, index) => ({
                                name: label,
                                Approved: analytics.timeBasedMetrics.applications.approved[index],
                                Pending: analytics.timeBasedMetrics.applications.pending[index],
                                Rejected: analytics.timeBasedMetrics.applications.rejected[index],
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="Approved" stackId="a" fill={COLORS.approved} />
                              <Bar dataKey="Pending" stackId="a" fill={COLORS.pending} />
                              <Bar dataKey="Rejected" stackId="a" fill={COLORS.rejected} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardHeader title="Application Status" />
                      <CardContent>
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getApplicationStatusData()}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {getApplicationStatusData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Volunteers Tab */}
              {tabValue === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardHeader title="Volunteer Activations Over Time" />
                      <CardContent>
                        <Box sx={{ height: 400 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={analytics.timeBasedMetrics.volunteers.labels.map((label, index) => ({
                                name: label,
                                Volunteers: analytics.timeBasedMetrics.volunteers.count[index],
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="Volunteers"
                                stroke={COLORS.primary}
                                activeDot={{ r: 8 }}
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardHeader title="Volunteer Status" />
                      <CardContent>
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getVolunteerStatusData()}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {getVolunteerStatusData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Processing Times Tab */}
              {tabValue === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title="Average Processing Times" />
                      <CardContent>
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                {
                                  name: 'Overall Average',
                                  days: analytics.processingTimeMetrics.averageProcessingTime
                                },
                                {
                                  name: 'Approvals',
                                  days: analytics.processingTimeMetrics.averageApprovalTime
                                },
                                {
                                  name: 'Rejections',
                                  days: analytics.processingTimeMetrics.averageRejectionTime
                                }
                              ]}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" domain={[0, 'dataMax + 1']} />
                              <YAxis dataKey="name" type="category" width={90} />
                              <Tooltip formatter={(value) => formatProcessingDays(value)} />
                              <Legend />
                              <Bar dataKey="days" name="Days" fill={COLORS.primary} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title="Processing Details" />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Average Processing Time
                            </Typography>
                            <Typography variant="body1">
                              {formatProcessingDays(analytics.processingTimeMetrics.averageProcessingTime)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Processed Applications
                            </Typography>
                            <Typography variant="body1">
                              {analytics.processingTimeMetrics.processedApplications} of {analytics.applicationStats.total}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Average Approval Time
                            </Typography>
                            <Typography variant="body1">
                              {formatProcessingDays(analytics.processingTimeMetrics.averageApprovalTime)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Average Rejection Time
                            </Typography>
                            <Typography variant="body1">
                              {formatProcessingDays(analytics.processingTimeMetrics.averageRejectionTime)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Volunteer Engagement Tab */}
              {tabValue === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title="Volunteer Login Activity" />
                      <CardContent>
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.volunteerStats.engagement?.loginDistribution || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {(analytics.volunteerStats.engagement?.loginDistribution || []).map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      index === 0 ? COLORS.success :
                                      index === 1 ? COLORS.primary :
                                      index === 2 ? COLORS.warning :
                                      COLORS.error
                                    }
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title="Engagement Details" />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Active Today
                            </Typography>
                            <Typography variant="body1">
                              {analytics.volunteerStats.engagement?.loggedInToday || 0} volunteers
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Active This Week
                            </Typography>
                            <Typography variant="body1">
                              {analytics.volunteerStats.engagement?.loggedInThisWeek || 0} volunteers
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Active This Month
                            </Typography>
                            <Typography variant="body1">
                              {analytics.volunteerStats.engagement?.loggedInThisMonth || 0} volunteers
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom>
                              Inactive Volunteers
                            </Typography>
                            <Typography variant="body1">
                              {analytics.volunteerStats.engagement?.notRecentlyActive || 0} volunteers
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardHeader title="Chat Session Metrics" />
                      <CardContent>
                        {analytics.volunteerStats.sessionMetrics &&
                          analytics.volunteerStats.sessionMetrics.totalSessions > 0 ? (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                  Total Chat Sessions
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                                  {analytics.volunteerStats.sessionMetrics.totalSessions}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                  Average Sessions Per Volunteer
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                                  {analytics.volunteerStats.sessionMetrics.avgSessionsPerVolunteer}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        ) : (
                          <Alert severity="info">
                            Chat session data will be available once the chat feature is implemented and volunteers begin supporting users.
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Feedback Tab */}
              {tabValue === 4 && (
                <FeedbackAnalyticsTab analytics={analytics} />
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          component={Link}
          href="/admin/volunteers/manage"
          variant="outlined"
          startIcon={<PeopleIcon />}
        >
          Manage Volunteers
        </Button>
        <Button
          component={Link}
          href="/admin/volunteers/applications"
          variant="outlined"
          startIcon={<CheckCircleIcon />}
        >
          Review Applications
        </Button>
      </Box>
    </Box>
  );
}