'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to manage volunteer code of conduct status and agreement
 * @returns {Object} Object containing code of conduct methods and state
 */
export default function useCodeOfConduct() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [agreedAt, setAgreedAt] = useState(null);

  /**
   * Agree to the code of conduct
   * @param {boolean} [explicit=true] Whether this is an explicit user action
   * @returns {Promise<boolean>} Success status
   */
  const agreeToCodeOfConduct = useCallback(async (explicit = true) => {
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
        body: JSON.stringify({
          agreed: true,
          explicit
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if ((response.status === 404 || response.status === 409) && data?.error === 'No volunteer application found') {
          setError('We couldn’t find a volunteer application for your account. Please complete your volunteer application before agreeing to the Code of Conduct.');
          return false;
        }

        throw new Error(data.error || 'Failed to agree to code of conduct');
      }

      setAgreed(true);
      setAgreedAt(new Date().toISOString());

      return true;
    } catch (err) {
      console.error('Error agreeing to code of conduct:', err);
      setError(err.message || 'Failed to agree to code of conduct');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Get current agreement status
   * @returns {Promise<Object>} Agreement status data
   */
  const getAgreementStatus = useCallback(async () => {
    if (!session?.user) {
      setError('You must be logged in to check code of conduct status');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/volunteers/code-of-conduct');

      if (!response.ok) {
        throw new Error('Failed to fetch code of conduct status');
      }

      const data = await response.json();

      setAgreed(data.codeOfConduct?.agreed || false);
      setAgreedAt(data.codeOfConduct?.agreedAt || null);

      return data.codeOfConduct;
    } catch (err) {
      console.error('Error fetching code of conduct status:', err);
      setError(err.message || 'Failed to check code of conduct status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Load agreement status when session changes
  useEffect(() => {
    if (session?.user) {
      getAgreementStatus();
    }
  }, [session, getAgreementStatus]);

  return {
    agreeToCodeOfConduct,
    getAgreementStatus,
    agreed,
    agreedAt,
    loading,
    error,
  };
}