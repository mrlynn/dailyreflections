'use client';

import { useState } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const PIN_STORAGE_KEY = 'privacyLockPIN';
const LOCK_ENABLED_KEY = 'privacyLockEnabled';

export default function PrivacyLock({ enabled, onToggle }) {
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleToggle = (event) => {
    if (event.target.checked) {
      // Enabling - need to set up PIN
      setPinDialogOpen(true);
      setPin('');
      setConfirmPin('');
      setError('');
      setIsSettingUp(true);
    } else {
      // Disabling - completely turn off and clean up all stored data
      if (typeof window !== 'undefined') {
        // Remove both the PIN and the enabled flag
        localStorage.removeItem(PIN_STORAGE_KEY);
        localStorage.removeItem(LOCK_ENABLED_KEY);
        // Also remove session storage keys that might be causing persistence
        sessionStorage.removeItem('privacyLockUnlocked');
        sessionStorage.removeItem('privacyLockUnlockedAt');
        sessionStorage.removeItem('privacyLockLockoutUntil');

        console.log('Privacy lock disabled and all related storage cleared');
      }
      onToggle(false);
    }
  };

  const handleSetPIN = () => {
    setError('');

    // Validate PIN
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    // Store PIN (in a real app, this should be hashed)
    // For now, we store it in plain text in localStorage
    // In production, consider hashing with a library like bcryptjs
    if (typeof window !== 'undefined') {
      localStorage.setItem(PIN_STORAGE_KEY, pin);
      localStorage.setItem(LOCK_ENABLED_KEY, 'true');
      
      // Immediately lock the app after setting PIN
      // User will need to enter PIN to continue
      window.location.reload();
    }

    setPinDialogOpen(false);
    setPin('');
    setConfirmPin('');
    onToggle(true);
  };

  const handleCancel = () => {
    setPinDialogOpen(false);
    setPin('');
    setConfirmPin('');
    setError('');
    setIsSettingUp(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={handleToggle} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {enabled ? (
                <LockIcon color="primary" />
              ) : (
                <LockOpenIcon />
              )}
              <Typography variant="body1">
                {enabled ? 'Privacy lock enabled' : 'Enable privacy lock'}
              </Typography>
            </Box>
          }
        />
      </Box>

      {enabled && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Your app sessions are protected with a PIN. You'll be prompted to enter your PIN when
          opening the app.
        </Alert>
      )}

      <Dialog open={pinDialogOpen} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Set Privacy Lock PIN</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a 4-digit PIN to protect your app sessions. You'll need to enter this PIN when
            opening the app.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Enter 4-digit PIN"
            type="password"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(value);
              setError('');
            }}
            inputProps={{ maxLength: 4, inputMode: 'numeric' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm PIN"
            type="password"
            value={confirmPin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setConfirmPin(value);
              setError('');
            }}
            inputProps={{ maxLength: 4, inputMode: 'numeric' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            onClick={handleSetPIN}
            variant="contained"
            disabled={pin.length !== 4 || confirmPin.length !== 4}
          >
            Set PIN
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

