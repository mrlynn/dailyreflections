'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useCodeOfConduct from '@/hooks/useCodeOfConduct';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import CodeOfConduct from '@/components/Volunteer/CodeOfConduct';

/**
 * Code of Conduct Page
 * Displays the complete volunteer code of conduct
 */
export default function CodeOfConductPage() {
  const { data: session, status } = useSession();
  const [agreeSuccess, setAgreeSuccess] = useState(false);
  const {
    agreeToCodeOfConduct,
    agreed,
    agreedAt,
    loading,
    error,
  } = useCodeOfConduct();

  // Handle agreeing to code of conduct
  const handleAgree = async () => {
    const success = await agreeToCodeOfConduct(true);
    if (success) {
      setAgreeSuccess(true);
      setTimeout(() => {
        setAgreeSuccess(false);
      }, 5000);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          Please sign in to view the volunteer code of conduct.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }} elevation={2}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Volunteer Code of Conduct
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Our code of conduct sets expectations for volunteer listeners.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {agreeSuccess && (
          <Alert severity="success" sx={{ mb: 4 }}>
            You have successfully agreed to the Code of Conduct. Thank you!
          </Alert>
        )}

        <CodeOfConduct
          embedded={true}
          onAgree={handleAgree}
          alreadyAgreed={agreed}
          loading={loading}
          error={error}
        />
      </Paper>
    </Container>
  );
}