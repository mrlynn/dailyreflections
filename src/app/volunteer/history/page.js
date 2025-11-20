'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VolunteerPageHeader from '@/components/Volunteer/VolunteerPageHeader';

/**
 * History page for volunteers to view their past sessions
 */
export default function VolunteerHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    avgSessionDuration: 0,
    positiveRating: 0,
    flaggedSessionsCount: 0
  });

  // Fetch volunteer session history
  const fetchSessionHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch volunteer stats
      const statsResponse = await fetch('/api/volunteers/stats');
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch volunteer stats');
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch completed sessions
      const sessionsResponse = await fetch('/api/volunteers/chat/sessions?type=ended');
      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch completed sessions');
      }
      const sessionsData = await sessionsResponse.json();
      setCompletedSessions(sessionsData.sessions || []);
    } catch (err) {
      console.error('Error fetching session history:', err);
      setError(err.message || 'Failed to fetch session history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter sessions by search term and date
  const filteredSessions = completedSessions.filter(session => {
    const matchesSearch = searchTerm === '' ||
      (session._id && session._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.topic && session.topic.toLowerCase().includes(searchTerm.toLowerCase()));

    if (dateFilter === 'all') return matchesSearch;

    const sessionDate = new Date(session.start_time);
    const now = new Date();

    if (dateFilter === 'today') {
      return matchesSearch &&
        sessionDate.getDate() === now.getDate() &&
        sessionDate.getMonth() === now.getMonth() &&
        sessionDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return matchesSearch && sessionDate >= oneWeekAgo;
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return matchesSearch && sessionDate >= oneMonthAgo;
    }

    return matchesSearch;
  });

  // Calculate session duration in minutes
  const getSessionDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    if (durationMinutes < 1) return '< 1 min';
    if (durationMinutes < 60) return `${durationMinutes} min`;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // View session details
  const handleViewSession = (sessionId) => {
    router.push(`/volunteer/history/${sessionId}`);
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
        title="Session History"
        action={
          <Button
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            onClick={fetchSessionHistory}
            size="small"
          >
            Refresh
          </Button>
        }
      />

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Sessions */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <ChatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">{stats.totalSessions}</Typography>
            <Typography variant="body2" color="text.secondary">Total Sessions</Typography>
          </Paper>
        </Grid>

        {/* Average Duration */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <AccessTimeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">{stats.avgSessionDuration} min</Typography>
            <Typography variant="body2" color="text.secondary">Avg Session Time</Typography>
          </Paper>
        </Grid>

        {/* Positive Rating */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <CircularProgress
                variant="determinate"
                value={stats.positiveRating}
                size={48}
                thickness={4}
                sx={{ color: 'success.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(stats.positiveRating)}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="h5">{stats.positiveRating}%</Typography>
            <Typography variant="body2" color="text.secondary">Positive Feedback</Typography>
          </Paper>
        </Grid>

        {/* Flagged Sessions */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <ThumbDownIcon sx={{ fontSize: 48, color: stats.flaggedSessionsCount > 0 ? 'error.main' : 'text.disabled', mb: 1 }} />
            <Typography variant="h5">{stats.flaggedSessionsCount}</Typography>
            <Typography variant="body2" color="text.secondary">Flagged Sessions</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by ID or topic"
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
              <InputLabel id="date-filter-label">Time Period</InputLabel>
              <Select
                labelId="date-filter-label"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Time Period"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Past Week</MenuItem>
                <MenuItem value="month">Past Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={fetchSessionHistory}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Sessions table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="sessions history table">
          <TableHead>
            <TableRow>
              <TableCell>Session ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Messages</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Feedback</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No completed sessions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((session) => (
                  <TableRow
                    key={session._id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {session._id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{formatDate(session.start_time)}</TableCell>
                    <TableCell>{getSessionDuration(session.start_time, session.end_time)}</TableCell>
                    <TableCell>{session.messages_count || 0}</TableCell>
                    <TableCell>{session.topic || 'General'}</TableCell>
                    <TableCell>
                      {session.feedback ? (
                        <Chip
                          icon={session.feedback.rating === 'positive' ? <ThumbUpIcon /> : <ThumbDownIcon />}
                          label={session.feedback.rating}
                          color={session.feedback.rating === 'positive' ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No feedback
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleViewSession(session._id)}
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
          count={filteredSessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}