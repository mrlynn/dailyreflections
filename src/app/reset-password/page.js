'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : null;

  // Verify token on component mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError('Missing password reset token. Please check your reset link.');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || 'Invalid or expired reset token. Please request a new reset link.');
          setVerifying(false);
          return;
        }

        // Token is valid
        setTokenValid(true);
        setUserEmail(data.email);
        setVerifying(false);
      } catch (err) {
        console.error('Token verification error:', err);
        setError('An error occurred while verifying your reset token. Please try again.');
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Submit request to reset password API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password. Please try again.');
        setLoading(false);
        return;
      }

      // Password reset successful
      setSuccess(true);
      setLoading(false);

      // Automatically redirect to login page after success
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An error occurred while resetting your password. Please try again.');
      setLoading(false);
    }
  };

  // Render loading state while verifying token
  if (verifying) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Verifying reset token...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LockResetIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Reset Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!tokenValid && !error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            Invalid or expired reset token. Please request a new reset link.
          </Alert>
        )}

        {tokenValid && userEmail && !success && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Create a new password for <strong>{userEmail}</strong>
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </Box>
          </>
        )}

        {success && (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been successfully reset!
            </Alert>
            <Typography variant="body2" sx={{ mb: 3 }}>
              You will be redirected to the login page in a few seconds...
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        )}

        {!success && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <MuiLink component={Link} href="/login" underline="hover">
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading reset password form...
          </Typography>
        </Paper>
      </Container>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}