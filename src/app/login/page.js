'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Typography,
  Alert,
  Divider,
  Button,
  Link,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { signIn } from 'next-auth/react';

// Import our custom authentication components
import EmailLoginForm from '@/components/Auth/EmailLoginForm';
import SMSLoginForm from '@/components/Auth/SMSLoginForm';
import LoginTabs from '@/components/Auth/LoginTabs';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if redirected from registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please sign in.');
    }
  }, [searchParams]);

  // Handle successful login from any method
  const handleLoginSuccess = (result) => {
    // Get callback URL from query params
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    // Redirect to callback URL or home
    router.push(callbackUrl);
    router.refresh();
  };

  // Handle login error from any method
  const handleLoginError = (err) => {
    console.error('Login error:', err);
    setError('An error occurred. Please try again.');
    setLoading(false);
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Get callback URL from query params
      const callbackUrl = searchParams.get('callbackUrl') || '/';

      await signIn('google', {
        callbackUrl,
      });
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

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
          <LockOutlinedIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back to Daily Reflections
        </Typography>

        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabbed interface for login methods */}
        <LoginTabs
          emailLoginComponent={
            <EmailLoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              isLoading={loading}
              setLoading={setLoading}
            />
          }
          smsLoginComponent={
            <SMSLoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              isLoading={loading}
              setLoading={setLoading}
            />
          }
        />

        <Divider sx={{ width: '100%', my: 3 }}>OR</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Continue with Google
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link href="/register" underline="hover" sx={{ color: 'primary.main' }}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default function LoginPage() {
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
          <Typography variant="body1">Loading...</Typography>
        </Paper>
      </Container>
    }>
      <LoginForm />
    </Suspense>
  );
}

