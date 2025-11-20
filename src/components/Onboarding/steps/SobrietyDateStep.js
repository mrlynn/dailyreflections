'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Sobriety Date Step Component
 * First step in the onboarding process - lets user select their sobriety date
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when data changes
 */
export default function SobrietyDateStep({ formData, onChange }) {
  const [date, setDate] = useState(formData.sobrietyDate ? new Date(formData.sobrietyDate) : null);
  const [timezone, setTimezone] = useState(formData.timezone || 'UTC');
  const [timezones, setTimezones] = useState([]);
  const [error, setError] = useState('');

  // Load available timezones
  useEffect(() => {
    // Get user's current timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Common timezones
    const commonTimezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Anchorage',
      'Pacific/Honolulu',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Australia/Sydney',
      'Asia/Tokyo',
      'Asia/Shanghai'
    ];

    // Ensure user timezone is in the list
    if (!commonTimezones.includes(userTimezone)) {
      commonTimezones.push(userTimezone);
    }

    // Format for display
    const formattedTimezones = commonTimezones.map(tz => {
      try {
        const offset = new Date().toLocaleString('en', { timeZone: tz, timeZoneName: 'short' })
          .split(' ').pop();

        return {
          value: tz,
          label: `${tz.replace('_', ' ').split('/')[1] || tz} (${offset})`,
          isUserTimezone: tz === userTimezone
        };
      } catch (e) {
        return { value: tz, label: tz, isUserTimezone: tz === userTimezone };
      }
    });

    // Sort with user timezone first
    formattedTimezones.sort((a, b) => {
      if (a.isUserTimezone) return -1;
      if (b.isUserTimezone) return 1;
      return a.label.localeCompare(b.label);
    });

    setTimezones(formattedTimezones);

    // Default to user timezone if none selected
    if (!formData.timezone) {
      setTimezone(userTimezone);
      onChange({ timezone: userTimezone });
    }
  }, [formData.timezone, onChange]);

  // When date changes, update form data
  const handleDateChange = (newDate) => {
    setDate(newDate);
    setError('');

    if (newDate && !isNaN(newDate.getTime())) {
      onChange({ sobrietyDate: newDate.toISOString() });
    }
  };

  // When timezone changes, update form data
  const handleTimezoneChange = (event) => {
    const newTimezone = event.target.value;
    setTimezone(newTimezone);
    onChange({ timezone: newTimezone });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Your Sobriety Date
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        Enter your sobriety date to track your progress and milestones. This helps us personalize your experience and celebrate your achievements.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Sobriety Date"
              value={date}
              onChange={handleDateChange}
              disableFuture
              sx={{ width: '100%' }}
              slotProps={{
                textField: {
                  helperText: "When did you begin your sobriety journey?",
                  error: !!error,
                }
              }}
            />
          </LocalizationProvider>
          {error && (
            <FormHelperText error>{error}</FormHelperText>
          )}
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="timezone-select-label">Your Time Zone</InputLabel>
            <Select
              labelId="timezone-select-label"
              id="timezone-select"
              value={timezone}
              label="Your Time Zone"
              onChange={handleTimezoneChange}
            >
              {timezones.map((tz) => (
                <MenuItem key={tz.value} value={tz.value}>
                  {tz.label} {tz.isUserTimezone ? '(Current)' : ''}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              This helps us send notifications at the right time for you
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Note: You can always update this information later from your profile settings.
        </Typography>
      </Box>
    </Box>
  );
}