'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Paper,
} from '@mui/material';

/**
 * UnifiedSearchResults Component
 * Displays categorized search results from the unified search API
 */
export default function UnifiedSearchResults({ searchData, onCategoryToggle }) {
  const router = useRouter();
  const [activeCategories, setActiveCategories] = useState({
    reflections: true,
    journal: true,
    bigbook: true,
    articles: true,
    meetings: true,
    courses: true
  });

  if (!searchData) {
    return null;
  }

  const { results, categoryCounts, totalResults, executionTime } = searchData;

  const handleCategoryToggle = (category) => {
    const newActiveCategories = {
      ...activeCategories,
      [category]: !activeCategories[category]
    };
    setActiveCategories(newActiveCategories);
    if (onCategoryToggle) {
      onCategoryToggle(newActiveCategories);
    }
  };

  const handleResultClick = (url) => {
    router.push(url);
  };

  // Category metadata
  const categoryInfo = {
    reflections: {
      label: 'Daily Reflections',
      icon: '📖',
      color: 'primary'
    },
    journal: {
      label: 'My Journal',
      icon: '📝',
      color: 'secondary'
    },
    bigbook: {
      label: 'Big Book',
      icon: '📚',
      color: 'success'
    },
    articles: {
      label: 'Blog Articles',
      icon: '📰',
      color: 'warning'
    },
    meetings: {
      label: 'Meetings',
      icon: '👥',
      color: 'error'
    },
    courses: {
      label: 'Courses',
      icon: '🎓',
      color: 'info'
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Search Summary */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Found {totalResults} results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search completed in {executionTime}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Category Filters */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(categoryInfo).map(([key, info]) => {
          const count = categoryCounts[key] || 0;
          const isActive = activeCategories[key];

          return (
            <Chip
              key={key}
              label={`${info.icon} ${info.label} (${count})`}
              onClick={() => handleCategoryToggle(key)}
              color={isActive ? info.color : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
              disabled={count === 0}
              sx={{
                fontWeight: isActive ? 600 : 400,
                cursor: count === 0 ? 'not-allowed' : 'pointer',
                opacity: count === 0 ? 0.5 : 1
              }}
            />
          );
        })}
      </Stack>

      {/* Results by Category */}
      <Stack spacing={4}>
        {Object.entries(results).map(([category, items]) => {
          if (!activeCategories[category] || !items || items.length === 0) {
            return null;
          }

          const info = categoryInfo[category];

          return (
            <Box key={category}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: `${info.color}.main`
                }}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
                <Typography
                  component="span"
                  variant="body1"
                  sx={{ fontWeight: 400, color: 'text.secondary' }}
                >
                  ({items.length})
                </Typography>
              </Typography>

              <Stack spacing={2}>
                {items.map((item) => (
                  <ResultCard
                    key={item._id}
                    item={item}
                    category={category}
                    onClick={() => handleResultClick(item.url)}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* No Results */}
      {totalResults === 0 && (
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No results found. Try a different search term.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

/**
 * ResultCard Component
 * Displays a single search result
 */
function ResultCard({ item, category, onClick }) {
  const renderCategorySpecificInfo = () => {
    switch (category) {
      case 'reflections':
        return (
          <Typography variant="caption" color="text.secondary">
            {item.dateKey} • Match: {Math.round(item.score * 100)}%
          </Typography>
        );

      case 'journal':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              {new Date(item.date).toLocaleDateString()}
            </Typography>
            {item.tags && item.tags.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                • Tags: {item.tags.join(', ')}
              </Typography>
            )}
            {item.mood && (
              <Typography variant="caption" color="text.secondary">
                • Mood: {item.mood}/5
              </Typography>
            )}
          </Box>
        );

      case 'bigbook':
        return (
          <Typography variant="caption" color="text.secondary">
            Page {item.pageNumber} • {item.chapter}
          </Typography>
        );

      case 'articles':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {item.resourceType}
            </Typography>
            {item.publishedAt && (
              <Typography variant="caption" color="text.secondary">
                • {new Date(item.publishedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        );

      case 'meetings':
        return (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {item.dayName} at {item.time}
              {item.address && ` • ${item.address}`}
            </Typography>
            {item.isOnline && (
              <Chip
                label="🌐 Online"
                size="small"
                color="success"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        );

      case 'courses':
        return (
          <Typography variant="caption" color="text.secondary">
            {item.type === 'course' && 'Course'}
            {item.type === 'module' && `Module in ${item.courseTitle}`}
            {item.type === 'lesson' && `Lesson in ${item.courseTitle} → ${item.moduleTitle}`}
          </Typography>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2
        }
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              color: 'text.primary'
            }}
          >
            {item.title || item.name}
          </Typography>

          <Box sx={{ mb: 1 }}>
            {renderCategorySpecificInfo()}
          </Box>

          {item.excerpt && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.excerpt}
            </Typography>
          )}

          {item.snippet && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.snippet}
            </Typography>
          )}

          {item.quote && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              &quot;{item.quote}&quot;
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
