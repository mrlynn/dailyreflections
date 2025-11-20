'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Rating,
  Chip
} from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';

/**
 * SessionSummaryDialog component for volunteers to provide feedback
 * and summary after a chat session ends
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Function} props.onSubmit - Callback when form is submitted
 */
export default function SessionSummaryDialog({ open, onClose, onSubmit }) {
  const [summary, setSummary] = useState({
    topicCategory: '',
    helpfulness: 3,
    noteToSelf: '',
    summary: '',
    followUpNeeded: false
  });

  const topicCategories = [
    'General Recovery',
    'Step Work',
    'Relapse Prevention',
    'Newcomer Support',
    'Emotional Support',
    'Sponsorship',
    'Meetings',
    'Literature',
    'Other'
  ];

  const handleSubmit = () => {
    onSubmit(summary);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SummarizeIcon color="primary" />
        <Typography variant="h6" component="span">
          Session Summary
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please provide a brief summary of this chat session. This information helps improve our volunteer service
            and may be useful for other volunteers if this user seeks help again.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="topic-category-label">Topic Category</InputLabel>
              <Select
                labelId="topic-category-label"
                value={summary.topicCategory}
                onChange={(e) => setSummary({ ...summary, topicCategory: e.target.value })}
                label="Topic Category"
              >
                {topicCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                How helpful do you feel this session was?
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  name="helpfulness"
                  value={summary.helpfulness}
                  onChange={(_, newValue) => {
                    setSummary({ ...summary, helpfulness: newValue });
                  }}
                />
                <Box sx={{ ml: 2 }}>
                  <Chip
                    label={
                      summary.helpfulness === 1 ? "Not helpful" :
                      summary.helpfulness === 2 ? "Somewhat helpful" :
                      summary.helpfulness === 3 ? "Helpful" :
                      summary.helpfulness === 4 ? "Very helpful" :
                      "Extremely helpful"
                    }
                    size="small"
                    color={
                      summary.helpfulness < 3 ? "default" :
                      summary.helpfulness === 3 ? "primary" :
                      "success"
                    }
                  />
                </Box>
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Session Summary"
              variant="outlined"
              value={summary.summary}
              onChange={(e) => setSummary({ ...summary, summary: e.target.value })}
              placeholder="Briefly describe what was discussed and any key insights or resources shared"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes to Self (Private)"
              variant="outlined"
              value={summary.noteToSelf}
              onChange={(e) => setSummary({ ...summary, noteToSelf: e.target.value })}
              placeholder="Any personal notes about this session (only visible to you)"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth>
              <InputLabel id="follow-up-label">Follow-up Needed?</InputLabel>
              <Select
                labelId="follow-up-label"
                value={summary.followUpNeeded}
                onChange={(e) => setSummary({ ...summary, followUpNeeded: e.target.value })}
                label="Follow-up Needed?"
              >
                <MenuItem value={false}>No follow-up needed</MenuItem>
                <MenuItem value={true}>Yes, follow-up recommended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
        >
          Submit Summary
        </Button>
      </DialogActions>
    </Dialog>
  );
}