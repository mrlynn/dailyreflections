'use client';

// Ensures Next.js knows this is a client component
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import { fetchAdminStats } from './fetchData';

// Define mock data for initial rendering
const DEFAULT_STATS = {
  totalUsers: 0,
  totalComments: 0,
  totalChatMessages: 0,
  totalMeetings: 0,
  activeUsers: 0,
};

const DEFAULT_ACTIVITY = [];

export default function TestAdminDashboard() {
  // Add immediate console log for debugging
  console.log('🚨 TestAdminDashboard Component Rendering');

  // Use direct state initialization instead of useEffect for simpler flow
  const [dashboardData, setDashboardData] = useState({
    stats: DEFAULT_STATS,
    recentActivity: DEFAULT_ACTIVITY,
  });
  // Initialize loading to false so we can see the initial stats (even if they're zeros)
  // This helps us debug whether state transitions are happening
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Add debug state to store raw API response
  const [rawApiResponse, setRawApiResponse] = useState(null);
  const [debugVisible, setDebugVisible] = useState(true);

  // Simple function to load data using our separate fetchData function
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Manually fetching admin stats data...');

      // Use our extracted fetchAdminStats function
      const data = await fetchAdminStats();

      console.log('Data received from fetchAdminStats:', data);

      if (data.rawResponse) {
        setRawApiResponse(data.rawResponse);
      }

      // Update dashboard data state with the fetched data
      setDashboardData({
        stats: data.stats,
        recentActivity: data.recentActivity || [],
      });

      setError(null);
      console.log('Setting loading to false after successful fetch');
    } catch (err) {
      console.error('Error in loadDashboardData:', err);
      setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}. See console for details.`);
      setDashboardData({
        stats: DEFAULT_STATS,
        recentActivity: DEFAULT_ACTIVITY,
      });
    } finally {
      console.log('Finally block executed, setting loading state to false');
      setLoading(false);
      console.log('Loading state should now be false');
    }
  };

  // Flag to track client-side rendering
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load data once we're confirmed on the client side
  useEffect(() => {
    if (isClient) {
      console.log('CLIENT SIDE DETECTED - LOADING DATA');
      const controller = new AbortController();

      // Set loading true only when we're actively fetching
      setLoading(true);
      loadDashboardData();

      // Cleanup function to prevent state updates after unmount
      return () => {
        controller.abort();
      };
    }
  }, [isClient]);

  console.log('Rendering component, loading state:', loading, 'Has stats data:', dashboardData.stats?.totalUsers > 0);

  // Show loading spinner while data is being fetched
  if (loading) {
    console.log('Rendering loading state...');
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="body1" sx={{ mb: 2 }}>Loading admin dashboard data...</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            console.log('Skip loading button clicked');
            setLoading(false);
            console.log('Loading state set to false by button click');
          }}
        >
          Skip Loading (Show Dashboard)
        </Button>
      </Box>
    );
  }

  console.log('About to render dashboard with data:', dashboardData);

  // Extract data for easier access
  const { stats, recentActivity } = dashboardData;

  console.log('Dashboard data extracted:', { stats, recentActivity });

  // Debug state values for troubleshooting
  const debugValues = {
    totalUsers: {
      value: stats.totalUsers,
      type: typeof stats.totalUsers,
      isNumber: typeof stats.totalUsers === 'number',
      stringified: String(stats.totalUsers)
    },
    totalComments: {
      value: stats.totalComments,
      type: typeof stats.totalComments,
      isNumber: typeof stats.totalComments === 'number',
      stringified: String(stats.totalComments)
    },
    totalChatMessages: {
      value: stats.totalChatMessages,
      type: typeof stats.totalChatMessages,
      isNumber: typeof stats.totalChatMessages === 'number',
      stringified: String(stats.totalChatMessages)
    },
    totalMeetings: {
      value: stats.totalMeetings,
      type: typeof stats.totalMeetings,
      isNumber: typeof stats.totalMeetings === 'number',
      stringified: String(stats.totalMeetings)
    },
    activeUsers: {
      value: stats.activeUsers,
      type: typeof stats.activeUsers,
      isNumber: typeof stats.activeUsers === 'number',
      stringified: String(stats.activeUsers)
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
        Admin Dashboard (Test Version)
      </Typography>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button
            variant="outlined"
            color="error"
            size="small"
            sx={{ ml: 2 }}
            onClick={loadDashboardData}
          >
            Retry
          </Button>
        </Alert>
      )}

      <Alert severity="warning" sx={{ mb: 3 }}>
        This is a test version of the admin dashboard that shows real data from the database.
        In production, this page would be protected by authentication.
      </Alert>

      {/* Debug Panel */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Debug Information
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setDebugVisible(!debugVisible)}
          >
            {debugVisible ? 'Hide Debug Info' : 'Show Debug Info'}
          </Button>
        </Box>

        {debugVisible && (
          <>
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">State Values Types:</Typography>
              <pre style={{
                backgroundColor: '#e0e0e0',
                padding: '8px',
                overflowX: 'auto',
                fontSize: '0.75rem'
              }}>
                {JSON.stringify(debugValues, null, 2)}
              </pre>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">Raw API Response:</Typography>
              <pre style={{
                backgroundColor: '#e0e0e0',
                padding: '8px',
                overflowX: 'auto',
                fontSize: '0.75rem'
              }}>
                {rawApiResponse || 'No API response captured'}
              </pre>
            </Box>

            <Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={loadDashboardData}
                sx={{ mr: 1 }}
              >
                Reload Data
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => {
                  console.log('Force update state with hard-coded values');
                  setDashboardData({
                    stats: {
                      totalUsers: 3,
                      totalComments: 1,
                      totalChatMessages: 78,
                      totalMeetings: 7,
                      activeUsers: 1
                    },
                    recentActivity: [
                      { type: 'comment', user: 'Test User 1', content: 'Added a comment', time: '15 minutes ago' },
                      { type: 'login', user: 'Test User 2', content: 'Logged in', time: '30 minutes ago' }
                    ]
                  });
                }}
              >
                Force Update State
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon fontSize="large" color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="Total Comments"
            value={stats.totalComments}
            icon={<ChatIcon fontSize="large" color="secondary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="Chat Messages"
            value={stats.totalChatMessages}
            icon={<SmartToyIcon fontSize="large" color="warning" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="AA Meetings"
            value={stats.totalMeetings}
            icon={<EventIcon fontSize="large" color="info" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="Active Today"
            value={stats.activeUsers}
            icon={<CalendarMonthIcon fontSize="large" color="success" />}
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={loadDashboardData}
              >
                Refresh Data
              </Button>
            </Box>
            <List>
              {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <Box key={index}>
                    <ListItem>
                      <ListItemText
                        primary={activity.user || 'Unknown User'}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {activity.content || 'No content'}
                            </Typography>
                            <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                              {activity.time || 'Unknown time'}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </Box>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No recent activity"
                    secondary="This will be populated once users start interacting with the app"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Admin Quick Links
            </Typography>
            <List>
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/users">
                  <ListItemText primary="User Management" secondary="View, edit, and manage user accounts" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/moderation">
                  <ListItemText primary="Comment Moderation" secondary="Review and moderate user comments" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/rag-sources">
                  <ListItemText primary="RAG Sources Management" secondary="Manage chatbot knowledge sources" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/analytics">
                  <ListItemText primary="Analytics & Reports" secondary="View detailed usage statistics" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/meetings">
                  <ListItemText primary="Meetings Management" secondary="Add, edit, and manage AA meetings" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Stat Card Component
function StatCard({ title, value, icon }) {
  // Ensure value is a number before using toLocaleString
  // Add additional logging to debug
  console.log(`StatCard ${title} value:`, value, typeof value);

  // Handle different types of values with more defensive programming
  let displayValue = '0';

  try {
    if (value !== undefined && value !== null) {
      // Make sure we're working with a number
      if (typeof value === 'number') {
        // Already a number, just format it
        displayValue = isNaN(value) ? '0' : value.toLocaleString();
      } else {
        // Try to convert to number
        const numericValue = Number(value);

        // Only call toLocaleString if it's a valid number
        if (!isNaN(numericValue)) {
          displayValue = numericValue.toLocaleString();
        } else {
          // Fallback to string representation if not a valid number
          displayValue = String(value);
        }
      }
    }
  } catch (error) {
    console.error(`Error formatting value for ${title}:`, error);
    displayValue = '0'; // Safe fallback
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
          {displayValue}
        </Typography>
      </CardContent>
    </Card>
  );
}