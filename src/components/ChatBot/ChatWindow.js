'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';

/**
 * ChatWindow Component
 * The expanded chat interface that appears when the chat bubble is clicked
 */
export default function ChatWindow({
  messages = [],
  onSendMessage,
  onClose,
  onMinimize,
  onClearChat,
  isLoading = false,
  onFeedbackSubmit,
}) {
  // State to track expanded/collapsed state
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle expanded state
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use F11 or Ctrl+E to toggle expanded state
      if (e.key === 'F11' || (e.ctrlKey && e.key === 'e')) {
        e.preventDefault();
        toggleExpanded();
      }

      // Use Escape to collapse when expanded
      if (e.key === 'Escape' && isExpanded) {
        e.preventDefault();
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Initial suggested questions
  const initialSuggestions = [
    "What are the 12 steps?",
    "What does today's reflection mean?",
    "How do I find serenity?",
    "Tell me about the Big Book"
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
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: isExpanded ? '0px' : '20px',
        right: isExpanded ? '0px' : '20px',
        width: isExpanded
          ? { xs: '100%', md: '80%', lg: '70%' }
          : { xs: 'calc(100% - 40px)', sm: '400px' },
        maxWidth: isExpanded ? '100%' : '450px',
        height: isExpanded ? '100vh' : '600px',
        maxHeight: isExpanded ? '100vh' : 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: isExpanded ? '0px' : '12px',
        boxShadow: isExpanded
          ? 'none'
          : '0 10px 30px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: isExpanded ? { xs: 2, md: 3 } : 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          borderTopLeftRadius: isExpanded ? '0px' : '12px',
          borderTopRightRadius: isExpanded ? '0px' : '12px',
          boxShadow: isExpanded ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        <Typography
          variant={isExpanded ? "h5" : "h6"}
          fontWeight={600}
          color="white"
          sx={{
            fontSize: isExpanded ? { xs: '1.25rem', md: '1.5rem' } : '1.25rem',
            transition: 'font-size 0.3s ease-in-out'
          }}
        >
          Recovery Assistant
        </Typography>
        <Box>
          <Tooltip
            title={`${isExpanded ? "Collapse" : "Expand"} (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+E or F11)`}
            placement="bottom"
            arrow
          >
            <IconButton
              size="small"
              onClick={toggleExpanded}
              sx={{ 
                color: 'white', 
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
              aria-label={isExpanded ? "Collapse chatbot" : "Expand chatbot"}
            >
              {isExpanded ? (
                <CloseFullscreenIcon fontSize="small" sx={{ color: 'white' }} />
              ) : (
                <OpenInFullIcon fontSize="small" sx={{ color: 'white' }} />
              )}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={onMinimize}
            sx={{ 
              color: 'white', 
              mr: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
            aria-label="Minimize chatbot"
          >
            <MinimizeIcon fontSize="small" sx={{ color: 'white' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
            aria-label="Close chatbot"
          >
            <CloseIcon fontSize="small" sx={{ color: 'white' }} />
          </IconButton>
        </Box>
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
    </Paper>
  );
}