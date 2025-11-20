'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Message from './Message';

/**
 * MessageList Component
 * Displays a scrollable list of messages in the chat
 */
export default function MessageList({ messages, isLoading, onFeedbackSubmit }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        p: 2,
        overflowY: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      {messages.map((message, index) => (
        <Message
          key={message.messageId || `message-${index}`}
          message={message}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      ))}

      {isLoading && (
        <Message
          message={{
            role: 'assistant',
            content: '',
            messageId: 'assistant-loading',
          }}
          isLoading={true}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      )}

      <div ref={messagesEndRef} />
    </Box>
  );
}