'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  useMediaQuery,
  useTheme,
  Breadcrumbs,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HomeIcon from '@mui/icons-material/Home';
import ReflectionCard from '@/components/ReflectionCard';
import CommentList from '@/components/CommentList';
import { formatDateKey } from '@/utils/dateUtils';

export default function DateReflectionPage() {
  // Get the dateKey from the route parameter
  const params = useParams();
  const router = useRouter();
  const [dateKey, setDateKey] = useState('');
  const [isValidDateFormat, setIsValidDateFormat] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      {/* App Bar - Full Width Modern Design */}
      <AppBar
        position="sticky"
        elevation={0}
        color="primary"
        sx={{
          borderRadius: 0,
          width: '100%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                fontFamily: 'var(--font-poppins)',
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                cursor: 'pointer',
              }}
            >
              Daily Reflections
            </Typography>
          </Link>
        </Toolbar>
      </AppBar>

      {/* Hero Section with Background Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(79,70,229,0.02) 100%)',
          py: { xs: 4, md: 5 },
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
        }}
      >
        <Container maxWidth="md">
          {/* Navigation and Breadcrumbs */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs aria-label="breadcrumb">
              <Link href="/" passHref style={{ textDecoration: 'none' }}>
                <Button
                  color="primary"
                  startIcon={<HomeIcon />}
                  sx={{ fontWeight: 500 }}
                >
                  Home
                </Button>
              </Link>
              <Typography color="text.primary">{formatDateKey(dateKey)}</Typography>
            </Breadcrumbs>
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
                {formatDateKey(dateKey)}
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
      <Container
        maxWidth="md"
        sx={{
          py: { xs: 3, sm: 4, md: 5 },
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        {dateKey ? (
          <>
            {/* Reflection */}
            <ReflectionCard dateKey={dateKey} />

            {/* Subtle Divider */}
            <Box
              sx={{
                width: '100%',
                height: '1px',
                background: 'linear-gradient(to right, rgba(226, 228, 235, 0), rgba(226, 228, 235, 1), rgba(226, 228, 235, 0))',
                my: { xs: 4, md: 5 }
              }}
            />

            {/* Comments Section */}
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
          </>
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