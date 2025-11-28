'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
  Collapse,
  Chip,
  Fab,
} from '@mui/material';
import Image from 'next/image';
import LinkIcon from '@mui/icons-material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DOMPurify from 'dompurify';
import SimilarReflections from '@/components/SimilarReflections';
import ImageInfoModal from './ImageInfoModal';
import { useRouter } from 'next/navigation';

export default function EnhancedReflectionCard({ dateKey, onNavigate }) {
  const router = useRouter();
  const [reflection, setReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  useEffect(() => {
    fetchReflection();
  }, [dateKey]);

  // Debug: Log reflection data
  useEffect(() => {
    if (reflection) {
      console.log('Reflection data:', {
        title: reflection.title,
        imageUrl: reflection.image?.url,
        hasImage: !!reflection.image?.url
      });
    }
  }, [reflection]);

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

  const handleShareUrl = () => {
    const url = new URL(`/${dateKey}`, window.location.origin).toString();

    if (navigator.share) {
      navigator.share({
        title: reflection?.title || 'Daily Reflection',
        text: 'Check out this daily reflection',
        url: url
      }).catch(() => {
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShareSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  const handleOpenAssistant = () => {
    if (reflection) {
      const message = `Can you help me understand this daily reflection: "${reflection.title}" from ${dateKey}?`;
      try {
        localStorage.setItem('prepopulatedQuestion', message);
        router.push('/assistant');
      } catch (err) {
        console.error('Failed to store message:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress size={48} />
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

  const displayComment = reflection.commentCleaned
    ? reflection.comment
    : DOMPurify.sanitize(reflection.comment);

  return (
    <>
      {/* Full-Width Hero Section with Image and Title */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '400px', md: '500px' },
          overflow: 'hidden',
          mb: 4,
          borderRadius: 2,
        }}
      >
        {/* Background Image with Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
              zIndex: 1,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.4) 100%)',
              zIndex: 1,
            }
          }}
        >
          {reflection.image?.url ? (
            <Image
              src={reflection.image.url}
              alt={reflection.title}
              fill
              priority
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              unoptimized={reflection.image.url.startsWith('/api/')}
            />
          ) : (
            // Fallback: Use a CSS background with generated gradient
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg,
                  hsl(${Math.abs(dateKey.split('-').join('').charCodeAt(0) * 137) % 360}, 70%, 60%) 0%,
                  hsl(${Math.abs(dateKey.split('-').join('').charCodeAt(1) * 137 + 60) % 360}, 70%, 50%) 100%)`,
              }}
            />
          )}
        </Box>

        {/* Navigation Chevrons Overlay */}
        {onNavigate && (
          <Box
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              zIndex: 10,
              display: 'flex',
              gap: 1,
            }}
          >
            <IconButton
              onClick={() => onNavigate('prev')}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              <ArrowBackIosIcon sx={{ fontSize: '1.2rem', ml: 0.5 }} />
            </IconButton>
            <IconButton
              onClick={() => onNavigate('next')}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              <ArrowForwardIosIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        )}

        {/* Title Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 6 },
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              mb: 1,
            }}
          >
            {reflection.title}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: { xs: '0.9rem', md: '1.1rem' },
              fontWeight: 500,
              textShadow: '0 1px 10px rgba(0,0,0,0.5)',
            }}
          >
            {dateKey}
          </Typography>
        </Box>

        {/* Image Info Button */}
        <IconButton
          onClick={() => setInfoModalOpen(true)}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          <InfoOutlinedIcon />
        </IconButton>
      </Box>

      {/* Floating Content Card */}
      <Box
        sx={{
          maxWidth: '900px',
          mx: 'auto',
          px: { xs: 2, md: 3 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            p: { xs: 4, md: 6 },
            mt: 4,
            mb: 6,
            border: '1px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Quote Section */}
          {reflection.quote && (
            <Box
              sx={{
                mb: 5,
                pl: 3,
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                fontStyle: 'italic',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{reflection.quote}&rdquo;
              </Typography>
            </Box>
          )}

          {/* Main Reflection Text */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              lineHeight: 2,
              fontSize: { xs: '1.05rem', md: '1.15rem' },
              mb: 4,
              '& p': {
                mb: 3,
              },
              '& p:last-child': {
                mb: 0,
              },
            }}
            dangerouslySetInnerHTML={{ __html: displayComment }}
          />

          {/* Reference */}
          {reflection.reference && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'right',
                color: 'text.secondary',
                fontSize: '0.85rem',
                fontVariant: 'small-caps',
                letterSpacing: '0.05em',
                mt: 4,
              }}
            >
              — {reflection.reference}
            </Typography>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              mt: 5,
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Tooltip title="Share this reflection">
              <IconButton
                onClick={handleShareUrl}
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Discuss with AI Assistant">
              <IconButton
                onClick={handleOpenAssistant}
                sx={{
                  backgroundColor: 'secondary.light',
                  color: 'secondary.main',
                  '&:hover': {
                    backgroundColor: 'secondary.main',
                    color: 'white',
                  },
                }}
              >
                <QuestionAnswerIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Collapsible Sources & Notes */}
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            overflow: 'hidden',
            mb: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            sx={{
              p: 2,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.02)',
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
              }}
            >
              Sources & Notes
            </Typography>
            {sourcesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          <Collapse in={sourcesExpanded}>
            <Box sx={{ p: 3, pt: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                From the book: <strong>Daily Reflections</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Published by Alcoholics Anonymous World Services, Inc.
              </Typography>
            </Box>
          </Collapse>
        </Box>

        {/* Similar Reflections */}
        <SimilarReflections sourceDate={dateKey} />
      </Box>

      {/* Modals and Snackbars */}
      <ImageInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        imageUrl={reflection.image?.url}
        title={reflection.title}
      />

      <Snackbar
        open={shareSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setShareSnackbarOpen(false)}
        message="Link copied to clipboard!"
      />

      {/* Floating Assistant FAB */}
      <Fab
        color="primary"
        aria-label="ask assistant"
        onClick={handleOpenAssistant}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.7)',
            },
            '50%': {
              boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)',
            },
          },
        }}
      >
        <QuestionAnswerIcon />
      </Fab>
    </>
  );
}
