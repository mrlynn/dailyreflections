'use client';

import { Box, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

/**
 * QuoteBlock - Displays a quote from the Big Book or AA members
 */
export default function QuoteBlock({ source, body }) {
  return (
    <Box
      sx={{
        my: 4,
        pl: 3,
        pr: 2,
        py: 2,
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <FormatQuoteIcon sx={{ color: 'primary.main', fontSize: 28, opacity: 0.6 }} />
      </Box>

      <Typography
        variant="body1"
        sx={{
          fontStyle: 'italic',
          color: 'text.primary',
          mb: 1.5,
          fontSize: { xs: '1rem', sm: '1.0625rem' },
          lineHeight: 1.7,
        }}
      >
        {body}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        — {source}
      </Typography>
    </Box>
  );
}
