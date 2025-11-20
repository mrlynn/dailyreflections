'use client';

import { Container } from '@mui/material';

export default function TestAdminLayout({ children }) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {children}
    </Container>
  );
}