'use client';

import { Box, Typography } from '@mui/material';

/**
 * VideoBlock - Embedded YouTube or local video
 * (Implementation may need refinement based on actual video sources)
 */
export default function VideoBlock({ url, title, description }) {
  // Extract video ID from YouTube URL if applicable
  const getYouTubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const embedUrl = getYouTubeEmbedUrl(url);

  return (
    <Box sx={{ my: 4 }}>
      {title && (
        <Typography
          variant="h6"
          sx={{
            mb: 1.5,
            fontWeight: 600,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
          }}
        >
          {title}
        </Typography>
      )}

      {description && (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: 'text.secondary',
          }}
        >
          {description}
        </Typography>
      )}

      <Box
        sx={{
          position: 'relative',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <iframe
          src={embedUrl}
          title={title || 'Video'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>
    </Box>
  );
}
