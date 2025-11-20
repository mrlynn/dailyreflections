'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { triviaCategories } from '../../lib/sampleTriviaQuestions';

/**
 * LeaderboardComponent - Displays the trivia leaderboard
 *
 * @param {Object} props
 * @param {string} props.initialCategory - Initial category to display
 * @param {Object} props.userScore - User's most recent score (optional)
 * @param {number} props.userRank - User's rank in the leaderboard (optional)
 * @param {Function} props.onClose - Function to close the leaderboard (optional)
 */
export default function LeaderboardComponent({ initialCategory = 'random', userScore = null, userRank = null, onClose = null }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [category, setCategory] = useState(initialCategory);
  const [totalCount, setTotalCount] = useState(0);

  // Load scores when component mounts or category changes
  useEffect(() => {
    fetchScores();
  }, [category, page, rowsPerPage]);

  // Fetch scores from API
  const fetchScores = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/trivia/leaderboard?category=${category}&page=${page}&limit=${rowsPerPage}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();

      setScores(data.scores);
      setTotalCount(data.pagination.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle category change
  const handleCategoryChange = (event, newValue) => {
    setCategory(newValue);
    setPage(0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Render table with scores
  const renderScoresTable = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" sx={{ textAlign: 'center', my: 3 }}>
          {error}
        </Typography>
      );
    }

    if (scores.length === 0) {
      return (
        <Typography sx={{ textAlign: 'center', my: 3 }}>
          No scores available for this category yet. Be the first to submit a score!
        </Typography>
      );
    }

    return (
      <>
        <TableContainer>
          <Table size="small" aria-label="trivia leaderboard">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Score</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Questions</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.map((score, index) => {
                const isUserScore = userScore && score._id === userScore._id;
                const rankNumber = page * rowsPerPage + index + 1;

                return (
                  <TableRow
                    key={score._id}
                    sx={{
                      '&:nth-of-type(odd)': { bgcolor: 'background.paper' },
                      ...(isUserScore && { bgcolor: 'primary.light', fontWeight: 'bold' }),
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {rankNumber === 1 ? '🥇' : rankNumber === 2 ? '🥈' : rankNumber === 3 ? '🥉' : rankNumber}
                    </TableCell>
                    <TableCell>{score.displayName}</TableCell>
                    <TableCell align="right">{score.score}</TableCell>
                    <TableCell align="right">{score.totalQuestions}</TableCell>
                    <TableCell align="right">{formatDate(score.date)}</TableCell>
                  </TableRow>
                );
              })}

              {/* Show user score separately if not in the current page */}
              {userScore && userRank && (userRank > page * rowsPerPage + scores.length || userRank <= page * rowsPerPage) && (
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell component="th" scope="row">
                    {userRank}
                  </TableCell>
                  <TableCell>{userScore.displayName} (You)</TableCell>
                  <TableCell align="right">{userScore.score}</TableCell>
                  <TableCell align="right">{userScore.totalQuestions}</TableCell>
                  <TableCell align="right">{formatDate(userScore.date)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: 'auto', my: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">
          AA Literature Trivia Leaderboard
        </Typography>

        {userScore && userRank && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Chip
              label={`Your Rank: #${userRank} with a score of ${userScore.score}/${userScore.totalQuestions}`}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '1rem', py: 1 }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={category}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="trivia categories"
        >
          <Tab label="All Categories" value="all" />
          {triviaCategories.map(cat => (
            <Tab key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Tabs>
      </Box>

      {renderScoresTable()}
    </Paper>
  );
}