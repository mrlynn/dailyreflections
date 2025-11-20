'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Rating,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FlagIcon from '@mui/icons-material/Flag';
import WarningIcon from '@mui/icons-material/Warning';
import { useRouter } from 'next/navigation';

/**
 * Component to collect user feedback after a chat session
 * @param {Object} props
 * @param {string} props.sessionId - Chat session ID
 * @param {string} [props.volunteerId] - Volunteer ID
 * @param {Function} [props.onFeedbackSubmitted] - Callback for when feedback is submitted
 */
export default function FeedbackForm({ sessionId, volunteerId, onFeedbackSubmitted }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState('positive');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Handle dialog open
  const handleOpen = () => {
    setOpen(true);
  };

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);

    // If feedback was submitted successfully, redirect to home
    if (submitted) {
      router.push('/');
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/volunteers/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          volunteer_id: volunteerId,
          rating,
          comments,
          metadata: {
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                   navigator.userAgent.includes('Firefox') ? 'Firefox' :
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
            device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      // Success
      setSubmitted(true);

      // Call onFeedbackSubmitted callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(data.feedback);
      }

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="center" width="100%" mt={2} mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
        >
          End Chat & Leave Feedback
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={submitted ? handleClose : null}
        aria-labelledby="feedback-dialog-title"
        fullWidth
        maxWidth="sm"
      >
        {!submitted ? (
          // Feedback form
          <>
            <DialogTitle id="feedback-dialog-title">
              How was your conversation?
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Your feedback helps us improve our volunteer support and maintain a helpful community.
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                How was this interaction?
              </Typography>

              <RadioGroup
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                sx={{ ml: 1 }}
              >
                <FormControlLabel
                  value="positive"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center">
                      <ThumbUpIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography>Helpful and supportive</Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  value="neutral"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center">
                      <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography>Somewhat helpful</Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  value="flagged"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center">
                      <FlagIcon sx={{ mr: 1, color: 'error.main' }} />
                      <Typography>Inappropriate or unhelpful</Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              <TextField
                label="Additional comments (optional)"
                multiline
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="Please share any specific feedback about your experience..."
              />

              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                color="primary"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogActions>
          </>
        ) : (
          // Thank you message
          <>
            <DialogTitle id="feedback-submitted-title">
              Thank You For Your Feedback
            </DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" alignItems="center" my={2}>
                <Box
                  component="img"
                  src="/images/thankyou.svg" // This is a placeholder, you'll need to add this image
                  alt="Thank you"
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Your feedback has been submitted
                </Typography>
                <Typography variant="body2" align="center">
                  Your input helps us improve our volunteer support and ensure everyone has a positive experience.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                color="primary"
                variant="contained"
                autoFocus
              >
                Return to Home Page
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}