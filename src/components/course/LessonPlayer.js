'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Alert, Typography, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LessonBlockRenderer from './LessonBlockRenderer';
import ReactMarkdown from 'react-markdown';

/**
 * LessonPlayer - Renders a complete lesson with all its blocks
 *
 * @param {Object} lesson - The lesson object with title, subtitle, blocks
 * @param {boolean} isCompleted - Whether the user has already completed this lesson
 * @param {Function} onComplete - Callback when user marks lesson complete
 * @param {Object} nextLesson - Optional next lesson reference
 * @param {Object} previousLesson - Optional previous lesson reference
 */
export default function LessonPlayer({ lesson, isCompleted, onComplete, nextLesson, previousLesson }) {
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);

    try {
      await onComplete();
    } catch (err) {
      console.error('Error completing lesson:', err);
      setError('Failed to mark lesson as complete. Please try again.');
      setCompleting(false);
    }
  };

  const handleContinue = () => {
    // Just navigate without marking complete (already completed)
    if (nextLesson) {
      const courseSlug = window.location.pathname.split('/')[2];
      router.push(`/course/${courseSlug}/learn/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`);
    }
  };

  const handlePrevious = () => {
    if (previousLesson) {
      const courseSlug = window.location.pathname.split('/')[2];
      router.push(`/course/${courseSlug}/learn/${previousLesson.moduleSlug}/${previousLesson.lessonSlug}`);
    }
  };

  return (
    <Box>
      {/* Lesson Header */}
      <Box sx={{ mb: 4 }}>
        {lesson.approximateDurationMinutes && (
          <Chip
            label={`${lesson.approximateDurationMinutes} min`}
            size="small"
            sx={{ mb: 2 }}
            variant="outlined"
          />
        )}

        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: lesson.subtitle ? 1 : 0,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
          }}
        >
          {lesson.title}
        </Typography>

        {lesson.subtitle && (
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            {lesson.subtitle}
          </Typography>
        )}
      </Box>

      {/* Lesson Content - Support both markdown and blocks */}
      <Box sx={{ mb: 4 }}>
        {lesson.content?.body ? (
          // New markdown format
          <>
            <Divider sx={{ mb: 4 }} />
            <Box
              sx={{
                '& h1': { fontSize: '2rem', fontWeight: 700, mb: 3, mt: 4 },
                '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 2, mt: 3 },
                '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1.5, mt: 2 },
                '& p': { mb: 2.5, lineHeight: 1.75, fontSize: '1.0625rem' },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 3,
                  py: 2,
                  my: 3,
                  fontStyle: 'italic',
                  bgcolor: 'action.hover',
                  borderRadius: '0 4px 4px 0',
                },
                '& ul, & ol': { mb: 2.5, pl: 4 },
                '& li': { mb: 1, lineHeight: 1.7 },
                '& strong': { fontWeight: 600 },
                '& em': { fontStyle: 'italic' },
                '& a': { color: 'primary.main', textDecoration: 'underline' },
                '& hr': { my: 4, borderColor: 'divider' },
                '& code': {
                  bgcolor: 'action.hover',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                },
                '& pre': {
                  bgcolor: 'action.hover',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  mb: 2.5,
                },
              }}
            >
              <ReactMarkdown>{lesson.content.body}</ReactMarkdown>
            </Box>
          </>
        ) : lesson.blocks ? (
          // Legacy block format
          lesson.blocks.map((block, index) => (
            <LessonBlockRenderer
              key={index}
              block={block}
              lessonId={lesson._id?.toString()}
            />
          ))
        ) : (
          <Alert severity="info">No content available for this lesson.</Alert>
        )}
      </Box>

      {/* Completion Section */}
      {isCompleted ? (
        <Alert
          icon={<CheckCircleIcon />}
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          You've completed this lesson.
          {nextLesson && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Next up: <strong>{nextLesson.title || nextLesson.lessonSlug}</strong>
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleContinue}
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                Continue to Next Lesson
              </Button>
            </Box>
          )}
        </Alert>
      ) : (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            background: 'background.paper',
            mb: 3,
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            Ready to continue?
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleComplete}
            disabled={completing}
            endIcon={<ArrowForwardIcon />}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {completing ? 'Saving...' : 'Mark as Complete & Continue'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}

      {/* Lesson Navigation */}
      {(previousLesson || nextLesson) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 4,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {previousLesson ? (
            <Button
              variant="outlined"
              onClick={handlePrevious}
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: 'none' }}
            >
              Previous Lesson
            </Button>
          ) : (
            <Box /> // Empty box for spacing when no previous lesson
          )}

          {nextLesson && !isCompleted && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Complete this lesson to continue
            </Typography>
          )}

          {nextLesson && isCompleted && (
            <Button
              variant="outlined"
              onClick={handleContinue}
              endIcon={<ArrowForwardIcon />}
              sx={{ textTransform: 'none' }}
            >
              Next Lesson
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
