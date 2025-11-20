'use client';

import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

/**
 * Submitted step component
 * Shows confirmation and next steps after application submission
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onClose - Function to call when closing
 */
export default function SubmittedStep({ formData, onClose }) {
  // Format the submission date
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 3 }} />

      <Typography variant="h5" gutterBottom fontWeight={600}>
        Application Submitted Successfully!
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Thank you for applying to become a volunteer listener.
      </Typography>

      <Typography variant="body1" paragraph>
        Your application was submitted on {formatDate(formData.submissionDate)}.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          maxWidth: 500,
          mx: 'auto',
          mb: 4,
          bgcolor: 'rgba(93, 166, 167, 0.05)',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
          What happens next?
        </Typography>

        <Box component="ol" sx={{ textAlign: 'left', pl: 2 }}>
          <Typography component="li" sx={{ mb: 1 }}>
            Our team will review your application.
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            You may receive an email for additional information or clarification.
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            If approved, you'll receive an invitation to volunteer orientation.
          </Typography>
          <Typography component="li">
            Once training is complete, you'll be able to log in as a volunteer.
          </Typography>
        </Box>
      </Paper>

      <Typography variant="body2" color="text.secondary" paragraph>
        You can check your application status anytime on your profile page.
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: '#5DA6A7',
            '&:hover': {
              bgcolor: '#4A8F90',
            },
            px: 4,
            py: 1
          }}
        >
          Return to Dashboard
        </Button>
      </Stack>
    </Box>
  );
}