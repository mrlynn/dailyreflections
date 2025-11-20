'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  TextField,
  Alert,
  Divider,
  AppBar,
  Toolbar,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CookieIcon from '@mui/icons-material/Cookie';
import SmsIcon from '@mui/icons-material/Sms';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PageHeader from '@/components/PageHeader';
import SobrietyDatePicker from '@/components/Sobriety/SobrietyDatePicker';
import SobrietyDisplay from '@/components/Sobriety/SobrietyDisplay';
import StreakDashboard from '@/components/Streaks/StreakDashboard';
import EngagementPrompts from '@/components/Streaks/EngagementPrompts';
import CookieConsentSettings from '@/components/CookieConsent/CookieConsentSettings';
import SMSPreferences from '@/components/SMS/SMSPreferences';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';
import SecurityIcon from '@mui/icons-material/Security';

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sobrietyDate, setSobrietyDate] = useState(null);
  const [sobrietyLoading, setSobrietyLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [smsPreferences, setSMSPreferences] = useState(null);
  const [smsPhoneNumber, setSMSPhoneNumber] = useState('');
  const [smsLoading, setSMSLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState({
    verified: false,
    verificationSentAt: null
  });

  // All useEffect hooks need to be at the top level, before any conditionals
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'authenticated') {
        // Fetch sobriety date
        setSobrietyLoading(true);
        try {
          const response = await fetch('/api/user/sobriety');
          if (response.ok) {
            const data = await response.json();
            setSobrietyDate(data.sobrietyDate);
          } else {
            console.error('Failed to fetch sobriety date');
          }
        } catch (error) {
          console.error('Error fetching sobriety date:', error);
        } finally {
          setSobrietyLoading(false);
        }

        // Fetch streak data
        setStreakLoading(true);
        try {
          const response = await fetch('/api/streaks?journalType=step10');
          if (response.ok) {
            const data = await response.json();
            setStreakData(data.streak);
          } else {
            console.error('Failed to fetch streak data');
          }
        } catch (error) {
          console.error('Error fetching streak data:', error);
        } finally {
          setStreakLoading(false);
        }

        // Fetch SMS preferences
        setSMSLoading(true);
        try {
          const response = await fetch('/api/user/sms');
          if (response.ok) {
            const data = await response.json();
            setSMSPhoneNumber(data.phoneNumber || '');
            setSMSPreferences(data.preferences || null);
            // Store verification status in state
            setVerificationStatus({
              verified: data.verified || false,
              verificationSentAt: data.verificationSentAt || null
            });
          } else {
            console.error(`Failed to fetch SMS preferences: ${response.status} ${response.statusText}`);
            // Initialize with default empty values
            setSMSPhoneNumber('');
            setSMSPreferences(null);
            setVerificationStatus({
              verified: false,
              verificationSentAt: null
            });
          }
        } catch (error) {
          console.error('Error fetching SMS preferences:', error);
          // Initialize with default empty values
          setSMSPhoneNumber('');
          setSMSPreferences(null);
          setVerificationStatus({
            verified: false,
            verificationSentAt: null
          });
        } finally {
          setSMSLoading(false);
        }
      }
    };

    fetchUserData();
  }, [status]);

  // Handle session redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: '#FFFFFF' }}>
              Daily Reflections
            </Typography>
            <UserMenu />
          </Toolbar>
        </AppBar>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </>
    );
  }

  // Don't render the main content until session is loaded
  if (!session) {
    return null;
  }

  const user = session.user;
  const currentDisplayName = user.displayName || user.name || user.email || 'User';
  const initials = currentDisplayName
    ? currentDisplayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : user.email?.[0].toUpperCase() || 'U';

  const handleEditClick = () => {
    setIsEditing(true);
    setDisplayName(currentDisplayName);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDisplayName('');
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    if (displayName.trim() === currentDisplayName) {
      handleCancel();
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update display name.');
      }

      setSuccess('Display name updated successfully!');
      setIsEditing(false);

      // Update session with new displayName
      await updateSession({
        ...session,
        user: {
          ...session.user,
          displayName: displayName.trim(),
        },
      });

      // Refresh the page to show updated name
      setTimeout(() => router.refresh(), 1000);
    } catch (err) {
      setError(err.message || 'Failed to update display name. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle updating sobriety date
  const handleSaveSobrietyDate = async (newDate) => {
    setSobrietyLoading(true);
    try {
      const response = await fetch('/api/user/sobriety', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sobrietyDate: newDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update sobriety date');
      }

      // Update local state with the new date
      setSobrietyDate(newDate);
      setSuccess('Sobriety date updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update sobriety date');
      throw err;
    } finally {
      setSobrietyLoading(false);
    }
  };

  // Handle removing sobriety date
  const handleRemoveSobrietyDate = async () => {
    setSobrietyLoading(true);
    try {
      const response = await fetch('/api/user/sobriety', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove sobriety date');
      }

      // Update local state
      setSobrietyDate(null);
      setSuccess('Sobriety date removed successfully');
    } catch (err) {
      setError(err.message || 'Failed to remove sobriety date');
      throw err;
    } finally {
      setSobrietyLoading(false);
    }
  };

  // Handle saving SMS preferences
  const handleSaveSMSPreferences = async (data) => {
    setSMSLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/sms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save SMS preferences');
      }

      // Update local state
      setSMSPhoneNumber(data.phoneNumber || '');
      setSMSPreferences(data.preferences || null);

      // Update verification status
      setVerificationStatus({
        verified: responseData.verified || false,
        verificationSentAt: responseData.verificationSent ? new Date() : verificationStatus.verificationSentAt
      });

      // Show appropriate success message
      if (responseData.verificationSent) {
        setSuccess('SMS preferences saved successfully. Please check your phone for a verification message and reply YES to confirm.');
      } else {
        setSuccess('SMS preferences saved successfully');
      }
    } catch (err) {
      setError(err.message || 'Failed to save SMS preferences');
      throw err;
    } finally {
      setSMSLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Profile"
        icon={<AccountCircleIcon sx={{ fontSize: 'inherit' }} />}
        subtitle="Manage your account settings, preferences, and recovery journey"
        fullWidth
      />

      <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          {/* User Profile Card */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
              <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'primary.main',
                fontSize: '3rem',
                mb: 2,
              }}
            >
              {user.image ? (
                <img src={user.image} alt={currentDisplayName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              ) : (
                initials
              )}
            </Avatar>
            <Typography variant="h4" component="h1" fontWeight={600}>
              {currentDisplayName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
              </Box>

              {/* Display Name Section (moved inside user profile card) */}
              <Box sx={{ mt: 4, mb: 2, width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Display Name
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This is how your name will appear in comments.
                </Typography>

                {!isEditing ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {currentDisplayName}
                    </Typography>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleEditClick}
                      variant="outlined"
                      size="small"
                    >
                      Edit
                    </Button>
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Display Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={submitting}
                      fullWidth
                      autoFocus
                    />
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={submitting}
                        variant="outlined"
                      >
                        Cancel
                      </Button>
                      <Button
                        startIcon={<CheckIcon />}
                        onClick={handleSave}
                        disabled={submitting || !displayName.trim()}
                        variant="contained"
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Recovery Connection */}
              <Box sx={{ mt: 4, width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Recovery Connection
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create and share your recovery connection profile with others through QR codes and custom links.
                </Typography>

                {/* Two button layout with QR code direct access */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => router.push('/profile/connection')}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flex: 1
                    }}
                  >
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M17 4L20 7M20 4L17 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8V12L14 14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Box>
                    Manage Connection
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => router.push('/profile/connection/qr')}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flex: 1
                    }}
                  >
                    <QrCodeIcon sx={{ color: 'white' }} />
                    Show My QR Code
                  </Button>
                </Box>

                {/* Mobile-friendly fixed QR button (visible on smaller screens) */}
                <Box
                  sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    zIndex: 1000,
                    display: { xs: 'block', md: 'none' }
                  }}
                >
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => router.push('/profile/connection/qr')}
                    sx={{
                      borderRadius: '50%',
                      width: 60,
                      height: 60,
                      minWidth: 'unset',
                      boxShadow: (theme) => theme.shadows[4]
                    }}
                    aria-label="Show QR Code"
                  >
                    <QrCodeIcon sx={{ fontSize: 30 }} />
                  </Button>
                </Box>
              </Box>

              {/* Account Information */}
              <Box sx={{ mt: 4, width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-all' }}>
                    {user.id}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={8} lg={9}>
            {/* Success message */}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* Error message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Paper elevation={3} sx={{ p: 4 }}>
              {/* Sobriety Tracker Section */}
              <Box sx={{ mt: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarMonthIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Sobriety Tracker
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Track your sobriety journey and see your progress.
                </Typography>

                {sobrietyLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <>
                    {sobrietyDate ? (
                      <Box sx={{ mb: 3 }}>
                        <SobrietyDisplay sobrietyDate={sobrietyDate} compact={true} />
                      </Box>
                    ) : (
                      <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 1, mb: 3, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          No sobriety date set yet. Set your sobriety date to start tracking your journey.
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
                      <SobrietyDatePicker
                        sobrietyDate={sobrietyDate}
                        onSave={handleSaveSobrietyDate}
                        onRemove={handleRemoveSobrietyDate}
                      />
                    </Box>
                  </>
                )}
              </Box>

              {/* Streak Tracking Section */}
              <Box sx={{ mt: 4, mb: 4 }} id="streaks">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalFireDepartmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Reflection Streak Tracker
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Track your 10th Step inventory practice and view your progress over time.
                </Typography>

                {/* Engagement prompts for notifications and reminders */}
                {!streakLoading && streakData && (
                  <EngagementPrompts
                    streakData={streakData}
                    onAction={(action) => console.log('User action:', action)}
                  />
                )}

                {/* Streak dashboard with all visualization components */}
                {streakLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <StreakDashboard
                    userId={user.id}
                    journalType="step10"
                  />
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* SMS Notification Preferences Section */}
              <Box sx={{ mt: 4, mb: 4 }} id="sms-preferences">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SmsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  SMS Notification Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Receive daily reflections and reminders via SMS. Control your notification settings and preferences.
                </Typography>

                {smsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <SMSPreferences
                    initialPhoneNumber={smsPhoneNumber}
                    initialPreferences={smsPreferences}
                    verificationStatus={verificationStatus}
                    onSave={handleSaveSMSPreferences}
                    disabled={submitting}
                  />
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Privacy & Cookie Settings Section */}
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CookieIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Privacy & Cookie Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Manage how we use cookies and your data preferences.
                </Typography>

                <CookieConsentSettings />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Privacy & Security Settings Link */}
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Privacy & Security
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage your data privacy, export your data, and control account settings.
                </Typography>
                <Button
                  component={Link}
                  href="/settings/privacy"
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                >
                  Go to Privacy Settings
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

