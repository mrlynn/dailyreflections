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
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stack,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function SexConductForm({ sexConduct, onSave }) {
  const issueOptions = [
    { key: 'selfish', label: 'Selfish' },
    { key: 'dishonest', label: 'Dishonest' },
    { key: 'inconsiderate', label: 'Inconsiderate' },
    { key: 'jealousy', label: 'Caused jealousy' },
    { key: 'bitterness', label: 'Caused bitterness' },
    { key: 'suspicion', label: 'Caused suspicion' }
  ];

  const [relationships, setRelationships] = useState(sexConduct?.relationships || []);
  const [patterns, setPatterns] = useState(sexConduct?.patterns || '');
  const [idealBehavior, setIdealBehavior] = useState(sexConduct?.idealBehavior || '');

  const [relationship, setRelationship] = useState({
    person: '',
    issues: {
      selfish: false,
      dishonest: false,
      inconsiderate: false,
      jealousy: false,
      bitterness: false,
      suspicion: false
    },
    hurtCaused: '',
    notes: ''
  });

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const resetRelationshipForm = () => {
    setRelationship({
      person: '',
      issues: {
        selfish: false,
        dishonest: false,
        inconsiderate: false,
        jealousy: false,
        bitterness: false,
        suspicion: false
      },
      hurtCaused: '',
      notes: ''
    });
    setEditing(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRelationship({
      ...relationship,
      [name]: value
    });
  };

  const toggleIssue = (key) => {
    setRelationship((prev) => ({
      ...prev,
      issues: {
        ...prev.issues,
        [key]: !prev.issues[key]
      }
    }));
  };

  const handleRelationshipSubmit = (e) => {
    e.preventDefault();

    if (!relationship.person) {
      setError('Please provide a name or descriptor for this relationship');
      return;
    }

    let updatedRelationships = [...relationships];

    if (editing !== null) {
      // Update existing relationship
      updatedRelationships[editing] = { ...relationship };
    } else {
      // Add new relationship
      updatedRelationships.push({ ...relationship, id: Date.now() });
    }

    setRelationships(updatedRelationships);
    onSave({
      relationships: updatedRelationships,
      patterns,
      idealBehavior
    });
    resetRelationshipForm();
  };

  const handleEdit = (index) => {
    const rel = relationships[index];
    setRelationship({
      ...rel,
      issues: { ...rel.issues }
    });
    setEditing(index);
  };

  const handleDelete = (index) => {
    const updatedRelationships = relationships.filter((_, i) => i !== index);
    setRelationships(updatedRelationships);
    onSave({
      relationships: updatedRelationships,
      patterns,
      idealBehavior
    });
  };

  const handlePatternChange = (e) => {
    const newPatterns = e.target.value;
    setPatterns(newPatterns);
    onSave({
      relationships,
      patterns: newPatterns,
      idealBehavior
    });
  };

  const handleIdealBehaviorChange = (e) => {
    const newIdealBehavior = e.target.value;
    setIdealBehavior(newIdealBehavior);
    onSave({
      relationships,
      patterns,
      idealBehavior: newIdealBehavior
    });
  };

  return (
    <>
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        In reviewing our sex conduct and relationships, we examine our behavior honestly and look for patterns.
      </Typography>

      {/* Past Relationships Form */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mt: 4,
          borderradius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          boxShadow: '0 12px 32px rgba(15, 37, 73, 0.08)'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          {editing !== null ? 'Edit Relationship' : 'Add Relationship or Sexual Conduct'}
          <Tooltip title="Add significant relationships or sexual encounters that require honest review. This helps identify patterns of behavior.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>

        <form onSubmit={handleRelationshipSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Person or relationship"
                name="person"
                value={relationship.person}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="Name or descriptor (e.g., 'First spouse' or 'College relationship')"
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
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Where was I? (tap all that apply)
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {issueOptions.map((option) => {
                    const selected = relationship.issues[option.key];
                    return (
                      <Chip
                        key={option.key}
                        label={option.label}
                        onClick={() => toggleIssue(option.key)}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          minWidth: 160,
                          borderRadius: 2,
                          fontWeight: selected ? 600 : 500
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Who did I hurt?"
                name="hurtCaused"
                value={relationship.hurtCaused}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Who was hurt by my actions?"
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
              <TextField
                fullWidth
                label="Additional notes"
                name="notes"
                value={relationship.notes}
                onChange={handleInputChange}
                multiline
                minRows={4}
                variant="outlined"
                placeholder="Any additional thoughts or reflections"
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
                  sx={{ minWidth: 200, py: 1.25, fontWeight: 600 }}
                >
                  {editing !== null ? 'Update Relationship' : 'Add to Relationships'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={resetRelationshipForm}
                  sx={{ minWidth: 160, py: 1.25 }}
                >
                  Clear Form
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* List of Relationships */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Relationship List ({relationships.length})
      </Typography>

      {relationships.length > 0 ? (
        <List sx={{ mb: 4, bgcolor: 'background.paper' }}>
          {relationships.map((rel, index) => (
            <Paper key={index} sx={{ mb: 2, overflow: 'hidden' }}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight={500}>
                      {rel.person}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(rel.issues).some(([, value]) => value) && (
                        <Typography variant="body2" component="div" gutterBottom>
                          <strong>Issues:</strong>{' '}
                          {Object.entries(rel.issues)
                            .filter(([, value]) => value)
                            .map(([key]) => {
                              const labels = {
                                selfish: 'Selfish',
                                dishonest: 'Dishonest',
                                inconsiderate: 'Inconsiderate',
                                jealousy: 'Caused jealousy',
                                bitterness: 'Caused bitterness',
                                suspicion: 'Caused suspicion'
                              };
                              return labels[key];
                            })
                            .join(', ')}
                        </Typography>
                      )}

                      {rel.hurtCaused && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Hurt caused to:</strong> {rel.hurtCaused}
                        </Typography>
                      )}

                      {rel.notes && (
                        <Typography variant="body2">
                          <strong>Notes:</strong> {rel.notes}
                        </Typography>
                      )}
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
            </Paper>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No relationships added yet.
        </Typography>
      )}

      {/* Patterns Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Identify Patterns
        </Typography>
        <Typography variant="body2" paragraph>
          Looking at your relationships as a whole, what patterns or recurring issues do you see?
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={patterns}
          onChange={handlePatternChange}
          placeholder="Example: I tend to be dishonest in relationships when I'm afraid of rejection. I often put my needs ahead of others."
          variant="outlined"
          slotProps={{
            textarea: {
              sx: {
                fontSize: '1.05rem',
                lineHeight: 1.6
              }
            }
          }}
        />
      </Paper>

      {/* Ideal Behavior */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Ideal Behavior Going Forward
        </Typography>
        <Typography variant="body2" paragraph>
          What would you like your ideal behavior to be in relationships going forward?
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={idealBehavior}
          onChange={handleIdealBehaviorChange}
          placeholder="Example: I want to be honest even when it's difficult. I want to consider others' needs and feelings..."
          variant="outlined"
          slotProps={{
            textarea: {
              sx: {
                fontSize: '1.05rem',
                lineHeight: 1.6
              }
            }
          }}
        />
      </Paper>
    </>
  );
}