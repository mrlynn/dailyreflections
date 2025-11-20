'use client';

import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RequestChatButton from '@/components/user/chat/RequestChatButton';

export default function ChatLandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle redirection when a chat is requested
  const handleChatRequested = (chatSession) => {
    if (chatSession && chatSession._id) {
      router.push(`/chat/${chatSession._id}`);
    }
  };

  // If user is not logged in, show sign in prompt
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Talk to a Volunteer
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            Connect with a fellow alcoholic in recovery who can share their experience, strength, and hope.
            Please sign in to continue.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => router.push('/login?callbackUrl=/chat')}
          >
            Sign In to Chat
          </Button>
        </Paper>
      </Container>
    );
  }

  // Main content for logged-in users
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" gutterBottom>
            Talk to a Volunteer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect with a fellow alcoholic in recovery
          </Typography>
        </Box>

        <Box my={4}>
          <Typography variant="h6" gutterBottom>
            How it Works
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">1. Request a Chat</Typography>
              <Typography variant="body2">
                Click the button below to be connected with a volunteer who is currently available.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">2. Share Your Experience</Typography>
              <Typography variant="body2">
                You'll be connected with a fellow alcoholic in recovery - not a professional counselor or therapist.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">3. Anonymous Support</Typography>
              <Typography variant="body2">
                Conversations are confidential and focused on recovery. Share freely in a safe space.
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Volunteers are fellow members of the recovery community who donate their time to help others.
            Wait times may vary depending on volunteer availability.
          </Typography>

          <Box mt={3}>
            <RequestChatButton
              buttonText="Connect with a Volunteer Now"
              buttonVariant="contained"
              buttonColor="primary"
              onChatRequested={handleChatRequested}
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}