'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  useTheme
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import InsightsIcon from '@mui/icons-material/Insights';
import PageHeader from '@/components/PageHeader';
import MeetingEntryForm from '@/components/Meetings/MeetingEntryForm';
import MeetingHistoryList from '@/components/Meetings/MeetingHistoryList';
import NinetyInNinetyIntro from '@/components/Meetings/NinetyInNinetyIntro';
import EnhancedCalendarView from '@/components/Meetings/EnhancedCalendarView';
import AchievementBadges from '@/components/Meetings/AchievementBadges';
import MotivationalInsights from '@/components/Meetings/MotivationalInsights';

export default function MeetingTrackerPage() {
  const { status } = useSession();
  const router = useRouter();
  // Theme used for styling components
  const theme = useTheme();

  const [stats, setStats] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load stats and meetings when authenticated
  useEffect(() => {
    const fetchData = async () => {
      if (status === 'authenticated') {
        setLoading(true);
        try {
          // Fetch stats
          const statsResponse = await fetch('/api/user/meetings/stats');
          if (!statsResponse.ok) {
            throw new Error('Failed to load meeting statistics');
          }
          const statsData = await statsResponse.json();

          // Fetch meetings
          const meetingsResponse = await fetch('/api/user/meetings?limit=10');
          if (!meetingsResponse.ok) {
            throw new Error('Failed to load meetings');
          }
          const meetingsData = await meetingsResponse.json();

          setStats(statsData.stats);
          setMeetings(meetingsData.meetings || []);
        } catch (err) {
          console.error('Error loading meeting data:', err);
          setError('Failed to load meeting information. Please try again.');
          // Initialize with empty data if fetch fails
          setStats({
            ninetyInNinety: { active: false },
            streaks: { current: 0, longest: 0 },
            totalMeetings: 0,
            meetingsThisMonth: 0
          });
          setMeetings([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [status, refreshKey]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/meetings/tracker');
    }
  }, [status, router]);

  // Start 90 in 90 challenge
  const handleStartChallenge = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/meetings/start90in90', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start 90 in 90 challenge');
      }

      setSuccess('Successfully started your 90 in 90 challenge!');
      setRefreshKey(prev => prev + 1); // Refresh data

      // Open the meeting form to log first meeting
      setFormOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to start 90 in 90 challenge');
    } finally {
      setLoading(false);
    }
  };

  // Reset 90 in 90 challenge
  const handleResetChallenge = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/meetings/start90in90', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reset: true })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset 90 in 90 challenge');
      }

      setSuccess('Successfully reset your 90 in 90 challenge!');
      setRefreshKey(prev => prev + 1); // Refresh data
    } catch (err) {
      setError(err.message || 'Failed to reset 90 in 90 challenge');
    } finally {
      setLoading(false);
    }
  };

  // Log new meeting
  const handleLogMeeting = async (meetingData) => {
    try {
      setLoading(true);
      setError(null);

      // If editing an existing meeting
      if (editMeeting?._id) {
        const response = await fetch(`/api/user/meetings/${editMeeting._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(meetingData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update meeting');
        }

        setSuccess('Meeting updated successfully!');
        setEditMeeting(null);
      } else {
        // Creating a new meeting
        const response = await fetch('/api/user/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(meetingData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to log meeting');
        }

        setSuccess('Meeting logged successfully!');
      }

      setFormOpen(false);
      setRefreshKey(prev => prev + 1); // Refresh data

      // Clear success message after a few seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to log meeting');
    } finally {
      setLoading(false);
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete meeting');
      }

      setSuccess('Meeting deleted successfully!');
      setRefreshKey(prev => prev + 1); // Refresh data

      // Clear success message after a few seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to delete meeting');
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a meeting
  const handleEditMeeting = (meeting) => {
    setEditMeeting(meeting);
    setFormOpen(true);
  };

  // Close error alert
  const handleCloseError = () => {
    setError(null);
  };

  // Close success alert
  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  // Show loading state if session is loading
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="90 in 90 Meeting Tracker"
        icon={<AssignmentTurnedInIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Track your progress toward attending 90 meetings in 90 days"
        backgroundImage="/images/90in90.png"
        backgroundOverlay="linear-gradient(135deg, rgba(253, 242, 233, 0.78) 0%, rgba(216, 229, 245, 0.62) 50%, rgba(26, 43, 52, 0.58) 100%)"
        backgroundImageStyles={{ filter: 'brightness(1.05)', transform: 'scale(1.035)' }}
        backgroundOverlayStyles={{ mixBlendMode: 'multiply' }}
        invertText={true}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Success & Error alerts */}
        <Box sx={{ position: 'fixed', top: 80, right: 20, zIndex: 1000, maxWidth: '400px' }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2, boxShadow: 4 }} onClose={handleCloseSuccess}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, boxShadow: 4 }} onClose={handleCloseError}>
              {error}
            </Alert>
          )}
        </Box>

        {loading && !stats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            {!stats?.ninetyInNinety?.active ? (
              <NinetyInNinetyIntro onStart={handleStartChallenge} />
            ) : (
              <>
                {/* Top action bar - full width and sticky */}
                <Paper
                  elevation={3}
                  sx={{
                    py: 2,
                    px: 3,
                    mb: 3,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: () => theme.palette.mode === 'dark'
                      ? 'rgba(30,30,30,0.95)'
                      : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                    90 in 90 Challenge
                  </Typography>
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setEditMeeting(null);
                        setFormOpen(true);
                      }}
                      startIcon={<AssignmentTurnedInIcon />}
                      sx={{ mr: 2 }}
                    >
                      Log a Meeting
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleResetChallenge}
                    >
                      Reset Challenge
                    </Button>
                  </Box>
                </Paper>

                {/* Main content layout */}
                <Grid container spacing={3}>
                  {/* First row - Progress Summary - Full width */}
                  <Grid item xs={12}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        background: theme => theme.palette.mode === 'dark'
                          ? 'linear-gradient(145deg, #27313d 0%, #1e2429 100%)'
                          : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                        mb: 3
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ mb: { xs: 3, md: 0 }, width: { xs: '100%', md: '30%' }, textAlign: 'center' }}>
                          <Typography variant="h6" gutterBottom>Your Progress</Typography>
                          <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold' }}>
                            {stats?.ninetyInNinety?.progress || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            of 90 days completed
                          </Typography>

                          <Box sx={{ width: '100%', mt: 2 }}>
                            <Box sx={{ position: 'relative', height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  height: '100%',
                                  width: `${(stats?.ninetyInNinety?.progress / 90 * 100) || 0}%`,
                                  background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
                                  borderRadius: 4,
                                  transition: 'width 1s ease-in-out'
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />

                        <Grid container spacing={2} sx={{ width: { xs: '100%', md: '65%' } }}>
                          <Grid item xs={4}>
                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                              <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                                {stats?.streaks?.current || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Current Streak
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={4}>
                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                              <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                                {stats?.totalMeetings || 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total Meetings
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={4}>
                            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                              <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                                {90 - (stats?.ninetyInNinety?.progress || 0)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Days Remaining
                              </Typography>
                            </Paper>
                          </Grid>

                          <Grid item xs={12}>
                            <Box
                              sx={{
                                p: 2,
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <TipsAndUpdatesIcon sx={{ mr: 1 }} />
                              <Typography variant="body3" sx={{ color: 'white' }}>
                                {stats?.ninetyInNinety?.progress === 0
                                  ? "Ready to begin your 90 in 90 journey? Log your first meeting!"
                                  : stats?.ninetyInNinety?.progress >= 90
                                    ? "Congratulations! You've completed your 90 in 90 challenge!"
                                    : `Keep going! You're ${stats?.ninetyInNinety?.progress}/90 of the way through your challenge.`}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Calendar - Full width */}
                  <Grid item xs={12}>
                    <EnhancedCalendarView stats={stats} />
                  </Grid>

                  {/* Achievement Badges - Full width */}
                  <Grid item xs={12}>
                    <AchievementBadges stats={stats} />
                  </Grid>

                  {/* Recovery Insights & Recent Meetings - Split on larger screens, stack on mobile */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        background: theme => theme.palette.mode === 'dark'
                          ? 'linear-gradient(145deg, #27313d 0%, #1e2429 100%)'
                          : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                        height: '100%'
                      }}
                    >
                      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <InsightsIcon sx={{ mr: 1 }} />
                        Recovery Insights
                      </Typography>
                      <MotivationalInsights stats={stats} />
                    </Paper>
                  </Grid>

                  {/* Recent meetings section */}
                  <Grid item xs={12} md={6}>
                    {meetings.length > 0 ? (
                      <Paper
                        elevation={2}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          background: theme => theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, #27313d 0%, #1e2429 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                          height: '100%'
                        }}
                      >
                        <Typography variant="h5" gutterBottom>
                          Recent Meetings
                        </Typography>
                        <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <MeetingHistoryList
                            meetings={meetings}
                            onDelete={handleDeleteMeeting}
                            onEdit={handleEditMeeting}
                          />
                        </Box>
                      </Paper>
                    ) : (
                      <Paper
                        elevation={2}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          background: theme => theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, #27313d 0%, #1e2429 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="h6" gutterBottom>
                            No Meetings Logged Yet
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Click "Log a Meeting" to start tracking your 90 in 90 progress
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </>
            )}

            {/* Meeting entry form dialog */}
            <MeetingEntryForm
              open={formOpen}
              onClose={() => {
                setFormOpen(false);
                setEditMeeting(null);
              }}
              onSubmit={handleLogMeeting}
              initialData={editMeeting}
            />
          </Box>
        )}
      </Container>
    </>
  );
}