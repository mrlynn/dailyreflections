'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  FormGroup,
  FormHelperText,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AvailabilityToggle from '@/components/Volunteer/AvailabilityToggle';
import VolunteerPageHeader from '@/components/Volunteer/VolunteerPageHeader';

/**
 * Settings page for volunteers
 */
export default function VolunteerSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    preferredName: '',
    bio: '',
    notifications: {
      email: true,
      browser: true,
      newRequests: true,
      feedback: true
    },
    availability: {
      isActive: false,
      autoOfflineAfter: 60 // minutes
    }
  });

  // Fetch volunteer settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch volunteer status for current availability
      const statusResponse = await fetch('/api/volunteers/status');
      if (!statusResponse.ok) {
        throw new Error('Failed to fetch volunteer status');
      }
      const statusData = await statusResponse.json();

      // Fetch volunteer profile/settings
      // This is a placeholder - you would need to create this API
      const profileResponse = await fetch('/api/volunteers/profile');

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();

        // Merge data into settings
        setSettings({
          preferredName: profileData.preferredName || session?.user?.name || '',
          bio: profileData.bio || '',
          notifications: {
            email: profileData.notifications?.email !== false,
            browser: profileData.notifications?.browser !== false,
            newRequests: profileData.notifications?.newRequests !== false,
            feedback: profileData.notifications?.feedback !== false
          },
          availability: {
            isActive: statusData.isActive || false,
            autoOfflineAfter: profileData.availability?.autoOfflineAfter || 60
          }
        });
      } else {
        // If no profile exists yet, use default values with user name
        setSettings({
          ...settings,
          preferredName: session?.user?.name || '',
          availability: {
            ...settings.availability,
            isActive: statusData.isActive || false
          }
        });
      }
    } catch (err) {
      console.error('Error fetching volunteer settings:', err);
      setError(err.message || 'Failed to fetch volunteer settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchSettings();
    }
  }, [session]);

  // Handle form input changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setSettings({
      ...settings,
      [field]: value
    });
  };

  // Handle nested notification setting changes
  const handleNotificationChange = (field) => (event) => {
    const value = event.target.checked;
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value
      }
    });
  };

  // Handle availability toggle
  const handleAvailabilityToggle = (isActive) => {
    setSettings({
      ...settings,
      availability: {
        ...settings.availability,
        isActive
      }
    });
  };

  // Handle availability timeout change
  const handleAvailabilityTimeoutChange = (event) => {
    const value = parseInt(event.target.value) || 60;
    setSettings({
      ...settings,
      availability: {
        ...settings.availability,
        autoOfflineAfter: value
      }
    });
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Save profile settings
      // This is a placeholder - you would need to create this API
      const profileResponse = await fetch('/api/volunteers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredName: settings.preferredName,
          bio: settings.bio,
          notifications: settings.notifications,
          availability: {
            autoOfflineAfter: settings.availability.autoOfflineAfter
          }
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <VolunteerPageHeader
        title="Volunteer Settings"
        action={
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSaveSettings}
            disabled={isSaving}
            startIcon={<SaveIcon />}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profile settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Preferred Name"
              value={settings.preferredName}
              onChange={handleChange('preferredName')}
              helperText="The name shown to users during chat sessions"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              value={settings.bio}
              onChange={handleChange('bio')}
              multiline
              rows={4}
              helperText="Tell users a bit about yourself (optional)"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Availability settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Availability Settings
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography>
            Current Status
          </Typography>
          <AvailabilityToggle
            isActive={settings.availability.isActive}
            onChange={handleAvailabilityToggle}
            size="large"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="body1" gutterBottom>
            Automatic Offline
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                type="number"
                label="Go offline after inactivity (minutes)"
                value={settings.availability.autoOfflineAfter}
                onChange={handleAvailabilityTimeoutChange}
                fullWidth
                inputProps={{ min: 15, max: 240 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormHelperText>
                You'll automatically go offline if there's no activity for this amount of time
              </FormHelperText>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Notification settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Notification Settings
          </Typography>
        </Box>

        <FormControl component="fieldset" variant="standard">
          <FormGroup>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={handleNotificationChange('email')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormHelperText>
                  Receive email notifications for important updates
                </FormHelperText>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.browser}
                      onChange={handleNotificationChange('browser')}
                    />
                  }
                  label="Browser Notifications"
                />
                <FormHelperText>
                  Receive browser notifications when the app is open
                </FormHelperText>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.newRequests}
                      onChange={handleNotificationChange('newRequests')}
                    />
                  }
                  label="New Chat Requests"
                />
                <FormHelperText>
                  Get notified when new chat requests are waiting
                </FormHelperText>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.feedback}
                      onChange={handleNotificationChange('feedback')}
                    />
                  }
                  label="Feedback Notifications"
                />
                <FormHelperText>
                  Get notified when you receive feedback on your sessions
                </FormHelperText>
              </Grid>
            </Grid>
          </FormGroup>
        </FormControl>
      </Paper>

      {/* Save button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSaveSettings}
          disabled={isSaving}
          startIcon={<SaveIcon />}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Success message */}
      <Snackbar
        open={success !== null}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        message={success}
      />
    </Box>
  );
}