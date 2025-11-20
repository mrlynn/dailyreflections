'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to handle volunteer application submission and status
 * @returns {Object} Object containing application methods and state
 */
export default function useVolunteerApplication() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);

  /**
   * Submit a new volunteer application
   * @param {Object} applicationData - The application data to submit
   * @returns {Promise<Object>} The application response data
   */
  const submitApplication = useCallback(async (applicationData) => {
    if (!session?.user) {
      setError('You must be logged in to submit an application');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/volunteers/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: {
            ...applicationData
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setApplicationStatus(data.application);
      return data.application;
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Get the current user's volunteer application status
   * @returns {Promise<Object>} The application status data
   */
  const getApplicationStatus = useCallback(async () => {
    if (!session?.user) {
      setError('You must be logged in to check application status');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/volunteers/applications');

      if (!response.ok) {
        throw new Error('Failed to fetch application status');
      }

      const data = await response.json();
      setApplicationStatus(data.application);
      return data.application;
    } catch (err) {
      console.error('Error fetching application status:', err);
      setError(err.message || 'Failed to check application status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Agree to the code of conduct
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const agreeToCodeOfConduct = useCallback(async () => {
    if (!session?.user) {
      setError('You must be logged in to agree to the code of conduct');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/volunteers/applications/code-of-conduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to agree to code of conduct');
      }

      return true;
    } catch (err) {
      console.error('Error agreeing to code of conduct:', err);
      setError(err.message || 'Failed to agree to code of conduct');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    submitApplication,
    getApplicationStatus,
    agreeToCodeOfConduct,
    applicationStatus,
    loading,
    error,
  };
}