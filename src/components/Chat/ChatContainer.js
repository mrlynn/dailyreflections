'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Avatar, Divider, Alert, Button } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CircleIcon from '@mui/icons-material/Circle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatMessagesPanel from './ChatMessagesPanel';
import ChatInput from './ChatInput';
import { useSession } from 'next-auth/react';
import { useAbly } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { ensureAblyConnection } from '@/utils/chatConnectionRetry';

/**
 * ChatContainer component integrates all chat elements
 *
 * @param {Object} props
 * @param {string} props.sessionId - The chat session ID
 * @param {Array} props.initialMessages - Initial messages to display
 * @param {Object} props.chatSession - Chat session details
 * @param {boolean} props.isVolunteer - Whether the current user is a volunteer
 * @param {Function} props.onNewMessage - Callback when a new message is received
 */
export default function ChatContainer({
  sessionId,
  initialMessages = [],
  chatSession,
  isVolunteer = false,
  onNewMessage
}) {
  const { data: session } = useSession();
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  const { isConnected, connectionError, client: ablyClient } = useAbly();
  const [messages, setMessages] = useState(initialMessages || []);
  const [presenceState, setPresenceState] = useState({});
  const [error, setError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Show error if feature is disabled
  useEffect(() => {
    if (!isRealtimeChatEnabled) {
      setError('Realtime chat feature is not enabled');
    }
  }, [isRealtimeChatEnabled]);

  // Current user ID based on session
  const userId = session?.user?.id;
  const userType = isVolunteer ? 'volunteer' : 'user';

  // Effect to update local messages when initialMessages prop changes
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Handle new incoming messages from the ChatMessagesPanel
  const handleNewMessage = (newMessage) => {
    setMessages(prev => {
      // Prevent duplicate messages
      if (prev.some(m => m._id === newMessage._id)) {
        return prev;
      }
      return [...prev, newMessage];
    });

    // Pass to parent component if callback provided
    if (onNewMessage) {
      onNewMessage(newMessage);
    }
  };

  // Handle local message sending from ChatInput
  const handleMessageSent = (sentMessage) => {
    setMessages(prev => {
      // If already in messages (e.g. from optimistic UI), replace it
      if (prev.some(m => m._id === sentMessage._id)) {
        return prev.map(m => m._id === sentMessage._id ? sentMessage : m);
      }
      return [...prev, sentMessage];
    });

    // Pass to parent component if callback provided
    if (onNewMessage) {
      onNewMessage(sentMessage);
    }
  };

  // Handle typing indicator updates
  const handleTypingUpdate = (isTyping, userId) => {
    setPresenceState(prev => ({
      ...prev,
      [userId]: { ...prev[userId], isTyping }
    }));
  };

  // Check if the opposite user is typing
  const getTypingIndicator = () => {
    if (!chatSession) return null;

    // Determine the opposite user ID
    const oppositeUserId = isVolunteer ? chatSession.user_id : chatSession.volunteer_id;

    // Check if they're typing
    if (oppositeUserId && presenceState[oppositeUserId]?.isTyping) {
      return `${isVolunteer ? 'User' : 'Volunteer'} is typing...`;
    }

    return null;
  };

  // Determine if chat is active and not locked
  const isSessionActive = (chatSession?.status === 'active' || chatSession?.status === 'in_progress')
    && !chatSession?.is_locked;

  // Handle manual retry of connection
  const handleRetryConnection = async () => {
    if (!ablyClient) return;

    try {
      setIsReconnecting(true);

      // Attempt to reconnect
      const success = await ensureAblyConnection(ablyClient);

      if (success) {
        // If we reconnected, clear any error states
        setError(null);
      } else {
        setError('Unable to reconnect. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error during manual reconnection:', err);
      setError('Reconnection failed. Please refresh the page.');
    } finally {
      setIsReconnecting(false);
    }
  };

  // Format display name
  const getOtherUserDisplayName = () => {
    if (!chatSession) return isVolunteer ? 'User' : 'Volunteer';

    if (isVolunteer) {
      return 'User'; // In a real app, get the user's name
    } else {
      return 'Volunteer'; // In a real app, get the volunteer's name
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2
      }}
    >
      {/* Chat header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5 }}>
          <PersonOutlineIcon />
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {getOtherUserDisplayName()}
            </Typography>

            <Chip
              size="small"
              label={isSessionActive ? "Active" : (chatSession?.is_locked ? "Locked" : "Inactive")}
              color={isSessionActive ? "success" : (chatSession?.is_locked ? "error" : "default")}
              sx={{ ml: 1, height: 20 }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {getTypingIndicator() || (isSessionActive ? 'Online' : 'Offline')}
            </Typography>

            {isSessionActive && (
              <CircleIcon
                sx={{
                  color: isConnected ? 'success.main' : 'warning.main',
                  fontSize: 10,
                  ml: 0.5
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Connection error alert with retry button */}
      {connectionError && (
        <Alert
          severity="error"
          sx={{ m: 1 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRetryConnection}
              disabled={isReconnecting}
            >
              {isReconnecting ? 'Reconnecting...' : 'Retry'}
            </Button>
          }
        >
          Connection error: {connectionError}
        </Alert>
      )}

      {/* Session-specific alerts */}
      {chatSession?.is_locked && (
        <Alert severity="info" sx={{ m: 1 }}>
          This chat session has been ended and is locked.
        </Alert>
      )}

      {/* Chat disclaimer */}
      <Box p={1.5} bgcolor="background.paper">
        <Typography variant="caption" color="text.secondary">
          {isVolunteer
            ? "You are supporting a fellow person in recovery. Remember to follow the volunteer guidelines."
            : "You are speaking with a fellow person in recovery — not a counselor or therapist. All conversations are confidential."}
        </Typography>
      </Box>

      <Divider />

      {/* Messages area - main content, should take all available space */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatMessagesPanel
          sessionId={sessionId}
          initialMessages={messages}
          currentUserId={userId}
          onNewMessage={handleNewMessage}
          containerProps={{
            sx: {
              backgroundImage: 'linear-gradient(rgba(25, 118, 210, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25, 118, 210, 0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }
          }}
        />
      </Box>

      {/* Chat input - only show if session is active */}
      {isSessionActive ? (
        <ChatInput
          sessionId={sessionId}
          userId={userId}
          userType={userType}
          disabled={!isSessionActive}
          onMessageSent={handleMessageSent}
          onTyping={(isTyping) => handleTypingUpdate(isTyping, userId)}
        />
      ) : (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {chatSession?.is_locked
              ? "This chat session has ended and is locked."
              : "This chat session is not active."}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}