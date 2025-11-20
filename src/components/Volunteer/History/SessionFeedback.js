'use client';

import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Chip,
  Rating,
  Alert
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoIcon from '@mui/icons-material/Info';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

/**
 * SessionFeedback component for displaying user feedback for a specific chat session
 * @param {Object} props
 * @param {Object} props.feedback - Feedback data object
 */
export default function SessionFeedback({ feedback }) {
  if (!feedback) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No feedback was provided for this session.
      </Alert>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get rating display data
  const getRatingData = (rating) => {
    switch(rating) {
      case 'positive':
        return {
          icon: <ThumbUpIcon fontSize="small" sx={{ color: 'success.main' }} />,
          color: 'success',
          label: 'Positive',
          value: 5
        };
      case 'neutral':
        return {
          icon: <InfoIcon fontSize="small" sx={{ color: 'warning.main' }} />,
          color: 'warning',
          label: 'Neutral',
          value: 3
        };
      case 'flagged':
        return {
          icon: <ThumbDownIcon fontSize="small" sx={{ color: 'error.main' }} />,
          color: 'error',
          label: 'Flagged',
          value: 1
        };
      default:
        return {
          icon: <InfoIcon fontSize="small" />,
          color: 'default',
          label: 'Unknown',
          value: 0
        };
    }
  };

  const ratingData = getRatingData(feedback.rating);

  return (
    <Card elevation={1} sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {ratingData.icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            User Feedback
          </Typography>
          <Chip
            label={ratingData.label}
            color={ratingData.color}
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="subtitle2">Rating</Typography>
            <Rating
              value={ratingData.value}
              max={5}
              readOnly
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2">Submitted</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(feedback.created_at)}
            </Typography>
          </Box>
        </Box>

        {feedback.comments && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderLeft: 4,
              borderColor: `${ratingData.color}.main`,
              mt: 2
            }}
          >
            <Box sx={{ display: 'flex', mb: 1 }}>
              <FormatQuoteIcon sx={{ transform: 'rotate(180deg)', color: 'text.secondary', mr: 1 }} />
              <Typography variant="subtitle2">User Comments</Typography>
            </Box>
            <Typography variant="body1" sx={{ mt: 1, fontStyle: 'italic' }}>
              "{feedback.comments}"
            </Typography>
          </Paper>
        )}

        {/* Additional metadata if available */}
        {feedback.metadata && Object.keys(feedback.metadata).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Additional Details</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {feedback.metadata.browser && (
                <Chip
                  size="small"
                  label={`Browser: ${feedback.metadata.browser}`}
                  variant="outlined"
                />
              )}
              {feedback.metadata.device && (
                <Chip
                  size="small"
                  label={`Device: ${feedback.metadata.device}`}
                  variant="outlined"
                />
              )}
              {feedback.metadata.session_length && (
                <Chip
                  size="small"
                  label={`Session: ${Math.round(feedback.metadata.session_length / 60)} min`}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}