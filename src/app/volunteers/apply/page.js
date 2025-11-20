'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useVolunteerApplication from '@/hooks/useVolunteerApplication';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ApplicationWizard from '@/components/Volunteer/Application/ApplicationWizard';

/**
 * Volunteer Application Page
 * Displays application info and starts the application process
 */
export default function VolunteerApplicationPage() {
  const { data: session, status } = useSession();
  const [openWizard, setOpenWizard] = useState(false);

  // Use the volunteer application hook for all application-related state and actions
  const {
    getApplicationStatus,
    loading: applicationLoading,
    error: applicationError,
    applicationStatus
  } = useVolunteerApplication();

  // Use a separate loading state for the initial auth check
  const [initialLoading, setInitialLoading] = useState(true);

  // Check if user has an existing application on component mount
  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        await getApplicationStatus();
      } catch (err) {
        console.error('Error fetching application status:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    if (status === 'authenticated') {
      checkApplicationStatus();
    } else if (status === 'unauthenticated') {
      setInitialLoading(false);
    }
  }, [status, getApplicationStatus]);

  // Handle opening the application wizard
  const handleApplyNow = () => {
    setOpenWizard(true);
  };

  // Handle closing the application wizard
  const handleCloseWizard = async () => {
    setOpenWizard(false);
    // Refresh application status after closing wizard
    if (status === 'authenticated') {
      try {
        await getApplicationStatus();
      } catch (err) {
        console.error('Error refreshing application status:', err);
      }
    }
  };

  // Loading state
  if (status === 'loading' || initialLoading || applicationLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          Please sign in to apply as a volunteer.
        </Alert>
      </Container>
    );
  }

  // Has pending application
  if (applicationStatus?.status === 'pending') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }} elevation={2}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <SentimentSatisfiedAltIcon sx={{ fontSize: 60, color: '#5DA6A7', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Application Under Review
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Thank you for your interest in becoming a volunteer listener.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 4 }}>
            Your application has been submitted and is currently being reviewed by our team. We'll notify you once a decision has been made.
          </Alert>

          <Typography variant="subtitle1" gutterBottom>
            Application Details:
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Submitted on:</strong> {new Date(applicationStatus.created_at).toLocaleDateString()}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              href="/volunteers/dashboard"
              sx={{
                px: 4,
                bgcolor: '#5DA6A7',
                '&:hover': {
                  bgcolor: '#4A8F90',
                }
              }}
            >
              View Application Status
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Already approved
  if (applicationStatus?.status === 'approved') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }} elevation={2}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <SentimentSatisfiedAltIcon sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              You're Already a Volunteer!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your application has been approved.
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            Thank you for being a volunteer listener! You can access the volunteer dashboard to start helping others.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              href="/volunteers/dashboard"
              sx={{
                px: 4,
                bgcolor: '#5DA6A7',
                '&:hover': {
                  bgcolor: '#4A8F90',
                }
              }}
            >
              Go to Volunteer Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Application was rejected
  if (applicationStatus?.status === 'rejected') {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }} elevation={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Application Not Approved
          </Typography>
          <Typography variant="body1" paragraph>
            Thank you for your interest in becoming a volunteer listener. Unfortunately, your application was not approved at this time.
          </Typography>
          <Alert severity="info" sx={{ mb: 4 }}>
            {applicationStatus.rejection_reason || 'Please contact us if you have questions about the decision.'}
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="medium"
              href="/volunteers/dashboard"
            >
              View Application Details
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Default - can apply
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {applicationError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {applicationError}
        </Alert>
      )}

      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Become a Volunteer Listener
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Help others in recovery by providing peer support in one-on-one chats
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 6 }}>
        <Paper sx={{ flex: 1, p: 4, borderRadius: 2 }} elevation={2}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            What We're Looking For
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <List>
            <ListItem>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Members in Recovery"
                secondary="Active members of AA with a strong foundation in recovery"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AccessTimeIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Continuous Sobriety"
                secondary="At least one year of continuous sobriety"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <HeadsetMicIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Good Listeners"
                secondary="Empathetic individuals who can provide non-judgmental support"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <QuestionAnswerIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Available Time"
                secondary="Ability to volunteer 1-4 hours weekly"
              />
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ flex: 1, p: 4, borderRadius: 2 }} elevation={2}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Application Process
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" sx={{ mb: 2 }}>
              <strong>Submit Application</strong>
              <Typography variant="body2" color="text.secondary">
                Complete the application form with your information and experience
              </Typography>
            </Typography>
            <Typography component="li" sx={{ mb: 2 }}>
              <strong>Application Review</strong>
              <Typography variant="body2" color="text.secondary">
                Our team will review your application within 5-7 days
              </Typography>
            </Typography>
            <Typography component="li" sx={{ mb: 2 }}>
              <strong>Volunteer Orientation</strong>
              <Typography variant="body2" color="text.secondary">
                If approved, complete a brief online orientation
              </Typography>
            </Typography>
            <Typography component="li">
              <strong>Start Volunteering</strong>
              <Typography variant="body2" color="text.secondary">
                Begin helping others in recovery when you're ready
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleApplyNow}
          sx={{
            px: 6,
            py: 1.5,
            fontSize: '1.1rem',
            bgcolor: '#5DA6A7',
            '&:hover': {
              bgcolor: '#4A8F90',
            }
          }}
        >
          Apply Now
        </Button>
      </Box>

      {/* Application Wizard */}
      <ApplicationWizard
        open={openWizard}
        onClose={handleCloseWizard}
        userData={session?.user}
      />
    </Container>
  );
}