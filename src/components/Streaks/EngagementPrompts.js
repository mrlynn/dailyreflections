'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  Slide,
  Snackbar,
  Badge,
  Divider,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import StarIcon from '@mui/icons-material/Star';
import TimerIcon from '@mui/icons-material/Timer';

/**
 * EngagementPrompts Component
 *
 * Displays engagement mechanisms to encourage users to maintain their daily practice
 * through gentle reminders, achievements, and motivational prompts.
 *
 * @param {Object} props
 * @param {Object} props.streakData - The streak data from the API
 * @param {function} props.onAction - Callback when user takes an action (for analytics)
 * @param {boolean} props.disableReminders - Whether to disable automatic reminders
 */
export default function EngagementPrompts({ streakData, onAction, disableReminders = false }) {
  const theme = useTheme();
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Determine if we need to show a prompt based on streak data
  useEffect(() => {
    if (!streakData || disableReminders) return;

    // Only show prompts if user has an active streak
    if (streakData.currentStreak >= 1) {
      const promptTypes = [];

      // Check conditions for showing different prompt types

      // Risk of breaking streak (no entry yet today and it's evening)
      const now = new Date();
      const lastEntryDate = streakData.lastEntryDate ? new Date(streakData.lastEntryDate) : null;
      const isToday = lastEntryDate && lastEntryDate.toDateString() === now.toDateString();
      const isEvening = now.getHours() >= 18;

      if (!isToday && isEvening) {
        promptTypes.push('streakReminder');
      }

      // Milestone achievement celebration
      if (streakData.milestones && streakData.milestones.some(m => !m.viewed)) {
        promptTypes.push('milestone');
      }

      // Streak milestone approaching (e.g., 1 day away from 7-day streak)
      const milestoneThresholds = [3, 7, 14, 30, 60, 90, 180, 365];
      const nextMilestone = milestoneThresholds.find(t => t > streakData.currentStreak);

      if (nextMilestone && nextMilestone - streakData.currentStreak <= 2) {
        promptTypes.push('approachingMilestone');
      }

      // If streak was just recovered
      if (streakData.streakHealth === 'recovering') {
        promptTypes.push('streakRecovered');
      }

      // Choose one randomly if there are multiple options
      if (promptTypes.length > 0) {
        const randomPrompt = promptTypes[Math.floor(Math.random() * promptTypes.length)];
        generatePrompt(randomPrompt);
      }
    }
  }, [streakData, disableReminders]);

  // Generate a specific prompt based on type
  const generatePrompt = (promptType) => {
    let prompt;

    switch (promptType) {
      case 'streakReminder':
        prompt = {
          type: 'streakReminder',
          title: "Don't Break Your Streak",
          message: "You haven't completed your inventory today. Take a moment now to reflect and maintain your streak.",
          icon: <TimerIcon color="warning" />,
          action: "Complete Inventory",
          actionUrl: "/journal/new",
          severity: "warning"
        };
        break;

      case 'milestone':
        const newMilestone = streakData.milestones.find(m => !m.viewed);
        prompt = {
          type: 'milestone',
          title: `${newMilestone.title} Achieved!`,
          message: newMilestone.description,
          icon: <CelebrationIcon color="secondary" />,
          action: "View Achievement",
          actionData: newMilestone,
          severity: "success"
        };
        break;

      case 'approachingMilestone':
        const milestoneThresholds = [3, 7, 14, 30, 60, 90, 180, 365];
        const nextMilestone = milestoneThresholds.find(t => t > streakData.currentStreak);
        const daysToGo = nextMilestone - streakData.currentStreak;

        prompt = {
          type: 'approachingMilestone',
          title: `Almost There!`,
          message: `You're just ${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} away from reaching a ${nextMilestone}-day milestone. Keep going!`,
          icon: <StarIcon color="primary" />,
          action: "View Progress",
          actionUrl: "/profile#streaks",
          severity: "info"
        };
        break;

      case 'streakRecovered':
        prompt = {
          type: 'streakRecovered',
          title: "Streak Recovered",
          message: "You've successfully recovered your streak. Remember, consistency is key, but so is self-compassion.",
          icon: <EventAvailableIcon color="success" />,
          action: "Continue Journey",
          actionUrl: "/journal/new",
          severity: "success"
        };
        break;

      default:
        return;
    }

    setCurrentPrompt(prompt);
    setShowPrompt(true);
  };

  // Handle action button click
  const handleAction = () => {
    if (!currentPrompt) return;

    // Track the action for analytics
    if (onAction) {
      onAction(currentPrompt.type);
    }

    // Handle specific action types
    if (currentPrompt.actionUrl) {
      // Navigate to URL
      window.location.href = currentPrompt.actionUrl;
    } else if (currentPrompt.actionData) {
      // Show specific data, like milestone details
      setSnackbarMessage(`Viewed "${currentPrompt.actionData.title}" milestone`);
      setSnackbarOpen(true);
    }

    // Hide the prompt
    setShowPrompt(false);
  };

  // Handle dismissing the prompt
  const handleDismiss = () => {
    setShowPrompt(false);

    // Optionally track dismissal for analytics
    if (onAction) {
      onAction(`dismiss_${currentPrompt?.type || 'unknown'}`);
    }
  };

  // Handle closing the snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Generate a recovery tip if streak is broken
  const getRecoveryTip = () => {
    const tips = [
      "Recovery is about progress, not perfection. You can restart your streak today.",
      "Self-compassion is part of the journey. Give yourself grace and begin again.",
      "Every day is a new opportunity to recommit to your recovery practice.",
      "Consistency over time matters more than an unbroken streak. Start fresh today.",
      "The most important inventory is the one you do today, regardless of past streaks."
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  };

  // If we don't have streak data yet, don't render anything
  if (!streakData) return null;

  // Render different engagement components based on streak state
  return (
    <>
      {/* Streak Recovery Prompt (when streak is broken) */}
      {streakData.streakHealth === 'broken' && (
        <Paper sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.warning.main}` }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Badge color="error" variant="dot" sx={{ mr: 2 }}>
              <NotificationsIcon color="warning" fontSize="large" />
            </Badge>
            <Typography variant="h6">Streak Recovery Opportunity</Typography>
          </Box>

          <Typography variant="body1" paragraph>
            Your reflection streak is currently broken, but that's okay! Recovery is about progress, not perfection.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">{getRecoveryTip()}</Typography>
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {streakData.recoveryGrace && streakData.recoveryGrace.availableRecoveries > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (onAction) onAction('recover_streak');
                  setSnackbarMessage("Taking you to streak recovery...");
                  setSnackbarOpen(true);
                }}
              >
                Recover Streak
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => {
                if (onAction) onAction('new_inventory');
                window.location.href = "/journal/new";
              }}
            >
              Start Today's Inventory
            </Button>
          </Box>
        </Paper>
      )}

      {/* Daily Entry Reminder (for active streaks but no entry today) */}
      {streakData.streakHealth !== 'broken' &&
       streakData.lastEntryDate &&
       new Date(streakData.lastEntryDate).toDateString() !== new Date().toDateString() && (
        <Card variant="outlined" sx={{ mb: 3, bgcolor: theme.palette.background.default }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <EventAvailableIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Today's Reflection</Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body1" paragraph>
              You haven't completed your daily inventory yet. Take a moment for self-reflection to maintain your
              {streakData.currentStreak > 0 ? ` ${streakData.currentStreak}-day` : ''} streak.
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                if (onAction) onAction('create_entry');
                window.location.href = "/journal/new";
              }}
            >
              Complete Today's Inventory
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Slide-in prompt for important notifications */}
      {currentPrompt && (
        <Slide direction="up" in={showPrompt} mountOnEnter unmountOnExit>
          <Paper
            elevation={3}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              width: { xs: 'calc(100% - 32px)', sm: 400 },
              maxWidth: '100%',
              zIndex: 1000,
              borderTop: `3px solid ${theme.palette[currentPrompt.severity || 'primary'].main}`
            }}
          >
            <Box sx={{ p: 2, pr: 6, position: 'relative' }}>
              <IconButton
                size="small"
                onClick={handleDismiss}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              <Box display="flex" alignItems="center" mb={1}>
                {currentPrompt.icon}
                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                  {currentPrompt.title}
                </Typography>
              </Box>

              <Typography variant="body2" paragraph>
                {currentPrompt.message}
              </Typography>

              {currentPrompt.action && (
                <Button
                  variant="outlined"
                  size="small"
                  color={currentPrompt.severity || "primary"}
                  onClick={handleAction}
                >
                  {currentPrompt.action}
                </Button>
              )}
            </Box>
          </Paper>
        </Slide>
      )}

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </>
  );
}