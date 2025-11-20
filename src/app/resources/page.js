'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';

const RESOURCE_TYPE_LABELS = {
  literature: 'Literature',
  resource: 'Resource',
  video: 'Video',
  audio: 'Audio',
  article: 'Article',
};

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const EMPTY_STATE_MESSAGE =
  'We could not find any resources that match your filters. Try adjusting your search or clear the filters below.';

export default function ResourcesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('q') ?? '';
  const initialType = searchParams.get('type') ?? 'all';
  const initialTopic = searchParams.get('topic') ?? 'all';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageCount: 1,
    limit: 24,
  });

  const debouncedSearch = useDebounce(searchTerm, 400);

  const derivedTypes = useMemo(() => {
    const types = new Set(resources.map((resource) => resource.resourceType).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [resources]);

  const derivedTopics = useMemo(() => {
    const topics = new Set();
    resources.forEach((resource) => {
      (resource.topics || []).forEach((topic) => topics.add(topic));
    });
    return ['all', ...Array.from(topics)];
  }, [resources]);

  const suggestions = useMemo(() => {
    if (!debouncedSearch) return [];
    return resources.slice(0, 5);
  }, [resources, debouncedSearch]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedTopic !== 'all') params.set('topic', selectedTopic);

    router.replace(params.size ? `/resources?${params.toString()}` : '/resources', {
      scroll: false,
    });
  }, [debouncedSearch, selectedType, selectedTopic, router]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchResources() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '48');
        params.set('status', 'published');
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (selectedType !== 'all') params.set('type', selectedType);
        if (selectedTopic !== 'all') params.set('topic', selectedTopic);

        const response = await fetch(`/api/resources?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const { error: message } = await response.json();
          throw new Error(message || 'Failed to fetch resources');
        }

        const data = await response.json();
        setResources(data.resources || []);
        setPagination(data.pagination || { total: 0, page: 1, pageCount: 1, limit: 24 });
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching resources:', err);
        setError(err.message || 'Something went wrong while loading resources.');
        setResources([]);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();

    return () => controller.abort();
  }, [debouncedSearch, selectedType, selectedTopic]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
  };

  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
  };

  const resetFilters = () => {
    setSelectedType('all');
    setSelectedTopic('all');
    setSearchTerm('');
  };

  return (
    <>
      <PageHeader
        title="AA Resources & Literature"
        icon={<BookmarksIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Explore AA literature, recovery tools, and curated resources with powerful search and filters."
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 3,
            borderradius: 1,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 80%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box flex={1}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => {
                  setTimeout(() => setSuggestionsOpen(false), 150);
                }}
                placeholder="Search literature, topics, descriptions, or keywords…"
                label="Search the library"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Clear search"
                        onClick={() => setSearchTerm('')}
                        size="small"
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />

              {suggestionsOpen && suggestions.length > 0 && (
                <Paper
                  elevation={3}
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                  }}
                >
                  {suggestions.map((suggestion) => (
                    <Box
                      key={suggestion._id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onMouseDown={() => {
                        setSearchTerm(suggestion.title);
                        setSuggestionsOpen(false);
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {suggestion.title}
                      </Typography>
                      {suggestion.summary && (
                        <Typography variant="caption" color="text.secondary">
                          {suggestion.summary}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Tooltip title="Reset filters and search">
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<FilterAltIcon />}
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">
                Filter by type:
              </Typography>
              {derivedTypes.map((type) => (
                <Chip
                  key={type}
                  label={type === 'all' ? 'All types' : RESOURCE_TYPE_LABELS[type] || type}
                  color={selectedType === type ? 'primary' : 'default'}
                  variant={selectedType === type ? 'filled' : 'outlined'}
                  onClick={() => handleTypeChange(type)}
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">
                Filter by topic:
              </Typography>
              {derivedTopics.map((topic) => (
                <Chip
                  key={topic}
                  label={topic === 'all' ? 'All topics' : topic}
                  color={selectedTopic === topic ? 'primary' : 'default'}
                  variant={selectedTopic === topic ? 'filled' : 'outlined'}
                  onClick={() => handleTopicChange(topic)}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="35vh">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : resources.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: 'center',
              borderradius: 1,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              No resources found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {EMPTY_STATE_MESSAGE}
            </Typography>
          </Paper>
        ) : (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {resources.length} of {pagination.total} resources
            </Typography>

            <Grid container spacing={3}>
              {resources.map((resource) => {
                const typeLabel = RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType;
                const isExternal =
                  resource.link && (resource.link.startsWith('http://') || resource.link.startsWith('https://'));

                return (
                  <Grid item xs={12} sm={6} md={4} key={resource._id}>
                    <Card
                      elevation={1}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      {resource.metadata?.imageUrl && (
                        <CardMedia
                          component="img"
                          alt={resource.title}
                          image={resource.metadata.imageUrl}
                          sx={{
                            height: 180,
                            width: '100%',
                            objectFit: 'cover',
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                          }}
                        />
                      )}

                      <CardContent sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <Chip
                            label={typeLabel}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {resource.isFeatured && (
                            <Chip label="Featured" size="small" color="secondary" variant="filled" />
                          )}
                        </Stack>

                        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                          {resource.title}
                        </Typography>

                        {resource.summary && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {resource.summary}
                          </Typography>
                        )}

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                          {(resource.topics || []).map((topic) => (
                            <Chip
                              key={topic}
                              label={topic}
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedTopic(topic)}
                            />
                          ))}
                        </Stack>

                        {resource.publishedAt && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(resource.publishedAt), 'MMMM d, yyyy')}
                            </Typography>
                          </Stack>
                        )}
                      </CardContent>

                      <CardActions sx={{ px: 3, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                        {resource.link && (
                          <Button
                            size="small"
                            color="primary"
                            href={resource.link}
                            target={isExternal ? '_blank' : '_self'}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            endIcon={<OpenInNewIcon fontSize="small" />}
                          >
                            {isExternal ? 'Visit resource' : 'View resource'}
                          </Button>
                        )}
                        {resource.slug && !resource.link?.startsWith('http') && (
                          <Button size="small" href={`/resources/${resource.slug}`} color="secondary">
                            Learn more
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Container>
    </>
  );
}

