'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Collapse,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';

export default function CommentItem({ comment, onReply, depth = 0 }) {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const hasChildren = comment.children && comment.children.length > 0;
  const maxDepth = 5; // Prevent infinite nesting

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReplyClick = () => {
    setShowReplyForm(!showReplyForm);
    if (!showReplyForm) {
      onReply(comment._id, comment.author);
    }
  };

  const containerStyle = {
    ml: depth * 3,
    mb: 1,
    mt: depth > 0 ? 1 : 0,
  };

  const avatarStyle = {
    bgcolor: 'primary.main',
    width: 32,
    height: 32,
    fontSize: '0.875rem',
  };

  return (
    <Box sx={containerStyle}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: depth === 0 ? 'background.paper' : 'rgba(91, 143, 168, 0.03)', // Very subtle blue tint for nested comments
          borderLeft: depth > 0 ? `2px solid` : 'none',
          borderColor: depth > 0 ? 'primary.light' : 'transparent',
          borderRadius: 1,
        }}
      >
        {/* Author & Date */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar sx={avatarStyle}>
            {comment.author.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {comment.author}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(comment.createdAt)}
            </Typography>
          </Box>
        </Box>

        {/* Comment Body */}
        <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
          {comment.body}
        </Typography>

        {/* Reply Button */}
        <Button
          size="small"
          startIcon={<ReplyIcon />}
          onClick={handleReplyClick}
          disabled={depth >= maxDepth}
        >
          Reply
        </Button>
        {depth >= maxDepth && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Maximum nesting depth reached
          </Typography>
        )}

        {/* Children/Comments */}
        {hasChildren && (
          <Box mt={2}>
            <Button
              size="small"
              onClick={() => setShowReplies(!showReplies)}
              sx={{ textTransform: 'none' }}
            >
              {showReplies ? 'Hide' : 'Show'} {comment.children.length} repl
              {comment.children.length === 1 ? 'y' : 'ies'}
            </Button>
            <Collapse in={showReplies}>
              {comment.children.map((child) => (
                <CommentItem
                  key={child._id}
                  comment={child}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </Collapse>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

