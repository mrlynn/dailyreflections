'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '@/components/PageHeader';
import QRCodeDisplay from '@/components/Connection/QRCodeDisplay';

/**
 * Full screen QR code page for connection profiles
 */
export default function ConnectionQRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/connection/qr');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/connection-profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      // If profile exists, set it
      if (data.exists) {
        setProfile(data.profile);
      } else {
        // Redirect to create profile
        router.push('/profile/connection');
      }
    } catch (err) {
      console.error('Error fetching connection profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Display loading while checking authentication
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <>
        <PageHeader
          title="Recovery Connection QR Code"
          icon={<QrCodeIcon sx={{ fontSize: 'inherit' }} />}
          subtitle="Share your connection profile with others"
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
        title="Recovery Connection QR Code"
        icon={<QrCodeIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Share your connection profile with others"
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

        {error && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {profile && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Scan to Connect with {profile.displayName}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Let others scan this code to view your recovery connection profile
            </Typography>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <QRCodeDisplay
                urlSlug={profile.urlSlug}
                primaryColor={profile.theme?.primaryColor}
                size={300}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
                mb: 6
              }}
            >
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // Download functionality is handled by the QRCodeDisplay component
                }}
              >
                Download QR Code
              </Button>

              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={() => {
                  // Share functionality is handled by the QRCodeDisplay component
                }}
              >
                Share Profile Link
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Profile URL: <strong>aacompanion.com/connect/{profile.urlSlug}</strong>
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}