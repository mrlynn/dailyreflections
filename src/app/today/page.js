'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTodayKey } from '@/utils/dateUtils';
import { Box, CircularProgress, Container, Typography } from '@mui/material';

export default function TodayRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Get today's date in MM-DD format
    const todayKey = getTodayKey();

    // Redirect to today's reflection
    router.replace(`/${todayKey}`);
  }, [router]);

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress size={50} sx={{ mb: 3 }} />
        <Typography variant="h5">Loading today's reflection...</Typography>
      </Box>
    </Container>
  );
}