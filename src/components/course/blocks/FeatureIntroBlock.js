'use client';

import { Box, Typography, Button, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * FeatureIntroBlock - Introduces an app feature and routes user to it
 */
export default function FeatureIntroBlock({
  featureKey,
  title,
  description,
  buttonLabel,
  lessonId,
}) {
  const router = useRouter();

  // Map feature keys to routes and icons
  const featureRoutes = {
    'meeting-finder': '/meetings',
    'sobriety-tracker': '/sobriety',
    'ninety-in-ninety': '/meetings',
    'daily-reflection': '/reflections/today',
    'journal': '/journal',
    'big-book': '/big-book',
  };

  const featureIcons = {
    'meeting-finder': PlaceIcon,
    'sobriety-tracker': CalendarTodayIcon,
    'ninety-in-ninety': EventIcon,
    'daily-reflection': MenuBookIcon,
    'journal': MenuBookIcon,
    'big-book': MenuBookIcon,
  };

  const Icon = featureIcons[featureKey] || MenuBookIcon;
  const route = featureRoutes[featureKey] || '/';

  const handleFeatureClick = async () => {
    // Log the feature offer click
    try {
      await fetch('/api/course/feature-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          featureKey,
        }),
      });
    } catch (err) {
      console.error('Error logging feature click:', err);
      // Don't block navigation if logging fails
    }

    // Navigate to feature
    router.push(route);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        my: 4,
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.light',
        background: 'rgba(25, 118, 210, 0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            background: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
          }}
        >
          {title}
        </Typography>
      </Box>

      {description && (
        <Typography
          variant="body1"
          sx={{
            mb: 2,
            color: 'text.secondary',
            fontSize: { xs: '0.9375rem', sm: '1rem' },
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        endIcon={<ArrowForwardIcon />}
        onClick={handleFeatureClick}
        sx={{
          textTransform: 'none',
          fontSize: '0.9375rem',
        }}
      >
        {buttonLabel}
      </Button>
    </Paper>
  );
}
