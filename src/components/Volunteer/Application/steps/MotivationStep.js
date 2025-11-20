'use client';

import { Box, Grid, TextField, Typography } from '@mui/material';

/**
 * Motivation step form
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when form data changes
 */
export default function MotivationStep({ formData, onChange }) {
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Your Motivation
      </Typography>

      <Typography variant="body1" paragraph color="text.secondary">
        Please share your thoughts on the following questions. These responses help us understand your motivation and approach to service work.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={5}
            label="Why are you interested in volunteering as a listener?"
            name="volunteerMotivation"
            value={formData.volunteerMotivation || ''}
            onChange={handleChange}
            required
            placeholder="Share your reasons and goals for wanting to volunteer..."
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Explain what motivates you to help others in recovery
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={5}
            label="How has connection with others been important in your recovery?"
            name="recoveryConnection"
            value={formData.recoveryConnection || ''}
            onChange={handleChange}
            required
            placeholder="Share your experience with connection in recovery..."
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Describe how fellowship and connection have impacted your journey
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={5}
            label="What does service work mean to you in your recovery?"
            name="serviceMeaning"
            value={formData.serviceMeaning || ''}
            onChange={handleChange}
            required
            placeholder="Describe how service work has influenced your recovery..."
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Share your understanding of the role of service in recovery
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={5}
            label="Is there anything else you'd like us to know? (Optional)"
            name="additionalInfo"
            value={formData.additionalInfo || ''}
            onChange={handleChange}
            placeholder="Any additional information you'd like to share with the review team..."
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Optional - any other relevant information for your application
          </Typography>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Your answers help us understand your approach and ensure it aligns with our community values. All responses are kept confidential.
        </Typography>
      </Box>
    </>
  );
}