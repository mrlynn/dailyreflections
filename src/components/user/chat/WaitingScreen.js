'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * Component displayed while user is waiting for a volunteer to join chat
 * @param {Object} props
 * @param {string} props.sessionId - ID of the chat session
 * @param {Function} [props.onVolunteerJoined] - Callback for when a volunteer joins
 * @param {Function} [props.onCancel] - Callback for when the user cancels waiting
 */
export default function WaitingScreen({ sessionId, onVolunteerJoined, onCancel }) {
  const router = useRouter();

  const [timeWaited, setTimeWaited] = useState(0); // in seconds
  const [status, setStatus] = useState('waiting');
  const [pollingId, setPollingId] = useState(null);
  const [error, setError] = useState(null);

  // Effect to start polling for session status
  useEffect(() => {
    // Function to poll the session status
    const pollSessionStatus = async () => {
      try {
        const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch session status');
        }

        const data = await response.json();

        // If session status has changed from 'waiting'
        if (data.session.status !== 'waiting') {
          setStatus(data.session.status);

          // If session is active (volunteer joined)
          if (data.session.status === 'active') {
            if (onVolunteerJoined) {
              onVolunteerJoined(data.session);
            }
            clearInterval(pollingId);
          }
          // If session expired/abandoned
          else if (['expired', 'abandoned'].includes(data.session.status)) {
            clearInterval(pollingId);
          }
        }
      } catch (err) {
        console.error('Error polling session status:', err);
        setError(err.message || 'An error occurred while checking session status');
      }
    };

    // Initial status check
    pollSessionStatus();

    // Set up interval for polling
    const id = setInterval(() => {
      setTimeWaited(prev => prev + 1);
      pollSessionStatus();
    }, 1000);
    setPollingId(id);

    // Cleanup on unmount
    return () => {
      if (pollingId) {
        clearInterval(pollingId);
      }
    };
  }, [sessionId, onVolunteerJoined]);

  // Format time waited into mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cancel button click
  const handleCancel = async () => {
    try {
      // Cancel the chat session request
      const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel chat request');
      }

      // Clear polling interval
      if (pollingId) {
        clearInterval(pollingId);
      }

      // Call onCancel callback if provided
      if (onCancel) {
        onCancel();
      } else {
        // Otherwise redirect to home
        router.push('/');
      }
    } catch (err) {
      console.error('Error cancelling chat request:', err);
      setError(err.message || 'An error occurred while cancelling the chat request');
    }
  };

  // If there's an error, display it
  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
        >
          Return Home
        </Button>
      </Paper>
    );
  }

  // If session expired or abandoned
  if (['expired', 'abandoned'].includes(status)) {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No volunteers available right now
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          We're sorry, but there are no volunteers available at the moment. Please try again later.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
        >
          Return Home
        </Button>
      </Paper>
    );
  }

  // Normal waiting screen
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
      <Box display="flex" flexDirection="column" alignItems="center" sx={{ py: 2 }}>
        <CircularProgress size={56} color="primary" />

        <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold' }}>
          Finding a volunteer...
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          Time waiting: {formatTime(timeWaited)}
        </Typography>

        <Box sx={{ width: '100%', mt: 3, mb: 2 }}>
          <Divider />
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mb: 2 }}>
          We're connecting you with a volunteer who can share their experience, strength, and hope.
          This may take a few moments depending on volunteer availability.
        </Typography>

        <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
          Our volunteers are fellow alcoholics in recovery who donate their time to help others.
          Thank you for your patience.
        </Typography>

        <Button
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          sx={{ mt: 1 }}
        >
          Cancel Request
        </Button>
      </Box>
    </Paper>
  );
}