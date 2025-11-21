'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Alert, Container, Box, Typography } from '@mui/material';
import CourseLayout from '@/components/course/CourseLayout';
import LessonPlayer from '@/components/course/LessonPlayer';

/**
 * Lesson Page - Renders a single lesson with the course shell
 */
export default function LessonPage({ params }) {
  console.log('LessonPage component rendering');

  // Unwrap params Promise in Next.js 15+
  const { courseSlug, moduleSlug, lessonSlug } = use(params);

  console.log('Params unwrapped:', { courseSlug, moduleSlug, lessonSlug });

  const { data: session, status } = useSession();
  console.log('Session status:', status);

  const router = useRouter();
  const [data, setData] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('State initialized, loading:', loading);

  useEffect(() => {
    console.log('useEffect triggered, status:', status);

    if (status === 'unauthenticated') {
      console.log('Redirecting to login');
      router.push('/login');
      return;
    }

    if (status !== 'authenticated') {
      console.log('Status is:', status, '- waiting for authentication');
      return;
    }

    console.log('Authenticated, fetching data');

    async function fetchLessonData() {
    try {
      console.log('Fetching lesson data...');
      const response = await fetch(
        `/api/course/${courseSlug}/lesson?moduleSlug=${moduleSlug}&lessonSlug=${lessonSlug}`
      );

      console.log('Lesson response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }

      const lessonData = await response.json();
      console.log('Lesson data received:', lessonData);

      setData(lessonData);
      console.log('Data set, loading should be false');
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson. Please try again.');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
    }

    async function fetchCourseOverview() {
    try {
      const response = await fetch(`/api/course/${courseSlug}`);
      if (response.ok) {
        const overview = await response.json();
        // Fetch all lessons to pass to sidebar
        const lessonsResponse = await fetch(
          `/api/course/${courseSlug}/lesson?moduleSlug=${moduleSlug}&lessonSlug=${lessonSlug}`
        );
        if (lessonsResponse.ok) {
          const lessonData = await lessonsResponse.json();
          // We need to get all lessons for the sidebar - for now, we'll work with what we have
          // In production, you might want a separate endpoint to fetch all lessons
          setAllLessons([lessonData.lesson]);
        }
      }
    } catch (err) {
      console.error('Error fetching course overview for sidebar:', err);
    }
    }

    // Call both fetch functions - no need to await since they handle their own state
    fetchLessonData();
    fetchCourseOverview();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, courseSlug, moduleSlug, lessonSlug]);

  const handleCompleteLesson = async () => {
    if (!data) return;

    try {
      const response = await fetch(`/api/course/${courseSlug}/lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: data.course._id,
          lessonId: data.lesson._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete lesson');
      }

      // Redirect to next lesson or course overview
      if (data.nextLesson) {
        router.push(
          `/course/${data.course.slug}/learn/${data.nextLesson.moduleSlug}/${data.nextLesson.lessonSlug}`
        );
      } else {
        router.push(`/course/${data.course.slug}`);
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
      throw err;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Box sx={{ mt: 2 }}>Loading lesson...</Box>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Lesson not found or you do not have access yet.'}</Alert>
      </Container>
    );
  }

  const { course, lesson, userProgress, nextLesson, previousLesson, isCompleted } = data;

  // Simplified render without CourseLayout for now to debug
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <LessonPlayer
        lesson={lesson}
        isCompleted={isCompleted}
        onComplete={handleCompleteLesson}
        nextLesson={nextLesson}
        previousLesson={previousLesson}
      />
    </Container>
  );
}
