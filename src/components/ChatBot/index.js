'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import ChatBubble from './ChatBubble';
import ChatWindow from './ChatWindow';

/**
 * FloatingChatbot Component
 * Main chatbot component that can be toggled between collapsed and expanded states
 */
export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
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

  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
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

  const toggleChat = () => setIsOpen(!isOpen);

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
      chatWindow: 'floating',
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

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem('chatHistory');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  return (
    <>
      {!isOpen ? (
        <ChatBubble onClick={toggleChat} />
      ) : (
        <ChatWindow
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={() => {
            setIsOpen(false);
          }}
          onMinimize={() => setIsOpen(false)}
          onClearChat={clearChat}
          isLoading={isLoading}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      )}
    </>
  );
}