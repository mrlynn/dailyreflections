'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Alert,
  InputAdornment,
  Select,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';

export default function AmendsList({ entries = [], onEntryUpdated, onEntryDeleted }) {
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState(null);

  // Handle panel expansion
  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  // Start editing an entry
  const handleStartEdit = (entry) => {
    setEditingEntry(entry._id);
    setEditFormData({
      person: entry.person,
      harmDone: entry.harmDone,
      willingnessStatus: entry.willingnessStatus,
      priority: entry.priority,
      notes: entry.notes || '',
      planForAmends: entry.planForAmends || '',
      potentialConsequences: entry.potentialConsequences || ''
    });
    setEditError(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditFormData({});
    setEditError(null);
  };

  // Save edited entry
  const handleSaveEdit = async () => {
    try {
      if (!editFormData.person || !editFormData.harmDone) {
        setEditError('Person name and harm done are required.');
        return;
      }

      const response = await fetch(`/api/step8/entries/${editingEntry}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update entry');
      }

      setEditingEntry(null);
      setEditFormData({});
      setEditError(null);

      if (onEntryUpdated) {
        onEntryUpdated();
      }
    } catch (err) {
      console.error('Error updating entry:', err);
      setEditError(err.message || 'Failed to update entry');
    }
  };

  // Handle form data changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open delete confirmation
  const handleOpenDeleteDialog = (entryId) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  // Delete entry
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/step8/entries/${entryToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      setDeleteDialogOpen(false);
      setEntryToDelete(null);

      if (onEntryDeleted) {
        onEntryDeleted();
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      // Show error message if needed
    }
  };

  // Get color for willingness status
  const getWillingnessColor = (status) => {
    switch (status) {
      case 'not_willing':
        return 'error';
      case 'hesitant':
        return 'warning';
      case 'willing':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get label for willingness status
  const getWillingnessLabel = (status) => {
    switch (status) {
      case 'not_willing':
        return 'Not Willing';
      case 'hesitant':
        return 'Hesitant';
      case 'willing':
        return 'Willing';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Get color for priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Filter entries based on search term and filters
  const filteredEntries = entries.filter(entry => {
    // Filter by search term
    const searchMatch =
      entry.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.harmDone.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by willingness status
    const statusMatch = filterStatus === 'all' || entry.willingnessStatus === filterStatus;

    // Filter by priority
    const priorityMatch = filterPriority === 'all' || entry.priority === filterPriority;

    return searchMatch && statusMatch && priorityMatch;
  });

  // Sort entries by priority (high to low)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your 8th Step Amends List
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Review and manage your list of persons you have harmed and need to make amends to.
      </Typography>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Search"
              variant="outlined"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} md={4}>
            <FormControl fullWidth size="small">
              <FormLabel sx={{ mb: 1, fontSize: '0.75rem' }}>Filter by Status:</FormLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
                size="small"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="not_willing">Not Willing</MenuItem>
                <MenuItem value="hesitant">Hesitant</MenuItem>
                <MenuItem value="willing">Willing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={4}>
            <FormControl fullWidth size="small">
              <FormLabel sx={{ mb: 1, fontSize: '0.75rem' }}>Filter by Priority:</FormLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                displayEmpty
                size="small"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Entry List */}
      {sortedEntries.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No entries found. Add people to your amends list to get started.
        </Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          {sortedEntries.map((entry) => (
            <Accordion
              key={entry._id}
              expanded={expandedPanel === entry._id}
              onChange={handlePanelChange(entry._id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography sx={{ flexGrow: 1 }}>
                    {entry.person}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      size="small"
                      label={entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
                      color={getPriorityColor(entry.priority)}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={getWillingnessLabel(entry.willingnessStatus)}
                      color={getWillingnessColor(entry.willingnessStatus)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ my: 1 }} />

                {editingEntry === entry._id ? (
                  /* Edit Form */
                  <Box sx={{ mt: 2 }}>
                    {editError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {editError}
                      </Alert>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Person Name *"
                          name="person"
                          value={editFormData.person || ''}
                          onChange={handleEditFormChange}
                          fullWidth
                          required
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Harm Done *"
                          name="harmDone"
                          value={editFormData.harmDone || ''}
                          onChange={handleEditFormChange}
                          fullWidth
                          required
                          multiline
                          rows={3}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend">Willingness Status</FormLabel>
                          <RadioGroup
                            name="willingnessStatus"
                            value={editFormData.willingnessStatus || 'not_willing'}
                            onChange={handleEditFormChange}
                          >
                            <FormControlLabel value="not_willing" control={<Radio size="small" />} label="Not Willing Yet" />
                            <FormControlLabel value="hesitant" control={<Radio size="small" />} label="Hesitant" />
                            <FormControlLabel value="willing" control={<Radio size="small" />} label="Willing" />
                            <FormControlLabel value="completed" control={<Radio size="small" />} label="Completed" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <FormLabel component="legend">Priority</FormLabel>
                          <Select
                            name="priority"
                            value={editFormData.priority || 'medium'}
                            onChange={handleEditFormChange}
                            size="small"
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>

                        <Box sx={{ mt: 2 }}>
                          <TextField
                            label="Plan for Amends"
                            name="planForAmends"
                            value={editFormData.planForAmends || ''}
                            onChange={handleEditFormChange}
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Potential Consequences"
                          name="potentialConsequences"
                          value={editFormData.potentialConsequences || ''}
                          onChange={handleEditFormChange}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Additional Notes"
                          name="notes"
                          value={editFormData.notes || ''}
                          onChange={handleEditFormChange}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                        sx={{ mr: 1 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  /* View Mode */
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Harm Done:
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ pl: 2 }}>
                      {entry.harmDone}
                    </Typography>

                    <Grid container spacing={2}>
                      {entry.planForAmends && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Plan for Amends:</Typography>
                          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                            {entry.planForAmends}
                          </Typography>
                        </Grid>
                      )}

                      {entry.potentialConsequences && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Potential Consequences:</Typography>
                          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                            {entry.potentialConsequences}
                          </Typography>
                        </Grid>
                      )}

                      {entry.notes && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Additional Notes:</Typography>
                          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                            {entry.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <IconButton
                        onClick={() => handleStartEdit(entry)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpenDeleteDialog(entry._id)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this entry from your amends list?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}