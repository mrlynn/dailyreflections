'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';

const PAGE_SIZE = 9;

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 450);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchArticles() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('page', String(page));
        if (category && category !== 'all') params.set('category', category);
        if (tag && tag !== 'all') params.set('tag', tag);
        if (debouncedSearch) params.set('q', debouncedSearch);

        const response = await fetch(`/api/blog?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load articles');
        }

        const data = await response.json();
        setArticles(Array.isArray(data.articles) ? data.articles : []);
        const pagination = data.pagination || {};
        setTotalPages(Math.max(1, Number(pagination.pageCount) || 1));
        setTotalResults(Number(pagination.total) || (data.articles?.length ?? 0));
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching articles:', err);
        setError(err.message || 'Something went wrong while loading articles.');
        setArticles([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();

    return () => controller.abort();
  }, [page, category, tag, debouncedSearch]);

  useEffect(() => {
    async function bootstrapFilters() {
      try {
        const [categoryRes, tagRes] = await Promise.all([
          fetch('/api/blog/categories'),
          fetch('/api/blog/tags'),
        ]);

        if (categoryRes.ok) {
          const data = await categoryRes.json();
          setCategories(Array.isArray(data.categories) ? data.categories : []);
        }
        if (tagRes.ok) {
          const data = await tagRes.json();
          setTags(Array.isArray(data.tags) ? data.tags : []);
        }
      } catch (err) {
        console.error('Error bootstrapping blog filters:', err);
      }
    }

    bootstrapFilters();
  }, []);

  const formattedResultsLabel = useMemo(() => {
    if (loading) return 'Loading articles…';
    if (error) return 'Unable to load articles';
    if (totalResults === 0) return 'No articles found';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, totalResults);
    return `Showing ${start}-${end} of ${totalResults} articles`;
  }, [loading, error, totalResults, page]);

  const handlePageChange = (_event, value) => {
    setPage(value);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handleTagChange = (event) => {
    setTag(event.target.value);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={6} textAlign="center">
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Recovery Blog
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Articles, resources, and stories to support your recovery journey
        </Typography>
      </Box>

      {/* Filters */}
      <Box mb={4} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search articles..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ flex: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Category</InputLabel>
          <Select value={category} onChange={handleCategoryChange} label="Category">
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Tag</InputLabel>
          <Select value={tag} onChange={handleTagChange} label="Tag">
            <MenuItem value="all">All Tags</MenuItem>
            {tags.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Results info */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {formattedResultsLabel}
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Article listings */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : articles.length > 0 ? (
        <Grid container spacing={4}>
          {articles.map((article) => {
            const articleTags = Array.isArray(article.tags) ? article.tags : [];
            const authorName = article.author?.name || 'Daily Reflections';

            return (
              <Grid item xs={12} key={article.slug || article.id}>
                <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
                  <CardMedia
                    component="img"
                    sx={{
                      width: { xs: '100%', md: 240 },
                      height: { xs: 200, md: 240 },
                      bgcolor: 'grey.100',
                    }}
                    image={article.coverImage || '/images/blog/default.jpg'}
                    alt={article.title}
                  />
                  <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
                    <Box mb={1}>
                      <Chip
                        label={article.category}
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        {formatDate(article.publishedAt)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h5"
                      component="h2"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <Link href={`/blog/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {article.title}
                      </Link>
                    </Typography>
                    <Typography variant="body1" paragraph color="text.secondary">
                      {article.excerpt}
                    </Typography>
                    <Box mt="auto" display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <PersonIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        {authorName}
                      </Typography>
                      <Box>
                        {articleTags.slice(0, 3).map((tagLabel) => (
                          <Chip
                            key={tagLabel}
                            label={tagLabel}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {articleTags.length > 3 && (
                          <Chip
                            label={`+${articleTags.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box textAlign="center" my={8}>
          <Typography variant="h6">No articles found matching your criteria</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Try adjusting your search filters or check back later for new content.
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={6}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
}