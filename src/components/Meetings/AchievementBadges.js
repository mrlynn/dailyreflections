'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tooltip,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * AchievementBadges Component
 * Displays badges for meeting attendance milestones
 */
export default function AchievementBadges({ stats }) {
  const theme = useTheme();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Meeting progress milestones
  const milestones = [
    {
      id: 'first-meeting',
      name: 'First Step',
      description: 'Attended your first meeting in the 90 in 90 challenge.',
      icon: <DirectionsRunIcon fontSize="large" />,
      color: '#3498db',
      threshold: 1,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 1
    },
    {
      id: 'week-1',
      name: 'One Week Strong',
      description: 'Completed your first week of meetings. Building momentum!',
      icon: <AutoAwesomeIcon fontSize="large" />,
      color: '#9b59b6',
      threshold: 7,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 7
    },
    {
      id: 'two-weeks',
      name: 'Two Week Milestone',
      description: 'Fourteen days of meetings. Your commitment is growing stronger.',
      icon: <PsychologyIcon fontSize="large" />,
      color: '#2ecc71',
      threshold: 14,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 14
    },
    {
      id: 'three-weeks',
      name: 'Three Week Achievement',
      description: 'Twenty-one days of meetings. You\'re forming a powerful habit.',
      icon: <LocalFireDepartmentIcon fontSize="large" />,
      color: '#e67e22',
      threshold: 21,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 21
    },
    {
      id: '30-days',
      name: 'One Month Complete',
      description: 'One third of your 90 in 90 challenge complete! A significant milestone.',
      icon: <StarIcon fontSize="large" />,
      color: '#e74c3c',
      threshold: 30,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 30
    },
    {
      id: '45-days',
      name: 'Halfway Point',
      description: 'You\'re halfway through your 90 in 90 challenge! Incredible dedication.',
      icon: <MilitaryTechIcon fontSize="large" />,
      color: '#f1c40f',
      threshold: 45,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 45
    },
    {
      id: '60-days',
      name: 'Two Month Milestone',
      description: 'Two thirds of your 90 in 90 challenge complete! Keep going!',
      icon: <WorkspacePremiumIcon fontSize="large" />,
      color: '#1abc9c',
      threshold: 60,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 60
    },
    {
      id: '75-days',
      name: 'Home Stretch',
      description: 'You\'ve completed 75 days of your challenge! The finish line is in sight.',
      icon: <GroupsIcon fontSize="large" />,
      color: '#3498db',
      threshold: 75,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 75
    },
    {
      id: '90-days',
      name: '90 in 90 Complete',
      description: 'You\'ve successfully completed the 90 in 90 challenge! A remarkable achievement in your recovery journey.',
      icon: <EmojiEventsIcon fontSize="large" />,
      color: '#f39c12',
      threshold: 90,
      unlocked: (stats?.ninetyInNinety?.progress || 0) >= 90
    }
  ];

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  // Get the next milestone to work toward
  const getNextMilestone = () => {
    const nextMilestone = milestones.find(milestone => !milestone.unlocked);
    return nextMilestone;
  };

  const nextMilestone = getNextMilestone();

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        background: () => theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #27313d 0%, #1e2429 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MilitaryTechIcon sx={{ mr: 1 }} />
        Meeting Milestones
      </Typography>

      {nextMilestone && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mb: 4,
            background: () => `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.primary.main}11)`,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'primary.main'
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0.7,
                mr: { xs: 0, sm: 3 },
                mb: { xs: 2, sm: 0 },
                position: 'relative',
              }}
            >
              {React.cloneElement(nextMilestone.icon, {
                sx: { color: 'primary.main', fontSize: 40 }
              })}
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', opacity: 0.7 },
                    '50%': { transform: 'scale(1.1)', opacity: 1 },
                    '100%': { transform: 'scale(1)', opacity: 0.7 },
                  }
                }}
              />
            </Box>
            <Box>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Next Milestone: {nextMilestone.name}
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                {nextMilestone.description}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {nextMilestone.threshold - (stats?.ninetyInNinety?.progress || 0)} more meetings to unlock
                ({nextMilestone.threshold} total)
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {milestones.map((badge) => (
          <Grid item xs={4} sm={3} md={2} lg={1.33} key={badge.id}>
            <Tooltip title={badge.unlocked ? "Click to view details" : "Keep attending meetings to unlock"}>
              <Box
                onClick={() => badge.unlocked && handleBadgeClick(badge)}
                sx={{
                  cursor: badge.unlocked ? 'pointer' : 'default',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: badge.unlocked ? 'scale(1.05)' : 'none',
                  }
                }}
              >
                <Paper
                  elevation={badge.unlocked ? 2 : 0}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderRadius: 2,
                    height: '100%',
                    bgcolor: badge.unlocked ? 'background.paper' : 'action.disabledBackground',
                    border: '1px solid',
                    borderColor: badge.unlocked ? badge.color : 'divider',
                    opacity: badge.unlocked ? 1 : 0.5,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {badge.unlocked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `radial-gradient(circle at center, ${badge.color}22 0%, transparent 70%)`,
                        opacity: 0.7
                      }}
                    />
                  )}

                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: badge.unlocked ? badge.color : 'action.hover',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto',
                        mb: 1
                      }}
                    >
                      {badge.unlocked ? (
                        badge.icon
                      ) : (
                        <Typography variant="body2" fontWeight="bold">
                          {badge.threshold}
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: badge.unlocked ? 'bold' : 'normal',
                        color: badge.unlocked ? 'text.primary' : 'text.disabled',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {badge.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      {badge.threshold} days
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Milestone progress timeline - Full width */}
      <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
        <Box sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          py: 3
        }}>
          {/* Horizontal progress line */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '3px',
            bgcolor: 'divider',
            zIndex: 0
          }} />

          {/* Milestone markers */}
          {[1, 7, 14, 21, 30, 45, 60, 75, 90].map((day) => {
            const isReached = (stats?.ninetyInNinety?.progress || 0) >= day;
            const isNextMilestone = day > (stats?.ninetyInNinety?.progress || 0) &&
              (!nextMilestone || day <= nextMilestone.threshold);

            return (
              <Box key={day} sx={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                width: 'auto'
              }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: isReached ? 'success.main' : 'background.paper',
                  border: t => isNextMilestone ? `2px dashed ${t.palette.primary.main}` : `1px solid ${t.palette.divider}`,
                  color: isReached ? 'white' : 'text.secondary',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: 1,
                  boxShadow: 1,
                  ...(isNextMilestone && {
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 0.7 },
                      '50%': { transform: 'scale(1.1)', opacity: 1 },
                      '100%': { transform: 'scale(1)', opacity: 0.7 },
                    }
                  })
                }}>
                  {day}
                </Box>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {day === 1 && 'First Step'}
                  {day === 7 && 'One Week'}
                  {day === 14 && 'Two Weeks'}
                  {day === 21 && 'Three Weeks'}
                  {day === 30 && 'One Month'}
                  {day === 45 && 'Halfway'}
                  {day === 60 && 'Two Months'}
                  {day === 75 && 'Home Stretch'}
                  {day === 90 && '90 in 90 Complete'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Badge detail dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
      >
        {selectedBadge && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              {selectedBadge.name}
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  }
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: selectedBadge.color,
                      color: '#fff',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                      mx: 'auto',
                      boxShadow: 3
                    }}
                  >
                    {React.cloneElement(selectedBadge.icon, { style: { fontSize: 40 } })}
                  </Box>
                </Badge>

                <Typography variant="body1" sx={{ mt: 2 }}>
                  {selectedBadge.description}
                </Typography>

                <Chip
                  label={`Unlocked at ${selectedBadge.threshold} meetings`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                />

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                  Earned on {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Paper>
  );
}