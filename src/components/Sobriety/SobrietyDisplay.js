'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Grid,
  Stack,
  CircularProgress,
  Button,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CelebrationIcon from '@mui/icons-material/Celebration';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import {
  formatSobrietyDate,
  calculateSobrietyMilestones,
  generateSobrietyTimeDescription,
  calculateSobrietyDetails
} from '@/utils/sobrietyUtils';

/**
 * Component to display sobriety information and statistics
 */
export default function SobrietyDisplay({ sobrietyDate, compact = false }) {
  const [sobrietyDetails, setSobrietyDetails] = useState({
    totalDays: 0,
    totalHours: 0,
    years: 0,
    months: 0,
    days: 0,
    hours: 0
  });
  const [milestones, setMilestones] = useState([]);
  const [timeDescription, setTimeDescription] = useState('');
  const [nextMilestone, setNextMilestone] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);
  const shareStatusTimeout = useRef(null);

  useEffect(() => {
    if (sobrietyDate) {
      const details = calculateSobrietyDetails(sobrietyDate);
      setSobrietyDetails(details);

      const allMilestones = calculateSobrietyMilestones(sobrietyDate);
      setMilestones(allMilestones);

      const next = allMilestones.find((m) => !m.achieved) || null;
      setNextMilestone(next);

      setTimeDescription(generateSobrietyTimeDescription(sobrietyDate));
    } else {
      setSobrietyDetails({
        totalDays: 0,
        totalHours: 0,
        years: 0,
        months: 0,
        days: 0,
        hours: 0
      });
      setMilestones([]);
      setNextMilestone(null);
      setTimeDescription('');
    }
  }, [sobrietyDate]);

  const achievedMilestones = milestones.filter((milestone) => milestone.achieved);
  const lastAchieved = achievedMilestones[achievedMilestones.length - 1] || null;
  const lastAchievedIndex = lastAchieved
    ? milestones.findIndex((milestone) => milestone.days === lastAchieved.days)
    : -1;
  const previousMilestoneDays = lastAchieved ? lastAchieved.days : 0;

  let progressPercent = 100;
  let progressSummary = 'Celebrating every milestone!';

  if (nextMilestone) {
    const distanceToTarget = nextMilestone.days - previousMilestoneDays;
    const progressValue = sobrietyDetails.totalDays - previousMilestoneDays;
    progressPercent =
      distanceToTarget > 0 ? Math.min(100, (progressValue / distanceToTarget) * 100) : 0;
    progressSummary = `${nextMilestone.daysUntil} days until ${nextMilestone.name}`;
  } else if (!lastAchieved) {
    progressPercent = sobrietyDetails.totalDays > 0 ? 100 : 0;
    progressSummary = 'Your journey is just beginning.';
  } else if (lastAchieved) {
    progressPercent = 100;
    progressSummary = `You've reached every milestone we track.`;
  }

  const statCards = [
    {
      label: 'Years',
      value: sobrietyDetails.years,
      icon: CalendarTodayIcon
    },
    {
      label: 'Months',
      value: sobrietyDetails.months,
      icon: TrackChangesIcon
    },
    {
      label: 'Days',
      value: sobrietyDetails.days,
      icon: WbSunnyIcon
    },
    {
      label: 'Total Hours',
      value: sobrietyDetails.totalHours.toLocaleString(),
      icon: AccessTimeIcon
    }
  ];

  const getMilestoneColor = (days) => {
    if (days <= 1) return 'success';
    if (days <= 90) return 'info';
    if (days < 365) return 'secondary';
    if (days < 1825) return 'primary';
    return 'warning';
  };

  useEffect(() => {
    return () => {
      if (shareStatusTimeout.current) {
        clearTimeout(shareStatusTimeout.current);
      }
    };
  }, []);

  const handleShareProgress = async () => {
    if (typeof window === 'undefined') return;
    const message = `I'm ${sobrietyDetails.totalDays} days sober!`;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Sobriety Progress',
          text: message,
          url
        });
        setShareStatus('Thanks for sharing your milestone!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${message} ${url}`);
        setShareStatus('Link copied to your clipboard.');
      } else {
        setShareStatus('Sharing is not supported on this device yet.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareStatus('We could not complete the share.');
      }
    }

    if (shareStatusTimeout.current) {
      clearTimeout(shareStatusTimeout.current);
    }
    shareStatusTimeout.current = setTimeout(() => setShareStatus(null), 4000);
  };

  if (!sobrietyDate) {
    return (
      <Paper sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No sobriety date set
        </Typography>
      </Paper>
    );
  }

  if (compact) {
    return (
      <Card elevation={1}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarTodayIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                Sober Since: {formatSobrietyDate(sobrietyDate)}
              </Typography>
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {sobrietyDetails.totalDays}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {sobrietyDetails.totalDays === 1 ? 'Day' : 'Days'} Sober
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progressSummary}
                </Typography>
              </Box>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={progressPercent}
                  size={80}
                  thickness={4.5}
                  sx={{
                    color: progressPercent === 100 ? 'success.main' : 'primary.main'
                  }}
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
                    justifyContent: 'center'
                  }}
                >
                  <EmojiEventsIcon
                    fontSize="small"
                    sx={{ color: progressPercent === 100 ? 'success.main' : 'primary.main' }}
                  />
                </Box>
              </Box>
            </Box>

            <Grid container spacing={1}>
              {statCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <Grid item xs={6} key={card.label}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: 'grey.50'
                      }}
                    >
                      <IconComponent sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {card.value}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Card elevation={3} sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'relative',
            color: 'primary.contrastText',
            p: { xs: 3, md: 4 },
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 60%)`
          }}
        >
          {/* Background image */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(/images/tracker.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              opacity: 0.25,
              mixBlendMode: 'soft-light',
            }}
          />
          <Stack spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" fontWeight="bold" color="white">
              Your Sobriety
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }} color="white">
              You've been sober since {formatSobrietyDate(sobrietyDate)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }} color="white">
              {progressSummary}
            </Typography>
          </Stack>
          <Box
            sx={{
              position: 'absolute',
              right: { xs: -10, md: 24 },
              bottom: { xs: -10, md: 12 },
              opacity: 0.2,
              transform: 'rotate(-12deg)',
              zIndex: 0
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: { xs: 90, md: 150 } }} />
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {sobrietyDetails.totalDays}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {sobrietyDetails.totalDays === 1 ? 'Day' : 'Days'} Sober
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  That's {timeDescription}!
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={progressPercent}
                    size={160}
                    thickness={4.5}
                    sx={{
                      color: progressPercent === 100 ? 'success.main' : 'primary.main'
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      {Math.round(progressPercent)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {progressSummary}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 3 }}>
            {statCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Grid item xs={6} md={3} key={card.label}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      textAlign: 'center',
                      borderradius: 1,
                      bgcolor: 'grey.50',
                      border: (theme) => `1px solid ${theme.palette.grey[200]}`
                    }}
                  >
                    <IconComponent sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {card.value}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Card>

      <Card elevation={1}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Your Milestones</Typography>
            <CelebrationIcon color="primary" />
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={1}>
            {milestones.map((milestone) => {
              const milestoneColor = getMilestoneColor(milestone.days);
              return (
                <Grid item xs={6} sm={4} md={3} key={milestone.days}>
                  <Tooltip
                    title={
                      milestone.achieved
                        ? 'Achieved'
                        : `${milestone.daysUntil} ${milestone.daysUntil === 1 ? 'day' : 'days'} to go`
                    }
                  >
                    <Chip
                      icon={milestone.achieved ? <EmojiEventsIcon /> : undefined}
                      label={milestone.name}
                      color={milestone.achieved ? milestoneColor : 'default'}
                      variant={milestone.achieved ? 'filled' : 'outlined'}
                      sx={{
                        width: '100%',
                        mb: 1,
                        opacity: milestone.achieved ? 1 : 0.85,
                        '&.MuiChip-outlined': {
                          borderColor: (theme) =>
                            theme.palette[milestoneColor]?.main || theme.palette.primary.main,
                          color: (theme) =>
                            theme.palette[milestoneColor]?.main || theme.palette.primary.main
                        }
                      }}
                    />
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>

          {milestones.length > 0 && (
            <Box sx={{ mt: 4, display: { xs: 'none', md: 'block' } }}>
              <Stepper
                alternativeLabel
                activeStep={Math.max(lastAchievedIndex, 0)}
                connector={null}
                sx={{
                  '& .MuiStepLabel-label': {
                    typography: 'caption'
                  }
                }}
              >
                {milestones.map((milestone) => (
                  <Step key={milestone.days} completed={milestone.achieved}>
                    <StepLabel
                      icon={<EmojiEventsIcon fontSize="small" color={milestone.achieved ? 'primary' : 'disabled'} />}
                    >
                      {milestone.name}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              {progressSummary}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 10, borderRadius: 2 }}
              color={progressPercent === 100 ? 'success' : 'primary'}
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoGraphIcon color="primary" />
                  <Typography variant="h6">Keep the momentum</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Capture today's reflections or share a milestone with your support network.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    component={Link}
                    href="/journal"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Log a Reflection
                  </Button>
                  <Button variant="outlined" color="primary" fullWidth onClick={handleShareProgress}>
                    Share Progress
                  </Button>
                </Stack>
                {shareStatus && (
                  <Typography variant="caption" color="text.secondary">
                    {shareStatus}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderradius: 1,
              border: (theme) => `1px solid ${theme.palette.grey[200]}`,
              bgcolor: 'grey.50',
              height: '100%'
            }}
          >
            <Stack spacing={2}>
              <FormatQuoteIcon color="primary" />
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                "One day at a time" has carried you through {timeDescription}. Keep reaching for the next right
                thing - your progress lights the way for others.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your sobriety story updates every day at midnight.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
