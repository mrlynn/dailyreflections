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
  Fab,
} from '@mui/material';
import Image from 'next/image';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import DOMPurify from 'dompurify';
import SimilarReflections from '@/components/SimilarReflections';
import ImageInfoModal from './ImageInfoModal';
import { useRouter } from 'next/navigation';

export default function ReflectionCard({ dateKey }) {
  const router = useRouter();
  const [reflection, setReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [imageExists, setImageExists] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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
      // Set image exists from API response - with our new approach, this is always true
      // but we keep the state for compatibility with the rest of the component
      setImageExists(true);
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

  // Handler for opening the image info modal
  const handleOpenInfoModal = () => {
    setInfoModalOpen(true);
  };

  // Handler for closing the image info modal
  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
  };

  // Handler for opening the assistant page with a pre-populated question about this reflection
  const handleOpenAssistant = () => {
    if (reflection) {
      // Create a message with reference to the current reflection
      const message = `Can you help me understand this daily reflection: "${reflection.title}" from ${dateKey}?`;

      // We need to store the message in localStorage temporarily so the assistant page can retrieve it
      try {
        // Save the message to be used on the assistant page
        localStorage.setItem('prepopulatedQuestion', message);
        // Navigate to the assistant page
        router.push('/assistant');
      } catch (err) {
        console.error('Failed to store message:', err);
      }
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              lineHeight: 1.3,
              letterSpacing: '-0.01em'
            }}
          >
            {reflection.title} ({dateKey})
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

        {/* Subtle divider to separate title from image */}
        <Box sx={{ mt: 1, mb: 1.5, borderTop: '1px solid', borderColor: 'divider' }} />

        {/* Reflection Image (with fallback to default) */}
        <Box
          sx={{
            mt: 0,
            mx: -3,  // Extend beyond the card edges
            mb: 3,
            width: 'calc(100% + 48px)', // Compensate for the card padding
            maxHeight: '260px', // Slightly taller for presence
            minHeight: '200px', // Ensure space is reserved
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: 'rgba(0,0,0,0.02)', // Subtle background in case image fails
          }}
        >
          <Image
            src={reflection?.image?.url && !imageError
              ? reflection.image.url
              : "/reflections/default.jpg"}
            alt={reflection?.title ? `Illustration for ${reflection.title}` : "Daily Reflection"}
            width={1792}
            height={1024}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              display: 'block'
            }}
            priority={true}
            unoptimized={false}
            onError={(e) => {
              console.error('Image failed to load:', e);
              // If specific image fails, fallback to default
              if (!imageError) {
                setImageError(true);
              }
            }}
          />
          {/* Info button overlay */}
          <Fab
            size="small"
            color="primary"
            aria-label="Image information"
            onClick={handleOpenInfoModal}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              opacity: 0.8,
              '&:hover': {
                opacity: 1,
              },
              boxShadow: 3
            }}
          >
            <InfoOutlinedIcon />
          </Fab>

          {/* Ask Assistant button */}
          <Fab
            size="small"
            color="secondary"
            aria-label="Ask assistant about this reflection"
            onClick={handleOpenAssistant}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 76, // Position to the left of the info button
              opacity: 0.8,
              '&:hover': {
                opacity: 1,
              },
              boxShadow: 3
            }}
          >
            <QuestionAnswerIcon />
          </Fab>
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
          {/* Reference */}
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 2, fontStyle: 'italic', color: 'text.secondary' }}
        >
          {reflection.reference}
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

      {/* Image info modal */}
      <ImageInfoModal
        open={infoModalOpen}
        onClose={handleCloseInfoModal}
      />
    </Card>
  );
}

