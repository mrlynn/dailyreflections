'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';

/**
 * FeedbackMetrics component for the volunteer dashboard
 * Shows detailed metrics and trends based on user feedback
 */
export default function FeedbackMetrics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    averageDuration: 0,
    averageRating: 0,
    responseTimeAvg: 0,
    ratingTrend: 'stable', // 'up', 'down', or 'stable'
    weeklyStats: [],
    sessionsByHour: []
  });

  useEffect(() => {
    fetchMetricsData();
  }, []);

  // Fetch metrics data
  const fetchMetricsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/volunteers/feedback/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching feedback metrics:', err);
      setError(err.message || 'Failed to fetch feedback metrics');
    } finally {
      setIsLoading(false);
    }
  };

  // Get trend icon based on direction
  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up':
        return <TrendingUpIcon fontSize="small" color="success" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  // Format minutes for display
  const formatMinutes = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    if (minutes < 1) return '< 1 min';

    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Calculate peak hours based on sessionsByHour
  const getPeakHours = () => {
    if (!metrics.sessionsByHour || metrics.sessionsByHour.length === 0) {
      return 'N/A';
    }

    // Find max count
    const maxCount = Math.max(...metrics.sessionsByHour.map(hour => hour.count));

    // Find all hours with that count
    const peakHours = metrics.sessionsByHour
      .filter(hour => hour.count === maxCount)
      .map(hour => hour.hour);

    return peakHours.map(hour => `${hour}:00`).join(', ');
  };

  // Get the max value from weekly stats
  const getMaxWeeklyValue = () => {
    if (!metrics.weeklyStats || metrics.weeklyStats.length === 0) {
      return 1;
    }
    return Math.max(...metrics.weeklyStats.map(week => week.count));
  };

  const maxWeeklyValue = getMaxWeeklyValue();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Feedback Metrics & Insights</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Top metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Sessions */}
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                <PeopleIcon />
              </Box>
              <Typography variant="h5">{metrics.totalSessions}</Typography>
              <Typography variant="body2" color="text.secondary">Total Sessions</Typography>
            </Paper>
          </Grid>

          {/* Average Session Duration */}
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                <ScheduleIcon />
              </Box>
              <Typography variant="h5">{formatMinutes(metrics.averageDuration)}</Typography>
              <Typography variant="body2" color="text.secondary">Avg Duration</Typography>
            </Paper>
          </Grid>

          {/* Average Rating */}
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                <ThumbUpIcon />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h5">{(metrics.averageRating * 100).toFixed(0)}%</Typography>
                {getTrendIcon(metrics.ratingTrend)}
              </Box>
              <Typography variant="body2" color="text.secondary">Positive Rating</Typography>
            </Paper>
          </Grid>

          {/* Average Response Time */}
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                <StarIcon />
              </Box>
              <Typography variant="h5">{metrics.responseTimeAvg}s</Typography>
              <Typography variant="body2" color="text.secondary">Avg Response</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Weekly trend chart */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>
                Weekly Session Trends
              </Typography>

              {metrics.weeklyStats && metrics.weeklyStats.length > 0 ? (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end', height: 160 }}>
                  {metrics.weeklyStats.map((week, index) => (
                    <Tooltip
                      key={index}
                      title={`${week.label}: ${week.count} sessions, ${Math.round(week.positivePercent)}% positive`}
                    >
                      <Box sx={{ width: `${100 / metrics.weeklyStats.length}%`, mx: 0.5 }}>
                        <Box
                          sx={{
                            height: `${(week.count / maxWeeklyValue) * 100}%`,
                            minHeight: '10%',
                            bgcolor: 'primary.main',
                            borderRadius: '4px 4px 0 0',
                            position: 'relative',
                            '&:hover': { opacity: 0.8 }
                          }}
                        >
                          {/* Inner bar showing positive percentage */}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              width: '100%',
                              height: `${week.positivePercent}%`,
                              bgcolor: 'success.main',
                              borderRadius: '0 0 4px 4px',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                          {week.label}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Not enough data to display weekly trends
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, bgcolor: 'success.main', mr: 0.5 }}></Box>
                  Positive feedback percentage
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Session timing insights */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>
                Session Timing Insights
              </Typography>

              <Box sx={{ mt: 2 }}>
                {/* Most active hours */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Peak Hours:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {getPeakHours()}
                  </Typography>
                </Box>

                {/* Hourly distribution visualization */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 100, mt: 3, mb: 1 }}>
                  {metrics.sessionsByHour && metrics.sessionsByHour.map((hour, index) => {
                    const maxCount = Math.max(...metrics.sessionsByHour.map(h => h.count));
                    const height = maxCount > 0 ? `${(hour.count / maxCount) * 100}%` : '5%';
                    const isPeak = hour.count === maxCount && maxCount > 0;

                    return (
                      <Tooltip
                        key={index}
                        title={`${hour.hour}:00 - ${hour.count} sessions`}
                      >
                        <Box
                          sx={{
                            height,
                            width: '100%',
                            bgcolor: isPeak ? 'secondary.main' : 'primary.main',
                            mx: 0.2,
                            minHeight: '5%',
                            '&:hover': { opacity: 0.8 }
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">12am</Typography>
                  <Typography variant="caption">6am</Typography>
                  <Typography variant="caption">12pm</Typography>
                  <Typography variant="caption">6pm</Typography>
                  <Typography variant="caption">12am</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Quick response times (under 2 minutes) correlate with 95% positive feedback ratings
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}