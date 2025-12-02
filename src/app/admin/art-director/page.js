'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container, Alert, CircularProgress, Box } from '@mui/material';
import ArtDirectorDashboard from '@/components/Admin/ArtDirectorDashboard';

/**
 * Admin page for Ghibli Art Director Agent
 */
export default function ArtDirectorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState(null);

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check for admin role
    if (!session.user.roles?.includes('admin') && !session.user.isAdmin) {
      setError('Unauthorized - Admin role required');
      setTimeout(() => router.push('/'), 3000);
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return <ArtDirectorDashboard />;
}
