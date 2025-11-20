'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const SEARCH_URL = '/api/bigbook/search';

export default function BigBookSearchDialog({ open, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasQuery = query.trim().length > 0;

  const handleSearch = useCallback(async () => {
    if (!hasQuery) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query.trim() });
      const response = await fetch(`${SEARCH_URL}?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error('Big Book search failed:', err);
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, hasQuery]);

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearch();
  };

  const handleClose = () => {
    setResults([]);
    setError(null);
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      <DialogTitle sx={{ pb: 1, pr: 6 }}>
        Search the Big Book
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Close search dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            fullWidth
            label="Search for keywords, phrases, or concepts"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} disabled={!hasQuery}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Use quotes for exact matches (e.g., “spiritual awakening”)"
          />

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box>
              <Skeleton height={64} sx={{ mb: 2 }} />
              <Skeleton height={64} sx={{ mb: 2 }} />
              <Skeleton height={64} />
            </Box>
          ) : (
            <List sx={{ maxHeight: 360, overflowY: 'auto', pr: 1 }}>
              {results.map((result) => (
                <ListItem disablePadding key={`${result.pageNumber}-${result.snippet}`}>
                  <ListItemButton
                    component={Link}
                    href={`/big-book/page/${result.pageNumber}`}
                    onClick={handleClose}
                    alignItems="flex-start"
                  >
                    <ListItemText
                      primary={(
                        <Typography variant="subtitle1" fontWeight={600}>
                          Page {result.pageNumber}
                          {result.chapterTitle ? ` · ${result.chapterTitle}` : ''}
                        </Typography>
                      )}
                      secondary={(
                        <Typography variant="body2" color="text.secondary">
                          {result.snippet}
                        </Typography>
                      )}
                    />
                  </ListItemButton>
                </ListItem>
              ))}

              {!loading && results.length === 0 && hasQuery && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No passages found. Try a different keyword or broaden your search.
                </Typography>
              )}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSearch}
          variant="contained"
          disabled={!hasQuery}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
}


