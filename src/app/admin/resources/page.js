'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '@/components/PageHeader';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const RESOURCE_TYPES = [
  'literature',
  'resource',
  'video',
  'audio',
  'article',
];

const DEFAULT_FORM_STATE = {
  title: '',
  slug: '',
  summary: '',
  body: '',
  resourceType: 'literature',
  topics: '',
  aaType: '',
  link: '',
  isFeatured: false,
  status: 'draft',
  metadataImageUrl: '',
  publishedAt: '',
};

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toTopicsArray = (topics) =>
  topics
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean);

export default function AdminResourcesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.isAdmin === true;
  const sessionLoading = sessionStatus === 'loading';
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [editingResource, setEditingResource] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const fetchResources = useCallback(
    async (signal) => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '200');
        params.set('status', statusFilter);
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (searchTerm) params.set('q', searchTerm);

        const response = await fetch(`/api/resources?${params.toString()}`, {
          signal,
          credentials: 'include',
        });
        if (!response.ok) {
          const { error: message } = await response.json();
          throw new Error(message || 'Failed to load resources');
        }
        const data = await response.json();
        setResources(data.resources || []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching resources:', err);
        setError(err.message || 'Unable to load resources.');
        setResources([]);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter, typeFilter, isAdmin]
  );

  useEffect(() => {
    const controller = new AbortController();
    if (isAdmin) {
      fetchResources(controller.signal);
    } else if (!sessionLoading) {
      setLoading(false);
    }
    return () => controller.abort();
  }, [fetchResources, isAdmin, sessionLoading]);

  if (!sessionLoading && !isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PageHeader
          title="Admin Resources"
          icon={<BookmarksIcon sx={{ fontSize: 'inherit' }} />}
          subtitle="Administrator access required"
        />
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need administrator privileges to manage AA Companion resources. Please sign in with an admin account.
        </Alert>
        <Button
          variant="contained"
          component={Link}
          href="/login?callbackUrl=/admin/resources"
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  const openDialog = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormState({
        title: resource.title || '',
        slug: resource.slug || '',
        summary: resource.summary || '',
        body: resource.body || '',
        resourceType: resource.resourceType || 'literature',
        topics: (resource.topics || []).join(', '),
        aaType: resource.aaType || '',
        link: resource.link || '',
        isFeatured: Boolean(resource.isFeatured),
        status: resource.status || 'draft',
        metadataImageUrl: resource.metadata?.imageUrl || '',
        publishedAt: formatDateTimeLocal(resource.publishedAt),
      });
    } else {
      setEditingResource(null);
      setFormState(DEFAULT_FORM_STATE);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingResource(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleSave = async () => {
    const payload = {
      title: formState.title?.trim(),
      slug: formState.slug?.trim(),
      summary: formState.summary || '',
      body: formState.body || '',
      resourceType: formState.resourceType,
      topics: toTopicsArray(formState.topics),
      aaType: formState.aaType?.trim() || '',
      link: formState.link?.trim() || '',
      isFeatured: Boolean(formState.isFeatured),
      status: formState.status,
      metadata: {},
    };

    if (!payload.title) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Title is required.',
      });
      return;
    }

    if (!payload.resourceType) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Resource type is required.',
      });
      return;
    }

    if (formState.metadataImageUrl) {
      const trimmedImageUrl = formState.metadataImageUrl.trim();
      payload.metadata.imageUrl = /^https?:\/\//i.test(trimmedImageUrl)
        ? trimmedImageUrl
        : `https://${trimmedImageUrl}`;
    }

    if (formState.publishedAt) {
      payload.publishedAt = new Date(formState.publishedAt).toISOString();
    }

    if (payload.link && !/^https?:\/\//i.test(payload.link)) {
      payload.link = `https://${payload.link}`;
    }

    const isEditing = Boolean(editingResource?._id);
    const endpoint = isEditing
      ? `/api/resources/${editingResource._id}`
      : '/api/resources';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || 'Failed to save resource');
      }

      setSnackbar({
        open: true,
        severity: 'success',
        message: isEditing ? 'Resource updated successfully.' : 'Resource created successfully.',
      });

      closeDialog();
      fetchResources();
    } catch (err) {
      console.error('Error saving resource:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: err.message || 'Failed to save resource.',
      });
    }
  };

  const handleStatusUpdate = async (resource, nextStatus) => {
    try {
      const response = await fetch(`/api/resources/${resource._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || 'Failed to update status');
      }

      setSnackbar({
        open: true,
        severity: 'success',
        message: `Resource marked as ${nextStatus}.`,
      });
      fetchResources();
    } catch (err) {
      console.error('Error updating status:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: err.message || 'Failed to update status.',
      });
    }
  };

  const handleDelete = async (resource, options = { hard: false }) => {
    if (
      !window.confirm(
        options.hard
          ? 'Permanently delete this resource? This action cannot be undone.'
          : 'Archive this resource? You can restore it later.'
      )
    ) {
      return;
    }

    try {
      const params = new URLSearchParams();
      if (options.hard) params.set('hard', 'true');

      const response = await fetch(`/api/resources/${resource._id}?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || 'Failed to delete resource');
      }

      setSnackbar({
        open: true,
        severity: 'success',
        message: options.hard ? 'Resource permanently deleted.' : 'Resource archived.',
      });
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: err.message || 'Failed to delete resource.',
      });
    }
  };

  const resourceTypesInData = useMemo(() => {
    const types = new Set(resources.map((resource) => resource.resourceType).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [resources]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Manage Resources"
        icon={<BookmarksIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Create, curate, and publish recovery resources, literature, and external links."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
            sx={{
              backgroundColor: '#5DA6A7',
              '&:hover': { backgroundColor: '#4A8F90' },
            }}
          >
            New Resource
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            label="Search resources"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, summary, topics, or content"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')} size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                {resourceTypesInData.map((type) => (
                  <MenuItem value={type} key={type}>
                    {type === 'all'
                      ? 'All types'
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderradius: 1, border: '1px solid', borderColor: 'divider' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Topics</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((resource) => {
              const isPublished = resource.status === 'published';
              const isArchived = resource.status === 'archived';
              const updatedLabel = resource.updatedAt
                ? format(new Date(resource.updatedAt), 'MMM d, yyyy')
                : '—';

              return (
                <TableRow hover key={resource._id}>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">{resource.title}</Typography>
                      {resource.summary && (
                        <Typography variant="caption" color="text.secondary">
                          {resource.summary}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell width={140}>
                    <Typography variant="body2" color="text.secondary">
                      {resource.slug}
                    </Typography>
                  </TableCell>
                  <TableCell width={120}>
                    <Chip
                      size="small"
                      label={resource.resourceType}
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell width={140}>
                    <Chip
                      size="small"
                      label={resource.status}
                      color={
                        resource.status === 'published'
                          ? 'success'
                          : resource.status === 'draft'
                          ? 'default'
                          : 'warning'
                      }
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell width={200}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {(resource.topics || []).map((topic) => (
                        <Chip key={topic} size="small" label={topic} variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell width={140}>
                    <Typography variant="body2" color="text.secondary">
                      {updatedLabel}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" width={220}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {!isPublished && !isArchived && (
                        <Tooltip title="Publish">
                          <IconButton
                            color="success"
                            onClick={() => handleStatusUpdate(resource, 'published')}
                          >
                            <PublishIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!isArchived && (
                        <Tooltip title="Archive">
                          <IconButton
                            color="warning"
                            onClick={() => handleStatusUpdate(resource, 'archived')}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => openDialog(resource)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Archive resource">
                        <IconButton
                          color="default"
                          onClick={() => handleDelete(resource)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && resources.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No resources match your current filters or search.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
        keepMounted={false}
      >
        <DialogTitle>
          {editingResource ? 'Edit Resource' : 'Create New Resource'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Title"
                fullWidth
                required
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Slug"
                fullWidth
                value={formState.slug}
                helperText="Leave blank to auto-generate from title"
                onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Summary"
                fullWidth
                multiline
                minRows={2}
                value={formState.summary}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, summary: event.target.value }))
                }
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Body (Markdown or HTML)"
                fullWidth
                multiline
                minRows={4}
                value={formState.body}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, body: event.target.value }))
                }
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Resource Type</InputLabel>
                <Select
                  label="Resource Type"
                  value={formState.resourceType}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, resourceType: event.target.value }))
                  }
                >
                  {RESOURCE_TYPES.map((type) => (
                    <MenuItem value={type} key={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="AA Type (optional)"
                fullWidth
                value={formState.aaType}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, aaType: event.target.value }))
                }
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="External Link"
                fullWidth
                value={formState.link}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, link: event.target.value }))
                }
                helperText="Use a full URL (https://example.com) for external resources."
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Topics (comma separated)"
                fullWidth
                value={formState.topics}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, topics: event.target.value }))
                }
                helperText="Example: steps, meditation, service"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Image URL"
                fullWidth
                value={formState.metadataImageUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, metadataImageUrl: event.target.value }))
                }
                helperText="Optional image used on cards and detail pages."
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Published at"
                type="datetime-local"
                fullWidth
                value={formState.publishedAt}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, publishedAt: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                helperText="Automatically set when publishing if left blank."
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.isFeatured}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, isFeatured: event.target.checked }))
                    }
                  />
                }
                label="Feature this resource"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingResource ? 'Save changes' : 'Create resource'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

