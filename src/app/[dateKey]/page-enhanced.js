'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import EnhancedReflectionCard from '@/components/EnhancedReflectionCard';
import EnhancedCommentList from '@/components/EnhancedCommentList';
import { formatDateKey, getTodayKey } from '@/utils/dateUtils';

export default function EnhancedDateReflectionPage() {
  const params = useParams();
  const router = useRouter();
  const [dateKey, setDateKey] = useState('');
  const [isValidDateFormat, setIsValidDateFormat] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    if (!params || !params.dateKey) return;

    const urlDateKey = params.dateKey;
    const isValid = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(urlDateKey);

    setIsValidDateFormat(isValid);
    if (isValid) {
      setDateKey(urlDateKey);
    }
  }, [params]);

  const handleNavigate = useCallback((direction) => {
    if (!dateKey) return;

    const [month, day] = dateKey.split('-').map(Number);
    let newMonth = month;
    let newDay = day;

    if (direction === 'prev') {
      newDay = day - 1;
      if (newDay === 0) {
        newMonth = newMonth - 1;
        if (newMonth === 0) {
          newMonth = 12;
        }
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        newDay = daysInMonth[newMonth - 1];
      }
    } else {
      newDay = day + 1;
      const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (newDay > daysInMonth[newMonth - 1]) {
        newDay = 1;
        newMonth = newMonth + 1;
        if (newMonth > 12) {
          newMonth = 1;
        }
      }
    }

    const newDateKey = `${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    router.push(`/${newDateKey}`);
  }, [dateKey, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigate('prev');
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate]);

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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(243,244,246,0.5) 0%, rgba(229,231,235,0.3) 100%)',
      }}
    >
      {/* Subtle top navigation bar */}
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)',
          py: 1.5,
          px: 3,
        }}
      >
        <Container maxWidth="xl">
          <Button
            component={Link}
            href="/"
            startIcon={<HomeIcon />}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'transparent',
              },
            }}
          >
            Home
          </Button>
        </Container>
      </Box>

      {/* Main Content */}
      {dateKey ? (
        <Box sx={{ pb: 8 }}>
          <EnhancedReflectionCard
            dateKey={dateKey}
            onNavigate={handleNavigate}
          />

          {/* Community Reflections Section */}
          <Container maxWidth="lg" sx={{ mt: 8 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                mb: 5,
                fontWeight: 700,
                textAlign: 'center',
                color: 'text.primary',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Community Reflections
            </Typography>
            <EnhancedCommentList dateKey={dateKey} />
          </Container>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Loading reflection...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
