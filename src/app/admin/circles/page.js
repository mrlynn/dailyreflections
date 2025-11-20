'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupsIcon from '@mui/icons-material/Groups';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';

function VisibilityChip({ visibility }) {
  if (visibility === 'public') {
    return <Chip icon={<PublicIcon fontSize="small" />} label="Public" size="small" color="success" />;
  }
  return <Chip icon={<LockIcon fontSize="small" />} label="Invite Only" size="small" />;
}

function RoleChip({ role }) {
  if (role === 'owner') {
    return <Chip size="small" color="primary" label="Owner" />;
  }
  if (role === 'admin') {
    return <Chip size="small" color="info" label="Admin" />;
  }
  return <Chip size="small" color="default" label="Member" />;
}

function StatusChip({ status }) {
  if (status === 'pending') {
    return <Chip size="small" color="warning" label="Pending" icon={<HourglassTopIcon />} />;
  }
  if (status === 'removed') {
    return <Chip size="small" color="error" label="Removed" />;
  }
  if (status === 'left') {
    return <Chip size="small" color="default" label="Left" />;
  }
  return <Chip size="small" color="success" label="Active" />;
}

function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
}

function CircleMembersDialog({ circle, open, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !circle?.id) {
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/circles/${circle.id}/members`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || 'Failed to load members');
        }

        const result = await response.json();
        if (!cancelled) {
          setMembers(result.members ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [circle?.id, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Circle Members — {circle?.name ?? ''}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : members.length === 0 ? (
          <Typography>No members found.</Typography>
        ) : (
          <List>
            {members.map((member) => (
              <ListItem
                key={member.id}
                alignItems="flex-start"
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemAvatar>
                  <Avatar src={member.user?.image ?? undefined}>
                    {(member.user?.displayName || member.user?.name || 'M').slice(0, 1)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1">
                        {member.user?.displayName || member.user?.name || 'Unknown user'}
                      </Typography>
                      <RoleChip role={member.role} />
                      <StatusChip status={member.status} />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      {member.user?.email && (
                        <Typography variant="body2" color="text.secondary">
                          {member.user.email}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Joined: {formatDate(member.joinedAt)}
                      </Typography>
                      {member.status === 'pending' && (
                        <Typography variant="body2" color="text.secondary">
                          Requested: {formatDate(member.requestedAt)}
                        </Typography>
                      )}
                      {member.status === 'removed' && (
                        <Typography variant="body2" color="text.secondary">
                          Removed: {formatDate(member.removedAt)}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCirclesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [circles, setCircles] = useState([]);
  const [dialogCircle, setDialogCircle] = useState(null);

  const loadCircles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/circles', {
        credentials: 'include',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to load circles');
      }

      const result = await response.json();
      setCircles(result.circles ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, []);

  const totals = useMemo(() => {
    return circles.reduce(
      (acc, circle) => {
        acc.total += 1;
        acc.activeMembers += circle.members?.active ?? 0;
        acc.pendingMembers += circle.members?.pending ?? 0;
        acc.invites += circle.invites?.total ?? 0;
        return acc;
      },
      { total: 0, activeMembers: 0, pendingMembers: 0, invites: 0 },
    );
  }, [circles]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Circles Administration
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadCircles} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<GroupsIcon color="primary" />}
          title="Snapshot"
          subheader="Overview of all circles in the system"
        />
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Circles
              </Typography>
              <Typography variant="h5">{totals.total}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Active Members
              </Typography>
              <Typography variant="h5">{totals.activeMembers}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Pending Members
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">{totals.pendingMembers}</Typography>
                {totals.pendingMembers > 0 && <HourglassTopIcon color="warning" fontSize="small" />}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Invites
              </Typography>
              <Typography variant="h5">{totals.invites}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Card sx={{ borderColor: 'error.light', borderWidth: 1, borderStyle: 'solid', mb: 3 }}>
          <CardContent>
            <Typography color="error" variant="subtitle1">
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try refreshing the page. If the problem continues, contact support.
            </Typography>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      ) : circles.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              No circles found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Once members create circles, they will appear here for administrative review.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>Invites</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {circles.map((circle) => (
                <TableRow key={circle.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{circle.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                      {circle.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <VisibilityChip visibility={circle.visibility} />
                  </TableCell>
                  <TableCell>
                    {circle.type ?? 'general'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color="success"
                      label={`${circle.members?.active ?? 0}/${circle.maxMembers ?? 0}`}
                    />
                  </TableCell>
                  <TableCell>
                    {circle.members?.pending ? (
                      <Chip
                        size="small"
                        color="warning"
                        label={circle.members.pending}
                        icon={<HourglassTopIcon />}
                      />
                    ) : (
                      <Chip size="small" color="default" label="0" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`Total ${circle.invites?.total ?? 0}`} />
                      <Chip size="small" color="info" label={`Active ${circle.invites?.active ?? 0}`} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(circle.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28 }}>
                        {(circle.creator?.displayName || circle.creator?.name || 'O').slice(0, 1)}
                      </Avatar>
                      <Typography variant="body2">
                        {circle.creator?.displayName || circle.creator?.name || 'Unknown'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setDialogCircle(circle)}>
                      View Members
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CircleMembersDialog
        circle={dialogCircle}
        open={Boolean(dialogCircle)}
        onClose={() => setDialogCircle(null)}
      />
    </Box>
  );
}

