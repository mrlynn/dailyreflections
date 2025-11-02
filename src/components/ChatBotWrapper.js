'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the chatbot component to reduce initial bundle size
const FloatingChatbot = dynamic(() => import('./ChatBot'), {
  ssr: false,
  loading: () => null
});

/**
 * ChatBotWrapper Component
 * Client-side wrapper for the chatbot that handles initial loading delay
 */
export default function ChatBotWrapper() {
  const [mounted, setMounted] = useState(false);

  // Only show chatbot on client-side to avoid hydration errors and reduce initial load time
  useEffect(() => {
    // Delay mount slightly to prioritize main content loading
    const timer = setTimeout(() => {
      setMounted(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return <FloatingChatbot />;
}