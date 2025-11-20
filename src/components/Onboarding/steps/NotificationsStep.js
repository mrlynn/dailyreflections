'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormGroup,
  Switch,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Alert,
  Stack,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AlarmIcon from '@mui/icons-material/Alarm';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Notifications Step Component
 * Second step in onboarding - configure notification preferences
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when data changes
 */
export default function NotificationsStep({ formData, onChange }) {
  const [notifications, setNotifications] = useState({
    enabled: formData.notifications?.enabled || false,
    morningTime: formData.notifications?.morningTime || '07:00',
    eveningTime: formData.notifications?.eveningTime || '21:00',
    channels: {
      app: formData.notifications?.channels?.app !== false,
      email: formData.notifications?.channels?.email || false,
      sms: formData.notifications?.channels?.sms || false,
    },
    email: formData.notifications?.email || '',
    phoneNumber: formData.notifications?.phoneNumber || '',
  });

  // When notification preferences change, update state and form data
  const handleChange = (event) => {
    const { name, value, checked } = event.target;

    if (name.startsWith('channels.')) {
      // Handle channel toggles
      const channelName = name.split('.')[1];
      const updatedNotifications = {
        ...notifications,
        channels: {
          ...notifications.channels,
          [channelName]: checked
        }
      };
      setNotifications(updatedNotifications);
      onChange({ notifications: updatedNotifications });
    } else if (name === 'enabled') {
      // Handle master toggle
      const updatedNotifications = {
        ...notifications,
        enabled: checked
      };
      setNotifications(updatedNotifications);
      onChange({ notifications: updatedNotifications });
    } else {
      // Handle other fields (select dropdowns, text inputs)
      const updatedNotifications = {
        ...notifications,
        [name]: value
      };
      setNotifications(updatedNotifications);
      onChange({ notifications: updatedNotifications });
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Notification Preferences
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: 3 }}>
        Set up your daily notifications to help stay consistent with your reflection practice.
      </Typography>

      <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={notifications.enabled}
              onChange={handleChange}
              name="enabled"
              color="primary"
            />
          }
          label="Enable notifications"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Receive timely reminders for daily reflections and evening inventory.
        </Typography>
      </FormControl>

      {notifications.enabled && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="morning-time-label">Morning Reflection</InputLabel>
                <Select
                  labelId="morning-time-label"
                  id="morning-time"
                  value={notifications.morningTime}
                  onChange={handleChange}
                  name="morningTime"
                  label="Morning Reflection"
                  startAdornment={
                    <InputAdornment position="start">
                      <AlarmIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="05:00">5:00 AM</MenuItem>
                  <MenuItem value="06:00">6:00 AM</MenuItem>
                  <MenuItem value="07:00">7:00 AM</MenuItem>
                  <MenuItem value="08:00">8:00 AM</MenuItem>
                  <MenuItem value="09:00">9:00 AM</MenuItem>
                  <MenuItem value="10:00">10:00 AM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="evening-time-label">Evening Inventory</InputLabel>
                <Select
                  labelId="evening-time-label"
                  id="evening-time"
                  value={notifications.eveningTime}
                  onChange={handleChange}
                  name="eveningTime"
                  label="Evening Inventory"
                  startAdornment={
                    <InputAdornment position="start">
                      <AlarmIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="19:00">7:00 PM</MenuItem>
                  <MenuItem value="20:00">8:00 PM</MenuItem>
                  <MenuItem value="21:00">9:00 PM</MenuItem>
                  <MenuItem value="22:00">10:00 PM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Notification Methods
          </Typography>

          <FormGroup sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifications.channels.app}
                  onChange={handleChange}
                  name="channels.app"
                />
              }
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <NotificationsActiveIcon fontSize="small" />
                  <Typography>In-App Notifications</Typography>
                </Stack>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifications.channels.email}
                  onChange={handleChange}
                  name="channels.email"
                />
              }
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon fontSize="small" />
                  <Typography>Email Notifications</Typography>
                </Stack>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifications.channels.sms}
                  onChange={handleChange}
                  name="channels.sms"
                />
              }
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <SmsIcon fontSize="small" />
                  <Typography>SMS Notifications</Typography>
                </Stack>
              }
            />
          </FormGroup>

          {notifications.channels.email && (
            <TextField
              fullWidth
              label="Email for Notifications"
              name="email"
              value={notifications.email}
              onChange={handleChange}
              type="email"
              placeholder="your@email.com"
              variant="outlined"
              sx={{ mb: 3 }}
              helperText="We'll use this email for notification messages"
            />
          )}

          {notifications.channels.sms && (
            <Alert severity="info" sx={{ mb: 3 }}>
              SMS settings can be configured in your profile after onboarding.
              You'll need to verify your phone number to receive SMS notifications.
            </Alert>
          )}
        </>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          You can always change these settings later from your profile.
        </Typography>
      </Box>
    </Box>
  );
}