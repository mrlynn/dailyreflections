'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import PublicProfile from '@/components/Connection/PublicProfile';

/**
 * Public connection profile page
 */
export default function ConnectionProfilePage() {
  const { slug } = useParams();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/connect/${slug}`, {
          credentials: 'include',  // Include cookies for authentication
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        setProfile(data.profile);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  const handleRequestConnection = async (userId, message) => {
    // Check if user is authenticated
    if (status !== 'authenticated') {
      throw new Error('You must be signed in to request a connection');
    }

    try {
      const response = await fetch('/api/connect/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Include cookies for authentication
        body: JSON.stringify({
          receiverId: userId,
          message: message || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send connection request');
      }

      return data;
    } catch (err) {
      console.error('Error sending connection request:', err);
      throw err;
    }
  };

  // If profile requires authentication but user isn't logged in
  if (profile?.visibility === 'authenticated' && status === 'unauthenticated') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Sign In Required
          </Typography>
          <Typography variant="body1" paragraph>
            This profile is only visible to authenticated users. Please sign in to view it.
          </Typography>
          <Button component={Link} href={`/login?callbackUrl=${encodeURIComponent(`/connect/${slug}`)}`} variant="contained">
            Sign In
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          Back to Home
        </Button>
      </Box>

      {status === 'loading' ? (
        <Alert severity="info">Loading authentication status...</Alert>
      ) : (
        <PublicProfile
          profile={profile}
          isLoading={isLoading}
          error={error}
          onRequestConnection={handleRequestConnection}
        />
      )}
    </Container>
  );
}