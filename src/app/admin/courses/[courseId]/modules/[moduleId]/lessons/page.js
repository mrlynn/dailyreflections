'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/Admin/AdminLayout';
import {
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Admin Lessons Management Page
 * List, create, edit, and manage lessons for a specific module
 */
export default function AdminModuleLessonsPage() {
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    approximateDurationMinutes: 5,
    status: 'draft',
  });
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;
  const moduleId = params.moduleId;

  useEffect(() => {
    if (courseId && moduleId) {
      fetchData();
    }
  }, [courseId, moduleId]);

  async function fetchData() {
    try {
      // Fetch course details
      const courseResponse = await fetch(`/api/admin/courses/${courseId}`);
      if (!courseResponse.ok) throw new Error('Failed to fetch course');
      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch module details
      const moduleResponse = await fetch(`/api/admin/modules/${moduleId}`);
      if (!moduleResponse.ok) throw new Error('Failed to fetch module');
      const moduleData = await moduleResponse.json();
      setModule(moduleData);

      // Fetch lessons for this module
      const lessonsResponse = await fetch(`/api/admin/lessons?moduleId=${moduleId}`);
      if (!lessonsResponse.ok) throw new Error('Failed to fetch lessons');
      const lessonsData = await lessonsResponse.json();
      setLessons(lessonsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setFormData({
      title: '',
      subtitle: '',
      slug: '',
      approximateDurationMinutes: 5,
      status: 'draft',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          courseId,
          moduleId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create lesson');

      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error creating lesson:', err);
      alert('Failed to create lesson: ' + err.message);
    }
  }

  async function handleDelete(lessonId) {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete lesson');

      fetchData();
    } catch (err) {
      console.error('Error deleting lesson:', err);
      alert('Failed to delete lesson: ' + err.message);
    }
  }

  async function handleReorder(lessonId, direction) {
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!response.ok) throw new Error('Failed to reorder lesson');

      fetchData();
    } catch (err) {
      console.error('Error reordering lesson:', err);
      alert('Failed to reorder lesson: ' + err.message);
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
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <Link
            underline="hover"
            color="inherit"
            href="/admin/courses"
            onClick={(e) => {
              e.preventDefault();
              router.push('/admin/courses');
            }}
            sx={{ cursor: 'pointer' }}
          >
            Courses
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href={`/admin/courses/${courseId}/modules`}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/admin/courses/${courseId}/modules`);
            }}
            sx={{ cursor: 'pointer' }}
          >
            {course?.title || 'Course'}
          </Link>
          <Typography color="text.primary">{module?.title || 'Module'}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Lessons
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {module?.title}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Lesson
          </Button>
        </Box>

        {/* Lessons Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lesson</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessons.map((lesson, index) => (
                <TableRow key={lesson._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleReorder(lesson._id, 'up')}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === lessons.length - 1}
                        onClick={() => handleReorder(lesson._id, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {lesson.title}
                      </Typography>
                      {lesson.subtitle && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {lesson.subtitle}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {lesson.slug}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{lesson.approximateDurationMinutes} min</TableCell>
                  <TableCell>
                    <Chip
                      label={lesson.status || 'draft'}
                      size="small"
                      color={lesson.status === 'published' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/admin/lessons/${lesson._id}/edit`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(lesson._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {lessons.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No lessons found. Create your first lesson to get started.
            </Typography>
          </Box>
        )}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Lesson</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Taking the First Step"
                fullWidth
                required
              />
              <TextField
                label="Subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Optional subtitle"
                fullWidth
              />
              <TextField
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., taking-the-first-step"
                helperText="URL-friendly identifier (lowercase, hyphens only)"
                fullWidth
                required
              />
              <TextField
                label="Duration (minutes)"
                type="number"
                value={formData.approximateDurationMinutes}
                onChange={(e) => setFormData({ ...formData, approximateDurationMinutes: parseInt(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Status"
                select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              Create Lesson
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
