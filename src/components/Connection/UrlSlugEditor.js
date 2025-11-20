'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkIcon from '@mui/icons-material/Link';
import { sanitizeSlug, isValidSlugFormat, isReservedWord } from '@/lib/connection-profiles/constants';

const BASE_URL = 'aacompanion.com/connect/';

/**
 * URL Slug Editor component for customizing connection profile URLs
 */
export default function UrlSlugEditor({
  currentSlug,
  onUpdate,
  isLoading = false,
  disabled = false,
}) {
  const [slug, setSlug] = useState(currentSlug || '');
  const [editedSlug, setEditedSlug] = useState(currentSlug || '');
  const [error, setError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  // When currentSlug changes from parent, update our state
  useEffect(() => {
    setSlug(currentSlug || '');
    setEditedSlug(currentSlug || '');
    setHasChanged(false);
  }, [currentSlug]);

  // Validate slug as the user types
  useEffect(() => {
    const validate = async () => {
      const sanitized = sanitizeSlug(editedSlug);

      // Don't check if nothing has changed
      if (sanitized === currentSlug) {
        setError(null);
        setIsAvailable(true);
        setHasChanged(false);
        return;
      }

      setHasChanged(true);

      // Basic format validation
      if (!editedSlug || editedSlug.trim() === '') {
        setError(null);
        setIsAvailable(false);
        return;
      }

      if (!isValidSlugFormat(sanitized)) {
        setError('Use 3-30 characters (letters, numbers, hyphens)');
        setIsAvailable(false);
        return;
      }

      if (isReservedWord(sanitized)) {
        setError('This is a reserved word and cannot be used');
        setIsAvailable(false);
        return;
      }

      // Check if the slug is available
      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch(`/api/connect/check-slug?slug=${sanitized}`, {
          credentials: 'include', // Include cookies for authentication
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check availability');
        }

        setIsAvailable(data.isAvailable);
        if (!data.isAvailable) {
          setError('This URL is already taken. Please choose another.');
        }
      } catch (err) {
        console.error('Error checking slug availability:', err);
        setError('Could not check availability. Please try again.');
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce validation to avoid too many requests
    const handler = setTimeout(validate, 500);
    return () => clearTimeout(handler);
  }, [editedSlug, currentSlug]);

  const handleChange = (e) => {
    setEditedSlug(e.target.value);
  };

  const handleUpdate = async () => {
    if (!isAvailable || isChecking || error) return;

    try {
      const sanitized = sanitizeSlug(editedSlug);
      await onUpdate(sanitized);
      setSlug(sanitized);
      setHasChanged(false);
    } catch (err) {
      setError(err.message || 'Failed to update URL');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Customize Your Profile URL
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Create a custom URL for your profile that's easy to remember and share.
      </Typography>

      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Custom Profile URL"
          value={editedSlug}
          onChange={handleChange}
          disabled={disabled || isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ maxWidth: { xs: '100px', sm: '150px' } }}
                >
                  {BASE_URL}
                </Typography>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isChecking && <CircularProgress size={20} />}
                {!isChecking && isAvailable && editedSlug && <CheckCircleIcon color="success" />}
                {!isChecking && !isAvailable && editedSlug && <ErrorIcon color="error" />}
              </InputAdornment>
            )
          }}
          error={!!error}
          helperText={error || (isAvailable && editedSlug ? 'This URL is available' : ' ')}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Choose a URL that's easy to remember but doesn't compromise your anonymity.
        </Alert>

        <Typography variant="body2" gutterBottom>
          Your current profile link: <strong>{BASE_URL}{slug || '[custom-url]'}</strong>
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => {
              navigator.clipboard.writeText(`https://${BASE_URL}${slug}`);
            }}
            disabled={!slug}
          >
            Copy Link
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={disabled || isLoading || !isAvailable || !hasChanged || isChecking}
          >
            {isLoading ? 'Updating...' : 'Update URL'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}