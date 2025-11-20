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
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function HarmsForm({ harms = [], onSave }) {
  const [formData, setFormData] = useState({
    who: '',
    what: '',
    effect: '',
    motive: '',
    amends: '',
    priority: 'medium' // 'high', 'medium', 'low'
  });

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      who: '',
      what: '',
      effect: '',
      motive: '',
      amends: '',
      priority: 'medium'
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.who || !formData.what) {
      setError('Please fill out both who you harmed and what you did');
      return;
    }

    let updatedHarms = [...harms];

    if (editing !== null) {
      // Update existing harm
      updatedHarms[editing] = { ...formData };
    } else {
      // Add new harm
      updatedHarms.push({ ...formData, id: Date.now() });
    }

    onSave(updatedHarms);
    resetForm();
  };

  const handleEdit = (index) => {
    setFormData({ ...harms[index] });
    setEditing(index);
  };

  const handleDelete = (index) => {
    const updatedHarms = harms.filter((_, i) => i !== index);
    onSave(updatedHarms);
  };

  const handlePriorityChange = (_event, value) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      priority: value
    }));
  };

  const priorityColors = {
    high: '#f44336', // red
    medium: '#ff9800', // orange
    low: '#4caf50' // green
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
          {editing !== null ? 'Edit Harm Done' : 'Add New Harm Done'}
          <Tooltip title="List people you have harmed. This will help prepare for the amends process in Steps 8 and 9.">
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
                label="Who did you harm?"
                name="who"
                value={formData.who}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="Person or group"
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
                label="What did you do?"
                name="what"
                value={formData.what}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="The specific action or behavior"
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
                label="How did it affect them?"
                name="effect"
                value={formData.effect}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="The impact of your actions"
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="What were your motives?"
                name="motive"
                value={formData.motive}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Selfishness, fear, etc."
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

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Possible amends"
                name="amends"
                value={formData.amends}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="How might you make this right? (This will be addressed in Steps 8-9)"
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

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Priority for amends
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={formData.priority}
                onChange={handlePriorityChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    py: 1.3,
                    fontWeight: 600,
                    textTransform: 'none'
                  }
                }}
              >
                <ToggleButton value="high">High</ToggleButton>
                <ToggleButton value="medium">Medium</ToggleButton>
                <ToggleButton value="low">Low</ToggleButton>
              </ToggleButtonGroup>
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
                  sx={{ minWidth: 180, py: 1.25, fontWeight: 600 }}
                >
                  {editing !== null ? 'Update Harm' : 'Add to List'}
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

      {/* List of Harms */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Harms List ({harms.length})
      </Typography>

      {harms.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Who</TableCell>
                <TableCell>What</TableCell>
                <TableCell>Effects</TableCell>
                <TableCell>Motives</TableCell>
                <TableCell>Possible Amends</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell width="120">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {harms.map((harm, index) => (
                <TableRow key={index}>
                  <TableCell>{harm.who}</TableCell>
                  <TableCell>{harm.what}</TableCell>
                  <TableCell>{harm.effect}</TableCell>
                  <TableCell>{harm.motive}</TableCell>
                  <TableCell>{harm.amends}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: `${priorityColors[harm.priority]}22`,
                        color: priorityColors[harm.priority],
                        border: `1px solid ${priorityColors[harm.priority]}`,
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        fontWeight: 'medium',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      {harm.priority}
                    </Box>
                  </TableCell>
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
          No harms added yet.
        </Typography>
      )}
    </>
  );
}