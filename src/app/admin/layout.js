'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check loading state
  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated or not admin, redirect to home
  if (!session?.user || !session.user.isAdmin) {
    router.push('/');
    return null;
  }

  // Just render the children directly - they will be wrapped by the AppShell in the RootLayout
  return children;
}

// Note: Admin pages should have noindex metadata, but since this is a client component,
// metadata should be set in individual admin pages or a separate metadata file