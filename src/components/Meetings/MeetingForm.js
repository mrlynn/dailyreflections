'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Divider,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useRouter } from 'next/navigation';

// Meeting types based on the Meeting Guide format
const MEETING_TYPES = [
  { value: 'O', label: 'Open' },
  { value: 'C', label: 'Closed' },
  { value: 'B', label: 'Beginners' },
  { value: 'SP', label: 'Speaker' },
  { value: 'D', label: 'Discussion' },
  { value: 'ST', label: 'Step Study' },
  { value: 'LIT', label: 'Literature' },
  { value: 'BB', label: 'Big Book' },
  { value: 'H', label: 'Birthday' },
  { value: 'M', label: 'Men' },
  { value: 'W', label: 'Women' },
  { value: 'Y', label: 'Young People' },
  { value: 'LGBTQ', label: 'LGBTQ+' },
  { value: 'MED', label: 'Meditation' },
  { value: 'ONL', label: 'Online' },
];

// Days of the week
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// Convert a time string to 24h format (HH:MM)
const formatTime = (timeString) => {
  if (!timeString) return '';

  // If already in HH:MM format, return as is
  if (/^[0-9]{1,2}:[0-9]{2}$/.test(timeString)) {
    return timeString;
  }

  // Try to parse and format
  try {
    const date = new Date(`2000-01-01 ${timeString}`);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

/**
 * Meeting Form Component
 * Used for both creating and editing meetings
 */
export default function MeetingForm({ initialData, mode = 'create' }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    day: 0,
    time: '',
    end_time: '',
    location: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    latitude: '',
    longitude: '',
    group: '',
    notes: '',
    types: [],
    conference_url: '',
    conference_phone: '',
    active: true,
  });

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Format times to 24h format for input fields
      const formattedData = {
        ...initialData,
        time: formatTime(initialData.time),
        end_time: formatTime(initialData.end_time || ''),
      };
      setFormData(formattedData);
    }
  }, [initialData, mode]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch toggle
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle meeting types selection
  const handleTypesChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, types: newValue }));
  };

  // Handle day selection (single day or multiple days)
  const handleDayChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, day: newValue }));
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: mode === 'create' ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveError(null);

    try {
      const url = mode === 'edit'
        ? `/api/admin/meetings/${initialData.slug}`
        : '/api/admin/meetings';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save meeting');
      }

      // Redirect to meetings list on success
      router.push('/admin/meetings');
    } catch (error) {
      console.error('Error saving meeting:', error);
      setSaveError(error.message || 'Failed to save meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Basic Information" />
          <Tab label="Location" />
          <Tab label="Online Access" />
          <Tab label="Additional Info" />
        </Tabs>

        {/* Basic Information Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Meeting Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                required
                fullWidth
                label="Meeting Name"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                helperText="The name of the meeting (e.g., 'Sunday Serenity')"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                helperText="URL-friendly identifier (auto-generated)"
                disabled={mode === 'edit'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                id="day-select"
                options={DAYS_OF_WEEK}
                getOptionLabel={(option) => option.label}
                value={DAYS_OF_WEEK.filter(day =>
                  Array.isArray(formData.day)
                    ? formData.day.includes(day.value)
                    : formData.day === day.value
                )}
                onChange={handleDayChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Day(s) of Week"
                    required
                    helperText="Select one or more days when this meeting occurs"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                required
                fullWidth
                label="Start Time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                helperText="24h format (HH:MM)"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="End Time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                helperText="Optional, 24h format"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="types-select"
                options={MEETING_TYPES}
                getOptionLabel={(option) => `${option.value} - ${option.label}`}
                value={MEETING_TYPES.filter(type => formData.types?.includes(type.value))}
                onChange={(e, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    types: newValue.map(item => item.value)
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Meeting Types"
                    helperText="Select all applicable meeting types"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={`${option.value} - ${option.label}`}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleSwitchChange}
                    name="active"
                  />
                }
                label="Meeting is active"
              />
              <FormHelperText>Inactive meetings won't appear in the public directory</FormHelperText>
            </Grid>
          </Grid>
        )}

        {/* Location Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Meeting Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Building/Location Name"
                name="location"
                value={formData.location}
                onChange={handleChange}
                helperText="Example: 'Community Center' or 'First Methodist Church'"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                helperText="Street address (leave empty for online-only meetings)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="State/Province"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                defaultValue="US"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                type="number"
                inputProps={{ step: 'any' }}
                helperText="Optional, for map display"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                type="number"
                inputProps={{ step: 'any' }}
                helperText="Optional, for map display"
              />
            </Grid>
          </Grid>
        )}

        {/* Online Access Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Online Access Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conference URL"
                name="conference_url"
                value={formData.conference_url || ''}
                onChange={handleChange}
                helperText="Zoom, Google Meet, or other online meeting URL"
                placeholder="https://zoom.us/j/123456789"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conference Phone"
                name="conference_phone"
                value={formData.conference_phone || ''}
                onChange={handleChange}
                helperText="Phone number for dial-in access"
                placeholder="1-555-555-5555"
              />
            </Grid>
          </Grid>
        )}

        {/* Additional Information Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Group Name"
                name="group"
                value={formData.group || ''}
                onChange={handleChange}
                helperText="Name of the group hosting the meeting (if applicable)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                multiline
                rows={4}
                helperText="Additional information about the meeting (e.g., 'Wheelchair accessible', 'Meeting in basement')"
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => router.push('/admin/meetings')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : mode === 'edit' ? (
            'Update Meeting'
          ) : (
            'Create Meeting'
          )}
        </Button>
      </Box>
    </Box>
  );
}