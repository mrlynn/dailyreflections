'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Chip,
  Stack,
  Fade,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import CommentForm from './CommentForm';

const MOOD_OPTIONS = [
  { value: 'grateful', label: 'Grateful', icon: <SentimentVerySatisfiedIcon />, color: '#10b981' },
  { value: 'hopeful', label: 'Hopeful', icon: <SentimentSatisfiedAltIcon />, color: '#3b82f6' },
  { value: 'peaceful', label: 'Peaceful', icon: <SelfImprovementIcon />, color: '#8b5cf6' },
  { value: 'reflecting', label: 'Reflecting', icon: <SentimentNeutralIcon />, color: '#f59e0b' },
  { value: 'struggling', label: 'Struggling', icon: <SentimentVeryDissatisfiedIcon />, color: '#ef4444' },
];

// Generate consistent avatar colors based on name
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 60%)`;
};

function EnhancedCommentItem({ comment, onReply, depth = 0 }) {
  const [liked, setLiked] = useState(false);
  const authorName = comment.author || 'Anonymous';
  const avatarColor = stringToColor(authorName);

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          ml: depth * 4,
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: depth === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(249, 250, 251, 0.9)',
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: avatarColor,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {authorName.charAt(0).toUpperCase()}
            </Avatar>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {authorName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Typography>
                {comment.mood && (
                  <Chip
                    size="small"
                    label={MOOD_OPTIONS.find(m => m.value === comment.mood)?.label || comment.mood}
                    icon={MOOD_OPTIONS.find(m => m.value === comment.mood)?.icon}
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      backgroundColor: `${MOOD_OPTIONS.find(m => m.value === comment.mood)?.color}15`,
                      color: MOOD_OPTIONS.find(m => m.value === comment.mood)?.color,
                      '& .MuiChip-icon': {
                        fontSize: '1rem',
                        color: 'inherit',
                      },
                    }}
                  />
                )}
              </Box>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.primary',
                  lineHeight: 1.7,
                  mb: 2,
                  fontSize: '0.95rem',
                }}
              >
                {comment.text}
              </Typography>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => setLiked(!liked)}
                  sx={{
                    color: liked ? 'error.main' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    },
                  }}
                >
                  <FavoriteIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                  {(comment.likes || 0) + (liked ? 1 : 0)}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => onReply(comment._id, authorName)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    },
                  }}
                >
                  <ReplyIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  Reply
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Child Comments */}
        {comment.children && comment.children.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {comment.children.map((child) => (
              <EnhancedCommentItem
                key={child._id}
                comment={child}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </Box>
        )}
      </Box>
    </Fade>
  );
}

export default function EnhancedCommentList({ dateKey }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyAuthor, setReplyAuthor] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [dateKey]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?dateKey=${dateKey}`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      const commentTree = buildCommentTree(data);
      setComments(commentTree);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const roots = [];

    flatComments.forEach((comment) => {
      commentMap[comment._id] = { ...comment, children: [] };
    });

    flatComments.forEach((comment) => {
      const node = commentMap[comment._id];
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const handleReply = (commentId, author) => {
    setReplyTo(commentId);
    setReplyAuthor(author);
  };

  const handleCommentSubmitted = () => {
    setReplyTo(null);
    setSelectedMood(null);
    fetchComments();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyAuthor('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
      {/* Mood Selector */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          How does today&apos;s reflection make you feel?
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1.5 }}>
          {MOOD_OPTIONS.map((mood) => (
            <Chip
              key={mood.value}
              icon={mood.icon}
              label={mood.label}
              onClick={() => setSelectedMood(mood.value === selectedMood ? null : mood.value)}
              sx={{
                px: 2,
                py: 2.5,
                fontSize: '0.9rem',
                fontWeight: 500,
                backgroundColor: selectedMood === mood.value ? `${mood.color}15` : 'transparent',
                border: '2px solid',
                borderColor: selectedMood === mood.value ? mood.color : 'rgba(0, 0, 0, 0.12)',
                color: selectedMood === mood.value ? mood.color : 'text.secondary',
                transition: 'all 0.2s',
                '& .MuiChip-icon': {
                  fontSize: '1.3rem',
                  color: 'inherit',
                },
                '&:hover': {
                  borderColor: mood.color,
                  backgroundColor: `${mood.color}10`,
                  transform: 'translateY(-2px)',
                },
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* New Comment Form */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Share Your Thoughts
        </Typography>
        <CommentForm
          dateKey={dateKey}
          mood={selectedMood}
          onSubmitted={handleCommentSubmitted}
        />
      </Paper>

      {/* Comments */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : comments.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No reflections yet. Be the first to share your thoughts!
          </Typography>
        </Paper>
      ) : (
        <Box>
          {comments.map((comment) => (
            <EnhancedCommentItem
              key={comment._id}
              comment={comment}
              onReply={handleReply}
              depth={0}
            />
          ))}
        </Box>
      )}

      {/* Reply Form */}
      {replyTo && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 3,
            borderRadius: 4,
            backgroundColor: 'rgba(249, 250, 251, 0.9)',
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Replying to {replyAuthor}
          </Typography>
          <CommentForm
            dateKey={dateKey}
            parentId={replyTo}
            onSubmitted={handleCommentSubmitted}
            onCancel={handleCancelReply}
          />
        </Paper>
      )}
    </Box>
  );
}
