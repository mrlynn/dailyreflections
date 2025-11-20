'use client';

import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Typography,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import VideocamIcon from '@mui/icons-material/Videocam';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';

/**
 * MeetingHistoryList Component
 * Displays list of past meetings with details
 */
export default function MeetingHistoryList({ meetings = [], onDelete, onEdit }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  // Get icon based on meeting type
  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'in-person':
        return <MeetingRoomIcon />;
      case 'online':
        return <VideocamIcon />;
      case 'phone':
        return <PhoneIcon />;
      default:
        return <EventIcon />;
    }
  };

  // Format meeting date
  const formatMeetingDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE, MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (meeting) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  };

  // Handle deletion after confirmation
  const handleDelete = () => {
    if (onDelete && meetingToDelete?._id) {
      onDelete(meetingToDelete._id);
    }
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  // Handle edit meeting
  const handleEdit = (meeting) => {
    if (onEdit && typeof onEdit === 'function') {
      onEdit(meeting);
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  return (
    <>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        {meetings.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No meetings logged yet"
              secondary="Start logging your meetings to track your progress"
            />
          </ListItem>
        ) : (
          meetings.map((meeting, index) => (
            <Box key={meeting._id || index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getMeetingTypeIcon(meeting.type)}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography variant="body1" component="span">
                      {formatMeetingDate(meeting.date)}
                      {meeting.partOf90in90 && (
                        <Chip
                          label="90 in 90"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {meeting.name || `${meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)} Meeting`}
                      </Typography>
                      {meeting.format && (
                        <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                          Format: {meeting.format.charAt(0).toUpperCase() + meeting.format.slice(1)}
                        </Typography>
                      )}
                      {meeting.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {meeting.notes}
                        </Typography>
                      )}
                    </>
                  }
                />

                {(onDelete || onEdit) && (
                  <ListItemSecondaryAction>
                    {onEdit && (
                      <IconButton edge="end" onClick={() => handleEdit(meeting)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton edge="end" onClick={() => confirmDelete(meeting)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < meetings.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))
        )}
      </List>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Delete Meeting Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this meeting record from {meetingToDelete ? formatMeetingDate(meetingToDelete.date) : ''}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}