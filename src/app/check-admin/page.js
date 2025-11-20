'use client';

import { Container, Typography, Box } from '@mui/material';
import CheckAdminStatus from '../check-admin';

export default function CheckAdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontFamily: 'var(--font-poppins)' }}>
        Check Admin Status
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          This page displays your current session information, including whether you have admin privileges.
        </Typography>
        <Typography variant="body1">
          If you don't have admin privileges but should have them, contact the system administrator.
        </Typography>
      </Box>

      <CheckAdminStatus />
    </Container>
  );
}