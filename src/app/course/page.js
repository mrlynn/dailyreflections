'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import PageHeader from '@/components/PageHeader';

/**
 * Course Index Page - Lists all available courses
 */
export default function CoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchCourses();
    }
  }, [status, router]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/course');

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses);

      // If there's only one course, redirect directly to it
      if (data.courses.length === 1) {
        router.push(`/course/${data.courses[0].slug}`);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Your Recovery Paths"
        subtitle="Guided journeys through your recovery"
      />

      <Box sx={{ mt: 4 }}>
        {courses.map((course) => (
          <Card
            key={course._id}
            sx={{
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardActionArea onClick={() => router.push(`/course/${course.slug}`)}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {course.title}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {course.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}

        {courses.length === 0 && (
          <Alert severity="info">
            No courses are currently available. Check back soon!
          </Alert>
        )}
      </Box>
    </Container>
  );
}
