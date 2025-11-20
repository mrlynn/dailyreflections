'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import BigBookCommentItem from './BigBookCommentItem';
import BigBookCommentForm from './BigBookCommentForm';

export default function BigBookCommentList({ pageNumber }) {
  const commentsEnabled = useFeatureFlag('BIGBOOK', 'COMMENTS');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyAuthor, setReplyAuthor] = useState('');

  useEffect(() => {
    if (commentsEnabled) {
      fetchComments();
    }
  }, [pageNumber, commentsEnabled]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bigbook/comments?pageNumber=${pageNumber}`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();

      // Build comment tree
      const commentTree = buildCommentTree(data.comments);
      setComments(commentTree);
      setError(null);
    } catch (err) {
      console.error('Error fetching Big Book comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical comment tree from flat array
  const buildCommentTree = (flatComments) => {
    if (!Array.isArray(flatComments)) return [];

    const commentMap = {};
    const roots = [];

    // Create map of all comments
    flatComments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, children: [] };
    });

    // Build tree structure
    flatComments.forEach((comment) => {
      const node = commentMap[comment.id];
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const handleReply = (commentId, author) => {
    setReplyTo(commentId);
    setReplyAuthor(author);
  };

  const handleCommentSubmitted = () => {
    setReplyTo(null);
    fetchComments(); // Refresh comments
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyAuthor('');
  };

  // If comments feature is disabled
  if (!commentsEnabled) {
    return null;
  }

  if (loading && comments.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, mt: 1 }}>
        <Typography variant="h6" gutterBottom>
          Public Comments
        </Typography>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        Public Comments
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Share your thoughts and insights about this page with the community.
        These comments are public and can be seen by all users.
      </Typography>
      {/* New Comment Form (top level) */}
      <BigBookCommentForm
        pageNumber={pageNumber}
        onSubmitted={handleCommentSubmitted}
      />

      <Divider sx={{ my: 3 }} />

      {error ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No comments yet. Be the first to share your thoughts on this page!
        </Typography>
      ) : (
        <Box>
          {comments.map((comment) => (
            <BigBookCommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              depth={0}
            />
          ))}
        </Box>
      )}

      {/* Reply Form */}
      {replyTo && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Replying to {replyAuthor}
          </Typography>
          <BigBookCommentForm
            pageNumber={pageNumber}
            parentId={replyTo}
            onSubmitted={handleCommentSubmitted}
            onCancel={handleCancelReply}
          />
        </Box>
      )}
    </Paper>
  );
}