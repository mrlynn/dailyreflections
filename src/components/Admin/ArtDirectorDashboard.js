'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  CardActions,
  Snackbar,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArtDirectorVisualization from './ArtDirectorVisualization';

/**
 * Art Director Dashboard
 *
 * Admin interface for managing Ghibli-style art generation
 */
export default function ArtDirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [artworks, setArtworks] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load art gallery and history in parallel
      const [galleryRes, historyRes] = await Promise.all([
        fetch('/api/admin/agents/art-director/gallery?limit=50'),
        fetch('/api/admin/agents/art-director/history?limit=20'),
      ]);

      if (!galleryRes.ok || !historyRes.ok) {
        throw new Error('Failed to load data');
      }

      const galleryData = await galleryRes.json();
      const historyData = await historyRes.json();

      setArtworks(galleryData.artworks || []);
      setHistory(historyData.history || []);
      setStats(galleryData.stats || {});
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateArt(request) {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/admin/agents/art-director/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to generate art');
      }

      const data = await response.json();

      // Reload data to show new art
      await loadData();

      setGenerateDialogOpen(false);

      return data;
    } catch (err) {
      console.error('Error generating art:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon fontSize="large" />
            Brand Art Director
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-generated Studio brand artwork for the platform
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGenerateDialogOpen(true)}
            disabled={generating}
          >
            Generate Art
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Agent Architecture Visualization */}
      <ArtDirectorVisualization />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Artworks"
            value={artworks.length}
            icon={<ImageIcon fontSize="large" color="primary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Daily Reflections"
            value={artworks.filter(a => a.art_type === 'daily_reflection').length}
            icon={<AutoAwesomeIcon fontSize="large" color="secondary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Step Illustrations"
            value={artworks.filter(a => a.art_type === 'step_illustration').length}
            icon={<CheckCircleIcon fontSize="large" color="success" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Milestone Badges"
            value={artworks.filter(a => a.art_type === 'milestone_badge').length}
            icon={<CheckCircleIcon fontSize="large" color="warning" />}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Art Gallery" />
          <Tab label="Generation History" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && <ArtGalleryTab artworks={artworks} />}
      {tabValue === 1 && <GenerationHistoryTab history={history} />}

      {/* Generate Dialog */}
      <GenerateArtDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleGenerateArt}
        generating={generating}
      />
    </Box>
  );
}

// Stat Card Component
function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Art Gallery Tab
function ArtGalleryTab({ artworks }) {
  const [processingId, setProcessingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  if (artworks.length === 0) {
    return (
      <Alert severity="info">
        No artworks generated yet. Click "Generate Art" to create your first artwork.
      </Alert>
    );
  }

  const handleApprove = async (artwork) => {
    try {
      setProcessingId(artwork.asset_id);
      const response = await fetch('/api/admin/agents/art-director/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ art_id: artwork.asset_id }),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Art approved and deployed successfully!',
          severity: 'success',
        });
        // Reload the page to refresh the gallery
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to approve art');
      }
    } catch (error) {
      console.error('Error approving art:', error);
      setSnackbar({
        open: true,
        message: `Failed to approve: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (artwork) => {
    if (!confirm('Are you sure you want to reject this artwork? It will be archived.')) {
      return;
    }

    try {
      setProcessingId(artwork.asset_id);
      const response = await fetch('/api/admin/agents/art-director/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          art_id: artwork.asset_id,
          reason: 'Does not meet quality standards',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Art rejected and archived',
          severity: 'info',
        });
        // Reload the page to refresh the gallery
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to reject art');
      }
    } catch (error) {
      console.error('Error rejecting art:', error);
      setSnackbar({
        open: true,
        message: `Failed to reject: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        {artworks.map((artwork) => (
          <Grid item xs={12} sm={6} md={4} key={artwork._id}>
            <Card>
              <CardMedia
                component="img"
                height="300"
                image={artwork.image.url || artwork.image.stored_url}
                alt={artwork.content_reference.reference_value}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {artwork.art_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {artwork.content_reference.reference_value}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={artwork.status}
                    size="small"
                    color={artwork.status === 'completed' ? 'success' : 'default'}
                  />
                  {artwork.quality_review?.approved && (
                    <Chip label="Deployed" size="small" color="primary" />
                  )}
                  {artwork.quality_review?.approved === false && (
                    <Chip label="Rejected" size="small" color="error" />
                  )}
                </Box>
              </CardContent>
              <CardActions>
                {!artwork.quality_review?.approved && artwork.status === 'completed' && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(artwork)}
                      disabled={processingId === artwork.asset_id}
                      startIcon={processingId === artwork.asset_id ? <CircularProgress size={16} /> : null}
                    >
                      Approve & Deploy
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleReject(artwork)}
                      disabled={processingId === artwork.asset_id}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {artwork.quality_review?.approved && (
                  <Typography variant="caption" color="success.main" sx={{ px: 1 }}>
                    ✓ Deployed to reflection page
                  </Typography>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// Generation History Tab
function GenerationHistoryTab({ history }) {
  if (history.length === 0) {
    return <Alert severity="info">No generation history yet</Alert>;
  }

  return (
    <List>
      {history.map((item) => (
        <Paper key={item._id} sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip
                  label={item.request_type}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={item.status}
                  size="small"
                  color={
                    item.status === 'completed' ? 'success' :
                    item.status === 'partial' ? 'warning' :
                    item.status === 'failed' ? 'error' : 'default'
                  }
                />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {item.scope.art_type.replace('_', ' ')} - {item.scope.batch_size} items
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(item.createdAt).toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                <Typography variant="caption">
                  ✅ {item.results.successful} successful
                </Typography>
                <Typography variant="caption">
                  ❌ {item.results.failed} failed
                </Typography>
                <Typography variant="caption">
                  💰 ${item.costs.total_cost_usd?.toFixed(4) || '0.0000'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      ))}
    </List>
  );
}

// Generate Art Dialog
function GenerateArtDialog({ open, onClose, onGenerate, generating }) {
  const [artType, setArtType] = useState('daily_reflection');
  const [styleLevel, setStyleLevel] = useState('moderate');
  const [referenceValue, setReferenceValue] = useState('');

  const handleSubmit = () => {
    const request = {
      request_type: 'single',
      art_type: artType,
      generation_items: [{
        reference_key: artType === 'daily_reflection' ? 'date' :
                       artType === 'step_illustration' ? 'step_number' :
                       artType === 'milestone_badge' ? 'milestone_type' : 'season',
        reference_value: referenceValue,
        content_data: {
          text: 'Sample content for generation',
        },
      }],
      configuration: {
        ghibli_style_level: styleLevel,
        quality_setting: 'standard',
        auto_approve: true,
        manual_review_required: false,
      },
    };

    onGenerate(request);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate New Artwork</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Art Type</InputLabel>
            <Select
              value={artType}
              label="Art Type"
              onChange={(e) => setArtType(e.target.value)}
            >
              <MenuItem value="daily_reflection">Daily Reflection</MenuItem>
              <MenuItem value="step_illustration">Step Illustration</MenuItem>
              <MenuItem value="milestone_badge">Milestone Badge</MenuItem>
              <MenuItem value="seasonal_graphic">Seasonal Graphic</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={
              artType === 'daily_reflection' ? 'Date (YYYY-MM-DD)' :
              artType === 'step_illustration' ? 'Step Number (1-12)' :
              artType === 'milestone_badge' ? 'Milestone Type' : 'Season'
            }
            value={referenceValue}
            onChange={(e) => setReferenceValue(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Brand Style Level</InputLabel>
            <Select
              value={styleLevel}
              label="Brand Style Level"
              onChange={(e) => setStyleLevel(e.target.value)}
            >
              <MenuItem value="subtle">Subtle</MenuItem>
              <MenuItem value="moderate">Moderate</MenuItem>
              <MenuItem value="strong">Strong</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={generating || !referenceValue}
          startIcon={generating ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {generating ? 'Generating...' : 'Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
