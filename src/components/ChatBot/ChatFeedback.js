'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const FEEDBACK_TAGS = [
  { value: 'accurate', label: '✅ Accurate' },
  { value: 'helpful', label: '❤️ Helpful or relatable' },
  { value: 'calm', label: '🧘 Calm and compassionate tone' },
  { value: 'confusing', label: '🤔 Confusing' },
  { value: 'inaccurate', label: '⚠️ Inaccurate or misleading' },
  { value: 'not_compassionate', label: '😞 Not compassionate' },
];

/**
 * ChatFeedback Component
 * Collects thumbs up/down feedback with optional tags and comment
 */
export default function ChatFeedback({
  message,
  onSubmit,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(!!message?.feedbackSubmitted);
  const [error, setError] = useState(null);

  const tagsForType = useMemo(() => {
    if (!feedbackType) return FEEDBACK_TAGS;
    if (feedbackType === 'thumbs_up') {
      return FEEDBACK_TAGS.filter(tag =>
        ['accurate', 'helpful', 'calm'].includes(tag.value)
      );
    }
    return FEEDBACK_TAGS.filter(tag =>
      ['confusing', 'inaccurate', 'not_compassionate'].includes(tag.value)
    );
  }, [feedbackType]);

  useEffect(() => {
    setHasSubmitted(!!message?.feedbackSubmitted);
    setIsVisible(false);
    setFeedbackType(null);
    setSelectedTags([]);
    setComment('');
    setError(null);
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [message?.messageId, message?.feedbackSubmitted]);

  useEffect(() => {
    if (!feedbackType) {
      setSelectedTags([]);
    } else {
      // Ensure selected tags remain valid for the chosen feedback type
      setSelectedTags(prev => prev.filter(tag =>
        tagsForType.some(option => option.value === tag)
      ));
    }
  }, [feedbackType, tagsForType]);

  const handleThumbSelect = (type) => {
    if (hasSubmitted || disabled) return;
    setError(null);
    setFeedbackType(prev => (prev === type ? null : type));
  };

  const handleSubmit = async () => {
    if (!feedbackType || !message?.messageId) {
      setError('Please choose whether the response was helpful.');
      return;
    }

    if (disabled) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit?.({
        messageId: message.messageId,
        feedbackType,
        tags: selectedTags,
        comment: comment?.trim() ? comment.trim() : null,
      });
      setHasSubmitted(true);
    } catch (submissionError) {
      console.error('Failed to submit chatbot feedback:', submissionError);
      setError('We could not save your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!message?.messageId || message?.error) {
    return null;
  }

  return (
    <Fade in={isVisible}>
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: 1,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(20, 34, 27, 0.45)'
            : 'rgba(200, 225, 215, 0.35)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {hasSubmitted ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CheckCircleOutlineIcon color="success" fontSize="small" />
            <Typography variant="body2" color="success.main">
              Thank you for helping us serve the recovery community better.
            </Typography>
          </Stack>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary">
              Your feedback helps us improve and serve others better.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Tooltip title="This response was helpful">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleThumbSelect('thumbs_up')}
                    disabled={disabled}
                    sx={{
                      backgroundColor: feedbackType === 'thumbs_up'
                        ? 'success.light'
                        : 'rgba(0, 0, 0, 0.04)',
                      color: feedbackType === 'thumbs_up'
                        ? 'success.dark'
                        : 'success.main',
                      '&:hover': {
                        backgroundColor: 'success.light',
                        color: 'success.dark',
                      }
                    }}
                  >
                    <ThumbUpAltOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="This response missed the mark">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleThumbSelect('thumbs_down')}
                    disabled={disabled}
                    sx={{
                      backgroundColor: feedbackType === 'thumbs_down'
                        ? 'error.light'
                        : 'rgba(0, 0, 0, 0.04)',
                      color: feedbackType === 'thumbs_down'
                        ? 'error.dark'
                        : 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.dark',
                      }
                    }}
                  >
                    <ThumbDownAltOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {feedbackType && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel id={`feedback-tags-${message.messageId}`}>Why? (optional)</InputLabel>
                  <Select
                    labelId={`feedback-tags-${message.messageId}`}
                    multiple
                    value={selectedTags}
                    onChange={(event) => setSelectedTags(event.target.value)}
                    label="Why? (optional)"
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {selected.map(value => {
                          const tag = FEEDBACK_TAGS.find(option => option.value === value);
                          return (
                            <Chip key={value} label={tag?.label ?? value} size="small" />
                          );
                        })}
                      </Stack>
                    )}
                    MenuProps={{
                      PaperProps: { style: { maxHeight: 280 } },
                    }}
                  >
                    {tagsForType.map(tag => (
                      <MenuItem key={tag.value} value={tag.value}>
                        {tag.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  label="Tell us more (optional)"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share what worked well or how we can improve."
                />

                {error && (
                  <Typography variant="caption" color="error.main">
                    {error}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting || disabled}
                  >
                    {isSubmitting ? 'Submitting...' : 'Send feedback'}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    </Fade>
  );
}

