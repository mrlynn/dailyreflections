'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormControlLabel,
  Switch,
  Chip,
  TablePagination,
  Backdrop,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Stack,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import { formatDateKey } from '@/utils/dateUtils';

// Generate months array
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

// Generate days array (1-31)
const days = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Admin page for managing daily thoughts
 */
export default function DailyThoughtsAdmin() {
  // State for thoughts list
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentThought, setCurrentThought] = useState({
    title: '',
    thought: '',
    challenge: '',
    month: 1,
    day: 1,
    active: true,
  });

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [thoughtToDelete, setThoughtToDelete] = useState(null);

  // Snackbar notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Filter by month state
  const [monthFilter, setMonthFilter] = useState('');

  // Function to fetch all thoughts with pagination
  const fetchThoughts = useCallback(async () => {
    try {
      setLoading(true);

      let url = `/api/thoughts/list?page=${page + 1}&limit=${rowsPerPage}`;
      if (monthFilter) {
        url += `&month=${monthFilter}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch thoughts: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setThoughts(result.data.thoughts);
        setTotalCount(result.data.pagination.total);
      } else {
        throw new Error(result.error || 'Failed to fetch thoughts');
      }
    } catch (err) {
      console.error('Error fetching thoughts:', err);
      setError('Failed to load daily thoughts. Please try again.');
      setSnackbar({
        open: true,
        message: 'Error loading thoughts',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, monthFilter]);

  // Initial fetch
  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open dialog for adding a new thought
  const handleAddThought = () => {
    setCurrentThought({
      title: '',
      thought: '',
      challenge: '',
      month: new Date().getMonth() + 1, // Current month
      day: new Date().getDate(), // Current day
      active: true,
    });
    setDialogMode('add');
    setDialogOpen(true);
  };

  // Open dialog for editing a thought
  const handleEditThought = (thought) => {
    setCurrentThought({
      ...thought,
      month: thought.month || 1,
      day: thought.day || 1,
    });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // Open dialog for deleting a thought
  const handleDeleteConfirm = (thought) => {
    setThoughtToDelete(thought);
    setDeleteDialogOpen(true);
  };

  // Handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentThought((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox change for active state
  const handleActiveChange = (e) => {
    setCurrentThought((prev) => ({
      ...prev,
      active: e.target.checked,
    }));
  };

  // Save thought (create or update)
  const handleSaveThought = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!currentThought.title || !currentThought.thought || !currentThought.month || !currentThought.day) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/thoughts/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentThought),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save thought: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Thought ${dialogMode === 'add' ? 'created' : 'updated'} successfully`,
          severity: 'success',
        });
        setDialogOpen(false);
        fetchThoughts(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to save thought');
      }
    } catch (err) {
      console.error('Error saving thought:', err);
      setSnackbar({
        open: true,
        message: `Error ${dialogMode === 'add' ? 'creating' : 'updating'} thought: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete thought
  const handleDeleteThought = async () => {
    if (!thoughtToDelete) return;

    try {
      setLoading(true);

      const response = await fetch('/api/thoughts/admin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: thoughtToDelete._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete thought: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Thought deleted successfully',
          severity: 'success',
        });
        setDeleteDialogOpen(false);
        fetchThoughts(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete thought');
      }
    } catch (err) {
      console.error('Error deleting thought:', err);
      setSnackbar({
        open: true,
        message: `Error deleting thought: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setThoughtToDelete(null);
    }
  };

  // Handle closing the dialogs
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setThoughtToDelete(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <>
      <Box sx={{ width: '100%', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Daily Thoughts Management
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Create, edit, and manage daily recovery thoughts that appear in the popup modal.
        </Typography>

        {/* Actions bar */}
        <Box sx={{ display: 'flex', mb: 3, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddThought}
            >
              Add New Thought
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchThoughts}
            >
              Refresh
            </Button>
          </Box>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="month-filter-label">Filter by Month</InputLabel>
            <Select
              labelId="month-filter-label"
              id="month-filter"
              value={monthFilter}
              label="Filter by Month"
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <MenuItem value="">All Months</MenuItem>
              {months.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Thoughts table */}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="daily thoughts table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Thought</TableCell>
                <TableCell>Challenge</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {thoughts.length > 0 ? (
                thoughts.map((thought) => (
                  <TableRow key={thought._id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {thought.month && thought.day && (
                          <Typography variant="body2">
                            {formatDateKey(`${String(thought.month).padStart(2, '0')}-${String(thought.day).padStart(2, '0')}`)}
                          </Typography>
                        )}
                        {thought.relatedReflectionDateKey && (
                          <Tooltip title="Links to reflection">
                            <LinkIcon fontSize="small" color="action" />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{thought.title}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {thought.thought}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {thought.challenge || '(None)'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={thought.active ? 'Active' : 'Inactive'}
                        color={thought.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditThought(thought)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteConfirm(thought)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {loading ? 'Loading thoughts...' : 'No thoughts found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Daily Thought' : 'Edit Daily Thought'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            {/* Date selection */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="month-label">Month *</InputLabel>
                <Select
                  labelId="month-label"
                  name="month"
                  value={currentThought.month}
                  label="Month *"
                  onChange={handleInputChange}
                  required
                >
                  {months.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel id="day-label">Day *</InputLabel>
                <Select
                  labelId="day-label"
                  name="day"
                  value={currentThought.day}
                  label="Day *"
                  onChange={handleInputChange}
                  required
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              label="Title"
              name="title"
              value={currentThought.title}
              onChange={handleInputChange}
              helperText="A concise, catchy title (3-6 words)"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Thought"
              name="thought"
              value={currentThought.thought}
              onChange={handleInputChange}
              multiline
              rows={3}
              helperText="The main insight or thought (2-3 sentences)"
            />

            <TextField
              margin="normal"
              fullWidth
              label="Challenge"
              name="challenge"
              value={currentThought.challenge || ''}
              onChange={handleInputChange}
              multiline
              rows={2}
              helperText="A brief, practical challenge related to the thought (optional)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={currentThought.active}
                  onChange={handleActiveChange}
                  name="active"
                  color="primary"
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveThought} variant="contained">
            {dialogMode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the thought "{thoughtToDelete?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteThought} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && !dialogOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}