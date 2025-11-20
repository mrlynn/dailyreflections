'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FilterListIcon from '@mui/icons-material/FilterList';

// Sample categories for quick responses
const CATEGORIES = [
  { id: 'general', name: 'General' },
  { id: 'greetings', name: 'Greetings' },
  { id: 'steps', name: 'Steps & Traditions' },
  { id: 'resources', name: 'Resources' },
  { id: 'meetings', name: 'Meetings' },
  { id: 'encouragement', name: 'Encouragement' },
  { id: 'crisis', name: 'Crisis Help' },
  { id: 'custom', name: 'My Responses' }
];

// Sample responses data structure
const SAMPLE_RESPONSES = [
  {
    id: 'resp1',
    title: 'Welcome Message',
    content: 'Hello, thank you for reaching out. I\'m a volunteer here to support you. How can I help today?',
    category: 'greetings',
    tags: ['welcome', 'introduction'],
    isFavorite: true,
    isCustom: false
  },
  {
    id: 'resp2',
    title: 'Step 1 Explanation',
    content: 'Step 1 is about acknowledging powerlessness over alcohol and recognizing that our lives had become unmanageable. It\'s the foundation of recovery.',
    category: 'steps',
    tags: ['step1', 'powerlessness'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'resp3',
    title: 'Find Local Meetings',
    content: 'Finding a local meeting can be very helpful. You can use the AA Meeting Finder at aa.org or I can help you locate meetings in your area if you\'d like.',
    category: 'meetings',
    tags: ['meetings', 'support'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'resp4',
    title: 'Daily Reflection Suggestion',
    content: 'Have you tried reading the Daily Reflections? Many find it helpful to start their day with a brief reading and reflection.',
    category: 'resources',
    tags: ['literature', 'daily'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'resp5',
    title: 'One Day at a Time',
    content: 'Remember, recovery is about taking things one day at a time. Sometimes even one hour or one minute at a time.',
    category: 'encouragement',
    tags: ['slogan', 'support'],
    isFavorite: true,
    isCustom: false
  },
  {
    id: 'resp6',
    title: 'Crisis Resources',
    content: 'If you\'re feeling in crisis, please consider reaching out to the National Helpline at 1-800-662-HELP (4357). They are available 24/7.',
    category: 'crisis',
    tags: ['emergency', 'help'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'custom1',
    title: 'My Personal Story',
    content: 'I found that sharing my experience with a sponsor was incredibly helpful. Having someone who had been through it before made all the difference for me.',
    category: 'custom',
    tags: ['personal', 'story'],
    isFavorite: false,
    isCustom: true
  }
];

/**
 * QuickResponse component displays a single quick response with options to use or edit it
 */
function QuickResponse({ response, onUse, onEdit, onDelete, onToggleFavorite }) {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleUse = () => {
    onUse(response);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit(response);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(response);
    handleMenuClose();
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    onToggleFavorite(response);
  };

  return (
    <Card
      elevation={1}
      sx={{
        mb: 2,
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ pb: 1, pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box onClick={handleExpandToggle} sx={{ cursor: 'pointer', flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 600 }}>
              {response.title}
              {response.isFavorite && (
                <StarIcon fontSize="small" color="primary" sx={{ ml: 0.5, verticalAlign: 'text-top' }} />
              )}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: !expanded ? 'hidden' : 'visible',
                textOverflow: 'ellipsis',
                display: !expanded ? '-webkit-box' : 'block',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {response.content}
            </Typography>
          </Box>

          <Box>
            <Tooltip title={response.isFavorite ? "Remove from favorites" : "Add to favorites"}>
              <IconButton size="small" onClick={handleFavoriteToggle}>
                {response.isFavorite ?
                  <FavoriteIcon fontSize="small" color="primary" /> :
                  <FavoriteBorderIcon fontSize="small" />
                }
              </IconButton>
            </Tooltip>

            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto">
          <Box sx={{ mt: 2 }}>
            {response.tags && response.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {response.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5, pt: 0 }}>
        <Button
          size="small"
          onClick={handleExpandToggle}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? "Show Less" : "Show More"}
        </Button>

        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={handleUse}
          endIcon={<SendIcon fontSize="small" />}
        >
          Use
        </Button>
      </CardActions>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUse} dense>
          <ListItemText primary="Use This Response" />
        </MenuItem>
        <MenuItem onClick={() => {navigator.clipboard.writeText(response.content); handleMenuClose();}} dense>
          <ListItemText primary="Copy to Clipboard" />
        </MenuItem>
        {response.isCustom && (
          <MenuItem onClick={handleEdit} dense>
            <ListItemText primary="Edit Response" />
          </MenuItem>
        )}
        {response.isCustom && (
          <MenuItem onClick={handleDelete} dense>
            <ListItemText primary="Delete Response" />
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

/**
 * QuickResponseForm component for creating and editing quick responses
 */
function QuickResponseForm({ response = null, onSave, onCancel }) {
  const [title, setTitle] = useState(response ? response.title : '');
  const [content, setContent] = useState(response ? response.content : '');
  const [category, setCategory] = useState(response ? response.category : 'custom');
  const [tags, setTags] = useState(response ? response.tags.join(', ') : '');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!content.trim()) newErrors.content = "Content is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process tags
    const processedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const newResponse = {
      id: response ? response.id : `custom${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      category,
      tags: processedTags,
      isFavorite: response ? response.isFavorite : false,
      isCustom: true
    };

    onSave(newResponse);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Title"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
        placeholder="Brief, descriptive title"
      />

      <TextField
        label="Content"
        fullWidth
        multiline
        rows={4}
        margin="normal"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        error={!!errors.content}
        helperText={errors.content}
        placeholder="Write your response message here"
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          label="Category"
        >
          {CATEGORIES.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Tags"
        fullWidth
        margin="normal"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Enter tags separated by commas"
        helperText="Optional: Add tags to make finding this response easier"
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="primary">
          {response ? 'Update' : 'Create'} Response
        </Button>
      </Box>
    </form>
  );
}

/**
 * QuickResponses component for managing and using quick responses in volunteer chat
 */
export default function QuickResponses({ onUseResponse }) {
  const [responses, setResponses] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Fetch responses data
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // For now, use the sample data
        setTimeout(() => {
          setResponses(SAMPLE_RESPONSES);
          setLoading(false);
        }, 500); // Simulate API delay
      } catch (err) {
        console.error('Error fetching responses:', err);
        setError('Failed to load quick responses');
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);

  // Filter responses when search query, category, or favorites filter changes
  useEffect(() => {
    let result = [...responses];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(response => response.category === selectedCategory);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      result = result.filter(response => response.isFavorite);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(response =>
        response.title.toLowerCase().includes(query) ||
        response.content.toLowerCase().includes(query) ||
        response.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredResponses(result);
  }, [responses, searchQuery, selectedCategory, showFavoritesOnly]);

  const handleUseResponse = (response) => {
    if (onUseResponse) {
      onUseResponse(response.content);

      // Show notification
      setNotification({
        open: true,
        message: 'Response inserted into message',
        severity: 'success'
      });
    }
  };

  const handleAddResponse = () => {
    setCurrentResponse(null);
    setIsFormDialogOpen(true);
  };

  const handleEditResponse = (response) => {
    setCurrentResponse(response);
    setIsFormDialogOpen(true);
  };

  const handleDeletePrompt = (response) => {
    setResponseToDelete(response);
    setDeleteDialogOpen(true);
  };

  const handleDeleteResponse = () => {
    setResponses(responses.filter(r => r.id !== responseToDelete.id));
    setDeleteDialogOpen(false);
    setResponseToDelete(null);

    // Show notification
    setNotification({
      open: true,
      message: 'Response deleted successfully',
      severity: 'success'
    });
  };

  const handleSaveResponse = (response) => {
    if (response.id && responses.some(r => r.id === response.id)) {
      // Update existing response
      setResponses(responses.map(r => r.id === response.id ? response : r));
      setNotification({
        open: true,
        message: 'Response updated successfully',
        severity: 'success'
      });
    } else {
      // Add new response
      setResponses([...responses, response]);
      setNotification({
        open: true,
        message: 'New response created successfully',
        severity: 'success'
      });
    }

    setIsFormDialogOpen(false);
  };

  const handleToggleFavorite = (response) => {
    const updatedResponse = { ...response, isFavorite: !response.isFavorite };
    setResponses(responses.map(r => r.id === response.id ? updatedResponse : r));
  };

  // Get the category name from its ID
  const getCategoryName = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Group responses by category for display
  const getResponsesByCategory = () => {
    const grouped = {};

    filteredResponses.forEach(response => {
      if (!grouped[response.category]) {
        grouped[response.category] = [];
      }
      grouped[response.category].push(response);
    });

    return grouped;
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Quick Responses</Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddResponse}
        >
          New Response
        </Button>
      </Box>

      {/* Search and filters */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Search responses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 1 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {CATEGORIES.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip
            icon={<FavoriteIcon />}
            label="Favorites"
            clickable
            color={showFavoritesOnly ? "primary" : "default"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            variant={showFavoritesOnly ? "filled" : "outlined"}
          />

          {(searchQuery || selectedCategory !== 'all' || showFavoritesOnly) && (
            <Chip
              label="Clear Filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setShowFavoritesOnly(false);
              }}
              size="small"
              variant="outlined"
            />
          )}

          <Box sx={{ ml: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredResponses.length} results
            </Typography>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : filteredResponses.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No responses found
          </Typography>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              sx={{ mt: 1 }}
              size="small"
            >
              Clear Search
            </Button>
          )}
        </Box>
      ) : selectedCategory === 'all' && !searchQuery ? (
        // Display responses grouped by category
        Object.entries(getResponsesByCategory()).map(([categoryId, categoryResponses]) => (
          <Box key={categoryId} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              {getCategoryName(categoryId)}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({categoryResponses.length})
              </Typography>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {categoryResponses.map((response) => (
              <QuickResponse
                key={response.id}
                response={response}
                onUse={handleUseResponse}
                onEdit={handleEditResponse}
                onDelete={handleDeletePrompt}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </Box>
        ))
      ) : (
        // Display filtered results ungrouped
        filteredResponses.map((response) => (
          <QuickResponse
            key={response.id}
            response={response}
            onUse={handleUseResponse}
            onEdit={handleEditResponse}
            onDelete={handleDeletePrompt}
            onToggleFavorite={handleToggleFavorite}
          />
        ))
      )}

      {/* New/Edit Response Dialog */}
      <Dialog
        open={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {currentResponse ? 'Edit Response' : 'Create New Response'}
        </DialogTitle>
        <DialogContent>
          <QuickResponseForm
            response={currentResponse}
            onSave={handleSaveResponse}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Response</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{responseToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteResponse} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}