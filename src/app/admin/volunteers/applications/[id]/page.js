'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CommentIcon from '@mui/icons-material/Comment';
import { formatDistance } from 'date-fns';
import CodeOfConduct from '@/components/Volunteer/CodeOfConduct';

/**
 * Admin Volunteer Application Detail Page
 *
 * Page for reviewing an individual volunteer application
 */
export default function AdminVolunteerApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [codeOfConductOpen, setCodeOfConductOpen] = useState(false);

  // Fetch application data
  useEffect(() => {
    async function fetchApplicationData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/volunteers/applications/${id}`);

        if (!response.ok) {
          throw new Error(`Error fetching application: ${response.status}`);
        }

        const data = await response.json();
        setApplication(data.application);
        setApplicant(data.user);
      } catch (error) {
        console.error('Failed to fetch application details:', error);
        setError('Failed to load application details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated' && id) {
      fetchApplicationData();
    }
  }, [id, status]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // Handle approve dialog
  const handleApproveOpen = () => {
    setApproveDialogOpen(true);
  };

  const handleApproveClose = () => {
    setApproveDialogOpen(false);
  };

  const handleApproveConfirm = async () => {
    setSubmitLoading(true);
    try {
      const response = await fetch(`/api/admin/volunteers/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          notes: adminNote.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      // Refresh the application data
      const updatedResponse = await fetch(`/api/admin/volunteers/applications/${id}`);
      const updatedData = await updatedResponse.json();
      setApplication(updatedData.application);
      setApplicant(updatedData.user);

      setAdminNote('');
      setApproveDialogOpen(false);
    } catch (error) {
      console.error('Error approving application:', error);
      setError(error.message || 'Failed to approve application');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle reject dialog
  const handleRejectOpen = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectClose = () => {
    setRejectDialogOpen(false);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch(`/api/admin/volunteers/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: rejectionReason.trim(),
          notes: adminNote.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      // Refresh the application data
      const updatedResponse = await fetch(`/api/admin/volunteers/applications/${id}`);
      const updatedData = await updatedResponse.json();
      setApplication(updatedData.application);

      setRejectionReason('');
      setAdminNote('');
      setRejectDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting application:', error);
      setError(error.message || 'Failed to reject application');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!adminNote.trim()) {
      setError('Please enter a note');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch(`/api/admin/volunteers/applications/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: adminNote.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add note');
      }

      // Refresh the application data
      const updatedResponse = await fetch(`/api/admin/volunteers/applications/${id}`);
      const updatedData = await updatedResponse.json();
      setApplication(updatedData.application);

      setAdminNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      setError(error.message || 'Failed to add note');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle show code of conduct
  const handleShowCodeOfConduct = () => {
    setCodeOfConductOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          component={Link}
          href="/admin/volunteers/applications"
          startIcon={<ArrowBackIcon />}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  if (!application) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Application not found or you do not have permission to view it.
        </Alert>
        <Button
          component={Link}
          href="/admin/volunteers/applications"
          startIcon={<ArrowBackIcon />}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon />;
      case 'rejected': return <CancelIcon />;
      default: return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Button
            component={Link}
            href="/admin/volunteers/applications"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Applications
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Volunteer Application
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Submitted {formatTimeAgo(application.created_at)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={application.status.toUpperCase()}
            color={getStatusColor(application.status)}
            icon={getStatusIcon(application.status)}
            sx={{ fontWeight: 'bold' }}
          />
          {application.status === 'pending' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleApproveOpen}
                startIcon={<CheckCircleIcon />}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRejectOpen}
                startIcon={<CancelIcon />}
              >
                Reject
              </Button>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Application Content Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Application" />
          <Tab label="Applicant" />
          <Tab label="Admin Notes" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Application Tab */}
          {tabValue === 0 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Sobriety Duration
                      </Typography>
                      <Typography variant="body1">
                        {application.responses?.sobrietyDuration || 'Not specified'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Volunteer Motivation
                      </Typography>
                      <Typography variant="body1">
                        {application.responses?.volunteerMotivation || 'Not provided'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recovery Connection
                      </Typography>
                      <Typography variant="body1">
                        {application.responses?.recoveryConnection || 'Not provided'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Service Meaning
                      </Typography>
                      <Typography variant="body1">
                        {application.responses?.serviceMeaning || 'Not provided'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Code of Conduct Agreement
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Status: {application.code_of_conduct_accepted ? 'Accepted' : 'Not accepted'}
                      </Typography>
                      {application.code_of_conduct_accepted_at && (
                        <Typography variant="body2" color="text.secondary">
                          Accepted on: {formatDate(application.code_of_conduct_accepted_at)}
                        </Typography>
                      )}
                    </Box>
                    <Button variant="outlined" onClick={handleShowCodeOfConduct}>
                      View Code of Conduct
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Applicant Tab */}
          {tabValue === 1 && (
            <Box>
              {applicant ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    {applicant.image ? (
                      <Avatar
                        src={applicant.image}
                        alt={applicant.name || 'User'}
                        sx={{ width: 64, height: 64, mr: 2 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="h6">{applicant.name || 'Anonymous User'}</Typography>
                      <Typography variant="body1">{applicant.email || 'No email provided'}</Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Account Information
                          </Typography>
                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <EventIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Account Created"
                                secondary={formatDate(applicant.createdAt)}
                              />
                            </ListItem>

                            {applicant.sobriety && applicant.sobriety.date && (
                              <ListItem>
                                <ListItemIcon>
                                  <AccessTimeIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary="Sobriety Date"
                                  secondary={formatDate(applicant.sobriety.date)}
                                />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Applicant details are not available.
                </Alert>
              )}
            </Box>
          )}

          {/* Admin Notes Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Application Review Notes
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Add Note"
                  multiline
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Add a note about this application..."
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddNote}
                  disabled={submitLoading || !adminNote.trim()}
                >
                  {submitLoading ? 'Adding...' : 'Add Note'}
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {application.notes && application.notes.length > 0 ? (
                <List>
                  {application.notes.map((note, index) => (
                    <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <CommentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Added {formatTimeAgo(note.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ pl: 4 }}>
                        <Typography variant="body1">{note.content}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No notes have been added yet.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleApproveClose}>
        <DialogTitle>Approve Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve this volunteer application?
            This will give the user the volunteer role and access to volunteer features.
          </DialogContentText>
          <TextField
            margin="normal"
            label="Optional Note"
            fullWidth
            multiline
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add an optional note about this approval..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApproveClose}>Cancel</Button>
          <Button
            onClick={handleApproveConfirm}
            variant="contained"
            color="success"
            disabled={submitLoading}
          >
            {submitLoading ? 'Processing...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectClose}>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this volunteer application.
            This reason may be shown to the applicant.
          </DialogContentText>
          <TextField
            margin="normal"
            label="Rejection Reason"
            required
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this application is being rejected..."
            error={!rejectionReason.trim() && error?.includes('reason')}
            helperText={(!rejectionReason.trim() && error?.includes('reason')) ? 'Reason is required' : ''}
          />
          <TextField
            margin="normal"
            label="Optional Administrative Note"
            fullWidth
            multiline
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add an optional internal note (not shown to applicant)..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectClose}>Cancel</Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            color="error"
            disabled={submitLoading}
          >
            {submitLoading ? 'Processing...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Code of Conduct Dialog */}
      <CodeOfConduct
        open={codeOfConductOpen}
        onClose={() => setCodeOfConductOpen(false)}
        embedded={false}
        alreadyAgreed={application.code_of_conduct_accepted}
      />
    </Box>
  );
}