'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoIcon from '@mui/icons-material/Info';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useRouter } from 'next/navigation';

/**
 * FeedbackAnalytics component for the volunteer dashboard
 * Shows detailed feedback metrics and analytics from user ratings
 */
export default function FeedbackAnalytics() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState({
    positive: 0,
    neutral: 0,
    flagged: 0,
    total: 0,
    positivePercent: 0,
    neutralPercent: 0,
    flaggedPercent: 0,
    averageScore: 0,
    recentFeedback: []
  });

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  // Fetch feedback statistics
  const fetchFeedbackStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/volunteers/feedback/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback statistics');
      }

      const data = await response.json();
      setFeedbackStats(data);
    } catch (err) {
      console.error('Error fetching feedback statistics:', err);
      setError(err.message || 'Failed to fetch feedback statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate visual width for progress bars
  const getBarWidth = (percent) => {
    return `${Math.max(percent, 2)}%`; // Minimum 2% width for visibility
  };

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
          <FeedbackIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">User Feedback Analysis</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {feedbackStats.total === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No feedback data available yet. Feedback will appear here once users rate their chat sessions.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Main statistics */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Feedback Summary
                </Typography>

                {/* Positive */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ThumbUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                      <Typography variant="body2">Positive</Typography>
                    </Box>
                    <Typography variant="body2">
                      {feedbackStats.positive} ({Math.round(feedbackStats.positivePercent)}%)
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: getBarWidth(feedbackStats.positivePercent),
                        bgcolor: 'success.main'
                      }}
                    />
                  </Box>
                </Box>

                {/* Neutral */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ fontSize: 16, color: 'warning.main', mr: 1 }} />
                      <Typography variant="body2">Neutral</Typography>
                    </Box>
                    <Typography variant="body2">
                      {feedbackStats.neutral} ({Math.round(feedbackStats.neutralPercent)}%)
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: getBarWidth(feedbackStats.neutralPercent),
                        bgcolor: 'warning.main'
                      }}
                    />
                  </Box>
                </Box>

                {/* Flagged */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ThumbDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 1 }} />
                      <Typography variant="body2">Flagged</Typography>
                    </Box>
                    <Typography variant="body2">
                      {feedbackStats.flagged} ({Math.round(feedbackStats.flaggedPercent)}%)
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: getBarWidth(feedbackStats.flaggedPercent),
                        bgcolor: 'error.main'
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Tooltip title="Total number of feedback ratings received">
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Total Feedback</Typography>
                      <Typography variant="h6">{feedbackStats.total}</Typography>
                    </Box>
                  </Tooltip>

                  <Tooltip title="Average feedback score (1.0=all positive, 0.0=all flagged)">
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Average Score</Typography>
                      <Typography variant="h6">{feedbackStats.averageScore.toFixed(2)}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>

            {/* Recent feedback */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Feedback
                </Typography>

                {feedbackStats.recentFeedback && feedbackStats.recentFeedback.length > 0 ? (
                  <List dense disablePadding>
                    {feedbackStats.recentFeedback.slice(0, 3).map((feedback) => (
                      <ListItem key={feedback._id} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {feedback.rating === 'positive' && <ThumbUpIcon fontSize="small" color="success" sx={{ mr: 1 }} />}
                              {feedback.rating === 'neutral' && <InfoIcon fontSize="small" color="warning" sx={{ mr: 1 }} />}
                              {feedback.rating === 'flagged' && <ThumbDownIcon fontSize="small" color="error" sx={{ mr: 1 }} />}
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {feedback.rating.charAt(0).toUpperCase() + feedback.rating.slice(1)}
                              </Typography>
                              <Box sx={{ ml: 'auto' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            feedback.comments ? (
                              <Typography variant="caption" component="div" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                "{feedback.comments.length > 80 ? feedback.comments.substring(0, 80) + '...' : feedback.comments}"
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No comments provided
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No feedback comments yet
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    endIcon={<BarChartIcon />}
                    onClick={() => router.push('/volunteer/feedback')}
                  >
                    View All Feedback
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Feedback insights */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: 'info.main', mr: 1 }} />
                  <Typography variant="subtitle2">Response Time vs. Feedback</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 1 }}>
                  Sessions with faster response times tend to receive more positive feedback
                </Typography>

                <Box sx={{ height: 40, display: 'flex', alignItems: 'flex-end', mt: 1 }}>
                  {/* This is a simple visualization - would be replaced with a real chart in production */}
                  <Tooltip title="< 2 min: 95% positive">
                    <Box sx={{ height: '95%', width: '25%', bgcolor: 'success.main', mx: 0.5, borderRadius: '4px 4px 0 0' }}></Box>
                  </Tooltip>
                  <Tooltip title="2-5 min: 80% positive">
                    <Box sx={{ height: '80%', width: '25%', bgcolor: 'success.light', mx: 0.5, borderRadius: '4px 4px 0 0' }}></Box>
                  </Tooltip>
                  <Tooltip title="5-10 min: 60% positive">
                    <Box sx={{ height: '60%', width: '25%', bgcolor: 'warning.light', mx: 0.5, borderRadius: '4px 4px 0 0' }}></Box>
                  </Tooltip>
                  <Tooltip title="> 10 min: 40% positive">
                    <Box sx={{ height: '40%', width: '25%', bgcolor: 'error.light', mx: 0.5, borderRadius: '4px 4px 0 0' }}></Box>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">{'<2 min'}</Typography>
                  <Typography variant="caption" color="text.secondary">2-5 min</Typography>
                  <Typography variant="caption" color="text.secondary">5-10 min</Typography>
                  <Typography variant="caption" color="text.secondary">{'>10 min'}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}