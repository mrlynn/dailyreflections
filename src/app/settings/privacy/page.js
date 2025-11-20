'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import PageHeader from '@/components/PageHeader';
import PrivacyLock from '@/components/Privacy/PrivacyLock';
import { useSnackbar } from 'notistack';

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [sponsorVisibility, setSponsorVisibility] = useState({
    shareNightlyInventory: false,
    shareJournalReflections: false,
    shareMilestones: true,
  });
  const [privacyLockEnabled, setPrivacyLockEnabled] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/settings/privacy');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadPrivacySettings();
    }
  }, [session]);

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch('/api/user/privacy');
      if (response.ok) {
        const data = await response.json();
        if (data.sponsorVisibility) {
          setSponsorVisibility(data.sponsorVisibility);
        }
        if (data.privacyLockEnabled !== undefined) {
          setPrivacyLockEnabled(data.privacyLockEnabled);
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handleExportData = async (format = 'json') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/user/data/export?format=${format}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      enqueueSnackbar('Data exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error exporting data:', error);
      enqueueSnackbar('Failed to export data. Please try again.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      enqueueSnackbar('Please type DELETE to confirm', { variant: 'error' });
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Deletion failed');
      }

      const data = await response.json();
      enqueueSnackbar(
        data.message || 'Account deletion initiated. You have 7 days to undo this action.',
        { variant: 'warning', autoHideDuration: 10000 }
      );

      // Redirect to home after a delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      enqueueSnackbar(error.message || 'Failed to delete account. Please try again.', {
        variant: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  };

  const handleSponsorVisibilityChange = async (field, value) => {
    const newVisibility = { ...sponsorVisibility, [field]: value };
    setSponsorVisibility(newVisibility);

    try {
      const response = await fetch('/api/user/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorVisibility: newVisibility }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      enqueueSnackbar('Privacy settings updated', { variant: 'success' });
    } catch (error) {
      console.error('Error updating sponsor visibility:', error);
      enqueueSnackbar('Failed to update settings. Please try again.', { variant: 'error' });
      // Revert on error
      setSponsorVisibility(sponsorVisibility);
    }
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Privacy & Data Settings"
        subtitle="Manage your data, privacy, and account settings"
      />

      {/* Privacy Disclosure Panel */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <InfoIcon sx={{ color: 'primary.main', mt: 0.5 }} />
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Your data is encrypted and stored securely.</strong> You can export or delete it anytime.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AA Companion is not affiliated with Alcoholics Anonymous and never shares your data with third parties.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Data Export */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DownloadIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Export Your Data</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download all your journal entries, step work, and reflections in JSON or PDF format.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportData('json')}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Download as JSON'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportData('pdf')}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Download as PDF'}
          </Button>
        </Box>
      </Paper>

      {/* Privacy Lock */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Privacy Lock</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enable a 4-digit PIN or biometric lock to protect your app sessions.
        </Typography>
        <PrivacyLock
          enabled={privacyLockEnabled}
          onToggle={(enabled) => {
            setPrivacyLockEnabled(enabled);
            // Save to backend
            fetch('/api/user/privacy', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ privacyLockEnabled: enabled }),
            });

            // Additional cleanup for redundancy - force clean all storage when disabling
            if (!enabled && typeof window !== 'undefined') {
              localStorage.removeItem('privacyLockPIN');
              localStorage.removeItem('privacyLockEnabled');
              sessionStorage.removeItem('privacyLockUnlocked');
              sessionStorage.removeItem('privacyLockUnlockedAt');
              sessionStorage.removeItem('privacyLockLockoutUntil');
              console.log('Privacy lock settings cleaned up from settings page');

              // Reload the page to ensure all changes take effect
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }}
        />
        {privacyLockEnabled && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                // Trigger lock event
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('privacyLock:lock'));
                  enqueueSnackbar('App locked. Please enter your PIN to continue.', {
                    variant: 'info',
                  });
                  // Reload to show lock screen
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              }}
              sx={{ textTransform: 'none' }}
            >
              Lock App Now
            </Button>
          </Box>
        )}
      </Paper>

      {/* Sponsor Visibility Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Sponsor Visibility Controls</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Control what information you share with your sponsor.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              {sponsorVisibility.shareNightlyInventory ? (
                <VisibilityIcon color="primary" />
              ) : (
                <VisibilityOffIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Share nightly inventory with sponsor"
              secondary="Allow your sponsor to view your 10th step nightly inventory"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sponsorVisibility.shareNightlyInventory}
                  onChange={(e) =>
                    handleSponsorVisibilityChange('shareNightlyInventory', e.target.checked)
                  }
                />
              }
              label=""
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {sponsorVisibility.shareJournalReflections ? (
                <VisibilityIcon color="primary" />
              ) : (
                <VisibilityOffIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Share journal reflections"
              secondary="Allow your sponsor to view your journal entries and reflections"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sponsorVisibility.shareJournalReflections}
                  onChange={(e) =>
                    handleSponsorVisibilityChange('shareJournalReflections', e.target.checked)
                  }
                />
              }
              label=""
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {sponsorVisibility.shareMilestones ? (
                <VisibilityIcon color="primary" />
              ) : (
                <VisibilityOffIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Share milestones only"
              secondary="Share only your sobriety milestones and achievements"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sponsorVisibility.shareMilestones}
                  onChange={(e) =>
                    handleSponsorVisibilityChange('shareMilestones', e.target.checked)
                  }
                />
              }
              label=""
            />
          </ListItem>
        </List>
      </Paper>

      {/* Account Deletion */}
      <Paper sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'error.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
          <Typography variant="h6" color="error">
            Delete My Account
          </Typography>
        </Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be easily undone. Your account will be scheduled for deletion with a
          7-day grace period. You can cancel the deletion within 7 days.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Deleting your account will permanently remove all your data including journal entries,
          step work, reflections, and account information.
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete My Account
        </Button>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This action will schedule your account for deletion. You have 7 days to undo this
            action by logging in again.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            To confirm, please type <strong>DELETE</strong> in the field below:
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleting || deleteConfirmText !== 'DELETE'}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

