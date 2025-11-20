'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const BOOKMARKS_PATH = '/api/bigbook/bookmarks';

/**
 * A sidebar component that displays the user's bookmarks
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the drawer is open
 * @param {Function} props.onClose - Function to call when closing the drawer
 * @param {Function} props.onNavigate - Function to call when navigating to a page
 */
export default function BookmarkList({ open, onClose, onNavigate }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(null);

  // Load bookmarks when the drawer opens
  useEffect(() => {
    if (open) {
      loadBookmarks();
    }
  }, [open]);

  // Function to load bookmarks from the API
  const loadBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(BOOKMARKS_PATH, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your bookmarks.');
        }
        throw new Error('Failed to load bookmarks.');
      }

      const data = await response.json();

      if (Array.isArray(data.bookmarks)) {
        // Sort bookmarks by page number
        const sortedBookmarks = [...data.bookmarks].sort(
          (a, b) => a.pageNumber - b.pageNumber
        );
        setBookmarks(sortedBookmarks);
      } else {
        setBookmarks([]);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setError(err.message || 'Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a bookmark
  const handleDeleteBookmark = async (id, pageNumber) => {
    setDeleteInProgress(id);
    try {
      const params = new URLSearchParams({ pageNumber: pageNumber.toString() });
      const response = await fetch(`${BOOKMARKS_PATH}?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark.');
      }

      // Remove the deleted bookmark from the list
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    } finally {
      setDeleteInProgress(null);
    }
  };

  // Function to navigate to a bookmarked page
  const handleNavigate = (pageNumber) => {
    if (onNavigate) {
      onNavigate(pageNumber);
    }
    onClose(); // Close the drawer after navigating
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 360 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <BookmarkIcon color="primary" />
            <Typography variant="h6" component="h2">
              Your Bookmarks
            </Typography>
          </Stack>
          <IconButton edge="end" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" paragraph>
            {error}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadBookmarks}
          >
            Try Again
          </Button>
        </Box>
      ) : bookmarks.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <MenuBookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have any bookmarks yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the bookmark icon while reading to save your place.
          </Typography>
        </Box>
      ) : (
        <List>
          {bookmarks.map((bookmark) => (
            <ListItem
              key={bookmark.id}
              secondaryAction={
                <Tooltip title="Remove bookmark">
                  <IconButton
                    edge="end"
                    aria-label="delete bookmark"
                    onClick={() => handleDeleteBookmark(bookmark.id, bookmark.pageNumber)}
                    disabled={deleteInProgress === bookmark.id}
                    size="small"
                  >
                    {deleteInProgress === bookmark.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteOutlineIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              }
              disablePadding
            >
              <ListItemButton
                onClick={() => handleNavigate(bookmark.pageNumber)}
                dense
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BookmarkIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Page ${bookmark.pageNumber}`}
                  secondary={bookmark.label || `Bookmarked on ${new Date(bookmark.createdAt).toLocaleDateString()}`}
                  primaryTypographyProps={{
                    fontWeight: 'medium',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Drawer>
  );
}