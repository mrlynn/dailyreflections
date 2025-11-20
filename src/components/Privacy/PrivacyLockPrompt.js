'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const PIN_STORAGE_KEY = 'privacyLockPIN';

export default function PrivacyLockPrompt({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const inputRef = useRef(null);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Check if user is locked out
    const lockoutUntil = sessionStorage.getItem('privacyLockLockoutUntil');
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil, 10);
      const now = Date.now();
      if (now < lockoutTime) {
        setIsLocked(true);
        const remainingMinutes = Math.ceil((lockoutTime - now) / 60000);
        setError(`Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`);
      } else {
        // Lockout expired
        sessionStorage.removeItem('privacyLockLockoutUntil');
        setIsLocked(false);
        setAttempts(0);
      }
    }
  }, []);

  const handlePinChange = (value) => {
    if (isLocked) return;

    // Only allow digits, max 4 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');

    // Auto-submit when 4 digits are entered
    if (numericValue.length === 4) {
      handleSubmit(numericValue);
    }
  };

  const handleSubmit = (pinToCheck = pin) => {
    if (isLocked) return;
    if (pinToCheck.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    const success = onUnlock(pinToCheck);

    if (success) {
      // Success - clear attempts
      setAttempts(0);
      setPin('');
      setError('');
      sessionStorage.removeItem('privacyLockLockoutUntil');
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      
      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock out user
        const lockoutUntil = Date.now() + LOCKOUT_TIME;
        sessionStorage.setItem('privacyLockLockoutUntil', lockoutUntil.toString());
        setIsLocked(true);
        setError(`Too many failed attempts. Please try again in 5 minutes.`);
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }

      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={true}
      fullScreen
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          m: 0,
          borderRadius: 0,
          backgroundColor: '#f5f5f5',
        }
      }}
    >
      <DialogContent sx={{ 
        p: 4, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        <Box sx={{ mb: 4 }}>
          <LockIcon 
            sx={{ 
              fontSize: 80, 
              color: 'primary.main',
              mb: 3
            }} 
          />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
            Privacy Lock
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your 4-digit PIN to access the app
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity={isLocked ? 'warning' : 'error'} 
            sx={{ mb: 2, textAlign: 'left' }}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4, width: '100%', maxWidth: 400 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter PIN"
            inputProps={{
              maxLength: 4,
              inputMode: 'numeric',
              pattern: '[0-9]*',
              style: {
                textAlign: 'center',
                fontSize: '28px',
                letterSpacing: '12px',
                fontWeight: 600,
                padding: '16px',
              }
            }}
            disabled={isLocked}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '28px',
                height: '64px',
                backgroundColor: 'white',
                '& input': {
                  textAlign: 'center',
                  letterSpacing: '12px',
                }
              }
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPin(!showPin)}
                  edge="end"
                  sx={{ mr: 1 }}
                >
                  {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
          />
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          width: '100%',
          maxWidth: 400,
          mb: 2,
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              variant="outlined"
              onClick={() => {
                if (!isLocked && pin.length < 4) {
                  handlePinChange(pin + digit.toString());
                }
              }}
              disabled={isLocked || pin.length >= 4}
              sx={{
                minWidth: 'auto',
                width: '100%',
                aspectRatio: '1',
                fontSize: '24px',
                fontWeight: 600,
                backgroundColor: 'white',
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                },
                '&:disabled': {
                  borderColor: 'grey.300',
                }
              }}
            >
              {digit}
            </Button>
          ))}
        </Box>
        
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (!isLocked && pin.length < 4) {
                handlePinChange(pin + '0');
              }
            }}
            disabled={isLocked || pin.length >= 4}
            fullWidth
            sx={{
              height: 64,
              fontSize: '24px',
              fontWeight: 600,
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
              },
              '&:disabled': {
                borderColor: 'grey.300',
              }
            }}
          >
            0
          </Button>
        </Box>

        {isLocked && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            For security, access is temporarily locked after multiple failed attempts.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

