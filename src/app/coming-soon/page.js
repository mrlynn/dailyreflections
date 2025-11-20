"use client";

import { useSearchParams } from 'next/navigation';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material';
import { HourglassEmpty, Construction, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';

/**
 * Component that reads search params (must be wrapped in Suspense)
 */
function ComingSoonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [featureName, setFeatureName] = useState('');

  // Get the feature path from URL parameters
  useEffect(() => {
    const feature = searchParams.get('feature');

    if (feature) {
      // Format the feature name for display (e.g., "/blog" → "Blog")
      const formattedName = feature
        .replace(/^\//, '') // Remove leading slash
        .split('/')[0] // Get first path segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      setFeatureName(formattedName || 'This feature');
    } else {
      setFeatureName('This feature');
    }
  }, [searchParams]);

  // Handle go back button click
  const handleGoBack = () => {
    router.back();
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)', // Full height minus header/footer
          py: 6,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            borderRadius: 2,
            textAlign: 'center',
            width: '100%',
            maxWidth: 700,
            background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', height: 200, width: 200 }}>
                <HourglassEmpty
                  sx={{
                    fontSize: 120,
                    color: 'primary.main',
                    opacity: 0.8,
                    animation: 'pulse 2s infinite ease-in-out',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.6, transform: 'scale(1)' },
                      '50%': { opacity: 1, transform: 'scale(1.05)' },
                      '100%': { opacity: 0.6, transform: 'scale(1)' },
                    },
                  }}
                />
                <Construction
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    fontSize: 40,
                    color: 'secondary.main',
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={7} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h3" component="h1" gutterBottom color="primary.main">
                Coming Soon
              </Typography>
              <Typography variant="h5" gutterBottom>
                {featureName} is under development
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
                We're working hard to bring you this feature. It will be available soon with new and exciting capabilities to enhance your experience.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                sx={{ mt: 2 }}
              >
                Go Back
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}

/**
 * Coming Soon page displayed when a feature is disabled via feature flags
 */
export default function ComingSoonPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 200px)',
            py: 6,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 5,
              borderRadius: 2,
              textAlign: 'center',
              width: '100%',
              maxWidth: 700,
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom color="primary.main">
              Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Loading...
            </Typography>
          </Paper>
        </Box>
      </Container>
    }>
      <ComingSoonContent />
    </Suspense>
  );
}