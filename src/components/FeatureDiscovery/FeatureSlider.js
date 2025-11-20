'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Container,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Feature Slider Component for Feature Discovery
 *
 * @param {Object} props
 * @param {Array} props.features - Array of feature objects
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {number} props.visibleSlides - Number of slides visible at once
 */
const FeatureSlider = ({
  features = [],
  title = 'Discover Features',
  subtitle = 'Explore the features that make your recovery journey easier',
  visibleSlides = 3,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const clampColor = (color, fallback) => {
    if (!color || typeof color !== 'string') return fallback;
    return color;
  };

  const hexToRgba = (hex, alpha = 1, fallback = 'rgba(93,166,167,1)') => {
    const sanitized = clampColor(hex, null)?.replace('#', '');
    if (!sanitized || sanitized.length !== 6) return fallback.replace(/,1\)/, `,${alpha})`);
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleNavigate = useCallback(
    (direction) => {
      setCurrentIndex((prev) => {
        if (features.length === 0) return 0;
        const nextIndex = (prev + direction + features.length) % features.length;
        return nextIndex;
      });
    },
    [features.length]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        handleNavigate(1);
      } else if (event.key === 'ArrowLeft') {
        handleNavigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate]);

  useEffect(() => {
    if (currentIndex >= features.length) {
      setCurrentIndex(0);
    }
  }, [features.length, currentIndex]);

  const currentFeature = features[currentIndex] || null;

  if (features.length === 0) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Section Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary, maxWidth: '700px', mx: 'auto' }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Card
        elevation={8}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(26,43,52,0.12)',
          background: `linear-gradient(135deg, ${hexToRgba(
            currentFeature?.accentColor,
            0.1
          )} 0%, ${hexToRgba(currentFeature?.accentColor, 0.25)} 100%)`,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'relative',
          width: { xs: '100%', md: '45%' },
          minHeight: { xs: 220, sm: 260, md: 340 },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(16,27,34,0.05) 0%, rgba(16,27,34,0.3) 100%)',
            pointerEvents: 'none',
          },
        }}
        >
          {currentFeature?.imageUrl && (
            <Image
              key={currentFeature.title}
              src={currentFeature.imageUrl}
              alt={currentFeature.title}
              fill
              sizes="(max-width: 900px) 100vw, 40vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
        </Box>

        <CardContent
          sx={{
            width: { xs: '100%', md: '55%' },
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: 'text.primary',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  letterSpacing: 0.4,
                }}
              >
                Feature Spotlight
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={() => handleNavigate(-1)}
                  aria-label="View previous feature"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(26,43,52,0.12)',
                    boxShadow: '0 8px 18px rgba(26,43,52,0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleNavigate(1)}
                  aria-label="View next feature"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(26,43,52,0.12)',
                    boxShadow: '0 8px 18px rgba(26,43,52,0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                label={currentFeature?.tag ? `${currentFeature.tag}` : `${currentIndex + 1} of ${features.length}`}
                sx={{
                  backgroundColor: hexToRgba(currentFeature?.accentColor, 0.15),
                  color: currentFeature?.accentColor || 'primary.main',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: currentFeature?.tag ? 'uppercase' : 'none',
                }}
              />
              <FiberManualRecordIcon sx={{ color: currentFeature?.accentColor || 'primary.main' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {currentFeature?.title}
              </Typography>
            </Stack>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  mb: 1,
                  fontSize: { xs: '1.9rem', md: '2.2rem' },
                }}
              >
                {currentFeature?.title}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: 'text.primary',
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.05rem' },
              }}
            >
              {currentFeature?.description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                href={currentFeature?.actionUrl || '#'}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 3,
                  py: 1.25,
                  fontWeight: 600,
                  backgroundColor: currentFeature?.accentColor || 'primary.main',
                  '&:hover': {
                    backgroundColor: currentFeature?.accentColor
                      ? hexToRgba(currentFeature.accentColor, 0.9, currentFeature.accentColor)
                      : 'primary.dark',
                  },
                }}
              >
                {currentFeature?.actionText || 'Learn More'}
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {features.map((_, idx) => (
                <Box
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  sx={{
                    width: idx === currentIndex ? 16 : 10,
                    height: 10,
                    borderRadius: 999,
                    mx: 0.5,
                    bgcolor:
                      idx === currentIndex
                        ? currentFeature?.accentColor || 'primary.main'
                        : 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default FeatureSlider;