'use client';

import { useState, useEffect } from 'react';
import { Box, Tooltip } from '@mui/material';
import Image from 'next/image';

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
      title="Need a companion? Ask the Lantern for guidance."
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
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, rgba(255,237,213,0.95), rgba(216,229,245,0.9))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 26px rgba(26,45,54,0.25)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.25s ease',
          transform: animate ? 'scale(1.08)' : 'scale(1)',
          border: '1px solid rgba(26,45,54,0.12)',
          overflow: 'hidden',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 14px 32px rgba(26,45,54,0.28)'
          }
        }}
      >
        <Image
          src="/images/mascot.png"
          alt="Lantern Companion"
          width={44}
          height={44}
          priority
          style={{ width: '44px', height: 'auto', display: 'block' }}
        />
      </Box>
    </Tooltip>
  );
}