'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Component for requesting a chat with a volunteer
 * @param {Object} props
 * @param {string} [props.buttonText="Talk to a Volunteer"] - Custom button text
 * @param {string} [props.buttonVariant="contained"] - MUI button variant
 * @param {string} [props.buttonColor="primary"] - MUI button color
 * @param {Function} [props.onChatRequested] - Callback for when chat is successfully requested
 */
export default function RequestChatButton({
  buttonText = "Talk to a Volunteer",
  buttonVariant = "contained",
  buttonColor = "primary",
  onChatRequested
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatRequested, setChatRequested] = useState(false);
  const [chatSession, setChatSession] = useState(null);

  // Handle button click
  const handleClick = () => {
    if (!session) {
      // If user is not logged in, redirect to sign in
      router.push('/auth/signin?callbackUrl=/chat');
      return;
    }

    setOpen(true);
  };

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    setError(null);

    // If chat was requested successfully, redirect to chat page
    if (chatRequested && chatSession) {
      router.push(`/chat/${chatSession._id}`);
    }
  };

  // Handle chat request
  const handleRequestChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get browser and device info for metadata
      const userAgent = navigator.userAgent;
      const metadata = {
        browser: getBrowserInfo(userAgent),
        device: getDeviceInfo(userAgent)
      };

      // Create a chat session request
      const response = await fetch('/api/volunteers/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metadata })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request chat');
      }

      // Success - set chat session
      setChatSession(data.session);
      setChatRequested(true);

      // Call onChatRequested callback if provided
      if (onChatRequested) {
        onChatRequested(data.session);
      }

    } catch (err) {
      console.error('Error requesting chat:', err);
      setError(err.message || 'An error occurred while requesting a chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for user agent parsing
  function getBrowserInfo(userAgent) {
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  function getDeviceInfo(userAgent) {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android';
    return userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        color={buttonColor}
        startIcon={<ChatBubbleOutlineIcon />}
        onClick={handleClick}
        disabled={status === 'loading'}
        sx={{
          borderRadius: 8,
          px: 3,
          py: 1
        }}
      >
        {buttonText}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="chat-request-dialog-title"
      >
        {!chatRequested ? (
          // Initial dialog content
          <>
            <DialogTitle id="chat-request-dialog-title">
              Talk to a Sober Volunteer
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                You're about to connect with a fellow alcoholic in recovery who volunteers their time to share experience, strength and hope.
              </DialogContentText>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Please note:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mt: 1 }}>
                  <li>You'll be speaking with a peer volunteer, not a professional counselor or therapist.</li>
                  <li>All conversations are confidential within the bounds of our privacy policy.</li>
                  <li>This is a supportive space focused on recovery.</li>
                  <li>You may need to wait briefly until a volunteer becomes available.</li>
                </Typography>
              </Box>

              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handleRequestChat}
                color="primary"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Requesting..." : "Connect with a Volunteer"}
              </Button>
            </DialogActions>
          </>
        ) : (
          // Success dialog content
          <>
            <DialogTitle id="chat-request-success-title">
              Chat Request Successful
            </DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" alignItems="center" my={2}>
                <CircularProgress color="success" />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Finding a volunteer...
                </Typography>
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                  We're connecting you with a volunteer. You'll be redirected to the chat room in a moment.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                color="primary"
                variant="contained"
              >
                Go to Chat Room
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}