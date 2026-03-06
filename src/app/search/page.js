'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import UnifiedSearchResults from '@/components/UnifiedSearchResults';

/**
 * Dedicated search page for full-screen searching experience
 */
function SearchPageContent() {
  // Get search params and router for navigation
  const searchParams = useSearchParams();
  const router = useRouter();

  // Component state
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState([]);
  const [unifiedResults, setUnifiedResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [useUnifiedSearch, setUseUnifiedSearch] = useState(true);

  // Use effect to run search only once when component mounts
  useEffect(() => {
    const currentQuery = searchParams?.get('q') || '';

    if (currentQuery) {
      console.log('🔍 Initial search from URL parameter:', currentQuery);
      setQuery(currentQuery);
      performSearch(currentQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  async function performSearch(searchQuery) {
    if (!searchQuery.trim()) return;

    console.log('🔍 Performing search for:', searchQuery);
    setLoading(true);

    try {
      if (useUnifiedSearch) {
        console.log('📤 Sending unified search request to API...');
        const response = await fetch('/api/unified-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 10,
          }),
        });

        console.log('📥 API response status:', response.status);
        const data = await response.json();
        console.log('📥 API response data:', data);

        if (data.results) {
          console.log(`✅ Unified search found ${data.totalResults} total results`);
          setUnifiedResults(data);
          setResults([]); // Clear old results
        } else {
          console.log('❌ No results found or error occurred');
          setUnifiedResults(null);
        }
      } else {
        console.log('📤 Sending search request to API...');
        const response = await fetch('/api/reflections/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 20,
            minScore: 0.6,
          }),
        });

        console.log('📥 API response status:', response.status);
        const data = await response.json();
        console.log('📥 API response data:', data);

        if (data.results) {
          console.log(`✅ Found ${data.results.length} results`);
          setResults(data.results);
          setUnifiedResults(null); // Clear unified results
        } else {
          console.log('❌ No results found or error occurred');
          setResults([]);
        }
      }

      // Update URL with search query for sharing and refreshing, but only if needed
      try {
        const currentURLQuery = searchParams?.get('q');
        if (currentURLQuery !== searchQuery) {
          console.log('📝 Updating URL query parameter:', searchQuery);

          // Use Next.js router for navigation without full page reload
          router.replace(`/search?q=${encodeURIComponent(searchQuery)}`, { shallow: true });
        }
      } catch (urlError) {
        console.error('Error updating URL:', urlError);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setUnifiedResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(searchQuery) {
    // Only perform search if query has changed
    if (searchQuery !== query) {
      console.log('🔍 Search requested for new query:', searchQuery);
      setQuery(searchQuery);
      performSearch(searchQuery);
    } else {
      console.log('🔍 Search skipped - query unchanged:', searchQuery);
    }
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setUnifiedResults(null);

    // Update URL to remove query parameter
    const url = new URL(window.location);
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }

  function handleBack() {
    router.back();
  }

  function toggleKeyboardShortcuts() {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  }

  // Handle keyboard shortcuts for the search page
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't handle shortcuts when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Escape key to clear search when in search field
        if (e.key === 'Escape' && query) {
          e.preventDefault();
          setQuery('');
        }
        return;
      }

      // Show keyboard shortcuts with '?'
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }

      // Focus search with '/' or Ctrl+K
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              {useUnifiedSearch ? 'Unified Search' : 'Search Reflections'}
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink
                underline="hover"
                color="inherit"
                href="/"
                sx={{ cursor: 'pointer' }}
              >
                Home
              </MuiLink>
              <Typography color="text.primary">Search</Typography>
            </Breadcrumbs>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={useUnifiedSearch ? 'All Content' : 'Reflections Only'}
            color={useUnifiedSearch ? 'primary' : 'default'}
            onClick={() => setUseUnifiedSearch(!useUnifiedSearch)}
            sx={{ cursor: 'pointer' }}
          />
          <IconButton onClick={toggleKeyboardShortcuts} color="primary">
            <KeyboardIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Keyboard shortcuts help */}
      {showKeyboardShortcuts && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
            Keyboard Shortcuts
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Chip label="/ or Ctrl+K: Focus search" size="small" sx={{ fontWeight: 500 }} />
            <Chip label="Escape: Clear search" size="small" sx={{ fontWeight: 500 }} />
            <Chip label="Enter: Perform search" size="small" sx={{ fontWeight: 500 }} />
            <Chip label="?: Toggle shortcuts" size="small" sx={{ fontWeight: 500 }} />
            <Chip label="↑↓: Navigate through results" size="small" sx={{ fontWeight: 500 }} />
          </Box>
        </Paper>
      )}

      {/* Search Bar */}
      <Box sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClear}
          initialQuery={query}
          loading={loading}
          autoFocus
        />
      </Box>

      {/* Results Area */}
      <Box sx={{ maxWidth: useUnifiedSearch ? '1200px' : '800px', mx: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : useUnifiedSearch && unifiedResults ? (
          <UnifiedSearchResults searchData={unifiedResults} />
        ) : !useUnifiedSearch && results.length > 0 ? (
          <SearchResults results={results} query={query} loading={loading} />
        ) : null}

        {!loading && useUnifiedSearch && unifiedResults?.totalResults === 0 && query ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(99, 102, 241, 0.04)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              No results found for <strong>"{query}"</strong>. Try a different search term.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try using more general terms or check your spelling.
            </Typography>
          </Paper>
        ) : !loading && !useUnifiedSearch && results.length === 0 && query ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(99, 102, 241, 0.04)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              No results found for <strong>"{query}"</strong>. Try a different search term.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try using more general terms or check your spelling.
            </Typography>
          </Paper>
        ) : null}

        {!query && !loading && (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(99, 102, 241, 0.04)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Search Tips
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {useUnifiedSearch
                ? 'Search across all content: reflections, journal, Big Book, articles, meetings, and courses'
                : 'Search for daily reflections by topic, theme, or keywords'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Example searches: <strong>"surrender"</strong>, <strong>"acceptance"</strong>, <strong>"spiritual growth"</strong>, <strong>"step one"</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              💡 Tip: Toggle between &quot;All Content&quot; and &quot;Reflections Only&quot; modes using the chip above
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <SearchPageContent />
    </Suspense>
  );
}