'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Alert,
  Paper,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';

export default function BigBookCommentForm({ pageNumber, parentId = null, quote = null, onSubmitted, onCancel }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Use authenticated user info (required for posting)
  const isAuthenticated = !!session?.user;
  const displayName = session?.user?.displayName || session?.user?.name || session?.user?.email || '';

  // Loading state
  if (status === 'loading') {
    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Loading...
        </Box>
      </Paper>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <LockIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h6" align="center">
            Sign in to join the conversation
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            You must be signed in to post comments and engage with the community.
          </Typography>
          <Box display="flex" gap={2} mt={1}>
            <Button
              variant="contained"
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/register')}
            >
              Create Account
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            You can view comments without signing in
          </Typography>
        </Box>
      </Paper>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!body.trim()) {
      setError('Please enter a comment.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        pageNumber,
        body: body.trim(),
      };

      if (parentId) {
        payload.parentId = parentId;
      }

      if (quote) {
        payload.quote = quote;
      }

      const response = await fetch('/api/bigbook/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (err) {
          // Handle non-JSON responses
          throw new Error('Failed to post comment. Please try again.');
        }

        // Handle specific error codes with better messaging
        if (data.code === 'UNAUTHORIZED') {
          // Session expired - redirect to login
          router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
          throw new Error('Your session has expired. Please sign in again.');
        } else if (data.code === 'RATE_LIMIT_EXCEEDED') {
          const resetTime = data.resetAt
            ? new Date(data.resetAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'soon';
          throw new Error(
            `You've posted too many comments recently. Please wait until ${resetTime} to post again. We limit comments to protect the community.`
          );
        } else if (data.code === 'CONTENT_NOT_APPROVED' || data.code === 'CONTENT_FLAGGED') {
          throw new Error(
            data.error || 'Your comment doesn\'t meet our community guidelines. Please ensure your comment is supportive, respectful, and appropriate for a recovery community.'
          );
        } else {
          throw new Error(data.error || 'Failed to post comment. Please try again.');
        }
      }

      // Success - reset form
      setBody('');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyle = {
    backgroundColor: parentId ? 'rgba(91, 143, 168, 0.05)' : 'background.paper', // Soft primary blue tint for nested forms
    p: 2,
    border: parentId ? 1 : 'none',
    borderColor: parentId ? 'primary.light' : 'transparent',
    borderRadius: 1,
  };

  return (
    <Paper elevation={parentId ? 0 : 1} sx={containerStyle}>
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Show user info */}
          {!parentId && (
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Posting as: <strong>{displayName}</strong>
            </Box>
          )}

          {/* Quote display if passed */}
          {quote && (
            <Paper
              elevation={0}
              sx={{
                p: 1,
                backgroundColor: 'rgba(91, 143, 168, 0.05)',
                borderLeft: '2px solid',
                borderColor: 'primary.light',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                "{quote}"
              </Typography>
            </Paper>
          )}

          {/* Comment Body */}
          <TextField
            label="Add a comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            disabled={submitting}
            multiline
            rows={3}
            fullWidth
            placeholder="Share your thoughts on this page..."
          />

          {/* Submit & Cancel */}
          <Box display="flex" gap={1} justifyContent="flex-end">
            {parentId && onCancel && (
              <Button
                onClick={onCancel}
                disabled={submitting}
                size="small"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !body.trim()}
              startIcon={<SendIcon />}
              size="small"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
}