'use client';

import { Box, Typography, Paper, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';

/**
 * Component that renders a single chat message
 * @param {Object} props
 * @param {Object} props.message - The message object
 * @param {boolean} props.isCurrentUser - Whether the message is from the current user
 * @param {Function} [props.onFlag] - Callback for when the message is flagged
 */
export default function ChatMessage({ message, isCurrentUser, onFlag }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const rawTimestamp = message.created_at || message.timestamp;
  const createdAtDate = rawTimestamp ? new Date(rawTimestamp) : null;
  const isValidDate = createdAtDate && !Number.isNaN(createdAtDate.getTime());

  // Format timestamp
  const timestamp = isValidDate
    ? createdAtDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Handle menu open
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle flag click
  const handleFlagClick = () => {
    handleMenuClose();

    if (onFlag) {
      onFlag(message);
    }
  };

  // Determine sender name display
  let senderName = 'Unknown';
  if (isCurrentUser) {
    senderName = 'You';
  } else if (message.sender_type === 'volunteer') {
    senderName = 'Volunteer'; // This would be replaced with actual first name + last initial
  } else if (message.sender_type === 'system') {
    senderName = 'System';
  }

  // Determine message status icon
  const getStatusIcon = () => {
    if (!isCurrentUser) return null;

    switch (message.status) {
      case 'sent':
        return <DoneIcon fontSize="small" sx={{ color: 'text.disabled', ml: 0.5 }} />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" sx={{ color: 'text.disabled', ml: 0.5 }} />;
      case 'read':
        return <DoneAllIcon fontSize="small" sx={{ color: 'primary.main', ml: 0.5 }} />;
      default:
        return null;
    }
  };

  // System messages have a different styling
  if (message.sender_type === 'system') {
    // Check if it's a welcome message
    const isWelcomeMessage = message.metadata?.welcome_message === true;

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 2,
          mt: isWelcomeMessage ? 2 : 1, // More spacing for welcome messages
          px: 2,
          width: '100%'
        }}
      >
        <Paper
          elevation={isWelcomeMessage ? 1 : 0}
          sx={{
            color: isWelcomeMessage ? 'primary.dark' : 'text.secondary',
            backgroundColor: isWelcomeMessage ? 'primary.lightest' : 'action.hover',
            borderRadius: isWelcomeMessage ? 2 : 5,
            border: isWelcomeMessage ? '1px solid' : 'none',
            borderColor: 'primary.lighter',
            py: 1.5,
            px: 2.5,
            maxWidth: '90%',
            width: isWelcomeMessage ? 'auto' : 'auto',
            textAlign: 'center',
            position: 'relative',
            '&::before': isWelcomeMessage ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '5px',
              height: '100%',
              backgroundColor: 'primary.main',
              borderTopLeftRadius: 2,
              borderBottomLeftRadius: 2,
            } : {}
          }}
        >
          <Typography
            variant={isWelcomeMessage ? 'subtitle2' : 'body2'}
            sx={{
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            {message.content}
          </Typography>
          {isWelcomeMessage && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', color: 'text.secondary' }}>
              {timestamp}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1,
        px: 2,
        maxWidth: '100%'
      }}
    >
      {/* Sender name */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
          ml: isCurrentUser ? 0 : 1.5,
          mr: isCurrentUser ? 1.5 : 0,
          width: '100%',
          color: 'text.secondary'
        }}
      >
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {senderName}
          </Box>
          {timestamp && (
            <>
              <Box component="span" sx={{ opacity: 0.6 }}>
                •
              </Box>
              <Box component="span">{timestamp}</Box>
            </>
          )}
        </Typography>
      </Box>

      {/* Message container */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* More options menu for non-current user messages */}
        {!isCurrentUser && !message.moderated && (
          <>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ visibility: anchorEl ? 'visible' : 'hidden', '&:hover': { visibility: 'visible' } }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleFlagClick}>
                <FlagIcon fontSize="small" sx={{ mr: 1 }} />
                Report Message
              </MenuItem>
            </Menu>
          </>
        )}

        {/* Message bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            maxWidth: {
              xs: '80%',
              md: '65%'
            },
            backgroundColor: isCurrentUser
              ? 'primary.main'
              : message.moderated ? 'error.light' : 'grey.50',
            color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
            position: 'relative',
            wordBreak: 'break-word',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            minWidth: '60px', // Ensures small messages have reasonable size
            border: message.sender_type === 'system'
              ? '1px dashed rgba(0,0,0,0.12)'
              : 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 3px 5px rgba(0,0,0,0.12)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {/* Message content with better typography */}
          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.5,
              fontWeight: message.sender_type === 'system' ? 400 : 'inherit',
              fontStyle: message.sender_type === 'system' ? 'italic' : 'normal',
            }}
          >
            {message.moderated ? 'This message has been flagged for review.' : message.content}
          </Typography>

          {/* Message status */}
          {isCurrentUser && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: 0.5,
                opacity: 0.8
              }}
            >
              {getStatusIcon()}
            </Box>
          )}
        </Paper>

        {/* Empty space for alignment on right side */}
        {isCurrentUser && (
          <Box sx={{ width: 28 }} />
        )}
      </Box>
    </Box>
  );
}