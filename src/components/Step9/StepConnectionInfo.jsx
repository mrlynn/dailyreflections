'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Tooltip,
  Link as MuiLink
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import SyncIcon from '@mui/icons-material/Sync';
import Link from 'next/link';

/**
 * Component to display connection information between a Step 9 entry and its Step 8 source
 * @param {Object} props
 * @param {String} props.stepEightEntryId - The ID of the linked Step 8 entry
 * @param {String} props.step9EntryId - The ID of this Step 9 entry
 * @param {Function} props.onSyncBack - Function to sync changes back to Step 8
 * @param {String} props.amendStatus - Current amendment status
 */
export default function StepConnectionInfo({
  stepEightEntryId,
  step9EntryId,
  onSyncBack,
  amendStatus,
  showBadgeOnly = false
}) {
  // If no Step 8 entry is linked
  if (!stepEightEntryId) {
    return showBadgeOnly ? null : (
      <Box sx={{ mt: 2, px: 2, py: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          This entry was created directly in Step 9 and is not linked to any Step 8 entry.
        </Typography>
      </Box>
    );
  }

  // For the badge-only mode (used in list views)
  if (showBadgeOnly) {
    return (
      <Tooltip title="Linked to Step 8 list entry">
        <Chip
          icon={<LinkIcon fontSize="small" />}
          label="Step 8"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Tooltip>
    );
  }

  // Function to check if changes should be synced back to Step 8
  const shouldSyncToStep8 = () => {
    return amendStatus === 'completed';
  };

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.100' }}>
      <Typography variant="body2" fontWeight={500} gutterBottom>
        <LinkIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        Connection to Step 8
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        This amend plan was created from an entry in your Step 8 list of people harmed.
      </Typography>

      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <MuiLink component={Link} href={`/step8?highlight=${stepEightEntryId}`} underline="hover">
          View in Step 8 list
        </MuiLink>

        {shouldSyncToStep8() && onSyncBack && (
          <Button
            startIcon={<SyncIcon />}
            size="small"
            onClick={() => onSyncBack(step9EntryId)}
            sx={{ ml: 'auto' }}
          >
            Update Step 8
          </Button>
        )}
      </Box>
    </Box>
  );
}