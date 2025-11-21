'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Paper,
  Chip,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageHeader from '@/components/PageHeader';

/**
 * Course Overview Page - Shows modules and progress
 */
export default function CourseOverviewPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unwrap params Promise in Next.js 15+
  const { courseSlug } = use(params);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchCourseOverview();
    }
  }, [status, courseSlug, router]);

  const fetchCourseOverview = async () => {
    try {
      const response = await fetch(`/api/course/${courseSlug}`);

      if (!response.ok) {
        throw new Error('Failed to fetch course overview');
      }

      const courseData = await response.json();
      setData(courseData);

      // If user hasn't started and there's a next lesson, optionally auto-start
      // (Commented out for now to let user browse modules first)
      // if (!courseData.userProgress && courseData.nextLesson) {
      //   router.push(
      //     `/course/${courseData.course.slug}/learn/${courseData.nextLesson.moduleSlug}/${courseData.nextLesson.lessonSlug}`
      //   );
      // }
    } catch (err) {
      console.error('Error fetching course overview:', err);
      setError('Failed to load course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (data?.nextLesson) {
      router.push(
        `/course/${data.course.slug}/learn/${data.nextLesson.moduleSlug}/${data.nextLesson.lessonSlug}`
      );
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Course not found'}</Alert>
      </Container>
    );
  }

  const { course, modules, nextLesson } = data;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader title={course.title} subtitle={course.description} />

      {/* Continue Button */}
      {nextLesson && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          }}
        >
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Up Next
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {nextLesson.title}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleContinue}
            sx={{ textTransform: 'none' }}
          >
            Continue Where You Left Off
          </Button>
        </Paper>
      )}

      {/* Modules List */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Modules in This Path
      </Typography>

      <List sx={{ p: 0 }}>
        {modules.map((module) => (
          <Paper
            key={module._id}
            elevation={0}
            sx={{
              mb: 2,
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: module.locked ? 'divider' : 'primary.light',
              backgroundColor: module.locked ? 'action.hover' : 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {module.title}
                  </Typography>
                  {module.locked && (
                    <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  )}
                  {!module.locked && module.completedLessonCount === module.totalLessonCount && (
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {module.description}
                </Typography>

                <Chip
                  label={`${module.completedLessonCount}/${module.totalLessonCount} lessons completed`}
                  size="small"
                  color={module.completedLessonCount === module.totalLessonCount ? 'success' : 'default'}
                />
              </Box>
            </Box>

            {module.locked && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', display: 'block', mt: 2 }}>
                This module will unlock as you progress through the path
              </Typography>
            )}
          </Paper>
        ))}
      </List>
    </Container>
  );
}
