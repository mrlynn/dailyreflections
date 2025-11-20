'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  Link,
  CircularProgress,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * Display similar reflections based on vector similarity
 *
 * @param {Object} props
 * @param {string} props.dateKey - Current reflection date key in MM-DD format
 * @param {number} props.limit - Maximum number of similar reflections to show
 */
export default function SimilarReflections({ dateKey, limit = 3 }) {
  const router = useRouter();
  const [similarReflections, setSimilarReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch similar reflections when dateKey changes
  useEffect(() => {
    if (!dateKey) return;

    const fetchSimilarReflections = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/reflections/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceDate: dateKey,
            limit: limit,
            minScore: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch similar reflections');
        }

        const data = await response.json();

        if (data.results) {
          // Filter out the current reflection if it appears in results
          const filtered = data.results.filter(reflection => {
            const reflectionKey = `${reflection.month.toString().padStart(2, '0')}-${reflection.day.toString().padStart(2, '0')}`;
            return reflectionKey !== dateKey;
          });

          setSimilarReflections(filtered);
        } else {
          setSimilarReflections([]);
        }
      } catch (err) {
        console.error('Error fetching similar reflections:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarReflections();
  }, [dateKey, limit]);

  // Navigate to a reflection when clicked
  const handleReflectionClick = (month, day) => {
    const newDateKey = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    router.push(`/${newDateKey}`);
  };

  // Don't render anything if no similar reflections found
  if (!loading && (similarReflections.length === 0 || error)) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, pt: 1 }}>
      <Divider sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          component="span"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            px: 2,
            fontFamily: 'var(--font-poppins)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <span>You Might Also Like</span>
        </Typography>
      </Divider>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Stack spacing={2}>
          {similarReflections.map((reflection, index) => {
            // Calculate match percentage
            const matchPercentage = reflection.score ? Math.round(reflection.score * 100) : null;

            return (
              <Card
                key={reflection._id || index}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: matchPercentage > 85 ? 'rgba(99, 102, 241, 0.04)' : 'background.paper',
                  borderLeft: matchPercentage > 85 ? '3px solid' : '1px solid',
                  borderLeftColor: matchPercentage > 85 ? 'primary.main' : 'divider',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    borderLeftColor: 'primary.main',
                  }
                }}
                onClick={() => handleReflectionClick(reflection.month, reflection.day)}
              >
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {reflection.title}
                    </Typography>
                    <Box>
                      {matchPercentage && (
                        <Chip
                          label={`${matchPercentage}% match`}
                          size="small"
                          color={matchPercentage > 85 ? "primary" : "default"}
                          sx={{
                            height: '20px',
                            mr: 1,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                      <Typography variant="caption" component="span" sx={{ color: 'text.secondary' }}>
                        {reflection.month.toString().padStart(2, '0')}-{reflection.day.toString().padStart(2, '0')}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
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
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}