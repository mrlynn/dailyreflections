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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function ResentmentForm({ resentments = [], onSave }) {
  const affectOptions = [
    { key: 'selfEsteem', label: 'Self-esteem' },
    { key: 'security', label: 'Security' },
    { key: 'ambitions', label: 'Ambitions' },
    { key: 'personalRelations', label: 'Personal relations' },
    { key: 'sexRelations', label: 'Sex relations' }
  ];

  const [formData, setFormData] = useState({
    who: '',
    cause: '',
    affects: {
      selfEsteem: false,
      security: false,
      ambitions: false,
      personalRelations: false,
      sexRelations: false
    },
    myPart: ''
  });

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      who: '',
      cause: '',
      affects: {
        selfEsteem: false,
        security: false,
        ambitions: false,
        personalRelations: false,
        sexRelations: false
      },
      myPart: ''
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

  const toggleAffect = (key) => {
    setFormData((prev) => ({
      ...prev,
      affects: {
        ...prev.affects,
        [key]: !prev.affects[key]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.who || !formData.cause) {
      setError('Please fill out both who you resent and the cause');
      return;
    }

    let updatedResentments = [...resentments];

    if (editing !== null) {
      // Update existing resentment
      updatedResentments[editing] = {
        ...formData,
        affects: { ...formData.affects }
      };
    } else {
      // Add new resentment
      updatedResentments.push({ ...formData, id: Date.now() });
    }

    onSave(updatedResentments);
    resetForm();
  };

  const handleEdit = (index) => {
    const resentment = resentments[index];
    setFormData({
      ...resentment,
      affects: { ...resentment.affects }
    });
    setEditing(index);
  };

  const handleDelete = (index) => {
    const updatedResentments = resentments.filter((_, i) => i !== index);
    onSave(updatedResentments);
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
          {editing !== null ? 'Edit Resentment' : 'Add New Resentment'}
          <Tooltip title="List people, institutions, or principles you resent. Be thorough and honest with yourself.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Who or what do you resent?"
                name="who"
                value={formData.who}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="Person, institution, or principle"
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="What is the cause?"
                name="cause"
                value={formData.cause}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="The specific action or situation"
                multiline
                minRows={2}
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
              <Typography variant="subtitle2" gutterBottom>
                How does it affect me? (check all that apply)
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {affectOptions.map((option) => {
                  const selected = formData.affects[option.key];
                  return (
                    <Chip
                      key={option.key}
                      label={option.label}
                      onClick={() => toggleAffect(option.key)}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{
                        minWidth: 150,
                        fontWeight: selected ? 600 : 500,
                        borderRadius: 2
                      }}
                    />
                  );
                })}
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="What was my part in this?"
                name="myPart"
                value={formData.myPart}
                onChange={handleInputChange}
                multiline
                minRows={4}
                variant="outlined"
                placeholder="How did I contribute to this situation? Where was I selfish, dishonest, self-seeking, or afraid?"
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
                  {editing !== null ? 'Update Resentment' : 'Add to List'}
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

      {/* List of Resentments */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Resentment List ({resentments.length})
      </Typography>

      {resentments.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Who/What</TableCell>
                <TableCell>Cause</TableCell>
                <TableCell>Affects</TableCell>
                <TableCell>My Part</TableCell>
                <TableCell width="120">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resentments.map((resentment, index) => (
                <TableRow key={index}>
                  <TableCell>{resentment.who}</TableCell>
                  <TableCell>{resentment.cause}</TableCell>
                  <TableCell>
                    {Object.entries(resentment.affects)
                      .filter(([, value]) => value)
                      .map(([key]) => {
                        const labels = {
                          selfEsteem: 'Self-esteem',
                          security: 'Security',
                          ambitions: 'Ambitions',
                          personalRelations: 'Personal relations',
                          sexRelations: 'Sex relations'
                        };
                        return labels[key];
                      })
                      .join(', ')}
                  </TableCell>
                  <TableCell>{resentment.myPart}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(index)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No resentments added yet.
        </Typography>
      )}
    </>
  );
}