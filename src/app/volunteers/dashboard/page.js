'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { hasRole } from '@/lib/roleCheck';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Alert,
  Button,
  Skeleton,
  Stack
} from '@mui/material';
import Link from 'next/link';
import VolunteerApplicationStatus from '@/components/Volunteer/Dashboard/ApplicationStatus';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/**
 * Volunteer Dashboard Page
 *
 * Main page for volunteers to view their status, upcoming chats, and other information
 */
export default function VolunteerDashboardPage() {
  const { data: session, status } = useSession();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is a volunteer
  const isVolunteer = session?.user && hasRole(session, 'volunteer_listener');

  // Fetch application data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplicationData();
    }
  }, [status]);

  // Fetch volunteer application data
  const fetchApplicationData = async () => {
    try {
      const response = await fetch('/api/volunteers/applications');

      if (!response.ok) {
        throw new Error('Failed to fetch application data');
      }

      const data = await response.json();
      setApplicationData(data.application);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching application data:', err);
      setError(err.message || 'Failed to load application data');
      setLoading(false);
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={500} height={24} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" width="100%" height={300} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" width="100%" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          Please sign in to access the volunteer dashboard.
        </Alert>
        <Button component={Link} href="/api/auth/signin" variant="contained" color="primary">
          Sign In
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Volunteer Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isVolunteer
            ? "Welcome back! Here's an overview of your volunteer activity."
            : "Track your application status and learn more about volunteering."}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
            <VolunteerApplicationStatus
              applicationData={applicationData}
              isVolunteer={isVolunteer}
            />
          </Paper>

          {/* Show upcoming shifts or application tips based on status */}
          {isVolunteer ? (
            <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Your Upcoming Availability
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <AccessTimeIcon sx={{ fontSize: 60, color: '#5DA6A7', mb: 2 }} />
                <Typography variant="body1">
                  You don't have any upcoming volunteer shifts scheduled.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    mt: 2,
                    bgcolor: '#5DA6A7',
                    '&:hover': {
                      bgcolor: '#4A8F90',
                    }
                  }}
                  disabled
                >
                  Schedule Availability
                </Button>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  Coming soon! Scheduling will be available after training.
                </Typography>
              </Box>
            </Paper>
          ) : applicationData?.status === 'pending' ? (
            <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                While You Wait
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" paragraph>
                  Thank you for applying to be a volunteer listener. While your application is being reviewed, here are some resources to explore:
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    component={Link}
                    href="/volunteers/code-of-conduct"
                    target="_blank"
                  >
                    Review our Code of Conduct
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    component={Link}
                    href="https://www.aa.org/the-big-book"
                    target="_blank"
                  >
                    Explore AA Literature
                  </Button>
                </Stack>
              </Box>
            </Paper>
          ) : null}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Account Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Volunteer Role:
              </Typography>
              <Chip
                label={isVolunteer ? "Volunteer Listener" : "Regular User"}
                color={isVolunteer ? "success" : "default"}
                sx={{ mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Code of Conduct:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {applicationData?.code_of_conduct_accepted ? (
                  <>
                    <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Agreed on {new Date(applicationData.code_of_conduct_accepted_at).toLocaleDateString()}
                    </Typography>
                  </>
                ) : (
                  <>
                    <ErrorOutlineIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Not agreed yet
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                component={Link}
                href="/volunteers/code-of-conduct"
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              >
                View Code of Conduct
              </Button>

              <Button
                component={Link}
                href="/"
                startIcon={<ArrowBackIcon />}
                sx={{ display: 'block', mt: 2 }}
                size="small"
              >
                Back to Home
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}