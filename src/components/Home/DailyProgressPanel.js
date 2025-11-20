'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Tooltip,
  LinearProgress,
  Divider,
  useTheme,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EventNoteIcon from '@mui/icons-material/EventNote';
import NightlightIcon from '@mui/icons-material/Nightlight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TodayIcon from '@mui/icons-material/Today';
import { getTodayKey } from '@/utils/dateUtils';

/**
 * Daily Progress Panel Component
 * Shows user's sobriety streak, next milestone, and open inventory items
 *
 * @param {Object} props
 * @param {Object} props.userActivity - User activity data
 * @param {boolean} props.loading - Whether the activity data is loading
 */
export default function DailyProgressPanel({ userActivity, loading = false }) {
  const router = useRouter();
  const theme = useTheme();
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const todayKey = getTodayKey();

  // Determine time of day for contextual actions
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('midday');
    else setTimeOfDay('night');
  }, []);

  // If loading or no user activity, return null
  if (!userActivity) return null;

  // Calculate days to next milestone
  const calculateNextMilestone = () => {
    const currentStreak = userActivity?.activity?.streak?.current || 0;
    const milestones = [1, 7, 30, 60, 90, 180, 365, 730, 1095, 1825];

    // Find next milestone
    const nextMilestone = milestones.find(m => m > currentStreak) || (Math.floor(currentStreak / 365) + 1) * 365;
    const daysToMilestone = nextMilestone - currentStreak;

    return { nextMilestone, daysToMilestone };
  };

  const { nextMilestone, daysToMilestone } = calculateNextMilestone();

  // Calculate progress to next milestone
  const milestoneProgress = () => {
    const current = userActivity?.activity?.streak?.current || 0;

    if (current === 0) return 0;

    const previousMilestone = milestones.findLast(m => m <= current) || 0;
    const progressPercentage = ((current - previousMilestone) / (nextMilestone - previousMilestone)) * 100;

    return Math.min(Math.max(progressPercentage, 0), 100);
  };

  const milestones = [1, 7, 30, 60, 90, 180, 365, 730, 1095, 1825];
  const progress = milestoneProgress();

  // Check if user has completed today's activities
  const hasDailyReflection = userActivity?.activity?.reflections?.viewedToday || false;
  const hasEveningInventory = userActivity?.activity?.journal?.enteredToday || false;

  // Get contextual action based on time of day
  const getTimeBasedAction = () => {
    switch (timeOfDay) {
      case 'morning':
        return {
          icon: <WbSunnyIcon />,
          text: "Morning Reflection",
          action: () => router.push(`/${todayKey}`),
          complete: hasDailyReflection,
          buttonText: hasDailyReflection ? "Review Reflection" : "Read Today's Reflection"
        };
      case 'midday':
        return {
          icon: <TodayIcon />,
          text: "Midday Check-in",
          action: () => router.push('/journal/new'),
          complete: false,
          buttonText: "Quick Check-in"
        };
      case 'night':
        return {
          icon: <NightlightIcon />,
          text: "Evening Inventory",
          action: () => router.push('/journal/new'),
          complete: hasEveningInventory,
          buttonText: hasEveningInventory ? "Review Today's Inventory" : "Start Nightly Inventory"
        };
      default:
        return {
          icon: <EventNoteIcon />,
          text: "Daily Activity",
          action: () => router.push(`/${todayKey}`),
          complete: hasDailyReflection,
          buttonText: "Today's Reflection"
        };
    }
  };

  const timeAction = getTimeBasedAction();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, rgba(93,166,167,0.1) 0%, rgba(228,185,91,0.05) 100%)',
        borderradius: 1,
        border: '1px solid rgba(93,166,167,0.25)',
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {userActivity?.activity?.streak?.current > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: { xs: '120px', md: '180px' },
            height: '100%',
            backgroundImage: 'url(/images/tracker.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.7,
            mixBlendMode: 'multiply',
            display: { xs: 'none', sm: 'block' },
          }}
        />
      )}
      <Grid container spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Streak Section */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 0 } }}>
            <LocalFireDepartmentIcon
              color="warning"
              sx={{ mr: 1, fontSize: '2rem', color: '#E4B95B' }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                {userActivity.activity.streak.current} {userActivity.activity.streak.current === 1 ? 'Day' : 'Days'}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Current Streak
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Next Milestone Section */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
            <CelebrationIcon
              sx={{ mr: 1, fontSize: '2rem', color: '#5DA6A7' }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Next Milestone: {nextMilestone} Days
                </Typography>
                <Chip
                  size="small"
                  label={`${daysToMilestone} to go`}
                  sx={{
                    bgcolor: 'rgba(93,166,167,0.2)',
                    color: '#5DA6A7',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  mt: 1,
                  height: 6,
                  borderradius: 1,
                  bgcolor: 'rgba(0,0,0,0.05)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#5DA6A7',
                  }
                }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Time-Based Action Section */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {timeAction.icon}
            <Box sx={{ ml: 1, flexGrow: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {timeAction.text}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={timeAction.action}
                startIcon={timeAction.complete ? <EventNoteIcon /> : null}
                sx={{
                  mt: 0.5,
                  bgcolor: timeAction.complete ? 'rgba(93,166,167,0.8)' : '#E4B95B',
                  color: timeAction.complete ? 'white' : '#1A2B34',
                  '&:hover': {
                    bgcolor: timeAction.complete ? '#5DA6A7' : '#D4A556',
                  }
                }}
              >
                {timeAction.buttonText}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}