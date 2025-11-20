'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button, Fade } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useChatChannel } from '@/hooks/useChatChannel';
import ChatMessageItem from './ChatMessageItem';

/**
 * ChatMessagesPanel component displays real-time chat messages
 * and handles scrolling behavior
 *
 * @param {Object} props
 * @param {string} props.sessionId - The chat session ID
 * @param {Array} props.initialMessages - Initial messages to display
 * @param {string} props.currentUserId - The current user's ID
 * @param {Function} props.onNewMessage - Callback when a new message is received
 * @param {Object} props.containerProps - Additional props for the container
 */
export default function ChatMessagesPanel({
  sessionId,
  initialMessages = [],
  currentUserId,
  onNewMessage,
  containerProps = {}
}) {
  // Refs for scrolling
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // State variables
  const [messages, setMessages] = useState(initialMessages);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasInitialScroll, setHasInitialScroll] = useState(false);

  // Set up Ably channel for this chat session
  const { isConnected, isLoading, error } = useChatChannel(
    sessionId,
    {
      onMessage: (message) => {
        if (message.name === 'chat-message') {
          handleNewMessage(message.data);
        }
      },
      onPresenceUpdate: (action, member) => {
        console.log(`Presence update (${action}):`, member);
        // Handle presence updates if needed
      }
    }
  );

  // Handle new incoming messages
  const handleNewMessage = (newMessage) => {
    // Skip if we already have this message (prevent duplicates)
    if (messages.some(m => m._id === newMessage._id)) {
      return;
    }

    setMessages(prev => [...prev, newMessage]);

    // Call the onNewMessage callback if provided
    if (onNewMessage) {
      onNewMessage(newMessage);
    }

    // Update unread count if user is scrolled up
    const container = messagesContainerRef.current;
    if (container) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      // If user is not at bottom, increment unread counter
      if (distanceFromBottom > 150) {
        setHasNewMessages(true);
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    // Always scroll on the first load
    if (!hasInitialScroll && messages.length > 0) {
      scrollToBottom({ behavior: 'auto' });
      setHasInitialScroll(true);
      return;
    }

    // Get distance from bottom before new messages are rendered
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // Auto-scroll if user is already near bottom
    const isNearBottom = distanceFromBottom < 150;

    if (isNearBottom) {
      setTimeout(() => {
        scrollToBottom({ behavior: 'smooth' });
      }, 100);

      // Reset new messages indicator when we auto-scroll
      if (hasNewMessages) {
        setHasNewMessages(false);
        setUnreadCount(0);
      }
    }
  }, [messages, hasInitialScroll, hasNewMessages]);

  // Function to scroll to bottom of messages
  const scrollToBottom = (options = { behavior: 'smooth' }) => {
    const container = messagesContainerRef.current;
    const endElement = messagesEndRef.current;

    if (!container) return;

    if (endElement) {
      endElement.scrollIntoView({
        behavior: options.behavior,
        block: 'end',
      });
      return;
    }

    // Fallback to manual scrolling
    if (options.behavior === 'smooth') {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = container.scrollHeight;

      // Double-check scroll position
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
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
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={2} textAlign="center">
        <Typography color="error">
          Error connecting to chat: {error}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => window.location.reload()}
          sx={{ mt: 1 }}
        >
          Refresh to retry
        </Button>
      </Box>
    );
  }

  return (
    <Box position="relative" height="100%" width="100%">
      {/* Messages container */}
      <Box
        ref={messagesContainerRef}
        sx={{
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          ...containerProps?.sx
        }}
        {...containerProps}
      >
        {messages.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography color="text.secondary" variant="body2">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <ChatMessageItem
              key={message._id}
              message={message}
              isCurrentUser={message.sender_id === currentUserId}
            />
          ))
        )}

        {/* Element for scrolling to bottom */}
        <div ref={messagesEndRef} />

        {/* Connection status indicator */}
        {!isConnected && (
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              width: '100%',
              textAlign: 'center',
              py: 1,
              backgroundColor: 'warning.light',
              borderRadius: 1,
              mb: 1
            }}
          >
            <Typography variant="caption" color="warning.contrastText">
              Reconnecting to chat...
            </Typography>
          </Box>
        )}
      </Box>

      {/* New messages indicator */}
      {hasNewMessages && (
        <Fade in={hasNewMessages}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2
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
        </Fade>
      )}
    </Box>
  );
}