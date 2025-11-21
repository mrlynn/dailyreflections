'use client';

import { Typography } from '@mui/material';

/**
 * TextBlock - Simple body copy paragraph
 */
export default function TextBlock({ body }) {
  return (
    <Typography
      variant="body1"
      sx={{
        mb: 3,
        color: 'text.primary',
        fontSize: { xs: '1rem', sm: '1.0625rem' },
        lineHeight: 1.8,
      }}
    >
      {body}
    </Typography>
  );
}
