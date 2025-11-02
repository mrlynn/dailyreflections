'use client';

import { useState, useRef, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

/**
 * SearchBar component for searching reflections
 *
 * @param {Object} props
 * @param {Function} props.onSearch - Callback when search is submitted
 * @param {boolean} props.loading - Whether search is loading
 * @param {string} props.initialQuery - Initial search query
 * @param {Object} props.sx - Additional styles
 */
export default function SearchBar({
  onSearch,
  onClear,
  loading = false,
  initialQuery = '',
  sx = {},
  variant = 'outlined',
  fullWidth = true,
  autoFocus = false
}) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e) => {
    e?.preventDefault();
    console.log('🔍 SearchBar: Search triggered', { query: query.trim() });
    if (query.trim() && onSearch) {
      console.log('🔍 SearchBar: Calling onSearch callback');
      onSearch(query.trim());
    } else {
      console.log('⚠️ SearchBar: Search not performed', {
        queryEmpty: !query.trim(),
        onSearchExists: !!onSearch
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSearch}
      elevation={variant === 'outlined' ? 0 : 1}
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 2,
        ...sx
      }}
    >
      <TextField
        inputRef={inputRef}
        variant={variant}
        placeholder="Search reflections..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && handleClear()}
        fullWidth={fullWidth}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : query ? (
                <>
                  <IconButton
                    aria-label="search"
                    onClick={handleSearch}
                    edge="end"
                    size="small"
                    color="primary"
                    sx={{ mr: 0.5 }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClear}
                    edge="end"
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </>
              ) : null}
            </InputAdornment>
          ),
          sx: {
            borderRadius: 2,
            transition: 'all 0.2s',
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
    </Paper>
  );
}