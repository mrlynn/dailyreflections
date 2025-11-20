'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormHelperText,
  Link as MuiLink,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Component for collecting and validating phone numbers for SMS integration
 *
 * @param {Object} props
 * @param {string} props.initialValue - Initial phone number if one exists
 * @param {function} props.onSave - Function to call when a valid phone number is saved
 * @param {boolean} props.disabled - Whether the input is disabled
 */
export default function PhoneNumberInput({ initialValue = '', onSave, disabled = false }) {
  const [phoneNumber, setPhoneNumber] = useState(initialValue || '');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Format phone number as user types
  useEffect(() => {
    if (!phoneNumber) {
      setFormattedPhone('');
      setIsValid(false);
      return;
    }

    // Strip all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Format phone number as (XXX) XXX-XXXX
    let formatted = digitsOnly;
    if (digitsOnly.length > 0) {
      formatted = digitsOnly.replace(/(\d{0,3})(\d{0,3})(\d{0,4})/, (_, a, b, c) => {
        let output = '';
        if (a) output += `(${a}`;
        if (b) output += `) ${b}`;
        if (c) output += `-${c}`;
        return output;
      });
    }

    setFormattedPhone(formatted);

    // Validate phone number (10 digits for US numbers)
    setIsValid(digitsOnly.length === 10);

    if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
    } else {
      setError('');
    }
  }, [phoneNumber]);

  const handleChange = (event) => {
    setPhoneNumber(event.target.value);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!isValid) return;

    try {
      setSaving(true);
      setError('');

      // Strip all non-digit characters for storage
      const digitsOnly = phoneNumber.replace(/\D/g, '');

      // Call the save function passed from the parent component
      await onSave(digitsOnly);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save phone number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Phone number saved successfully
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <TextField
          label="Phone Number"
          value={formattedPhone}
          onChange={handleChange}
          disabled={disabled || saving}
          fullWidth
          placeholder="(555) 123-4567"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: isValid && !saving && (
              <InputAdornment position="end">
                <CheckCircleIcon color="success" fontSize="small" />
              </InputAdornment>
            )
          }}
          error={!!error}
          helperText={error || ''}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!isValid || disabled || saving}
          sx={{ mt: 1 }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
        </Button>
      </Box>

      <FormHelperText sx={{ mt: 1, color: 'text.secondary' }}>
        By providing your phone number, you agree to receive SMS messages from AA Companion, including
        daily reflections and reminders. Message frequency may vary (typically 1 per day). Message &amp;
        data rates may apply. View our{' '}
        <MuiLink
          component={Link}
          href="/legal/terms"
          target="_blank"
          rel="noopener"
          underline="always"
          color="inherit"
        >
          Terms of Service
        </MuiLink>{' '}
        and{' '}
        <MuiLink
          component={Link}
          href="/legal/privacy"
          target="_blank"
          rel="noopener"
          underline="always"
          color="inherit"
        >
          Privacy Policy
        </MuiLink>
        . Reply STOP to unsubscribe or HELP for help.
      </FormHelperText>
    </Box>
  );
}