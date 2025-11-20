'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Rating,
  Stack,
  Chip,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tab,
  Tabs,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import MoodIcon from '@mui/icons-material/Mood';
import Link from 'next/link';
import { useGuestSession } from '@/components/GuestSessionProvider';

// List of common character assets in recovery
const commonAssets = [
  'Honesty', 'Hope', 'Faith', 'Courage', 'Integrity',
  'Willingness', 'Humility', 'Brotherly love', 'Justice',
  'Perseverance', 'Spirituality', 'Service', 'Patience',
  'Open-mindedness', 'Acceptance', 'Gratitude', 'Forgiveness'
];

// List of common tags for entries
const suggestedTags = [
  'meeting', 'sponsor', 'step-work', 'service', 'amends',
  'family', 'work', 'self-care', 'gratitude', 'challenge',
  'prayer', 'meditation', 'growth', 'victory', 'struggle'
];

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { storage, isGuest, isReady: guestReady } = useGuestSession();

  // State for the entry form
  const [entryType, setEntryType] = useState('full'); // 'full', 'quick', or 'check-in'
  const [activeStep, setActiveStep] = useState(0); // For stepper in full mode
  const [activeTab, setActiveTab] = useState(0); // For tabs in quick mode

  const [entry, setEntry] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    mood: 3, // 1-5 scale
    gratitude: [''], // Array of gratitude items
    inventory: {
      resentments: '',
      fears: '',
      honesty: '',
      amends: '',
      service: '',
      prayer: '',
      selfishness: '',
      dishonesty: '',
      self_seeking: '',
      fear: ''
    },
    reflections: '',
    promises: '',
    improvements: '',
    assets: [],
    tags: [],
    isPrivate: true
  });

  const [newTag, setNewTag] = useState('');
  const [newGratitude, setNewGratitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showInfoText, setShowInfoText] = useState({});

  // Buffered text input to prevent focus loss by decoupling typing from parent state
  function BufferedTextField({ initialValue = '', onCommit, onChange, ...props }) {
    const [localValue, setLocalValue] = useState(initialValue);
    useEffect(() => {
      setLocalValue(initialValue ?? '');
    }, [initialValue]);

    const handleBlur = () => {
      if (onCommit && localValue !== initialValue) onCommit(localValue);
    };

    return (
      <TextField
        {...props}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          if (onChange) onChange(e);
        }}
        onBlur={handleBlur}
      />
    );
  }

  // Guidance text for each section
  const sectionInfo = {
    resentments: "List any resentments you experienced today. Who or what are you resentful toward? What's the perceived wrong? How is it affecting you?",
    fears: "What fears did you experience today? What are you afraid might happen?",
    honesty: "Were you completely honest today? Did you stretch the truth or omit important details in any situation?",
    amends: "Do you need to make amends to anyone for your actions today? How might you make it right?",
    service: "How did you help others today? Did you perform any service, big or small?",
    prayer: "Did you connect with your higher power today? How did prayer or meditation feature in your day?",
    selfishness: "Where were you selfish today? Did you think of yourself first at the expense of others?",
    dishonesty: "Where were you dishonest today? This includes white lies, omissions, and exaggerations.",
    self_seeking: "Where did you seek recognition, praise, or attention at the expense of others?",
    fear: "How did fear affect your decisions and behaviors today?"
  };

  // Handle entry type change
  const handleEntryTypeChange = (event) => {
    setEntryType(event.target.value);
    setActiveStep(0);
    setActiveTab(0);
  };

  // Handle form field changes with event objects
  const handleChange = (field, e) => {
    const value = e.target ? e.target.value : e;

    // Using a function form of setState to ensure we're working with the latest state
    // This approach helps prevent focus loss by batching updates
    setEntry(prev => {
      // Check if value is actually different to avoid unnecessary rerenders
      if (prev[field] === value) {
        return prev; // No change, return previous state to prevent rerender
      }

      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Handle inventory field changes with event objects
  const handleInventoryChange = (field, e) => {
    const value = e.target ? e.target.value : e;

    setEntry(prev => {
      // Check if value is actually different to avoid unnecessary rerenders
      if (prev.inventory[field] === value) {
        return prev; // No change, return previous state to prevent rerender
      }

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [field]: value
        }
      };
    });
  };

  // Handle gratitude list with event objects
  const handleGratitudeChange = (index, e) => {
    const value = e.target ? e.target.value : e;

    setEntry(prev => {
      // Check if value is actually different to avoid unnecessary rerenders
      if (prev.gratitude[index] === value) {
        return prev; // No change, return previous state to prevent rerender
      }

      const newGratitude = [...prev.gratitude];
      newGratitude[index] = value;

      return {
        ...prev,
        gratitude: newGratitude
      };
    });
  };

  const addGratitude = () => {
    if (newGratitude.trim()) {
      setEntry(prev => ({
        ...prev,
        gratitude: [...prev.gratitude, newGratitude]
      }));
      setNewGratitude('');
    }
  };

  const removeGratitude = (index) => {
    const newGratitude = [...entry.gratitude];
    newGratitude.splice(index, 1);
    if (newGratitude.length === 0) {
      newGratitude.push('');
    }
    setEntry(prev => ({
      ...prev,
      gratitude: newGratitude
    }));
  };

  // Handle character assets
  const toggleAsset = (asset) => {
    const newAssets = entry.assets.includes(asset)
      ? entry.assets.filter(a => a !== asset)
      : [...entry.assets, asset];
    setEntry(prev => ({
      ...prev,
      assets: newAssets
    }));
  };

  // Handle tags
  const addTag = () => {
    if (newTag.trim() && !entry.tags.includes(newTag.trim())) {
      setEntry(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addSuggestedTag = (tag) => {
    if (!entry.tags.includes(tag)) {
      setEntry(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Stepper navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Tab navigation
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Toggle info text visibility
  const toggleInfoText = (section) => {
    setShowInfoText(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Save entry
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!storage) {
      setError('Storage is not available. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Filter out empty gratitude items
      const filteredEntry = {
        ...entry,
        gratitude: entry.gratitude.filter(item => item.trim() !== ''),
        entryType
      };

      // If it's a check-in type, simplify the entry
      if (entryType === 'check-in') {
        filteredEntry.inventory = {};
        filteredEntry.assets = [];
        filteredEntry.promises = '';
        filteredEntry.improvements = '';
      }

      await storage.journal.createEntry(filteredEntry);
      setSuccess(true);

      // Redirect to journal list after a short delay
      setTimeout(() => {
        router.push('/journal');
      }, 1500);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!guestReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Full 10th Step inventory form with stepper
  const FullInventoryForm = () => (
    <Box>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step>
          <StepLabel>
            <Typography variant="h6">Daily Check-In</Typography>
          </StepLabel>
          <StepContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  How are you feeling today? Rate your mood:
                </Typography>
                <Box display="flex" alignItems="center">
                  <MoodBadIcon color="error" sx={{ mr: 1 }} />
                  <Rating
                    name="mood"
                    value={entry.mood}
                    onChange={(_, newValue) => {
                      // Only update on complete or deliberate rating changes
                      if (newValue !== null) {
                        handleChange('mood', newValue);
                      }
                    }}
                    max={5}
                  />
                  <MoodIcon color="success" sx={{ ml: 1 }} />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  What are you grateful for today?
                </Typography>
                {entry.gratitude.map((item, index) => (
                  <Box key={`gratitude-${index}`} sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                    <BufferedTextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      initialValue={item || ''}
                      onCommit={(value) => {
                        const newGratitude = [...entry.gratitude];
                        newGratitude[index] = value;
                        setEntry(prev => ({
                          ...prev,
                          gratitude: newGratitude
                        }));
                      }}
                      label={`Gratitude item ${index + 1}`}
                      sx={{ mr: 1 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeGratitude(index)}
                      disabled={entry.gratitude.length === 1 && index === 0}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', mt: 1, alignItems: 'center' }}>
                  <BufferedTextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    initialValue={newGratitude}
                    onCommit={(value) => setNewGratitude(value)}
                    onChange={(e) => setNewGratitude(e.target.value)}
                    label="Add another gratitude item"
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    color="primary"
                    onClick={addGratitude}
                    disabled={!newGratitude.trim()}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>
            <Typography variant="h6">Daily Inventory - Part 1</Typography>
          </StepLabel>
          <StepContent>
            <Grid container spacing={3}>
              {['resentments', 'fears', 'honesty'].map(field => (
                <Grid item xs={12} key={field}>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {field}
                    </Typography>
                    <Tooltip title="Show guidance">
                      <IconButton size="small" onClick={() => toggleInfoText(field)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {showInfoText[field] && (
                    <Alert
                      severity="info"
                      sx={{ mb: 1 }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => toggleInfoText(field)}
                          aria-label="close"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      {sectionInfo[field]}
                    </Alert>
                  )}
                  <BufferedTextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    initialValue={entry.inventory[field]}
                    onCommit={(val) => handleInventoryChange(field, val)}
                    placeholder={`Enter your ${field} here...`}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>
            <Typography variant="h6">Daily Inventory - Part 2</Typography>
          </StepLabel>
          <StepContent>
            <Grid container spacing={3}>
              {['amends', 'service', 'prayer'].map(field => (
                <Grid item xs={12} key={field}>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {field}
                    </Typography>
                    <Tooltip title="Show guidance">
                      <IconButton size="small" onClick={() => toggleInfoText(field)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {showInfoText[field] && (
                    <Alert
                      severity="info"
                      sx={{ mb: 1 }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => toggleInfoText(field)}
                          aria-label="close"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      {sectionInfo[field]}
                    </Alert>
                  )}
                  <BufferedTextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    initialValue={entry.inventory[field]}
                    onCommit={(val) => handleInventoryChange(field, val)}
                    placeholder={`Enter your ${field} here...`}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>
            <Typography variant="h6">Self-Examination - Character Defects</Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The Big Book recommends we examine ourselves for four specific character defects: selfishness, dishonesty, self-seeking, and fear.
            </Typography>
            <Grid container spacing={3}>
              {['selfishness', 'dishonesty', 'self_seeking', 'fear'].map(field => (
                <Grid item xs={12} key={field}>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {field === 'self_seeking' ? 'Self-Seeking' : field}
                    </Typography>
                    <Tooltip title="Show guidance">
                      <IconButton size="small" onClick={() => toggleInfoText(field)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {showInfoText[field] && (
                    <Alert
                      severity="info"
                      sx={{ mb: 1 }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => toggleInfoText(field)}
                          aria-label="close"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      {sectionInfo[field]}
                    </Alert>
                  )}
                  <BufferedTextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    initialValue={entry.inventory[field]}
                    onCommit={(val) => handleInventoryChange(field, val)}
                    placeholder={`Where were you ${field === 'self_seeking' ? 'self-seeking' : field} today?`}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>
            <Typography variant="h6">Reflections and Growth</Typography>
          </StepLabel>
          <StepContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">General Reflections</Typography>
                <BufferedTextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  initialValue={entry.reflections}
                  onCommit={(val) => handleChange('reflections', val)}
                  placeholder="Share your overall thoughts about your day and your recovery journey..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Promises Noticed</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Did you notice any of the AA promises manifesting in your life today?
                </Typography>
                <BufferedTextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  initialValue={entry.promises}
                  onCommit={(val) => handleChange('promises', val)}
                  placeholder="Describe any promises you saw coming true in your life..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Areas for Improvement</Typography>
                <BufferedTextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  initialValue={entry.improvements}
                  onCommit={(val) => handleChange('improvements', val)}
                  placeholder="What would you like to do differently tomorrow?"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>
            <Typography variant="h6">Character Assets & Categorization</Typography>
          </StepLabel>
          <StepContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Character Assets Displayed Today
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select the character assets you demonstrated today:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {commonAssets.map(asset => (
                    <Chip
                      key={asset}
                      label={asset}
                      onClick={() => toggleAsset(asset)}
                      color={entry.assets.includes(asset) ? "primary" : "default"}
                      variant={entry.assets.includes(asset) ? "filled" : "outlined"}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add tags to categorize your entry:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BufferedTextField
                    size="small"
                    initialValue={newTag}
                    onCommit={(value) => setNewTag(value)}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    sx={{ mr: 1 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={addTag}
                            disabled={!newTag.trim() || entry.tags.includes(newTag.trim())}
                          >
                            <AddIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                  {entry.tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Suggested tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {suggestedTags
                    .filter(tag => !entry.tags.includes(tag))
                    .map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        variant="outlined"
                        onClick={() => addSuggestedTag(tag)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={entry.isPrivate}
                      onChange={(e) => handleChange('isPrivate', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Keep this entry private"
                />
                <Typography variant="body2" color="text.secondary">
                  Private entries are visible only to you
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Box>
  );

  // Quick inventory form with tabs
  const QuickInventoryForm = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="inventory tabs">
          <Tab label="Basic Info" />
          <Tab label="Inventory" />
          <Tab label="Reflections" />
          <Tab label="Tags" />
        </Tabs>
      </Box>

      {/* Basic Info Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                How are you feeling today? Rate your mood:
              </Typography>
              <Box display="flex" alignItems="center">
                <MoodBadIcon color="error" sx={{ mr: 1 }} />
                <Rating
                  name="mood"
                  value={entry.mood}
                  onChange={(_, newValue) => {
                    // Only update on complete or deliberate rating changes
                    if (newValue !== null) {
                      handleChange('mood', newValue);
                    }
                  }}
                  max={5}
                />
                <MoodIcon color="success" sx={{ ml: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                What are you grateful for today?
              </Typography>
              {entry.gratitude.map((item, index) => (
                <Box key={`gratitude-${index}`} sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                  <BufferedTextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    initialValue={item || ''}
                    onCommit={(value) => {
                      const newGratitude = [...entry.gratitude];
                      newGratitude[index] = value;
                      setEntry(prev => ({
                        ...prev,
                        gratitude: newGratitude
                      }));
                    }}
                    label={`Gratitude item ${index + 1}`}
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => removeGratitude(index)}
                    disabled={entry.gratitude.length === 1 && index === 0}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', mt: 1, alignItems: 'center' }}>
                <BufferedTextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  initialValue={newGratitude}
                  onCommit={(value) => setNewGratitude(value)}
                  onChange={(e) => setNewGratitude(e.target.value)}
                  label="Add another gratitude item"
                  sx={{ mr: 1 }}
                />
                <IconButton
                  color="primary"
                  onClick={addGratitude}
                  disabled={!newGratitude.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setActiveTab(1)}
              >
                Next: Inventory
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Inventory Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            {['resentments', 'fears', 'amends', 'service'].map(field => (
              <Grid item xs={12} sm={6} key={field}>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                    {field}
                  </Typography>
                  <Tooltip title="Show guidance">
                    <IconButton size="small" onClick={() => toggleInfoText(field)}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {showInfoText[field] && (
                  <Alert
                    severity="info"
                    sx={{ mb: 1 }}
                    action={
                      <IconButton
                        size="small"
                        onClick={() => toggleInfoText(field)}
                        aria-label="close"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    {sectionInfo[field]}
                  </Alert>
                )}
                <BufferedTextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  initialValue={entry.inventory[field]}
                  onCommit={(val) => handleInventoryChange(field, val)}
                  placeholder={`Enter your ${field} here...`}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setActiveTab(0)}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(2)}
                >
                  Next: Reflections
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Reflections Tab */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Overall Reflections</Typography>
              <BufferedTextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                initialValue={entry.reflections}
                onCommit={(val) => handleChange('reflections', val)}
                placeholder="Share your overall thoughts about your day and your recovery journey..."
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Character Assets Displayed Today</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {commonAssets.slice(0, 10).map(asset => (
                  <Chip
                    key={asset}
                    label={asset}
                    onClick={() => toggleAsset(asset)}
                    color={entry.assets.includes(asset) ? "primary" : "default"}
                    variant={entry.assets.includes(asset) ? "filled" : "outlined"}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setActiveTab(1)}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(3)}
                >
                  Next: Tags
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tags Tab */}
      {activeTab === 3 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add tags to categorize your entry:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BufferedTextField
                  size="small"
                  initialValue={newTag}
                  onCommit={(value) => setNewTag(value)}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  sx={{ mr: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={addTag}
                          disabled={!newTag.trim() || entry.tags.includes(newTag.trim())}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                {entry.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Suggested tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {suggestedTags
                  .filter(tag => !entry.tags.includes(tag))
                  .slice(0, 8)
                  .map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      onClick={() => addSuggestedTag(tag)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={entry.isPrivate}
                    onChange={(e) => handleChange('isPrivate', e.target.checked)}
                    color="primary"
                  />
                }
                label="Keep this entry private"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setActiveTab(2)}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );

  // Simple check-in form
  const CheckInForm = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="body1" gutterBottom>
            How are you feeling today? Rate your mood:
          </Typography>
          <Box display="flex" alignItems="center">
            <MoodBadIcon color="error" sx={{ mr: 1 }} />
            <Rating
              name="mood"
              value={entry.mood}
              onChange={(_, newValue) => {
                // Only update on complete or deliberate rating changes
                if (newValue !== null) {
                  handleChange('mood', newValue);
                }
              }}
              max={5}
            />
            <MoodIcon color="success" sx={{ ml: 1 }} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" gutterBottom>
            Quick Reflection:
          </Typography>
          <BufferedTextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            initialValue={entry.reflections}
            onCommit={(val) => handleChange('reflections', val)}
            placeholder="Share a brief thought about your day and recovery..."
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={entry.isPrivate}
                onChange={(e) => handleChange('isPrivate', e.target.checked)}
                color="primary"
              />
            }
            label="Keep this entry private"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Check-In'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={1}>
          <Button
            component={Link}
            href="/journal"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Journal
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            New 10th Step Journal Entry
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          "Continued to take personal inventory and when we were wrong promptly admitted it."
        </Typography>
      </Box>

      {isGuest && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are using Guest Mode. Entries are stored locally on this device. Create an account to
          sync across devices and keep your progress safe.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Journal entry saved successfully! Redirecting to journal...
        </Alert>
      ) : (
        <Paper sx={{ p: { xs: 2, sm: 4 } }}>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Entry Type
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                aria-label="entry-type"
                name="entry-type"
                value={entryType}
                onChange={handleEntryTypeChange}
              >
                <FormControlLabel
                  value="full"
                  control={<Radio />}
                  label="Full Inventory"
                />
                <FormControlLabel
                  value="quick"
                  control={<Radio />}
                  label="Quick Entry"
                />
                <FormControlLabel
                  value="check-in"
                  control={<Radio />}
                  label="Simple Check-in"
                />
              </RadioGroup>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {entryType === 'full' && 'Complete a comprehensive 10th Step inventory with all sections.'}
              {entryType === 'quick' && 'A simplified inventory for days when you have less time.'}
              {entryType === 'check-in' && 'Just record your mood and a brief reflection.'}
            </Typography>
          </Box>

          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Date
            </Typography>
            <BufferedTextField
              type="date"
              initialValue={entry.date}
              onCommit={(val) => handleChange('date', val)}
              onChange={(e) => handleChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Render different form based on entry type */}
          {entryType === 'full' && <FullInventoryForm />}
          {entryType === 'quick' && <QuickInventoryForm />}
          {entryType === 'check-in' && <CheckInForm />}
        </Paper>
      )}
    </Container>
  );
}