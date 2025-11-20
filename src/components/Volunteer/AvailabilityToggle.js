'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  CircularProgress,
  FormControl,
  FormGroup,
  FormHelperText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';

/**
 * Component for toggling volunteer availability status
 * @param {Object} props
 * @param {boolean} props.isActive - Current active status
 * @param {Function} props.onChange - Callback for when status changes
 * @param {string} [props.size="medium"] - Size of the toggle
 */
export default function AvailabilityToggle({ isActive, onChange, size = "medium" }) {
  const [open, setOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle opening the confirmation dialog
  const handleToggleClick = (event) => {
    const newStatus = event.target.checked;
    setTargetStatus(newStatus);

    // If turning off availability, show confirmation dialog
    if (!newStatus && isActive) {
      setOpen(true);
    } else {
      // Otherwise update status directly
      updateAvailability(newStatus);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    setTargetStatus(null);
  };

  // Handle confirmation
  const handleConfirm = () => {
    updateAvailability(targetStatus);
    setOpen(false);
  };

  // Update availability status via API
  const updateAvailability = async (status) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/volunteers/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: status })
      });

      if (!response.ok) {
        throw new Error('Failed to update availability status');
      }

      // Call onChange callback with new status
      if (onChange) {
        onChange(status);
      }

    } catch (err) {
      console.error('Error updating availability status:', err);
      setError(err.message || 'An error occurred while updating status');

      // Reset to previous status
      if (onChange) {
        onChange(isActive);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {size === "large" ? (
          <FormControl component="fieldset" variant="standard">
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={handleToggleClick}
                    disabled={isLoading}
                    color="success"
                    size="large"
                  />
                }
                label={
                  <Typography variant="h6">
                    {isActive ? 'Online' : 'Offline'}
                  </Typography>
                }
                labelPlacement="start"
              />
            </FormGroup>
            <FormHelperText>
              {isActive
                ? 'You are available to help users'
                : 'You are not visible to users seeking help'
              }
            </FormHelperText>
          </FormControl>
        ) : (
          <>
            <Chip
              icon={isActive ? <CheckCircleIcon /> : <PauseCircleFilledIcon />}
              label={isActive ? 'Online' : 'Offline'}
              color={isActive ? 'success' : 'default'}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={handleToggleClick}
                  disabled={isLoading}
                  color="success"
                />
              }
              label=""
            />
            {isLoading && <CircularProgress size={20} sx={{ ml: 1 }} />}
          </>
        )}
      </Box>

      {/* Confirmation dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="availability-dialog-title"
      >
        <DialogTitle id="availability-dialog-title">
          Go Offline?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to go offline? If you have any active chats, you'll still be able to complete them, but you won't receive new chat requests.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>Cancel</Button>
          <Button onClick={handleConfirm} color="primary">
            Go Offline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error message */}
      {error && (
        <FormHelperText error>{error}</FormHelperText>
      )}
    </>
  );
}