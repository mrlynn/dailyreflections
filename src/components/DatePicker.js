'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Paper,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import LinkIcon from '@mui/icons-material/Link';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { parseDateKey, formatDateKey, getTodayKey } from '@/utils/dateUtils';

/**
 * DatePicker Component
 * User-friendly month/day selector for daily reflections
 */
export default function DatePicker({ dateKey, onChange, onToday }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { month, day } = parseDateKey(dateKey);
  const todayKey = getTodayKey();
  const isToday = dateKey === todayKey;

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get days in month (handles leap years)
  const getDaysInMonth = (monthNum, year = 2024) => {
    return new Date(year, monthNum, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(month);

  // Handle click to open menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle month selection
  const handleMonthSelect = (newMonth) => {
    const newDateKey = `${String(newMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Ensure day is valid for the new month
    const maxDay = getDaysInMonth(newMonth);
    const validDay = Math.min(day, maxDay);
    const validDateKey = `${String(newMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
    onChange(validDateKey);
    handleClose();
  };

  // Handle day selection
  const handleDaySelect = (newDay) => {
    const newDateKey = `${String(month).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    onChange(newDateKey);
    handleClose();
  };

  // Quick navigation
  const handleQuickNav = (offset) => {
    const [currentMonth, currentDay] = dateKey.split('-').map(Number);
    let newMonth = currentMonth;
    let newDay = currentDay + offset;

    if (newDay < 1) {
      newMonth = newMonth - 1;
      if (newMonth < 1) newMonth = 12;
      newDay = getDaysInMonth(newMonth);
    } else if (newDay > getDaysInMonth(newMonth)) {
      newDay = 1;
      newMonth = newMonth + 1;
      if (newMonth > 12) newMonth = 1;
    }

    onChange(`${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
  };

  // Generate day options (1-31, but filtered by month)
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      {/* Date Picker Button */}
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<CalendarTodayIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          minWidth: 200,
          justifyContent: 'space-between',
          textTransform: 'none',
          px: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mr: 2 }}>
          <Typography variant="body2" sx={{ lineHeight: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
            {formatDateKey(dateKey).split(' ')[0]} {/* Month */}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.2, fontWeight: 600 }}>
            {formatDateKey(dateKey).split(' ')[1]} {/* Day */}
          </Typography>
        </Box>
      </Button>

      {/* Date Picker Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: '80vh',
            overflow: 'auto',
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Paper sx={{ p: 2 }}>
          {/* Quick Actions */}
          <Box display="flex" gap={1} mb={2}>
            <Button
              fullWidth
              variant={isToday ? 'contained' : 'outlined'}
              startIcon={<TodayIcon />}
              onClick={() => {
                onChange(todayKey);
                handleClose();
                if (onToday) onToday();
              }}
              size="small"
            >
              Today
            </Button>
            <IconButton
              onClick={() => handleQuickNav(-1)}
              size="small"
              sx={{ border: 1, borderColor: 'divider' }}
            >
              ←
            </IconButton>
            <IconButton
              onClick={() => handleQuickNav(1)}
              size="small"
              sx={{ border: 1, borderColor: 'divider' }}
            >
              →
            </IconButton>
            <Tooltip title="Open direct link to this date">
              <IconButton
                component={Link}
                href={`/${dateKey}`}
                size="small"
                sx={{ border: 1, borderColor: 'primary.main' }}
                color="primary"
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Month Selection */}
          <Typography variant="overline" sx={{ px: 1, mb: 1, display: 'block' }}>
            Month
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0.5,
              mb: 3,
            }}
          >
            {months.map((monthName, index) => (
              <Button
                key={index}
                variant={month === index + 1 ? 'contained' : 'outlined'}
                onClick={() => handleMonthSelect(index + 1)}
                size="small"
                sx={{
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  py: 0.75,
                }}
              >
                {monthName.substring(0, 3)}
              </Button>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Day Selection */}
          <Typography variant="overline" sx={{ px: 1, mb: 1, display: 'block' }}>
            Day
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
            }}
          >
            {dayOptions.map((dayNum) => (
              <Button
                key={dayNum}
                variant={day === dayNum ? 'contained' : 'outlined'}
                onClick={() => handleDaySelect(dayNum)}
                size="small"
                sx={{
                  minWidth: 'auto',
                  minHeight: 36,
                  fontSize: '0.875rem',
                }}
              >
                {dayNum}
              </Button>
            ))}
          </Box>

          {/* Current Selection Display */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Selected: {formatDateKey(dateKey)}
            </Typography>
          </Box>
        </Paper>
      </Menu>
    </>
  );
}

