'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import ReflectionCard from '@/components/ReflectionCard';
import CommentList from '@/components/CommentList';
import DatePicker from '@/components/DatePicker';
import UserMenu from '@/components/UserMenu';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import { getTodayKey, formatDateKey } from '@/utils/dateUtils';

export default function Home() {
  const router = useRouter();
  const [dateKey, setDateKey] = useState(getTodayKey());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handlePrevDay = useCallback(() => {
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

    setDateKey(`${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
  }, [dateKey]);

  const handleNextDay = useCallback(() => {
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

    setDateKey(`${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
  }, [dateKey]);

  const handleDateChange = (newDateKey) => {
    setDateKey(newDateKey);
  };

  const handleToday = useCallback(() => {
    setDateKey(getTodayKey());
  }, []);

  const handleSearch = async (query) => {
    if (!query || query.trim().length === 0) return;

    // For the main page, navigate to the search page with the query
    console.log('🔍 Navigating to search page with query:', query);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
  };

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
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      } else if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        // Open search with / or Ctrl+K
        e.preventDefault();
        handleSearchOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevDay, handleNextDay, handleToday]);

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
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: isMobile ? 0 : 1,
              fontWeight: 700,
              fontFamily: 'var(--font-poppins)',
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              mr: 2
            }}
          >
            Daily Reflections
          </Typography>

          {/* Desktop Search Bar */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: '500px', mx: 2 }}>
              <SearchBar
                onSearch={handleSearch}
                loading={searchLoading}
                variant="filled"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                  borderRadius: 2,
                  color: 'white',
                }}
              />
            </Box>
          )}

          {/* Mobile Search Icon */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleSearchOpen}
              aria-label="search"
              sx={{ ml: 'auto', mr: 1 }}
            >
              <SearchIcon />
            </IconButton>
          )}

          <UserMenu />
        </Toolbar>
      </AppBar>

      {/* Search Results Drawer */}
      <Drawer
        anchor="top"
        open={searchOpen}
        onClose={handleSearchClose}
        sx={{
          '& .MuiDrawer-paper': {
            maxHeight: '80vh',
            pt: 2,
            px: 2,
            pb: 4,
          },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
          <Box sx={{ mb: 3 }}>
            <SearchBar
              onSearch={handleSearch}
              loading={searchLoading}
              initialQuery={searchQuery}
              autoFocus
            />
          </Box>

          <SearchResults
            results={searchResults}
            query={searchQuery}
            loading={searchLoading}
          />

          {searchResults.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" onClick={handleSearchClose}>
                Close Search
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Hero Section with Background Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(79,70,229,0.02) 100%)',
          py: { xs: 4, md: 5 },
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
        }}
      >
        <Container maxWidth="md">
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

              {/* Date Picker */}
              <DatePicker
                dateKey={dateKey}
                onChange={handleDateChange}
                onToday={handleToday}
              />

              <IconButton
                onClick={handleNextDay}
                color="primary"
                size="large"
                aria-label="Next day"
                sx={{
                  backgroundColor: 'rgba(28, 110, 127, 0.07)',
                  '&:hover': {
                    backgroundColor: 'rgba(28, 110, 127, 0.15)',
                    transform: 'translateX(2px)'
                  }
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>

            {/* Date Display - Consistent across all screen sizes */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontFamily: 'var(--font-poppins)',
                color: '#2C3E50',
                fontWeight: 600,
                textAlign: { xs: 'center', sm: 'right' },
                fontSize: { xs: '1.25rem', sm: '1.375rem' }
              }}
            >
              {formatDateKey(dateKey)}
            </Typography>
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
      </Container>
    </>
  );
}
