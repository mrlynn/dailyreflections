'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactMarkdown from 'react-markdown';

/**
 * Lesson Editor Page
 * Markdown editor with live preview for editing lesson content
 */
export default function LessonEditPage({ params }) {
  const { lessonId } = use(params);
  const router = useRouter();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = edit, 1 = preview

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  async function fetchLesson() {
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!response.ok) throw new Error('Failed to fetch lesson');
      const data = await response.json();

      setLesson(data);
      setTitle(data.title || '');
      setSubtitle(data.subtitle || '');
      setDuration(data.approximateDurationMinutes?.toString() || '');

      // Convert blocks to markdown if needed
      if (data.content?.body) {
        setContent(data.content.body);
      } else if (data.blocks) {
        setContent(blocksToMarkdown(data.blocks));
      }
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function blocksToMarkdown(blocks) {
    return blocks
      .map((block) => {
        switch (block.type) {
          case 'hero':
            return `# ${block.props.heading}\n\n${block.props.body || ''}`;
          case 'text':
            return block.props.body;
          case 'quote':
            return `> ${block.props.body}\n> — ${block.props.source}`;
          case 'divider':
            return '---';
          default:
            return `[${block.type} block]`;
        }
      })
      .join('\n\n');
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          approximateDurationMinutes: duration ? parseInt(duration) : undefined,
          content: {
            body: content,
            bodyFormat: 'markdown',
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save lesson');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError(err.message);
    } finally {
      setSaving(false);
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

  if (error && !lesson) {
    return (
      <AdminLayout>
        <Alert severity="error">{error}</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/lessons')}
            sx={{ mb: 2 }}
          >
            Back to Lessons
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Edit Lesson
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lesson?.courseName} → {lesson?.moduleName}
          </Typography>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Lesson saved successfully!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Metadata Fields */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Lesson Metadata
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., You're not alone anymore"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 5"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g., A gentle introduction to recovery"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Markdown Editor */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab label="Write" />
              <Tab label="Preview" icon={<PreviewIcon />} iconPosition="end" />
            </Tabs>
          </Box>

          {activeTab === 0 ? (
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={25}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your lesson content here... Use markdown formatting:

# Heading 1
## Heading 2

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2

> Quote text
> — Source

[Link text](url)"
                sx={{
                  '& textarea': {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  },
                }}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  💡 Tip: Use markdown syntax for formatting. The preview tab shows how it will look to users.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 3, minHeight: 500 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                  {subtitle}
                </Typography>
              )}
              <Divider sx={{ mb: 4 }} />
              <Box
                sx={{
                  '& h1': { fontSize: '2rem', fontWeight: 700, mb: 2, mt: 4 },
                  '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 2, mt: 3 },
                  '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1, mt: 2 },
                  '& p': { mb: 2, lineHeight: 1.7 },
                  '& blockquote': {
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    pl: 2,
                    py: 1,
                    my: 3,
                    fontStyle: 'italic',
                    bgcolor: 'action.hover',
                  },
                  '& ul, & ol': { mb: 2, pl: 3 },
                  '& li': { mb: 1 },
                  '& strong': { fontWeight: 600 },
                  '& a': { color: 'primary.main', textDecoration: 'underline' },
                }}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/admin/lessons')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </AdminLayout>
  );
}
