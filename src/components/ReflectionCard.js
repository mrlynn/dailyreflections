'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import DOMPurify from 'dompurify';
import SimilarReflections from '@/components/SimilarReflections';

export default function ReflectionCard({ dateKey }) {
  const [reflection, setReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchReflection();
  }, [dateKey]);

  const fetchReflection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reflections/${dateKey}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reflection');
      }

      const data = await response.json();
      setReflection(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sharing direct URL to this reflection
  const handleShareUrl = () => {
    // Create the direct URL for this date
    const url = new URL(`/${dateKey}`, window.location.origin).toString();

    // Use navigator.share if available (mobile devices)
    if (navigator.share) {
      navigator.share({
        title: reflection?.title || 'Daily Reflection',
        text: 'Check out this daily reflection',
        url: url
      }).catch(() => {
        // Fallback to clipboard copy
        copyToClipboard(url);
      });
    } else {
      // Copy to clipboard
      copyToClipboard(url);
    }
  };

  // Helper function to copy URL to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShareSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!reflection) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No reflection available for this date.
      </Alert>
    );
  }

  // Use cleaned text if available, otherwise sanitize HTML for backward compatibility
  const displayComment = reflection.commentCleaned
    ? reflection.comment
    : DOMPurify.sanitize(reflection.comment);

  return (
    <Card elevation={3} sx={{ mb: 3 }}>
      <CardContent>
        {/* Title and Share Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600, color: 'primary.main' }}
          >
            {reflection.title}
          </Typography>

          <Tooltip title="Share direct link to this reflection">
            <IconButton
              onClick={handleShareUrl}
              color="primary"
              aria-label="share reflection"
              size="small"
              sx={{ ml: 1 }}
            >
              <LinkIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Quote */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: 'rgba(99, 102, 241, 0.04)', // Soft indigo tint
            borderLeft: 4,
            borderColor: 'primary.main',
            borderRadius: '8px',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontStyle: 'italic',
              lineHeight: 1.7,
              fontFamily: 'var(--font-inter)',
              letterSpacing: '-0.01em',
              color: 'text.primary'
            }}
          >
            {reflection.quote}
          </Typography>
        </Paper>

        {/* Comment/Reflection */}
        {reflection.commentCleaned ? (
          // Cleaned text - render as plain text with preserved line breaks
          <Typography 
            variant="body1" 
            sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
          >
            {displayComment}
          </Typography>
        ) : (
          // Legacy HTML content - sanitize and render
          <Box
            sx={{ mb: 2 }}
            dangerouslySetInnerHTML={{ __html: displayComment }}
          />
        )}

        {/* Reference */}
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 2, fontStyle: 'italic', color: 'text.secondary' }}
        >
          {reflection.reference}
        </Typography>

        {/* Copyright Notice */}
        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Typography
            variant="caption"
            align="center"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              opacity: 0.9,
              maxWidth: '90%',
              fontFamily: 'var(--font-inter)',
              letterSpacing: '0.01em'
            }}
          >
            From the book Daily Reflections.
            <br />
            Copyright © 1990 by Alcoholics Anonymous World Services, Inc. All rights reserved.
          </Typography>
        </Box>

        {/* Similar Reflections Section */}
        <SimilarReflections dateKey={dateKey} limit={3} />
      </CardContent>

      {/* Snackbar notification for URL copy */}
      <Snackbar
        open={shareSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setShareSnackbarOpen(false)}
        message="Direct link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Card>
  );
}

