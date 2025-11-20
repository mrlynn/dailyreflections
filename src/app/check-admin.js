'use client';

import { useSession } from 'next-auth/react';
import { Box, Typography, Paper } from '@mui/material';

export default function CheckAdminStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  return (
    <Paper sx={{ p: 4, mt: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        User Session Information
      </Typography>

      {!session ? (
        <Typography color="error">Not logged in</Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1"><strong>Email:</strong> {session.user.email}</Typography>
          <Typography variant="body1"><strong>Name:</strong> {session.user.name}</Typography>
          <Typography variant="body1"><strong>Display Name:</strong> {session.user.displayName || 'Not set'}</Typography>
          <Typography variant="body1">
            <strong>Admin Status:</strong> {session.user.isAdmin ? 'Yes (Admin)' : 'No (Regular User)'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Full Session Data:
          </Typography>
          <Box component="pre" sx={{
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 300,
            fontSize: '0.8rem'
          }}>
            {JSON.stringify(session, null, 2)}
          </Box>
        </Box>
      )}
    </Paper>
  );
}