'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
  Breadcrumbs,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HomeIcon from '@mui/icons-material/Home';
import ReflectionCard from '@/components/ReflectionCard';
import CommentList from '@/components/CommentList';
import SearchBar from '@/components/SearchBar';
import { formatDateKey, getTodayKey } from '@/utils/dateUtils';

export default function DateReflectionPage() {
  // Get the dateKey from the route parameter
  const params = useParams();
  const router = useRouter();
  const [dateKey, setDateKey] = useState('');
  const [isValidDateFormat, setIsValidDateFormat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const todayKey = useMemo(() => getTodayKey(), []);
  const formattedDate = dateKey ? formatDateKey(dateKey) : '';
  const isToday = dateKey === todayKey;

  // Validate and set the dateKey from URL parameter
  useEffect(() => {
    if (!params || !params.dateKey) return;

    const urlDateKey = params.dateKey;
    // Validate date format (MM-DD)
    const isValid = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(urlDateKey);

    setIsValidDateFormat(isValid);
    if (isValid) {
      setDateKey(urlDateKey);
    }
  }, [params]);

  const handlePrevDay = useCallback(() => {
    if (!dateKey) return;

    const [month, day] = dateKey.split('-').map(Number);
    let newMonth = month;
    let newDay = day - 1;

    if (newDay === 0) {
      newMonth = newMonth - 1;
      if (newMonth === 0) {
        newMonth = 12;
      }

      // Get days in month (simple approximation)
      const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      newDay = daysInMonth[newMonth - 1];
    }

    const newDateKey = `${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    router.push(`/${newDateKey}`);
  }, [dateKey, router]);

  const handleNextDay = useCallback(() => {
    if (!dateKey) return;

    const [month, day] = dateKey.split('-').map(Number);
    let newMonth = month;
    let newDay = day + 1;

    // Get days in month (simple approximation)
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (newDay > daysInMonth[newMonth - 1]) {
      newDay = 1;
      newMonth = newMonth + 1;
      if (newMonth > 12) {
        newMonth = 1;
      }
    }

    const newDateKey = `${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    router.push(`/${newDateKey}`);
  }, [dateKey, router]);

  // Keyboard shortcuts for date navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevDay();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevDay, handleNextDay]);

  // Handle search
  const handleSearch = (query) => {
    if (query) {
      // Navigate to search page with the query
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Error state for invalid date
  if (!isValidDateFormat && params.dateKey) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4, color: 'error.main' }}>
          Invalid Date Format
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The date format should be MM-DD (example: 02-01 for February 1st)
        </Typography>
        <Button variant="contained" component={Link} href="/" color="primary">
          Return Home
        </Button>
      </Container>
    );
  }

  return (
    <>

      {/* Hero Section with Background Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(79,70,229,0.02) 100%)',
          py: { xs: 3, md: 4 },
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
          {/* Navigation and Breadcrumbs */}
          <Box sx={{ mb: 1 }}>
            <Breadcrumbs aria-label="breadcrumb">
              <Button
                component={Link}
                href="/"
                color="primary"
                startIcon={<HomeIcon />}
                sx={{ fontWeight: 500 }}
              >
                Home
              </Button>
              <Typography color="text.primary">{formattedDate}</Typography>
            </Breadcrumbs>
          </Box>

          {/* Page Title and Search */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mt: 1,
                fontFamily: 'var(--font-poppins)',
                color: '#2C3E50',
              }}
            >
              Daily Reflection
            </Typography>

            {/* Search Bar */}
            <Box sx={{ minWidth: { xs: '100%', sm: '320px' }, maxWidth: '520px' }}>
              <SearchBar
                onSearch={handleSearch}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>

          {/* Date Navigation - Enhanced for better mobile experience */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            {/* Navigation Controls */}
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mb: { xs: 2, sm: 0 }
              }}
            >
              <IconButton
                onClick={handlePrevDay}
                color="primary"
                size="large"
                aria-label="Previous day"
                sx={{
                  backgroundColor: 'rgba(28, 110, 127, 0.07)',
                  '&:hover': {
                    backgroundColor: 'rgba(28, 110, 127, 0.15)',
                    transform: 'translateX(-2px)'
                  }
                }}
              >
                <ArrowBackIosIcon />
              </IconButton>

              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontFamily: 'var(--font-poppins)',
                  color: '#2C3E50',
                  fontWeight: 600,
                  px: 2
                }}
              >
                {formattedDate}
              </Typography>

              <IconButton
                onClick={handleNextDay}
                color="primary"
                size="large"
                aria-label="Next day"
                sx={{
                  backgroundColor: 'rgba(44, 62, 80, 0.07)',
                  '&:hover': {
                    backgroundColor: 'rgba(44, 62, 80, 0.15)',
                    transform: 'translateX(2px)'
                  }
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
        {dateKey ? (
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item xs={12} lg={8}>
              <ReflectionCard dateKey={dateKey} />

              <Box
                sx={{
                  width: '100%',
                  height: '1px',
                  background: 'linear-gradient(to right, rgba(226, 228, 235, 0), rgba(226, 228, 235, 1), rgba(226, 228, 235, 0))',
                  my: { xs: 4, md: 5 }
                }}
              />

              <Box sx={{ pt: 1 }}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    mb: 3,
                    fontFamily: 'var(--font-poppins)',
                    color: '#2C3E50',
                    fontSize: { xs: '1.5rem', md: '1.75rem' },
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Community Reflections
                </Typography>
                <CommentList dateKey={dateKey} />
              </Box>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    pb: 1.5
                  }}
                >
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontFamily: 'var(--font-poppins)',
                      color: '#2C3E50',
                      fontSize: { xs: '1.5rem', md: '1.75rem' },
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Tools & Navigation
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    component={Link}
                    href="/tools"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    View All Tools
                  </Button>
                </Box>

                {/* Horizontal Layout for Navigation Tools */}
                <Grid container spacing={2.5}>
                  {/* Daily Navigation Section */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        },
                        borderTop: '4px solid',
                        borderColor: 'primary.main'
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'primary.dark'
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            mr: 1.5,
                            fontSize: '1rem'
                          }}
                        >
                          1
                        </Box>
                        Daily Navigation
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, pl: 5.5 }}>
                        Jump between reflections or return to today.
                      </Typography>
                      <Box sx={{ mt: 'auto' }}>
                        <Stack spacing={1.5}>
                          <Button
                            variant="outlined"
                            onClick={handlePrevDay}
                            startIcon={<ArrowBackIosIcon />}
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Previous
                          </Button>
                          {!isToday && (
                            <Button
                              variant="contained"
                              color="primary"
                              component={Link}
                              href={`/${todayKey}`}
                              sx={{
                                justifyContent: 'flex-start',
                                borderRadius: 1.5,
                                py: 1
                              }}
                            >
                              Today
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            onClick={handleNextDay}
                            endIcon={<ArrowForwardIosIcon />}
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Next
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Practice the Steps Section */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        },
                        borderTop: '4px solid',
                        borderColor: 'secondary.main'
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'secondary.dark'
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'secondary.light',
                            color: 'secondary.contrastText',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            mr: 1.5,
                            fontSize: '1rem'
                          }}
                        >
                          2
                        </Box>
                        Practice the Steps
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, pl: 5.5 }}>
                        Tools that complement today&apos;s reading.
                      </Typography>
                      <Box sx={{ mt: 'auto' }}>
                        <Stack spacing={1.5}>
                          <Button
                            component={Link}
                            href="/journal/new"
                            variant="outlined"
                            color="secondary"
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Journal
                          </Button>
                          <Button
                            component={Link}
                            href="/step4"
                            variant="outlined"
                            color="secondary"
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Step Work
                          </Button>
                          <Button
                            component={Link}
                            href="/sobriety"
                            variant="outlined"
                            color="secondary"
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Sobriety
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Invite Your Circle Section */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        },
                        borderTop: '4px solid',
                        borderColor: 'info.main'
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'info.dark'
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'info.light',
                            color: 'info.contrastText',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            mr: 1.5,
                            fontSize: '1rem'
                          }}
                        >
                          3
                        </Box>
                        Invite Your Circle
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, pl: 5.5 }}>
                        Share and explore with accountability partners.
                      </Typography>
                      <Box sx={{ mt: 'auto' }}>
                        <Stack spacing={1.5}>
                          <Button
                            component={Link}
                            href={`/step4/shared`}
                            variant="outlined"
                            color="info"
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Share Work
                          </Button>
                          <Button
                            component={Link}
                            href="/circles"
                            variant="outlined"
                            color="info"
                            sx={{
                              justifyContent: 'flex-start',
                              borderRadius: 1.5,
                              py: 1
                            }}
                          >
                            Circles
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Loading reflection...
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}