'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

/**
 * CourseProgressBar - Shows user's progress through the course
 *
 * @param {number} progress - Progress percentage (0-100)
 * @param {Object} course - Course object with title
 */
export default function CourseProgressBar({ progress = 0, course }) {
  return (
    <Box
      sx={{
        py: 2,
        px: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {course?.title || 'Course Progress'}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {progress}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            background: 'linear-gradient(90deg, #3b82f6 0%, #9333ea 100%)',
          },
        }}
      />

      {/* Lantern mascot placeholder */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 1,
          ml: `calc(${progress}% - 16px)`,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Typography sx={{ fontSize: '1.25rem' }}>🏮</Typography>
      </Box>
    </Box>
  );
}
