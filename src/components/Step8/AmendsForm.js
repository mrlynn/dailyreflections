'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

export default function AmendsForm({ inventoryId, onEntryAdded }) {
  const [formData, setFormData] = useState({
    person: '',
    harmDone: '',
    willingnessStatus: 'not_willing',
    priority: 'medium',
    notes: '',
    planForAmends: '',
    potentialConsequences: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
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
      const response = await fetch('/api/step8/entries', {
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
      willingnessStatus: 'not_willing',
      priority: 'medium',
      notes: '',
      planForAmends: '',
      potentialConsequences: ''
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add Person to Amends List
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Add a person you have harmed and record details about the harm done.
        This is a key part of Step 8: "Made a list of all persons we had harmed,
        and became willing to make amends to them all."
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
          {/* Person Name */}
          <TextField
            label="Person Name *"
            name="person"
            value={formData.person}
            onChange={handleChange}
            fullWidth
            required
            helperText="Enter the name of the person you harmed"
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
            helperText="Describe how you harmed this person. Be specific and honest."
          />

          {/* Priority */}
          <TextField
            select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            fullWidth
            helperText="Select the priority level for making amends to this person"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>

          {/* Willingness Status */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Willingness to Make Amends</FormLabel>
            <RadioGroup
              name="willingnessStatus"
              value={formData.willingnessStatus}
              onChange={handleChange}
              row
            >
              <FormControlLabel value="not_willing" control={<Radio />} label="Not Willing Yet" />
              <FormControlLabel value="hesitant" control={<Radio />} label="Hesitant" />
              <FormControlLabel value="willing" control={<Radio />} label="Willing" />
              <FormControlLabel value="completed" control={<Radio />} label="Already Completed" />
            </RadioGroup>
          </FormControl>

          {/* Plan for Amends */}
          <TextField
            label="Plan for Amends"
            name="planForAmends"
            value={formData.planForAmends}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
            helperText="Optional: How do you plan to make amends to this person?"
          />

          {/* Potential Consequences */}
          <TextField
            label="Potential Consequences"
            name="potentialConsequences"
            value={formData.potentialConsequences}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
            helperText="Optional: Are there potential consequences of making these amends?"
          />

          {/* Additional Notes */}
          <TextField
            label="Additional Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
            helperText="Optional: Any additional thoughts or context"
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
              Add to List
            </Button>
          </Box>
        </Box>
      </form>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Person added to amends list"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Paper>
  );
}