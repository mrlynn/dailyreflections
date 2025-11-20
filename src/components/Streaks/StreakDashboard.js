'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import InsightsIcon from '@mui/icons-material/Insights';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LandscapeIcon from '@mui/icons-material/Landscape';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import custom components
import StreakProgress from './StreakProgress';
import MilestoneDisplay from './MilestoneDisplay';
import JourneyPath from './JourneyPath';
import StreakStats from './StreakStats';

/**
 * TabPanel component for tabs
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`streak-tabpanel-${index}`}
      aria-labelledby={`streak-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * StreakDashboard Component
 *
 * Main component that integrates all streak tracking features into a cohesive dashboard
 *
 * @param {Object} props
 * @param {String} props.userId - The user ID
 * @param {String} props.journalType - Journal type ('step10', 'journal', 'gratitude')
 */
export default function StreakDashboard({ userId, journalType = 'step10' }) {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [insights, setInsights] = useState(null);

  // Fetch streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get streak data from the API
        const response = await fetch(`/api/streaks?journalType=${journalType}`);

        if (!response.ok) {
          throw new Error('Failed to fetch streak data');
        }

        const data = await response.json();
        setStreakData(data.streak);

        // Get additional insights if available
        try {
          const insightsResponse = await fetch(`/api/streaks/insights?journalType=${journalType}`);

          if (insightsResponse.ok) {
            const insightsData = await insightsResponse.json();
            setInsights(insightsData.insights);
          }
        } catch (insightsError) {
          console.error('Error fetching insights (non-critical):', insightsError);
          // Non-critical error, just log it
        }
      } catch (err) {
        console.error('Error fetching streak data:', err);
        setError('Failed to load streak information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, [journalType]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Mark a milestone as viewed
  const handleViewMilestone = async (milestone) => {
    try {
      // This would typically update the milestone's viewed status via API
      console.log('Marking milestone as viewed:', milestone);

      // For now, update locally
      if (streakData && streakData.milestones) {
        const updatedMilestones = streakData.milestones.map(m => {
          if (m.achievedAt === milestone.achievedAt && m.type === milestone.type && m.threshold === milestone.threshold) {
            return { ...m, viewed: true };
          }
          return m;
        });

        setStreakData({ ...streakData, milestones: updatedMilestones });
      }
    } catch (err) {
      console.error('Error marking milestone as viewed:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // No streak data state
  if (!streakData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Start your daily reflections to begin tracking your streak and progress.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Main streak progress card */}
      <StreakProgress
        userId={userId}
        journalType={journalType}
        compact={false}
      />

      {/* Tab navigation for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          aria-label="streak dashboard tabs"
        >
          <Tab
            icon={<LandscapeIcon />}
            iconPosition="start"
            label="Journey"
            id="streak-tab-0"
            aria-controls="streak-tabpanel-0"
          />
          <Tab
            icon={<EmojiEventsIcon />}
            iconPosition="start"
            label="Milestones"
            id="streak-tab-1"
            aria-controls="streak-tabpanel-1"
          />
          <Tab
            icon={<InsightsIcon />}
            iconPosition="start"
            label="Insights"
            id="streak-tab-2"
            aria-controls="streak-tabpanel-2"
          />
        </Tabs>

        {/* Journey Tab */}
        <TabPanel value={activeTab} index={0}>
          <JourneyPath
            visualProgress={streakData.visualProgress}
            currentStreak={streakData.currentStreak}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Your recovery journey visualization evolves as you maintain your streak.
            </Typography>
          </Box>
        </TabPanel>

        {/* Milestones Tab */}
        <TabPanel value={activeTab} index={1}>
          <MilestoneDisplay
            milestones={streakData.milestones || []}
            journalType={journalType}
            onViewMilestone={handleViewMilestone}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Milestones are awarded at key points in your recovery journey.
            </Typography>
          </Box>
        </TabPanel>

        {/* Insights Tab */}
        <TabPanel value={activeTab} index={2}>
          <StreakStats
            streakData={streakData}
            streakHistory={streakData.streakHistory || []}
            insights={insights}
          />
        </TabPanel>
      </Paper>

      {/* Streak help information */}
      <Alert
        severity="info"
        icon={<HelpOutlineIcon />}
        sx={{ mt: 2 }}
      >
        <Typography variant="body2">
          Maintaining a consistent daily inventory practice helps strengthen your recovery program.
          Your streak tracks your consistency and rewards your progress through milestones and visual elements.
        </Typography>
      </Alert>
    </Box>
  );
}