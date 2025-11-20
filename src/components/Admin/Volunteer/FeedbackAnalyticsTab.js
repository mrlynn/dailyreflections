'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Paper,
  Chip
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoIcon from '@mui/icons-material/Info';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Color constants
const COLORS = {
  primary: '#5DA6A7',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  neutral: '#9E9E9E',
};

/**
 * FeedbackAnalyticsTab component for the admin volunteer analytics page
 * @param {Object} props
 * @param {Object} props.analytics - Analytics data from API
 */
export default function FeedbackAnalyticsTab({ analytics }) {
  // If no analytics data provided
  if (!analytics || !analytics.feedbackMetrics) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Feedback analytics data is not available or still loading.
      </Alert>
    );
  }

  const { feedbackMetrics } = analytics;

  // Prepare pie chart data
  const getFeedbackRatingData = () => {
    return [
      { name: 'Positive', value: feedbackMetrics.positive, color: COLORS.success },
      { name: 'Neutral', value: feedbackMetrics.neutral, color: COLORS.warning },
      { name: 'Flagged', value: feedbackMetrics.flagged, color: COLORS.error },
    ];
  };

  return (
    <Grid container spacing={3}>
      {/* Top metrics */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ThumbUpIcon sx={{ color: COLORS.success, fontSize: 40, mb: 1 }} />
                <Typography variant="h4">{feedbackMetrics.positive}</Typography>
                <Typography variant="body2" color="text.secondary">Positive Feedback</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <InfoIcon sx={{ color: COLORS.warning, fontSize: 40, mb: 1 }} />
                <Typography variant="h4">{feedbackMetrics.neutral}</Typography>
                <Typography variant="body2" color="text.secondary">Neutral Feedback</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ThumbDownIcon sx={{ color: COLORS.error, fontSize: 40, mb: 1 }} />
                <Typography variant="h4">{feedbackMetrics.flagged}</Typography>
                <Typography variant="body2" color="text.secondary">Flagged Feedback</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={feedbackMetrics.positivePercent}
                    size={40}
                    thickness={4}
                    sx={{ color: COLORS.success }}
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
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      {`${Math.round(feedbackMetrics.positivePercent)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4">{Math.round(feedbackMetrics.averageScore * 100)}%</Typography>
                <Typography variant="body2" color="text.secondary">Average Satisfaction</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Feedback distribution chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Feedback Distribution" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getFeedbackRatingData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getFeedbackRatingData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Feedback over time chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Feedback Trends Over Time" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={feedbackMetrics.timeBasedStats || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="positive"
                    name="Positive"
                    stroke={COLORS.success}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="neutral"
                    name="Neutral"
                    stroke={COLORS.warning}
                  />
                  <Line
                    type="monotone"
                    dataKey="flagged"
                    name="Flagged"
                    stroke={COLORS.error}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Response time impact */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Response Time vs. Feedback" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feedbackMetrics.responseTimeImpact || [
                    { range: '<2 min', positive: 95, neutral: 4, flagged: 1 },
                    { range: '2-5 min', positive: 80, neutral: 15, flagged: 5 },
                    { range: '5-10 min', positive: 60, neutral: 25, flagged: 15 },
                    { range: '>10 min', positive: 40, neutral: 30, flagged: 30 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar
                    dataKey="positive"
                    name="Positive"
                    stackId="a"
                    fill={COLORS.success}
                  />
                  <Bar
                    dataKey="neutral"
                    name="Neutral"
                    stackId="a"
                    fill={COLORS.warning}
                  />
                  <Bar
                    dataKey="flagged"
                    name="Flagged"
                    stackId="a"
                    fill={COLORS.error}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Session duration impact */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Session Duration vs. Feedback" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feedbackMetrics.durationImpact || [
                    { range: '<5 min', positive: 45, neutral: 30, flagged: 25 },
                    { range: '5-15 min', positive: 70, neutral: 20, flagged: 10 },
                    { range: '15-30 min', positive: 85, neutral: 10, flagged: 5 },
                    { range: '>30 min', positive: 65, neutral: 25, flagged: 10 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar
                    dataKey="positive"
                    name="Positive"
                    stackId="a"
                    fill={COLORS.success}
                  />
                  <Bar
                    dataKey="neutral"
                    name="Neutral"
                    stackId="a"
                    fill={COLORS.warning}
                  />
                  <Bar
                    dataKey="flagged"
                    name="Flagged"
                    stackId="a"
                    fill={COLORS.error}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent feedback comments */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Recent User Feedback"
            avatar={<FormatQuoteIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              {feedbackMetrics.recentComments && feedbackMetrics.recentComments.length > 0 ? (
                feedbackMetrics.recentComments.map((comment, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderLeft: 4,
                        borderColor:
                          comment.rating === 'positive' ? COLORS.success :
                          comment.rating === 'flagged' ? COLORS.error :
                          COLORS.warning
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                          size="small"
                          label={comment.rating.charAt(0).toUpperCase() + comment.rating.slice(1)}
                          color={
                            comment.rating === 'positive' ? 'success' :
                            comment.rating === 'flagged' ? 'error' :
                            'warning'
                          }
                          icon={
                            comment.rating === 'positive' ? <ThumbUpIcon fontSize="small" /> :
                            comment.rating === 'flagged' ? <ThumbDownIcon fontSize="small" /> :
                            <InfoIcon fontSize="small" />
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                        "{comment.comments}"
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No feedback comments available yet.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}