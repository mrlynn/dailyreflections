'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';

/**
 * Component for managing password protection on the 4th Step inventory
 */
export default function PasswordProtectionForm({
  isPasswordProtected = false,
  passwordHint = '',
  onSave,
  onCancel
}) {
  const [formData, setFormData] = useState({
    enableProtection: isPasswordProtected,
    password: '',
    confirmPassword: '',
    currentPassword: '',
    passwordHint: passwordHint || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear errors when user types
    if (error) setError('');
  };

  const handleToggleChange = (e) => {
    setFormData({
      ...formData,
      enableProtection: e.target.checked
    });

    // Clear errors when user changes protection status
    if (error) setError('');
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    } else if (field === 'currentPassword') {
      setShowCurrentPassword(!showCurrentPassword);
    }
  };

  const validateForm = () => {
    // If disabling protection and already protected, we need current password
    if (!formData.enableProtection && isPasswordProtected && !formData.currentPassword) {
      setError('Please enter your current password to remove protection');
      return false;
    }

    // If enabling protection, validate password
    if (formData.enableProtection) {
      if (!formData.password) {
        setError('Please enter a password');
        return false;
      }

      if (formData.password.length < 4) {
        setError('Password must be at least 4 characters');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      // If already protected, need current password
      if (isPasswordProtected && !formData.currentPassword) {
        setError('Please enter your current password');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // If removing password protection, show confirmation dialog
    if (isPasswordProtected && !formData.enableProtection) {
      setConfirmDialogOpen(true);
      return;
    }

    submitForm();
  };

  const submitForm = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare data for saving
      const passwordData = {
        password: formData.enableProtection ? formData.password : null,
        currentPassword: isPasswordProtected ? formData.currentPassword : null,
        passwordHint: formData.enableProtection ? formData.passwordHint : ''
      };

      await onSave(passwordData);
    } catch (err) {
      console.error('Error saving password settings:', err);
      setError(err.message || 'Failed to save password settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {formData.enableProtection ? (
            <LockIcon color="primary" sx={{ mr: 1 }} />
          ) : (
            <LockOpenIcon sx={{ mr: 1, color: 'text.secondary' }} />
          )}
          <Typography variant="h6">
            Password Protection
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Adding password protection provides an extra layer of privacy for your 4th Step inventory.
            You'll be prompted to enter this password each time you access your inventory.
          </Typography>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableProtection}
                    onChange={handleToggleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography fontWeight={500}>
                    {formData.enableProtection
                      ? "Enable password protection"
                      : "Password protection is disabled"}
                  </Typography>
                }
              />
            </Grid>

            {isPasswordProtected && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  variant="outlined"
                  required={true}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('currentPassword')}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            {formData.enableProtection && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={formData.enableProtection}
                    helperText="Minimum 4 characters"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('password')}
                            edge="end"
                            aria-label="toggle password visibility"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    variant="outlined"
                    required={formData.enableProtection}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                            edge="end"
                            aria-label="toggle password visibility"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password Hint (Optional)"
                    name="passwordHint"
                    value={formData.passwordHint}
                    onChange={handleInputChange}
                    variant="outlined"
                    helperText="A hint to help you remember your password. This will be visible without entering the password."
                    placeholder="Example: My sobriety date"
                  />
                </Grid>
              </>
            )}

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SecurityIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : formData.enableProtection ? 'Enable Password Protection' : 'Save Changes'}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Remove Password Protection?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to remove password protection from your 4th Step inventory?
            Anyone who has access to your account will be able to view your inventory without a password.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);
              submitForm();
            }}
            variant="contained"
            color="primary"
          >
            Remove Protection
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}