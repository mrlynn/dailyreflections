'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import SupportIcon from '@mui/icons-material/Support';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import GavelIcon from '@mui/icons-material/Gavel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Volunteer Code of Conduct Component
 * Displays the full volunteer code of conduct and provides agreement functionality
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when closing
 * @param {Function} props.onAgree - Function to call when user agrees to the code of conduct
 * @param {boolean} props.alreadyAgreed - Whether the user has already agreed to the code of conduct
 * @param {boolean} props.loading - Whether the agreement action is in progress
 * @param {string} props.error - Error message to display if there was an error
 * @param {boolean} props.embedded - Whether to display the component embedded (not in a dialog)
 */
export default function CodeOfConduct({
  open = false,
  onClose,
  onAgree,
  alreadyAgreed = false,
  loading = false,
  error = null,
  embedded = false
}) {
  const [expanded, setExpanded] = useState(false);

  // Handle agreement button click
  const handleAgree = () => {
    if (onAgree && !alreadyAgreed) {
      onAgree();
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // The content of the code of conduct
  const codeOfConductContent = (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Volunteer Listener Code of Conduct
      </Typography>
      <Typography variant="body1" paragraph color="text.secondary">
        As volunteer listeners, we commit to upholding the highest standards of support and care within our community. This Code of Conduct outlines the expectations and responsibilities of all volunteers.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Core Principles
      </Typography>

      <List disablePadding>
        <ListItem alignItems="flex-start">
          <ListItemIcon>
            <PersonIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Respect and Dignity"
            secondary="Treat all community members with respect and dignity, regardless of their background, beliefs, or recovery status."
          />
        </ListItem>

        <ListItem alignItems="flex-start">
          <ListItemIcon>
            <SecurityIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Safety"
            secondary="Prioritize the safety of all members and take appropriate action when someone may be at risk of harm."
          />
        </ListItem>

        <ListItem alignItems="flex-start">
          <ListItemIcon>
            <PrivacyTipIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Confidentiality"
            secondary="Maintain strict confidentiality of all chat conversations and personal information shared by community members."
          />
        </ListItem>

        <ListItem alignItems="flex-start">
          <ListItemIcon>
            <SupportIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Supportive Environment"
            secondary="Create a welcoming and supportive environment where people feel comfortable sharing their experiences."
          />
        </ListItem>

        <ListItem alignItems="flex-start">
          <ListItemIcon>
            <VolunteerActivismIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Sobriety Commitment"
            secondary="Maintain your own continuous sobriety while serving as a volunteer. If your sobriety status changes, inform the admin team immediately."
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Detailed Guidelines
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Boundaries and Appropriate Support</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText primary="Maintain appropriate boundaries with all community members." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Focus on providing peer support, not professional counseling or therapy." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Share from personal experience rather than giving direct advice." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Avoid forming exclusive relationships with community members outside the platform." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Do not accept or offer money, gifts, or services to community members." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Confidentiality and Privacy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText primary="Never share chat content or user information with anyone outside the platform." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Do not screenshot, record, or otherwise capture chat content." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Report safety concerns to administrators using the proper channels." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Respect all privacy settings and preferences chosen by community members." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Commitment and Reliability</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText primary="Honor your time commitments for volunteer availability." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Give adequate notice when you cannot fulfill scheduled volunteer times." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Complete all required training and orientation sessions." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Regularly check for and read volunteer updates and announcements." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Crisis Response</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText primary="Know and follow the crisis response protocol for emergencies." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Immediately escalate any threats of self-harm, suicide, or harm to others." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Provide appropriate resources to users in crisis." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Never attempt to personally intervene in a crisis situation beyond platform guidelines." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Communication Standards</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText primary="Communicate with empathy, patience, and respect." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Avoid judgmental language or imposing personal beliefs." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Respect the traditions and principles of AA when providing support." />
            </ListItem>
            <ListItem>
              <ListItemText primary="Provide feedback to the administrative team when platform improvements could be made." />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <GavelIcon color="warning" sx={{ mr: 1 }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Violation Consequences
        </Typography>
      </Box>

      <Typography variant="body2" paragraph color="text.secondary">
        Violations of this Code of Conduct may result in temporary suspension or permanent removal from the volunteer program, depending on the severity and context of the violation. All volunteers have the right to explain their perspective if a concern is raised.
      </Typography>

      <Box sx={{ bgcolor: 'rgba(93, 166, 167, 0.1)', p: 2, borderRadius: 1, mt: 2 }}>
        <Typography variant="body2" fontWeight={500} paragraph>
          By agreeing to this Code of Conduct, I acknowledge that I have read and understood these guidelines and commit to upholding them throughout my service as a volunteer listener.
        </Typography>
      </Box>
    </Box>
  );

  // If embedded, return the content directly
  if (embedded) {
    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        {codeOfConductContent}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {alreadyAgreed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, color: 'success.main' }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            <Typography variant="body2" fontWeight={500}>
              You have already agreed to the Code of Conduct
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAgree}
              disabled={loading || alreadyAgreed}
              sx={{
                bgcolor: '#5DA6A7',
                '&:hover': {
                  bgcolor: '#4A8F90',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'I Agree to the Code of Conduct'}
            </Button>
          </Box>
        )}
      </Paper>
    );
  }

  // Otherwise return in dialog
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="code-of-conduct-dialog-title"
    >
      <DialogTitle id="code-of-conduct-dialog-title">
        Volunteer Listener Code of Conduct
      </DialogTitle>

      <DialogContent dividers>
        {codeOfConductContent}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
        {!alreadyAgreed && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAgree}
            disabled={loading}
            sx={{
              bgcolor: '#5DA6A7',
              '&:hover': {
                bgcolor: '#4A8F90',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'I Agree'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}