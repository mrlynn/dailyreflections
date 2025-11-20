'use client';

import { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Tooltip,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import LocationOnIcon from '@mui/icons-material/LocationOn';

/**
 * Meetings Admin Page
 * List, add, edit, delete AA meetings
 */
export default function MeetingsAdminPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  // Days of the week for display
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch meetings on initial load
  useEffect(() => {
    async function fetchMeetings() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/meetings');

        if (!response.ok) {
          throw new Error('Failed to fetch meetings');
        }

        const data = await response.json();
        setMeetings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Error loading meetings. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchMeetings();
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

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (meeting) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!meetingToDelete) return;

    try {
      const response = await fetch(`/api/admin/meetings/${meetingToDelete.slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting');
      }

      // Remove the meeting from the state
      setMeetings(meetings.filter(m => m.slug !== meetingToDelete.slug));
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError('Error deleting meeting. Please try again later.');
      setDeleteDialogOpen(false);
    }
  };

  // Filter meetings based on search query
  const filteredMeetings = meetings.filter(meeting => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      meeting.name.toLowerCase().includes(query) ||
      meeting.location?.toLowerCase().includes(query) ||
      meeting.city?.toLowerCase().includes(query) ||
      meeting.group?.toLowerCase().includes(query)
    );
  });

  // Get meetings for current page
  const displayedMeetings = filteredMeetings
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Render meeting types
  const renderMeetingTypes = (types) => {
    if (!types || types.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {types.map(type => (
          <Chip
            key={type}
            label={type}
            size="small"
            sx={{ height: '20px', fontSize: '0.7rem' }}
          />
        ))}
      </Box>
    );
  };

  // Format day for display (handle both single day and array of days)
  const formatDays = (day) => {
    if (Array.isArray(day)) {
      return day.map(d => daysOfWeek[d]).join(', ');
    }
    return daysOfWeek[day];
  };

  // Determine if meeting is in-person, online, or both
  const getMeetingFormat = (meeting) => {
    const isOnline = meeting.conference_url || meeting.conference_phone;
    const isInPerson = meeting.address && !meeting.formatted_address?.includes('Online');

    if (isOnline && isInPerson) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationOnIcon fontSize="small" color="success" />
          <OnlinePredictionIcon fontSize="small" color="primary" />
          <Typography variant="body2">Hybrid</Typography>
        </Box>
      );
    } else if (isOnline) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <OnlinePredictionIcon fontSize="small" color="primary" />
          <Typography variant="body2">Online</Typography>
        </Box>
      );
    } else if (isInPerson) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationOnIcon fontSize="small" color="success" />
          <Typography variant="body2">In-Person</Typography>
        </Box>
      );
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
        Meetings Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/meetings/create')}
            >
              Add Meeting
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Day & Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Format</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Types</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedMeetings.length > 0 ? (
                displayedMeetings.map((meeting) => (
                  <TableRow key={meeting._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {meeting.name}
                      </Typography>
                      {meeting.group && (
                        <Typography variant="caption" color="textSecondary">
                          {meeting.group}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDays(meeting.day)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {meeting.time}{meeting.end_time ? ` - ${meeting.end_time}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {meeting.location || (meeting.address ? 'In-person' : 'Online')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {meeting.city}{meeting.state ? `, ${meeting.state}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{getMeetingFormat(meeting)}</TableCell>
                    <TableCell>{renderMeetingTypes(meeting.types)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={meeting.active !== false ? "success" : "error"}
                        label={meeting.active !== false ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => window.open(`/meetings/${meeting.slug}`, '_blank')}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/admin/meetings/edit/${meeting.slug}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(meeting)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchQuery
                      ? 'No meetings found matching your search.'
                      : 'No meetings found. Add your first meeting!'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredMeetings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the meeting "{meetingToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}