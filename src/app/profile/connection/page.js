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
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PageHeader from '@/components/PageHeader';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import ProfileEditor from '@/components/Connection/ProfileEditor';
import ProfileSetupWizard from '@/components/Connection/ProfileSetupWizard';
import QRScanner from '@/components/Connection/QRScanner';

/**
 * Connection profile management page
 */
export default function ConnectionProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/connection');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/connection-profile', {
        credentials: 'include', // Include cookies for authentication
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      // If profile exists, set it
      if (data.exists) {
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching connection profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/connection-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      setProfile(data.profile);
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Updating profile with data:', JSON.stringify(profileData, null, 2));
      console.log('Session status:', status);
      console.log('Session data:', session);

      const response = await fetch('/api/user/connection-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add explicit auth header as a backup
          'Authorization': `Bearer ${session?.user?.id || ''}`,
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(data.profile);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Display loading while checking authentication
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <>
        <PageHeader
          title="Recovery Connection"
          icon={<ConnectWithoutContactIcon sx={{ fontSize: 'inherit' }} />}
          subtitle="Manage your recovery connection profile for easy contact sharing"
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
        title="Recovery Connection"
        icon={<ConnectWithoutContactIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Manage your recovery connection profile for easy contact sharing"
        fullWidth
      />

      <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        {profile ? (
          <Box>
            {/* QR Code Quick Access - Visible at the top of the page */}
            <Paper elevation={2} sx={{ mb: 3, p: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ mb: { xs: 2, sm: 0 }, display: 'flex', alignItems: 'center' }}>
                <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    Your Connection QR Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Instantly share your recovery connection profile
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => router.push('/profile/connection/qr')}
                startIcon={<QrCodeIcon />}
                sx={{ fontWeight: 600, minWidth: 200 }}
              >
                Show QR Code
              </Button>
            </Paper>

            <Paper sx={{ mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Edit Profile" />
                <Tab label="Share" />
                <Tab label="Connections" />
              </Tabs>
            </Paper>

            {/* Edit Profile Tab */}
            {activeTab === 0 && (
              <ProfileEditor
                profile={profile}
                isLoading={isLoading}
                onUpdate={handleUpdateProfile}
                error={error}
              />
            )}

            {/* Share Tab */}
            {activeTab === 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Share Your Connection Profile
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  Share your recovery connection profile with others to exchange contact information easily.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'center', gap: 3, my: 4 }}>
                  {/* QR Code Preview */}
                  {profile.urlSlug && (
                    <Box
                      component={Link}
                      href={`/profile/connection/qr`}
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          maxWidth: 300,
                          mx: 'auto',
                          '&:hover': {
                            boxShadow: 4,
                          },
                        }}
                      >
                        <QrCodeIcon sx={{ fontSize: 100, color: 'primary.main' }} />
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                          View QR Code
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Show this code to others to connect
                        </Typography>
                        <Button
                          variant="contained"
                          sx={{ mt: 2 }}
                          startIcon={<QrCodeIcon />}
                        >
                          Open QR Code
                        </Button>
                      </Paper>
                    </Box>
                  )}

                  {/* QR Scanner Option */}
                  <Box
                    sx={{
                      display: 'block',
                      color: 'inherit',
                      mt: { xs: 3, md: 0 }
                    }}
                  >
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        maxWidth: 300,
                        mx: 'auto',
                        '&:hover': {
                          boxShadow: 4,
                        },
                      }}
                    >
                      <QrCodeScannerIcon sx={{ fontSize: 100, color: 'secondary.main' }} />
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Scan QR Code
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scan someone else's code to connect
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <QRScanner
                          onScan={(slug) => {
                            if (slug) {
                              window.location.href = `/connect/${slug}`;
                            }
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                </Box>

                {!profile.isEnabled && (
                  <Alert severity="warning" sx={{ mt: 3 }}>
                    Your profile is currently disabled. Enable it in the Edit Profile tab to allow others to connect with you.
                  </Alert>
                )}

                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Your Profile Link
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" component="code" sx={{ wordBreak: 'break-all' }}>
                      https://aacompanion.com/connect/{profile.urlSlug}
                    </Typography>
                  </Paper>
                  <Button
                    sx={{ mt: 2 }}
                    variant="outlined"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://aacompanion.com/connect/${profile.urlSlug}`);
                    }}
                  >
                    Copy Link
                  </Button>
                </Box>
              </Box>
            )}

            {/* Connections Tab */}
            {activeTab === 2 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Manage Your Connections
                </Typography>

                <Alert severity="info">
                  Connection management features coming soon! Here you'll be able to view, approve, and manage your recovery connections.
                </Alert>
              </Box>
            )}
          </Box>
        ) : (
          <Paper sx={{ p: 4 }}>
            <ProfileSetupWizard
              onComplete={handleCreateProfile}
              isLoading={isLoading}
              error={error}
            />
          </Paper>
        )}
      </Box>

      {/* Mobile-friendly floating QR code button - Visible only on mobile screens */}
      {profile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: { xs: 'block', md: 'none' }
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={() => router.push('/profile/connection/qr')}
            sx={{
              borderRadius: '50%',
              width: 64,
              height: 64,
              minWidth: 'unset',
              boxShadow: (theme) => theme.shadows[8]
            }}
            aria-label="Show QR Code"
          >
            <QrCodeIcon sx={{ fontSize: 32 }} />
          </Button>
        </Box>
      )}
    </>
  );
}