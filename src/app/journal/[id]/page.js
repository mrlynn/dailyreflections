'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Rating
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import MoodIcon from '@mui/icons-material/Mood';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import Link from 'next/link';
import { format } from 'date-fns';

export default function JournalEntryDetailPage() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/journal');
    }
  }, [status, router]);

  // Fetch entry when component mounts
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchEntry();
    }
  }, [status, id]);

  // Fetch journal entry by ID
  const fetchEntry = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/journal/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Journal entry not found');
        }
        throw new Error('Failed to fetch journal entry');
      }

      const data = await response.json();
      setEntry(data.entry);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Handle delete dialog
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Handle delete entry
  const handleDeleteEntry = async () => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }

      // Close dialog and redirect to journal listing
      handleDeleteDialogClose();
      router.push('/journal');
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      setError('Failed to delete journal entry. Please try again.');
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Get mood text
  const getMoodText = (mood) => {
    if (mood >= 4) return 'Good';
    if (mood >= 3) return 'Neutral';
    return 'Challenging';
  };

  // Get mood icon
  const getMoodIcon = (mood) => {
    if (mood >= 4) return <MoodIcon color="success" />;
    if (mood >= 3) return <SentimentNeutralIcon color="warning" />;
    return <MoodBadIcon color="error" />;
  };

  // Get card background color based on mood
  const getMoodColor = (mood) => {
    if (mood >= 4) return '#e8f5e9'; // Light green for good mood
    if (mood >= 3) return '#fff3e0'; // Light orange for neutral mood
    return '#ffebee'; // Light red for bad mood
  };

  // If not authenticated or loading, show loading
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // If loading entry
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // If error occurred
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          component={Link}
          href="/journal"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Journal
        </Button>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  // If entry not found
  if (!entry) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          component={Link}
          href="/journal"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Journal
        </Button>
        <Alert severity="warning">
          Journal entry not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }} className="journal-detail-page">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/journal" style={{ textDecoration: 'none', color: 'inherit' }}>
          Journal
        </Link>
        <Typography color="text.primary">{formatDate(entry.date)}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          {formatDate(entry.date)}
        </Typography>
        <Box>
          <Tooltip title="Edit Entry">
            <IconButton onClick={() => router.push(`/journal/edit/${id}`)} sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Entry">
            <IconButton onClick={handlePrint} sx={{ mr: 1 }} className="print-button">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Entry">
            <IconButton onClick={handleDeleteDialogOpen} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Entry Type Badge */}
      <Box mb={3} display="flex" alignItems="center">
        <Chip
          label={entry.entryType === 'full' ? 'Full Inventory' : entry.entryType === 'quick' ? 'Quick Entry' : 'Check-in'}
          sx={{ mr: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          {entry.isPrivate ? 'Private Entry' : 'Shared Entry'}
        </Typography>
      </Box>

      {/* Mood and Gratitude Summary */}
      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 3,
            backgroundColor: getMoodColor(entry.mood),
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Daily Check-in
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box mr={2}>
                  {getMoodIcon(entry.mood)}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mood
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Rating
                      value={entry.mood}
                      readOnly
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body1">
                      {getMoodText(entry.mood)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Gratitude
              </Typography>
              {entry.gratitude && entry.gratitude.length > 0 ? (
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {entry.gratitude.map((item, index) => (
                    <Box component="li" key={index} sx={{ mb: 0.5 }}>
                      <Typography variant="body1">{item}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No gratitude items recorded.
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Main Entry Content */}
      <Grid container spacing={4}>
        {/* Left column - inventory */}
        <Grid item xs={12} md={entry.entryType === 'check-in' ? 12 : 7}>
          {entry.entryType !== 'check-in' && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Daily Inventory
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* Inventory sections */}
              {entry.inventory && Object.keys(entry.inventory).length > 0 && (
                <Box>
                  {['resentments', 'fears', 'honesty', 'amends', 'service', 'prayer', 'selfishness', 'dishonesty', 'self_seeking', 'fear'].map((field) => {
                    // Skip empty fields
                    if (!entry.inventory[field]) return null;

                    return (
                      <Box key={field} mb={3}>
                        <Typography
                          variant="h6"
                          sx={{
                            textTransform: 'capitalize',
                            mb: 1
                          }}
                        >
                          {field === 'self_seeking' ? 'Self-Seeking' : field}
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {entry.inventory[field]}
                        </Typography>
                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    );
                  })}
                </Box>
              )}

              {(!entry.inventory || Object.keys(entry.inventory).every(key => !entry.inventory[key])) && (
                <Typography variant="body2" color="text.secondary">
                  No inventory details recorded.
                </Typography>
              )}
            </Paper>
          )}

          {/* Reflections */}
          <Paper sx={{ p: 3, mb: { xs: 4, md: 0 } }}>
            <Typography variant="h5" gutterBottom>
              Reflections
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {entry.reflections ? (
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {entry.reflections}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No reflections recorded.
              </Typography>
            )}

            {/* Promises noticed */}
            {entry.promises && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Promises Noticed
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {entry.promises}
                </Typography>
              </Box>
            )}

            {/* Areas for improvement */}
            {entry.improvements && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Areas for Improvement
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {entry.improvements}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right column - assets and metadata */}
        {entry.entryType !== 'check-in' && (
          <Grid item xs={12} md={5}>
            {/* Character Assets */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Character Assets
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {entry.assets && entry.assets.length > 0 ? (
                  entry.assets.map(asset => (
                    <Chip
                      key={asset}
                      label={asset}
                      color="success"
                      variant="outlined"
                      icon={<FavoriteIcon />}
                      sx={{ m: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No character assets recorded.
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* Tags */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {entry.tags && entry.tags.length > 0 ? (
                  entry.tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      sx={{ m: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags added.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Navigation buttons */}
      <Box mt={4} display="flex" justifyContent="space-between">
        <Button
          component={Link}
          href="/journal"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Journal
        </Button>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Journal Entry</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this journal entry? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>
            Cancel
          </Button>
          <Button onClick={handleDeleteEntry} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}