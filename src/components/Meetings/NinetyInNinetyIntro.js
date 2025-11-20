'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import GroupsIcon from '@mui/icons-material/Groups';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

/**
 * NinetyInNinetyIntro Component
 * Introductory content for the 90 in 90 challenge
 */
export default function NinetyInNinetyIntro({ onStart }) {
  return (
    <Box>
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              90 Meetings in 90 Days
            </Typography>
            <Typography variant="body1" color="text.secondary">
              A powerful practice for building a strong foundation in your recovery journey
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            The "90 in 90" challenge is a cornerstone recommendation for those in early recovery.
            By attending 90 meetings in 90 days, you create a daily practice of connection,
            learning, and support that helps establish a solid foundation for long-term recovery.
          </Typography>

          <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Benefits of 90 in 90
            </Typography>

            <List sx={{ py: 0 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <CalendarMonthIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Establishes a healthy daily routine" />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <GroupsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Helps you build connections within the recovery community" />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <LightbulbIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Provides daily inspiration and fresh perspectives" />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <TrackChangesIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Creates momentum and consistency in your recovery" />
              </ListItem>
            </List>
          </Paper>

          <Typography variant="body1" paragraph>
            Our tracker helps you monitor your progress, celebrate milestones, and stay motivated
            throughout your 90-day journey. Remember, this isn't about perfection—it's about
            commitment to your recovery one day at a time.
          </Typography>

          <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
            "If you want what we have and are willing to go to any length to get it,
            then you are ready to take certain steps." —Alcoholics Anonymous
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<AssignmentTurnedInIcon />}
              onClick={onStart}
            >
              Start My 90 in 90 Challenge
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <EmojiEventsIcon sx={{ mr: 1 }} /> How the Tracker Works
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <CalendarMonthIcon />
            </ListItemIcon>
            <ListItemText
              primary="Log your daily meetings"
              secondary="Quick log or add detailed information about each meeting"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <TrackChangesIcon />
            </ListItemIcon>
            <ListItemText
              primary="Track your progress"
              secondary="Visualize your journey toward 90 meetings in 90 days"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <EmojiEventsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Celebrate milestones"
              secondary="Acknowledge your dedication and commitment to recovery"
            />
          </ListItem>
        </List>

        <Typography variant="body2" paragraph color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
          "Progress, not perfection." If you miss a day, don't worry—just pick up where you left off.
          What matters is your overall commitment to your recovery journey.
        </Typography>
      </Paper>
    </Box>
  );
}