'use client';

import { Box, Chip, Typography } from '@mui/material';

/**
 * SuggestedQuestions Component
 * Displays clickable chips with suggested questions
 */
export default function SuggestedQuestions({ suggestions = [], onSelect }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Suggested questions:
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestions.map((question, index) => (
          <Chip
            key={index}
            label={question}
            onClick={() => onSelect(question)}
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}