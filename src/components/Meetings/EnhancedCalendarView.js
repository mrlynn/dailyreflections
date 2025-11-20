'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tooltip,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TodayIcon from '@mui/icons-material/Today';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {
  format,
  addDays,
  eachDayOfInterval,
  isToday,
  isPast,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  addWeeks,
  isSameDay,
  isSameMonth,
  getDay
} from 'date-fns';

/**
 * EnhancedCalendarView Component
 * A calendar-based visualization for 90 in 90 progress tracking
 */
export default function EnhancedCalendarView({ stats }) {
  const theme = useTheme();
  const [calendarDays, setCalendarDays] = useState([]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [weekLabels, setWeekLabels] = useState([]);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'progress'

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

      // Set current view date to either today or start date if in the future
      if (startDate > new Date()) {
        setCurrentViewDate(startDate);
      }
    }
  }, [stats?.ninetyInNinety?.startDate, stats?.ninetyInNinety?.streakEnd90in90]);

  // Generate calendar view for current month
  const generateMonthView = () => {
    if (calendarDays.length === 0) return [];

    // Get current month boundaries for view
    const monthStart = startOfMonth(currentViewDate);
    const monthEnd = endOfMonth(currentViewDate);

    // Get all weeks that include days from this month
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 0 } // 0 = Sunday
    );

    // Create days for each week
    return weeks.map(week => {
      const weekStart = startOfWeek(week, { weekStartsOn: 0 });
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      return days;
    });
  };

  const monthView = generateMonthView();

  // Navigate to previous month
  const gotoPreviousMonth = () => {
    const prevMonth = new Date(currentViewDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentViewDate(prevMonth);
  };

  // Navigate to next month
  const gotoNextMonth = () => {
    const nextMonth = new Date(currentViewDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentViewDate(nextMonth);
  };

  // Check if a day is part of the 90 in 90 period
  const isDayInPeriod = (day) => {
    if (calendarDays.length === 0) return false;
    return calendarDays.some(calendarDay => isSameDay(calendarDay, day));
  };

  // Get the day number within the 90 day period (1-90)
  const getDayNumber = (day) => {
    if (calendarDays.length === 0) return null;
    const index = calendarDays.findIndex(calendarDay => isSameDay(calendarDay, day));
    return index >= 0 ? index + 1 : null;
  };

  // Check if a meeting was attended on a specific day
  const isAttended = (day) => {
    if (!stats?.ninetyInNinety?.progress) return false;
    const dayNumber = getDayNumber(day);
    return dayNumber !== null && dayNumber <= stats.ninetyInNinety.progress;
  };

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

  // Get day style and icon based on status
  const getDayStyle = (day) => {
    const dayInPeriod = isDayInPeriod(day);
    if (!dayInPeriod) {
      // Day not in 90 in 90 period
      return {
        bgcolor: 'transparent',
        color: 'text.disabled',
        border: 'none',
        icon: null
      };
    }

    const dayNumber = getDayNumber(day);
    const attended = isAttended(day);
    const isToday_ = isToday(day);
    const isPastDay = isPast(day) && !isToday_;

    if (attended) {
      // Meeting attended
      return {
        bgcolor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
        border: 'none',
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
      };
    } else if (isToday_) {
      // Today
      return {
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        border: 'none',
        icon: <TodayIcon sx={{ fontSize: 16 }} />
      };
    } else if (isPastDay) {
      // Missed day
      return {
        bgcolor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
        border: `2px solid ${theme.palette.error.main}`,
        icon: <EventBusyIcon sx={{ fontSize: 16 }} />
      };
    } else {
      // Future day
      return {
        bgcolor: theme.palette.action.hover,
        color: theme.palette.text.primary,
        border: 'none',
        icon: null
      };
    }
  };

  // Special milestone days (30, 60, 90)
  const isMilestoneDay = (dayNumber) => {
    return dayNumber === 30 || dayNumber === 60 || dayNumber === 90;
  };

  // Render calendar header with day names
  const renderCalendarHeader = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Grid container sx={{ mb: 1, mt: 2, width: '100%' }}>
        {dayNames.map((day, index) => (
          <Grid item xs={1.71} key={index} sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'bold',
                color: 'text.secondary',
                display: 'block'
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        background: theme => theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #27313d 0%, #1e2429 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
        height: '100%'  // Make sure the height is 100% for consistent card heights
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          <CalendarTodayIcon sx={{ mr: 1 }} />
          {format(currentViewDate, 'MMMM yyyy')}
        </Typography>

        <Box>
          <IconButton onClick={gotoPreviousMonth} color="primary">
            <ChevronLeftIcon />
          </IconButton>

          <IconButton onClick={gotoNextMonth} color="primary">
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ width: '100%', overflow: 'hidden' }}>

      {renderCalendarHeader()}

      {/* Calendar Grid */}
      <Box sx={{ mb: 3, width: '100%' }}>
        {monthView.map((week, weekIndex) => (
          <Grid container key={weekIndex} sx={{ mb: 1 }}>
            {week.map((day, dayIndex) => {
              const dayInPeriod = isDayInPeriod(day);
              const dayNumber = getDayNumber(day);
              const style = getDayStyle(day);
              const inCurrentMonth = isSameMonth(day, currentViewDate);
              const dayLabel = format(day, 'd');

              return (
                <Grid item xs={1.71} key={dayIndex}>
                  <Tooltip
                    title={dayInPeriod
                      ? `Day ${dayNumber}: ${format(day, 'MMM d, yyyy')}${isAttended(day) ? ' - Meeting Attended' : ''}`
                      : format(day, 'MMM d, yyyy')
                    }
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        margin: '0 auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '50%',
                        bgcolor: style.bgcolor,
                        color: style.color,
                        border: style.border,
                        opacity: inCurrentMonth ? 1 : 0.3,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        fontWeight: dayInPeriod ? 'bold' : 'normal',
                        cursor: 'default',
                        '&:hover': {
                          transform: dayInPeriod ? 'scale(1.1)' : 'none',
                          boxShadow: dayInPeriod ? 3 : 'none',
                          zIndex: 2,
                        }
                      }}
                    >
                      {dayInPeriod && isMilestoneDay(dayNumber) ? (
                        <Box
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            border: '2px dashed gold',
                            animation: 'pulse 2s infinite',
                            opacity: 0.7,
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)', opacity: 0.7 },
                              '50%': { transform: 'scale(1.1)', opacity: 1 },
                              '100%': { transform: 'scale(1)', opacity: 0.7 },
                            }
                          }}
                        />
                      ) : null}

                      {style.icon ? (
                        style.icon
                      ) : (
                        <Typography variant="body2">
                          {dayLabel}
                        </Typography>
                      )}

                      {dayInPeriod && (
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            bottom: '-5px',
                            right: '-5px',
                            bgcolor: dayNumber ? 'primary.main' : 'transparent',
                            color: dayNumber ? 'primary.contrastText' : 'transparent',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {dayNumber}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        ))}
      </Box>

      </Box> {/* Close the Box container for the calendar section */}

      {/* Simplified legend */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.success.main,
            mr: 0.5
          }} />
          <Typography variant="caption">Attended</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            mr: 0.5
          }} />
          <Typography variant="caption">Today</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.error.light,
            border: `1px solid ${theme.palette.error.main}`,
            mr: 0.5
          }} />
          <Typography variant="caption">Missed</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.action.hover,
            mr: 0.5
          }} />
          <Typography variant="caption">Upcoming</Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.success.main,
            mr: 0.5
          }} />
          <Typography variant="caption">Attended</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            mr: 0.5
          }} />
          <Typography variant="caption">Today</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.error.light,
            border: `1px solid ${theme.palette.error.main}`,
            mr: 0.5
          }} />
          <Typography variant="caption">Missed</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: theme.palette.action.hover,
            mr: 0.5
          }} />
          <Typography variant="caption">Upcoming</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px dashed gold',
            mr: 0.5
          }} />
          <Typography variant="caption">Milestone Day</Typography>
        </Box>
      </Box>
    </Paper>
  );
}