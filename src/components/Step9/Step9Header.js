'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Menu,
  Skeleton,
  Grid
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import ArchiveIcon from '@mui/icons-material/Archive';
import { format, parseISO } from 'date-fns';

export default function Step9Header({ inventory, loading, onStatusChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Handle opening status menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing status menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle selecting a status
  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    handleClose();
    setDialogOpen(true);
  };

  // Handle confirming status change
  const handleConfirmStatusChange = () => {
    if (selectedStatus && onStatusChange) {
      onStatusChange(selectedStatus);
    }
    setDialogOpen(false);
  };

  // Function to get status display text
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'in_progress':
        return { text: 'In Progress', color: 'primary', icon: <WorkIcon fontSize="small" /> };
      case 'completed':
        return { text: 'Completed', color: 'success', icon: <CheckCircleIcon fontSize="small" /> };
      case 'archived':
        return { text: 'Archived', color: 'default', icon: <ArchiveIcon fontSize="small" /> };
      default:
        return { text: 'Unknown Status', color: 'default', icon: null };
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={30} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="rounded" width={120} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
        </Box>
      </Box>
    );
  }

  // If no inventory
  if (!inventory) {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary">
          Create your 9th Step inventory to track your progress in making amends.
        </Typography>
      </Box>
    );
  }

  // Get status display info
  const statusInfo = getStatusDisplay(inventory.status);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Chip
          label={statusInfo.text}
          color={statusInfo.color}
          icon={statusInfo.icon}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={4}>
          <Typography variant="body2" color="text.secondary">
            Started:
          </Typography>
          <Typography variant="body1">
            {formatDate(inventory.startedAt)}
          </Typography>
        </Grid>

        {inventory.status === 'completed' && (
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Completed:
            </Typography>
            <Typography variant="body1">
              {formatDate(inventory.completedAt)}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12} sm={4}>
          <Typography variant="body2" color="text.secondary">
            Last Updated:
          </Typography>
          <Typography variant="body1">
            {formatDate(inventory.updatedAt)}
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="primary"
          endIcon={<ArrowDropDownIcon />}
          onClick={handleClick}
        >
          Change Status
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleStatusSelect('in_progress')} disabled={inventory.status === 'in_progress'}>
            <WorkIcon fontSize="small" sx={{ mr: 1 }} />
            Mark as In Progress
          </MenuItem>
          <MenuItem onClick={() => handleStatusSelect('completed')} disabled={inventory.status === 'completed'}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            Mark as Completed
          </MenuItem>
          <MenuItem onClick={() => handleStatusSelect('archived')} disabled={inventory.status === 'archived'}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
            Archive
          </MenuItem>
        </Menu>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedStatus === 'completed'
              ? "Are you sure you want to mark this inventory as completed? This indicates that you've made all possible direct amends."
              : selectedStatus === 'archived'
              ? "Are you sure you want to archive this inventory? You can still access it, but it will be marked as no longer active."
              : "Are you sure you want to change the status of this inventory?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmStatusChange} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}