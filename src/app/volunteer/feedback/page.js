'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VolunteerPageHeader from '@/components/Volunteer/VolunteerPageHeader';
import { FeedbackAnalytics, FeedbackMetrics } from '@/components/Volunteer/Dashboard';
import { useRouter } from 'next/navigation';

export default function FeedbackAnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  // Fetch feedback data
  const fetchFeedbackData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/volunteers/feedback');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback data');
      }

      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err.message || 'Failed to fetch feedback data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter feedback by search term and rating
  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = searchTerm === '' ||
      (item.comments && item.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item._id && item._id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // View session details
  const handleViewSession = (sessionId) => {
    router.push(`/volunteer/history/${sessionId}`);
  };

  // Get icon for rating
  const getRatingIcon = (rating) => {
    switch(rating) {
      case 'positive':
        return <ThumbUpIcon fontSize="small" color="success" />;
      case 'neutral':
        return <InfoIcon fontSize="small" color="warning" />;
      case 'flagged':
        return <ThumbDownIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="action" />;
    }
  };

  // Get color for rating
  const getRatingColor = (rating) => {
    switch(rating) {
      case 'positive':
        return 'success';
      case 'neutral':
        return 'warning';
      case 'flagged':
        return 'error';
      default:
        return 'default';
    }
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <VolunteerPageHeader
        title="Feedback Analytics"
        subtitle="Analyze and understand user feedback to improve your volunteer experience"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchFeedbackData}
            size="small"
          >
            Refresh
          </Button>
        }
      />

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analytics tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Summary" />
          <Tab label="Metrics" />
          <Tab label="All Feedback" />
        </Tabs>

        <Box p={3} hidden={tabValue !== 0}>
          {tabValue === 0 && <FeedbackAnalytics />}
        </Box>

        <Box p={3} hidden={tabValue !== 1}>
          {tabValue === 1 && <FeedbackMetrics />}
        </Box>

        <Box p={3} hidden={tabValue !== 2}>
          {tabValue === 2 && (
            <Box>
              {/* Filters */}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search in comments"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="rating-filter-label">Rating</InputLabel>
                    <Select
                      labelId="rating-filter-label"
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      label="Rating"
                    >
                      <MenuItem value="all">All Ratings</MenuItem>
                      <MenuItem value="positive">Positive</MenuItem>
                      <MenuItem value="neutral">Neutral</MenuItem>
                      <MenuItem value="flagged">Flagged</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchFeedbackData}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>

              {/* Feedback table */}
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="feedback table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Session ID</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Comments</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFeedback.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body1" sx={{ py: 2 }}>
                            No feedback found matching your criteria
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFeedback
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((item) => (
                          <TableRow
                            key={item._id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell>{formatDate(item.created_at)}</TableCell>
                            <TableCell>{item.session_id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <Chip
                                icon={getRatingIcon(item.rating)}
                                label={item.rating.charAt(0).toUpperCase() + item.rating.slice(1)}
                                color={getRatingColor(item.rating)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {item.comments ? (
                                <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.comments}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  No comments provided
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={() => handleViewSession(item.session_id)}
                                color="primary"
                                size="small"
                                title="View Session Details"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredFeedback.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Summary cards */}
      <Typography variant="h6" gutterBottom>Key Insights</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Response Time Impact
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                Responding to messages within 2 minutes results in 95% positive feedback, compared to only 40% positive feedback when response time exceeds 10 minutes.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Session Duration
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                Sessions lasting between 15-30 minutes receive the highest satisfaction ratings. Very short (under 5 minutes) or very long (over 45 minutes) sessions tend to receive lower ratings.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}