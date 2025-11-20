'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import HistoryIcon from '@mui/icons-material/History';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { formatDistanceToNow, parseISO } from 'date-fns';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import PageHeader from '@/components/PageHeader';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const AUTOSAVE_DELAY = 1500;

const DEFAULT_EDITOR_STATE = {
  id: null,
  title: '',
  slug: '',
  summary: '',
  body: '',
  status: 'draft',
  tags: [],
  category: '',
  coverImage: '',
  heroImage: '',
  featuredHero: false,
  allowComments: false,
  isFeatured: false,
  authorName: '',
  authorAvatar: '',
  authorBio: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  publishedAt: '',
  previewToken: null,
  versionHistory: [],
  updatedAt: null,
};

const MarkdownButtons = [
  { label: 'H2', insert: '## ', suffix: '' },
  { label: 'Bold', insert: '**', suffix: '**' },
  { label: 'Italic', insert: '_', suffix: '_' },
  { label: 'Quote', insert: '> ', suffix: '' },
  { label: 'Link', insert: '[text](', suffix: ')' },
  { label: 'List', insert: '- ', suffix: '' },
  { label: 'Code', insert: '`', suffix: '`' },
];

function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function normalizeArticle(article) {
  if (!article) return DEFAULT_EDITOR_STATE;
  return {
    id: article.id || null,
    title: article.title || '',
    slug: article.slug || '',
    summary: article.summary || '',
    body: article.body || '',
    status: article.status || 'draft',
    tags: Array.isArray(article.tags) ? article.tags : Array.isArray(article.topics) ? article.topics : [],
    category: article.category || '',
    coverImage: article.coverImage || '',
    heroImage: article.heroImage || '',
    featuredHero: Boolean(article.featuredHero),
    allowComments: Boolean(article.allowComments),
    isFeatured: Boolean(article.isFeatured),
    authorName: article.author?.name || '',
    authorAvatar: article.author?.avatar || '',
    authorBio: article.author?.bio || '',
    seoTitle: article.seo?.title || '',
    seoDescription: article.seo?.description || '',
    seoKeywords: Array.isArray(article.seo?.keywords) ? article.seo.keywords : [],
    publishedAt: article.publishedAt || '',
    previewToken: article.previewToken || null,
    versionHistory: article.versionHistory || [],
    updatedAt: article.updatedAt || null,
  };
}

function serializeKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function preparePayload(editor, { includeStatus = false } = {}) {
  return {
    title: editor.title,
    slug: editor.slug,
    summary: editor.summary,
    body: editor.body,
    tags: editor.tags,
    category: editor.category,
    coverImage: editor.coverImage,
    heroImage: editor.heroImage,
    featuredHero: editor.featuredHero,
    allowComments: editor.allowComments,
    isFeatured: editor.isFeatured,
    link: '',
    author: {
      name: editor.authorName,
      avatar: editor.authorAvatar,
      bio: editor.authorBio,
    },
    seo: {
      title: editor.seoTitle,
      description: editor.seoDescription,
      keywords: serializeKeywords(editor.seoKeywords),
    },
    publishedAt: editor.publishedAt || null,
    ...(includeStatus ? { status: editor.status } : {}),
  };
}

function hasEditorChanges(current, baseline) {
  if (!baseline) return true;
  const fields = [
    'title',
    'slug',
    'summary',
    'body',
    'category',
    'coverImage',
    'heroImage',
    'featuredHero',
    'allowComments',
    'isFeatured',
    'authorName',
    'authorAvatar',
    'authorBio',
    'seoTitle',
    'seoDescription',
    'publishedAt',
    'status',
  ];

  for (const field of fields) {
    if ((current[field] || '') !== (baseline[field] || '')) {
      return true;
    }
  }

  const arraysEqual = (a = [], b = []) => {
    if (a.length !== b.length) return true;
    const left = [...a].map((item) => item.toString());
    const right = [...b].map((item) => item.toString());
    for (let i = 0; i < left.length; i += 1) {
      if (left[i] !== right[i]) return true;
    }
    return false;
  };

  if (arraysEqual(current.tags || [], baseline.tags || [])) return true;
  if (arraysEqual(serializeKeywords(current.seoKeywords), serializeKeywords(baseline.seoKeywords))) return true;
  return false;
}

function renderMarkdownPreview(markdown) {
  if (!markdown) return '<p><em>Start writing your article to see the preview.</em></p>';
  const html = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(html);
}

export default function AdminBlogPage() {
  const [articles, setArticles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(DEFAULT_EDITOR_STATE);
  const [baseline, setBaseline] = useState(null);
  const [autosaving, setAutosaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const bodyRef = useRef(null);

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const fetchArticles = useCallback(
    async (signal) => {
      setLoadingList(true);
      setListError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '200');
        if (searchTerm) params.set('q', searchTerm);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);

        const response = await fetch(`/api/admin/blog?${params.toString()}`, {
          credentials: 'include',
          signal,
        });

        if (!response.ok) {
          const { error } = await response.json().catch(() => ({ error: 'Failed to load articles' }));
          throw new Error(error || 'Failed to load articles');
        }

        const data = await response.json();
        setArticles(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching blog articles:', error);
        setListError(error.message || 'Unable to load blog articles.');
        setArticles([]);
      } finally {
        setLoadingList(false);
      }
    },
    [searchTerm, statusFilter, categoryFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchArticles(controller.signal);
    return () => controller.abort();
  }, [fetchArticles]);

  const loadArticle = useCallback(async (identifier) => {
    if (!identifier) return;
    setSelectedId(identifier);
    try {
      const response = await fetch(`/api/admin/blog/${identifier}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to load article' }));
        throw new Error(error || 'Failed to load article');
      }
      const data = await response.json();
      const normalized = normalizeArticle(data.article);
      setEditor(normalized);
      setBaseline(normalized);
      setLastSavedAt(data.article?.updatedAt || new Date().toISOString());
      if (typeof window !== 'undefined' && data.article?.previewToken) {
        setPreviewUrl(`${window.location.origin}/blog/${data.article.slug}?preview=${data.article.previewToken}`);
      } else {
        setPreviewUrl('');
      }
    } catch (error) {
      console.error('Error loading blog article:', error);
      setSnackbar({ open: true, severity: 'error', message: error.message || 'Failed to load article.' });
    }
  }, []);

  const handleCreateArticle = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'Untitled Article' }),
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to create article' }));
        throw new Error(error || 'Failed to create article');
      }
      const data = await response.json();
      const normalized = normalizeArticle(data.article);
      setArticles((prev) => [data.article, ...prev]);
      setSelectedId(normalized.id);
      setEditor(normalized);
      setBaseline(normalized);
      setLastSavedAt(new Date().toISOString());
      setPreviewUrl('');
      setSnackbar({ open: true, severity: 'success', message: 'Draft created.' });
    } catch (error) {
      console.error('Error creating blog article:', error);
      setSnackbar({ open: true, severity: 'error', message: error.message || 'Failed to create article.' });
    }
  }, []);

  const hasChanges = useMemo(() => hasEditorChanges(editor, baseline), [editor, baseline]);

  useEffect(() => {
    if (!selectedId) return;
    if (!hasChanges) return;

    const handler = setTimeout(async () => {
      try {
        setAutosaving(true);
        const payload = preparePayload(editor);
        const response = await fetch(`/api/admin/blog/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payload, autosave: true }),
        });
        if (!response.ok) {
          const { error } = await response.json().catch(() => ({ error: 'Failed to auto-save' }));
          throw new Error(error || 'Failed to auto-save');
        }
        const data = await response.json();
        const updated = normalizeArticle(data.article);
        setEditor(updated);
        setBaseline(updated);
        setLastSavedAt(new Date().toISOString());
        setArticles((prev) =>
          prev.map((item) => (item.id === updated.id || item._id === updated.id ? data.article : item))
        );
      } catch (error) {
        console.error('Auto-save error:', error);
        setSnackbar({ open: true, severity: 'error', message: error.message || 'Auto-save failed.' });
      } finally {
        setAutosaving(false);
      }
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(handler);
  }, [editor, selectedId, hasChanges]);

  const handleEditorChange = (field, value) => {
    setEditor((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagsChange = (value) => {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    handleEditorChange('tags', tags);
  };

  const handleSeoKeywordsChange = (value) => {
    const keywords = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    handleEditorChange('seoKeywords', keywords);
  };

  const handleManualSave = async ({ status }) => {
    if (!selectedId) return;
    try {
      setSaving(true);
      const payload = preparePayload(
        {
          ...editor,
          status: status || editor.status,
        },
        { includeStatus: true }
      );
      const response = await fetch(`/api/admin/blog/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...payload,
          recordVersion: true,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to save article' }));
        throw new Error(error || 'Failed to save article');
      }

      const data = await response.json();
      const updated = normalizeArticle(data.article);
      setEditor(updated);
      setBaseline(updated);
      setLastSavedAt(new Date().toISOString());
      setArticles((prev) =>
        prev.map((item) => (item.id === updated.id || item._id === updated.id ? data.article : item))
      );
      setSnackbar({
        open: true,
        severity: 'success',
        message: status === 'published' ? 'Article published.' : 'Draft saved.',
      });
    } catch (error) {
      console.error('Error saving article:', error);
      setSnackbar({ open: true, severity: 'error', message: error.message || 'Failed to save article.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedId) return;
    try {
      const response = await fetch(`/api/admin/blog/${selectedId}/preview`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to generate preview link' }));
        throw new Error(error || 'Failed to generate preview link');
      }
      const data = await response.json();
      setEditor((prev) => ({ ...prev, previewToken: data.token }));
      setBaseline((prev) => ({ ...prev, previewToken: data.token }));
      setPreviewUrl(data.previewUrl);
      setSnackbar({ open: true, severity: 'success', message: 'Preview link generated.' });
    } catch (error) {
      console.error('Error generating preview token:', error);
      setSnackbar({ open: true, severity: 'error', message: error.message || 'Failed to generate preview link.' });
    }
  };

  const handleCopyPreview = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl).then(() => {
      setSnackbar({ open: true, severity: 'success', message: 'Preview link copied to clipboard.' });
    });
  };

  const handleRestoreVersion = async (versionId) => {
    if (!selectedId || !versionId) return;
    if (!window.confirm('Restore this version? Unsaved changes will be lost.')) return;
    try {
      const response = await fetch(`/api/admin/blog/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ restoreVersionId: versionId }),
      });
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Failed to restore version' }));
        throw new Error(error || 'Failed to restore version');
      }
      const data = await response.json();
      const updated = normalizeArticle(data.article);
      setEditor(updated);
      setBaseline(updated);
      setArticles((prev) =>
        prev.map((item) => (item.id === updated.id || item._id === updated.id ? data.article : item))
      );
      setSnackbar({ open: true, severity: 'success', message: 'Version restored.' });
    } catch (error) {
      console.error('Error restoring version:', error);
      setSnackbar({ open: true, severity: 'error', message: error.message || 'Failed to restore version.' });
    }
  };

  const applyMarkdownFormat = (prefix, suffix = '') => {
    if (!bodyRef.current) return;
    const textarea = bodyRef.current;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const value = textarea.value;
    const selected = value.slice(start, end);
    const newValue = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    handleEditorChange('body', newValue);
    setTimeout(() => {
      textarea.focus();
      const cursorPosition = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const categories = useMemo(() => {
    const unique = new Set(
      articles
        .map((article) => article.category || article.metadata?.category || '')
        .filter(Boolean)
    );
    return ['all', ...Array.from(unique)];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.map((article) => ({
      ...article,
      updatedLabel: article.updatedAt
        ? formatDistanceToNow(parseISO(article.updatedAt), { addSuffix: true })
        : 'Just now',
    }));
  }, [articles]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Blog Manager"
        subtitle="Create, edit, and publish recovery blog articles with live preview and version history."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateArticle}
            sx={{ backgroundColor: '#5DA6A7', '&:hover': { backgroundColor: '#4A8F90' } }}
          >
            New Article
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Stack spacing={2}>
              <TextField
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search articles..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={{ flex: 1 }}
                >
                  {STATUS_FILTERS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  size="small"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  sx={{ flex: 1 }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category === 'all' ? 'All categories' : category}
                    </MenuItem>
                  ))}
                </Select>
                <Tooltip title="Refresh list">
                  <span>
                    <IconButton onClick={() => fetchArticles()} disabled={loadingList}>
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              {loadingList && <CircularProgress size={24} sx={{ alignSelf: 'center', mt: 2 }} />}

              {listError && (
                <Alert severity="error" onClose={() => setListError(null)}>
                  {listError}
                </Alert>
              )}

              <Divider />

              <List dense sx={{ maxHeight: 520, overflowY: 'auto' }}>
                {filteredArticles.map((article) => {
                  const isSelected = article.id === selectedId || article._id === selectedId;
                  return (
                    <ListItem key={article.id || article._id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => loadArticle(article.id || article._id)}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2">{article.title}</Typography>
                              <Chip
                                size="small"
                                label={article.status}
                                color={
                                  article.status === 'published'
                                    ? 'success'
                                    : article.status === 'draft'
                                    ? 'default'
                                    : 'warning'
                                }
                              />
                            </Stack>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Updated {article.updatedLabel}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
                {!loadingList && filteredArticles.length === 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 6 }}>
                    No articles found. Adjust filters or create a new article.
                  </Typography>
                )}
              </List>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedId ? (
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Title"
                      value={editor.title}
                      onChange={(event) => handleEditorChange('title', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Slug"
                      value={editor.slug}
                      onChange={(event) => handleEditorChange('slug', event.target.value)}
                      helperText="Auto-generated from title when left blank."
                      fullWidth
                    />
                  </Stack>

                  <TextField
                    label="Summary"
                    value={editor.summary}
                    onChange={(event) => handleEditorChange('summary', event.target.value)}
                    multiline
                    minRows={2}
                  />

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Category"
                      value={editor.category}
                      onChange={(event) => handleEditorChange('category', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Tags (comma separated)"
                      value={editor.tags.join(', ')}
                      onChange={(event) => handleTagsChange(event.target.value)}
                      fullWidth
                    />
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Cover image URL"
                      value={editor.coverImage}
                      onChange={(event) => handleEditorChange('coverImage', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Hero image URL (optional)"
                      value={editor.heroImage}
                      onChange={(event) => handleEditorChange('heroImage', event.target.value)}
                      fullWidth
                    />
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <Select
                      size="small"
                      value={editor.status}
                      onChange={(event) => handleEditorChange('status', event.target.value)}
                      sx={{ width: { xs: '100%', md: 200 } }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <TextField
                      label="Publish date"
                      type="datetime-local"
                      value={formatDateTimeLocal(editor.publishedAt)}
                      onChange={(event) =>
                        handleEditorChange('publishedAt', parseDateTimeLocal(event.target.value))
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: { xs: '100%', md: 260 } }}
                    />
                    <Stack direction="row" spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          checked={editor.isFeatured}
                          onChange={(event) => handleEditorChange('isFeatured', event.target.checked)}
                        />
                        <Typography variant="body2">Featured</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          checked={editor.featuredHero}
                          onChange={(event) => handleEditorChange('featuredHero', event.target.checked)}
                        />
                        <Typography variant="body2">Hero layout</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                          checked={editor.allowComments}
                          onChange={(event) => handleEditorChange('allowComments', event.target.checked)}
                        />
                        <Typography variant="body2">Allow comments</Typography>
                      </Stack>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Author name"
                      value={editor.authorName}
                      onChange={(event) => handleEditorChange('authorName', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Author avatar URL"
                      value={editor.authorAvatar}
                      onChange={(event) => handleEditorChange('authorAvatar', event.target.value)}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Author bio"
                    value={editor.authorBio}
                    onChange={(event) => handleEditorChange('authorBio', event.target.value)}
                    multiline
                    minRows={2}
                  />

                  <Divider sx={{ my: 1 }} />

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="SEO title"
                      value={editor.seoTitle}
                      onChange={(event) => handleEditorChange('seoTitle', event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="SEO keywords (comma separated)"
                      value={editor.seoKeywords.join(', ')}
                      onChange={(event) => handleSeoKeywordsChange(event.target.value)}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="SEO description"
                    value={editor.seoDescription}
                    onChange={(event) => handleEditorChange('seoDescription', event.target.value)}
                    multiline
                    minRows={2}
                  />
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack spacing={2} sx={{ p: 3 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} spacing={2}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      Article Body
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {autosaving
                        ? 'Auto-saving…'
                        : lastSavedAt
                        ? `Last saved ${formatDistanceToNow(parseISO(lastSavedAt), { addSuffix: true })}`
                        : 'Unsaved changes'}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={saving}
                        onClick={() => handleManualSave({ status: 'draft' })}
                      >
                        Save draft
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={editor.status === 'published' ? <SaveIcon /> : <PublishIcon />}
                        disabled={saving}
                        onClick={() => handleManualSave({ status: 'published' })}
                      >
                        {editor.status === 'published' ? 'Update publish' : 'Publish'}
                      </Button>
                    </Stack>
                  </Stack>

                  <ButtonGroup size="small" variant="outlined">
                    {MarkdownButtons.map((button) => (
                      <Button key={button.label} onClick={() => applyMarkdownFormat(button.insert, button.suffix)}>
                        {button.label}
                      </Button>
                    ))}
                  </ButtonGroup>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        inputRef={bodyRef}
                        label="Markdown"
                        value={editor.body}
                        onChange={(event) => handleEditorChange('body', event.target.value)}
                        multiline
                        minRows={20}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Live Preview
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          height: '100%',
                          overflowY: 'auto',
                          backgroundColor: 'grey.50',
                        }}
                      >
                        <Box
                          sx={{
                            fontSize: '0.95rem',
                            lineHeight: 1.7,
                            '& h1, & h2, & h3, & h4': { mt: 3, mb: 1.5 },
                            '& ul, & ol': { pl: 3, mb: 2 },
                            '& li': { mb: 0.5 },
                            '& pre': {
                              backgroundColor: 'grey.900',
                              color: 'grey.50',
                              borderRadius: 2,
                              p: 2,
                              overflowX: 'auto',
                            },
                            '& code': {
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              px: 0.5,
                              borderRadius: 1,
                            },
                          }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editor.body) }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}
                  >
                    <Stack spacing={2}>
                      <Typography variant="h6">Preview link</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a secure preview link to share draft content with reviewers.
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          startIcon={<PreviewIcon />}
                          onClick={handleGeneratePreview}
                          disabled={saving}
                        >
                          Generate link
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          disabled={!previewUrl}
                          onClick={handleCopyPreview}
                        >
                          Copy link
                        </Button>
                        {previewUrl && (
                          <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => window.open(previewUrl, '_blank', 'noopener')}
                          >
                            Open preview
                          </Button>
                        )}
                      </Stack>
                      {previewUrl && (
                        <TextField
                          value={previewUrl}
                          label="Preview URL"
                          fullWidth
                          InputProps={{ readOnly: true }}
                        />
                      )}
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HistoryIcon />
                        <Typography variant="h6">Version history</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Restoring a version will overwrite the current draft. Versions are created whenever you save or publish.
                      </Typography>
                      <Divider />
                      <Stack spacing={2} sx={{ maxHeight: 260, overflowY: 'auto' }}>
                        {(editor.versionHistory || []).length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No saved versions yet.
                          </Typography>
                        )}
                        {(editor.versionHistory || []).map((version) => (
                          <Paper
                            key={version.id}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 1, borderColor: 'divider' }}
                          >
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">{version.title || 'Untitled version'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Saved {version.createdAt ? formatDistanceToNow(parseISO(version.createdAt), { addSuffix: true }) : 'recently'}
                                {version.authorName ? ` · by ${version.authorName}` : ''}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip size="small" label={version.status || 'draft'} />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleRestoreVersion(version.id)}
                                >
                                  Restore
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                minHeight: 560,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" gutterBottom>
                Select or create an article to begin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose an existing post from the list or start a new article to launch the focused editing workspace.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateArticle}>
                Create new article
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

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

