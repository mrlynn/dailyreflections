'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Box,
  IconButton,
  Collapse
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * MeetingEntryForm Component
 * Form for logging meeting attendance
 */
export default function MeetingEntryForm({ open, onClose, onSubmit, initialData }) {
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState('in-person');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('');
  const [partOf90in90, setPart90in90] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Load initial data when editing an existing meeting
  useEffect(() => {
    if (initialData) {
      setDate(new Date(initialData.date));
      setType(initialData.type || 'in-person');
      setName(initialData.name || '');
      setNotes(initialData.notes || '');
      setFormat(initialData.format || '');
      setPart90in90(initialData.partOf90in90 !== false);
      setShowDetails(true); // Expand details when editing
    }
  }, [initialData]);

  // Meeting types and formats
  const meetingTypes = [
    { value: 'in-person', label: 'In-Person' },
    { value: 'online', label: 'Online' },
    { value: 'phone', label: 'Phone' },
    { value: 'other', label: 'Other' }
  ];

  const meetingFormats = [
    { value: 'speaker', label: 'Speaker Meeting' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'big-book', label: 'Big Book Study' },
    { value: 'step-study', label: 'Step Study' },
    { value: 'topic', label: 'Topic Meeting' },
    { value: 'meditation', label: 'Meditation Meeting' },
    { value: 'beginner', label: 'Beginners Meeting' },
    { value: 'other', label: 'Other' }
  ];

  // Toggle detailed form
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Handle quick submit
  const handleQuickSubmit = () => {
    onSubmit({
      date,
      type: 'in-person',
      partOf90in90: true
    });
    resetForm();
  };

  // Handle full form submit
  const handleSubmit = () => {
    onSubmit({
      date,
      type,
      name,
      notes,
      format,
      partOf90in90
    });
    resetForm();
  };

  // Reset form values
  const resetForm = () => {
    setDate(new Date());
    setType('in-person');
    setName('');
    setNotes('');
    setFormat('');
    setPart90in90(true);
    setShowDetails(false);
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Log a Meeting
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Meeting Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              maxDate={new Date()}
              sx={{ width: '100%', mt: 1 }}
            />
          </LocalizationProvider>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {showDetails ? 'Hide' : 'Show'} additional details
            </Typography>
            <IconButton onClick={toggleDetails} size="small">
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showDetails}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Meeting Type</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    label="Meeting Type"
                  >
                    {meetingTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Meeting Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  margin="normal"
                  placeholder="Optional: Enter meeting name"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Meeting Format</InputLabel>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    label="Meeting Format"
                  >
                    <MenuItem value="">
                      <em>Not specified</em>
                    </MenuItem>
                    {meetingFormats.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Optional: Add personal notes about this meeting"
                />
              </Grid>
            </Grid>
          </Collapse>

          <FormControlLabel
            control={
              <Checkbox
                checked={partOf90in90}
                onChange={(e) => setPart90in90(e.target.checked)}
                color="primary"
              />
            }
            label="Count toward 90 in 90 challenge"
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        {!showDetails && (
          <Button
            onClick={handleQuickSubmit}
            color="primary"
            variant="contained"
            fullWidth
          >
            Log Today's Meeting
          </Button>
        )}

        {showDetails && (
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            fullWidth
          >
            Save Meeting Details
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}