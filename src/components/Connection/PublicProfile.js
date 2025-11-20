'use client';

import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkIcon from '@mui/icons-material/Link';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { formatDistanceToNow, format, isValid } from 'date-fns';

/**
 * Format a date to display sobriety time
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date
 */
function formatSobrietyDate(date) {
  if (!date) return 'Not specified';

  const dateObj = new Date(date);
  if (!isValid(dateObj)) return 'Invalid date';

  const timeAgo = formatDistanceToNow(dateObj, { addSuffix: true });
  const formattedDate = format(dateObj, 'MMMM d, yyyy');

  return `${formattedDate} (${timeAgo})`;
}

/**
 * Get icon for contact field type
 * @param {string} type - Field type
 * @returns {React.ReactNode} - Icon component
 */
function getContactIcon(type) {
  switch (type) {
    case 'email':
      return <EmailIcon />;
    case 'phone':
      return <PhoneIcon />;
    case 'social':
    case 'custom':
    default:
      return <LinkIcon />;
  }
}

/**
 * Public connection profile page component
 */
export default function PublicProfile({
  profile,
  isLoading,
  error,
  onRequestConnection
}) {
  const theme = useTheme();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Profile Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The connection profile you're looking for doesn't exist or is no longer available.
        </Typography>
      </Paper>
    );
  }

  const handleRequestConnection = () => {
    setRequestDialogOpen(true);
  };

  const handleSendRequest = async () => {
    setRequestSending(true);
    try {
      await onRequestConnection(profile.userId, requestMessage);
      setRequestDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Connection request sent successfully',
        severity: 'success'
      });
      setRequestMessage('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to send request',
        severity: 'error'
      });
    } finally {
      setRequestSending(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Use primary color from profile theme if available
  const primaryColor = profile.theme?.primaryColor || theme.palette.primary.main;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
          mt: 2
        }}
      >
        {/* Background color accent */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 100,
            bgcolor: primaryColor,
            zIndex: 0
          }}
        />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4} sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                pt: { xs: 2, md: 4 }
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: primaryColor,
                  border: '4px solid white',
                  boxShadow: 2,
                  fontSize: '3rem'
                }}
              >
                {(profile.displayName || 'A').charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                {profile.displayName || 'Anonymous'}
              </Typography>

              {!profile.isOwner && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{ mt: 2 }}
                  onClick={handleRequestConnection}
                  disabled={profile.isConnected}
                >
                  {profile.isConnected ? 'Connected' : 'Request Connection'}
                </Button>
              )}

              {profile.sobrietyDate && (
                <Card variant="outlined" sx={{ mt: 3, width: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocalBarIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Sobriety Date
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {formatSobrietyDate(profile.sobrietyDate)}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {profile.homeGroups?.length > 0 && (
                <Card variant="outlined" sx={{ mt: 3, width: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HomeIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Home Groups
                      </Typography>
                    </Stack>
                    <List dense disablePadding>
                      {profile.homeGroups.map((group, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemText primary={group} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Profile stats */}
              <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
                <Chip
                  label={`${profile.viewCount || 0} views`}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8} sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ pt: { xs: 2, md: 4 } }}>
              {profile.message && (
                <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="body1" paragraph>
                    {profile.message}
                  </Typography>
                </Paper>
              )}

              {profile.contactFields?.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {profile.contactFields.map((field, index) => {
                        let linkHref = '';
                        if (field.type === 'email') {
                          linkHref = `mailto:${field.value}`;
                        } else if (field.type === 'phone') {
                          linkHref = `tel:${field.value}`;
                        } else if (field.type === 'social' && field.value.startsWith('http')) {
                          linkHref = field.value;
                        }

                        return (
                          <ListItem key={index} disablePadding sx={{ py: 1 }}>
                            <ListItemIcon>{getContactIcon(field.type)}</ListItemIcon>
                            <ListItemText
                              primary={field.label}
                              secondary={
                                linkHref ? (
                                  <Link href={linkHref} target={field.type === 'social' ? '_blank' : undefined}>
                                    {field.value}
                                  </Link>
                                ) : (
                                  field.value
                                )
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              )}

              {profile.contactFields?.length === 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  {profile.displayName || 'This member'} hasn't shared any contact information yet.
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Connection Request Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Connection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Send a connection request to {profile.displayName || 'this member'}.
            This will allow you to see more details in their profile.
          </Typography>
          <TextField
            label="Add a message (optional)"
            multiline
            rows={3}
            fullWidth
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Briefly explain how you know this person from recovery"
            disabled={requestSending}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)} disabled={requestSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendRequest}
            variant="contained"
            disabled={requestSending}
            startIcon={requestSending ? <CircularProgress size={16} /> : <PersonAddIcon />}
          >
            {requestSending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}