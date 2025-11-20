'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import QRScanner from '@/components/Connection/QRScanner';

/**
 * QR Code Scanner page
 */
export default function ScanQRCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/connection/scan');
    }

    // Log user information if authenticated
    if (status === 'authenticated' && session) {
      console.log(`User ${session.user.name || session.user.email} accessing QR scanner`);
    }
  }, [status, router, session]);

  const handleScan = async (slug) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate the slug format
      if (!slug || typeof slug !== 'string') {
        throw new Error('Invalid QR code');
      }

      // Check if this is a valid profile
      const response = await fetch(`/api/connect/${slug}/check`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid connection profile');
      }

      // If valid, redirect to the profile page
      setScanSuccess(true);
      setTimeout(() => {
        router.push(`/connect/${slug}`);
      }, 1000);
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError(err.message || 'Failed to process QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Display loading while checking authentication
  if (status === 'loading') {
    return (
      <>
        <PageHeader
          title="Scan QR Code"
          icon={<QrCodeScannerIcon sx={{ fontSize: 'inherit' }} />}
          subtitle="Scan another member's QR code to connect"
          fullWidth
        />
        <Container sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Scan QR Code"
        icon={<QrCodeScannerIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Scan another member's QR code to connect"
        fullWidth
      />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            href="/profile/connection"
            startIcon={<ArrowBackIcon />}
          >
            Back to Profile
          </Button>
        </Box>

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Scan a Recovery Connection QR Code
          </Typography>

          <Typography variant="body1" paragraph>
            Point your camera at another member's QR code to connect with them.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {scanSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              QR code scanned successfully! Redirecting...
            </Alert>
          )}

          <Box sx={{ maxWidth: 400, mx: 'auto', my: 3 }}>
            <QRScanner onScan={handleScan} />
          </Box>

          <Typography variant="body2" color="text.secondary">
            When you scan a valid QR code, you'll be taken to that member's profile where you can request to connect.
          </Typography>
        </Paper>
      </Container>
    </>
  );
}