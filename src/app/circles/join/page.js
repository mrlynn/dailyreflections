'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function JoinCirclePage() {
  const circlesEnabled = useFeatureFlag('CIRCLES');
  const { data: session, status } = useSession();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);

  if (!circlesEnabled) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Circles Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Invite codes will work once circles are fully live.
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto' }}>
        <Card>
          <CardHeader
            avatar={<LoginIcon color="primary" />}
            title="Sign in to join a circle"
            subheader="You need an account to redeem an invite code."
          />
          <CardContent>
            <Stack direction="row" spacing={2}>
              <Button component={Link} href="/login" variant="contained">
                Sign In
              </Button>
              <Button component={Link} href="/register" variant="outlined">
                Create Account
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/circles/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to join circle');
      }

      const circleSlug = result.circle?.slug;
      const membershipStatus = result.membership?.status;

      if (membershipStatus === 'active') {
        setSuccess('Success! You are now a member of this circle.');
      } else if (membershipStatus === 'pending') {
        setSuccess('Request submitted. Circle admins will review and approve your membership.');
      } else {
        setSuccess('Invite accepted.');
      }

      if (circleSlug) {
        router.push(`/circles/${circleSlug}`);
      } else {
        router.push('/circles');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto' }}>
      <Stack spacing={3}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Back
        </Button>

        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Join a Circle
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Enter the invite token shared with you. Some invites are single-use; others allow multiple members.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField
                label="Invite token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                fullWidth
                helperText="Paste the full token or invite link you received."
              />

              <Button type="submit" variant="contained" startIcon={<LoginIcon />} disabled={submitting}>
                {submitting ? 'Joining…' : 'Join Circle'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

