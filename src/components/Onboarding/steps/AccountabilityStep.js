'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Grid,
  TextField,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Stack,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import SecurityIcon from '@mui/icons-material/Security';

/**
 * Accountability Step Component
 * Third step in onboarding - set up accountability contacts
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to call when data changes
 */
export default function AccountabilityStep({ formData, onChange }) {
  const [accountability, setAccountability] = useState({
    contacts: formData.accountability?.contacts || [],
    shareInventory: formData.accountability?.shareInventory || false,
    shareMilestones: formData.accountability?.shareMilestones || true,
  });

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
  });

  const [errors, setErrors] = useState({});

  // Handle changes to accountability settings
  const handleSettingChange = (event) => {
    const { name, checked } = event.target;

    const updatedAccountability = {
      ...accountability,
      [name]: checked
    };

    setAccountability(updatedAccountability);
    onChange({ accountability: updatedAccountability });
  };

  // Handle changes to new contact form
  const handleContactChange = (event) => {
    const { name, value } = event.target;

    setNewContact({
      ...newContact,
      [name]: value
    });
  };

  // Add a new contact
  const handleAddContact = () => {
    // Basic validation
    const newErrors = {};
    if (!newContact.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!newContact.email.trim() && !newContact.phone.trim()) {
      newErrors.email = 'Email or phone is required';
      newErrors.phone = 'Email or phone is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear any existing errors
    setErrors({});

    // Add contact
    const updatedContacts = [...accountability.contacts, { ...newContact, id: Date.now() }];
    const updatedAccountability = {
      ...accountability,
      contacts: updatedContacts
    };

    setAccountability(updatedAccountability);
    onChange({ accountability: updatedAccountability });

    // Clear form
    setNewContact({
      name: '',
      email: '',
      phone: '',
      relationship: '',
    });
  };

  // Remove a contact
  const handleRemoveContact = (id) => {
    const updatedContacts = accountability.contacts.filter(contact => contact.id !== id);
    const updatedAccountability = {
      ...accountability,
      contacts: updatedContacts
    };

    setAccountability(updatedAccountability);
    onChange({ accountability: updatedAccountability });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Accountability Support
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: 3 }}>
        Optional: Add people who can support your recovery journey. This could be your sponsor,
        counselor, or trusted friends from your home group.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Adding accountability contacts is entirely optional. You can always add or remove contacts later.
        </Typography>
      </Alert>

      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Add a Contact (Optional)
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={newContact.name}
              onChange={handleContactChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Relationship"
              name="relationship"
              value={newContact.relationship}
              onChange={handleContactChange}
              placeholder="Sponsor, Friend, etc."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={newContact.email}
              onChange={handleContactChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone (optional)"
              name="phone"
              value={newContact.phone}
              onChange={handleContactChange}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handleAddContact}
              startIcon={<PersonAddIcon />}
              sx={{ mt: 1 }}
            >
              Add Contact
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Contact List */}
      {accountability.contacts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Contacts ({accountability.contacts.length})
          </Typography>
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <List>
              {accountability.contacts.map((contact, index) => (
                <Box key={contact.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={contact.name}
                      secondary={
                        <Stack spacing={0.5}>
                          {contact.relationship && (
                            <Typography variant="body2" color="text.secondary">
                              {contact.relationship}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {contact.email && `Email: ${contact.email}`}
                            {contact.email && contact.phone && ', '}
                            {contact.phone && `Phone: ${contact.phone}`}
                          </Typography>
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveContact(contact.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < accountability.contacts.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        Sharing Preferences
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={accountability.shareMilestones}
              onChange={handleSettingChange}
              name="shareMilestones"
            />
          }
          label="Share sobriety milestones with contacts"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Notify your accountability contacts when you reach important sobriety milestones.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={accountability.shareInventory}
              onChange={handleSettingChange}
              name="shareInventory"
            />
          }
          label="Allow sharing inventory with selected contacts"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Enable the option to share your Step 10 inventory entries with specific contacts when needed.
        </Typography>
      </Box>

      <Box sx={{ mt: 4, display: 'flex', alignItems: 'flex-start' }}>
        <PrivacyTipIcon color="primary" sx={{ mr: 1.5, mt: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          Your privacy is important. Content is only shared with the specific contacts you choose,
          and you can control exactly what is shared and when. You can change these settings anytime.
        </Typography>
      </Box>
    </Box>
  );
}