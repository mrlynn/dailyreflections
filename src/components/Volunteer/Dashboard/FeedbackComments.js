'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Avatar,
  Tooltip
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoIcon from '@mui/icons-material/Info';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';

/**
 * FeedbackComments component for the volunteer dashboard
 * Shows detailed user feedback comments from chat sessions
 */
export default function FeedbackComments() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [displayCount, setDisplayCount] = useState(3); // Show 3 comments initially

  useEffect(() => {
    fetchFeedbackComments();
  }, []);

  // Fetch feedback comments
  const fetchFeedbackComments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/volunteers/feedback/comments');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching feedback comments:', err);
      setError(err.message || 'Failed to fetch feedback comments');
    } finally {
      setIsLoading(false);
    }
  };

  // Show more comments
  const handleShowMore = () => {
    setDisplayCount(prev => prev + 3);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // View session details
  const handleViewSession = (sessionId) => {
    router.push(`/volunteer/history/${sessionId}`);
  };

  // Get icon for rating
  const getRatingIcon = (rating) => {
    switch(rating) {
      case 'positive':
        return <ThumbUpIcon fontSize="small" color="success" />;
      case 'neutral':
        return <InfoIcon fontSize="small" color="warning" />;
      case 'flagged':
        return <ThumbDownIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="action" />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FormatQuoteIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">User Feedback Comments</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {comments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No feedback comments available yet. Comments will appear here when users leave detailed feedback.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {comments.slice(0, displayCount).map((comment) => (
              <Grid item xs={12} key={comment._id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderLeft: 4,
                    borderColor:
                      comment.rating === 'positive' ? 'success.main' :
                      comment.rating === 'flagged' ? 'error.main' :
                      'warning.main'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.main' }}>
                        {getRatingIcon(comment.rating)}
                      </Avatar>
                      <Chip
                        size="small"
                        label={comment.rating.charAt(0).toUpperCase() + comment.rating.slice(1)}
                        color={
                          comment.rating === 'positive' ? 'success' :
                          comment.rating === 'flagged' ? 'error' :
                          'warning'
                        }
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider', ml: 1, mt: 2 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                      "{comment.comments}"
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Tooltip title="View session details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewSession(comment.session_id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {comments.length > displayCount && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleShowMore}
            >
              Show More Comments
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}