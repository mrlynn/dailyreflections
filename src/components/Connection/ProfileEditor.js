'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ContactField from './ContactField';
import ContactFieldEditor from './ContactFieldEditor';
import QRCodeDisplay from './QRCodeDisplay';
import UrlSlugEditor from './UrlSlugEditor';
import { VISIBILITY } from '@/lib/connection-profiles/constants';

const MAX_MESSAGE_LENGTH = 500;
const MAX_HOME_GROUPS = 5;
const MAX_CONTACT_FIELDS = 10;

/**
 * Connection profile editor component
 */
export default function ProfileEditor({
  profile,
  isLoading,
  onUpdate,
  onCreateProfile,
  error
}) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    message: '',
    sobrietyDate: null,
    homeGroups: [],
    contactFields: [],
    isEnabled: true,
    visibility: VISIBILITY.AUTHENTICATED,
    theme: {
      primaryColor: theme.palette.primary.main
    },
    urlSlug: '',
    connectionSettings: {
      allowConnectionRequests: true,
      autoAcceptAuthenticated: false,
      notifyOnRequests: true,
      notifyOnConnectionView: false
    }
  });

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        message: profile.message || '',
        sobrietyDate: profile.sobrietyDate ? new Date(profile.sobrietyDate) : null,
        homeGroups: profile.homeGroups || [],
        contactFields: profile.contactFields || [],
        isEnabled: profile.isEnabled !== false,
        visibility: profile.visibility || VISIBILITY.AUTHENTICATED,
        theme: {
          primaryColor: profile.theme?.primaryColor || theme.palette.primary.main
        },
        urlSlug: profile.urlSlug || '',
        connectionSettings: {
          allowConnectionRequests:
            profile.connectionSettings?.allowConnectionRequests !== false,
          autoAcceptAuthenticated:
            profile.connectionSettings?.autoAcceptAuthenticated === true,
          notifyOnRequests:
            profile.connectionSettings?.notifyOnRequests !== false,
          notifyOnConnectionView:
            profile.connectionSettings?.notifyOnConnectionView === true
        }
      });
    }
  }, [profile, theme.palette.primary.main]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested field changes
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Add home group
  const handleAddHomeGroup = () => {
    if (formData.homeGroups.length >= MAX_HOME_GROUPS) {
      setSnackbar({
        open: true,
        message: `You can add up to ${MAX_HOME_GROUPS} home groups.`,
        severity: 'warning'
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      homeGroups: [...prev.homeGroups, '']
    }));
  };

  // Update home group
  const handleUpdateHomeGroup = (index, value) => {
    const updatedGroups = [...formData.homeGroups];
    updatedGroups[index] = value;

    setFormData(prev => ({
      ...prev,
      homeGroups: updatedGroups
    }));
  };

  // Remove home group
  const handleRemoveHomeGroup = (index) => {
    const updatedGroups = formData.homeGroups.filter((_, i) => i !== index);

    setFormData(prev => ({
      ...prev,
      homeGroups: updatedGroups
    }));
  };

  // Handle dialog open for adding new contact field
  const handleAddContactField = () => {
    if (formData.contactFields.length >= MAX_CONTACT_FIELDS) {
      setSnackbar({
        open: true,
        message: `You can add up to ${MAX_CONTACT_FIELDS} contact methods.`,
        severity: 'warning'
      });
      return;
    }

    setIsEditing(false);
    setEditingField(null);
    setIsDialogOpen(true);
  };

  // Handle dialog open for editing contact field
  const handleEditContactField = (field) => {
    setIsEditing(true);
    setEditingField(field);
    setIsDialogOpen(true);
  };

  // Handle save contact field
  const handleSaveContactField = (field) => {
    if (isEditing) {
      // Update existing field
      const updatedFields = formData.contactFields.map(f =>
        f === editingField ? field : f
      );

      setFormData(prev => ({
        ...prev,
        contactFields: updatedFields
      }));
    } else {
      // Add new field
      setFormData(prev => ({
        ...prev,
        contactFields: [...prev.contactFields, field]
      }));
    }

    setSnackbar({
      open: true,
      message: isEditing ? 'Contact updated successfully' : 'Contact added successfully',
      severity: 'success'
    });
  };

  // Handle delete contact field
  const handleDeleteContactField = (fieldToDelete) => {
    const updatedFields = formData.contactFields.filter(field => field !== fieldToDelete);

    setFormData(prev => ({
      ...prev,
      contactFields: updatedFields
    }));

    setSnackbar({
      open: true,
      message: 'Contact deleted successfully',
      severity: 'success'
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Check if URL slug has changed
      const slugChanged = profile && profile.urlSlug !== formData.urlSlug;

      // If the slug has changed, it needs special handling with the API
      if (slugChanged) {
        // Make a copy of the form data
        const dataWithoutSlug = { ...formData };
        delete dataWithoutSlug.urlSlug;

        // Update profile without the slug
        await onUpdate(dataWithoutSlug);

        // Update the slug separately using the API
        const response = await fetch('/api/user/connection-profile/slug', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({ urlSlug: formData.urlSlug }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update URL');
        }

        setSnackbar({
          open: true,
          message: 'Profile and custom URL updated successfully',
          severity: 'success'
        });
      } else {
        // Normal update without slug change
        if (profile) {
          // Update existing profile
          await onUpdate(formData);
          setSnackbar({
            open: true,
            message: 'Profile updated successfully',
            severity: 'success'
          });
        } else {
          // Create new profile
          await onCreateProfile(formData);
          setSnackbar({
            open: true,
            message: 'Profile created successfully',
            severity: 'success'
          });
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save profile',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile editor tabs">
        <Tab label="Basic Info" id="tab-0" />
        <Tab label="Contact Info" id="tab-1" />
        <Tab label="Settings" id="tab-2" />
        <Tab label="Share" id="tab-3" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Basic Info Tab */}
      {activeTab === 0 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Basic Information</Typography>

              <TextField
                label="Display Name"
                fullWidth
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                helperText="This is how others will see your name"
              />

              <TextField
                label="Personal Message"
                multiline
                rows={4}
                fullWidth
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
                helperText={`${formData.message.length}/${MAX_MESSAGE_LENGTH} characters • A short message about your recovery journey`}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Sobriety Date"
                  value={formData.sobrietyDate}
                  onChange={(date) => handleChange('sobrietyDate', date)}
                  slotProps={{
                    textField: {
                      helperText: "Optional - Only share if you're comfortable",
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Home Groups
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  List the home groups you attend. This helps others identify you from meetings.
                </Typography>

                {formData.homeGroups.map((group, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}
                  >
                    <TextField
                      label={`Home Group ${index + 1}`}
                      fullWidth
                      value={group}
                      onChange={(e) => handleUpdateHomeGroup(index, e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveHomeGroup(index)}
                      sx={{ flexShrink: 0, mt: 1 }}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}

                {formData.homeGroups.length < MAX_HOME_GROUPS && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddHomeGroup}
                    variant="outlined"
                  >
                    Add Home Group
                  </Button>
                )}
              </Box>

              <FormControl fullWidth>
                <InputLabel id="visibility-label">Profile Visibility</InputLabel>
                <Select
                  labelId="visibility-label"
                  value={formData.visibility}
                  onChange={(e) => handleChange('visibility', e.target.value)}
                  label="Profile Visibility"
                >
                  <MenuItem value={VISIBILITY.PUBLIC}>
                    Public (Anyone with the link)
                  </MenuItem>
                  <MenuItem value={VISIBILITY.AUTHENTICATED}>
                    App Users Only (Must be signed in)
                  </MenuItem>
                  <MenuItem value={VISIBILITY.CONNECTIONS}>
                    Connections Only (Requires approval)
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isEnabled}
                    onChange={(e) => handleChange('isEnabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="Profile active and visible"
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Contact Info Tab */}
      {activeTab === 1 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contact Information</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={handleAddContactField}
                disabled={formData.contactFields.length >= MAX_CONTACT_FIELDS}
              >
                Add Contact
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
              Add ways for trusted members of the recovery community to contact you.
              Each contact method can have its own visibility setting.
            </Typography>

            {formData.contactFields.length > 0 ? (
              <List>
                {formData.contactFields.map((field, index) => (
                  <ContactField
                    key={index}
                    field={field}
                    onEdit={handleEditContactField}
                    onDelete={handleDeleteContactField}
                  />
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No contact information added yet.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add phone, email, or social media information to help trusted peers connect with you.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 2 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connection Settings
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.connectionSettings.allowConnectionRequests}
                    onChange={(e) => handleNestedChange('connectionSettings', 'allowConnectionRequests', e.target.checked)}
                  />
                }
                label="Allow people to request to connect with me"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.connectionSettings.autoAcceptAuthenticated}
                    onChange={(e) => handleNestedChange('connectionSettings', 'autoAcceptAuthenticated', e.target.checked)}
                    disabled={!formData.connectionSettings.allowConnectionRequests}
                  />
                }
                label="Automatically accept requests from authenticated users"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.connectionSettings.notifyOnRequests}
                    onChange={(e) => handleNestedChange('connectionSettings', 'notifyOnRequests', e.target.checked)}
                    disabled={!formData.connectionSettings.allowConnectionRequests}
                  />
                }
                label="Notify me when someone requests to connect"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.connectionSettings.notifyOnConnectionView}
                    onChange={(e) => handleNestedChange('connectionSettings', 'notifyOnConnectionView', e.target.checked)}
                  />
                }
                label="Notify me when someone views my profile"
              />

              <Divider />

              {/* URL Slug Editor */}
              <UrlSlugEditor
                currentSlug={formData.urlSlug}
                onUpdate={(newSlug) => handleChange('urlSlug', newSlug)}
                isLoading={isLoading}
                disabled={!profile}
              />

              <Divider sx={{ mt: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Appearance
              </Typography>

              <TextField
                label="Primary Color"
                type="color"
                value={formData.theme.primaryColor}
                onChange={(e) => handleNestedChange('theme', 'primaryColor', e.target.value)}
                sx={{ width: 200 }}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Share Tab */}
      {activeTab === 3 && profile && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Share Your Connection Profile
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Let others connect with you by sharing your QR code or link.
            Scan this code with a phone camera or share the link directly.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <QRCodeDisplay
              urlSlug={profile.urlSlug}
              primaryColor={formData.theme.primaryColor}
              size={250}
            />
          </Box>

          {!formData.isEnabled && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              Your profile is currently disabled. Enable it in the Basic Info tab to allow others to connect with you.
            </Alert>
          )}
        </Box>
      )}

      {/* Create/Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={profile ? null : <PersonAddIcon />}
          disabled={isLoading}
        >
          {profile ? 'Save Changes' : 'Create Connection Profile'}
        </Button>
      </Box>

      {/* Contact Field Editor Dialog */}
      <ContactFieldEditor
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveContactField}
        field={editingField}
        isEditing={isEditing}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}