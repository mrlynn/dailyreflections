'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Box, CircularProgress, Typography } from '@mui/material';
import OnboardingWizard from '@/components/Onboarding/OnboardingWizard';

/**
 * Dedicated onboarding page shown after registration
 * This ensures the onboarding flow is properly triggered for new users
 */
export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Wait for authentication to complete
    if (status === 'loading') return;

    if (session?.user) {
      fetchUserData();
    }
  }, [session, status, router]);

  // Fetch user data including onboarding status
  const fetchUserData = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Fetch timeout - request took too long');
      }, 5000);

      console.log('Fetching onboarding data...');

      const response = await fetch('/api/user/onboarding', {
        signal: controller.signal,
        // Include credentials to ensure cookies are sent
        credentials: 'include',
        // Force fetch to avoid caching issues
        cache: 'no-cache',
        // Add headers to help identify the request
        headers: {
          'X-Request-Source': 'onboarding-page'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`HTTP error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format');
      }

      console.log('Received onboarding data:', data);

      if (data.success) {
        setUserData(data);

        // If user has already completed onboarding, redirect to home
        if (data.onboarding?.setupComplete) {
          console.log('Onboarding already complete, redirecting to home');
          router.push('/');
        } else {
          // Show onboarding wizard
          console.log('Showing onboarding wizard');
          setShowOnboarding(true);
        }
      } else {
        console.error('API reported failure:', data.error || 'Unknown error', data.code || 'No error code');
        // If we can't fetch user data, still show onboarding with default values
        setUserData({
          onboarding: { setupComplete: false },
          sobriety: null,
          preferences: null,
          error: data.error,
          errorCode: data.code
        });
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message);

      // Handle abort errors differently
      if (error.name === 'AbortError') {
        console.warn('Request was aborted (timeout)');
      }

      // If we can't fetch user data, still show onboarding with default values
      setUserData({
        onboarding: { setupComplete: false },
        sobriety: null,
        preferences: null,
        error: error.message,
        errorType: error.name
      });
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (formData) => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Onboarding completion request timeout - took too long');
      }, 8000);

      console.log('Submitting onboarding data...');

      // Send onboarding data to API
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'onboarding-page-submit'
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`HTTP error during onboarding completion: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response during onboarding completion:', parseError);
        throw new Error('Invalid response format');
      }

      console.log('Onboarding submission response:', data);

      if (data.success) {
        console.log('Onboarding completed successfully, redirecting to home');
        // Redirect to home page after successful onboarding
        router.push('/');
        router.refresh();
      } else {
        console.error('Failed to save onboarding data:', data.error || 'Unknown error', data.code || 'No error code');

        // Provide more specific error message based on error code
        if (data.code === 'AUTH_NO_SESSION' || data.code === 'AUTH_INVALID_SESSION') {
          alert('Your session has expired. Please log in again and try once more.');
        } else if (data.code === 'DB_OPERATION_FAILED') {
          alert('There was an issue saving your preferences. Please try again in a few moments.');
        } else {
          alert('There was an issue saving your preferences. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error.message, error.name);

      // Provide more specific error messages for different error types
      if (error.name === 'AbortError') {
        console.warn('Onboarding submission request was aborted (timeout)');
        alert('The request took too long to complete. Please check your internet connection and try again.');
      } else {
        alert('There was an error completing the onboarding process. Please try again.');
      }
    }
  };

  // Handle skip onboarding
  const handleSkipOnboarding = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Skip onboarding request timeout - took too long');
      }, 8000);

      console.log('Skipping onboarding process...');

      // Mark onboarding as complete with minimal data
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'onboarding-page-skip'
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
        console.error(`HTTP error during skip onboarding: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response during skip onboarding:', parseError);
        throw new Error('Invalid response format');
      }

      console.log('Skip onboarding response:', data);

      if (data.success) {
        console.log('Onboarding skipped successfully, redirecting to home');
        router.push('/');
        router.refresh();
      } else {
        console.error('Failed to skip onboarding:', data.error || 'Unknown error', data.code || 'No error code');

        // Log specific error information
        if (data.code) {
          console.error(`Error code: ${data.code}`);
        }

        // Even if there was an error, try to navigate away
        console.log('Attempting to navigate away despite error');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error.message, error.name);

      if (error.name === 'AbortError') {
        console.warn('Skip onboarding request was aborted (timeout)');
      }

      // Even if there was an error, try to navigate away
      console.log('Attempting to navigate away despite error');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Setting up your account...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <OnboardingWizard
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
        initialData={userData}
      />
    </Box>
  );
}