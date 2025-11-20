'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FeatureSlider from '@/components/FeatureDiscovery/FeatureSlider';
import featureConfig from '@/config/featureDiscovery';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  IconButton,
  useMediaQuery,
  useTheme,
  Stack,
  Chip,
  Badge,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ChatIcon from '@mui/icons-material/Chat';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DailyThoughtModal from '@/components/DailyThoughtModal';
import { useDailyThought } from '@/hooks/useDailyThought';
import { getTodayKey } from '@/utils/dateUtils';
import DailyProgressPanel from '@/components/Home/DailyProgressPanel';
import SkeletonLoading from '@/components/Home/SkeletonLoading';
import { stepsOfTheMonth } from '@/lib/stepsOfTheMonth';
import SessionDebug from '@/components/Debug/SessionDebug';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Helper function to get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const todayKey = useMemo(() => getTodayKey(), []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isMedium = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    const monthNumber = parseInt(todayKey.slice(0, 2), 10);
    const initialIndex = stepsOfTheMonth.findIndex((item) => item.month === monthNumber);
    return initialIndex >= 0 ? initialIndex : 0;
  });
  const handleStepNavigate = useCallback((direction) => {
    setActiveStepIndex((prev) => {
      const total = stepsOfTheMonth.length;
      return (prev + direction + total) % total;
    });
  }, []);
  const stepOfTheMonth = useMemo(() => {
    const step = stepsOfTheMonth[activeStepIndex] || stepsOfTheMonth[0];
    return {
      ...step,
      monthLabel: monthNames[(step?.month || 1) - 1] || monthNames[0],
    };
  }, [activeStepIndex]);

  // State for user activity and daily quote
  const [userActivity, setUserActivity] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Use the custom hook to manage daily thought modal
  const { showModal, closeModal } = useDailyThought({ autoShow: true });

  // Check if realtime chat feature is enabled
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');

  // Fetch user activity data
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('/api/user/activity', {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setUserActivity(data);
      } catch (error) {
        console.error('Error fetching user activity:', error);
        // Provide fallback data on error
        setUserActivity({
          activity: {
            streak: { current: 0 },
            reflections: { viewedToday: false },
            journal: { enteredToday: false }
          }
        });
      } finally {
        setLoadingActivity(false);
      }
    };

    if (session?.user) {
      fetchUserActivity();
    } else {
      setLoadingActivity(false);
    }
  }, [session]);

  // Fetch daily quote
  useEffect(() => {
    const fetchDailyQuote = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('/api/reflections/quote', {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setDailyQuote(data);
        } else {
          throw new Error('Quote data format error');
        }
      } catch (error) {
        console.error('Error fetching daily quote:', error);
        // Provide fallback data on error
        setDailyQuote({
          quote: "One day at a time.",
          source: "AA Wisdom",
          success: true
        });
      } finally {
        setLoadingQuote(false);
      }
    };

    fetchDailyQuote();
  }, []);

  // Update the overall loading state when both data fetches complete
  const updateLoadingState = useCallback(() => {
    if (!loadingActivity && !loadingQuote) {
      // Add a small delay to allow for smoother transition
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [loadingActivity, loadingQuote]);

  // Make sure loading state gets updated when dependencies change
  useEffect(() => {
    updateLoadingState();
  }, [updateLoadingState]);

  // Keyboard shortcuts: send to search page on Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const greeting = getTimeBasedGreeting();
  const userName = session?.user?.displayName || session?.user?.name || '';

  // Force loading to end after 8 seconds maximum to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Force ending loading state after timeout');
        setIsLoading(false);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // If data is still loading, show skeleton
  if (isLoading) {
    return <SkeletonLoading />;
  }

  return (
    <>
      {/* Session Debug Component */}
      <SessionDebug />

      {/* Daily Thought Modal */}
      <DailyThoughtModal
        open={showModal}
        onClose={closeModal}
      />

      {/* Hero Section with Enhanced Visual Design - Serenity Palette: misty blue-gray gradient */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #FDF2E9 0%, #F6E9F2 35%, #DCEBFA 100%)',
          '& .MuiTypography-root': {
            textShadow: '0 1px 2px rgba(21,36,44,0.12)',
          },
          color: '#13222A',
          pt: { xs: 10, md: 14 },
          pb: { xs: 12, md: 16 },
          borderRadius: { xs: 0, md: '0 0 48px 48px' },
          boxShadow: '0 18px 40px rgba(34,54,64,0.18)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'240\' height=\'240\' viewBox=\'0 0 240 240\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3CradialGradient id=\'g\' cx=\'50%25\' cy=\'50%25\' r=\'70%25\'%3E%3Cstop offset=\'0%25\' stop-color=\'%23ffffff\' stop-opacity=\'0.25\'/%3E%3Cstop offset=\'100%25\' stop-color=\'%23ffffff\' stop-opacity=\'0\'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width=\'240\' height=\'240\' fill=\'url(%23g)\'/%3E%3C/svg%3E")',
            opacity: 0.16,
            mixBlendMode: 'soft-light',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width=\'140\' height=\'140\' viewBox=\'0 0 140 140\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\' stroke=\'%23D5D5D5\' stroke-opacity=\'0.2\'%3E%3Cpath d=\'M0 35h140M0 70h140M0 105h140M35 0v140M70 0v140M105 0v140\'/%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.18,
            mixBlendMode: 'overlay',
          }}
        />

        <Container maxWidth="lg">
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
              py: { xs: 4, md: 6 },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 2, md: 3 }, pointerEvents: 'none' }}>
              <Box
                sx={{
                  width: { xs: 140, sm: 160, md: 180 },
                  mx: 'auto',
                  filter: 'drop-shadow(0 14px 26px rgba(26,45,54,0.22))',
                }}
              >
                <Image
                  src="/images/mascot.png"
                  alt="Lantern Companion guiding the way with a warm lantern glow"
                  width={200}
                  height={200}
                  priority
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            </Box>

            {/* Subtle personalized greeting - only for logged in users */}
            {session?.user && (
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 400,
                  mb: 3,
                  color: 'rgba(32,43,51,0.7)',
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}
              >
                {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
              </Typography>
            )}

            {/* Main headline - clear and focused */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.75rem', sm: '3.25rem', md: '4.25rem' },
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(90deg, #1F2E36 0%, #315060 45%, #6A8595 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 12px 24px rgba(255,255,255,0.35)',
              }}
            >
              Your Digital Companion in Recovery
            </Typography>

            {/* Simplified subtitle */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                mb: 4,
                color: 'rgba(31,46,54,0.75)',
                lineHeight: 1.6,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Start your day with today's reflection, or continue your journey with our tools and community.
            </Typography>

            {/* Subtle daily quote - inline, not a card */}
            {dailyQuote && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontStyle: 'italic',
                    color: 'rgba(32,43,51,0.8)',
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                    lineHeight: 1.8,
                    mb: 0.5,
                  }}
                >
                  "{dailyQuote.quote}"
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  — {dailyQuote.source}
                </Typography>
              </Box>
            )}

            {/* PRIMARY ACTIONS - Three main buttons */}
            <Grid
              container
              spacing={2}
              justifyContent="center"
              sx={{
                mb: 3,
                maxWidth: '700px',
                mx: 'auto',
                position: 'relative',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: '-35%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '220px',
                  height: '220px',
                  background: 'radial-gradient(circle, rgba(255,240,213,0.65) 0%, rgba(255,240,213,0.15) 55%, rgba(255,240,213,0) 100%)',
                  zIndex: -1,
                },
              }}
            >
              {/* Today's Reflection Button */}
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => router.push(`/${todayKey}`)}
                  sx={{
                    py: 2,
                    fontWeight: 600,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    backgroundColor: '#F4C978',
                    color: '#1C2D36',
                    boxShadow: '0 8px 30px rgba(244,201,120,0.45)',
                    '&:hover': {
                      backgroundColor: '#E9B867',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(244,201,120,0.55)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  startIcon={<CalendarMonthIcon sx={{ fontSize: '1.5rem' }} />}
                >
                  Read Today's Reflection
                </Button>
              </Grid>

              {/* Journal Button */}
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => router.push('/journal')}
                  sx={{
                    py: 2,
                    fontWeight: 600,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    borderColor: 'rgba(31,46,54,0.4)',
                    color: '#1F2E36',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      borderColor: '#2A4252',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  startIcon={<EditNoteIcon sx={{ fontSize: '1.5rem' }} />}
                >
                  Open Journal
                </Button>
              </Grid>

              {/* Talk to Volunteer Button - Only show if realtime chat is enabled */}
              {isRealtimeChatEnabled && (
                <Grid item xs={12} sm={12} md={4}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => router.push('/chat')}
                    sx={{
                      py: 2,
                      fontWeight: 600,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      backgroundColor: '#5DA6A7',
                      color: '#FFFFFF',
                      boxShadow: '0 8px 30px rgba(93,166,167,0.3)',
                      '&:hover': {
                        backgroundColor: '#4A8F90',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 35px rgba(93,166,167,0.4)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    startIcon={<ChatIcon sx={{ fontSize: '1.5rem' }} />}
                  >
                    Talk to a Volunteer
                  </Button>
                </Grid>
              )}
            </Grid>

          </Box>
        </Container>
      </Box>

      {/* Daily Progress Panel - integrated user activity tracking */}
      <Container maxWidth="lg" sx={{ mt: { xs: -6, md: -8 }, mb: 4, position: 'relative', zIndex: 5 }}>
        {session?.user && userActivity?.activity && (
          <DailyProgressPanel userActivity={userActivity} />
        )}
      </Container>

      {/* Step of the Month Section */}
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 6, md: 10 },
          mb: { xs: 6, md: 10 },
        }}
      >
        <Card
          elevation={8}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            borderradius: 2,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #F5F9FA 0%, #E6F0F1 100%)',
            boxShadow: '0 16px 40px rgba(26,43,52,0.12)',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '100%', md: '45%' },
              minHeight: { xs: 220, sm: 260, md: 340 },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(16,27,34,0.08) 0%, rgba(16,27,34,0.35) 100%)',
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
              },
            }}
          >
            <Image
              key={stepOfTheMonth.step}
              src={stepOfTheMonth.image}
              alt={`Illustration for ${stepOfTheMonth.title}`}
              fill
              sizes="(max-width: 900px) 100vw, 40vw"
              style={{ objectFit: 'cover', transition: 'opacity 0.4s ease' }}
              priority
            />
          </Box>
          <CardContent
            sx={{
              width: { xs: '100%', md: '55%' },
              p: { xs: 3, md: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    letterSpacing: 0.4,
                  }}
                >
                  Step of the Month
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton
                    onClick={() => handleStepNavigate(-1)}
                    aria-label="View previous featured step"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(26,43,52,0.12)',
                      boxShadow: '0 8px 18px rgba(26,43,52,0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleStepNavigate(1)}
                    aria-label="View next featured step"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(26,43,52,0.12)',
                      boxShadow: '0 8px 18px rgba(26,43,52,0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip
                  label={`${stepOfTheMonth.monthLabel} • Step ${stepOfTheMonth.step}`}
                  sx={{
                    backgroundColor: 'rgba(93,166,167,0.15)',
                    color: '#4A8F90',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                />
                <Badge
                  color="primary"
                  variant="dot"
                  sx={{
                    '& .MuiBadge-dot': {
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
                    },
                  }}
                >
                  <LocalFireDepartmentIcon sx={{ color: '#D97706' }} />
                </Badge>
              </Stack>

              <Box>
              
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    mb: 1,
                    fontSize: { xs: '2rem', md: '2.4rem' },
                  }}
                >   {stepOfTheMonth.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {stepOfTheMonth.subtitle}
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.primary,
                  lineHeight: 1.8,
                  fontSize: { xs: '1rem', md: '1.05rem' },
                }}
              >
                {stepOfTheMonth.description}
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  borderLeft: '4px solid #5DA6A7',
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LightbulbIcon sx={{ color: '#5DA6A7' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4A8F90', letterSpacing: 0.5 }}>
                      Monthly Practice
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                    {stepOfTheMonth.focus}
                  </Typography>
                </Stack>
              </Paper>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  href="/steps"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 3,
                    py: 1.25,
                    fontWeight: 600,
                  }}
                >
                  Explore the Steps
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  component={Link}
                  href={stepOfTheMonth.workLink || '/steps'}
                  sx={{
                    px: 3,
                    py: 1.25,
                    fontWeight: 600,
                  }}
                >
                  Work This Step
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
     
      {/* Feature Discovery Slider Section */}
      <Box
        sx={{
          backgroundColor: 'rgba(93,166,167,0.04)',
          py: { xs: 6, md: 8 },
          borderTop: '1px solid rgba(225,232,234,0.6)',
          borderBottom: '1px solid rgba(225,232,234,0.6)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%235d88a6\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.2,
            zIndex: 0,
          }
        }}
      >
        <FeatureSlider
          features={featureConfig.features}
          title={featureConfig.title}
          subtitle={featureConfig.subtitle}
          visibleSlides={3}
        />
      </Box>

      {/* Additional Resources Section */}
      <Box sx={{
        backgroundColor: 'rgba(93,166,167,0.04)',
        py: { xs: 8, md: 12 },
        borderTop: '1px solid rgba(225,232,234,0.6)',
        borderBottom: '1px solid rgba(225,232,234,0.6)',
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item xs={12} md={6} sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: theme.palette.text.primary
                }}
              >
                Recovery Resources at Your Fingertips
              </Typography>

              <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                Access a comprehensive collection of tools and resources designed to support your journey in recovery. From meetings to literature, everything you need is here to walk beside you.
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={2}
                    component={Link}
                    href="/resources/meetings"
                    sx={{ 
                      p: 2.5, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      textDecoration: 'none',
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: theme.palette.primary.main,
                        zIndex: 3,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <MenuBookIcon color="primary" sx={{ mr: 1.5, fontSize: '2rem' }} />
                      <Typography variant="h6" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
                        Meetings
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Find AA meetings in your area or online.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        textTransform: 'none',
                        borderRadius: 2,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 500,
                        px: 2,
                        py: 0.5,
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main',
                        }
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: '0.875rem' }} />}
                    >
                      Find meeting
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={2}
                    component={Link}
                    href="/assistant"
                    sx={{ 
                      p: 2.5, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      textDecoration: 'none',
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: theme.palette.primary.main,
                        zIndex: 3,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <ChatIcon color="primary" sx={{ mr: 1.5, fontSize: '2rem' }} />
                      <Typography variant="h6" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
                        AI Assistant
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Get guidance on recovery principles and literature.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        textTransform: 'none',
                        borderRadius: 2,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 500,
                        px: 2,
                        py: 0.5,
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main',
                        }
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: '0.875rem' }} />}
                    >
                      Ask a question
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={2}
                    component={Link}
                    href="/search"
                    sx={{ 
                      p: 2.5, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      textDecoration: 'none',
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: theme.palette.primary.main,
                        zIndex: 3,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <SearchIcon color="primary" sx={{ mr: 1.5, fontSize: '2rem' }} />
                      <Typography variant="h6" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
                        Search
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Find reflections on specific topics or keywords.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        textTransform: 'none',
                        borderRadius: 2,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 500,
                        px: 2,
                        py: 0.5,
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main',
                        }
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: '0.875rem' }} />}
                    >
                      Explore topics
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={2}
                    component={Link}
                    href="/steps"
                    sx={{ 
                      p: 2.5, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      textDecoration: 'none',
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: theme.palette.primary.main,
                        zIndex: 3,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <AutoStoriesIcon color="primary" sx={{ mr: 1.5, fontSize: '2rem' }} />
                      <Typography variant="h6" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
                        Literature
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      Access AA pamphlets and reading materials.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        textTransform: 'none',
                        borderRadius: 2,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 500,
                        px: 2,
                        py: 0.5,
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main',
                        }
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: '0.875rem' }} />}
                    >
                      Explore books
                    </Button>
                  </Paper>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                href="/resources"
                endIcon={<ArrowForwardIcon />}
                sx={{ px: 4, py: 1.5 }}
              >
                Explore All Resources
              </Button>
            </Grid>

            
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderradius: 1,
            background: 'linear-gradient(135deg, #1A2B34 0%, #5DA6A7 100%)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.05,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(to right, #ffffff 0%, #e2e8f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              Start Your Journey Today
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, mb: 4, maxWidth: '800px', mx: 'auto', opacity: 0.95, lineHeight: 1.7 }}>
              Recovery is a daily practice. Our tools are designed to support you every step of the way, with care and understanding.
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  component={Link}
                  href={`/${todayKey}`}
                  sx={{
                    py: 1.5,
                    backgroundColor: '#E4B95B',
                    color: '#1A2B34',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#D4A556',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Today's Reflection
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  component={Link}
                  href="/journal/new"
                  sx={{
                    py: 1.5,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      borderColor: 'rgba(255,255,255,0.5)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Start Journaling
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
