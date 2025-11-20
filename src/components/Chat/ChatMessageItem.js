'use client';

import { useState } from 'react';
import { Box, Paper, Typography, Avatar, IconButton, Menu, MenuItem, Tooltip, Fade } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/**
 * ChatMessageItem renders an individual chat message with contextual actions
 *
 * @param {Object} props
 * @param {Object} props.message - The message object to display
 * @param {boolean} props.isCurrentUser - Whether the message is from the current user
 * @param {Function} props.onFlag - Callback when the message is flagged
 */
export default function ChatMessageItem({ message, isCurrentUser, onFlag }) {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [showActions, setShowActions] = useState(false);

  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleFlag = () => {
    if (onFlag) {
      onFlag(message);
    }
    handleCloseMenu();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content)
      .then(() => {
        // Could show a toast notification here
        console.log('Message copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy message:', err);
      });
    handleCloseMenu();
  };

  // Format message timestamp
  const formatTimestamp = () => {
    if (!message.created_at) return '';
    const date = new Date(message.created_at);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle special case for system messages
  if (message.sender_type === 'system') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, px: 2, width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            p: 1,
            px: 2,
            backgroundColor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            maxWidth: '80%',
            borderRadius: 2
          }}
        >
          <Typography
            variant="caption"
            align="center"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {message.content}
          </Typography>
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
        mb: 2,
        width: '100%',
        position: 'relative'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Message header with avatar and timestamp */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          px: 1
        }}
      >
        <Avatar
          sx={{
            width: 24,
            height: 24,
            fontSize: '0.75rem',
            bgcolor: isCurrentUser ? 'primary.main' : 'grey.400',
            ml: isCurrentUser ? 1 : 0,
            mr: isCurrentUser ? 0 : 1
          }}
        >
          {isCurrentUser
            ? (message.sender_type === 'volunteer' ? 'V' : 'U')
            : (message.sender_type === 'volunteer' ? 'V' : 'U')}
        </Avatar>
        <Typography variant="caption" color="text.secondary">
          {message.sender_type === 'volunteer' ? 'Volunteer' : 'User'} • {formatTimestamp()}
        </Typography>
      </Box>

      {/* Message bubble */}
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderTopRightRadius: isCurrentUser ? 0 : 2,
          borderTopLeftRadius: isCurrentUser ? 2 : 0,
          maxWidth: {
            xs: '85%',
            md: '70%'
          },
          backgroundColor: isCurrentUser
            ? 'primary.main'
            : message.moderated ? 'error.light' : 'grey.100',
          color: isCurrentUser
            ? 'primary.contrastText'
            : message.moderated ? 'error.dark' : 'text.primary'
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>

        {message.moderated && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
            This message has been flagged for moderation.
          </Typography>
        )}
      </Paper>

      {/* Message actions (show on hover) */}
      <Fade in={showActions && !isCurrentUser}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: isCurrentUser ? 'auto' : 0,
            left: isCurrentUser ? 0 : 'auto',
            display: 'flex'
          }}
        >
          <Tooltip title="Message options">
            <IconButton
              size="small"
              onClick={handleOpenMenu}
              sx={{ color: 'action.active' }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>

      {/* Message actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleCopyText}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy Text
        </MenuItem>
        {!isCurrentUser && !message.moderated && (
          <MenuItem onClick={handleFlag}>
            <FlagIcon fontSize="small" sx={{ mr: 1 }} />
            Flag Message
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}