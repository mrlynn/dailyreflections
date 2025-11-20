'use client';

import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Alert,
  Button,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/**
 * Review step for application
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when form data changes
 */
export default function ReviewStep({ formData, onChange }) {
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    onChange({ [name]: checked });
  };

  // Sections of data to display
  const sections = [
    {
      title: 'Personal Information',
      data: [
        { label: 'Name', value: formData.name },
        { label: 'Display Name', value: formData.displayName },
        { label: 'Email', value: formData.email },
        { label: 'Phone', value: formData.phone || 'Not provided' },
        { label: 'Location', value: formData.location || 'Not provided' },
        { label: 'Time Zone', value: formData.timezone },
      ],
    },
    {
      title: 'Qualifications',
      data: [
        { label: 'Sobriety Duration', value: formData.sobrietyDuration },
        { label: 'Available Hours', value: formData.availableHoursPerWeek },
        {
          label: 'Has Listening Experience',
          value: formData.hasListeningExperience ? 'Yes' : 'No',
        },
        {
          label: 'Listening Experience Details',
          value: formData.hasListeningExperience
            ? formData.listeningExperienceDetails || 'No details provided'
            : 'N/A',
          multiline: true,
        },
      ],
    },
    {
      title: 'Motivation',
      data: [
        {
          label: 'Why volunteer as a listener?',
          value: formData.volunteerMotivation,
          multiline: true,
        },
        {
          label: 'Connection in recovery',
          value: formData.recoveryConnection,
          multiline: true,
        },
        {
          label: 'Service work meaning',
          value: formData.serviceMeaning,
          multiline: true,
        },
        {
          label: 'Additional information',
          value: formData.additionalInfo || 'None provided',
          multiline: true,
        },
      ],
    },
  ];

  // Guidelines text for volunteers
  const guidelinesText = `
  As a volunteer listener, I understand that I must:
  • Maintain my own recovery as a priority
  • Be available for my committed hours each week
  • Respond to users with empathy and respect
  • Follow all community guidelines and policies
  • Maintain appropriate boundaries with users
  • Complete any required training
  `;

  // Confidentiality text
  const confidentialityText = `
  I agree to:
  • Keep all user conversations completely confidential
  • Not share or discuss user information with anyone
  • Not capture or store chat content outside the platform
  • Report only critical safety concerns to administrators
  • Protect user privacy at all times
  `;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Review Your Application
      </Typography>

      <Typography variant="body1" paragraph color="text.secondary">
        Please review your application details below and agree to the volunteer guidelines and confidentiality agreement.
      </Typography>

      {sections.map((section, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {section.title}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List disablePadding dense>
            {section.data.map((item, i) => (
              <ListItem key={i} disablePadding sx={{ mb: 1.5 }}>
                <ListItemText
                  primary={item.label}
                  secondary={
                    <Typography
                      variant="body2"
                      component="span"
                      color="text.primary"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        whiteSpace: item.multiline ? 'pre-wrap' : 'normal',
                        maxHeight: item.multiline ? '120px' : 'auto',
                        overflow: item.multiline ? 'auto' : 'visible',
                        pl: item.multiline ? 2 : 0,
                        borderLeft: item.multiline ? '2px solid #e0e0e0' : 'none',
                      }}
                    >
                      {item.value}
                    </Typography>
                  }
                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Volunteer Guidelines
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }} color="text.secondary">
          {guidelinesText}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.agreeToGuidelines || false}
              onChange={handleCheckboxChange}
              name="agreeToGuidelines"
              color="primary"
            />
          }
          label="I agree to follow the volunteer guidelines"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Confidentiality Agreement
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }} color="text.secondary">
          {confidentialityText}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.agreeToConfidentiality || false}
              onChange={handleCheckboxChange}
              name="agreeToConfidentiality"
              color="primary"
            />
          }
          label="I agree to maintain confidentiality"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Code of Conduct
        </Typography>
        <Typography variant="body2" paragraph color="text.secondary">
          Our Code of Conduct ensures a safe, respectful, and supportive environment for all community members.
        </Typography>
        <Typography variant="body2" paragraph>
          Review our complete Code of Conduct by clicking the button below. You must agree to these terms to continue.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.open('/volunteers/code-of-conduct', '_blank')}
            startIcon={<OpenInNewIcon />}
          >
            View Full Code of Conduct
          </Button>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.agreeToCodeOfConduct || false}
                onChange={handleCheckboxChange}
                name="agreeToCodeOfConduct"
                color="primary"
              />
            }
            label="I agree to abide by the Code of Conduct"
          />
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 4 }}>
        Once submitted, your application will be reviewed by our team. We may contact you for additional information.
      </Alert>
    </>
  );
}