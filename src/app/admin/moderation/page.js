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
  Card,
  CardContent,
  Avatar,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Pagination,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentComment, setCurrentComment] = useState(null);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'reject', 'delete'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch comments based on active tab
  useEffect(() => {
    fetchComments();
  }, [activeTab, page, filterStatus]);

  const fetchComments = async () => {
    setLoading(true);
    // In a real implementation, this would call an API
    // For now, we'll simulate with mock data
    setTimeout(() => {
      const mockComments = Array(10).fill().map((_, index) => ({
        id: `comment-${index + (page - 1) * 10}`,
        content: `This is a comment about recovery and the daily reflection. Some people share very personal stories here about their journey. This is comment #${index + (page - 1) * 10}.`,
        user: {
          id: `user-${index % 5}`,
          name: `User ${index % 5}`,
          avatar: null,
        },
        dateKey: '05-15',
        reflectionTitle: 'Spiritual Growth',
        createdAt: '2023-05-15T14:30:00Z',
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
        flags: Math.floor(Math.random() * 3),
        reports: Math.floor(Math.random() * 5),
      }));

      // Filter by status if needed
      const filtered = filterStatus === 'all'
        ? mockComments
        : mockComments.filter(c => c.status === filterStatus);

      setComments(filtered);
      setTotalPages(5); // In a real implementation, this would be calculated
      setLoading(false);
    }, 1000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handleOpenDialog = (mode, comment) => {
    setDialogMode(mode);
    setCurrentComment(comment);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentComment(null);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(1);
  };

  const handleApprove = (commentId) => {
    // In a real implementation, this would call an API
    setComments(comments.map(comment =>
      comment.id === commentId
        ? { ...comment, status: 'approved' }
        : comment
    ));
  };

  const handleReject = (commentId, reason = '') => {
    // In a real implementation, this would call an API
    setComments(comments.map(comment =>
      comment.id === commentId
        ? { ...comment, status: 'rejected' }
        : comment
    ));
    handleCloseDialog();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
          Comment Moderation
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchComments}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => {}}
          >
            Filters
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
          <Tab label="All Comments" />
          <Tab label="Pending Review" />
          <Tab label="Reported" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={handleFilterChange}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Showing {comments.length} comments
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {comments.map((comment) => (
            <Card key={comment.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center">
                    <Avatar src={comment.user.avatar} sx={{ mr: 1 }}>
                      {comment.user.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{comment.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(comment.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Chip
                      size="small"
                      label={comment.status.toUpperCase()}
                      color={
                        comment.status === 'approved'
                          ? 'success'
                          : comment.status === 'rejected'
                          ? 'error'
                          : 'default'
                      }
                      sx={{ mr: 1 }}
                    />
                    {comment.flags > 0 && (
                      <Chip
                        size="small"
                        icon={<FlagIcon fontSize="small" />}
                        label={`${comment.flags} flags`}
                        color="warning"
                        sx={{ mr: 1 }}
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">{comment.content}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    On: {comment.dateKey} - {comment.reflectionTitle}
                  </Typography>
                  <Box>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleOpenDialog('view', comment)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {comment.status !== 'approved' && (
                      <Tooltip title="Approve Comment">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(comment.id)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {comment.status !== 'rejected' && (
                      <Tooltip title="Reject Comment">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenDialog('reject', comment)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Comment">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDialog('delete', comment)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

      {/* Comment Dialog - View/Reject/Delete */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'view' && 'Comment Details'}
          {dialogMode === 'reject' && 'Reject Comment'}
          {dialogMode === 'delete' && 'Delete Comment'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'delete' ? (
            <DialogContentText>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogContentText>
          ) : dialogMode === 'reject' ? (
            <Box sx={{ pt: 1 }}>
              <DialogContentText sx={{ mb: 2 }}>
                Please provide a reason for rejecting this comment:
              </DialogContentText>
              <TextField
                fullWidth
                label="Reason for rejection"
                multiline
                rows={4}
                variant="outlined"
              />
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Comment
              </Typography>
              <Typography variant="body1" paragraph>
                {currentComment?.content}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    User
                  </Typography>
                  <Typography variant="body1">{currentComment?.user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {currentComment?.user.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Posted On
                  </Typography>
                  <Typography variant="body1">
                    {currentComment && formatDate(currentComment.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Status
                  </Typography>
                  <Chip
                    label={currentComment?.status.toUpperCase()}
                    color={
                      currentComment?.status === 'approved'
                        ? 'success'
                        : currentComment?.status === 'rejected'
                        ? 'error'
                        : 'default'
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Reflection
                  </Typography>
                  <Typography variant="body1">
                    {currentComment?.dateKey} - {currentComment?.reflectionTitle}
                  </Typography>
                </Grid>
              </Grid>
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
              onClick={() => {
                if (dialogMode === 'reject') {
                  handleReject(currentComment?.id);
                } else if (dialogMode === 'delete') {
                  // Handle delete
                  handleCloseDialog();
                }
              }}
            >
              {dialogMode === 'reject' && 'Reject Comment'}
              {dialogMode === 'delete' && 'Delete Comment'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}