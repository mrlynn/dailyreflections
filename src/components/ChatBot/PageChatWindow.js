'use client';

import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';

/**
 * PageChatWindow Component
 * A version of the chat interface designed for use as a full page component
 * rather than a floating window
 */
export default function PageChatWindow({
  messages = [],
  onSendMessage,
  onClearChat,
  isLoading = false,
  onFeedbackSubmit,
}) {
  // Initial suggested questions
  const initialSuggestions = [
    "What are the 12 steps?",
    "What does today's reflection mean?",
    "How do I find serenity?",
    "Tell me about the Big Book",
    "How can I cope with cravings?",
    "Explain step 3 to me"
  ];

  // Welcome message to display when no messages exist
  const welcomeMessage = {
    role: 'assistant',
    content: 'Welcome to the Recovery Assistant. I can answer questions about Alcoholics Anonymous, the Big Book, and Daily Reflections. How can I help you today?',
    citations: []
  };

  // Display welcome message if no messages
  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Recovery Assistant
        </Typography>
      </Box>

      {/* Messages Area */}
      <MessageList
        messages={displayMessages}
        isLoading={isLoading}
        onFeedbackSubmit={onFeedbackSubmit}
      />

      {/* Clear Chat Button - Only show if there are user messages */}
      {messages.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Button
            startIcon={<DeleteSweepIcon />}
            onClick={onClearChat}
            size="small"
            color="primary"
            variant="text"
            sx={{
              fontSize: '0.875rem',
              textTransform: 'none',
            }}
          >
            Clear conversation
          </Button>
        </Box>
      )}

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <SuggestedQuestions
          suggestions={initialSuggestions}
          onSelect={onSendMessage}
        />
      )}

      {/* Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        placeholder="Ask about recovery, AA, or Daily Reflections..."
      />
    </Box>
  );
}