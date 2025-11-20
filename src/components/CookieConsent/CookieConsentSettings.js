'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Stack,
  Divider,
  Alert,
  Collapse
} from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import Link from 'next/link';

export default function CookieConsentSettings() {
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  });
  const [saved, setSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load saved cookie preferences on component mount
  useEffect(() => {
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        if (parsedConsent.preferences) {
          setCookiePreferences(prevPreferences => ({
            ...prevPreferences,
            ...parsedConsent.preferences
          }));
          setSaved(true);
        }
      } catch (e) {
        // If parsing fails, keep default settings
        console.error('Error parsing saved cookie consent:', e);
      }
    }
  }, []);

  const handleChange = (event) => {
    setCookiePreferences({
      ...cookiePreferences,
      [event.target.name]: event.target.checked
    });
    setSaved(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: cookiePreferences
    }));

    setSaved(true);
    setShowSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleAllowAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      marketing: true
    };

    setCookiePreferences(allEnabled);
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: allEnabled
    }));

    setSaved(true);
    setShowSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = {
      necessary: true,
      analytics: false,
      marketing: false
    };

    setCookiePreferences(essentialOnly);
    localStorage.setItem('cookieConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      preferences: essentialOnly
    }));

    setSaved(true);
    setShowSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CookieIcon color="primary" sx={{ mr: 1.5 }} />
        <Typography variant="h6" component="h3" fontWeight={600}>
          Cookie Settings
        </Typography>
      </Box>

      <Collapse in={showSuccess}>
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setShowSuccess(false)}
        >
          Your cookie preferences have been saved successfully
        </Alert>
      </Collapse>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Control how we use cookies on this site. You can find more information in our{' '}
        <Link href="/legal/cookies" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Cookie Policy
        </Link>.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={cookiePreferences.necessary}
              disabled={true} // Always required
              name="necessary"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle2">Essential Cookies</Typography>
              <Typography variant="caption" color="text.secondary">Required for the website to function</Typography>
            </Box>
          }
          sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={cookiePreferences.analytics}
              onChange={handleChange}
              name="analytics"
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle2">Analytics Cookies</Typography>
              <Typography variant="caption" color="text.secondary">Help us improve our website by collecting anonymous information</Typography>
            </Box>
          }
          sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={cookiePreferences.marketing}
              onChange={handleChange}
              name="marketing"
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle2">Marketing Cookies</Typography>
              <Typography variant="caption" color="text.secondary">Used to deliver advertisements more relevant to you</Typography>
            </Box>
          }
          sx={{ display: 'flex', alignItems: 'flex-start' }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={handleRejectNonEssential}
          sx={{
            borderColor: 'rgba(0, 0, 0, 0.23)',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.38)',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
          size="small"
        >
          Essential Only
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleAllowAll}
          size="small"
        >
          Allow All
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSavePreferences}
          disableElevation
          size="small"
        >
          Save Preferences
        </Button>
      </Stack>

      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
        <PrivacyTipIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          We respect your privacy choices. Your settings are stored locally on your device.
        </Typography>
      </Box>
    </Paper>
  );
}