'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

export default function RAGSourcesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSource, setCurrentSource] = useState(null);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'delete', 'view'

  const [embedStatus, setEmbedStatus] = useState({
    running: false,
    progress: 0,
    total: 0,
  });

  // Fetch sources based on active tab
  useEffect(() => {
    fetchSources();
  }, [activeTab]);

  const fetchSources = async () => {
    setLoading(true);
    // In a real implementation, this would call an API
    // For now, we'll simulate with mock data
    setTimeout(() => {
      const mockSources = [
        {
          id: 'aa_big_book',
          name: 'AA Big Book 4th Edition',
          description: 'The primary text of Alcoholics Anonymous',
          type: activeTab === 0 ? 'book' : 'reflection',
          chunks: 378,
          lastUpdated: '2023-12-15',
          status: 'active',
        },
        {
          id: 'twelve_steps_twelve_traditions',
          name: 'Twelve Steps and Twelve Traditions',
          description: 'Twelve Steps and Twelve Traditions of Alcoholics Anonymous',
          type: activeTab === 0 ? 'book' : 'reflection',
          chunks: 196,
          lastUpdated: '2023-12-15',
          status: 'active',
        },
        {
          id: 'daily_reflections',
          name: 'Daily Reflections',
          description: 'A collection of 366 daily readings',
          type: activeTab === 0 ? 'book' : 'reflection',
          chunks: 366,
          lastUpdated: '2024-01-10',
          status: 'active',
        }
      ];

      setSources(mockSources);
      setLoading(false);
    }, 1000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (mode, source = null) => {
    setDialogMode(mode);
    setCurrentSource(source);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSource(null);
  };

  const handleRegenerateEmbeddings = (sourceId) => {
    // In a real implementation, this would start a background job
    setEmbedStatus({
      running: true,
      progress: 0,
      total: 100,
    });

    // Simulate progress
    const interval = setInterval(() => {
      setEmbedStatus((prev) => {
        const newProgress = prev.progress + Math.floor(Math.random() * 5) + 1;

        if (newProgress >= 100) {
          clearInterval(interval);
          return { running: false, progress: 100, total: 100 };
        }

        return { ...prev, progress: newProgress };
      });
    }, 500);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
          RAG Sources Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
            onClick={fetchSources}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Source
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Book Sources" />
          <Tab label="Daily Reflections" />
        </Tabs>
      </Paper>

      {embedStatus.running && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Generating embeddings... {embedStatus.progress}% complete
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Chunks</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <TextSnippetIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography fontWeight={500}>{source.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{source.description}</TableCell>
                  <TableCell align="center">{source.chunks.toLocaleString()}</TableCell>
                  <TableCell>{source.lastUpdated}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={source.status}
                      color={source.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleOpenDialog('view', source)}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Source">
                      <IconButton onClick={() => handleOpenDialog('edit', source)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Regenerate Embeddings">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => handleRegenerateEmbeddings(source.id)}
                          disabled={embedStatus.running}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete Source">
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDialog('delete', source)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Source Dialog - Add/Edit/View/Delete */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' && 'Add New Source'}
          {dialogMode === 'edit' && 'Edit Source'}
          {dialogMode === 'view' && 'Source Details'}
          {dialogMode === 'delete' && 'Delete Source'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'delete' ? (
            <DialogContentText>
              Are you sure you want to delete the source "{currentSource?.name}"? This action cannot be undone.
            </DialogContentText>
          ) : (
            <Box sx={{ pt: 1 }}>
              {dialogMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Source ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentSource?.id}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentSource?.name}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentSource?.description}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentSource?.type === 'book' ? 'Book Source' : 'Daily Reflection'}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Chunks
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentSource?.chunks.toLocaleString()}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {currentSource?.lastUpdated}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Status
                  </Typography>
                  <Chip
                    label={currentSource?.status}
                    color={currentSource?.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
              ) : (
                <Box component="form" noValidate sx={{ mt: 1 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Source Name"
                    name="name"
                    autoFocus
                    defaultValue={currentSource?.name || ''}
                    disabled={dialogMode === 'view'}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="description"
                    label="Description"
                    name="description"
                    multiline
                    rows={3}
                    defaultValue={currentSource?.description || ''}
                    disabled={dialogMode === 'view'}
                  />
                  <TextField
                    margin="normal"
                    select
                    fullWidth
                    id="type"
                    label="Source Type"
                    name="type"
                    SelectProps={{
                      native: true,
                    }}
                    defaultValue={currentSource?.type || 'book'}
                    disabled={dialogMode === 'view'}
                  >
                    <option value="book">Book Source</option>
                    <option value="reflection">Daily Reflection</option>
                  </TextField>
                  <TextField
                    margin="normal"
                    select
                    fullWidth
                    id="status"
                    label="Status"
                    name="status"
                    SelectProps={{
                      native: true,
                    }}
                    defaultValue={currentSource?.status || 'active'}
                    disabled={dialogMode === 'view'}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </TextField>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              variant="contained"
              color={dialogMode === 'delete' ? 'error' : 'primary'}
              onClick={handleCloseDialog}
            >
              {dialogMode === 'add' && 'Add Source'}
              {dialogMode === 'edit' && 'Save Changes'}
              {dialogMode === 'delete' && 'Delete'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}