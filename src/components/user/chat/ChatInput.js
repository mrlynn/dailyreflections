'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachmentIcon from '@mui/icons-material/Attachment';

/**
 * Chat input component with message sending functionality
 * @param {Object} props
 * @param {string} props.sessionId - Chat session ID
 * @param {Function} [props.onMessageSent] - Callback for when a message is sent
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {string} [props.placeholder="Type your message..."] - Placeholder text
 */
export default function ChatInput({
  sessionId,
  onMessageSent,
  disabled = false,
  placeholder = "Type your message..."
}) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingActiveRef = useRef(false);

  // Focus the input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingActiveRef.current) {
        sendTypingStatus(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Handle message change
  const sendTypingStatus = async (isTyping) => {
    if (!sessionId) return;
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          status: isTyping ? 'start' : 'stop'
        })
      });
    } catch (err) {
      // Silently ignore typing errors
      console.debug('Typing indicator update failed', err);
    }
  };

  const requestTyping = () => {
    if (disabled) return;

    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      sendTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      sendTypingStatus(false);
    }, 3000);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    requestTyping();

    // Clear error if user starts typing again
    if (error) {
      setError(null);
    }
  };

  // Handle sending message
  const sendMessage = async () => {
    if (!message.trim()) {
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch('/api/volunteers/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content: message.trim(),
          metadata: {
            client_timestamp: new Date(),
            client_message_id: `${sessionId}-${Date.now()}`
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Clear message input
      setMessage('');

      // Handle duplicate message warnings
      if (data.warning === 'Duplicate message detected') {
        console.debug('Duplicate message detected, not adding to UI');
        // Don't call onMessageSent for duplicates to avoid adding it to the UI again
        // However, we don't throw an error since this is an expected case
        return;
      }

      // Call onMessageSent callback with the sent message data
      if (onMessageSent && data.message) {
        onMessageSent(data.message);
      }

      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        sendTypingStatus(false);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press (for Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        position: 'relative'
      }}
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage();
      }}
    >
      {/* Future: Attachment button disabled for now */}
      <Tooltip title="Attachments are not available yet">
        <span>
          <IconButton
            disabled={true}
            size="medium"
            sx={{ ml: 0.5 }}
          >
            <AttachmentIcon />
          </IconButton>
        </span>
      </Tooltip>

      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        maxRows={4}
        placeholder={placeholder}
        value={message}
        onChange={handleMessageChange}
        onKeyPress={handleKeyPress}
        disabled={disabled || isSending}
        variant="outlined"
        size="small"
        sx={{
          mx: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }
          },
          '& .MuiOutlinedInput-input': {
            padding: '12px 14px',
          },
          transition: 'all 0.2s ease'
        }}
        error={Boolean(error)}
        helperText={error}
        inputProps={{
          maxLength: 1000
        }}
      />

      <IconButton
        color="primary"
        disabled={disabled || isSending || !message.trim()}
        onClick={sendMessage}
        size="medium"
        sx={{
          mr: 0.5,
          bgcolor: message.trim() ? 'primary.main' : 'transparent',
          color: message.trim() ? 'white' : 'primary.main',
          '&:hover': {
            bgcolor: message.trim() ? 'primary.dark' : 'rgba(25, 118, 210, 0.08)',
          },
          transition: 'all 0.2s ease',
          transform: message.trim() ? 'scale(1)' : 'scale(0.9)',
        }}
      >
        {isSending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
      </IconButton>
    </Box>
  );
}