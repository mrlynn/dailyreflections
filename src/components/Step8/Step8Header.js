'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArchiveIcon from '@mui/icons-material/Archive';

export default function Step8Header({ inventory, loading, onStatusChange }) {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'archived':
        return 'default';
      default:
        return 'primary';
    }
  };

  return (
    <>
      {!loading && inventory && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
          <Chip
            label={`Status: ${inventory.status === 'in_progress' ? 'In Progress' :
                   inventory.status === 'completed' ? 'Completed' : 'Archived'}`}
            color={getStatusColor(inventory.status)}
            variant="outlined"
          />

          <Chip
            label={`Started: ${formatDate(inventory.startedAt)}`}
            variant="outlined"
          />

          {inventory.completedAt && (
            <Chip
              label={`Completed: ${formatDate(inventory.completedAt)}`}
              variant="outlined"
              color="success"
              icon={<CheckCircleIcon />}
            />
          )}

          <Box sx={{ ml: 'auto' }}>
            {inventory.status === 'in_progress' && (
              <Button
                variant="contained"
                color="success"
                onClick={() => setCompleteDialogOpen(true)}
                sx={{ ml: 1 }}
              >
                Mark Complete
              </Button>
            )}

            {inventory.status === 'completed' && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setArchiveDialogOpen(true)}
                sx={{ ml: 1 }}
              >
                Archive
              </Button>
            )}

            {inventory.status === 'archived' && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => onStatusChange('in_progress')}
                sx={{ ml: 1 }}
              >
                Restore
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Complete Confirmation Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
      >
        <DialogTitle>Complete 8th Step List?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this 8th Step amends list as complete?
            You can still make changes after marking it as complete.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onStatusChange('completed');
              setCompleteDialogOpen(false);
            }}
            variant="contained"
            color="success"
          >
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
      >
        <DialogTitle>Archive 8th Step List?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to archive this 8th Step amends list?
            You can restore it later if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onStatusChange('archived');
              setArchiveDialogOpen(false);
            }}
            variant="outlined"
            color="warning"
          >
            Archive List
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}