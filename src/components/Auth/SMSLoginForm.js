'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import KeyIcon from '@mui/icons-material/Key';
import PhoneNumberInput from '@/components/SMS/PhoneNumberInput';

/**
 * SMS Login Form Component
 *
 * Provides a two-step SMS authentication flow:
 * 1. Enter phone number and request verification code
 * 2. Enter verification code to authenticate
 */
export default function SMSLoginForm({ onSuccess, onError, isLoading, setLoading }) {
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter code
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');

  // Request SMS verification code
  const handleRequestCode = async () => {
    // Clear any existing errors
    setError('');
    setPhoneError('');
    setLoading(true);

    try {
      // Format phone number (remove all non-digit characters)
      const formattedPhone = phoneNumber.replace(/\D/g, '');

      if (!formattedPhone || formattedPhone.length !== 10) {
        setPhoneError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      // Send API request to send verification code
      const response = await fetch('/api/auth/sms/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Move to step 2 (enter code)
      setStep(2);
      setSuccess('Verification code sent to your phone');
      setTimeout(() => setSuccess(''), 5000); // Clear success message after 5 seconds
    } catch (err) {
      console.error('Failed to request code:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify SMS code and sign in
  const handleVerifyCode = async () => {
    // Clear any existing errors
    setError('');
    setCodeError('');
    setLoading(true);

    try {
      if (!verificationCode || verificationCode.length < 4) {
        setCodeError('Please enter the verification code sent to your phone');
        setLoading(false);
        return;
      }

      // Format phone number (remove all non-digit characters)
      const formattedPhone = phoneNumber.replace(/\D/g, '');

      // Sign in with NextAuth SMS provider
      const result = await signIn('sms', {
        phoneNumber: formattedPhone,
        verificationCode,
        redirect: false,
      });

      if (result?.error) {
        setCodeError('Invalid verification code. Please try again.');
      } else if (result?.ok) {
        // Call onSuccess callback from parent component
        if (onSuccess) onSuccess(result);
      }
    } catch (err) {
      console.error('SMS login error:', err);
      setError('Authentication failed. Please try again.');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle phone number input from PhoneNumberInput component
  const handlePhoneNumberSave = (formattedPhone) => {
    setPhoneNumber(formattedPhone);
    return Promise.resolve(true);
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ width: '100%', mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {step === 1 ? (
        // Step 1: Enter phone number
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your phone number to receive a verification code
          </Typography>

          <PhoneNumberInput
            initialValue={phoneNumber}
            onSave={handlePhoneNumberSave}
            disabled={isLoading}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleRequestCode}
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Get Verification Code'
            )}
          </Button>
        </Box>
      ) : (
        // Step 2: Enter verification code
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the 6-digit verification code sent to your phone
          </Typography>

          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            error={!!codeError}
            helperText={codeError}
            placeholder="123456"
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <KeyIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setStep(1)}
              disabled={isLoading}
              sx={{ flex: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleVerifyCode}
              disabled={isLoading}
              sx={{ flex: 1 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}