'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Badge,
  Alert,
  CircularProgress,
  Button,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCommentIcon from '@mui/icons-material/AddComment';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAbly } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Import our new chat components
import ChatContainer from '@/components/Chat/ChatContainer';
import FeedbackForm from './FeedbackForm';
import WaitingScreen from './WaitingScreen';

/**
 * Realtime User Chat Interface using Ably
 * @param {Object} props
 * @param {string} props.sessionId - Chat session ID
 * @param {Function} [props.onClose] - Callback for when the chat is closed
 */
export default function RealtimeUserChatInterface({ sessionId, onClose }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  const { isConnected } = useAbly();

  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Show error if feature is disabled
  useEffect(() => {
    if (!isRealtimeChatEnabled) {
      setError('Realtime chat feature is not enabled');
      setIsLoading(false);
    }
  }, [isRealtimeChatEnabled]);

  // Effect to fetch chat session data on mount and periodically check for status changes
  useEffect(() => {
    // Don't fetch if feature is disabled
    if (!isRealtimeChatEnabled) {
      return;
    }

    const fetchChatSession = async () => {
      try {
        const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat session');
        }

        const data = await response.json();
        setChatSession(data.session);
      } catch (err) {
        console.error('Error fetching chat session:', err);
        setError(err.message || 'Failed to fetch chat session');
      }
    };

    if (sessionId) {
      fetchChatSession();

      // Set up polling for session status changes (still needed for locked/completed status)
      const statusPolling = setInterval(fetchChatSession, 10000);

      return () => {
        clearInterval(statusPolling);
      };
    }
  }, [sessionId]);

  // Effect to fetch initial chat messages on mount
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        if (!sessionId) return;

        const response = await fetch(`/api/volunteers/chat/messages?sessionId=${sessionId}`, {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat messages');
        }

        const data = await response.json();
        console.log(`Initial message fetch for session ${sessionId}:`, {
          messageCount: data.messages?.length || 0
        });

        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error fetching initial chat messages:', err);
        setError(err.message || 'Failed to fetch chat messages');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchInitialMessages();
    }
  }, [sessionId]);

  // Handle new message (from Ably or when user sends a message)
  const handleNewMessage = (message) => {
    setMessages(prev => {
      // Skip if we already have this message (prevent duplicates)
      if (prev.some(m => m._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  // Handle message flagging
  const handleFlagMessage = async (message) => {
    try {
      const response = await fetch(`/api/volunteers/chat/messages/${message._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'flag',
          reason: 'Flagged by user'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to flag message');
      }

      // Update message in state to show it's been flagged
      setMessages(prev =>
        prev.map(m =>
          m._id === message._id ? { ...m, moderated: true } : m
        )
      );
    } catch (err) {
      console.error('Error flagging message:', err);
      setError('Failed to flag message');
    }
  };

  // Handle closing the chat
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
        p={3}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  // If session is waiting for a volunteer, show waiting screen
  if (chatSession?.status === 'waiting') {
    return <WaitingScreen sessionId={sessionId} />;
  }

  // If session is expired or abandoned, show appropriate message
  if (['expired', 'abandoned'].includes(chatSession?.status)) {
    return (
      <Box p={3}>
        <Alert severity="info">
          This chat session has {chatSession?.status}. No volunteers were available at the time.
        </Alert>
      </Box>
    );
  }

  // Determine if chat has volunteer
  const hasVolunteer = chatSession?.volunteer_id;
  const isSessionActive = (chatSession?.status === 'active' || chatSession?.status === 'in_progress')
    && !chatSession?.is_locked;

  // Standard UI with ChatContainer for active sessions
  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '80vh',
        width: '100%',
        maxWidth: '800px',
        mx: 'auto',
        overflow: 'hidden',
        borderRadius: 2
      }}
    >
      {/* Chat header */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="back">
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, ml: 1 }}>
            <Badge
              color={hasVolunteer ? "success" : "default"}
              variant="dot"
              overlap="circular"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              sx={{ mr: 1 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PersonOutlineIcon />
              </Avatar>
            </Badge>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" component="div">
                  {hasVolunteer ? 'Volunteer' : 'Connecting...'}
                </Typography>
                {chatSession?.is_locked && (
                  <Tooltip title="This chat session has ended and is locked">
                    <LockIcon fontSize="small" color="error" sx={{ ml: 1 }} />
                  </Tooltip>
                )}
                {!isConnected && isSessionActive && (
                  <Box component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={12} sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Reconnecting...
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {chatSession?.is_locked
                  ? 'Session ended'
                  : hasVolunteer
                    ? 'Volunteer'
                    : 'Waiting for volunteer'}
              </Typography>
            </Box>
          </Box>

          <IconButton color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main chat container */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatContainer
          sessionId={sessionId}
          initialMessages={messages}
          chatSession={chatSession}
          isVolunteer={false}
          onNewMessage={handleNewMessage}
        />
      </Box>

      {/* Show feedback form if chat is completed */}
      {(chatSession?.status === 'completed' || chatSession?.is_locked) && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <FeedbackForm
            sessionId={sessionId}
            volunteerId={chatSession.volunteer_id}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCommentIcon />}
              onClick={() => {
                router.push('/chat/new');
              }}
            >
              Start a New Chat
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}