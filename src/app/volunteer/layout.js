'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress, Paper } from '@mui/material';
import VolunteerNavigation from '@/components/Volunteer/VolunteerNavigation';

export default function VolunteerLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check if user has volunteer role on component mount
  useEffect(() => {
    // If authentication is complete
    if (status === 'authenticated') {
      const hasVolunteerRole = session?.user?.roles?.includes('volunteer_listener');

      // If not a volunteer, redirect to home
      if (!hasVolunteerRole) {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      // If not authenticated, redirect to sign in
      router.push('/auth/signin?callbackUrl=/volunteer');
    }
  }, [status, session, router]);

  // If still checking authentication, show loading
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not authorized, don't render children
  if (status === 'authenticated' && !session?.user?.roles?.includes('volunteer_listener')) {
    return null;
  }

  // Use the main app layout structure but add volunteer navigation
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Volunteer Navigation Menu */}
      <VolunteerNavigation />

      {/* Main content */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          p: 2,
          borderRadius: 2,
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}