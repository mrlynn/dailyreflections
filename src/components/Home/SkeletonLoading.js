'use client';

import { Box, Skeleton, Grid, Container } from '@mui/material';

/**
 * Skeleton loading screen component for the homepage
 * Shows placeholder content while data is loading
 */
export default function SkeletonLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Hero Section Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="75%" height={24} sx={{ mb: 3 }} />

        {/* Quote Skeleton */}
        <Box sx={{ mb: 3, mx: 'auto', maxWidth: '600px' }}>
          <Skeleton variant="text" width="90%" height={24} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="85%" height={24} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
        </Box>

        {/* Button Skeletons */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
          <Skeleton variant="rectangular" width={220} height={50} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={180} height={50} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Daily Progress Panel Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2, mb: 4 }} />
      </Box>

      {/* Feature Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={12} md={4} key={item}>
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="95%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}