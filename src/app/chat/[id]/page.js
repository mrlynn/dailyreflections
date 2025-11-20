'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, Container, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Import components
import UserChatInterface from '@/components/user/chat/UserChatInterface';
import RealtimeUserChatInterface from '@/components/user/chat/RealtimeUserChatInterface';

// Feature flag to enable Ably real-time chat
// To enable Ably, set this to true
const USE_ABLY_REALTIME = true;

export default function ChatPage() {
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [sessionFound, setSessionFound] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract session ID from params
  const sessionId = params.id;

  // Effect to verify the user has access to this chat session
  useEffect(() => {
    const verifyChatAccess = async () => {
      if (sessionStatus === 'loading') return;

      // If user is not authenticated, redirect to sign in
      if (sessionStatus === 'unauthenticated') {
        router.push(`/auth/signin?callbackUrl=/chat/${sessionId}`);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if session exists and user has access
        const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
          method: 'GET'
        });

        if (response.status === 404) {
          setSessionFound(false);
        } else if (!response.ok) {
          throw new Error('Failed to verify chat session access');
        } else {
          setSessionFound(true);
        }
      } catch (err) {
        console.error('Error verifying chat session access:', err);
        setError(err.message || 'An error occurred while verifying access to this chat session');
      } finally {
        setIsLoading(false);
      }
    };

    verifyChatAccess();
  }, [sessionId, sessionStatus, router]);

  // If still loading session or verifying access
  if (isLoading || sessionStatus === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" my={4}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="h6">Loading chat session...</Typography>
        </Box>
      </Container>
    );
  }

  // If session not found
  if (sessionFound === false) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Chat Session Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The chat session you're looking for doesn't exist or has expired.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/')}
          >
            Return Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // If error occurred
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Chat
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/')}
          >
            Return Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // If access verified, render the appropriate chat interface based on feature flag
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box height="80vh" display="flex" flexDirection="column">
        {USE_ABLY_REALTIME ? (
          <RealtimeUserChatInterface sessionId={sessionId} />
        ) : (
          <UserChatInterface sessionId={sessionId} />
        )}
      </Box>
    </Container>
  );
}