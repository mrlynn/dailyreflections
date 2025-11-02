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
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message }
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
          chatHistory: updatedMessages.slice(-5)
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
          role: 'assistant',
          content: data.response,
          citations: data.citations
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error while processing your request. Please try again or try asking a different question.',
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
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
          isLoading={isLoading}
        />
      )}
    </>
  );
}