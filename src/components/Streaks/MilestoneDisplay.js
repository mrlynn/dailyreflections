'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

/**
 * MilestoneDisplay Component
 *
 * Displays a user's earned milestones and achievements
 *
 * @param {Object} props
 * @param {Array} props.milestones - Array of milestone objects
 * @param {String} props.journalType - The journal type ('step10', 'journal', 'gratitude')
 * @param {Function} props.onViewMilestone - Function to call when marking a milestone as viewed
 */
export default function MilestoneDisplay({ milestones = [], journalType = 'step10', onViewMilestone }) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Handle milestone click
  const handleMilestoneClick = (milestone) => {
    setSelectedMilestone(milestone);
    if (onViewMilestone && milestone && !milestone.viewed) {
      onViewMilestone(milestone);
    }
  };

  // Close milestone detail dialog
  const handleCloseDialog = () => {
    setSelectedMilestone(null);
  };

  // If no milestones, show empty state
  if (!milestones || milestones.length === 0) {
    return (
      <Card sx={{ mb: 3, textAlign: 'center', py: 3 }}>
        <CardContent>
          <EmojiEventsIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Milestones Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Continue your daily inventory practice to earn milestone achievements.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Group milestones by type
  const streakMilestones = milestones.filter(m => m.type === 'streak');
  const entriesMilestones = milestones.filter(m => m.type === 'entries');
  const otherMilestones = milestones.filter(m => m.type !== 'streak' && m.type !== 'entries');

  // Sort milestones by threshold (ascending)
  const sortMilestones = (a, b) => b.threshold - a.threshold;

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
          Milestones & Achievements
        </Typography>

        {/* Streak Milestones */}
        {streakMilestones.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Streak Milestones
            </Typography>
            <Grid container spacing={2}>
              {streakMilestones
                .sort(sortMilestones)
                .map((milestone, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`streak-${index}`}>
                    <MilestoneCard
                      milestone={milestone}
                      onClick={() => handleMilestoneClick(milestone)}
                    />
                  </Grid>
                ))
              }
            </Grid>
          </Box>
        )}

        {/* Entries Milestones */}
        {entriesMilestones.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Entry Count Milestones
            </Typography>
            <Grid container spacing={2}>
              {entriesMilestones
                .sort(sortMilestones)
                .map((milestone, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`entries-${index}`}>
                    <MilestoneCard
                      milestone={milestone}
                      onClick={() => handleMilestoneClick(milestone)}
                    />
                  </Grid>
                ))
              }
            </Grid>
          </Box>
        )}

        {/* Other Milestones */}
        {otherMilestones.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Other Achievements
            </Typography>
            <Grid container spacing={2}>
              {otherMilestones
                .map((milestone, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`other-${index}`}>
                    <MilestoneCard
                      milestone={milestone}
                      onClick={() => handleMilestoneClick(milestone)}
                    />
                  </Grid>
                ))
              }
            </Grid>
          </Box>
        )}
      </Box>

      {/* Milestone Detail Dialog */}
      <Dialog
        open={Boolean(selectedMilestone)}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedMilestone && (
          <>
            <DialogTitle sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {selectedMilestone.title}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedMilestone.description}
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={selectedMilestone.type === 'streak' ? 'Streak Milestone' : 'Entry Milestone'}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${selectedMilestone.threshold} ${
                    selectedMilestone.type === 'streak' ? 'Days' : 'Entries'
                  }`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Achieved ${new Date(selectedMilestone.achievedAt).toLocaleDateString()}`}
                  variant="outlined"
                  size="small"
                  color="success"
                  icon={<CheckCircleOutlineIcon />}
                />
              </Box>

              <Box sx={{ mt: 3, bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  What This Means For Your Recovery:
                </Typography>
                <Typography variant="body2">
                  {selectedMilestone.type === 'streak' ?
                    `Maintaining ${selectedMilestone.threshold} consecutive days of personal inventory demonstrates your commitment to ongoing self-examination and the principles of recovery.` :
                    `Completing ${selectedMilestone.threshold} inventory entries shows your dedication to the practice of honest self-reflection and personal growth.`
                  }
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseDialog} variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

/**
 * MilestoneCard - Individual milestone card component
 */
function MilestoneCard({ milestone, onClick }) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 2
        },
        position: 'relative'
      }}
    >
      {!milestone.viewed && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main'
          }}
        />
      )}
      <CardContent>
        <Typography variant="subtitle1" fontWeight="medium">
          {milestone.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            height: 40,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {milestone.description}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={`${milestone.threshold} ${
              milestone.type === 'streak' ? 'Days' : 'Entries'
            }`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Tooltip title={milestone.viewed ? "Already viewed" : "New milestone"}>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
              {milestone.viewed ?
                <VisibilityIcon fontSize="small" color="disabled" /> :
                <VisibilityOffIcon fontSize="small" color="primary" />
              }
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}