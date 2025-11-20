'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageIcon from '@mui/icons-material/Message';
import AvailabilityToggle from '../../components/Volunteer/AvailabilityToggle';
import { FeedbackAnalytics } from '../../components/Volunteer/Dashboard';

export default function VolunteerDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    avgSessionDuration: 0,
    positiveRating: 0
  });
  const [waitingChats, setWaitingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // Separate function to fetch only chat data (for polling)
  // Using useCallback to ensure stable reference
  const fetchChatData = useCallback(async () => {
    try {
      // Fetch waiting chats
      const waitingResponse = await fetch('/api/volunteers/chat/sessions?type=waiting');
      if (!waitingResponse.ok) {
        throw new Error('Failed to fetch waiting chats');
      }
      const waitingData = await waitingResponse.json();
      setWaitingChats(waitingData.sessions || []);

      // Fetch active chats
      const activeResponse = await fetch('/api/volunteers/chat/sessions?type=active');
      if (!activeResponse.ok) {
        throw new Error('Failed to fetch active chats');
      }
      const activeData = await activeResponse.json();
      setActiveChats(activeData.sessions || []);
    } catch (err) {
      console.error('Error fetching chat data:', err);
      // Don't set error state during polling to avoid disrupting the UI
    }
  }, []);

  // Fetch initial volunteer data (stats and status) - only once on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch volunteer status
        const statusResponse = await fetch('/api/volunteers/status');
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch volunteer status');
        }
        const statusData = await statusResponse.json();
        setIsActive(statusData.isActive);

        // Fetch volunteer stats
        const statsResponse = await fetch('/api/volunteers/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch volunteer stats');
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch initial chat data if volunteer is active
        if (statusData.isActive) {
          await fetchChatData();
        }
      } catch (err) {
        console.error('Error fetching volunteer data:', err);
        setError(err.message || 'Failed to fetch volunteer data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchChatData]); // Include fetchChatData in dependencies

  // Set up polling interval for chat data when volunteer is active
  useEffect(() => {
    if (!isActive) {
      // Clear chats when going offline
      setWaitingChats([]);
      setActiveChats([]);
      return;
    }

    // Fetch chat data immediately when becoming active
    fetchChatData();

    // Set up polling interval - only updates chat data, not stats
    const interval = setInterval(() => {
      fetchChatData();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isActive, fetchChatData]); // Re-run when isActive changes

  // Handle availability toggle
  const handleAvailabilityToggle = (newStatus) => {
    setIsActive(newStatus);
  };

  // Handle picking up a chat
  const handlePickChat = async (sessionId) => {
    try {
      const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to pick up chat session');
      }

      // Redirect to chat session
      router.push(`/volunteer/chat/${sessionId}`);
    } catch (err) {
      console.error('Error picking up chat session:', err);
      // Could show an error message here
    }
  };

  // Handle continuing active chat
  const handleContinueChat = (sessionId) => {
    router.push(`/volunteer/chat/${sessionId}`);
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Page title and availability toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Volunteer Dashboard</Typography>
        <AvailabilityToggle isActive={isActive} onChange={handleAvailabilityToggle} />
      </Box>

      {/* Welcome message */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Welcome, {session?.user?.name || 'Volunteer'}!
        </Typography>
        <Typography variant="body1">
          Thank you for volunteering your time to help others in recovery. Your service makes a difference.
        </Typography>
      </Paper>

      {/* Stats cards */}
      <Typography variant="h6" gutterBottom>Your Impact</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Sessions */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">{stats.totalSessions}</Typography>
            <Typography variant="body2" color="text.secondary">Total Sessions</Typography>
          </Paper>
        </Grid>

        {/* Total Messages */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <MessageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">{stats.totalMessages}</Typography>
            <Typography variant="body2" color="text.secondary">Messages Exchanged</Typography>
          </Paper>
        </Grid>

        {/* Average Session Duration */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <AccessTimeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">{stats.avgSessionDuration} min</Typography>
            <Typography variant="body2" color="text.secondary">Avg Session Time</Typography>
          </Paper>
        </Grid>

        {/* Positive Rating */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <CircularProgress
                variant="determinate"
                value={stats.positiveRating}
                size={48}
                thickness={4}
                sx={{ color: 'success.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(stats.positiveRating)}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="h5">{stats.positiveRating}%</Typography>
            <Typography variant="body2" color="text.secondary">Positive Feedback</Typography>
            <Button
              size="small"
              onClick={() => router.push('/volunteer/feedback')}
              sx={{ mt: 1 }}
            >
              View All Feedback
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Feedback Analytics */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Feedback Analytics</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <FeedbackAnalytics />
        </Grid>
      </Grid>

      {/* Conditional section based on availability */}
      {isActive ? (
        <Grid container spacing={3}>
          {/* Waiting chats */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Badge badgeContent={waitingChats.length} color="error" sx={{ mr: 1 }}>
                    <span>Waiting For Help</span>
                  </Badge>
                </Typography>

                {waitingChats.length === 0 ? (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No users waiting for help at the moment
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {waitingChats.map((chat) => (
                      <ListItem key={chat._id} divider>
                        <ListItemText
                          primary={`User has been waiting for ${getWaitingTime(chat.start_time)}`}
                          secondary={`Request ID: ${chat._id.substring(0, 8)}`}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handlePickChat(chat._id)}
                        >
                          Pick Up
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              {waitingChats.length > 0 && (
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button size="small" onClick={() => router.push('/volunteer/chat')}>
                    View All Waiting Chats
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>

          {/* Active chats */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Badge badgeContent={activeChats.length} color="primary" sx={{ mr: 1 }}>
                    <span>Your Active Sessions</span>
                  </Badge>
                </Typography>

                {activeChats.length === 0 ? (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      You don't have any active chat sessions
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {activeChats.map((chat) => (
                      <ListItem key={chat._id} divider>
                        <ListItemText
                          primary={`Session started ${getSessionTime(chat.start_time)}`}
                          secondary={`Messages: ${chat.messages_count || 0}`}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleContinueChat(chat._id)}
                        >
                          Continue
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              {activeChats.length > 0 && (
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button size="small" onClick={() => router.push('/volunteer/chat')}>
                    Manage All Chats
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            You're currently offline
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toggle your availability to "Online" to start helping people in recovery.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleAvailabilityToggle(true)}
          >
            Go Online Now
          </Button>
        </Paper>
      )}
    </Box>
  );
}

// Helper function to format waiting time
function getWaitingTime(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diffMinutes = Math.floor((now - start) / (1000 * 60));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes === 1) {
    return '1 minute';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  }
}

// Helper function to format session start time
function getSessionTime(startTime) {
  const start = new Date(startTime);
  return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}