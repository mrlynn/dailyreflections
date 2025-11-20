'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Chip,
  Avatar,
  Grid,
  Divider,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Link from 'next/link';

function formatDate(dateString) {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export default function ArticlePageClient({ article, relatedArticles = [], previewToken = null }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [sharePending, setSharePending] = useState(false);

  const heroImage = article?.coverImage || '/images/blog/default.jpg';
  const articleTags = Array.isArray(article?.tags) ? article.tags : [];
  const isPreview = Boolean(article?.isPreview) || (previewToken && article?.status !== 'published');

  const readingTimeLabel = useMemo(() => {
    if (!article?.readingTimeMinutes) return null;
    const minutes = article.readingTimeMinutes;
    return `${minutes} min read`;
  }, [article?.readingTimeMinutes]);

  const handleShare = async () => {
    if (!article) return;
    try {
      setSharePending(true);
      const shareData = {
        title: article.title,
        text: article.excerpt,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && shareData.url) {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      if (article && typeof window !== 'undefined') {
        alert('Unable to share automatically. Copy the URL from your address bar.');
      }
    } finally {
      setSharePending(false);
    }
  };

  const toggleBookmark = () => {
    setBookmarked((prev) => !prev);
    // TODO: Persist bookmarks once user profiles are available
  };

  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box textAlign="center">
          <Typography variant="h4" gutterBottom>Article Not Found</Typography>
          <Typography variant="body1" paragraph>
            The article you are looking for does not exist or has been removed.
          </Typography>
          <Button
            component={Link}
            href="/blog"
            startIcon={<ArrowBackIcon />}
            variant="contained"
            color="primary"
          >
            Back to Blog
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box>
      {/* Hero section with cover image */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 240, md: 400 },
          width: '100%',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.6) 100%)',
            zIndex: 1
          }
        }}
      >
        <Box
          component="img"
          src={heroImage}
          alt={article.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        <Container
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            pb: { xs: 3, md: 6 },
            zIndex: 2,
          }}
        >
          <Chip
            label={article.category}
            size="small"
            color="primary"
            sx={{ mb: 2, maxWidth: 'fit-content' }}
          />
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1.9rem', sm: '2.5rem', md: '3.2rem' },
              textShadow: '0px 3px 6px rgba(0,0,0,0.5)'
            }}
          >
            {article.title}
          </Typography>
          {isPreview && (
            <Chip
              label={article.status === 'published' ? 'Preview' : `Draft Preview (${article.status})`}
              color="warning"
              sx={{ maxWidth: 'fit-content' }}
            />
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Article metadata */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              alt={article.author?.name}
              src={article.author?.avatar || ''}
              sx={{ mr: 2, width: 56, height: 56 }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight={500}>
                {article.author?.name || 'Daily Reflections'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                  {formatDate(article.publishedAt)}
                </Typography>
                {readingTimeLabel && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                  >
                    <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                    {readingTimeLabel}
                  </Typography>
                )}
              {article.status && (
                <Chip
                  label={article.status === 'published' ? 'Published' : article.status}
                  size="small"
                  color={article.status === 'published' ? 'success' : 'default'}
                  variant="outlined"
                />
              )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              component={Link}
              href="/blog"
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Tooltip title="Share this article">
              <span>
                <IconButton onClick={handleShare} size="small" disabled={sharePending}>
                  {sharePending ? <CircularProgress size={18} /> : <ShareIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={bookmarked ? 'Remove bookmark' : 'Save for later'}>
              <IconButton onClick={toggleBookmark} size="small">
                {bookmarked ? (
                  <BookmarkIcon fontSize="small" color="primary" />
                ) : (
                  <BookmarkBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tags */}
        {articleTags.length > 0 && (
          <Box mb={4}>
            {articleTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}

        {/* Article content */}
        <Box
          sx={{
            fontSize: '1.125rem',
            lineHeight: 1.8,
            '& h1, & h2, & h3, & h4': {
              mt: 4,
              fontWeight: 600,
            },
            '& h1': { fontSize: '2.25rem' },
            '& h2': { fontSize: '1.75rem' },
            '& h3': { fontSize: '1.4rem' },
            '& p': { mb: 2 },
            '& ul, & ol': { pl: 3, mb: 2 },
            '& li': { mb: 1.5 },
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              pl: 3,
              py: 1,
              fontStyle: 'italic',
              color: 'text.secondary',
            },
            '& img': {
              maxWidth: '100%',
              borderRadius: 2,
              my: 3,
            },
            '& pre': {
              backgroundColor: 'grey.900',
              color: 'grey.50',
              borderRadius: 2,
              p: 2,
              overflowX: 'auto',
              fontSize: '0.9rem',
            },
            '& code': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              px: 0.6,
              py: 0.2,
              borderRadius: 1,
              fontSize: '0.9rem',
            },
          }}
          dangerouslySetInnerHTML={{ __html: article.body || '' }}
        />

        <Divider sx={{ my: 6 }} />

        {/* Author bio */}
        {(article.author?.bio || article.author?.name) && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'grey.50',
              borderRadius: 2,
              mb: 6
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                alt={article.author?.name}
                src={article.author?.avatar || ''}
                sx={{ width: 64, height: 64, mr: 2 }}
              />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {article.author?.name || 'Daily Reflections'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Author
                </Typography>
              </Box>
            </Box>
            {article.author?.bio && (
              <Typography variant="body2">
                {article.author.bio}
              </Typography>
            )}
          </Paper>
        )}

        {/* Related articles */}
        {Array.isArray(relatedArticles) && relatedArticles.length > 0 && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Related Articles
            </Typography>
            <Grid container spacing={3}>
              {relatedArticles.map((relArticle) => (
                <Grid item xs={12} sm={6} md={4} key={relArticle.slug || relArticle.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box
                        component="img"
                        src={relArticle.coverImage || '/images/blog/default.jpg'}
                        alt={relArticle.title}
                        sx={{ width: '100%', height: 140, objectFit: 'cover' }}
                      />
                      <Box sx={{ p: 2 }}>
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          gutterBottom
                          sx={{
                            fontWeight: 600,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          <Link href={`/blog/${relArticle.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {relArticle.title}
                          </Link>
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(relArticle.publishedAt)}
                          </Typography>
                          <Chip
                            label={relArticle.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}

