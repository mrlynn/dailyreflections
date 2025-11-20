'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert,
  Divider,
  Chip,
  LinearProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Link from 'next/link';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingIcon from '@mui/icons-material/Pending';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * Volunteer Application Status Component
 * Displays current application status and next steps
 *
 * @param {Object} props
 * @param {Object|null} props.applicationData - The volunteer application data
 * @param {boolean} props.isVolunteer - Whether the user is already a volunteer
 * @returns {JSX.Element} Status display component
 */
export default function VolunteerApplicationStatus({ applicationData, isVolunteer }) {
  // If user hasn't applied yet
  if (!applicationData) {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Volunteer Application
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ textAlign: 'center', py: 4 }}>
          <PersonAddIcon sx={{ fontSize: 60, color: '#E4B95B', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Ready to become a volunteer listener?
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Help others in recovery by providing peer support in one-on-one chats.
          </Typography>
          <Button
            component={Link}
            href="/volunteers/apply"
            variant="contained"
            size="large"
            sx={{
              mt: 2,
              px: 4,
              bgcolor: '#5DA6A7',
              '&:hover': {
                bgcolor: '#4A8F90',
              }
            }}
          >
            Apply Now
          </Button>
        </Box>
      </>
    );
  }

  // Display based on application status
  const status = applicationData.status || 'pending';
  const createdDate = applicationData.created_at
    ? new Date(applicationData.created_at).toLocaleDateString()
    : 'Unknown date';

  // Pending status
  if (status === 'pending') {
    // Calculate days since application submission
    const daysSinceSubmission = applicationData.created_at
      ? Math.floor((new Date() - new Date(applicationData.created_at)) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <>
        <Typography variant="h6" gutterBottom>
          Application Status
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Chip
            label="Under Review"
            color="warning"
            icon={<PendingIcon />}
            sx={{ mr: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Submitted on {createdDate}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Your application is currently being reviewed by our team. This process typically takes 5-7 days.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Review progress:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={daysSinceSubmission >= 7 ? 100 : (daysSinceSubmission / 7) * 100}
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {daysSinceSubmission >= 7 ? '100%' : Math.round((daysSinceSubmission / 7) * 100) + '%'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          What happens next?
        </Typography>

        <Stepper orientation="vertical" sx={{ mt: 2 }}>
          <Step active completed>
            <StepLabel>Application Submitted</StepLabel>
            <StepContent>
              <Typography variant="body2">
                You've completed the application form and agreed to our Code of Conduct.
              </Typography>
            </StepContent>
          </Step>
          <Step active>
            <StepLabel>Application Review</StepLabel>
            <StepContent>
              <Typography variant="body2">
                Our team is currently reviewing your application and qualifications.
              </Typography>
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Orientation & Training</StepLabel>
            <StepContent>
              <Typography variant="body2">
                If approved, you'll receive an invite to complete orientation and training.
              </Typography>
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Start Volunteering</StepLabel>
            <StepContent>
              <Typography variant="body2">
                Schedule your availability and begin helping others in recovery.
              </Typography>
            </StepContent>
          </Step>
        </Stepper>
      </>
    );
  }

  // Rejected status
  if (status === 'rejected') {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Application Status
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Chip
            label="Not Approved"
            color="error"
            icon={<CancelIcon />}
            sx={{ mr: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Decision made on {applicationData.rejected_at ? new Date(applicationData.rejected_at).toLocaleDateString() : 'Unknown date'}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          {applicationData.rejection_reason || 'Unfortunately, your application was not approved at this time.'}
        </Alert>

        <Typography variant="body1" paragraph>
          Thank you for your interest in becoming a volunteer listener. If you have questions about the decision or would like to apply again in the future, please contact our volunteer coordinator.
        </Typography>

        <Button
          component={Link}
          href="/contact"
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Contact Support
        </Button>
      </>
    );
  }

  // Approved status - either waiting for orientation or ready to volunteer
  if (status === 'approved') {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Volunteer Status
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Chip
            label="Approved"
            color="success"
            icon={<CheckCircleOutlineIcon />}
            sx={{ mr: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Approved on {applicationData.approved_at ? new Date(applicationData.approved_at).toLocaleDateString() : 'Unknown date'}
          </Typography>
        </Box>

        {isVolunteer ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            You're an active volunteer listener! Thank you for your service to the community.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your application has been approved! Complete the orientation to activate your volunteer status.
          </Alert>
        )}

        {isVolunteer ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Volunteer Resources
            </Typography>

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Volunteer Training Materials"
                  secondary="Review best practices and guidelines"
                />
                <Button variant="text" disabled>View</Button>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <SupportAgentIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Volunteer Chat Dashboard"
                  secondary="Start helping others when you're ready"
                />
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#5DA6A7',
                    '&:hover': {
                      bgcolor: '#4A8F90',
                    }
                  }}
                  disabled
                >
                  Go Live
                </Button>
              </ListItem>
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Volunteer chat features coming soon! Thank you for your patience.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Next Steps
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 2 }}>
              <Step active completed>
                <StepLabel>Application Submitted</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    You've completed the application form and agreed to our Code of Conduct.
                  </Typography>
                </StepContent>
              </Step>
              <Step active completed>
                <StepLabel>Application Review</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your application has been reviewed and approved.
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Orientation & Training</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Complete the required training modules to become an active volunteer.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: '#E4B95B',
                      color: '#1A2B34',
                      '&:hover': {
                        bgcolor: '#D4A556',
                      }
                    }}
                    disabled
                  >
                    Start Orientation
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Orientation will be available soon. We'll notify you when it's ready.
                  </Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Start Volunteering</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Schedule your availability and begin helping others in recovery.
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </>
        )}
      </>
    );
  }

  // Fallback for unexpected status
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Application Status
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Alert severity="info" sx={{ mb: 3 }}>
        We couldn't determine the current status of your application. Please contact support if this issue persists.
      </Alert>

      <Button
        component={Link}
        href="/contact"
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Contact Support
      </Button>
    </>
  );
}