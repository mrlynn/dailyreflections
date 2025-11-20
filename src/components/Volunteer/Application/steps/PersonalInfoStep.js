'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';

/**
 * Personal Information form step
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when form data changes
 */
export default function PersonalInfoStep({ formData, onChange }) {
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>

      <Typography variant="body1" paragraph color="text.secondary">
        This information helps us create your volunteer profile. Your display name will be shown to users seeking support.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
            variant="outlined"
            placeholder="Your full name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>
            Your full name (private, only visible to admins)
          </FormHelperText>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Display Name"
            name="displayName"
            value={formData.displayName || ''}
            onChange={handleChange}
            required
            variant="outlined"
            placeholder="Name shown to others"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>
            This name will be visible to users in chat sessions
          </FormHelperText>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            variant="outlined"
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>
            Your account email (cannot be changed)
          </FormHelperText>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number (Optional)"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            variant="outlined"
            placeholder="For admin contact only"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>
            Optional - only for administrative contact
          </FormHelperText>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="General Location (Optional)"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            variant="outlined"
            placeholder="City, State/Province, Country"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>
            City/region only, not your full address
          </FormHelperText>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Time Zone"
            name="timezone"
            value={formData.timezone || ''}
            onChange={handleChange}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PublicIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>
            Your local time zone
          </FormHelperText>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Note: Your personal information is kept confidential and is only accessible to application reviewers and administrators.
        </Typography>
      </Box>
    </>
  );
}