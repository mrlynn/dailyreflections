'use client';

import { Box, Typography, Paper, Tooltip, useTheme } from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import WaterIcon from '@mui/icons-material/Water';
import LandscapeIcon from '@mui/icons-material/Landscape';
import WavesIcon from '@mui/icons-material/Waves';
import FlowerIcon from '@mui/icons-material/LocalFlorist';
import AltRouteIcon from '@mui/icons-material/AltRoute';

/**
 * JourneyPath Component
 *
 * Displays a visual metaphor of the user's recovery journey based on their streak progress.
 * Shows various elements unlocked as the user maintains their streak.
 *
 * @param {Object} props
 * @param {Object} props.visualProgress - Visual progress data from the streak API
 * @param {Number} props.currentStreak - Current streak count
 */
export default function JourneyPath({ visualProgress, currentStreak }) {
  const theme = useTheme();

  if (!visualProgress) {
    return null;
  }

  const { stage, pathPosition, unlockedElements = [] } = visualProgress;

  // Define colors based on theme
  const pathColor = theme.palette.primary.light;
  const pathColorDim = theme.palette.primary.light + '50'; // 50% opacity

  // Define milestone thresholds for path visualization
  const milestones = [
    { day: 3, element: 'path_start', icon: <LandscapeIcon />, label: 'Path Start', top: 70, left: 5 },
    { day: 7, element: 'tree_sapling', icon: <ForestIcon />, label: 'Sapling', top: 40, left: 20 },
    { day: 14, element: 'bridge', icon: <AltRouteIcon />, label: 'Bridge', top: 60, left: 35 },
    { day: 30, element: 'tree_growing', icon: <ForestIcon />, label: 'Growing Tree', top: 30, left: 50 },
    { day: 60, element: 'waterfall', icon: <WaterIcon />, label: 'Waterfall', top: 70, left: 65 },
    { day: 90, element: 'tree_mature', icon: <ForestIcon />, label: 'Mature Tree', top: 40, left: 80 },
    { day: 180, element: 'flower_garden', icon: <FlowerIcon />, label: 'Garden', top: 50, left: 90 },
    { day: 365, element: 'serenity_lake', icon: <WavesIcon />, label: 'Serenity Lake', top: 60, left: 95 }
  ];

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: theme.palette.background.default }}>
      <Typography variant="h6" gutterBottom>
        Your Recovery Journey
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Continue your daily reflection practice to progress along the path and unlock elements
        of the serenity landscape.
      </Typography>

      {/* Path visualization */}
      <Box
        sx={{
          position: 'relative',
          height: 200,
          bgcolor: theme.palette.background.paper,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: 'inset 0px 0px 5px rgba(0,0,0,0.1)'
        }}
      >
        {/* Background landscape elements */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(to bottom, ${theme.palette.background.paper}, ${theme.palette.success.light}30)`,
          borderTopLeftRadius: 100,
          borderTopRightradius: 10
        }} />

        {/* Path line */}
        <Box sx={{
          position: 'absolute',
          top: '60%',
          left: 0,
          width: '100%',
          height: 8,
          bgcolor: pathColorDim,
          zIndex: 1
        }} />

        {/* Progress on the path */}
        <Box sx={{
          position: 'absolute',
          top: '60%',
          left: 0,
          width: `${Math.min(100, pathPosition)}%`,
          height: 8,
          bgcolor: pathColor,
          zIndex: 2,
          transition: 'width 1s ease-in-out'
        }} />

        {/* Current position marker */}
        <Box sx={{
          position: 'absolute',
          top: 'calc(60% - 6px)',
          left: `${Math.min(98, pathPosition)}%`,
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: theme.palette.primary.main,
          zIndex: 3,
          transform: 'translateX(-50%)',
          boxShadow: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {currentStreak}
        </Box>

        {/* Milestone elements */}
        {milestones.map((milestone) => {
          const isUnlocked = unlockedElements.includes(milestone.element);
          const isNextMilestone = currentStreak < milestone.day &&
                                 milestone.day === Math.min(...milestones
                                              .filter(m => m.day > currentStreak)
                                              .map(m => m.day));

          return (
            <Tooltip
              key={milestone.element}
              title={
                isUnlocked
                  ? `${milestone.label} (Unlocked at ${milestone.day} days)`
                  : isNextMilestone
                    ? `${milestone.label} (Unlock at ${milestone.day} days - ${milestone.day - currentStreak} more to go!)`
                    : `${milestone.label} (Unlock at ${milestone.day} days)`
              }
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: `${milestone.top}%`,
                  left: `${milestone.left}%`,
                  transform: 'translateX(-50%)',
                  color: isUnlocked
                    ? milestone.element.includes('tree')
                      ? theme.palette.success.main
                      : theme.palette.primary.main
                    : theme.palette.action.disabled,
                  opacity: isUnlocked ? 1 : isNextMilestone ? 0.6 : 0.3,
                  fontSize: isUnlocked ? 30 : 24,
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateX(-50%) scale(1.2)'
                  }
                }}
              >
                {milestone.icon}
                {isNextMilestone && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -15,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: theme.palette.warning.light,
                      color: theme.palette.warning.contrastText,
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Next goal
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}

        {/* Day markers */}
        <Box sx={{ position: 'absolute', bottom: 10, left: 5, color: theme.palette.text.secondary, fontSize: '10px' }}>
          Day 1
        </Box>
        <Box sx={{ position: 'absolute', bottom: 10, left: '33%', color: theme.palette.text.secondary, fontSize: '10px' }}>
          Day 30
        </Box>
        <Box sx={{ position: 'absolute', bottom: 10, left: '66%', color: theme.palette.text.secondary, fontSize: '10px' }}>
          Day 90
        </Box>
        <Box sx={{ position: 'absolute', bottom: 10, right: 5, color: theme.palette.text.secondary, fontSize: '10px' }}>
          Day 365
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        {currentStreak === 0
          ? "Start your journey by completing today's reflection"
          : currentStreak === 1
          ? "You've taken the first step on your journey!"
          : `You've been on this path for ${currentStreak} days`}
      </Typography>
    </Paper>
  );
}