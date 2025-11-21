'use client';

import { useState } from 'react';
import { Box, Typography, Button, Chip, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * CheckinBlock - Emotional state check-in with discrete answer options
 */
export default function CheckinBlock({ question, scale, lessonId }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setError(null);

    try {
      const response = await fetch('/api/course/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          mood,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save check-in');
      }

      setSaved(true);
    } catch (err) {
      console.error('Error saving check-in:', err);
      setError('Could not save your response. Please try again.');
      setSelectedMood(null);
    }
  };

  return (
    <Box
      sx={{
        my: 4,
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: saved ? 'success.light' : 'divider',
        background: saved ? 'rgba(76, 175, 80, 0.05)' : 'background.paper',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        {question}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        {scale.map((mood) => (
          <Chip
            key={mood}
            label={mood}
            onClick={() => !saved && handleMoodSelect(mood)}
            color={selectedMood === mood ? 'primary' : 'default'}
            variant={selectedMood === mood ? 'filled' : 'outlined'}
            disabled={saved}
            sx={{
              fontSize: '0.9375rem',
              px: 0.5,
              cursor: saved ? 'default' : 'pointer',
            }}
          />
        ))}
      </Box>

      {saved && (
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          sx={{ mt: 2 }}
        >
          Your response has been saved.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
