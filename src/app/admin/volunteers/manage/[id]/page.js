'use client';

import { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { LocalizationProvider, TimePicker, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import { formatDistance } from 'date-fns';

/**
 * Admin Volunteer Detail Page
 */
export default function AdminVolunteerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volunteer, setVolunteer] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch volunteer data
  useEffect(() => {
    async function fetchVolunteerData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/volunteers/${id}`);

        if (!response.ok) {
          throw new Error(`Error fetching volunteer details: ${response.status}`);
        }

        const data = await response.json();
        setVolunteer(data.volunteer);
        setIsActive(data.volunteer.volunteer?.isActive || false);
        setAvailability(data.volunteer.volunteer?.availability || []);
      } catch (error) {
        console.error('Failed to fetch volunteer details:', error);
        setError('Failed to load volunteer details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated' && id) {
      fetchVolunteerData();
    }
  }, [id, status]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle active status change
  const handleActiveChange = (event) => {
    setIsActive(event.target.checked);
  };

  // Handle notes change
  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/volunteers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive,
          availability,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update volunteer');
      }

      // Success
      setSuccessMessage('Volunteer updated successfully');

      // Clear notes field
      setNotes('');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating volunteer:', error);
      setError(error.message || 'Failed to update volunteer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove volunteer role
  const handleRemoveVolunteerRole = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/volunteers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove volunteer role');
      }

      // Redirect to volunteers list
      router.push('/admin/volunteers/manage');
    } catch (error) {
      console.error('Error removing volunteer role:', error);
      setError(error.message || 'Failed to remove volunteer role');
      setConfirmDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
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

  // Check if user is admin
  const isAdmin = session?.user?.isAdmin === true;

  // If not authenticated or not admin
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated' || !isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Alert>
        <Button
          component={Link}
          href="/admin"
          startIcon={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!volunteer) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Volunteer not found or you don't have permission to view this information.
        </Alert>
        <Button
          component={Link}
          href="/admin/volunteers/manage"
          startIcon={<ArrowBackIcon />}
        >
          Back to Volunteers
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Button
            component={Link}
            href="/admin/volunteers/manage"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Volunteers
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Manage Volunteer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {volunteer.name} ({volunteer.email})
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={volunteer.volunteer?.isActive ? "ACTIVE" : "INACTIVE"}
            color={volunteer.volunteer?.isActive ? "success" : "default"}
            icon={volunteer.volunteer?.isActive ? <CheckCircleIcon /> : <PersonOffIcon />}
          />
          <Button
            variant="outlined"
            color="error"
            onClick={() => setConfirmDialogOpen(true)}
            startIcon={<DeleteIcon />}
          >
            Remove Role
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Profile" />
          <Tab label="Application" />
          <Tab label="Manage" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Profile Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {volunteer.image ? (
                        <Box
                          component="img"
                          src={volunteer.image}
                          alt={volunteer.name}
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            mr: 2,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <PersonIcon sx={{ fontSize: 64, mr: 2, color: 'text.secondary' }} />
                      )}
                      <Box>
                        <Typography variant="h6">{volunteer.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                          {volunteer.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <EventIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Account Created"
                          secondary={formatDate(volunteer.createdAt)}
                        />
                      </ListItem>

                      {volunteer.sobriety && volunteer.sobriety.date && (
                        <ListItem>
                          <ListItemIcon>
                            <HistoryIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Sobriety Date"
                            secondary={formatDate(volunteer.sobriety.date)}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Volunteer Status
                    </Typography>

                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color={volunteer.volunteer?.isActive ? "success" : "disabled"} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Activation Status"
                          secondary={volunteer.volunteer?.isActive ? `Active since ${formatDate(volunteer.volunteer.activatedAt)}` : 'Inactive'}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Code of Conduct"
                          secondary={volunteer.volunteer?.codeOfConductAccepted ?
                            `Accepted on ${formatDate(volunteer.volunteer.codeOfConductAcceptedAt)}` :
                            'Not accepted'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Application Tab */}
          {tabValue === 1 && (
            <Box>
              {volunteer.application ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Application Status
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Status"
                              secondary={
                                <Chip
                                  size="small"
                                  label={volunteer.application.status.toUpperCase()}
                                  color={
                                    volunteer.application.status === 'approved' ? 'success' :
                                    volunteer.application.status === 'rejected' ? 'error' :
                                    'warning'
                                  }
                                  sx={{ mt: 0.5 }}
                                />
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Submitted"
                              secondary={formatDate(volunteer.application.created_at)}
                            />
                          </ListItem>
                          {volunteer.application.status === 'approved' && (
                            <ListItem>
                              <ListItemText
                                primary="Approved On"
                                secondary={formatDate(volunteer.application.approved_at)}
                              />
                            </ListItem>
                          )}
                          {volunteer.application.status === 'rejected' && (
                            <>
                              <ListItem>
                                <ListItemText
                                  primary="Rejected On"
                                  secondary={formatDate(volunteer.application.rejected_at)}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Reason"
                                  secondary={volunteer.application.rejection_reason || 'No reason provided'}
                                />
                              </ListItem>
                            </>
                          )}
                        </List>
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Code of Conduct
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {volunteer.application.code_of_conduct_accepted ? 'Accepted' : 'Not Accepted'}
                          </Typography>
                          {volunteer.application.code_of_conduct_accepted_at && (
                            <Typography variant="body2" color="text.secondary">
                              on {formatDate(volunteer.application.code_of_conduct_accepted_at)}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Application Responses
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Sobriety Duration"
                              secondary={volunteer.application.responses?.sobrietyDuration || 'Not provided'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Volunteer Motivation"
                              secondary={volunteer.application.responses?.volunteerMotivation || 'Not provided'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Recovery Connection"
                              secondary={volunteer.application.responses?.recoveryConnection || 'Not provided'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Service Meaning"
                              secondary={volunteer.application.responses?.serviceMeaning || 'Not provided'}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No application information found for this volunteer.
                </Alert>
              )}
            </Box>
          )}

          {/* Manage Tab */}
          {tabValue === 2 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Volunteer Status
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={isActive}
                            onChange={handleActiveChange}
                            color="success"
                          />
                        }
                        label={isActive ? "Active Volunteer" : "Inactive Volunteer"}
                      />

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {isActive
                          ? "Volunteer can participate in chat sessions and provide support to users."
                          : "Volunteer cannot participate in chat sessions until activated."}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Add Administrative Note
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <TextField
                        label="Note"
                        multiline
                        rows={4}
                        value={notes}
                        onChange={handleNotesChange}
                        fullWidth
                        placeholder="Add notes about this volunteer (visible to admins only)"
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveChanges}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Analytics Link */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <Button
          component={Link}
          href="/admin/volunteers/analytics"
          variant="outlined"
          color="info"
          startIcon={<BarChartIcon />}
        >
          View Volunteer Analytics
        </Button>
      </Box>

      {/* Confirm Remove Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="error" sx={{ mr: 1 }} />
            Remove Volunteer Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the volunteer role from <strong>{volunteer.name}</strong>? This will prevent them from participating in volunteer chat sessions, but will not delete their account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemoveVolunteerRole}
            color="error"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Remove Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}