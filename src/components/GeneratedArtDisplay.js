'use client';

import { useState, useEffect } from 'react';
import { Box, Skeleton, Fade } from '@mui/material';
import Image from 'next/image';

/**
 * GeneratedArtDisplay Component
 *
 * Displays AI-generated Ghibli-style artwork.
 * Fetches art from API and shows with smooth fade-in.
 *
 * @param {Object} props
 * @param {string} props.artType - Type of art: 'daily-reflection', 'step', 'milestone'
 * @param {string} props.reference - Reference value (date, step number, milestone type)
 * @param {string} props.width - Width of the image (default: '100%')
 * @param {string} props.height - Height of the image (default: '400px')
 * @param {string} props.borderRadius - Border radius (default: '8px')
 */
export default function GeneratedArtDisplay({
  artType,
  reference,
  width = '100%',
  height = '400px',
  borderRadius = '8px',
}) {
  const [loading, setLoading] = useState(true);
  const [artwork, setArtwork] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchArtwork() {
      try {
        setLoading(true);
        setError(null);

        // Build API URL based on art type
        let apiUrl;
        switch (artType) {
          case 'daily-reflection':
            apiUrl = `/api/art/daily-reflection?date=${reference}`;
            break;
          case 'step':
            apiUrl = `/api/art/step?number=${reference}`;
            break;
          case 'milestone':
            apiUrl = `/api/art/milestone?type=${reference}`;
            break;
          default:
            throw new Error(`Unknown art type: ${artType}`);
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch artwork');
        }

        const data = await response.json();

        if (data.hasArt) {
          setArtwork(data.artwork);
        }
      } catch (err) {
        console.error('Error fetching artwork:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchArtwork();
    }
  }, [artType, reference]);

  // Show loading skeleton
  if (loading) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          overflow: 'hidden',
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
        />
      </Box>
    );
  }

  // Don't show anything if no artwork or error
  if (error || !artwork) {
    return null;
  }

  // Show artwork with fade-in animation
  return (
    <Fade in timeout={800}>
      <Box
        sx={{
          width,
          height,
          borderRadius,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Image
          src={artwork.imageUrl}
          alt={artwork.altText}
          fill
          style={{
            objectFit: 'cover',
          }}
          priority
        />
      </Box>
    </Fade>
  );
}
