'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import dynamic from 'next/dynamic';

// Import PageChatWindow component
const PageChatWindow = dynamic(() => import('@/components/ChatBot/PageChatWindow'), {
  ssr: false,
  loading: () => <div>Loading assistant...</div>
});

/**
 * Assistant Page
 * A dedicated page for the RAG chatbot assistant
 */
export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') {
      return `session_${Date.now()}`;
    }
    try {
      const persisted = localStorage.getItem('chatSessionId');
      if (persisted) return persisted;
      const hasCrypto = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
      const newSession = `session_${hasCrypto ? crypto.randomUUID() : Date.now()}`;
      localStorage.setItem('chatSessionId', newSession);
      return newSession;
    } catch (error) {
      console.error('Failed to read or create chat session id:', error);
      return `session_${Date.now()}`;
    }
  });

  // Define handleSendMessage function
  const handleSendMessage = async (message) => {
    // Add user message to chat
    const userMessage = {
      messageId: `user_${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    const updatedMessages = [
      ...messages,
      userMessage
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          // Send last few messages for context
          chatHistory: updatedMessages.slice(-5),
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add bot response to chat
      setMessages([
        ...updatedMessages,
        {
          messageId: data.messageId || `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          citations: data.citations,
          retrievalContext: data.retrievalContext,
          metadata: data.metadata,
          createdAt: new Date().toISOString(),
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages([
        ...updatedMessages,
        {
          messageId: `assistant_error_${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an error while processing your request. Please try again or try asking a different question.',
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (message, payload) => {
    if (!message?.messageId) {
      throw new Error('Missing message identifier.');
    }

    const assistantIndex = messages.findIndex(msg => msg.messageId === message.messageId);
    const precedingUserMessage = assistantIndex > 0 ? messages[assistantIndex - 1] : null;

    const feedbackBody = {
      ...payload,
      sessionId,
      timestamp: new Date().toISOString(),
      response: {
        messageId: message.messageId,
        content: message.content,
        citations: message.citations,
        retrievalContext: message.retrievalContext,
        metadata: message.metadata,
        createdAt: message.createdAt,
      },
      userMessage: precedingUserMessage?.role === 'user'
        ? {
            messageId: precedingUserMessage.messageId,
            content: precedingUserMessage.content,
            createdAt: precedingUserMessage.createdAt,
          }
        : null,
      chatWindow: 'assistant-page',
    };

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackBody),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error || 'Failed to submit feedback');
    }

    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.messageId !== message.messageId) return msg;
        return {
          ...msg,
          feedbackSubmitted: true,
          feedback: {
            type: payload.feedbackType,
            tags: payload.tags,
            comment: payload.comment,
            submittedAt: new Date().toISOString(),
          },
        };
      })
    );
  };

  // Load chat history from localStorage and check for pre-populated question on initial render
  useEffect(() => {
    try {
      // Load saved messages if they exist
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }

      // Check if there's a pre-populated question from reflection page
      const prepopulatedQuestion = localStorage.getItem('prepopulatedQuestion');
      if (prepopulatedQuestion) {
        // We need to defer this until after component is mounted to avoid state issues
        setTimeout(() => {
          handleSendMessage(prepopulatedQuestion);
          // Clear it from localStorage to prevent it from being reused
          localStorage.removeItem('prepopulatedQuestion');
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load chat history or process pre-populated question:', error);
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        // Only save up to 20 most recent messages to keep storage size reasonable
        const recentMessages = messages.slice(-20);
        localStorage.setItem('chatHistory', JSON.stringify(recentMessages));
      }
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem('chatHistory');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Recovery Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Ask questions about AA, recovery principles, the Big Book, Daily Reflections, or other recovery topics. The assistant uses verified AA literature to provide accurate information and support.
        </Typography>
      </Box>

      <Paper
        elevation={1}
        sx={{
          width: '100%',
          height: 'calc(100vh - 230px)',
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 1,
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PageChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={clearChat}
            isLoading={isLoading}
            onFeedbackSubmit={handleFeedbackSubmit}
          />
        </Box>
      </Paper>
    </Container>
  );
}