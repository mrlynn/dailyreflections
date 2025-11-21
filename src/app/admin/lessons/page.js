'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

/**
 * Admin Lessons List Page
 * Shows all lessons across all courses for editing
 */
export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    try {
      const response = await fetch('/api/admin/lessons');
      if (!response.ok) throw new Error('Failed to fetch lessons');
      const data = await response.json();
      setLessons(data);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert severity="error">{error}</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            All Lessons
          </Typography>
          <Chip label={`${lessons.length} lessons`} color="primary" />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>Lesson</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow
                  key={lesson._id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {lesson.title}
                      </Typography>
                      {lesson.subtitle && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {lesson.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{lesson.moduleName || lesson.moduleSlug}</TableCell>
                  <TableCell>{lesson.courseName || lesson.courseSlug}</TableCell>
                  <TableCell>{lesson.order}</TableCell>
                  <TableCell>
                    {lesson.approximateDurationMinutes ? `${lesson.approximateDurationMinutes} min` : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lesson.status || 'published'}
                      size="small"
                      color={lesson.status === 'draft' ? 'default' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => router.push(`/admin/lessons/${lesson._id}/edit`)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {lessons.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No lessons found
            </Typography>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}
