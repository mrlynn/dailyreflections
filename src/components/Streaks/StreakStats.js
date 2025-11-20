'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

/**
 * StreakStats Component
 *
 * Displays statistics and insights about the user's streak patterns
 *
 * @param {Object} props
 * @param {Object} props.streakData - Streak data from the API
 * @param {Object} props.streakHistory - History of streak entries
 * @param {Object} props.insights - Additional streak insights
 */
export default function StreakStats({ streakData, streakHistory = [], insights = {} }) {
  if (!streakData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Calculate various streak statistics
  const calculateStats = () => {
    // Default values if we don't have enough data
    if (!streakHistory || streakHistory.length < 7) {
      return {
        completionRate: 100,
        weekdayCompletion: { most: 'N/A', least: 'N/A' },
        averageEntryTime: 'N/A',
        consistency: 'N/A'
      };
    }

    // Calculate completion rate (entries made vs days since first entry)
    let completionRate = 0;
    if (streakData.totalEntries && streakHistory.length > 0) {
      const firstEntry = new Date(streakHistory[streakHistory.length - 1].date);
      const daysSinceFirstEntry = Math.ceil((new Date() - firstEntry) / (1000 * 60 * 60 * 24));
      completionRate = Math.min(100, Math.round((streakData.totalEntries / daysSinceFirstEntry) * 100));
    }

    // Find most and least active weekdays
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

    streakHistory.forEach(entry => {
      if (entry.completed) {
        const date = new Date(entry.date);
        const day = date.getDay();
        weekdayCounts[day]++;
      }
    });

    const maxCount = Math.max(...weekdayCounts);
    const minCount = Math.min(...weekdayCounts.filter(count => count > 0)) || 0;
    const mostActiveDay = weekdays[weekdayCounts.indexOf(maxCount)];
    const leastActiveDay = weekdays[weekdayCounts.indexOf(minCount)];

    // Calculate most common entry time
    const hourCounts = new Array(24).fill(0);
    streakHistory.forEach(entry => {
      if (entry.completed) {
        const date = new Date(entry.date);
        const hour = date.getHours();
        hourCounts[hour]++;
      }
    });

    const maxHourCount = Math.max(...hourCounts);
    const mostCommonHour = hourCounts.indexOf(maxHourCount);
    const timeString = mostCommonHour < 12
      ? `${mostCommonHour === 0 ? 12 : mostCommonHour} AM`
      : `${mostCommonHour === 12 ? 12 : mostCommonHour - 12} PM`;

    // Calculate consistency score
    const recentEntries = streakHistory.slice(0, 30); // Last 30 days
    let consecutiveDayCount = 0;
    let totalConsecutiveDays = 0;

    for (let i = 0; i < recentEntries.length - 1; i++) {
      const currentDate = new Date(recentEntries[i].date);
      const nextDate = new Date(recentEntries[i+1].date);
      const diffDays = Math.round((currentDate - nextDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutiveDayCount++;
      } else {
        totalConsecutiveDays += consecutiveDayCount;
        consecutiveDayCount = 0;
      }
    }

    totalConsecutiveDays += consecutiveDayCount;
    const consistencyScore = Math.min(100, Math.round((totalConsecutiveDays / 30) * 100));

    let consistencyRating;
    if (consistencyScore >= 90) consistencyRating = 'Excellent';
    else if (consistencyScore >= 70) consistencyRating = 'Good';
    else if (consistencyScore >= 50) consistencyRating = 'Fair';
    else consistencyRating = 'Needs Improvement';

    return {
      completionRate,
      weekdayCompletion: { most: mostActiveDay, least: leastActiveDay },
      averageEntryTime: timeString,
      consistency: consistencyRating
    };
  };

  const stats = calculateStats();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <InsightsIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Streak Insights</Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Completion Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <CircularProgress
                  variant="determinate"
                  value={stats.completionRate}
                  size={40}
                  thickness={4}
                  color={stats.completionRate > 80 ? "success" : stats.completionRate > 50 ? "warning" : "error"}
                  sx={{ mr: 2 }}
                />
                <Typography variant="h5" fontWeight="500">
                  {stats.completionRate}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Of days since you started
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Consistency */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Consistency Rating
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <AutoGraphIcon
                  color={
                    stats.consistency === 'Excellent' ? "success" :
                    stats.consistency === 'Good' ? "primary" :
                    stats.consistency === 'Fair' ? "warning" : "error"
                  }
                  sx={{ mr: 2, fontSize: 28 }}
                />
                <Typography variant="h6" fontWeight="500">
                  {stats.consistency}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Based on your entry pattern
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Entry Time Patterns */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Most Common Time
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <CalendarMonthIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="500">
                  {stats.averageEntryTime}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                For making your entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekday Pattern */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Day Pattern
              </Typography>
              <Box display="flex" flexDirection="column" mt={1}>
                <Box display="flex" alignItems="center">
                  <BoltIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    Most active: <strong>{stats.weekdayCompletion.most}</strong>
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mt={0.5}>
                  <BoltIcon color="error" sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    Least active: <strong>{stats.weekdayCompletion.least}</strong>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Current Recovery Metrics */}
      <Typography variant="subtitle1" gutterBottom>
        Recovery Insights
      </Typography>

      <Grid container spacing={2}>
        {/* Current Streak */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Current Streak
              </Typography>
              <Typography variant="h3" fontWeight="500">
                {streakData.currentStreak}
                <Typography component="span" variant="h6" sx={{ opacity: 0.8, ml: 1 }}>
                  {streakData.currentStreak === 1 ? 'Day' : 'Days'}
                </Typography>
              </Typography>

              <Box display="flex" mt={1}>
                <Tooltip title="Your current streak health">
                  <Chip
                    label={
                      streakData.streakHealth === 'strong' ? 'Strong' :
                      streakData.streakHealth === 'recovering' ? 'Recovering' :
                      'Broken'
                    }
                    size="small"
                    color="default"
                    sx={{
                      bgcolor:
                        streakData.streakHealth === 'strong' ? 'success.main' :
                        streakData.streakHealth === 'recovering' ? 'warning.main' :
                        'error.main',
                      color: 'white',
                      mr: 1
                    }}
                  />
                </Tooltip>

                {streakData.streakHealth === 'strong' && streakData.currentStreak >= 3 && (
                  <Tooltip title="Consistency achievement">
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label="On Track"
                      size="small"
                      sx={{ bgcolor: 'success.dark', color: 'white' }}
                    />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Longest Streak */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Longest Streak
              </Typography>
              <Typography variant="h4" fontWeight="500">
                {streakData.longestStreak}
                <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                  {streakData.longestStreak === 1 ? 'Day' : 'Days'}
                </Typography>
              </Typography>

              {streakData.currentStreak >= streakData.longestStreak && streakData.currentStreak > 0 && (
                <Chip
                  label="Current Record!"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}

              {streakData.currentStreak < streakData.longestStreak && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {streakData.longestStreak - streakData.currentStreak} days to beat your record
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Total Entries */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Inventory Entries
              </Typography>
              <Typography variant="h4" fontWeight="500">
                {streakData.totalEntries || 0}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your personal inventory practice
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={2} display="flex" justifyContent="center">
        <Typography variant="body2" color="text.secondary">
          Statistics based on your entry patterns since you started tracking
        </Typography>
      </Box>
    </Paper>
  );
}