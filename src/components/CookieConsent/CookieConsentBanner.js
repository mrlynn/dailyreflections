'use client';

import { useState, useEffect } from 'react';
import {
  Backdrop,
  Button,
  Paper,
  Typography,
  Box,
  Link as MuiLink,
  IconButton,
  Slide,
  Stack,
  useTheme
} from '@mui/material';
import Link from 'next/link';
import CookieIcon from '@mui/icons-material/Cookie';
import CloseIcon from '@mui/icons-material/Close';

export default function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  useEffect(() => {
    // Check if user has already consented
    const cookieConsent = localStorage.getItem('cookieConsent');

    // If no consent record is found, show the banner
    if (!cookieConsent) {
      // Small delay to prevent showing immediately on page load
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Save consent with timestamp
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: {
        necessary: true, // Always required
        analytics: true, // Default to accepted
        marketing: false // Default to rejected
      }
    }));

    setOpen(false);
  };

  const handleCustomize = () => {
    // Navigate to cookie settings page
    window.location.href = '/legal/cookies';
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Backdrop
        open={open}
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.modal - 1,
          bgcolor: 'rgba(0, 0, 0, 0.35)'
        }}
        onClick={handleClose}
      />

      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: theme.zIndex.modal,
            width: { xs: '90%', sm: 'auto' },
            maxWidth: 600
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'background.paper',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
            }}
          >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CookieIcon color="primary" sx={{ mr: 1.5 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
              Cookie Consent
            </Typography>
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            We use cookies and similar technologies to improve your experience, analyze traffic,
            and for security. By clicking "Accept All", you consent to our use of cookies.
            Visit our{' '}
            <MuiLink component={Link} href="/legal/cookies" underline="hover">
              Cookie Policy
            </MuiLink>{' '}
            to learn more.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              onClick={handleCustomize}
              sx={{
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.38)',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Customize
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAccept}
              disableElevation
            >
              Accept All
            </Button>
          </Stack>
          </Paper>
        </Box>
      </Slide>
    </>
  );
}