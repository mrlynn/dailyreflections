'use client';

import { Box, Container, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ChatTest from '@/components/Chat/ChatTest';

/**
 * Chat Test Page
 * This page renders the ChatTest component for testing Ably real-time messaging
 */
export default function ChatTestPage() {
  const { status } = useSession();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink component={Link} href="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Chat Test</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Real-time Chat Testing
      </Typography>

      <Typography variant="body1" paragraph>
        This page allows you to test the Ably real-time messaging integration. Open multiple browser
        tabs with this page to simulate different users and test real-time communication.
      </Typography>

      {status === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : status === 'unauthenticated' ? (
        <Box sx={{ my: 4 }}>
          <Typography variant="body1" color="error">
            You must be signed in to test real-time chat functionality.
          </Typography>
          <MuiLink component={Link} href="/auth/signin?callbackUrl=/chat-test" sx={{ mt: 2, display: 'block' }}>
            Sign in to continue
          </MuiLink>
        </Box>
      ) : (
        <ChatTest />
      )}
    </Container>
  );
}