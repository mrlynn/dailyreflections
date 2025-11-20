'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Box, Paper, Typography, Button, Alert, CircularProgress, Divider } from '@mui/material';

/**
 * Test page for debugging the onboarding flow
 * This is only for development and testing purposes
 */
export default function OnboardingTestPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionResult, setActionResult] = useState(null);

  // Fetch user data including onboarding status
  useEffect(() => {
    const fetchInitialData = async () => {
      if (status === 'loading') return;

      if (!session?.user) {
        setLoading(false);
        return;
      }

      await refreshUserData();
      setLoading(false);
    };

    fetchInitialData();
  }, [session, status]);

  // Reset onboarding status to force the wizard to show
  const handleResetOnboarding = async () => {
    setActionResult(null);

    try {
      console.log('Test page: Resetting onboarding status...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'onboarding-test-page-reset'
        },
        body: JSON.stringify({
          onboarding: {
            setupComplete: false,
            lastStep: 0
          }
        }),
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`HTTP error in test page reset: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Test page: Reset response:', data);

      setActionResult({
        success: data.success,
        message: data.success ? 'Onboarding status reset successfully' : 'Failed to reset onboarding status',
        error: data.error,
        code: data.code,
        details: data.details,
        timestamp: data.timestamp
      });

      // Refresh user data
      await refreshUserData();

    } catch (error) {
      console.error('Error in test page reset:', error);
      setActionResult({
        success: false,
        message: 'Error resetting onboarding status',
        error: error.message,
        errorType: error.name
      });
    }
  };

  // Mark onboarding as complete
  const handleCompleteOnboarding = async () => {
    setActionResult(null);

    try {
      console.log('Test page: Marking onboarding as complete...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'onboarding-test-page'
        },
        body: JSON.stringify({
          setupComplete: true
        }),
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`HTTP error in test page: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Test page: Got response:', data);

      setActionResult({
        success: data.success,
        message: data.success ? 'Onboarding marked as complete' : 'Failed to update onboarding status',
        error: data.error,
        code: data.code,
        details: data.details,
        timestamp: data.timestamp
      });

      // Refresh user data
      await refreshUserData();

    } catch (error) {
      console.error('Error in test page:', error);
      setActionResult({
        success: false,
        message: 'Error updating onboarding status',
        error: error.message,
        errorType: error.name
      });
    }
  };

  // Utility function to refresh user data
  const refreshUserData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      console.log('Test page: Refreshing user data...');

      const userResponse = await fetch('/api/user/onboarding', {
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'X-Request-Source': 'onboarding-test-page-refresh'
        }
      });

      clearTimeout(timeoutId);

      if (!userResponse.ok) {
        throw new Error(`HTTP error: ${userResponse.status} ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      console.log('Test page: Refreshed user data:', userData);
      setUserData(userData);
      return userData;
    } catch (error) {
      console.error('Error refreshing user data in test page:', error);
      return null;
    }
  };

  // Go to onboarding page
  const handleGoToOnboarding = () => {
    window.location.href = '/onboarding';
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!session?.user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          You must be signed in to use this test page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Onboarding Flow Test Page
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          This page is for testing and debugging the onboarding flow
        </Typography>

        {actionResult && (
          <Box sx={{ mb: 3 }}>
            <Alert
              severity={actionResult.success ? 'success' : 'error'}
              sx={{ mb: 1 }}
              onClose={() => setActionResult(null)}
            >
              {actionResult.message}
            </Alert>

            <Paper elevation={1} sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Response Details:</Typography>
              <Box component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '150px' }}>
                {JSON.stringify({
                  success: actionResult.success,
                  error: actionResult.error,
                  code: actionResult.code,
                  details: actionResult.details,
                  timestamp: actionResult.timestamp,
                  errorType: actionResult.errorType
                }, null, 2)}
              </Box>
            </Paper>
          </Box>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>

          {userData ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>User ID:</strong> {session.user.id}
                </Typography>
                <Typography variant="body1">
                  <strong>Name:</strong> {session.user.name || 'Not set'}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {session.user.email || 'Not set'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Onboarding Status:</Typography>
                <Typography variant="body1">
                  <strong>Complete:</strong> {userData.onboarding?.setupComplete ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body1">
                  <strong>Current Step:</strong> {userData.onboarding?.lastStep || 0}
                </Typography>
                <Typography variant="body1">
                  <strong>Completed At:</strong> {userData.onboarding?.completedAt
                    ? new Date(userData.onboarding.completedAt).toLocaleString()
                    : 'Not completed'}
                </Typography>
              </Box>

              {userData.sobriety && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Sobriety Information:</Typography>
                  <Typography variant="body1">
                    <strong>Sobriety Date:</strong> {userData.sobriety.date
                      ? new Date(userData.sobriety.date).toLocaleDateString()
                      : 'Not set'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Timezone:</strong> {userData.sobriety.timezone || 'Not set'}
                  </Typography>
                </Box>
              )}

              {userData.preferences?.notifications && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Notification Preferences:</Typography>
                  <Typography variant="body1">
                    <strong>Enabled:</strong> {userData.preferences.notifications.enabled ? 'Yes' : 'No'}
                  </Typography>
                  {userData.preferences.notifications.morning && (
                    <Typography variant="body1">
                      <strong>Morning:</strong> {userData.preferences.notifications.morning.enabled ? 'Yes' : 'No'}
                      {userData.preferences.notifications.morning.time ? ` (${userData.preferences.notifications.morning.time})` : ''}
                    </Typography>
                  )}
                  {userData.preferences.notifications.evening && (
                    <Typography variant="body1">
                      <strong>Evening:</strong> {userData.preferences.notifications.evening.enabled ? 'Yes' : 'No'}
                      {userData.preferences.notifications.evening.time ? ` (${userData.preferences.notifications.evening.time})` : ''}
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="text"
                  size="small"
                  color="primary"
                  onClick={() => console.log('Full user data:', userData)}
                >
                  Log Full Data to Console
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body1">No user data found</Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Onboarding Actions
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGoToOnboarding}
            >
              Go to Onboarding Page
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={handleResetOnboarding}
            >
              Reset Onboarding Status
            </Button>

            <Button
              variant="outlined"
              onClick={handleCompleteOnboarding}
            >
              Mark Onboarding as Complete
            </Button>

            <Button
              variant="outlined"
              color="info"
              onClick={refreshUserData}
            >
              Refresh User Data
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}