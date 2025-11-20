'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  useTheme
} from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import InsightsIcon from '@mui/icons-material/Insights';
import MoodIcon from '@mui/icons-material/Mood';

/**
 * MotivationalInsights Component
 * Provides encouragement and insights based on user's progress
 */
export default function MotivationalInsights({ stats }) {
  const theme = useTheme();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Progress percentage calculation
  const progressPercentage = stats?.ninetyInNinety?.progress
    ? Math.floor((stats.ninetyInNinety.progress / 90) * 100)
    : 0;

  // Days completed
  const daysCompleted = stats?.ninetyInNinety?.progress || 0;

  // Recovery quotes
  const recoveryQuotes = [
    {
      text: "Recovery is not a race. You don't have to feel guilty if you're not where you think you should be.",
      author: "Anonymous"
    },
    {
      text: "The best time to plant a tree was 20 years ago. The second best time is now.",
      author: "Chinese Proverb"
    },
    {
      text: "Progress, not perfection.",
      author: "Alcoholics Anonymous"
    },
    {
      text: "I don't have to be perfect, I just have to be present.",
      author: "Anonymous"
    },
    {
      text: "One day at a time.",
      author: "Recovery Wisdom"
    },
    {
      text: "Nothing changes if nothing changes.",
      author: "Anonymous"
    },
    {
      text: "You're only as sick as your secrets.",
      author: "Recovery Wisdom"
    },
    {
      text: "The man who moves a mountain begins by carrying away small stones.",
      author: "Confucius"
    },
    {
      text: "Faith without works is dead.",
      author: "Recovery Wisdom"
    },
    {
      text: "I've been absolutely terrified every moment of my life—and I've never let it keep me from doing a single thing I wanted to do.",
      author: "Georgia O'Keeffe"
    },
    {
      text: "We cannot solve our problems with the same thinking we used when we created them.",
      author: "Albert Einstein"
    },
    {
      text: "Rock bottom became the solid foundation on which I rebuilt my life.",
      author: "J.K. Rowling"
    }
  ];

  // Rotate quotes periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setQuoteIndex((prevIndex) => (prevIndex + 1) % recoveryQuotes.length);
        setFadeIn(true);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, [recoveryQuotes.length]);

  // Get tips based on progress
  const getTipsForStage = () => {
    if (progressPercentage < 25) {
      return [
        "Arrange your schedule to prioritize meeting attendance",
        "Try different meeting formats to find what resonates with you",
        "Exchange contact information with someone at each meeting",
        "Keep a simple journal of your meeting experiences"
      ];
    } else if (progressPercentage < 50) {
      return [
        "Start participating more actively in meetings",
        "Consider finding a temporary sponsor if you haven't already",
        "Look for patterns in what you're learning across meetings",
        "Start building a routine around recovery activities"
      ];
    } else if (progressPercentage < 75) {
      return [
        "Reflect on how your perspective has changed since starting",
        "Consider sharing your experience at meetings if you feel ready",
        "Strengthen connections with people you've met along the way",
        "Begin thinking about how to maintain momentum after 90 days"
      ];
    } else {
      return [
        "Plan for continuing meeting attendance after your 90 in 90",
        "Consider how to give back to others in early recovery",
        "Reflect on all you've learned and how you've grown",
        "Celebrate your accomplishment with trusted support people"
      ];
    }
  };

  // Get milestone effect message
  const getMilestoneEffect = () => {
    if (daysCompleted >= 90) {
      return "You've established a strong foundation for your recovery. The habits and connections you've built can support you for years to come.";
    } else if (daysCompleted >= 60) {
      return "Research shows that 60+ days of consistent practice strongly reinforces new neural pathways. You're rewiring your brain for recovery.";
    } else if (daysCompleted >= 30) {
      return "At 30+ days, you've begun forming new habits. Your brain is building new connections that support your recovery journey.";
    } else if (daysCompleted >= 15) {
      return "You're in the crucial phase where consistency begins to create momentum. Keep showing up—your brain is starting to adapt.";
    } else {
      return "Early days are about breaking the cycle and showing up. Each meeting reinforces your commitment to change.";
    }
  };

  const tips = getTipsForStage();

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InsightsIcon sx={{ mr: 1 }} />
        Recovery Insights
      </Typography>

      {/* Quote Card */}
      <Card
        elevation={1}
        sx={{
          mb: 3,
          borderRadius: 2,
          background: theme => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #2a3a4a 0%, #243141 100%)'
            : 'linear-gradient(145deg, #f9f9f9 0%, #f0f0f0 100%)',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -15,
            left: 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 2
          }}
        >
          <FormatQuoteIcon />
        </Box>
        <CardContent sx={{ pt: 4, pb: 3 }}>
          <Fade in={fadeIn} timeout={500}>
            <Box>
              <Typography
                variant="body1"
                sx={{ fontStyle: 'italic', mb: 1 }}
              >
                "{recoveryQuotes[quoteIndex].text}"
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'right' }}
              >
                — {recoveryQuotes[quoteIndex].author}
              </Typography>
            </Box>
          </Fade>
        </CardContent>
      </Card>

      {/* Progress Insight */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LightbulbIcon sx={{ mr: 1, fontSize: 20 }} />
          The Science Behind Your Progress
        </Typography>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="body2">
            {getMilestoneEffect()}
          </Typography>
        </Paper>
      </Box>

      {/* Helpful Tips */}
      <Box>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TipsAndUpdatesIcon sx={{ mr: 1, fontSize: 20 }} />
          Tips for Your Current Stage
        </Typography>
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <List dense disablePadding>
            {tips.map((tip, index) => (
              <ListItem
                key={index}
                divider={index < tips.length - 1}
                sx={{
                  bgcolor: index % 2 === 0
                    ? 'background.paper'
                    : theme => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)'
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {index % 2 === 0 ? (
                    <FavoriteIcon fontSize="small" color="primary" />
                  ) : (
                    <MoodIcon fontSize="small" color="secondary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={tip}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}