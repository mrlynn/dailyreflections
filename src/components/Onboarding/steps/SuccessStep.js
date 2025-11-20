'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PeopleIcon from '@mui/icons-material/People';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightIcon from '@mui/icons-material/Nightlight';
import { format } from 'date-fns';

/**
 * Success Step Component
 * Final step in onboarding - shows summary of setup
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 */
export default function SuccessStep({ formData }) {
  const theme = useTheme();

  // Format sobriety date nicely
  const formatSobrietyDate = () => {
    if (!formData.sobrietyDate) return 'Not set';

    try {
      return format(new Date(formData.sobrietyDate), 'MMMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format notification times to AM/PM
  const formatTime = (time24) => {
    try {
      const [hours, minutes] = time24.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (e) {
      return time24;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center">
        You're All Set!
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: 4 }} align="center">
        Your AA Companion is now personalized to support your recovery journey.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: 'rgba(93,166,167,0.08)',
          borderRadius: 2,
          mb: 4
        }}
      >
        <Typography variant="h6" gutterBottom>
          Your Setup Summary
        </Typography>

        <List>
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon>
              <CalendarTodayIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Sobriety Date"
              secondary={formatSobrietyDate()}
            />
          </ListItem>

          {formData.notifications?.enabled && (
            <>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <WbSunnyIcon sx={{ color: theme.palette.warning.main }} />
                </ListItemIcon>
                <ListItemText
                  primary="Morning Reflection"
                  secondary={`Daily at ${formatTime(formData.notifications.morningTime)}`}
                />
              </ListItem>

              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <NightlightIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Evening Inventory"
                  secondary={`Daily at ${formatTime(formData.notifications.eveningTime)}`}
                />
              </ListItem>
            </>
          )}

          {formData.accountability?.contacts?.length > 0 && (
            <ListItem sx={{ py: 1.5 }}>
              <ListItemIcon>
                <PeopleIcon color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary="Accountability Contacts"
                secondary={`${formData.accountability.contacts.length} ${formData.accountability.contacts.length === 1 ? 'contact' : 'contacts'} added`}
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          What's Next?
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Start your day with the morning reflection" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="End your day with an evening inventory" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Track your progress with milestones" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Find meetings near you" />
          </ListItem>
        </List>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
          <NotificationsActiveIcon color="action" />
          <Typography variant="body2" color="text.secondary">
            You can adjust all settings at any time from your profile page.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}