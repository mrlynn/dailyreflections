'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  Stack,
  Divider,
  Alert,
  Collapse,
  FormGroup,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Link as MuiLink,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';
import PhoneNumberInput from './PhoneNumberInput';

/**
 * Component for managing SMS notification preferences
 *
 * @param {Object} props
 * @param {string} props.initialPhoneNumber - Initial phone number if one exists
 * @param {Object} props.initialPreferences - Initial SMS preferences if they exist
 * @param {Object} props.verificationStatus - Status of phone number verification
 * @param {boolean} props.verificationStatus.verified - Whether the phone number is verified
 * @param {Date} props.verificationStatus.verificationSentAt - When verification was sent
 * @param {function} props.onSave - Function to call when preferences are saved
 * @param {boolean} props.disabled - Whether the inputs are disabled
 */
export default function SMSPreferences({
  initialPhoneNumber = '',
  initialPreferences = null,
  verificationStatus = { verified: false, verificationSentAt: null },
  onSave,
  disabled = false
}) {
  const defaultPreferences = {
    enabled: false,
    dailyReflection: true,
    step10Reminder: false,
    step4CheckIn: false,
    meetingReminders: false,
    quietHoursStart: '21:00', // 9:00 PM
    quietHoursEnd: '07:00',   // 7:00 AM
    dailyReflectionTime: '07:00', // 7:00 AM
    step10ReminderTime: '21:00',  // 9:00 PM
  };

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '');
  const [preferences, setPreferences] = useState(initialPreferences || defaultPreferences);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes when preferences or phone number are updated
  useEffect(() => {
    const phoneChanged = phoneNumber !== initialPhoneNumber;
    const prefsChanged = initialPreferences ?
      JSON.stringify(preferences) !== JSON.stringify(initialPreferences) :
      Object.values(preferences).some(val => val !== false && val !== null);

    setHasChanges(phoneChanged || prefsChanged);
  }, [phoneNumber, preferences, initialPhoneNumber, initialPreferences]);

  const handlePreferenceChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;

    setPreferences(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handlePhoneNumberSave = async (phoneNumber) => {
    setPhoneNumber(phoneNumber);
    // Enable SMS if a phone number is provided and saved
    if (phoneNumber && !preferences.enabled) {
      setPreferences(prev => ({
        ...prev,
        enabled: true
      }));
    }

    // Explicitly check for changes when phone number is updated
    if (phoneNumber !== initialPhoneNumber) {
      setHasChanges(true);
    }
  };

  const handleSavePreferences = async () => {
    if (!phoneNumber && preferences.enabled) {
      setError('A valid phone number is required to enable SMS notifications.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Call the save function passed from the parent component
      await onSave({
        phoneNumber,
        preferences
      });

      setShowSuccess(true);
      setHasChanges(false);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to save SMS preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsActiveIcon color="primary" sx={{ mr: 1.5 }} />
        <Typography variant="h6" component="h3" fontWeight={600}>
          SMS Notification Preferences
        </Typography>
      </Box>

      <Collapse in={showSuccess}>
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setShowSuccess(false)}
        >
          Your SMS preferences have been saved successfully
        </Alert>
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Show verification warning if SMS is enabled but phone is not verified */}
      {phoneNumber && preferences.enabled && !verificationStatus.verified && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your phone number needs to be verified before you can receive SMS notifications.
          {verificationStatus.verificationSentAt ?
            " Please check your phone and reply YES to the verification message." :
            " Save your preferences to send a verification message."}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Receive timely notifications and reflections via SMS. Your phone number will only be used
        according to your preferences below.
      </Typography>

      {/* Phone Number Input Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1.5 }}>
          Your Phone Number
        </Typography>

        <PhoneNumberInput
          initialValue={phoneNumber}
          onSave={handlePhoneNumberSave}
          disabled={disabled || saving}
        />

        {/* Verification Status */}
        {phoneNumber && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            {verificationStatus.verified ? (
              <>
                <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  Verified
                </Typography>
              </>
            ) : verificationStatus.verificationSentAt ? (
              <>
                <InfoOutlinedIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Verification pending. Please check your phone and reply YES to verify.
                </Typography>
              </>
            ) : (
              <>
                <InfoOutlinedIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Not verified. Save your preferences to send a verification message.
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Master SMS Toggle */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.enabled}
              onChange={handlePreferenceChange}
              name="enabled"
              color="primary"
              disabled={!phoneNumber || disabled || saving}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={500}>
                Enable SMS Notifications
              </Typography>
              {!phoneNumber && (
                <Tooltip title="A valid phone number is required to enable SMS notifications">
                  <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                </Tooltip>
              )}
            </Box>
          }
        />
      </Box>

      {/* Notification Types */}
      <Box sx={{ mb: 4, ml: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Notification Types
        </Typography>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.dailyReflection}
                onChange={handlePreferenceChange}
                name="dailyReflection"
                color="primary"
                disabled={!preferences.enabled || disabled || saving}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2">Daily Reflection</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive today's reflection with a brief excerpt
                </Typography>
              </Box>
            }
            sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
          />

          <Box sx={{ ml: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <FormControl
              variant="outlined"
              size="small"
              sx={{ width: 120 }}
              disabled={!preferences.enabled || !preferences.dailyReflection || disabled || saving}
            >
              <InputLabel id="daily-reflection-time-label">Time</InputLabel>
              <Select
                labelId="daily-reflection-time-label"
                id="daily-reflection-time"
                value={preferences.dailyReflectionTime}
                onChange={handlePreferenceChange}
                name="dailyReflectionTime"
                label="Time"
              >
                <MenuItem value="06:00">6:00 AM</MenuItem>
                <MenuItem value="07:00">7:00 AM</MenuItem>
                <MenuItem value="08:00">8:00 AM</MenuItem>
                <MenuItem value="09:00">9:00 AM</MenuItem>
                <MenuItem value="10:00">10:00 AM</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={preferences.step10Reminder}
                onChange={handlePreferenceChange}
                name="step10Reminder"
                color="primary"
                disabled={!preferences.enabled || disabled || saving}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2">Step 10 Evening Reminder</Typography>
                <Typography variant="caption" color="text.secondary">
                  Evening reminder to complete your daily inventory
                </Typography>
              </Box>
            }
            sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
          />

          <Box sx={{ ml: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <FormControl
              variant="outlined"
              size="small"
              sx={{ width: 120 }}
              disabled={!preferences.enabled || !preferences.step10Reminder || disabled || saving}
            >
              <InputLabel id="step10-reminder-time-label">Time</InputLabel>
              <Select
                labelId="step10-reminder-time-label"
                id="step10-reminder-time"
                value={preferences.step10ReminderTime}
                onChange={handlePreferenceChange}
                name="step10ReminderTime"
                label="Time"
              >
                <MenuItem value="19:00">7:00 PM</MenuItem>
                <MenuItem value="20:00">8:00 PM</MenuItem>
                <MenuItem value="21:00">9:00 PM</MenuItem>
                <MenuItem value="22:00">10:00 PM</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={preferences.step4CheckIn}
                onChange={handlePreferenceChange}
                name="step4CheckIn"
                color="primary"
                disabled={!preferences.enabled || disabled || saving}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2">Weekly Step 4 Check-in</Typography>
                <Typography variant="caption" color="text.secondary">
                  Weekly reminder to review and update your Step 4 inventory
                </Typography>
              </Box>
            }
            sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.meetingReminders}
                onChange={handlePreferenceChange}
                name="meetingReminders"
                color="primary"
                disabled={!preferences.enabled || disabled || saving}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2">Meeting Reminders</Typography>
                <Typography variant="caption" color="text.secondary">
                  Reminders for meetings you've saved (if implemented)
                </Typography>
              </Box>
            }
            sx={{ display: 'flex', alignItems: 'flex-start' }}
          />
        </FormGroup>
      </Box>

      {/* Quiet Hours Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
          Quiet Hours
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We'll only send SMS messages outside of your quiet hours.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl
            fullWidth
            variant="outlined"
            size="small"
            disabled={!preferences.enabled || disabled || saving}
          >
            <InputLabel id="quiet-hours-start-label">From</InputLabel>
            <Select
              labelId="quiet-hours-start-label"
              id="quiet-hours-start"
              value={preferences.quietHoursStart}
              onChange={handlePreferenceChange}
              name="quietHoursStart"
              label="From"
            >
              <MenuItem value="19:00">7:00 PM</MenuItem>
              <MenuItem value="20:00">8:00 PM</MenuItem>
              <MenuItem value="21:00">9:00 PM</MenuItem>
              <MenuItem value="22:00">10:00 PM</MenuItem>
              <MenuItem value="23:00">11:00 PM</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            variant="outlined"
            size="small"
            disabled={!preferences.enabled || disabled || saving}
          >
            <InputLabel id="quiet-hours-end-label">To</InputLabel>
            <Select
              labelId="quiet-hours-end-label"
              id="quiet-hours-end"
              value={preferences.quietHoursEnd}
              onChange={handlePreferenceChange}
              name="quietHoursEnd"
              label="To"
            >
              <MenuItem value="05:00">5:00 AM</MenuItem>
              <MenuItem value="06:00">6:00 AM</MenuItem>
              <MenuItem value="07:00">7:00 AM</MenuItem>
              <MenuItem value="08:00">8:00 AM</MenuItem>
              <MenuItem value="09:00">9:00 AM</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Save Button Section */}
      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSavePreferences}
          disabled={!hasChanges || disabled || saving}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Preferences'}
        </Button>
      </Stack>

      <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <PrivacyTipIcon fontSize="small" sx={{ mt: 0.25, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          By providing your phone number, you agree to receive SMS messages from AA Companion, including
          daily reflections and reminders. Message frequency may vary (typically 1 per day). Message &amp;
          data rates may apply. View our{' '}
          <MuiLink
            component={Link}
            href="/legal/terms"
            target="_blank"
            rel="noopener"
            underline="always"
            color="inherit"
          >
            Terms of Service
          </MuiLink>{' '}
          and{' '}
          <MuiLink
            component={Link}
            href="/legal/privacy"
            target="_blank"
            rel="noopener"
            underline="always"
            color="inherit"
          >
            Privacy Policy
          </MuiLink>
          . Reply STOP to unsubscribe or HELP for help.
        </Typography>
      </Box>
    </Paper>
  );
}