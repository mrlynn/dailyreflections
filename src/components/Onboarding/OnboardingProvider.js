'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { useSession } from 'next-auth/react';
import OnboardingWizard from './OnboardingWizard';

// Create context for onboarding
export const OnboardingContext = createContext();

/**
 * Onboarding Provider Component
 * Manages onboarding state and displays the onboarding wizard when needed
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function OnboardingProvider({ children }) {
  const { data: session, status } = useSession();
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if the user has completed onboarding
  useEffect(() => {
    // Create controller outside of async function so we can clean it up properly
    const controller = new AbortController();
    let timeoutId = null;

    const checkOnboardingStatus = async () => {
      if (status === 'loading') return;

      // If user is not authenticated, no onboarding needed
      if (!session?.user) {
        setOnboardingNeeded(false);
        setLoading(false);
        return;
      }

      try {
        // Add timeout to prevent hanging requests
        timeoutId = setTimeout(() => {
          // Only abort if the controller hasn't been aborted already
          if (!controller.signal.aborted) {
            controller.abort();
            console.warn('Fetch timeout in OnboardingProvider - request took too long');
          }
        }, 5000);

        console.log('OnboardingProvider: Checking onboarding status...');

        // Check if the component was unmounted before we made the request
        if (controller.signal.aborted) {
          console.log('OnboardingProvider: Skipping fetch as component was unmounted');
          return;
        }

        // Fetch onboarding status from API
        const response = await fetch('/api/user/onboarding', {
          signal: controller.signal,
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'X-Request-Source': 'onboarding-provider'
          }
        });

        // Clear timeout if the request completed successfully
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error(`HTTP error in OnboardingProvider: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse JSON response in OnboardingProvider:', parseError);
          throw new Error('Invalid response format');
        }

        console.log('OnboardingProvider: Received onboarding status:', data);

        if (data.success) {
          // If this is a new user without completed onboarding, redirect to dedicated onboarding page
          if (!data.onboarding?.setupComplete && window.location.pathname !== '/onboarding') {
            console.log('OnboardingProvider: Redirecting new user to onboarding page');
            window.location.href = '/onboarding';
            return;
          }

          // Don't show onboarding wizard on normal pages - only on /onboarding route
          const showWizard = !data.onboarding?.setupComplete && window.location.pathname === '/onboarding';
          setOnboardingNeeded(showWizard);

          setOnboardingData({
            sobrietyDate: data.sobriety?.date,
            timezone: data.sobriety?.timezone,
            notifications: data.preferences?.notifications,
            accountability: data.preferences?.accountability
          });
        } else {
          console.error('API reported failure in OnboardingProvider:', data.error || 'Unknown error', data.code || 'No error code');
          // Fall back to not showing onboarding if there's an API error
          setOnboardingNeeded(false);
        }
      } catch (error) {
        // Handle different error types
        let errorMessage = 'Unknown error';
        let errorName = 'UnknownErrorType';
        let errorDetails = null;

        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
            errorName = 'StringError';
          } else if (error instanceof Error) {
            errorMessage = error.message || 'Unknown error';
            errorName = error.name || 'Error';
            errorDetails = {
              stack: error.stack,
              cause: error.cause
            };
          } else if (typeof error === 'object') {
            errorMessage = error.message || String(error) || 'Unknown error';
            errorName = error.name || error.constructor?.name || 'ObjectError';
            errorDetails = error;
          }
        }

        // Don't log errors if the component was unmounted - that's expected behavior
        const isAbortFromUnmount = error && error.name === 'AbortError' && controller.signal.aborted;
        
        if (isAbortFromUnmount) {
          console.log('OnboardingProvider: Request was aborted because component unmounted');
        } else if (errorName === 'AbortError') {
          console.warn('Request was aborted (timeout) in OnboardingProvider');
        } else {
          // Only log non-abort errors with full details
          console.error('Error checking onboarding status in OnboardingProvider:', {
            message: errorMessage,
            name: errorName,
            details: errorDetails,
            error: error
          });
        }

        // Fall back to not showing onboarding if there's an error (only if component is still mounted)
        if (!controller.signal.aborted) {
          setOnboardingNeeded(false);
        }
      } finally {
        // Only set loading to false if the component is still mounted
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    checkOnboardingStatus();

    // Cleanup function: abort any pending requests when the component unmounts
    return () => {
      console.log('OnboardingProvider: Component unmounting, cleaning up requests');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller.abort('component unmounted');
    };
  }, [session, status]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (formData) => {
    const controller = new AbortController();
    let timeoutId = null;

    try {
      // Add timeout to prevent hanging requests
      timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
          console.warn('Onboarding completion timeout in OnboardingProvider - request took too long');
        }
      }, 8000);

      console.log('OnboardingProvider: Submitting onboarding data...');

      // Send onboarding data to API
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'onboarding-provider-submit'
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache'
      });

      // Clear timeout if the request completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`HTTP error in OnboardingProvider completion: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response in OnboardingProvider completion:', parseError);
        throw new Error('Invalid response format');
      }

      console.log('OnboardingProvider: Onboarding submission response:', data);

      if (data.success) {
        console.log('OnboardingProvider: Onboarding completed successfully');
        // Close the onboarding wizard
        setOnboardingNeeded(false);
        // Update onboarding data
        setOnboardingData(formData);
      } else {
        console.error('Failed to save onboarding data in OnboardingProvider:', data.error || 'Unknown error', data.code || 'No error code');
      }
    } catch (error) {
      // Handle AbortError differently if it was due to a timeout vs component unmount
      if (error && error.name === 'AbortError') {
        console.warn('Onboarding submission request was aborted in OnboardingProvider');
      } else {
        // Safely log error details by checking if they exist first
        const errorMessage = error && error.message ? error.message : 'Unknown error';
        const errorName = error && error.name ? error.name : 'UnknownErrorType';
        console.error('Error saving onboarding data in OnboardingProvider:', errorMessage, errorName);
      }
    } finally {
      // Always clean up the timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  // Handle skip onboarding
  const handleSkipOnboarding = async () => {
    const controller = new AbortController();
    let timeoutId = null;

    try {
      // Add timeout to prevent hanging requests
      timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
          console.warn('Skip onboarding timeout in OnboardingProvider - request took too long');
        }
      }, 8000);

      console.log('OnboardingProvider: Skipping onboarding...');

      // Mark onboarding as complete with minimal data
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'onboarding-provider-skip'
        },
        body: JSON.stringify({
          setupComplete: true
        }),
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache'
      });

      // Clear timeout if the request completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`HTTP error in OnboardingProvider skip: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response in OnboardingProvider skip:', parseError);
        throw new Error('Invalid response format');
      }

      console.log('OnboardingProvider: Skip onboarding response:', data);

      if (data.success) {
        console.log('OnboardingProvider: Onboarding skipped successfully');
        setOnboardingNeeded(false);
      } else {
        console.error('Failed to skip onboarding in OnboardingProvider:', data.error || 'Unknown error', data.code || 'No error code');
      }
    } catch (error) {
      // Handle AbortError differently if it was due to a timeout vs component unmount
      if (error && error.name === 'AbortError') {
        console.warn('Skip onboarding request was aborted in OnboardingProvider');
      } else {
        // Safely log error details by checking if they exist first
        const errorMessage = error && error.message ? error.message : 'Unknown error';
        const errorName = error && error.name ? error.name : 'UnknownErrorType';
        console.error('Error skipping onboarding in OnboardingProvider:', errorMessage, errorName);
      }
    } finally {
      // Always clean up the timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  // Context value
  const contextValue = {
    onboardingNeeded,
    onboardingData,
    loading,
    completeOnboarding: handleOnboardingComplete,
    skipOnboarding: handleSkipOnboarding
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {/* Show onboarding wizard if needed */}
      {!loading && onboardingNeeded && (
        <OnboardingWizard
          open={onboardingNeeded}
          initialData={onboardingData}
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      )}
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Custom hook to use the onboarding context
 * @returns {Object} Onboarding context
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}