'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Box, CircularProgress, Alert, Button, Typography } from '@mui/material';

// Import chat components
import StreamlinedVolunteerChat from '@/components/Volunteer/Chat/StreamlinedVolunteerChat';
import RealtimeVolunteerChat from '@/components/Volunteer/Chat/RealtimeVolunteerChat';

// Feature flag to enable Ably real-time chat
const USE_ABLY_REALTIME = true;

/**
 * Volunteer chat session page
 * Shows chat messages and allows the volunteer to send messages
 * Uses the enhanced chat interface with resources, quick responses, and AI assistance
 */
export default function VolunteerChatSessionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);

  // Fetch initial chat session and messages
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch chat session details
        const sessionResponse = await fetch(`/api/volunteers/chat/sessions/${sessionId}`);
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch chat session');
        }
        const sessionData = await sessionResponse.json();
        setChatSession(sessionData.session);

        // Fetch chat messages
        const messagesResponse = await fetch(`/api/volunteers/chat/messages?sessionId=${sessionId}`);
        if (!messagesResponse.ok) {
          throw new Error('Failed to fetch chat messages');
        }
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError(err.message || 'Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [sessionId]);

  // If loading, show spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={32} />
        <Typography variant="h6" ml={2}>Loading chat session...</Typography>
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => router.push('/volunteer/chat')}>
              Back to Chat List
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Check if volunteer is assigned to this session
  const isAssignedToVolunteer = session && chatSession &&
    (session.user?.id === chatSession.volunteer_id || chatSession.status === 'waiting');

  // If not assigned to this volunteer, show permission error
  if (!isAssignedToVolunteer) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => router.push('/volunteer/chat')}>
              Back to Chat List
            </Button>
          }
        >
          You are not assigned to this chat session.
        </Alert>
      </Box>
    );
  }

  // Render the volunteer chat interface
  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {USE_ABLY_REALTIME ? (
        <RealtimeVolunteerChat
          sessionId={sessionId}
          onClose={() => router.push('/volunteer/chat')}
          initialMessages={messages}
          initialSession={chatSession}
        />
      ) : (
        <StreamlinedVolunteerChat
          sessionId={sessionId}
          onClose={() => router.push('/volunteer/chat')}
          initialMessages={messages}
          initialSession={chatSession}
        />
      )}
    </Box>
  );
}