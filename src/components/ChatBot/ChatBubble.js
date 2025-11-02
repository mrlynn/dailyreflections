'use client';

import { useState, useEffect } from 'react';
import { Box, Tooltip, Fade } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

/**
 * ChatBubble Component
 * A floating chat bubble that appears in the bottom-right corner
 * of the screen. When clicked, it opens the chat interface.
 */
export default function ChatBubble({ onClick }) {
  const [animate, setAnimate] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Add subtle animation effect every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }, 10000);

    // Show tooltip initially and then hide
    setShowTooltip(true);
    const tooltipTimer = setTimeout(() => setShowTooltip(false), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(tooltipTimer);
    };
  }, []);

  return (
    <Tooltip
      title="Ask questions about recovery and Daily Reflections"
      placement="left"
      arrow
      open={showTooltip}
      onClose={() => setShowTooltip(false)}
      onOpen={() => setShowTooltip(true)}
    >
      <Box
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: animate ? 'scale(1.1)' : 'scale(1)',
          '&:hover': {
            backgroundColor: 'primary.dark',
            transform: 'scale(1.05)',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <ChatIcon sx={{ color: 'white', fontSize: '28px' }} />
      </Box>
    </Tooltip>
  );
}