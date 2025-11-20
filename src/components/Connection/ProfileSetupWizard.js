'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MobileStepper,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { VISIBILITY } from '@/lib/connection-profiles/constants';

const steps = ['Welcome', 'Basic Info', 'Privacy', 'Review'];

/**
 * Connection profile setup wizard component
 */
export default function ProfileSetupWizard({ onComplete, isLoading, error }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    displayName: '',
    message: '',
    sobrietyDate: null,
    homeGroups: [''],
    visibility: VISIBILITY.AUTHENTICATED,
    isEnabled: true,
    privacyChecked: false
  });

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateHomeGroup = (index, value) => {
    const updatedGroups = [...formData.homeGroups];
    updatedGroups[index] = value;
    updateField('homeGroups', updatedGroups);
  };

  const addHomeGroup = () => {
    if (formData.homeGroups.length < 5) {
      updateField('homeGroups', [...formData.homeGroups, '']);
    }
  };

  const removeHomeGroup = (index) => {
    const updatedGroups = formData.homeGroups.filter((_, i) => i !== index);
    if (updatedGroups.length === 0) {
      updatedGroups.push('');
    }
    updateField('homeGroups', updatedGroups);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleComplete = () => {
    // Filter out empty home groups
    const filteredHomeGroups = formData.homeGroups.filter(group => group.trim() !== '');

    // Create the profile
    onComplete({
      displayName: formData.displayName,
      message: formData.message,
      sobrietyDate: formData.sobrietyDate,
      homeGroups: filteredHomeGroups,
      visibility: formData.visibility,
      isEnabled: formData.isEnabled,
    });
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Welcome to Recovery Connections
            </Typography>
            <Typography variant="body1" paragraph>
              Create your connection profile to share your contact information with trusted members of the recovery community.
            </Typography>
            <Typography variant="body1" paragraph>
              This feature makes it easy to exchange contact information at meetings without having to write things down.
              Just scan a QR code to connect!
            </Typography>
            <Typography variant="body1" paragraph>
              You'll have full control over what information is shared and with whom.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              This wizard will guide you through setting up your profile. You can always update it later.
            </Alert>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Basic Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Tell others a bit about yourself. Only share what you're comfortable with.
            </Typography>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <TextField
                label="Display Name"
                fullWidth
                required
                value={formData.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                helperText="This is how others will see your name"
              />

              <TextField
                label="Personal Message"
                multiline
                rows={3}
                fullWidth
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                helperText="Optional: A short message about your recovery journey"
              />

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Sobriety Date"
                  value={formData.sobrietyDate}
                  onChange={(date) => updateField('sobrietyDate', date)}
                  slotProps={{
                    textField: {
                      helperText: "Optional: Only share if you're comfortable",
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>

              <Typography variant="subtitle1" gutterBottom>
                Home Groups
              </Typography>

              {formData.homeGroups.map((group, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}
                >
                  <TextField
                    label={`Home Group ${index + 1}`}
                    fullWidth
                    value={group}
                    onChange={(e) => updateHomeGroup(index, e.target.value)}
                    helperText={index === 0 ? "Optional: List groups you attend" : ""}
                  />
                  {formData.homeGroups.length > 1 && (
                    <Button
                      color="error"
                      onClick={() => removeHomeGroup(index)}
                      sx={{ mt: 1 }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              ))}

              {formData.homeGroups.length < 5 && (
                <Button onClick={addHomeGroup} sx={{ alignSelf: 'flex-start' }}>
                  Add Another Home Group
                </Button>
              )}
            </Stack>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Privacy Settings
            </Typography>
            <Typography variant="body1" paragraph>
              Control who can see your recovery connection profile.
            </Typography>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Profile Visibility
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.visibility === VISIBILITY.CONNECTIONS}
                        onChange={() => updateField('visibility', VISIBILITY.CONNECTIONS)}
                      />
                    }
                    label="Connections Only (Recommended)"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Only people you approve can see your profile details.
                  </Typography>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.visibility === VISIBILITY.AUTHENTICATED}
                        onChange={() => updateField('visibility', VISIBILITY.AUTHENTICATED)}
                      />
                    }
                    label="App Users Only"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Anyone with an account can view your profile.
                  </Typography>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.visibility === VISIBILITY.PUBLIC}
                        onChange={() => updateField('visibility', VISIBILITY.PUBLIC)}
                      />
                    }
                    label="Public (Anyone with the link)"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Anyone with your profile link can view your information.
                  </Typography>
                </Stack>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                You can add specific contact methods and set individual privacy levels for each after setup.
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.privacyChecked}
                    onChange={(e) => updateField('privacyChecked', e.target.checked)}
                    required
                  />
                }
                label="I understand my privacy settings and am comfortable sharing this information"
              />
            </Stack>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Review Your Profile
            </Typography>
            <Typography variant="body1" paragraph>
              Review your connection profile details before creating it.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Display Name
                  </Typography>
                  <Typography variant="body1">
                    {formData.displayName || '(Not provided)'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Personal Message
                  </Typography>
                  <Typography variant="body1">
                    {formData.message || '(Not provided)'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sobriety Date
                  </Typography>
                  <Typography variant="body1">
                    {formData.sobrietyDate
                      ? new Date(formData.sobrietyDate).toLocaleDateString()
                      : '(Not provided)'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Home Groups
                  </Typography>
                  {formData.homeGroups.some(group => group.trim() !== '') ? (
                    formData.homeGroups
                      .filter(group => group.trim() !== '')
                      .map((group, index) => (
                        <Typography key={index} variant="body1">
                          {group}
                        </Typography>
                      ))
                  ) : (
                    <Typography variant="body1">(Not provided)</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Visibility
                  </Typography>
                  <Typography variant="body1">
                    {formData.visibility === VISIBILITY.PUBLIC && 'Public (Anyone with the link)'}
                    {formData.visibility === VISIBILITY.AUTHENTICATED && 'App Users Only'}
                    {formData.visibility === VISIBILITY.CONNECTIONS && 'Connections Only'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Alert severity="info" sx={{ mt: 3 }}>
              After creating your profile, you'll be able to add specific contact methods and customize more settings.
            </Alert>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    if (activeStep === 1 && !formData.displayName.trim()) {
      return true;
    }
    if (activeStep === 2 && !formData.privacyChecked) {
      return true;
    }
    return false;
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <PersonAddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Create Connection Profile
        </Typography>
      </Box>

      {/* Stepper */}
      {!isMobile && (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step content */}
      <Box sx={{ mt: 2, minHeight: 300 }}>
        {getStepContent(activeStep)}
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || isLoading}
          startIcon={<KeyboardArrowLeft />}
        >
          Back
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleOutlineIcon />}
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isNextDisabled()}
              endIcon={<KeyboardArrowRight />}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Mobile stepper */}
      {isMobile && (
        <MobileStepper
          variant="dots"
          steps={steps.length}
          position="static"
          activeStep={activeStep}
          sx={{ mt: 2, flexGrow: 1 }}
          nextButton={<div />}
          backButton={<div />}
        />
      )}
    </Box>
  );
}