'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  Tooltip,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format, addDays, eachDayOfInterval, isToday, isPast, isSameDay } from 'date-fns';

/**
 * TrackerProgress Component
 * Displays visual progress toward 90 meetings in 90 days goal
 */
export default function TrackerProgress({ stats }) {
  const [calendarDays, setCalendarDays] = useState([]);
  const [completedDays, setCompletedDays] = useState(new Set());

  // Set up calendar days for visualization
  useEffect(() => {
    if (stats?.ninetyInNinety?.startDate) {
      const startDate = new Date(stats.ninetyInNinety.startDate);
      const endDate = stats.ninetyInNinety.streakEnd90in90
        ? new Date(stats.ninetyInNinety.streakEnd90in90)
        : addDays(startDate, 90);

      // Generate array of days for the 90-day period
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      setCalendarDays(days);
    }
  }, [stats?.ninetyInNinety?.startDate, stats?.ninetyInNinety?.streakEnd90in90]);

  // Calculate progress percentage
  const progressPercentage = stats?.ninetyInNinety?.progress
    ? Math.floor((stats.ninetyInNinety.progress / 90) * 100)
    : 0;

  // Get days remaining
  const daysRemaining = stats?.ninetyInNinety?.streakEnd90in90
    ? Math.max(0, Math.ceil((new Date(stats.ninetyInNinety.streakEnd90in90) - new Date()) / (1000 * 60 * 60 * 24)))
    : 90;

  // Check if challenge is complete
  const isComplete = Boolean(stats?.ninetyInNinety?.goalCompletedDate);

  // Determine message based on progress
  const getMessage = () => {
    if (isComplete) {
      return "Incredible achievement! Remember, recovery is a journey that continues one day at a time.";
    } else if (progressPercentage > 75) {
      return "You're in the home stretch! Keep going, you've got this!";
    } else if (progressPercentage > 50) {
      return "More than halfway there! Your commitment is inspiring.";
    } else if (progressPercentage > 25) {
      return "Great progress! One day at a time, you're building a strong foundation.";
    } else {
      return "Starting your journey. Every meeting is a step forward in your recovery!";
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Your 90 in 90 Progress
          </Typography>

          {/* Progress circle */}
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: 2
            }}
          >
            <CircularProgress
              variant="determinate"
              value={progressPercentage}
              size={180}
              thickness={5}
              sx={{
                color: theme => isComplete ? theme.palette.success.main : theme.palette.primary.main,
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h3" component="div" color="text.primary">
                {stats?.ninetyInNinety?.progress || 0}
              </Typography>
              <Typography variant="body1" component="div" color="text.secondary">
                of 90 days
              </Typography>
            </Box>
          </Box>

          {/* Status message */}
          <Typography variant="h6" color={isComplete ? 'success.main' : 'primary'}>
            {isComplete
              ? 'Challenge Complete! Congratulations!'
              : `${daysRemaining} days remaining`}
          </Typography>
        </Box>

        {/* Calendar visualization */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarMonthIcon sx={{ mr: 1 }} /> Meeting Calendar
          </Typography>

          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {calendarDays.map((day, index) => {
                const dayNumber = index + 1;
                const isPastDay = isPast(day) && !isToday(day);
                const isAttended = dayNumber <= (stats?.ninetyInNinety?.progress || 0);
                const isToday_ = isToday(day);

                return (
                  <Tooltip
                    key={index}
                    title={`Day ${dayNumber}: ${format(day, 'MMM d, yyyy')}${isAttended ? ' - Meeting Attended' : ''}`}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        m: 0.5,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '50%',
                        color: isAttended
                          ? 'success.contrastText'
                          : isToday_ ? 'primary.contrastText' : isPastDay ? 'error.contrastText' : 'text.primary',
                        bgcolor: isAttended
                          ? 'success.main'
                          : isToday_ ? 'primary.main' : isPastDay ? 'error.light' : 'action.hover',
                        border: theme => isPastDay && !isAttended
                          ? `2px solid ${theme.palette.error.main}`
                          : isToday_ && !isAttended ? `2px solid ${theme.palette.primary.main}` : 'none',
                        fontSize: '0.75rem',
                        transition: '0.3s',
                        '&:hover': {
                          transform: 'scale(1.2)',
                        }
                      }}
                    >
                      {isAttended ? (
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      ) : (
                        dayNumber
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* Stats row */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {stats?.streaks?.current || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Streak
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {stats?.totalMeetings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Meetings
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {Math.max(0, 90 - (stats?.ninetyInNinety?.progress || 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Meetings to Go
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Encouragement message */}
        <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
            {getMessage()}
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
}