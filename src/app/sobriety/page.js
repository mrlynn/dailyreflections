'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  AppBar,
  Toolbar,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HomeIcon from '@mui/icons-material/Home';
import UserMenu from '@/components/UserMenu';
import PageHeader from '@/components/PageHeader';
import SobrietyDatePicker from '@/components/Sobriety/SobrietyDatePicker';
import SobrietyDisplay from '@/components/Sobriety/SobrietyDisplay';
import { calculateDaysSober, formatSobrietyDate } from '@/utils/sobrietyUtils';

export default function SobrietyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [sobrietyDate, setSobrietyDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sobrietyDateObj = sobrietyDate ? new Date(sobrietyDate) : null;
  const isSobrietyDateValid = sobrietyDateObj && !Number.isNaN(sobrietyDateObj.getTime());
  const daysSober = isSobrietyDateValid ? calculateDaysSober(sobrietyDate) : null;

  const sobrietyMilestones = [
    { label: '30 Days', days: 30 },
    { label: '60 Days', days: 60 },
    { label: '90 Days', days: 90 },
    { label: '6 Months', days: 182 },
    { label: '9 Months', days: 273 },
    { label: '1 Year', days: 365 },
  ];

  const nextMilestone = isSobrietyDateValid
    ? sobrietyMilestones.find(milestone => daysSober < milestone.days)
    : null;

  const milestoneProgress = nextMilestone && daysSober
    ? Math.min(100, Math.round((daysSober / nextMilestone.days) * 100))
    : null;

  // Load sobriety date when authenticated
  useEffect(() => {
    const fetchSobrietyDate = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          const response = await fetch('/api/user/sobriety');

          if (!response.ok) {
            throw new Error('Failed to load sobriety information');
          }

          const data = await response.json();
          setSobrietyDate(data.sobrietyDate);
        } catch (err) {
          console.error('Error loading sobriety date:', err);
          setError('Failed to load sobriety information. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSobrietyDate();
  }, [status]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/sobriety');
    }
  }, [status, router]);

  // Handle sobriety date update
  const handleSaveSobrietyDate = async (newDate) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/sobriety', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sobrietyDate: newDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update sobriety date');
      }

      setSobrietyDate(newDate);
      setSuccess('Sobriety date updated successfully!');

      // Clear success message after a few seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to update sobriety date');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing sobriety date
  const handleRemoveSobrietyDate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/sobriety', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove sobriety date');
      }

      setSobrietyDate(null);
      setSuccess('Sobriety date removed successfully');

      // Clear success message after a few seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to remove sobriety date');
    } finally {
      setLoading(false);
    }
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
        title="Sobriety Tracker"
        icon={<CelebrationIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Track your sobriety journey and celebrate your milestones"
        backgroundImage="/images/tracker.png"
        backgroundImageStyles={{
          backgroundPosition: '50% 25%',
          backgroundSize: 'cover',
          opacity: 0.95
        }}
        backgroundOverlay="linear-gradient(135deg, rgba(228,185,91,0.75) 0%, rgba(93,166,167,0.8) 100%)"
        invertText={true}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Success & Error alerts */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={handleCloseSuccess}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={handleCloseError}>
            {error}
          </Alert>
        )}

        {loading && !sobrietyDate ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} lg={8}>
              {sobrietyDate ? (
                <SobrietyDisplay sobrietyDate={sobrietyDate} />
              ) : (
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <EmojiEventsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" gutterBottom>
                      Track Your Sobriety Journey
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4 }}>
                      Set your sobriety date to start tracking your progress and milestones.
                    </Typography>
                    <SobrietyDatePicker
                      sobrietyDate={sobrietyDate}
                      onSave={handleSaveSobrietyDate}
                      onRemove={handleRemoveSobrietyDate}
                    />
                  </CardContent>
                </Card>
              )}
            </Grid>

            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Manage Your Sobriety Date
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {sobrietyDate ? (
                    <>
                      <Typography variant="body1" paragraph>
                        Your sobriety date is set to <strong>{formatSobrietyDate(sobrietyDate)}</strong>.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        You&apos;ve been sober for <strong>{calculateDaysSober(sobrietyDate)} days</strong>.
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1" paragraph>
                      You haven&apos;t set a sobriety date yet. Set your date to start tracking your progress.
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <SobrietyDatePicker
                      sobrietyDate={sobrietyDate}
                      onSave={handleSaveSobrietyDate}
                      onRemove={handleRemoveSobrietyDate}
                    />
                  </Box>
                </Paper>

                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Milestone Tracker
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {isSobrietyDateValid && daysSober !== null ? (
                    <>
                      <Typography variant="body2" gutterBottom>
                        {nextMilestone
                          ? `Next milestone: ${nextMilestone.label} in ${nextMilestone.days - daysSober} days`
                          : 'You have surpassed the standard milestones—keep shining!'}
                      </Typography>
                      {milestoneProgress !== null && nextMilestone && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress toward {nextMilestone.label}
                          </Typography>
                          <Box
                            sx={{
                              position: 'relative',
                              height: 12,
                              borderRadius: 999,
                              backgroundColor: 'action.hover',
                              mt: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${milestoneProgress}%`,
                                background: 'linear-gradient(90deg, #5DA6A7, #4A8F90)'
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                            {milestoneProgress}% of {nextMilestone.label}
                          </Typography>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2">
                      Set your sobriety date to unlock milestone tracking and celebrate every win along the way.
                    </Typography>
                  )}
                </Paper>

                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    About Sobriety Tracking
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" paragraph>
                    Tracking your sobriety is a powerful tool in your recovery journey. It helps you:
                  </Typography>
                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    <li>
                      <Typography variant="body2">
                        Celebrate your achievements and milestones
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Stay motivated by seeing your progress
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Remember how far you&apos;ve come in your journey
                      </Typography>
                    </li>
                  </ul>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Set your sobriety date to the last day you had a drink or used substances.
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}