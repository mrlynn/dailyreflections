'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  InputAdornment,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';

/**
 * Qualifications step form
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when form data changes
 */
export default function QualificationsStep({ formData, onChange }) {
  // Sobriety duration options
  const sobrietyOptions = [
    { value: "less than 1 year", label: "Less than 1 year" },
    { value: "1-2 years", label: "1-2 years" },
    { value: "2-5 years", label: "2-5 years" },
    { value: "5-10 years", label: "5-10 years" },
    { value: "10+ years", label: "10+ years" }
  ];

  // Available hours options
  const hoursOptions = [
    { value: "1-3 hours", label: "1-3 hours per week" },
    { value: "4-6 hours", label: "4-6 hours per week" },
    { value: "7-10 hours", label: "7-10 hours per week" },
    { value: "10+ hours", label: "10+ hours per week" }
  ];

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  // Handle radio button changes
  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    const boolValue = value === "true";
    onChange({ [name]: boolValue });
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Volunteer Qualifications
      </Typography>

      <Typography variant="body1" paragraph color="text.secondary">
        To ensure effective support for our community members, we need to understand your experience and availability.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <TextField
              select
              fullWidth
              label="Length of Sobriety"
              name="sobrietyDuration"
              value={formData.sobrietyDuration || ''}
              onChange={handleChange}
              required
              helperText="Time in continuous sobriety"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTimeIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em>Select an option</em>
              </MenuItem>
              {sobrietyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <TextField
              select
              fullWidth
              label="Available Hours"
              name="availableHoursPerWeek"
              value={formData.availableHoursPerWeek || ''}
              onChange={handleChange}
              required
              helperText="How much time can you commit each week?"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkHistoryIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em>Select an option</em>
              </MenuItem>
              {hoursOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Do you have previous listening or support experience?</FormLabel>
            <RadioGroup
              row
              name="hasListeningExperience"
              value={formData.hasListeningExperience.toString()}
              onChange={handleRadioChange}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
            <FormHelperText>
              This can include formal or informal experience supporting others
            </FormHelperText>
          </FormControl>
        </Grid>

        {formData.hasListeningExperience && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              label="Please describe your listening or support experience"
              name="listeningExperienceDetails"
              value={formData.listeningExperienceDetails || ''}
              onChange={handleChange}
              placeholder="Include any relevant experience helping others, whether professional, volunteer, or personal."
              helperText="Briefly describe your relevant experience"
            />
          </Grid>
        )}
      </Grid>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Note: Our volunteer guidelines require a minimum of one year of continuous sobriety to serve as a volunteer listener.
        </Typography>
      </Box>
    </>
  );
}