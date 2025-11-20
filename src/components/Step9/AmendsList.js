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
  Grid,
  Stack,
  FormHelperText,
  Switch
} from '@mui/material';
import StepConnectionInfo from './StepConnectionInfo';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { format, parseISO } from 'date-fns';

export default function AmendsList({ entries = [], onEntryUpdated, onEntryDeleted, onSyncBack }) {
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
      amendStatus: entry.amendStatus,
      priority: entry.priority,
      planForAmends: entry.planForAmends || '',
      plannedDate: entry.plannedDate || null,
      amendsMethod: entry.amendsMethod || '',
      amendsDescription: entry.amendsDescription || '',
      outcome: entry.outcome || '',
      followUpNeeded: entry.followUpNeeded || false,
      followUpNotes: entry.followUpNotes || '',
      notes: entry.notes || ''
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

      const response = await fetch(`/api/step9/entries/${editingEntry}`, {
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

  // Handle switch changes
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle date changes
  const handleDateChange = (date) => {
    setEditFormData(prev => ({
      ...prev,
      plannedDate: date
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
      const response = await fetch(`/api/step9/entries/${entryToDelete}`, {
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

  // Get color for amendment status
  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return 'error';
      case 'planned':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'deferred':
        return 'default';
      case 'not_possible':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get label for amendment status
  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'planned':
        return 'Planned';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'deferred':
        return 'Deferred';
      case 'not_possible':
        return 'Not Possible';
      default:
        return status;
    }
  };

  // Get icon for amendment status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'not_started':
        return <ErrorOutlineIcon fontSize="small" />;
      case 'planned':
        return <AccessTimeIcon fontSize="small" />;
      case 'in_progress':
        return <HourglassEmptyIcon fontSize="small" />;
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'deferred':
        return <PauseCircleOutlineIcon fontSize="small" />;
      case 'not_possible':
        return <ErrorOutlineIcon fontSize="small" />;
      default:
        return null;
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'PP');
    } catch (error) {
      return null;
    }
  };

  // Filter entries based on search term and filters
  const filteredEntries = entries.filter(entry => {
    // Filter by search term
    const searchMatch =
      entry.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.harmDone.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by amendment status
    const statusMatch = filterStatus === 'all' || entry.amendStatus === filterStatus;

    // Filter by priority
    const priorityMatch = filterPriority === 'all' || entry.priority === filterPriority;

    return searchMatch && statusMatch && priorityMatch;
  });

  // Sort entries by priority (high to low) and then by status
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    // First sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then sort by status
    const statusOrder = {
      not_started: 5,
      planned: 4,
      in_progress: 3,
      deferred: 2,
      not_possible: 1,
      completed: 0
    };
    return statusOrder[b.amendStatus] - statusOrder[a.amendStatus];
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Your 9th Step Amends List
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Review and manage your list of direct amends to make to those you've harmed.
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
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="deferred">Deferred</MenuItem>
                  <MenuItem value="not_possible">Not Possible</MenuItem>
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
                      {entry.stepEightEntryId && (
                        <StepConnectionInfo
                          stepEightEntryId={entry.stepEightEntryId}
                          showBadgeOnly={true}
                        />
                      )}
                      <Chip
                        size="small"
                        label={entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
                        color={getPriorityColor(entry.priority)}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        icon={getStatusIcon(entry.amendStatus)}
                        label={getStatusLabel(entry.amendStatus)}
                        color={getStatusColor(entry.amendStatus)}
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
                          <TextField
                            select
                            name="amendStatus"
                            label="Amends Status"
                            value={editFormData.amendStatus || 'not_started'}
                            onChange={handleEditFormChange}
                            fullWidth
                            size="small"
                          >
                            <MenuItem value="not_started">Not Started</MenuItem>
                            <MenuItem value="planned">Planned</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="deferred">Deferred</MenuItem>
                            <MenuItem value="not_possible">Not Possible</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            name="priority"
                            label="Priority"
                            value={editFormData.priority || 'medium'}
                            onChange={handleEditFormChange}
                            fullWidth
                            size="small"
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12}>
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
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <DatePicker
                            label="Planned Date"
                            value={editFormData.plannedDate}
                            onChange={handleDateChange}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: "small"
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            name="amendsMethod"
                            label="Amends Method"
                            value={editFormData.amendsMethod || ''}
                            onChange={handleEditFormChange}
                            fullWidth
                            size="small"
                          >
                            <MenuItem value="">Select a method</MenuItem>
                            <MenuItem value="in_person">In Person</MenuItem>
                            <MenuItem value="phone">Phone Call</MenuItem>
                            <MenuItem value="letter">Letter</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="indirect">Indirect Amends</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </TextField>
                        </Grid>

                        {(editFormData.amendStatus === 'in_progress' || editFormData.amendStatus === 'completed') && (
                          <>
                            <Grid item xs={12}>
                              <TextField
                                label="Amends Description"
                                name="amendsDescription"
                                value={editFormData.amendsDescription || ''}
                                onChange={handleEditFormChange}
                                fullWidth
                                multiline
                                rows={2}
                                size="small"
                              />
                            </Grid>

                            {editFormData.amendStatus === 'completed' && (
                              <>
                                <Grid item xs={12}>
                                  <TextField
                                    label="Outcome"
                                    name="outcome"
                                    value={editFormData.outcome || ''}
                                    onChange={handleEditFormChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                  />
                                </Grid>

                                <Grid item xs={12}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={editFormData.followUpNeeded || false}
                                        onChange={handleSwitchChange}
                                        name="followUpNeeded"
                                      />
                                    }
                                    label="Follow-up needed?"
                                  />
                                </Grid>

                                {editFormData.followUpNeeded && (
                                  <Grid item xs={12}>
                                    <TextField
                                      label="Follow-up Notes"
                                      name="followUpNotes"
                                      value={editFormData.followUpNotes || ''}
                                      onChange={handleEditFormChange}
                                      fullWidth
                                      multiline
                                      rows={2}
                                      size="small"
                                    />
                                  </Grid>
                                )}
                              </>
                            )}
                          </>
                        )}

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

                        {entry.plannedDate && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2">Planned Date:</Typography>
                            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                              {formatDate(entry.plannedDate)}
                            </Typography>
                          </Grid>
                        )}

                        {entry.amendsMethod && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2">Amends Method:</Typography>
                            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                              {entry.amendsMethod === 'in_person'
                                ? 'In Person'
                                : entry.amendsMethod === 'phone'
                                ? 'Phone Call'
                                : entry.amendsMethod === 'letter'
                                ? 'Letter'
                                : entry.amendsMethod === 'email'
                                ? 'Email'
                                : entry.amendsMethod === 'indirect'
                                ? 'Indirect Amends'
                                : entry.amendsMethod === 'other'
                                ? 'Other'
                                : entry.amendsMethod}
                            </Typography>
                          </Grid>
                        )}

                        {entry.amendsDescription && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">Amends Description:</Typography>
                            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                              {entry.amendsDescription}
                            </Typography>
                          </Grid>
                        )}

                        {entry.outcome && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">Outcome:</Typography>
                            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                              {entry.outcome}
                            </Typography>
                          </Grid>
                        )}

                        {entry.followUpNeeded && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">
                              Follow-up Needed:
                              <Chip size="small" label="Yes" color="warning" sx={{ ml: 1 }} />
                            </Typography>
                            {entry.followUpNotes && (
                              <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                                {entry.followUpNotes}
                              </Typography>
                            )}
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

                      {/* Show Step 8 connection info if linked */}
                      {entry.stepEightEntryId && (
                        <StepConnectionInfo
                          stepEightEntryId={entry.stepEightEntryId}
                          step9EntryId={entry._id}
                          onSyncBack={onSyncBack}
                          amendStatus={entry.amendStatus}
                        />
                      )}

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
    </LocalizationProvider>
  );
}