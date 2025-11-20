'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, Typography, Paper } from '@mui/material';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const [showDebug, setShowDebug] = useState(false);

  if (status === 'loading') {
    return <Typography>Loading session data...</Typography>;
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setShowDebug(!showDebug)}
        sx={{ mb: 1 }}
      >
        {showDebug ? 'Hide' : 'Show'} Session Debug
      </Button>

      {showDebug && (
        <Paper sx={{ p: 2, mt: 1, maxWidth: '100%', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>Session Status: {status}</Typography>

          {session ? (
            <Box component="pre" sx={{
              p: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              overflow: 'auto'
            }}>
              {JSON.stringify(session, null, 2)}
            </Box>
          ) : (
            <Typography>No active session</Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}