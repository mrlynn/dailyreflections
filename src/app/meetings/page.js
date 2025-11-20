'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';

/**
 * Meetings Page
 * Embeds TSML-UI for displaying AA meetings
 *
 * TSML-UI is a drop-in script that handles the rendering of meetings
 * from a Meeting Guide-compatible JSON feed.
 *
 * Documentation: https://tsml-ui.code4recovery.org/
 */
export default function MeetingsPage() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find a Meeting
        </Typography>
        <Typography variant="body1" paragraph>
          Find AA meetings in your area, virtual meetings, or search by various criteria.
          Click on a meeting for more details or select filters to narrow down your search.
        </Typography>
      </Paper>

      {/* TSML-UI Container */}
      <Box sx={{ position: 'relative', minHeight: '600px' }}>
        {!scriptLoaded && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              zIndex: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {scriptError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            There was an issue loading the meetings finder. Please try refreshing the page.
          </Alert>
        )}

        {/* TSML-UI will render inside this div */}
        <Box
          id="tsml-ui"
          data-src="/api/meeting-guide"
          data-timezone="America/New_York"
          data-distance-unit="miles"
          data-time-format="12"
          data-include="types"
          data-path="/meetings"  // Enable pretty permalinks
          sx={{
            // Custom styles for TSML-UI
            '& .tsml-container': {
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.primary,
            },
            '& .tsml-header': {
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            },
            '& a': {
              color: theme.palette.primary.main,
            },
            '& button': {
              borderRadius: theme.shape.borderRadius,
            },
            // Custom theme variables for TSML-UI
            '--tsml-primary-color': theme.palette.primary.main,
            '--tsml-border-radius': '4px',
            '--tsml-max-width': '1280px',
          }}
        />
      </Box>

      {/* Load TSML-UI script */}
      <Script
        src="https://tsml-ui.code4recovery.org/app.js"
        async
        onLoad={() => setScriptLoaded(true)}
        onError={() => setScriptError(true)}
      />

      {/* Meeting Guide Info Section */}
      <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          About Meeting Guide
        </Typography>
        <Typography variant="body1" paragraph>
          This meeting directory is powered by <a href="https://www.aa.org/meeting-guide-app" target="_blank" rel="noopener noreferrer">Meeting Guide</a>,
          the official mobile app of Alcoholics Anonymous World Services. Meeting Guide helps you find AA meetings near you or online.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          To get the app, search for "Meeting Guide" in your app store or visit <a href="https://www.aa.org/meeting-guide-app" target="_blank" rel="noopener noreferrer">aa.org/meeting-guide-app</a>.
        </Typography>
      </Paper>
    </Container>
  );
}