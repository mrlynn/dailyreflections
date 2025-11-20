"use client";

import { useState, useEffect, forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Slide,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ShareIcon from '@mui/icons-material/Share';
import RefreshIcon from '@mui/icons-material/Refresh';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Link from 'next/link';
import { formatDateKey } from '@/utils/dateUtils';

// Transition effect for the modal
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Daily Thought Modal Component
 * Displays a pop-up with a recovery thought of the day
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls visibility of the modal
 * @param {function} props.onClose - Callback function when modal is closed
 * @param {boolean} props.setCookieOnClose - Whether to set a cookie when closed
 */
export default function DailyThoughtModal({ open, onClose, setCookieOnClose = true }) {
  const [thought, setThought] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [fetchingRandom, setFetchingRandom] = useState(false);

  // Fetch today's thought when the component mounts
  useEffect(() => {
    if (open) {
      fetchTodayThought();
      checkIfBookmarked();
    }
  }, [open]);

  // Check if current thought is bookmarked
  const checkIfBookmarked = () => {
    try {
      const bookmarksJson = localStorage.getItem('dailyThoughtBookmarks') || '[]';
      const bookmarks = JSON.parse(bookmarksJson);
      if (thought && bookmarks.some(bookmark =>
        bookmark._id === thought._id ||
        (bookmark.month === thought.month && bookmark.day === thought.day)
      )) {
        setIsBookmarked(true);
      } else {
        setIsBookmarked(false);
      }
    } catch (err) {
      console.error('Error checking bookmarks:', err);
    }
  };

  // Function to fetch today's thought from the API
  const fetchTodayThought = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/thoughts/today');

      if (!response.ok) {
        throw new Error(`Failed to fetch thought: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setThought(result.data);

        // Check if this thought is bookmarked
        setTimeout(() => checkIfBookmarked(), 0);
      } else {
        throw new Error(result.error || 'Failed to fetch thought');
      }
    } catch (err) {
      console.error('Error fetching daily thought:', err);
      setError('Unable to load today\'s recovery thought');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a random thought
  const fetchRandomThought = async () => {
    try {
      setFetchingRandom(true);
      setError(null);

      const response = await fetch('/api/thoughts/random');

      if (!response.ok) {
        throw new Error(`Failed to fetch random thought: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setThought(result.data);

        // Check if this thought is bookmarked
        setTimeout(() => checkIfBookmarked(), 0);
      } else {
        throw new Error(result.error || 'Failed to fetch random thought');
      }
    } catch (err) {
      console.error('Error fetching random thought:', err);
      setError('Unable to load a random recovery thought');
    } finally {
      setFetchingRandom(false);
    }
  };

  // Function to toggle bookmark status
  const toggleBookmark = () => {
    if (!thought) return;

    try {
      const bookmarksJson = localStorage.getItem('dailyThoughtBookmarks') || '[]';
      let bookmarks = JSON.parse(bookmarksJson);

      if (isBookmarked) {
        // Remove bookmark
        bookmarks = bookmarks.filter(bookmark =>
          !(bookmark._id === thought._id ||
            (bookmark.month === thought.month && bookmark.day === thought.day))
        );
        setSnackbarMessage('Thought removed from bookmarks');
      } else {
        // Add bookmark
        bookmarks.push({
          _id: thought._id,
          title: thought.title,
          thought: thought.thought,
          month: thought.month,
          day: thought.day,
          dateKey: thought.dateKey,
          bookmarkedAt: new Date().toISOString()
        });
        setSnackbarMessage('Thought saved to bookmarks');
      }

      localStorage.setItem('dailyThoughtBookmarks', JSON.stringify(bookmarks));
      setIsBookmarked(!isBookmarked);
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setSnackbarMessage('Error updating bookmarks');
      setSnackbarOpen(true);
    }
  };

  // Function to share the thought
  const shareThought = async () => {
    if (!thought) return;

    const shareText = `${thought.title}\n\n${thought.thought}\n\n${thought.challenge || ''}\n\nShared from AA Companion`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Daily Recovery Thought',
          text: shareText
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        setSnackbarMessage('Copied to clipboard!');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error sharing thought:', err);

      // Try clipboard as fallback
      try {
        await navigator.clipboard.writeText(shareText);
        setSnackbarMessage('Copied to clipboard!');
        setSnackbarOpen(true);
      } catch (clipErr) {
        setSnackbarMessage('Unable to share');
        setSnackbarOpen(true);
      }
    }
  };

  // Function to handle modal close and set cookie
  const handleClose = () => {
    if (setCookieOnClose) {
      // Set a cookie that expires at the end of the day
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      document.cookie = `dailyThoughtSeen=${new Date().toISOString()}; expires=${midnight.toUTCString()}; path=/`;
    }

    if (onClose) {
      onClose();
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="daily-thought-description"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,1))'
        }
      }}
    >
      <DialogTitle sx={{ pr: 12, pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LightbulbOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              {thought?.title || "Today's Recovery Thought"}
            </Typography>

            {thought && thought.month && thought.day && (
              <Chip
                size="small"
                icon={<CalendarTodayIcon fontSize="small" />}
                label={formatDateKey(`${String(thought.month).padStart(2, '0')}-${String(thought.day).padStart(2, '0')}`)}
                variant="outlined"
                sx={{ mt: 0.5, borderRadius: 1 }}
              />
            )}
          </Box>
        </Box>

        {/* Action buttons in the top-right */}
        <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex' }}>
          <Tooltip title="Bookmark">
            <IconButton
              onClick={toggleBookmark}
              color={isBookmarked ? "primary" : "default"}
            >
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{ color: 'grey.500' }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1, px: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', fontWeight: 500 }}>
              {thought?.thought || "Recovery is a journey of daily progress, not perfection."}
            </Typography>

            {thought?.challenge && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="primary.dark" fontWeight="bold" gutterBottom>
                    Today's Challenge:
                  </Typography>
                  <Typography variant="body2">
                    {thought.challenge}
                  </Typography>
                </Box>
              </>
            )}

            {thought?.relatedReflectionDateKey && (
              <Box sx={{ mt: 2, pt: 1 }}>
                <Link
                  href={`/${thought.relatedReflectionDateKey}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Read related daily reflection →
                  </Typography>
                </Link>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="Share thought">
            <IconButton onClick={shareThought} size="small" sx={{ mr: 1 }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Get random thought">
            <IconButton
              onClick={fetchRandomThought}
              size="small"
              disabled={fetchingRandom || loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Button
          variant="contained"
          onClick={handleClose}
          sx={{ px: 3, borderRadius: 6 }}
        >
          Close
        </Button>
      </DialogActions>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}