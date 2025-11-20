'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useGuestSession } from '@/components/GuestSessionProvider';

export default function GuestModeBanner() {
  const { isGuest, upgradeToAccount } = useGuestSession();

  if (!isGuest) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: '#fffbea',
        borderBottom: '1px solid rgba(253, 222, 105, 0.8)',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8a6d3b' }}>
            You&apos;re exploring in Guest Mode
          </Typography>
          <Typography variant="body2" sx={{ color: '#8a6d3b' }}>
            Entries are saved on this device only. Create a free account to back up and sync your progress across devices.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={upgradeToAccount}
          sx={{
            backgroundColor: '#f0ad4e',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#ec971f',
            },
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Save my progress
        </Button>
      </Stack>
    </Box>
  );
}

