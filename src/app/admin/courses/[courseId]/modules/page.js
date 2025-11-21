'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Admin Modules Management Page
 * List, create, edit, and manage modules for a specific course
 */
export default function AdminModulesPage() {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
  });
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;

  useEffect(() => {
    if (courseId) {
      fetchCourseAndModules();
    }
  }, [courseId]);

  async function fetchCourseAndModules() {
    try {
      // Fetch course details
      const courseResponse = await fetch(`/api/admin/courses/${courseId}`);
      if (!courseResponse.ok) throw new Error('Failed to fetch course');
      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch modules for this course
      const modulesResponse = await fetch(`/api/admin/modules?courseId=${courseId}`);
      if (!modulesResponse.ok) throw new Error('Failed to fetch modules');
      const modulesData = await modulesResponse.json();
      setModules(modulesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingModule(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
    });
    setDialogOpen(true);
  }

  function handleEdit(module) {
    setEditingModule(module);
    setFormData({
      title: module.title,
      slug: module.slug,
      description: module.description || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      const url = editingModule
        ? `/api/admin/modules/${editingModule._id}`
        : '/api/admin/modules';

      const method = editingModule ? 'PUT' : 'POST';

      const body = editingModule
        ? formData
        : { ...formData, courseId };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save module');

      setDialogOpen(false);
      fetchCourseAndModules();
    } catch (err) {
      console.error('Error saving module:', err);
      alert('Failed to save module: ' + err.message);
    }
  }

  async function handleDelete(moduleId) {
    if (!confirm('Are you sure you want to delete this module? This will also delete all lessons in this module.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete module');

      fetchCourseAndModules();
    } catch (err) {
      console.error('Error deleting module:', err);
      alert('Failed to delete module: ' + err.message);
    }
  }

  async function handleReorder(moduleId, direction) {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!response.ok) throw new Error('Failed to reorder module');

      fetchCourseAndModules();
    } catch (err) {
      console.error('Error reordering module:', err);
      alert('Failed to reorder module: ' + err.message);
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
          <Typography color="text.primary">{course?.title || 'Loading...'}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Modules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {course?.title}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Module
          </Button>
        </Box>

        {/* Modules Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lessons</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modules.map((module, index) => (
                <TableRow key={module._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleReorder(module._id, 'up')}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === modules.length - 1}
                        onClick={() => handleReorder(module._id, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {module.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {module.slug}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{module.lessonCount || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MenuBookIcon />}
                        onClick={() => router.push(`/admin/courses/${courseId}/modules/${module._id}/lessons`)}
                      >
                        Lessons
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(module)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(module._id)}
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

        {modules.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No modules found. Create your first module to get started.
            </Typography>
          </Box>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., One Day at a Time"
                fullWidth
              />
              <TextField
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., one-day-at-a-time"
                helperText="URL-friendly identifier (lowercase, hyphens only)"
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of this module"
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editingModule ? 'Save Changes' : 'Create Module'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
