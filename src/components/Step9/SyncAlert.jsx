'use client';

import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  CircularProgress,
  Collapse
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import useSyncSteps from '@/hooks/useSyncSteps';
import { useSnackbar } from 'notistack';

/**
 * Component that displays a sync alert when Step 8 and Step 9 need synchronization
 */
export default function SyncAlert() {
  const {
    syncNeeded,
    syncStatus,
    syncResult,
    syncStep8ToStep9,
    checkSyncNeeded
  } = useSyncSteps();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState(true);

  const handleSync = async () => {
    try {
      const result = await syncStep8ToStep9();
      if (result.success) {
        enqueueSnackbar(
          `Successfully synchronized: ${result.newEntries} new entries, ${result.updatedEntries} updated`,
          { variant: 'success' }
        );
        setOpen(false);
      } else {
        enqueueSnackbar('Synchronization failed', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error during synchronization', { variant: 'error' });
      console.error(error);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Don't show anything if sync is not needed
  if (!syncNeeded) {
    return null;
  }

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="primary"
              size="small"
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              startIcon={
                syncStatus === 'syncing' ?
                <CircularProgress size={16} color="inherit" /> :
                <SyncIcon />
              }
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              Dismiss
            </Button>
          </Box>
        }
        sx={{ mb: 2 }}
      >
        <AlertTitle>Updates Available</AlertTitle>
        <Typography variant="body2">
          There are new entries in your Step 8 list that can be added to your Step 9 amends plan.
          Synchronize now to keep your amends plan up to date.
        </Typography>
      </Alert>
    </Collapse>
  );
}