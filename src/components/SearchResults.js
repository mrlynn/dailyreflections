'use client';

import { Box, Typography, Card, CardContent, Divider, Chip, Link } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * Display search results from reflection vector search
 *
 * @param {Object} props
 * @param {Array} props.results - Search results array
 * @param {string} props.query - Search query
 * @param {boolean} props.loading - Whether results are loading
 */
export default function SearchResults({ results = [], query = '', loading = false }) {
  const router = useRouter();

  // No results state
  if (!loading && results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No reflections found for "{query}"
        </Typography>
      </Box>
    );
  }

  // Navigate to a reflection when clicked
  const handleReflectionClick = (month, day) => {
    const dateKey = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    router.push(`/${dateKey}`);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
      </Typography>

      {results.map((reflection, index) => {
        // Format date as MM-DD
        const dateKey = `${reflection.month.toString().padStart(2, '0')}-${reflection.day.toString().padStart(2, '0')}`;

        // Calculate match percentage
        const matchPercentage = reflection.score ? Math.round(reflection.score * 100) : null;

        return (
          <Card
            key={reflection._id || index}
            sx={{
              mb: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
              }
            }}
            onClick={() => handleReflectionClick(reflection.month, reflection.day)}
          >
            <CardContent>
              {/* Title and Date */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  {reflection.title}
                </Typography>
                <Box>
                  {matchPercentage && (
                    <Chip
                      label={`${matchPercentage}% match`}
                      size="small"
                      color={matchPercentage > 85 ? "primary" : "default"}
                      sx={{
                        mr: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Typography variant="caption" component="span" sx={{ color: 'text.secondary' }}>
                    {dateKey}
                  </Typography>
                </Box>
              </Box>

              {/* Quote Preview */}
              <Typography
                variant="body2"
                sx={{
                  fontStyle: 'italic',
                  mb: 1,
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {reflection.quote}
              </Typography>

              {/* Reference */}
              <Typography variant="caption" color="text.secondary">
                {reflection.reference}
              </Typography>

              {/* Link */}
              <Box sx={{ mt: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReflectionClick(reflection.month, reflection.day);
                  }}
                >
                  Read reflection
                </Link>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}