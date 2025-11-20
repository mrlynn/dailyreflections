'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function FearForm({ fears = [], onSave }) {
  const [formData, setFormData] = useState({
    fear: '',
    reason: '',
    affects: '',
    isRational: 'unsure' // 'yes', 'no', 'unsure'
  });

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const handleRationalChange = (_event, value) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      isRational: value
    }));
  };

  const resetForm = () => {
    setFormData({
      fear: '',
      reason: '',
      affects: '',
      isRational: 'unsure'
    });
    setEditing(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEdit = (index) => {
    setFormData({ ...fears[index] });
    setEditing(index);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.fear) {
      setError('Please describe your fear');
      return;
    }

    let updatedFears = [...fears];

    if (editing !== null) {
      // Update existing fear
      updatedFears[editing] = { ...formData };
    } else {
      // Add new fear
      updatedFears.push({ ...formData, id: Date.now() });
    }

    onSave(updatedFears);
    resetForm();
  };

  const handleDelete = (index) => {
    const updatedFears = fears.filter((_, i) => i !== index);
    onSave(updatedFears);
  };

  return (
    <>
      {/* Form */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderradius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          boxShadow: '0 12px 32px rgba(15, 37, 73, 0.08)'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          {editing !== null ? 'Edit Fear' : 'Add New Fear'}
          <Tooltip title="List your fears and examine why you have them and how they affect your life. Be honest with yourself.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="What are you afraid of?"
                name="fear"
                value={formData.fear}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="Describe your fear"
                slotProps={{
                  input: {
                    sx: {
                      py: 1.5,
                      fontSize: '1.05rem'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Why do you have this fear?"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Past experiences, beliefs, etc."
                multiline
                minRows={3}
                slotProps={{
                  textarea: {
                    sx: {
                      fontSize: '1.05rem',
                      lineHeight: 1.6
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="How does it affect your life?"
                name="affects"
                value={formData.affects}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="How does this fear limit you or affect your behavior"
                multiline
                minRows={3}
                slotProps={{
                  textarea: {
                    sx: {
                      fontSize: '1.05rem',
                      lineHeight: 1.6
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Is this fear rational?
                </Typography>
                <ToggleButtonGroup
                  color="primary"
                  exclusive
                  fullWidth
                  size="large"
                  value={formData.isRational}
                  onChange={handleRationalChange}
                  sx={{
                    '& .MuiToggleButton-root': {
                      flex: 1,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none'
                    }
                  }}
                >
                  <ToggleButton value="yes">Yes</ToggleButton>
                  <ToggleButton value="no">No</ToggleButton>
                  <ToggleButton value="unsure">Not sure</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Typography color="error">{error}</Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={editing !== null ? <SaveIcon /> : <AddIcon />}
                  sx={{ minWidth: 160, py: 1.25, fontWeight: 600 }}
                >
                  {editing !== null ? 'Update Fear' : 'Add to List'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={resetForm}
                  sx={{ minWidth: 160, py: 1.25 }}
                >
                  Clear Form
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* List of Fears */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Fear List ({fears.length})
      </Typography>

      {fears.length > 0 ? (
        <Paper sx={{ mb: 4 }}>
          <List>
            {fears.map((fear, index) => (
              <Box key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div', sx: { mt: 1 } }}
                    primary={
                      <Typography variant="subtitle1" fontWeight={500}>
                        {fear.fear}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        {fear.reason && (
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            <strong>Why:</strong> {fear.reason}
                          </Typography>
                        )}
                        {fear.affects && (
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            <strong>Affects:</strong> {fear.affects}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" component="div">
                          <strong>Rational?</strong> {fear.isRational === 'yes' ? 'Yes' : fear.isRational === 'no' ? 'No' : 'Unsure'}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(index)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < fears.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No fears added yet.
        </Typography>
      )}
    </>
  );
}