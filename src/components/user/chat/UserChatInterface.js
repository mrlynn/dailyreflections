'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Avatar,
  Badge,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Import custom components
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import FeedbackForm from './FeedbackForm';
import WaitingScreen from './WaitingScreen';

// Flag for enabling polling (will be replaced with WebSockets)
const USE_POLLING = true;

/**
 * Main user chat interface component
 * @param {Object} props
 * @param {string} props.sessionId - Chat session ID
 * @param {Function} [props.onClose] - Callback for when the chat is closed
 */
export default function UserChatInterface({ sessionId, onClose }) {
  const { data: session } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingId, setPollingId] = useState(null);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Effect to fetch chat session data on mount and periodically check for status changes
  useEffect(() => {
    const fetchChatSession = async () => {
      try {
        const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
          method: 'GET',
          // Add cache-busting query param to ensure we get fresh data
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

        // If session is locked or completed, make sure to stop polling
        if (data.session.is_locked || data.session.status === 'completed') {
          if (pollingId) {
            clearInterval(pollingId);
            setPollingId(null);
          }

          // If session is newly locked (we didn't have this status before), add a system message
          if (data.session.is_locked && !chatSession?.is_locked) {
            // Add a system message to inform the user that the session has been locked
            setMessages(prevMessages => {
              // Check if we already have a system message about session ending
              const hasEndMessage = prevMessages.some(
                msg => msg.sender_type === 'system' && msg.content.includes('session has ended')
              );

              if (!hasEndMessage) {
                return [
                  ...prevMessages,
                  {
                    _id: `system-lock-${Date.now()}`,
                    session_id: sessionId,
                    sender_id: 'system',
                    sender_type: 'system',
                    content: 'This chat session has been ended by the volunteer. Thank you for your participation.',
                    created_at: new Date().toISOString()
                  }
                ];
              }

              return prevMessages;
            });

            // Make sure to scroll to the bottom to show the system message
            setTimeout(() => scrollToBottom({ behavior: 'smooth' }), 100);
          }
        }
      } catch (err) {
        console.error('Error fetching chat session:', err);
        setError(err.message || 'Failed to fetch chat session');
      }
    };

    if (sessionId) {
      fetchChatSession();

      // Set up polling for session status changes
      const statusPolling = setInterval(fetchChatSession, 10000); // Check session status every 10 seconds

      return () => {
        clearInterval(statusPolling);
      };
    }
  }, [sessionId, pollingId]);

  // Effect to fetch chat messages on mount and when new messages arrive
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // If we're polling for new messages only, use the lastMessageTime
        const searchParams = new URLSearchParams({ sessionId });

        if (lastMessageTime) {
          searchParams.append('after', new Date(lastMessageTime).toISOString());
          console.log(`User polling for messages after ${new Date(lastMessageTime).toISOString()}`);
        } else {
          console.log(`User performing initial message fetch for session ${sessionId}`);
        }

        const response = await fetch(`/api/volunteers/chat/messages?${searchParams.toString()}`, {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat messages');
        }

        const data = await response.json();
        console.log('User message poll response:', {
          messageCount: data.messages?.length || 0,
          sessionId,
          polling: !!lastMessageTime
        });

        if (lastMessageTime) {
          // Append new messages if we're polling
          if (data.messages.length > 0) {
            setMessages(prev => {
              // Create a Map of existing messages by ID to filter out duplicates
              const existingMessagesMap = new Map(prev.map(msg => [msg._id, msg]));

              // Add only unique messages not already in the state
              const uniqueNewMessages = data.messages.filter(newMsg => !existingMessagesMap.has(newMsg._id));

              return [...prev, ...uniqueNewMessages];
            });

            // Update last message time
            const newestMessage = data.messages[data.messages.length - 1];
            if (newestMessage) {
              setLastMessageTime(newestMessage.created_at);
            }
          }
        } else {
          // Set all messages if this is the initial load
          setMessages(data.messages);

          // Set last message time for future polling
          if (data.messages.length > 0) {
            const newestMessage = data.messages[data.messages.length - 1];
            setLastMessageTime(newestMessage.created_at);
          }
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
        setError(err.message || 'Failed to fetch chat messages');
      } finally {
        if (!lastMessageTime) {
          // Only set loading to false for initial load
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    if (sessionId && chatSession) {
      fetchMessages();

      // Set up polling for new messages if enabled
      if (USE_POLLING && chatSession.status === 'active' && !chatSession.is_locked) {
        const id = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        setPollingId(id);
      }
    }

    // Cleanup polling on unmount or when session status changes
    return () => {
      if (pollingId) {
        clearInterval(pollingId);
      }
    };
  }, [sessionId, chatSession, lastMessageTime]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    // Always scroll on the very first load so volunteers/users land at the newest message
    if (!hasInitialScroll) {
      scrollToBottom({ behavior: 'auto' });
      setHasInitialScroll(true);
      return;
    }

    // Get distance from bottom before new messages are rendered
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // More aggressive auto-scrolling - consider user to be at bottom if within 150px
    // This helps with ensuring new messages are visible
    const isNearBottom = distanceFromBottom < 150;

    // Also force scroll on any new messages received after a short delay to ensure DOM has updated
    if (isNearBottom) {
      // Use setTimeout to ensure DOM has fully updated with new messages
      setTimeout(() => {
        scrollToBottom({ behavior: 'smooth' });
      }, 100);

      // Reset new messages indicator when we auto-scroll
      if (hasNewMessages) {
        setHasNewMessages(false);
        setUnreadCount(0);
      }
    } else if (messages.length > 0) {
      // If user has scrolled up (not near bottom), show new message indicator
      const lastSeenMessageIndex = localStorage.getItem(`chat_${sessionId}_last_seen_index`);
      const currentCount = lastSeenMessageIndex ? messages.length - parseInt(lastSeenMessageIndex, 10) : 1;

      if (currentCount > 0) {
        setHasNewMessages(true);
        setUnreadCount(currentCount);
      }
    }
  }, [messages, hasInitialScroll]);

  // Function to scroll to bottom of messages with improved reliability
  const scrollToBottom = (options = { behavior: 'smooth' }) => {
    const container = messagesContainerRef.current;
    const endElement = messagesEndRef.current;

    if (!container) return;

    // Use the messagesEndRef to scroll into view if available (most reliable)
    if (endElement) {
      endElement.scrollIntoView({
        behavior: options.behavior,
        block: 'end',
      });
      return;
    }

    // Fallback to manual scrolling if the ref isn't available
    if (options.behavior === 'smooth') {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      // For immediate scrolling, sometimes setting scrollTop directly works better
      container.scrollTop = container.scrollHeight;

      // Double-check that we're actually at the bottom - sometimes needed for high message volumes
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  };

  // Handle new message sent by user
  const handleMessageSent = (message) => {
    setMessages(prev => {
      // Check if this message already exists in the state
      const messageExists = prev.some(msg => msg._id === message._id);

      // Only add the message if it doesn't already exist
      const updatedMessages = messageExists ? prev : [...prev, message];

      // When user sends a message, always auto-scroll and update the last seen message
      setTimeout(() => {
        scrollToBottom({ behavior: 'auto' });
        // Save the index of the last message the user has seen
        localStorage.setItem(`chat_${sessionId}_last_seen_index`, updatedMessages.length.toString());
      }, 100);

      return updatedMessages;
    });
    setLastMessageTime(message.created_at);

    // Reset new messages indicator when user sends a message
    setHasNewMessages(false);
    setUnreadCount(0);
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
      // Could show an error toast here
    }
  };

  // Handle closing the chat
  const handleClose = () => {
    // Clear polling interval
    if (pollingId) {
      clearInterval(pollingId);
    }

    // Call onClose callback if provided
    if (onClose) {
      onClose();
    } else {
      // Otherwise redirect to home
      router.push('/');
    }
  };

  // If still loading, show loading screen
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

  // If there's an error, show error message
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

  // Get volunteer name (first name + last initial)
  // In a real implementation, you would fetch the volunteer's name
  const volunteerName = "Volunteer"; // Placeholder

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
                  {hasVolunteer ? volunteerName : 'Connecting...'}
                </Typography>
                {chatSession?.is_locked && (
                  <Tooltip title="This chat session has ended and is locked">
                    <LockIcon fontSize="small" color="error" sx={{ ml: 1 }} />
                  </Tooltip>
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

      {/* Chat disclaimer */}
      {hasVolunteer && (
        <Box p={2} bgcolor="grey.50">
          <Typography variant="caption" color="text.secondary">
            You are speaking with a fellow alcoholic in recovery — not a counselor or therapist.
            All conversations are confidential within the bounds of our privacy policy.
          </Typography>
        </Box>
      )}

      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          backgroundImage: 'linear-gradient(rgba(25, 118, 210, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25, 118, 210, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          scrollBehavior: 'smooth'
        }}
        ref={messagesContainerRef}
      >
        {messages.map((message) => (
          <ChatMessage
            key={message._id}
            message={message}
            isCurrentUser={message.sender_id === session?.user?.id}
            onFlag={handleFlagMessage}
          />
        ))}

        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />

        {/* System message about session ending */}
        {chatSession?.is_locked && (
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            mt: 2,
            mb: 2
          }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                px: 3,
                backgroundColor: '#fff8e1',
                border: '1px dashed',
                borderColor: 'warning.light',
                maxWidth: '85%',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <LockIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="warning.dark" fontWeight="medium">
                  This chat session has been ended
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                The volunteer has closed this conversation. Thank you for reaching out.
                You can start a new chat if you'd like to connect with another volunteer.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Show feedback form if chat is completed */}
        {(chatSession?.status === 'completed' || chatSession?.is_locked) && (
          <FeedbackForm
            sessionId={sessionId}
            volunteerId={chatSession.volunteer_id}
          />
        )}
      </Box>

      {/* New messages indicator */}
      {hasNewMessages && (
        <Box
          sx={{
            position: 'absolute',
            bottom: chatSession?.status === 'active' ? 80 : 16, // Position above input or at bottom if no input
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              scrollToBottom({ behavior: 'smooth' });
              setHasNewMessages(false);
              setUnreadCount(0);
              localStorage.setItem(`chat_${sessionId}_last_seen_index`, messages.length.toString());
            }}
            startIcon={<KeyboardArrowDownIcon />}
            sx={{
              borderRadius: 20,
              boxShadow: 3,
              px: 2
            }}
          >
            {unreadCount > 1 ? `${unreadCount} New Messages` : 'New Message'}
          </Button>
        </Box>
      )}

      {/* Chat input */}
      {chatSession?.status === 'active' && !chatSession?.is_locked ? (
        <ChatInput
          sessionId={sessionId}
          onMessageSent={handleMessageSent}
          disabled={chatSession?.status !== 'active' || chatSession?.is_locked}
        />
      ) : chatSession?.is_locked ? (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: '#fafafa'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <LockIcon color="error" sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="subtitle2" color="error.main">
              This chat session has been ended and locked
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The volunteer has ended this conversation. You can no longer send messages in this chat.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCommentIcon />}
            onClick={() => {
              // In real implementation, redirect to create a new chat
              router.push('/chat/new');
            }}
          >
            Start a New Chat
          </Button>
        </Box>
      ) : null}
    </Paper>
  );
}