'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComments: 0,
    totalChatMessages: 0,
    totalMeetings: 0,
    activeUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // First try the authenticated endpoint
        let response = await fetch('/api/admin/stats');

        // If not authenticated, use the test endpoint during development
        if (!response.ok && process.env.NODE_ENV === 'development') {
          console.log('Using test stats endpoint for development');
          response = await fetch('/api/admin/stats/test');
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch admin stats: ${response.status}`);
        }

        const data = await response.json();

        // Update stats and recent activity with real data from API
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        // Show default stats in case of error
        setStats({
          totalUsers: 0,
          totalComments: 0,
          totalChatMessages: 0,
          totalMeetings: 0,
          activeUsers: 0,
        });
        setRecentActivity([]);
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
        Admin Dashboard
      </Typography>

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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <Box key={index}>
                  <ListItem>
                    <ListItemText
                      primary={activity.user}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {activity.content}
                          </Typography>
                          <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            {activity.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </Box>
              ))}
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
                <ListItemButton component="a" href="/admin/volunteers/applications">
                  <ListItemText primary="Volunteer Applications" secondary="Review and process volunteer applications" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/volunteers/manage">
                  <ListItemText primary="Volunteer Management" secondary="Manage active volunteers and their status" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/volunteers/analytics">
                  <ListItemText primary="Volunteer Analytics" secondary="View volunteer program statistics and reports" />
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
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/notifications">
                  <ListItemText primary="Notifications Management" secondary="Manage email and SMS notifications" />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/config">
                  <ListItemText primary="System Configuration" secondary="Manage system-wide configuration settings" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Volunteer Management */}
        <Grid item xs={12} md={6} sx={{ mt: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VolunteerActivismIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Volunteer Program
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                      Review
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Process volunteer applications
                    </Typography>
                    <ListItemButton
                      component="a"
                      href="/admin/volunteers/applications"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.main' },
                        borderRadius: 1
                      }}
                    >
                      <ListItemText primary="Review Applications" />
                    </ListItemButton>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                      Manage
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Oversee volunteer team
                    </Typography>
                    <ListItemButton
                      component="a"
                      href="/admin/volunteers/manage"
                      sx={{
                        bgcolor: 'secondary.light',
                        color: 'secondary.contrastText',
                        '&:hover': { bgcolor: 'secondary.main' },
                        borderRadius: 1
                      }}
                    >
                      <ListItemText primary="Manage Volunteers" />
                    </ListItemButton>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <ListItemButton
              component="a"
              href="/admin/volunteers/analytics"
              sx={{
                bgcolor: 'info.light',
                color: 'info.contrastText',
                '&:hover': { bgcolor: 'info.main' },
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <BarChartIcon sx={{ mr: 1 }} />
              <ListItemText primary="View Volunteer Analytics" />
            </ListItemButton>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Stat Card Component
function StatCard({ title, value, icon }) {
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
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}