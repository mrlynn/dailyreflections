'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Component for setting and managing sobriety date
 */
export default function SobrietyDatePicker({
  sobrietyDate,
  onSave,
  onRemove,
  readOnly = false
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    sobrietyDate ? new Date(sobrietyDate) : null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Open date picker dialog
  const handleOpen = () => {
    setSelectedDate(sobrietyDate ? new Date(sobrietyDate) : null);
    setError('');
    setOpen(true);
  };

  // Close date picker dialog
  const handleClose = () => {
    setOpen(false);
  };

  // Handle date change from date picker
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setError('');
  };

  // Save new sobriety date
  const handleSave = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate date isn't in the future
      const currentDate = new Date();
      if (selectedDate > currentDate) {
        setError('Sobriety date cannot be in the future');
        setLoading(false);
        return;
      }

      await onSave(selectedDate ? selectedDate.toISOString() : null);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save sobriety date');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing the sobriety date
  const handleRemove = async () => {
    try {
      setLoading(true);
      await onRemove();
      setConfirmDeleteOpen(false);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to remove sobriety date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!readOnly && (
        <Button
          startIcon={<CalendarMonthIcon />}
          variant="outlined"
          onClick={handleOpen}
          size="medium"
        >
          {sobrietyDate ? 'Edit Sobriety Date' : 'Set Sobriety Date'}
        </Button>
      )}

      {/* Date picker dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          {sobrietyDate ? 'Edit Sobriety Date' : 'Set Sobriety Date'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="body2" paragraph sx={{ mb: 2 }}>
            Please select your sobriety date. This is typically the last day you had a drink or used substances.
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Sobriety Date"
              value={selectedDate}
              onChange={handleDateChange}
              disableFuture
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  helperText: "Select your sobriety start date"
                }
              }}
              sx={{ my: 2 }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 2 }}>
            {sobrietyDate && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDeleteOpen(true)}
                color="error"
                disabled={loading}
              >
                Remove
              </Button>
            )}
            <Box>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={loading || !selectedDate}
                sx={{ ml: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Remove Sobriety Date</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove your sobriety date? This will reset your sobriety counter.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleRemove} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}