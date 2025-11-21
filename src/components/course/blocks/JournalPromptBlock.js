'use client';

import { Box, Typography, Button } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import { useRouter } from 'next/navigation';

/**
 * JournalPromptBlock - Short reflection prompt with optional link to journal feature
 */
export default function JournalPromptBlock({ title, prompt, linkToJournalFeature = false }) {
  const router = useRouter();

  const handleOpenJournal = () => {
    if (linkToJournalFeature) {
      router.push('/journal');
    }
  };

  return (
    <Box
      sx={{
        my: 4,
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'secondary.light',
        background: 'rgba(156, 39, 176, 0.04)',
      }}
    >
      {title && (
        <Typography
          variant="h6"
          sx={{
            mb: 1.5,
            fontWeight: 600,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            color: 'secondary.main',
          }}
        >
          {title}
        </Typography>
      )}

      <Typography
        variant="body1"
        sx={{
          mb: linkToJournalFeature ? 2 : 0,
          color: 'text.primary',
          fontSize: { xs: '1rem', sm: '1.0625rem' },
          lineHeight: 1.7,
          fontStyle: 'italic',
        }}
      >
        {prompt}
      </Typography>

      {linkToJournalFeature && (
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<CreateIcon />}
          onClick={handleOpenJournal}
          sx={{ mt: 1 }}
        >
          Open Journal
        </Button>
      )}
    </Box>
  );
}
