'use client';

import { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  Stack,
  useTheme,
} from '@mui/material';
import SobrietyDateStep from './steps/SobrietyDateStep';
import NotificationsStep from './steps/NotificationsStep';
import AccountabilityStep from './steps/AccountabilityStep';
import SuccessStep from './steps/SuccessStep';

/**
 * First-time onboarding wizard component
 * Guides new users through setting up their sobriety date, notification preferences,
 * and optional accountability contacts
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the wizard is open
 * @param {Function} props.onComplete - Function to call when onboarding is complete
 * @param {Function} props.onSkip - Function to call when onboarding is skipped
 * @param {Object} props.initialData - Initial data for the form
 */
export default function OnboardingWizard({
  open = false,
  onComplete,
  onSkip,
  initialData = {}
}) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    sobrietyDate: initialData.sobrietyDate || null,
    timezone: initialData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      enabled: initialData.notifications?.enabled || false,
      morningTime: initialData.notifications?.morningTime || '07:00',
      eveningTime: initialData.notifications?.eveningTime || '21:00',
      channels: initialData.notifications?.channels || {
        app: true,
        email: false,
        sms: false
      }
    },
    accountability: {
      contacts: initialData.accountability?.contacts || [],
      shareInventory: initialData.accountability?.shareInventory || false,
      shareMilestones: initialData.accountability?.shareMilestones || true
    },
    setupComplete: false
  });

  // Define steps for the onboarding process
  const steps = [
    'Sobriety Date',
    'Notifications',
    'Accountability',
    'Get Started'
  ];

  // Handle data changes from individual steps
  const handleStepDataChange = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  // Navigate to the next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Navigate to the previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Skip the onboarding process
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Complete the onboarding process
  const handleComplete = () => {
    const finalData = {
      ...formData,
      setupComplete: true
    };

    if (onComplete) {
      onComplete(finalData);
    }
  };

  // Render the current step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <SobrietyDateStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 1:
        return (
          <NotificationsStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 2:
        return (
          <AccountabilityStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 3:
        return (
          <SuccessStep
            formData={formData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  // If the component is not open, don't render anything
  if (!open) {
    return null;
  }

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'rgba(26, 43, 52, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      zIndex: 1200,
      backdropFilter: 'blur(5px)'
    }}>
      <Container maxWidth="md" sx={{ height: '100%', maxHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <Paper
          elevation={4}
          sx={{
            width: '100%',
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom align="center" fontWeight={700} sx={{ mb: 4 }}>
            Welcome to AA Companion
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mb: 4, flex: 1, overflow: 'auto' }}>
            {getStepContent(activeStep)}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Box>
              {activeStep !== steps.length - 1 && (
                <Button
                  color="inherit"
                  onClick={handleSkip}
                  sx={{ mr: 1 }}
                >
                  Skip Setup
                </Button>
              )}
            </Box>
            <Box>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleComplete}
                  sx={{
                    bgcolor: '#5DA6A7',
                    '&:hover': {
                      bgcolor: '#4A8F90',
                    }
                  }}
                >
                  Get Started
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    bgcolor: '#E4B95B',
                    color: '#1A2B34',
                    '&:hover': {
                      bgcolor: '#D4A556',
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}