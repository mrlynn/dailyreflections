'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  Chip,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Alert from '@mui/material/Alert';

import { alpha } from '@mui/material/styles';

import BigBookSearchDialog from './BigBookSearchDialog';

const FETCH_URL = '/api/bigbook/chapters';

export default function BigBookLanding() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);

  const heroGradient = useMemo(
    () =>
      `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.32)} 0%, ${alpha(theme.palette.info.light, 0.22)} 48%, ${alpha(theme.palette.success.light, 0.3)} 100%)`,
    [theme],
  );

  // Function to get the appropriate image for each chapter
  const getChapterImage = (chapterOrder) => {
    // Always try to use the chapter-specific image first
    const chapterImage = `/images/big-book/chapter${chapterOrder}.png`;

    // Define fallbacks based on chapter type
    const fallbackImages = {
      mainChapter: '/images/step12.png',
      personalStory: '/images/steps.png',
      appendix: '/images/features/bigbook.png'
    };

    // Return an array of image paths to try in order
    let fallback;
    if (chapterOrder <= 10) {
      fallback = fallbackImages.mainChapter;
    } else if (chapterOrder >= 11 && chapterOrder <= 14) {
      fallback = fallbackImages.personalStory;
    } else {
      fallback = fallbackImages.appendix;
    }

    // Return array of image paths - will try first one, then fall back to second if needed
    console.log(`Chapter ${chapterOrder} images: [${chapterImage}, ${fallback}]`);
    return [chapterImage, fallback];
  };

  // Card styles without background image
  const createCardStyles = (accentColor) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 1,
    border: `1px solid ${alpha(accentColor, 0.18)}`,
    boxShadow: `0 16px 34px ${alpha(accentColor, 0.16)}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    backgroundColor: '#ffffff',
    '&:hover': {
      transform: 'translateY(-6px)',
      boxShadow: `0 24px 38px ${alpha(accentColor, 0.26)}`,
    },
  });

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.order - b.order),
    [chapters],
  );

  const fetchChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(FETCH_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load chapters');
      }
      const data = await response.json();
      setChapters(Array.isArray(data.chapters) ? data.chapters : []);
    } catch (err) {
      console.error('Failed to load Big Book chapters:', err);
      setError(err.message || 'Failed to load chapters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  // Group chapters by type
  const mainChapters = useMemo(() =>
    sortedChapters.filter(chapter => chapter.order <= 10),
    [sortedChapters]
  );

  const personalStories = useMemo(() =>
    sortedChapters.filter(chapter => chapter.order >= 11 && chapter.order <= 14),
    [sortedChapters]
  );

  const appendices = useMemo(() =>
    sortedChapters.filter(chapter => chapter.order === 15),
    [sortedChapters]
  );

  // Mock data for recently read - in a real app, this would come from user data
  const recentlyRead = useMemo(() => [
    { title: 'Chapter 5: How It Works', page: 58 },
    { title: 'Chapter 2: There Is A Solution', page: 17 }
  ], []);

  const renderSectionHeading = (title, subtitle, accentColor) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1.5, sm: 2 },
        mb: 3,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: alpha(accentColor, 0.16),
          display: 'grid',
          placeItems: 'center',
          boxShadow: `0 18px 30px ${alpha(accentColor, 0.22)}`,
        }}
      >
        <Image
          src="/images/step9.png"
          alt=""
          width={32}
          height={32}
          style={{ objectFit: 'contain' }}
        />
      </Box>
      <Box>
        <Typography
          variant="h4"
          component="h2"
          fontWeight={600}
          sx={{ mb: 0.5 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={5}>
          {/* Hero Section */}
          <Card
            sx={{
              position: 'relative',
              borderradius: 1,
              overflow: 'hidden',
              background: heroGradient,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              boxShadow: '0 22px 48px rgba(20, 64, 45, 0.22)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/images/features/bigbook.png)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: { xs: '160%', md: '110%' },
                backgroundPosition: { xs: '50% 120%', md: '120% 90%' },
                opacity: 0.35,
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: -60,
                left: -80,
                width: 260,
                height: 260,
                background: alpha(theme.palette.success.light, 0.35),
                filter: 'blur(60px)',
                opacity: 0.6,
                display: { xs: 'none', sm: 'block' },
                pointerEvents: 'none',
              }}
            />
            <Grid container alignItems="stretch">
              <Grid item xs={12} md={7}>
                <Box sx={{ p: { xs: 4, md: 6 }, pr: { md: 3 }, position: 'relative', zIndex: 1 }}>
                  <Chip
                    label="Guided reading mode"
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.22),
                      color: theme.palette.primary.dark,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      borderRadius: 999,
                      mb: 2,
                      px: 1.5,
                    }}
                  />
                  <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" fontWeight={700}>
                    Big Book Library
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{ mt: 1.5, maxWidth: 520 }}
                  >
                    Browse chapters,
                    pick up where you left off, or search the Big Book&apos;s wisdom in an instant.
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 3, mb: 3 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SearchIcon />}
                      onClick={() => setSearchOpen(true)}
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 999,
                        py: 1.5,
                        boxShadow: '0 12px 24px rgba(15, 97, 80, 0.25)',
                      }}
                    >
                      Search the Big Book
                    </Button>
                    <Button
                      component={Link}
                      href="/big-book/page/1"
                      variant="outlined"
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 999,
                        py: 1.5,
                        borderWidth: 2,
                      }}
                    >
                      Start at Page 1
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MenuBookIcon sx={{ color: theme.palette.primary.main }} />
                      <Typography variant="body2" color="text.secondary">
                        4th Edition with page-perfect imagery
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BookmarkIcon sx={{ color: theme.palette.secondary.main }} />
                      <Typography variant="body2" color="text.secondary">
                        Save notes & bookmarks as you read
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    position: 'relative',
                    height: { xs: 240, md: '100%' },
                    minHeight: { md: 320 },
                    py: { xs: 4, md: 6 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: '70%', sm: '55%', md: '85%' },
                      maxWidth: 360,
                      aspectRatio: '3 / 4',
                      borderRadius: '28px',
                      overflow: 'hidden',
                      boxShadow: '0 30px 45px rgba(15, 97, 80, 0.25)',
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    }}
                  >
                    <Image
                      src="/images/steps.png"
                      alt="Companion quietly reading the Big Book"
                      fill
                      sizes="(max-width: 900px) 70vw, 360px"
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {error && (
            <Alert
              severity="error"
              action={(
                <IconButton color="inherit" onClick={fetchChapters} size="small">
                  <RefreshIcon fontSize="inherit" />
                </IconButton>
              )}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={6}>
              {/* Main Chapters Section */}
              <Box>
                {renderSectionHeading(
                  'Main Chapters',
                  'Classic guidance to ground your recovery practice.',
                  theme.palette.primary.main,
                )}
                <Grid container spacing={3}>
                  {mainChapters.map((chapter) => {
                    const accentColor = theme.palette.primary.main;
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={chapter.slug}>
                        <Card sx={createCardStyles(accentColor)} variant="outlined">
                          {/* Image Header Section */}
                          <Box
                            sx={{
                              height: 160,
                              position: 'relative',
                              overflow: 'hidden',
                              borderBottom: `1px solid ${alpha(accentColor, 0.16)}`,
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: (() => {
                                  const [specificImage, fallbackImage] = getChapterImage(chapter.order);
                                  return `url('${specificImage}'), url('${fallbackImage}')`;
                                })(),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.9)',
                              }}
                            />
                            {/* Overlay gradient */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '60%',
                                background: `linear-gradient(to top, ${alpha(accentColor, 0.9)} 0%, transparent 100%)`,
                              }}
                            />
                            {/* Chapter label */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.6,
                                borderRadius: 999,
                                backgroundColor: alpha(theme.palette.common.white, 0.8),
                                color: accentColor,
                                fontWeight: 600,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                                fontSize: 12,
                              }}
                            >
                              Chapter {chapter.order}
                            </Box>
                            {/* Title on image */}
                            <Typography
                              variant="h6"
                              sx={{
                                position: 'absolute',
                                bottom: 12,
                                left: 16,
                                right: 16,
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                lineHeight: 1.2,
                              }}
                            >
                              {chapter.title}
                            </Typography>
                          </Box>

                          {/* Content Section */}
                          <CardContent sx={{ pt: 2, pb: 1 }}>
                            <Box
                              sx={{
                                bgcolor: alpha(accentColor, 0.12),
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1,
                                display: 'inline-block',
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                Pages {chapter.startPage} – {chapter.endPage}
                              </Typography>
                            </Box>
                          </CardContent>

                          {/* Actions Section */}
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                              component={Link}
                              href={`/big-book/page/${chapter.startPage}`}
                              fullWidth
                              variant="contained"
                              color="primary"
                              sx={{
                                borderRadius: 999,
                                py: 1,
                                fontWeight: 600,
                              }}
                            >
                              Open Chapter
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Personal Stories Section */}
              <Box>
                {renderSectionHeading(
                  'Personal Stories',
                  'First-hand experiences to remind you you’re not alone.',
                  theme.palette.secondary.main,
                )}
                <Grid container spacing={3}>
                  {personalStories.map((chapter) => {
                    let partTitle = '';
                    if (chapter.order === 11 || chapter.order === 12) partTitle = 'Part I: Pioneers of A.A.';
                    if (chapter.order === 13) partTitle = 'Part II: They Stopped in Time';
                    if (chapter.order === 14) partTitle = 'Part III: They Lost Nearly All';
                    const accentColor = theme.palette.secondary.main;

                    return (
                      <Grid item xs={12} sm={6} key={chapter.slug}>
                        <Card sx={createCardStyles(accentColor)} variant="outlined">
                          {/* Image Header Section */}
                          <Box
                            sx={{
                              height: 160,
                              position: 'relative',
                              overflow: 'hidden',
                              borderBottom: `1px solid ${alpha(accentColor, 0.16)}`,
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: (() => {
                                  const [specificImage, fallbackImage] = getChapterImage(chapter.order);
                                  return `url('${specificImage}'), url('${fallbackImage}')`;
                                })(),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.9)',
                              }}
                            />
                            {/* Overlay gradient */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '60%',
                                background: `linear-gradient(to top, ${alpha(accentColor, 0.9)} 0%, transparent 100%)`,
                              }}
                            />
                            {/* Part label */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.6,
                                borderRadius: 999,
                                backgroundColor: alpha(theme.palette.common.white, 0.8),
                                color: accentColor,
                                fontWeight: 600,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                                fontSize: 11,
                              }}
                            >
                              {partTitle}
                            </Box>
                            {/* Title on image */}
                            <Typography
                              variant="h6"
                              sx={{
                                position: 'absolute',
                                bottom: 12,
                                left: 16,
                                right: 16,
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                lineHeight: 1.2,
                              }}
                            >
                              {chapter.title}
                            </Typography>
                          </Box>

                          {/* Content Section */}
                          <CardContent sx={{ pt: 2, pb: 1 }}>
                            <Box
                              sx={{
                                bgcolor: alpha(accentColor, 0.12),
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1,
                                display: 'inline-block',
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                Pages {chapter.startPage} – {chapter.endPage}
                              </Typography>
                            </Box>
                          </CardContent>

                          {/* Actions Section */}
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                              component={Link}
                              href={`/big-book/page/${chapter.startPage}`}
                              fullWidth
                              variant="contained"
                              color="secondary"
                              sx={{
                                borderRadius: 999,
                                py: 1,
                                fontWeight: 600,
                              }}
                            >
                              Open Chapter
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Appendices Section */}
              <Box>
                {renderSectionHeading(
                  'Appendices & Reference',
                  'Dive deeper into the history, traditions, and additional guidance.',
                  theme.palette.info.main,
                )}
                <Grid container spacing={3}>
                  {appendices.map((chapter) => {
                    const accentColor = theme.palette.info.main;
                    return (
                      <Grid item xs={12} sm={6} key={chapter.slug}>
                        <Card sx={createCardStyles(accentColor)} variant="outlined">
                          {/* Image Header Section */}
                          <Box
                            sx={{
                              height: 160,
                              position: 'relative',
                              overflow: 'hidden',
                              borderBottom: `1px solid ${alpha(accentColor, 0.16)}`,
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: (() => {
                                  const [specificImage, fallbackImage] = getChapterImage(chapter.order);
                                  return `url('${specificImage}'), url('${fallbackImage}')`;
                                })(),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.9)',
                              }}
                            />
                            {/* Overlay gradient */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '60%',
                                background: `linear-gradient(to top, ${alpha(accentColor, 0.9)} 0%, transparent 100%)`,
                              }}
                            />
                            {/* Reference Material label */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.6,
                                borderRadius: 999,
                                backgroundColor: alpha(theme.palette.common.white, 0.8),
                                color: accentColor,
                                fontWeight: 600,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                                fontSize: 12,
                              }}
                            >
                              Reference Material
                            </Box>
                            {/* Title on image */}
                            <Typography
                              variant="h6"
                              sx={{
                                position: 'absolute',
                                bottom: 12,
                                left: 16,
                                right: 16,
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                lineHeight: 1.2,
                              }}
                            >
                              {chapter.title}
                            </Typography>
                          </Box>

                          {/* Content Section */}
                          <CardContent sx={{ pt: 2, pb: 1 }}>
                            <Box
                              sx={{
                                bgcolor: alpha(accentColor, 0.12),
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1,
                                display: 'inline-block',
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                Pages {chapter.startPage} – {chapter.endPage}
                              </Typography>
                            </Box>
                          </CardContent>

                          {/* Actions Section */}
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                              component={Link}
                              href={`/big-book/page/${chapter.startPage}`}
                              fullWidth
                              variant="contained"
                              color="info"
                              sx={{
                                borderRadius: 999,
                                py: 1,
                                fontWeight: 600,
                              }}
                            >
                              Open Section
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Reading Progress Section */}
              <Card
                sx={{
                  position: 'relative',
                  borderradius: 1,
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)} 0%, ${alpha(theme.palette.secondary.light, 0.12)} 48%, ${alpha(theme.palette.success.light, 0.18)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  boxShadow: '0 20px 42px rgba(15, 97, 80, 0.18)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.65) 0%, transparent 55%)',
                    opacity: 0.8,
                    pointerEvents: 'none',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    right: { xs: -10, md: 32 },
                    bottom: { xs: -20, md: -6 },
                    width: { xs: 160, md: 220 },
                    height: { xs: 160, md: 220 },
                    pointerEvents: 'none',
                    opacity: 0.9,
                  }}
                >
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image
                      src="/images/mascot.png"
                      alt=""
                      fill
                      sizes="(max-width: 900px) 40vw, 220px"
                      style={{ objectFit: 'contain' }}
                    />
                  </Box>
                </Box>
                <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                  <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
                    Reading Progress
                  </Typography>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        Overall: 67%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Page 302 of 565
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: '100%',
                      height: 12,
                      bgcolor: 'action.hover',
                      borderRadius: 6,
                      overflow: 'hidden'
                    }}>
                      <Box
                        sx={{
                          width: '67%',
                          height: '100%',
                          bgcolor: 'primary.main',
                          borderRadius: 6
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Recently Read */}
                  <Typography variant="h6" gutterBottom>
                    Recently Read
                  </Typography>
                  <Stack spacing={1}>
                    {recentlyRead.map((item, index) => (
                      <Button
                        key={index}
                        component={Link}
                        href={`/big-book/page/${item.page}`}
                        variant="contained"
                        color="primary"
                        startIcon={<BookmarkIcon />}
                        sx={{
                          justifyContent: 'flex-start',
                          borderRadius: 2,
                          px: 2,
                          py: 1.5,
                          boxShadow: '0 12px 24px rgba(15, 97, 80, 0.15)',
                          textAlign: 'left',
                          textTransform: 'none',
                        }}
                      >
                        <Typography>{item.title}</Typography>
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Stack>
      </Container>

      <BigBookSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Help & Accessibility Footer */}
      <Box
        sx={{
          width: '100%',
          py: 2,
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Get Help">
          <Button
            variant="text"
            color="primary"
            startIcon={<HelpOutlineIcon />}
            size={isSmall ? "small" : "medium"}
            aria-label="Get help with the Big Book reader"
          >
            Need Help?
          </Button>
        </Tooltip>

        <Tooltip title="Accessibility Options">
          <Button
            variant="text"
            color="primary"
            startIcon={<AccessibilityNewIcon />}
            size={isSmall ? "small" : "medium"}
            onClick={() => setAccessibilityOpen(true)}
            aria-label="Accessibility options"
          >
            Reading Settings
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}


