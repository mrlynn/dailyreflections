'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, IconButton, Paper, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { useChatChannel } from '@/hooks/useChatChannel';

/**
 * Debounce function for handling typing indicators
 */
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

/**
 * ChatInput component for sending messages
 *
 * @param {Object} props
 * @param {string} props.sessionId - The chat session ID
 * @param {string} props.userId - The current user's ID
 * @param {string} props.userType - The user type ('user' or 'volunteer')
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {Function} props.onMessageSent - Callback when a message is sent
 * @param {Function} props.onTyping - Callback when the user is typing
 */
export default function ChatInput({
  sessionId,
  userId,
  userType = 'user',
  disabled = false,
  onMessageSent,
  onTyping
}) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Get chat channel from our custom hook
  const { sendMessage, sendTypingIndicator } = useChatChannel(sessionId);

  // Create a debounced function for typing indicators
  const debouncedTypingIndicator = useRef(
    debounce((isTyping) => {
      sendTypingIndicator(isTyping);
      if (onTyping) onTyping(isTyping);
    }, 300)
  ).current;

  // Reset error when message changes
  useEffect(() => {
    if (error) setError(null);
  }, [message]);

  // Handle message change and typing indicators
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    // Send typing indicator when user starts typing
    const isTyping = e.target.value.length > 0;
    debouncedTypingIndicator(isTyping);
  };

  // Send the message
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    try {
      setIsSending(true);

      // First, clear the input to prevent duplicate submissions
      setMessage('');

      // Prepare message data
      const messageData = {
        content: trimmedMessage,
        sender_id: userId,
        sender_type: userType,
        session_id: sessionId,
        created_at: new Date().toISOString(),
        status: 'sending',
        _id: `temp-${Date.now()}`  // Temporary ID for optimistic UI
      };

      // Send via Ably channel
      await sendMessage(messageData);

      // Also save to database via API
      const response = await fetch('/api/volunteers/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          content: trimmedMessage,
          metadata: {
            client_timestamp: new Date(),
            client_message_id: messageData._id
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // If callback provided, call it with the saved message from API
      if (onMessageSent) {
        onMessageSent(data.message || messageData);
      }

      // Clear typing indicator
      debouncedTypingIndicator(false);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);

      // Focus the input field again
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'flex-end',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      {/* Future attachment button */}
      <Tooltip title="Attachments not yet supported">
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={true}  // Disabled until attachments are supported
            sx={{ mb: 0.5, mr: 0.5 }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Message input */}
      <TextField
        inputRef={inputRef}
        placeholder="Type your message..."
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={handleMessageChange}
        disabled={disabled || isSending}
        error={!!error}
        helperText={error}
        variant="outlined"
        size="small"
        sx={{
          mr: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            paddingRight: 0.5
          }
        }}
        // Emoji button inside the TextField (right side)
        InputProps={{
          endAdornment: (
            <Tooltip title="Emojis not yet supported">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={true}  // Disabled until emoji picker is implemented
                >
                  <EmojiEmotionsIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ),
        }}
      />

      {/* Send button */}
      <Button
        variant="contained"
        color="primary"
        endIcon={isSending ? <CircularProgress size={16} /> : <SendIcon />}
        disabled={!message.trim() || disabled || isSending}
        type="submit"
        sx={{ minWidth: 80, height: 40 }}
      >
        Send
      </Button>
    </Paper>
  );
}