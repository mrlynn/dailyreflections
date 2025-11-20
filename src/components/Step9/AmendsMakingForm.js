'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  Paper,
  Alert,
  Snackbar,
  Divider,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';

export default function AmendsMakingForm({ inventoryId, onEntryAdded }) {
  // State for initial form data
  const [formData, setFormData] = useState({
    person: '',
    harmDone: '',
    amendStatus: 'not_started',
    priority: 'medium',
    planForAmends: '',
    plannedDate: null,
    amendsMethod: '',
    amendsDescription: '',
    outcome: '',
    followUpNeeded: false,
    followUpNotes: '',
    notes: ''
  });

  // State for Step 8 entries that can be imported
  const [step8Entries, setStep8Entries] = useState([]);
  const [selectedStep8Entry, setSelectedStep8Entry] = useState(null);
  const [importExpanded, setImportExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch Step 8 entries that could be imported
  useEffect(() => {
    async function fetchStep8Entries() {
      try {
        const response = await fetch('/api/step8/entries');

        if (!response.ok) {
          throw new Error('Failed to fetch Step 8 entries');
        }

        const data = await response.json();
        // Filter to only include entries with willingness status 'willing' or 'completed'
        const eligibleEntries = data.entries.filter(
          entry => ['willing', 'completed'].includes(entry.willingnessStatus)
        );
        setStep8Entries(eligibleEntries);
      } catch (error) {
        console.error('Error fetching Step 8 entries:', error);
        setError('Unable to load entries from Step 8. You can still add entries manually.');
      }
    }

    fetchStep8Entries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prevData => ({
      ...prevData,
      plannedDate: date
    }));
  };

  const handleImportEntry = (entry) => {
    setSelectedStep8Entry(entry);
    setFormData({
      ...formData,
      person: entry.person,
      harmDone: entry.harmDone,
      amendStatus: 'planned',
      priority: entry.priority || 'medium',
      planForAmends: entry.planForAmends || '',
      notes: entry.notes || '',
      stepEightEntryId: entry._id
    });
    setImportExpanded(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.person.trim() || !formData.harmDone.trim()) {
        throw new Error('Person name and harm done are required fields.');
      }

      // Submit to API
      const response = await fetch('/api/step9/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add entry to amends list');
      }

      // Success! Reset form and notify parent
      resetForm();
      setSuccess(true);
      if (onEntryAdded) {
        onEntryAdded();
      }
    } catch (err) {
      console.error('Error adding amends entry:', err);
      setError(err.message || 'Failed to add entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      person: '',
      harmDone: '',
      amendStatus: 'not_started',
      priority: 'medium',
      planForAmends: '',
      plannedDate: null,
      amendsMethod: '',
      amendsDescription: '',
      outcome: '',
      followUpNeeded: false,
      followUpNotes: '',
      notes: ''
    });
    setSelectedStep8Entry(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Make Amends Entry
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Record your progress in making direct amends as part of Step 9:
          "Made direct amends to such people wherever possible, except when to do so would injure them or others."
        </Typography>

        {/* Step 8 Import Section */}
        {step8Entries.length > 0 && (
          <Accordion
            expanded={importExpanded}
            onChange={() => setImportExpanded(!importExpanded)}
            sx={{ mb: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ImportContactsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography>Import from Step 8 Amends List</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a person from your Step 8 amends list to create an entry for making direct amends.
              </Typography>

              <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                {step8Entries.map((entry) => (
                  <Box
                    key={entry._id}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #e0e0e0',
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: selectedStep8Entry?._id === entry._id ? 'action.selected' : 'transparent'
                    }}
                    onClick={() => handleImportEntry(entry)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">{entry.person}</Typography>
                      <Chip
                        size="small"
                        label={entry.willingnessStatus === 'willing' ? 'Willing' : 'Completed'}
                        color={entry.willingnessStatus === 'willing' ? 'info' : 'success'}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" noWrap color="text.secondary">
                      {entry.harmDone}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                disabled={!selectedStep8Entry}
                onClick={() => setImportExpanded(false)}
              >
                {selectedStep8Entry ? `Use ${selectedStep8Entry.person}` : 'Select a person'}
              </Button>
            </AccordionDetails>
          </Accordion>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
            {/* Basic Information Section */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: -1 }}>
              Basic Information
            </Typography>
            <Divider />

            {/* Person Name */}
            <TextField
              label="Person Name *"
              name="person"
              value={formData.person}
              onChange={handleChange}
              fullWidth
              required
              helperText="Enter the name of the person to whom you are making amends"
            />

            {/* Harm Done */}
            <TextField
              label="Harm Done *"
              name="harmDone"
              value={formData.harmDone}
              onChange={handleChange}
              fullWidth
              required
              multiline
              rows={3}
              helperText="Describe the harm you caused this person"
            />

            <Grid container spacing={2}>
              {/* Priority */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  fullWidth
                  helperText="Select the priority level for making these amends"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Amends Status"
                  name="amendStatus"
                  value={formData.amendStatus}
                  onChange={handleChange}
                  fullWidth
                  helperText="Current status of making these amends"
                >
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="deferred">Deferred</MenuItem>
                  <MenuItem value="not_possible">Not Possible</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Planning Section */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: -1 }}>
              Planning
            </Typography>
            <Divider />

            {/* Plan for Amends */}
            <TextField
              label="Plan for Amends"
              name="planForAmends"
              value={formData.planForAmends}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              helperText="Describe your plan for making these amends"
            />

            <Grid container spacing={2}>
              {/* Planned Date */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Planned Date"
                  value={formData.plannedDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth helperText="When do you plan to make these amends?" />}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "When do you plan to make these amends?"
                    }
                  }}
                />
              </Grid>

              {/* Amends Method */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Amends Method"
                  name="amendsMethod"
                  value={formData.amendsMethod}
                  onChange={handleChange}
                  fullWidth
                  helperText="How do you plan to make these amends?"
                >
                  <MenuItem value="">Select a method</MenuItem>
                  <MenuItem value="in_person">In Person</MenuItem>
                  <MenuItem value="phone">Phone Call</MenuItem>
                  <MenuItem value="letter">Letter</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="indirect">Indirect Amends</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Execution & Outcome Section (only shown for completed amends) */}
            {formData.amendStatus === 'completed' && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: -1 }}>
                  Execution & Outcome
                </Typography>
                <Divider />

                {/* Amends Description */}
                <TextField
                  label="Amends Description"
                  name="amendsDescription"
                  value={formData.amendsDescription}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Describe how you made the amends and what you said/did"
                />

                {/* Outcome */}
                <TextField
                  label="Outcome"
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  helperText="Describe the outcome of making these amends"
                />

                {/* Follow Up Needed */}
                <FormControl component="fieldset" sx={{ my: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.followUpNeeded}
                        onChange={handleSwitchChange}
                        name="followUpNeeded"
                      />
                    }
                    label="Follow-up needed?"
                  />
                  <FormHelperText>Check if additional follow-up actions are needed</FormHelperText>
                </FormControl>

                {/* Follow Up Notes - only shown if follow-up is needed */}
                {formData.followUpNeeded && (
                  <TextField
                    label="Follow-up Notes"
                    name="followUpNotes"
                    value={formData.followUpNotes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="Describe any follow-up actions needed"
                  />
                )}
              </>
            )}

            {/* Additional Notes */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: -1 }}>
              Additional Information
            </Typography>
            <Divider />

            <TextField
              label="Additional Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              helperText="Any additional thoughts, reflections, or context"
            />

            {/* Form Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={resetForm}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                Save Amends
              </Button>
            </Box>
          </Box>
        </form>

        <Snackbar
          open={success}
          autoHideDuration={6000}
          onClose={() => setSuccess(false)}
          message="Amends entry saved successfully"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        />
      </Paper>
    </LocalizationProvider>
  );
}