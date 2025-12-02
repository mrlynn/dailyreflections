'use client';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

/**
 * Debug page to inspect feature flag values at runtime
 * Access at: /debug/feature-flags
 */
export default function FeatureFlagsDebugPage() {
  // Test the hook
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Feature Flags Debug Page
      </Typography>

      {/* Environment Variables */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Environment Variables (Runtime)
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="NEXT_PUBLIC_FEATURE_REALTIME_CHAT"
              secondary={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT || 'undefined'}
            />
            <Chip
              label={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT === 'true' ? 'TRUE' : 'FALSE'}
              color={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT === 'true' ? 'success' : 'error'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER"
              secondary={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER || 'undefined'}
            />
            <Chip
              label={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER === 'true' ? 'TRUE' : 'FALSE'}
              color={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER === 'true' ? 'success' : 'error'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER"
              secondary={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER || 'undefined'}
            />
            <Chip
              label={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER === 'true' ? 'TRUE' : 'FALSE'}
              color={process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER === 'true' ? 'success' : 'error'}
            />
          </ListItem>
        </List>
      </Paper>

      {/* FEATURE_FLAGS Object */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          FEATURE_FLAGS.REALTIME_CHAT Object
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="ENABLED"
              secondary={String(FEATURE_FLAGS.REALTIME_CHAT?.ENABLED)}
            />
            <Chip
              label={FEATURE_FLAGS.REALTIME_CHAT?.ENABLED ? 'TRUE' : 'FALSE'}
              color={FEATURE_FLAGS.REALTIME_CHAT?.ENABLED ? 'success' : 'error'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="VOLUNTEER_CHAT"
              secondary={String(FEATURE_FLAGS.REALTIME_CHAT?.VOLUNTEER_CHAT)}
            />
            <Chip
              label={FEATURE_FLAGS.REALTIME_CHAT?.VOLUNTEER_CHAT ? 'TRUE' : 'FALSE'}
              color={FEATURE_FLAGS.REALTIME_CHAT?.VOLUNTEER_CHAT ? 'success' : 'error'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="USER_CHAT"
              secondary={String(FEATURE_FLAGS.REALTIME_CHAT?.USER_CHAT)}
            />
            <Chip
              label={FEATURE_FLAGS.REALTIME_CHAT?.USER_CHAT ? 'TRUE' : 'FALSE'}
              color={FEATURE_FLAGS.REALTIME_CHAT?.USER_CHAT ? 'success' : 'error'}
            />
          </ListItem>
        </List>
      </Paper>

      {/* useFeatureFlag Hook Result */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          useFeatureFlag('REALTIME_CHAT') Hook Result
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            Hook returns:
          </Typography>
          <Chip
            label={isRealtimeChatEnabled ? 'TRUE' : 'FALSE'}
            color={isRealtimeChatEnabled ? 'success' : 'error'}
            size="large"
          />
        </Box>
      </Paper>

      {/* All Feature Flags */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          All Feature Flags (Full Object)
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem'
          }}
        >
          {JSON.stringify(FEATURE_FLAGS, null, 2)}
        </Box>
      </Paper>
    </Box>
  );
}
