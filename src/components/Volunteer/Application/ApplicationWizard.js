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
  Alert,
  useTheme,
} from '@mui/material';
import useVolunteerApplication from '@/hooks/useVolunteerApplication';
import PersonalInfoStep from './steps/PersonalInfoStep';
import QualificationsStep from './steps/QualificationsStep';
import MotivationStep from './steps/MotivationStep';
import ReviewStep from './steps/ReviewStep';
import SubmittedStep from './steps/SubmittedStep';

/**
 * Volunteer Application Wizard
 * Multi-step form for users to apply to become volunteer listeners
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the wizard is open
 * @param {Function} props.onClose - Function to call to close the wizard
 * @param {Object} props.userData - Current user data
 */
export default function ApplicationWizard({
  open = false,
  onClose,
  userData = {}
}) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal info
    name: userData.name || '',
    displayName: userData.displayName || '',
    email: userData.email || '',
    phone: userData.phone || '',
    location: userData.location || '',
    timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Qualifications
    sobrietyDate: null,
    sobrietyDuration: '',
    hasListeningExperience: false,
    listeningExperienceDetails: '',
    availableHoursPerWeek: '',

    // Motivation
    volunteerMotivation: '',
    recoveryConnection: '',
    serviceMeaning: '',
    additionalInfo: '',

    // Agreement flags
    agreeToGuidelines: false,
    agreeToConfidentiality: false,
    agreeToCodeOfConduct: false,

    // Status tracking
    isSubmitted: false,
    submissionDate: null,
    applicationStatus: 'draft'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Define steps for the application process
  const steps = [
    'Personal Information',
    'Qualifications',
    'Motivation',
    'Review',
    'Submitted'
  ];

  // Handle data changes from individual steps
  const handleStepDataChange = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  // Navigate to the next step
  const handleNext = () => {
    const isCurrentStepValid = validateCurrentStep();

    if (!isCurrentStepValid) {
      return;
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Navigate to the previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Validate the current step before proceeding
  const validateCurrentStep = () => {
    setError('');

    switch(activeStep) {
      case 0: // Personal Info
        if (!formData.name || !formData.displayName) {
          setError('Please provide your name and display name.');
          return false;
        }
        return true;

      case 1: // Qualifications
        if (!formData.sobrietyDuration || !formData.availableHoursPerWeek) {
          setError('Please fill out all required fields.');
          return false;
        }
        return true;

      case 2: // Motivation
        if (!formData.volunteerMotivation || !formData.recoveryConnection || !formData.serviceMeaning) {
          setError('Please answer all the questions.');
          return false;
        }
        return true;

      case 3: // Review
        if (!formData.agreeToGuidelines || !formData.agreeToConfidentiality || !formData.agreeToCodeOfConduct) {
          setError('You must agree to all terms to continue.');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Import the volunteer application hook
  const {
    submitApplication,
    agreeToCodeOfConduct,
    loading: submissionLoading,
    error: submissionError
  } = useVolunteerApplication();

  // Submit the application
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // First submit the application
      const applicationData = {
        sobrietyDuration: formData.sobrietyDuration,
        volunteerMotivation: formData.volunteerMotivation,
        recoveryConnection: formData.recoveryConnection,
        serviceMeaning: formData.serviceMeaning,
        listeningExperienceDetails: formData.listeningExperienceDetails,
        availableHoursPerWeek: formData.availableHoursPerWeek,
        additionalInfo: formData.additionalInfo || ''
      };

      const application = await submitApplication(applicationData);

      if (!application) {
        throw new Error(submissionError || 'Failed to submit application');
      }

      // Then agree to code of conduct if checked
      if (formData.agreeToCodeOfConduct) {
        const codeOfConductSuccess = await agreeToCodeOfConduct();
        if (!codeOfConductSuccess) {
          console.warn('Failed to record code of conduct agreement, but application was submitted');
        }
      }

      // Update form data with submission details
      setFormData(prev => ({
        ...prev,
        isSubmitted: true,
        submissionDate: new Date().toISOString(),
        applicationStatus: 'pending',
        applicationId: application._id || application.id
      }));

      // Go to success step
      setActiveStep(4);

    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close the application wizard
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Render the current step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 1:
        return (
          <QualificationsStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 2:
        return (
          <MotivationStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
            onChange={handleStepDataChange}
          />
        );
      case 4:
        return (
          <SubmittedStep
            formData={formData}
            onClose={handleClose}
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
            Volunteer Application
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4, flex: 1, overflow: 'auto' }}>
            {getStepContent(activeStep)}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="space-between">
            {activeStep !== 4 ? (
              <>
                <Button
                  color="inherit"
                  onClick={handleClose}
                  sx={{ mr: 1 }}
                >
                  {activeStep === 0 ? 'Cancel' : 'Save & Exit'}
                </Button>

                <Box>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>

                  {activeStep === steps.length - 2 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      sx={{
                        bgcolor: '#5DA6A7',
                        '&:hover': {
                          bgcolor: '#4A8F90',
                        }
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
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
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{
                  ml: 'auto',
                  bgcolor: '#5DA6A7',
                  '&:hover': {
                    bgcolor: '#4A8F90',
                  }
                }}
              >
                Close
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}