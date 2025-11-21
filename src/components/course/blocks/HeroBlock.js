'use client';

import { Box, Typography } from '@mui/material';

/**
 * HeroBlock - Visual anchor at the start of lessons
 *
 * Displays a heading, body text, and mascot/lantern illustration.
 * Can display either a custom image or fall back to emoji placeholder.
 */
export default function HeroBlock({ heading, body, mascotVariant = 'lantern-soft', imagePath }) {
  return (
    <Box
      sx={{
        position: 'relative',
        py: 6,
        px: 4,
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden',
        minHeight: imagePath ? 400 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        // Background image with overlay
        ...(imagePath && {
          backgroundImage: `url(${imagePath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }),
        // Fallback gradient when no image
        ...(!imagePath && {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          border: '1px solid',
          borderColor: 'rgba(59, 130, 246, 0.1)',
        }),
      }}
    >
      {/* Dark overlay for better text readability when image is present */}
      {imagePath && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.1) 100%)',
            zIndex: 1,
          }}
        />
      )}

      {/* Content container with higher z-index */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Emoji placeholder only when no image */}
        {!imagePath && (
          <Box
            sx={{
              width: 60,
              height: 60,
              mb: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}
          >
            <Typography variant="h4" sx={{ color: 'white' }}>
              🏮
            </Typography>
          </Box>
        )}

        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: body ? 2 : 0,
            color: imagePath ? 'white' : 'text.primary',
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            textShadow: imagePath ? '0 2px 8px rgba(0, 0, 0, 0.5)' : 'none',
          }}
        >
          {heading}
        </Typography>

        {body && (
          <Typography
            variant="body1"
            sx={{
              color: imagePath ? 'rgba(255, 255, 255, 0.95)' : 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.125rem' },
              lineHeight: 1.7,
              textShadow: imagePath ? '0 1px 4px rgba(0, 0, 0, 0.5)' : 'none',
              maxWidth: '800px',
            }}
          >
            {body}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
