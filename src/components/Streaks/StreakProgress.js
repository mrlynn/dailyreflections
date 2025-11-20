'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LandscapeIcon from '@mui/icons-material/Landscape';
import ForestIcon from '@mui/icons-material/Forest';

/**
 * StreakProgress Component
 *
 * Displays a user's streak progress, milestones, and recovery options
 * for their 10th Step inventory practice.
 *
 * @param {Object} props
 * @param {String} props.userId - The user's ID
 * @param {String} props.journalType - The journal type ('step10', 'journal', 'gratitude')
 * @param {Boolean} props.compact - Whether to show compact view or full view
 */
export default function StreakProgress({ userId, journalType = 'step10', compact = false }) {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recoveringStreak, setRecoveringStreak] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState(null);

  // Fetch streak data on mount
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try the enhanced streak API
        const response = await fetch(`/api/streaks?journalType=${journalType}`);

        if (!response.ok) {
          throw new Error('Failed to load streak data');
        }

        const data = await response.json();
        setStreakData(data.streak);
      } catch (err) {
        console.error('Error fetching streak data:', err);
        try {
          // Fall back to basic streak info from insights API
          const fallbackResponse = await fetch(`/api/journal/insights?journalType=${journalType}`);
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            setStreakData({
              currentStreak: data.insights.streakInfo.currentStreak,
              longestStreak: data.insights.streakInfo.longestStreak,
              lastEntryDate: data.insights.streakInfo.lastEntryDate,
              streakHealth: 'strong',
              totalEntries: data.insights.moodStats?.entries || 0,
              isEnhanced: false
            });
          } else {
            setError('Failed to load streak information');
          }
        } catch (fallbackErr) {
          setError('Failed to load streak information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, [journalType]);

  // Handle streak recovery
  const handleRecoverStreak = async () => {
    if (!streakData) return;

    try {
      setRecoveringStreak(true);
      setRecoveryError(null);

      const response = await fetch('/api/streaks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'recover',
          journalType,
          recoveryReason: 'manual_recovery'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recover streak');
      }

      const data = await response.json();
      setStreakData(data.streak);
      setRecoverySuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setRecoverySuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error recovering streak:', err);
      setRecoveryError(err.message);
    } finally {
      setRecoveringStreak(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  // No streak data state
  if (!streakData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No streak information available yet. Start your daily inventory to begin tracking your progress.
      </Alert>
    );
  }

  // Streak health color
  const streakHealthColor = {
    strong: 'success',
    recovering: 'warning',
    broken: 'error'
  }[streakData.streakHealth] || 'primary';

  // Render compact view (for dashboards or cards)
  if (compact) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            <LocalFireDepartmentIcon
              color={streakHealthColor}
              sx={{ fontSize: 28, mr: 1 }}
            />
            <Typography variant="h6" component="div">
              {streakData.currentStreak} {streakData.currentStreak === 1 ? 'Day' : 'Days'}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {streakData.streakHealth === 'strong' ? 'Strong streak' :
             streakData.streakHealth === 'recovering' ? 'Recovering streak' :
             'Streak broken'}
          </Typography>

          {streakData.visualProgress && (
            <LinearProgress
              variant="determinate"
              value={streakData.visualProgress.pathPosition}
              color={streakHealthColor}
              sx={{ height: 8, borderRadius: 1, mb: 1 }}
            />
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Total entries: {streakData.totalEntries || 0}
            </Typography>

            {streakData.streakFreezes > 0 && (
              <Tooltip title={`${streakData.streakFreezes} freeze${streakData.streakFreezes !== 1 ? 's' : ''} available`}>
                <Chip
                  icon={<AcUnitIcon />}
                  label={streakData.streakFreezes}
                  size="small"
                  color="info"
                />
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Render full view
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocalFireDepartmentIcon
            color={streakHealthColor}
            sx={{ fontSize: 28, mr: 1 }}
          />
          Streak Tracker
          <Tooltip title="Track your consistency with daily reflections. The longer your streak, the more progress you'll make on your recovery journey.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
      </Box>

      {/* Recovery success message */}
      {recoverySuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Streak successfully recovered!
        </Alert>
      )}

      {/* Recovery error message */}
      {recoveryError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRecoveryError(null)}>
          {recoveryError}
        </Alert>
      )}

      {/* Streak Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={4} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Current Streak</Typography>
              <Typography variant="h3" component="div" fontWeight="500">
                {streakData.currentStreak}
                <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                  {streakData.currentStreak === 1 ? 'Day' : 'Days'}
                </Typography>
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Longest Streak</Typography>
              <Typography variant="h5" component="div" fontWeight="500">
                {streakData.longestStreak}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {streakData.longestStreak === 1 ? 'Day' : 'Days'}
                </Typography>
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Total Entries</Typography>
              <Typography variant="h5" component="div" fontWeight="500">
                {streakData.totalEntries || 0}
              </Typography>
            </Box>
          </Box>

          {/* Streak Health Status */}
          <Box display="flex" alignItems="center" mb={1}>
            <Chip
              label={
                streakData.streakHealth === 'strong' ? 'Strong Streak' :
                streakData.streakHealth === 'recovering' ? 'Recovering Streak' :
                'Streak Broken'
              }
              color={streakHealthColor}
              size="small"
              sx={{ mr: 1 }}
            />

            {streakData.streakFreezes > 0 && (
              <Tooltip title="Streak freezes protect your streak if you miss a day">
                <Chip
                  icon={<AcUnitIcon />}
                  label={`${streakData.streakFreezes} Freeze${streakData.streakFreezes !== 1 ? 's' : ''}`}
                  size="small"
                  color="info"
                  sx={{ mr: 1 }}
                />
              </Tooltip>
            )}

            {streakData.streakHealth === 'broken' && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<AutorenewIcon />}
                onClick={handleRecoverStreak}
                disabled={recoveringStreak ||
                  (streakData.recoveryGrace && !streakData.recoveryGrace.availableRecoveries)}
              >
                {recoveringStreak ? 'Recovering...' : 'Recover Streak'}
              </Button>
            )}
          </Box>

          {streakData.streakHealth === 'broken' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {(streakData.recoveryGrace && streakData.recoveryGrace.availableRecoveries > 0) ?
                `You have ${streakData.recoveryGrace.availableRecoveries} recovery option${
                  streakData.recoveryGrace.availableRecoveries !== 1 ? 's' : ''
                } available. Use it to recover your streak and continue your progress.` :
                "You've used all your recovery options. Start a new streak by completing today's reflection."
              }
            </Alert>
          )}

          {streakData.visualProgress && (
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Journey Progress - Stage {streakData.visualProgress.stage}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  {streakData.visualProgress.pathPosition}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={streakData.visualProgress.pathPosition}
                color={streakHealthColor}
                sx={{ height: 10, borderRadius: 1 }}
              />

              {/* Visual elements unlocked */}
              {streakData.visualProgress.unlockedElements &&
               streakData.visualProgress.unlockedElements.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {streakData.visualProgress.unlockedElements.includes('path_start') && (
                    <Tooltip title="Path Start - 3 days">
                      <Chip icon={<LandscapeIcon />} label="Path Start" size="small" variant="outlined" />
                    </Tooltip>
                  )}
                  {streakData.visualProgress.unlockedElements.includes('tree_sapling') && (
                    <Tooltip title="Tree Sapling - 7 days">
                      <Chip icon={<ForestIcon />} label="Sapling" size="small" variant="outlined" />
                    </Tooltip>
                  )}
                  {streakData.visualProgress.unlockedElements.includes('tree_growing') && (
                    <Tooltip title="Growing Tree - 30 days">
                      <Chip icon={<ForestIcon />} label="Growing Tree" size="small" variant="outlined" />
                    </Tooltip>
                  )}
                  {streakData.visualProgress.unlockedElements.includes('tree_mature') && (
                    <Tooltip title="Mature Tree - 90 days">
                      <Chip icon={<ForestIcon />} label="Mature Tree" size="small" variant="outlined" />
                    </Tooltip>
                  )}
                  {/* Add more visual elements as needed */}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      {streakData.milestones && streakData.milestones.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
            Milestones Achieved
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            {streakData.milestones
              .sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt))
              .slice(0, 3)
              .map((milestone, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {milestone.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {milestone.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={milestone.type === 'streak' ? 'Streak' : 'Entries'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(milestone.achievedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            }

            {streakData.milestones.length > 3 && (
              <Button variant="outlined" fullWidth>
                View All {streakData.milestones.length} Milestones
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Information about streak tracking */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mt: 3 }}
      >
        <Typography variant="body2">
          Maintaining a consistent practice of daily inventory helps strengthen your recovery program.
          Your streak is protected for one day if you miss an entry, and you can earn additional streak
          freezes as you progress.
        </Typography>
      </Alert>
    </Paper>
  );
}