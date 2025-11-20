'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

export default function CommentList({ dateKey }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyAuthor, setReplyAuthor] = useState('');

  useEffect(() => {
    fetchComments();
  }, [dateKey]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?dateKey=${dateKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      
      // Build comment tree
      const commentTree = buildCommentTree(data);
      setComments(commentTree);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical comment tree from flat array
  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const roots = [];

    // Create map of all comments
    flatComments.forEach((comment) => {
      commentMap[comment._id] = { ...comment, children: [] };
    });

    // Build tree structure
    flatComments.forEach((comment) => {
      const node = commentMap[comment._id];
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Comments
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* New Comment Form (top level) */}
      <CommentForm
        dateKey={dateKey}
        onSubmitted={handleCommentSubmitted}
      />

      <Divider sx={{ my: 3 }} />

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No comments yet. Be the first to share your thoughts!
        </Typography>
      ) : (
        <Box>
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
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
          <CommentForm
            dateKey={dateKey}
            parentId={replyTo}
            onSubmitted={handleCommentSubmitted}
            onCancel={handleCancelReply}
          />
        </Box>
      )}
    </Box>
  );
}

