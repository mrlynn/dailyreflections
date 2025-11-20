'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import PushPinIcon from '@mui/icons-material/PushPin';
import DOMPurify from 'dompurify';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { CIRCLE_VISIBILITY } from '@/lib/circles/constants';
import { stripHtmlToText } from '@/lib/sanitize';
import RichTextEditor from '@/components/Circles/RichTextEditor';

const tabs = ['Feed', 'Members', 'About'];

function VisibilityChip({ visibility }) {
  if (visibility === CIRCLE_VISIBILITY.PUBLIC) {
    return <Chip color="success" size="small" label="Public" icon={<PublicIcon fontSize="small" />} />;
  }
  return <Chip size="small" label="Invite only" icon={<LockIcon fontSize="small" />} />;
}

function MembershipBadge({ circle }) {
  if (circle.membership?.status === 'pending') {
    return <Chip size="small" color="warning" label="Pending approval" icon={<HourglassTopIcon />} />;
  }

  if (circle.membership?.role === 'owner') {
    return <Chip size="small" color="primary" label="Owner" />;
  }

  if (circle.membership?.role === 'admin') {
    return <Chip size="small" color="info" label="Admin" />;
  }

  if (circle.membership?.status === 'active') {
    return <Chip size="small" color="success" label="Member" />;
  }

  return null;
}

const sanitizeForDisplay = (html) => ({
  __html: DOMPurify.sanitize(html || ''),
});

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
}

const sortByCreatedAtDesc = (list) =>
  [...list].sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

const sortByPinnedAtDesc = (list) =>
  [...list].sort(
    (a, b) =>
      new Date(b.pinnedAt ?? b.createdAt ?? 0) - new Date(a.pinnedAt ?? a.createdAt ?? 0),
  );

function PostEditorForm({
  circle,
  mode = 'create',
  initialValues = {},
  onSubmit,
  submitting,
  onCancel,
}) {
  const initialType = initialValues?.type ?? 'share';
  const initialStepTag =
    initialValues?.stepTag !== undefined && initialValues?.stepTag !== null
      ? String(initialValues.stepTag)
      : '';
  const initialTagsInput = Array.isArray(initialValues?.tags)
    ? initialValues.tags.join(', ')
    : '';
  const initialContent = initialValues?.content ?? '';

  const [type, setType] = useState(initialType);
  const [stepTag, setStepTag] = useState(initialStepTag);
  const [tagsInput, setTagsInput] = useState(initialTagsInput);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState(null);

  useEffect(() => {
    setType(initialType);
    setStepTag(initialStepTag);
    setTagsInput(initialTagsInput);
    setContent(initialContent);
    setError(null);
  }, [initialType, initialStepTag, initialTagsInput, initialContent, mode]);

  const disabled =
    submitting ||
    (mode === 'create' && circle?.membership?.status !== 'active');

  const hasMeaningfulContent = stripHtmlToText(content).trim().length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!hasMeaningfulContent) {
      setError('Please share a few sentences with your circle.');
      return;
    }

    const rawTags = tagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const uniqueTags = [...new Set(rawTags)];

    const payload = {
      content,
      type,
      tags: uniqueTags,
    };

    if (type === 'step-experience' && stepTag) {
      payload.stepTag = Number.parseInt(stepTag, 10);
    }

    try {
      await onSubmit(payload);
      if (mode === 'create') {
        setContent('');
        setStepTag('');
        setTagsInput('');
        setType('share');
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to save your share.');
      if (mode === 'edit') {
        throw submitError;
      }
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {mode === 'create'
              ? `Share with ${circle?.name ?? 'your circle'}`
              : 'Edit your post'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Share experience, strength, and hope. Protect others’ anonymity and keep it solution-focused.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Post type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            sx={{ minWidth: 180 }}
            size="small"
            disabled={disabled}
          >
            <MenuItem value="share">Share</MenuItem>
            <MenuItem value="step-experience">Step experience</MenuItem>
            <MenuItem value="linked-entry" disabled={mode === 'create'}>
              Linked entry
            </MenuItem>
          </TextField>

          {type === 'step-experience' && (
            <TextField
              select
              label="Step"
              value={stepTag}
              onChange={(event) => setStepTag(event.target.value)}
              sx={{ minWidth: 120 }}
              size="small"
              disabled={disabled}
            >
              <MenuItem value="">No step tag</MenuItem>
              {Array.from({ length: 12 }).map((_, index) => (
                <MenuItem key={index + 1} value={index + 1}>
                  Step {index + 1}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Tags (comma separated)"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="gratitude, step10"
            helperText="Optional, visible to circle members"
            size="small"
            fullWidth
            disabled={disabled}
          />
        </Stack>

        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Share from your experience. Protect others’ anonymity and keep it honest."
          disabled={disabled}
          minHeight={150}
          key={mode === 'edit' ? `editor-${initialValues?.id || 'edit'}` : 'editor-create'}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          flexWrap="wrap"
          useFlexGap
        >
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={disabled}
            startIcon={<SendIcon />}
          >
            {submitting
              ? mode === 'create'
                ? 'Sharing…'
                : 'Saving…'
              : mode === 'create'
              ? 'Share with circle'
              : 'Save changes'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function CommentsSection({
  state = {},
  onToggle,
  onLoadMore,
  onSubmitComment,
  onEditComment,
  canComment,
  totalCount = 0,
}) {
  const { open, comments = [], loading, error, submitting, nextCursor } = state;
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [editError, setEditError] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!open) {
      setDraft('');
      setDraftError(null);
      setEditingCommentId(null);
      setEditDraft('');
    }
  }, [open]);

  const hasMeaningfulContent = (html) => stripHtmlToText(html).trim().length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSubmitComment) return;

    if (!hasMeaningfulContent(draft)) {
      setDraftError('Add a few words before posting.');
      return;
    }

    setDraftError(null);
    try {
      await onSubmitComment(draft);
      setDraft('');
      setDraftError(null);
    } catch (commentError) {
      setDraftError(commentError.message || 'Unable to add your comment.');
    }
  };

  const startEdit = (comment) => {
    if (!onEditComment) return;
    setEditingCommentId(comment.id);
    setEditDraft(comment.content || '');
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditDraft('');
    setEditError(null);
    setSavingEdit(false);
  };

  const handleSaveEdit = async (commentId) => {
    if (!onEditComment) return;
    if (!hasMeaningfulContent(editDraft)) {
      setEditError('Comments cannot be empty.');
      return;
    }

    setEditError(null);
    setSavingEdit(true);
    try {
      await onEditComment(commentId, editDraft);
      cancelEdit();
    } catch (err) {
      setEditError(err.message || 'Unable to update your comment.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button size="small" startIcon={<ChatBubbleOutlineIcon />} onClick={onToggle}>
        {open ? 'Hide comments' : `View comments (${totalCount})`}
      </Button>
      <Collapse in={open}>
        <Box sx={{ mt: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={18} />
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            {comments.map((comment) => {
              const isEditing = editingCommentId === comment.id;
              return (
                <Paper
                  key={comment.id}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1, borderColor: 'divider' }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar src={comment.author?.image ?? undefined} sx={{ width: 32, height: 32 }}>
                        {(comment.author?.displayName || comment.author?.name || 'M').slice(0, 1)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">
                          {comment.author?.displayName || comment.author?.name || 'Member'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(comment.createdAt)}
                        </Typography>
                      </Box>
                      {comment.canEdit && !isEditing && (
                        <Button size="small" onClick={() => startEdit(comment)}>
                          Edit
                        </Button>
                      )}
                    </Stack>

                    {isEditing ? (
                      <>
                        <RichTextEditor
                          value={editDraft}
                          onChange={setEditDraft}
                          minHeight={100}
                          placeholder="Update your comment"
                          disabled={savingEdit}
                          key={`comment-edit-${comment.id}`}
                        />
                        {editError && <Alert severity="error">{editError}</Alert>}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button onClick={cancelEdit} disabled={savingEdit}>
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={savingEdit}
                          >
                            {savingEdit ? 'Saving…' : 'Save'}
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1 }}
                        dangerouslySetInnerHTML={sanitizeForDisplay(comment.content)}
                      />
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          {nextCursor && (
            <Box sx={{ mt: 2 }}>
              <Button size="small" onClick={onLoadMore}>
                Load earlier comments
              </Button>
            </Box>
          )}

          {canComment && (
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                mt: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Stack spacing={1.5}>
                <RichTextEditor
                  value={draft}
                  onChange={setDraft}
                  minHeight={100}
                  placeholder="Add a comment"
                  disabled={submitting}
                />
                {draftError && <Alert severity="error">{draftError}</Alert>}
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting || !hasMeaningfulContent(draft)}
                    size="small"
                  >
                    {submitting ? 'Posting…' : 'Post comment'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function PostCard({
  circle,
  post,
  commentsState,
  onToggleComments,
  onLoadMoreComments,
  onSubmitComment,
  onEditComment,
  onEditPost,
  onPinPost,
  onUnpinPost,
  canComment,
}) {
  const commentState = commentsState[post.id] || {};
  const totalComments =
    post.commentCount ?? (commentState.comments ? commentState.comments.length : 0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const canManagePins = Boolean(post.canPin);
  const isPinned = Boolean(post.isPinned);

  const handlePinToggle = () => {
    if (!canManagePins) return;
    if (isPinned) {
      onUnpinPost?.(post.id);
    } else {
      onPinPost?.(post.id);
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditError(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaving(false);
    setEditError(null);
  };

  const handleSave = async (values) => {
    setSaving(true);
    setEditError(null);
    try {
      await onEditPost(post.id, values);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || 'Unable to update your post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        borderColor: isPinned ? 'warning.light' : undefined,
        backgroundColor: isPinned ? 'warning.50' : undefined,
      }}
    >
      <CardContent>
        {isEditing ? (
          <Stack spacing={2}>
            <PostEditorForm
              circle={circle}
              mode="edit"
              initialValues={{
                type: post.type,
                stepTag: post.stepTag,
                tags: post.tags,
                content: post.content,
              }}
              onSubmit={handleSave}
              submitting={saving}
              onCancel={cancelEdit}
            />
            {editError && <Alert severity="error">{editError}</Alert>}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={post.author?.image ?? undefined}>
                {(post.author?.displayName || post.author?.name || 'M').slice(0, 1)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {post.author?.displayName || post.author?.name || 'Member'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(post.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              {canManagePins && (
                <Tooltip title={isPinned ? 'Unpin post' : 'Pin post'}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handlePinToggle}
                      disabled={isPinned ? !onUnpinPost : !onPinPost}
                    >
                      <PushPinIcon
                        fontSize="small"
                        color={isPinned ? 'warning' : 'inherit'}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {post.canEdit && (
                <Button size="small" onClick={startEdit}>
                  Edit
                </Button>
              )}
              <Chip
                size="small"
                label={
                  post.type === 'step-experience'
                    ? 'Step experience'
                    : post.type === 'linked-entry'
                    ? 'Linked entry'
                    : 'Share'
                }
              />
              {post.stepTag && <Chip size="small" label={`Step ${post.stepTag}`} />}
            </Stack>

            <Typography
              variant="body1"
              sx={{
                '& p': { m: 0, mb: 1.2 },
                '& p:last-child': { mb: 0 },
              }}
              dangerouslySetInnerHTML={sanitizeForDisplay(post.content)}
            />

            {post.tags?.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {post.tags.map((tag) => (
                  <Chip key={tag} size="small" variant="outlined" label={`#${tag}`} />
                ))}
              </Stack>
            ) : null}

            {isPinned && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                icon={<PushPinIcon fontSize="small" />}
                label="Pinned"
                sx={{ alignSelf: 'flex-start' }}
              />
            )}

            <CommentsSection
              state={commentState}
              onToggle={() => onToggleComments(post.id)}
              onLoadMore={() => onLoadMoreComments(post.id)}
              onSubmitComment={(content) => onSubmitComment(post.id, content)}
              onEditComment={(commentId, content) => onEditComment(post.id, commentId, content)}
              canComment={canComment}
              totalCount={totalComments}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default function CircleDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const circlesEnabled = useFeatureFlag('CIRCLES');
  const { data: session, status } = useSession();

  const [tab, setTab] = useState(0);
  const [circle, setCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingCircle, setLoadingCircle] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const [joinStatus, setJoinStatus] = useState(null);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [postCursor, setPostCursor] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState({});

  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const canViewMembers = circle?.membership?.status === 'active';
  const canInvite =
    circle?.membership?.status === 'active' &&
    ['owner', 'admin'].includes(circle.membership.role);
  const canShare = circle?.membership?.status === 'active';
  const circleSlug = circle?.slug || slug;

  useEffect(() => {
    if (!circlesEnabled || !slug) {
      setLoadingCircle(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingCircle(true);
        const response = await fetch(`/api/circles/${slug}`, {
          credentials: 'include',
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Unable to load circle');
        }
        if (!cancelled) {
          setCircle(result.circle);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingCircle(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [circlesEnabled, slug, status]);

  useEffect(() => {
    if (!circle || !canViewMembers) {
      setMembers([]);
      setCommentsByPost({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingMembers(true);
        const response = await fetch(`/api/circles/${circle.slug}/members`, {
          credentials: 'include',
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Unable to load members');
        }
        if (!cancelled) {
          setMembers(Array.isArray(result.members) ? result.members : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingMembers(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [circle, canViewMembers]);

  useEffect(() => {
    if (!circleSlug || !canShare) {
      setPinnedPosts([]);
      setPosts([]);
      setPostCursor(null);
      setPostsError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingPosts(true);
        const response = await fetch(`/api/circles/${circleSlug}/posts`, {
          credentials: 'include',
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Unable to load posts');
        }
        if (!cancelled) {
          setPinnedPosts(Array.isArray(result.pinned) ? result.pinned : []);
          setPosts(Array.isArray(result.posts) ? result.posts : []);
          setPostCursor(result.nextCursor ?? null);
          setPostsError(null);
          setCommentsByPost({});
        }
      } catch (err) {
        if (!cancelled) {
          setPinnedPosts([]);
          setPosts([]);
          setPostCursor(null);
          setPostsError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingPosts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [circleSlug, canShare]);

  const memberPreview = useMemo(() => members.slice(0, 6), [members]);

  const handleJoinRequest = async () => {
    if (!slug) return;
    setJoinStatus(null);
    try {
      const response = await fetch(`/api/circles/${slug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit join request');
      }
      if (result.membership?.status === 'pending') {
        setJoinStatus('pending');
        setCircle((prev) =>
          prev
            ? {
                ...prev,
                membership: { status: 'pending' },
              }
            : prev,
        );
      } else {
        setJoinStatus('joined');
      }
    } catch (err) {
      setJoinStatus(`error:${err.message}`);
    }
  };

  const handleLeave = async () => {
    if (!slug) return;
    try {
      const response = await fetch(`/api/circles/${slug}/leave`, {
        method: 'POST',
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Unable to leave circle');
      }
      router.push('/circles');
    } catch (err) {
      setJoinStatus(`error:${err.message}`);
    }
  };

  const handlePinPost = async (postId) => {
    if (!circleSlug) return false;
    try {
      const response = await fetch(`/api/circles/${circleSlug}/posts/${postId}/pin`, {
        method: 'POST',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to pin post');
      }
      const pinnedPost = result.post;
      setPinnedPosts((prev) => {
        const filtered = prev.filter((post) => post.id !== pinnedPost.id);
        return sortByPinnedAtDesc([pinnedPost, ...filtered]);
      });
      setPosts((prev) => prev.filter((post) => post.id !== pinnedPost.id));
      setCommentsByPost((prev) =>
        prev[pinnedPost.id] ? prev : { ...prev, [pinnedPost.id]: {} },
      );
      setPostsError(null);
      return true;
    } catch (err) {
      setPostsError(err.message);
      return false;
    }
  };

  const handleUnpinPost = async (postId) => {
    if (!circleSlug) return false;
    try {
      const response = await fetch(`/api/circles/${circleSlug}/posts/${postId}/pin`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to unpin post');
      }
      const unpinnedPost = result.post;
      setPinnedPosts((prev) => prev.filter((post) => post.id !== unpinnedPost.id));
      setPosts((prev) => {
        const filtered = prev.filter((post) => post.id !== unpinnedPost.id);
        return sortByCreatedAtDesc([unpinnedPost, ...filtered]);
      });
      setPostsError(null);
      return true;
    } catch (err) {
      setPostsError(err.message);
      return false;
    }
  };

  const fetchMorePosts = async () => {
    if (!postCursor || !circleSlug) return;
    try {
      setLoadingMorePosts(true);
      const params = new URLSearchParams();
      params.set('cursor', postCursor);
      const query = params.toString();
      const response = await fetch(
        `/api/circles/${circleSlug}/posts${query ? `?${query}` : ''}`,
        {
          credentials: 'include',
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to load more posts');
      }
      const fetched = Array.isArray(result.posts) ? result.posts : [];
      setPosts((prev) => {
        const existing = new Set(prev.map((post) => post.id));
        const merged = [...prev];
        fetched.forEach((post) => {
          if (!existing.has(post.id)) {
            merged.push(post);
          }
        });
        return sortByCreatedAtDesc(merged);
      });
      setPostCursor(result.nextCursor ?? null);
      setPostsError(null);
    } catch (err) {
      setPostsError(err.message);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const handleCreatePost = async (payload) => {
    if (!circleSlug) throw new Error('Circle not ready');
    setCreatingPost(true);
    try {
      const response = await fetch(`/api/circles/${circleSlug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to share with your circle');
      }
      const newPost = result.post;
      setPosts((prev) => sortByCreatedAtDesc([newPost, ...prev]));
      setPostsError(null);
      setCommentsByPost((prev) => ({
        ...prev,
        [newPost.id]: {
          open: false,
          comments: [],
          loading: false,
          error: null,
          submitting: false,
          nextCursor: null,
          loaded: false,
        },
      }));
    } catch (err) {
      setPostsError(err.message);
      throw err;
    } finally {
      setCreatingPost(false);
    }
  };

  const handleEditPost = async (postId, payload) => {
    if (!circleSlug) throw new Error('Circle not ready');
    setPostsError(null);
    try {
      const response = await fetch(`/api/circles/${circleSlug}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to update post');
      }
      const updatedPost = result.post;
      setPosts((prev) => {
        if (!prev.some((post) => post.id === postId)) {
          return prev;
        }
        const updated = prev.map((post) => (post.id === postId ? updatedPost : post));
        return sortByCreatedAtDesc(updated);
      });
      setPinnedPosts((prev) => {
        if (!prev.some((post) => post.id === postId)) {
          return prev;
        }
        const updated = prev.map((post) => (post.id === postId ? updatedPost : post));
        return sortByPinnedAtDesc(updated);
      });
      return updatedPost;
    } catch (err) {
      setPostsError(err.message);
      throw err;
    }
  };

  const loadComments = async (postId, cursor) => {
    if (!circleSlug) return;
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        loading: true,
        error: null,
        open: true,
      },
    }));

    try {
      const params = new URLSearchParams();
      if (cursor) {
        params.set('cursor', cursor);
      }
      const query = params.toString();
      const response = await fetch(
        `/api/circles/${circleSlug}/posts/${postId}/comments${query ? `?${query}` : ''}`,
        {
          credentials: 'include',
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to load comments');
      }
      const fetched = Array.isArray(result.comments) ? result.comments : [];

      setCommentsByPost((prev) => {
        const existing = prev[postId] || {};
        return {
          ...prev,
          [postId]: {
            ...existing,
            loading: false,
            loaded: true,
            error: null,
            open: true,
            comments: cursor ? [...fetched, ...(existing.comments || [])] : fetched,
            nextCursor: result.nextCursor ?? null,
          },
        };
      });
    } catch (err) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || {}),
          loading: false,
          error: err.message,
          open: true,
        },
      }));
    }
  };

  const handleToggleComments = (postId) => {
    const current = commentsByPost[postId];
    const willOpen = !(current?.open);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        open: willOpen,
      },
    }));

    if (willOpen && !current?.loaded && !current?.loading) {
      loadComments(postId);
    }
  };

  const handleLoadMoreComments = (postId) => {
    const state = commentsByPost[postId];
    if (!state?.nextCursor || state.loading) return;
    loadComments(postId, state.nextCursor);
  };

  const handleSubmitComment = async (postId, content) => {
    if (!circleSlug) throw new Error('Circle not ready');
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        submitting: true,
        error: null,
        open: true,
      },
    }));

    try {
      const response = await fetch(`/api/circles/${circleSlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to add comment');
      }
      const comment = result.comment;
      setCommentsByPost((prev) => {
        const existing = prev[postId] || { comments: [] };
        return {
          ...prev,
          [postId]: {
            ...existing,
            submitting: false,
            error: null,
            loaded: true,
            open: true,
            comments: [...(existing.comments || []), comment],
          },
        };
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: (post.commentCount ?? 0) + 1 }
            : post,
        ),
      );
    } catch (err) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || {}),
          submitting: false,
          error: err.message,
          open: true,
        },
      }));
      throw err;
    }
  };

  const handleEditComment = async (postId, commentId, content) => {
    if (!circleSlug) throw new Error('Circle not ready');
    try {
      const response = await fetch(
        `/api/circles/${circleSlug}/posts/${postId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ content }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Unable to update comment');
      }
      const updatedComment = result.comment;
      setCommentsByPost((prev) => {
        const existing = prev[postId];
        if (!existing || !Array.isArray(existing.comments)) {
          return prev;
        }
        return {
          ...prev,
          [postId]: {
            ...existing,
            comments: existing.comments.map((comment) =>
              comment.id === commentId ? updatedComment : comment,
            ),
          },
        };
      });
      return updatedComment;
    } catch (err) {
      throw err;
    }
  };

  if (!circlesEnabled) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Circles Coming Soon
        </Typography>
      </Box>
    );
  }

  if (loadingCircle) {
    return (
      <Box sx={{ py: 10, px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !circle) {
    return (
      <Box sx={{ py: 8, px: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Unable to load circle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {error || 'This circle may be private or no longer available.'}
        </Typography>
        <Button variant="contained" component={Link} href="/circles">
          Back to Circles
        </Button>
      </Box>
    );
  }

  const canRequestJoin =
    circle.visibility === CIRCLE_VISIBILITY.PUBLIC &&
    (!circle.membership || ['left', 'removed'].includes(circle.membership.status));

  const showLeaveButton = circle.membership?.status === 'active';

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
            Back
          </Button>
        </Stack>

        <Card variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GroupsIcon color="primary" />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {circle.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
                    <VisibilityChip visibility={circle.visibility} />
                    <Chip size="small" label={`${circle.memberCount} members`} />
                    {circle.type && <Chip size="small" label={circle.type.replace('-', ' ')} />}
                    <MembershipBadge circle={circle} />
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {canInvite && (
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      component={Link}
                      href={`/circles/${circle.slug}/invite`}
                      disabled
                    >
                      Invite (coming soon)
                    </Button>
                  )}
                  {canRequestJoin && (
                    <Button variant="contained" onClick={handleJoinRequest} disabled={joinStatus === 'pending'}>
                      {joinStatus === 'pending' ? 'Request sent' : 'Request to Join'}
                    </Button>
                  )}
                  {showLeaveButton && (
                    <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={handleLeave}>
                      Leave circle
                    </Button>
                  )}
                </Stack>
              </Stack>
              {circle.description && (
                <Typography variant="body1" color="text.secondary">
                  {circle.description}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {joinStatus?.startsWith('error:') && <Alert severity="error">{joinStatus.replace('error:', '')}</Alert>}
        {joinStatus === 'pending' && (
          <Alert severity="info">Your join request has been sent. An admin will review it shortly.</Alert>
        )}

        <Box>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            {tabs.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Box>

        {tab === 0 && (
          <Stack spacing={2}>
            {canShare ? (
              <>
                <PostEditorForm
                  circle={circle}
                  mode="create"
                  onSubmit={handleCreatePost}
                  submitting={creatingPost}
                />
                {postsError && (
                  <Alert severity="error">{postsError}</Alert>
                )}
                {pinnedPosts.length > 0 && (
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Pinned posts
                    </Typography>
                    <Stack spacing={2}>
                      {pinnedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          circle={circle}
                          post={post}
                          commentsState={commentsByPost}
                          onToggleComments={handleToggleComments}
                          onLoadMoreComments={handleLoadMoreComments}
                          onSubmitComment={handleSubmitComment}
                          onEditComment={handleEditComment}
                          onEditPost={handleEditPost}
                          onPinPost={handlePinPost}
                          onUnpinPost={handleUnpinPost}
                          canComment={canShare}
                        />
                      ))}
                    </Stack>
                    <Divider />
                  </Stack>
                )}
                {loadingPosts && posts.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : posts.length ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      circle={circle}
                      post={post}
                      commentsState={commentsByPost}
                      onToggleComments={handleToggleComments}
                      onLoadMoreComments={handleLoadMoreComments}
                      onSubmitComment={handleSubmitComment}
                      onEditComment={handleEditComment}
                      onEditPost={handleEditPost}
                      onPinPost={handlePinPost}
                      onUnpinPost={handleUnpinPost}
                      canComment={canShare}
                    />
                  ))
                ) : (
                  <Card variant="outlined" sx={{ borderRadius: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        No posts yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Be the first to share something with this circle and kick off the conversation.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                {postCursor && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={fetchMorePosts} disabled={loadingMorePosts}>
                      {loadingMorePosts ? 'Loading…' : 'Load more posts'}
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Card variant="outlined" sx={{ borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Circle feed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Join this circle to view member shares and contribute to the discussion.
                  </Typography>
                  {!isAuthenticated && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      <Button component={Link} href="/login" variant="contained">
                        Sign in
                      </Button>
                      <Button component={Link} href="/register" variant="outlined">
                        Create account
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Card variant="outlined" sx={{ borderRadius: 1 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Members
                </Typography>
                {loadingMembers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : canViewMembers ? (
                  <>
                    <AvatarGroup max={8} total={circle.memberCount}>
                      {memberPreview.map((member) => (
                        <Avatar key={member.id} src={member.user?.image ?? undefined}>
                          {(member.user?.displayName || member.user?.name || 'M').slice(0, 1)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <Divider />
                    <Stack spacing={1}>
                      {members.map((member) => (
                        <Stack key={member.id} direction="row" spacing={2} alignItems="center">
                          <Avatar src={member.user?.image ?? undefined}>
                            {(member.user?.displayName || member.user?.name || 'M').slice(0, 1)}
                          </Avatar>
                          <div>
                            <Typography variant="body1">
                              {member.user?.displayName || member.user?.name || 'Member'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.role} ·{' '}
                              {member.status === 'pending'
                                ? 'Pending approval'
                                : `Joined ${new Date(member.joinedAt || circle.createdAt).toLocaleDateString()}`}
                            </Typography>
                          </div>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Join this circle to see the member list.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card variant="outlined" sx={{ borderRadius: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                About this circle
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Additional circle settings, guidelines, and resources will appear here as we continue building out the
                experience.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

