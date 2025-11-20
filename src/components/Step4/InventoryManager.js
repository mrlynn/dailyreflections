'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Paper
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArchiveIcon from '@mui/icons-material/Archive';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDistanceToNow } from 'date-fns';

/**
 * InventoryManager Component
 *
 * Displays a list of user's 4th step inventories and allows them to:
 * - View inventory details
 * - Load a specific inventory
 * - Start a new inventory
 * - Archive old inventories
 */
export default function InventoryManager({ onSelectInventory, onStartNew }) {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [archiveConfirmation, setArchiveConfirmation] = useState(null);

  // Function to handle viewing an inventory
  const handleViewInventory = (inventory) => {
    if (inventory && inventory._id) {
      // Navigate to the review page for this inventory
      window.location.href = `/step4/review/${inventory._id}`;
    }
  };

  // Load inventories on mount
  useEffect(() => {
    fetchInventories();
  }, []);

  // Fetch user's inventories
  const fetchInventories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/step4/list');
      if (!response.ok) {
        throw new Error('Failed to fetch inventories');
      }

      const data = await response.json();
      setInventories(data.inventories || []);
    } catch (err) {
      console.error('Error fetching inventories:', err);
      setError('Failed to load your inventories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Start a new inventory
  const handleStartNew = async () => {
    if (inventories.length > 0) {
      // If there are existing inventories, show dialog
      setShowDialog(true);
    } else {
      // If no existing inventories, just start fresh
      await startNewInventory();
    }
  };

  // Create new inventory
  const startNewInventory = async (archiveOld = false, oldInventoryId = null) => {
    try {
      setLoading(true);
      const response = await fetch('/api/step4/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldInventoryId,
          archiveOld
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create new inventory');
      }

      const data = await response.json();

      // Notify parent about the new inventory
      if (onStartNew) {
        onStartNew(data.inventory);
      }

      // Close dialog if open
      setShowDialog(false);

      // Refresh inventory list
      fetchInventories();
    } catch (err) {
      console.error('Error starting new inventory:', err);
      setError('Failed to start a new inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting an inventory
  const handleSelectInventory = (inventory) => {
    if (onSelectInventory) {
      onSelectInventory(inventory);
    }
  };

  // Confirm archiving an inventory
  const confirmArchive = (inventory) => {
    setArchiveConfirmation(inventory);
  };

  // Archive an inventory
  const archiveInventory = async () => {
    if (!archiveConfirmation) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/step4/${archiveConfirmation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'archived'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to archive inventory');
      }

      // Refresh inventory list
      fetchInventories();

      // Clear confirmation
      setArchiveConfirmation(null);
    } catch (err) {
      console.error('Error archiving inventory:', err);
      setError('Failed to archive inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format progress status
  const formatProgress = (progress) => {
    if (!progress) return '0%';

    const sections = [
      progress.resentmentsComplete,
      progress.fearsComplete,
      progress.sexConductComplete,
      progress.harmsDoneComplete
    ];

    const completedSections = sections.filter(Boolean).length;
    return `${Math.round((completedSections / sections.length) * 100)}%`;
  };

  // Render inventory status chip
  const renderStatusChip = (status) => {
    switch (status) {
      case 'in_progress':
        return <Chip size="small" label="In Progress" color="primary" />;
      case 'completed':
        return <Chip size="small" label="Completed" color="success" />;
      case 'archived':
        return <Chip size="small" label="Archived" color="default" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Your 4th Step Inventories</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RestartAltIcon />}
          onClick={handleStartNew}
          disabled={loading}
        >
          Start New Inventory
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {inventories.length === 0 ? (
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                You haven't started a 4th Step Inventory yet.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleStartNew}
              >
                Start Your First Inventory
              </Button>
            </Paper>
          ) : (
            <List component={Paper} elevation={1} sx={{ mb: 3 }}>
              {inventories.map((inventory) => (
                <Box key={inventory._id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          component="div"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {new Date(inventory.startedAt).toLocaleDateString()}
                          {renderStatusChip(inventory.status)}
                          {inventory.isPasswordProtected && (
                            <Tooltip title="Password Protected">
                              <LockIcon fontSize="small" color="action" />
                            </Tooltip>
                          )}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            component="div"
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
                          >
                            <AccessTimeIcon fontSize="small" color="action" />
                            <span>
                              Last active {formatDistanceToNow(new Date(inventory.lastActive), { addSuffix: true })}
                            </span>
                          </Typography>
                          <Typography
                            variant="body2"
                            component="div"
                          >
                            Progress: {formatProgress(inventory.progress)}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="View inventory details">
                        <IconButton
                          edge="end"
                          color="info"
                          onClick={() => handleViewInventory(inventory)}
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Continue this inventory">
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => handleSelectInventory(inventory)}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                      {inventory.status !== 'archived' && (
                        <Tooltip title="Archive this inventory">
                          <IconButton
                            edge="end"
                            color="action"
                            onClick={() => confirmArchive(inventory)}
                            sx={{ ml: 1 }}
                          >
                            <ArchiveIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {inventories.indexOf(inventory) < inventories.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </>
      )}

      {/* Dialog for starting new inventory when others exist */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Start New Inventory?</DialogTitle>
        <DialogContent>
          <Typography>
            You already have one or more 4th Step inventories in progress.
            Would you like to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Start a new inventory and keep existing ones"
                secondary="You'll be able to switch between them"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Archive your current inventory and start fresh"
                secondary="The current inventory will be saved but marked as archived"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => startNewInventory(false)}>
            Keep Existing
          </Button>
          <Button onClick={() => startNewInventory(true, inventories[0]?._id)} variant="contained">
            Archive Current &amp; Start New
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for archiving an inventory */}
      <Dialog open={Boolean(archiveConfirmation)} onClose={() => setArchiveConfirmation(null)}>
        <DialogTitle>Archive this inventory?</DialogTitle>
        <DialogContent>
          <Typography>
            This will archive your 4th Step inventory from {archiveConfirmation && new Date(archiveConfirmation.startedAt).toLocaleDateString()}.
            You can still view it later, but it will be moved to your archived inventories.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveConfirmation(null)}>
            Cancel
          </Button>
          <Button onClick={archiveInventory} color="primary" variant="contained">
            Archive Inventory
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}