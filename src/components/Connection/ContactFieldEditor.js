'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { VISIBILITY } from '@/lib/connection-profiles/constants';

const FIELD_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'social', label: 'Social Media' },
  { value: 'custom', label: 'Custom Contact' },
];

/**
 * Dialog for adding or editing contact fields
 */
export default function ContactFieldEditor({
  open,
  onClose,
  onSave,
  field = null,
  isEditing = false
}) {
  const [type, setType] = useState('email');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [visibility, setVisibility] = useState(VISIBILITY.CONNECTIONS);
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens or field changes
  useEffect(() => {
    if (field && isEditing) {
      setType(field.type || 'email');
      setLabel(field.label || '');
      setValue(field.value || '');
      setVisibility(field.visibility || VISIBILITY.CONNECTIONS);
    } else {
      // Default values for new fields
      setType('email');
      setLabel('');
      setValue('');
      setVisibility(VISIBILITY.CONNECTIONS);
    }
    setErrors({});
  }, [field, isEditing, open]);

  const handleSave = () => {
    // Validate inputs
    const newErrors = {};
    if (!type) newErrors.type = 'Type is required';
    if (!value || value.trim() === '') newErrors.value = 'Value is required';
    if (!label && type === 'custom') newErrors.label = 'Label is required for custom fields';

    // For email validation
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors.value = 'Please enter a valid email address';
    }

    // For phone validation (simple check)
    if (type === 'phone' && value.replace(/[^0-9+]/g, '').length < 7) {
      newErrors.value = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Generate a label if not provided
    let finalLabel = label;
    if (!label || label.trim() === '') {
      if (type === 'email') finalLabel = 'Email';
      else if (type === 'phone') finalLabel = 'Phone';
      else if (type === 'social') finalLabel = 'Social Media';
      else finalLabel = 'Contact';
    }

    onSave({
      ...(field || {}),
      type,
      label: finalLabel.trim(),
      value: value.trim(),
      visibility,
    });

    onClose();
  };

  const getVisibilityDescription = (vis) => {
    switch (vis) {
      case VISIBILITY.PUBLIC:
        return 'Anyone with your profile link can see this';
      case VISIBILITY.AUTHENTICATED:
        return 'Only users who are signed in can see this';
      case VISIBILITY.CONNECTIONS:
        return 'Only your approved connections can see this';
      case VISIBILITY.PRIVATE:
        return 'Only you can see this';
      default:
        return '';
    }
  };

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setType(newType);

    // Auto-suggest label based on type
    if ((!label || label === 'Email' || label === 'Phone' || label === 'Social Media' || label === 'Contact')) {
      if (newType === 'email') setLabel('Email');
      else if (newType === 'phone') setLabel('Phone');
      else if (newType === 'social') setLabel('Social Media');
      else setLabel('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Contact Information' : 'Add Contact Information'}
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal" error={Boolean(errors.type)}>
          <InputLabel id="field-type-label">Type</InputLabel>
          <Select
            labelId="field-type-label"
            value={type}
            onChange={handleTypeChange}
            label="Type"
          >
            {FIELD_TYPES.map((fieldType) => (
              <MenuItem key={fieldType.value} value={fieldType.value}>
                {fieldType.label}
              </MenuItem>
            ))}
          </Select>
          {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
        </FormControl>

        <TextField
          margin="normal"
          fullWidth
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={type === 'custom' ? 'e.g., Home Group Phone' : ''}
          helperText={
            errors.label ||
            (type === 'custom'
              ? 'Enter a descriptive label for this contact method'
              : 'Optional custom label')
          }
          error={Boolean(errors.label)}
          required={type === 'custom'}
        />

        <TextField
          margin="normal"
          fullWidth
          label="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            type === 'email' ? 'your@email.com' :
            type === 'phone' ? '(555) 123-4567' :
            type === 'social' ? '@username or link' :
            'Contact information'
          }
          helperText={errors.value || ''}
          error={Boolean(errors.value)}
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="visibility-label">Visibility</InputLabel>
          <Select
            labelId="visibility-label"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            label="Visibility"
          >
            <MenuItem value={VISIBILITY.PRIVATE}>
              Private (Only Me)
            </MenuItem>
            <MenuItem value={VISIBILITY.CONNECTIONS}>
              Connections Only
            </MenuItem>
            <MenuItem value={VISIBILITY.AUTHENTICATED}>
              App Users Only
            </MenuItem>
            <MenuItem value={VISIBILITY.PUBLIC}>
              Public (Anyone)
            </MenuItem>
          </Select>
          <FormHelperText>{getVisibilityDescription(visibility)}</FormHelperText>
        </FormControl>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Note: Be mindful of your anonymity when sharing contact information.
          Consider the traditions of Alcoholics Anonymous before sharing identifiable information.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {isEditing ? 'Save Changes' : 'Add Contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}