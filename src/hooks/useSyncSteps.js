'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook for managing synchronization between Step 8 and Step 9
 * @returns {Object} Sync state and functions
 */
export default function useSyncSteps() {
  const { data: session } = useSession();
  const [syncNeeded, setSyncNeeded] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, checking, syncing, success, error
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);

  // Check if sync is needed
  const checkSyncNeeded = useCallback(async () => {
    if (!session?.user) return;

    try {
      setSyncStatus('checking');
      const response = await fetch('/api/sync/steps');

      if (!response.ok) {
        throw new Error('Failed to check sync status');
      }

      const data = await response.json();
      setSyncNeeded(data.syncNeeded);
      setSyncStatus('idle');
    } catch (err) {
      console.error('Error checking sync status:', err);
      setError(err.message);
      setSyncStatus('error');
    }
  }, [session?.user]);

  // Synchronize Step 8 to Step 9
  const syncStep8ToStep9 = useCallback(async () => {
    if (!session?.user) return;

    try {
      setSyncStatus('syncing');
      const response = await fetch('/api/sync/steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction: 'step8-to-step9'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to synchronize Step 8 to Step 9');
      }

      const result = await response.json();
      setSyncResult(result);
      setSyncNeeded(false);
      setSyncStatus('success');
      return result;
    } catch (err) {
      console.error('Error syncing Step 8 to Step 9:', err);
      setError(err.message);
      setSyncStatus('error');
      throw err;
    }
  }, [session?.user]);

  // Update Step 8 from Step 9
  const updateStep8FromStep9 = useCallback(async (entryId) => {
    if (!session?.user || !entryId) return;

    try {
      setSyncStatus('syncing');
      const response = await fetch('/api/sync/steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction: 'step9-to-step8',
          entryId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update Step 8 from Step 9');
      }

      const result = await response.json();
      setSyncResult(result);
      setSyncStatus('success');
      return result;
    } catch (err) {
      console.error('Error updating Step 8 from Step 9:', err);
      setError(err.message);
      setSyncStatus('error');
      throw err;
    }
  }, [session?.user]);

  // Reset sync status
  const resetSyncStatus = () => {
    setSyncStatus('idle');
    setSyncResult(null);
    setError(null);
  };

  // Automatically check for sync needed on component mount
  useEffect(() => {
    if (session?.user) {
      checkSyncNeeded();
    }
  }, [session?.user, checkSyncNeeded]);

  return {
    syncNeeded,
    syncStatus,
    syncResult,
    error,
    checkSyncNeeded,
    syncStep8ToStep9,
    updateStep8FromStep9,
    resetSyncStatus
  };
}