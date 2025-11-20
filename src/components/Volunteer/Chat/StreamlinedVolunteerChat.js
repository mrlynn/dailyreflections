'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Collapse,
  Fade,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Popover,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Rating,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';

// Icons
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ForumIcon from '@mui/icons-material/Forum';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckIcon from '@mui/icons-material/Check';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import LockIcon from '@mui/icons-material/Lock';
import AddCommentIcon from '@mui/icons-material/AddComment';

/**
 * ChatMessage component renders an individual message in the chat
 */
function ChatMessage({ message, currentUserId, onShowContextActions }) {
  const isCurrentUser = message.sender_id === currentUserId || message.sender_type === 'volunteer';
  const isSystem = message.sender_type === 'system';
  const [showActions, setShowActions] = useState(false);

  // Format message timestamp
  const formatTimestamp = () => {
    if (!message.created_at) return '';
    const date = new Date(message.created_at);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render system message differently
  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, px: 2, width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            p: 1,
            px: 2,
            backgroundColor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            maxWidth: '80%',
            borderRadius: 2
          }}
        >
          <Typography
            variant="caption"
            align="center"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {message.content}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1,
        px: 2,
        maxWidth: '100%',
        position: 'relative'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          px: 1
        }}
      >
        <Avatar
          sx={{
            width: 20,
            height: 20,
            fontSize: '0.75rem',
            bgcolor: isCurrentUser ? 'primary.main' : 'grey.400',
            ml: isCurrentUser ? 1 : 0,
            mr: isCurrentUser ? 0 : 1
          }}
        >
          {isCurrentUser ? 'V' : 'U'}
        </Avatar>
        <Typography variant="caption" color="text.secondary">
          {isCurrentUser ? 'Volunteer' : 'User'} • {formatTimestamp()}
        </Typography>
      </Box>

      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderTopRightRadius: isCurrentUser ? 0 : 2,
          borderTopLeftRadius: isCurrentUser ? 2 : 0,
          maxWidth: {
            xs: '85%',
            md: '70%'
          },
          backgroundColor: isCurrentUser ? 'primary.main' : 'grey.100',
          color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
          position: 'relative'
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
      </Paper>

      {/* Contextual message actions */}
      {!isCurrentUser && showActions && (
        <Fade in={showActions}>
          <Paper
            elevation={2}
            sx={{
              position: 'absolute',
              bottom: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: 5,
              display: 'flex',
              p: 0.5
            }}
          >
            <Tooltip title="Suggest response">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onShowContextActions && onShowContextActions(message, 'response')}
              >
                <ForumIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Find relevant resources">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onShowContextActions && onShowContextActions(message, 'resources')}
              >
                <MenuBookIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Get AI help">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onShowContextActions && onShowContextActions(message, 'ai')}
              >
                <SmartToyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        </Fade>
      )}
    </Box>
  );
}

/**
 * QuickActionsPanel component for quick access to common actions
 */
function QuickActionsPanel({ activeTab, onTabChange, onItemSelect, isExpanded, handleGenerateAIResponse, aiLoading, aiResponse, setAiResponse }) {
  const quickResponses = [
    {
      id: 'qr1',
      title: 'Welcome Message',
      content: 'Hello, thank you for reaching out. I\'m a volunteer here to support you. How can I help today?',
      category: 'greetings'
    },
    {
      id: 'qr2',
      title: 'Find Meetings',
      content: 'Would you like help finding meetings in your area?',
      category: 'meetings'
    },
    {
      id: 'qr3',
      title: 'One Day at a Time',
      content: 'Remember, recovery is about taking things one day at a time. Sometimes even one hour or one minute at a time.',
      category: 'encouragement'
    },
    {
      id: 'qr4',
      title: 'Support Resources',
      content: 'There are many resources available to help you. Would you like me to share some options?',
      category: 'resources'
    }
  ];

  const resources = [
    {
      id: 'r1',
      title: 'How It Works',
      content: 'Rarely have we seen a person fail who has thoroughly followed our path. Those who do not recover are people who cannot or will not completely give themselves to this simple program.',
      source: 'Big Book, p.58'
    },
    {
      id: 'r2',
      title: 'Step 1',
      content: 'We admitted we were powerless over alcohol—that our lives had become unmanageable.',
      source: 'Twelve Steps'
    },
    {
      id: 'r3',
      title: 'Local Meetings',
      content: 'Here\'s a link to find meetings in your area: https://www.aa.org/find-aa',
      source: 'Website'
    }
  ];

  return (
    <Collapse in={isExpanded}>
      <Paper sx={{ p: 1, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="Responses"
              icon={<TextSnippetIcon />}
              color={activeTab === 'responses' ? 'primary' : 'default'}
              variant={activeTab === 'responses' ? 'filled' : 'outlined'}
              onClick={() => onTabChange('responses')}
              size="small"
            />
            <Chip
              label="Resources"
              icon={<MenuBookIcon />}
              color={activeTab === 'resources' ? 'primary' : 'default'}
              variant={activeTab === 'resources' ? 'filled' : 'outlined'}
              onClick={() => onTabChange('resources')}
              size="small"
            />
            <Chip
              label="AI Help"
              icon={<SmartToyIcon />}
              color={activeTab === 'ai' ? 'primary' : 'default'}
              variant={activeTab === 'ai' ? 'filled' : 'outlined'}
              onClick={() => onTabChange('ai')}
              size="small"
            />
          </Box>
          <Box sx={{ position: 'relative', width: 150 }}>
            <SearchIcon
              fontSize="small"
              sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary', zIndex: 1 }}
            />
            <TextField
              placeholder="Search..."
              size="small"
              sx={{
                width: '100%',
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem',
                  height: 12,
                  py: 0,
                  pl: 4 // Add padding to make room for the search icon
                }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ maxHeight: 200, overflow: 'auto', px: 0.5 }}>
          {activeTab === 'responses' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickResponses.map(item => (
                <Card
                  key={item.id}
                  sx={{
                    width: 'calc(50% - 4px)',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => onItemSelect(item.content)}
                >
                  <CardActionArea>
                    <CardContent sx={{ py: 1, px: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {item.content}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}

          {activeTab === 'resources' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {resources.map(item => (
                <Card
                  key={item.id}
                  sx={{
                    width: 'calc(50% - 4px)',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => onItemSelect(`${item.content} (${item.source})`)}
                >
                  <CardActionArea>
                    <CardContent sx={{ py: 1, px: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {item.content}
                      </Typography>
                      <Typography variant="caption" sx={{ fontStyle: 'italic', mt: 0.5, display: 'block' }}>
                        {item.source}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}

          {activeTab === 'ai' && (
            <Box sx={{ p: 2 }}>
              {!aiLoading && !aiResponse && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    What would you like help with?
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateAIResponse({content: "Create a helpful response for a new user asking about recovery."}, 'response')}
                      startIcon={<ForumIcon fontSize="small" />}
                    >
                      Suggest a response
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateAIResponse({content: "Find resources for work-life balance during recovery."}, 'resources')}
                      startIcon={<MenuBookIcon fontSize="small" />}
                    >
                      Find relevant resources
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateAIResponse({content: "Analyze conversation themes and suggest next steps."}, 'analysis')}
                      startIcon={<MoreHorizIcon fontSize="small" />}
                    >
                      Analyze conversation
                    </Button>
                  </Box>
                </>
              )}

              {aiLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, flexDirection: 'column' }}>
                  <CircularProgress size={28} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Generating AI content...
                  </Typography>
                </Box>
              )}

              {aiResponse && !aiLoading && (
                <>
                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'background.paper', maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {aiResponse}
                    </Typography>
                  </Paper>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      onClick={() => setAiResponse(null)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      onClick={() => onItemSelect(aiResponse)}
                    >
                      Use This
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Collapse>
  );
}

/**
 * SessionSummaryDialog component for collecting session summary and feedback
 */
function SessionSummaryDialog({ open, onClose, onSubmit }) {
  const [activeStep, setActiveStep] = useState(0);
  const [summary, setSummary] = useState('');
  const [sessionTags, setSessionTags] = useState([]);
  const [rating, setRating] = useState(0);
  const [outcome, setOutcome] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tagOptions = [
    { value: 'newcomer', label: 'Newcomer' },
    { value: 'relapse', label: 'Relapse Prevention' },
    { value: 'steps', label: 'Step Work' },
    { value: 'meetings', label: 'Meeting Information' },
    { value: 'stress', label: 'Stress & Anxiety' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'support', label: 'Support' },
    { value: 'resources', label: 'Resources' }
  ];

  const outcomeOptions = [
    { value: 'resolved', label: 'Issue resolved' },
    { value: 'partial', label: 'Partially resolved' },
    { value: 'ongoing', label: 'Ongoing support needed' },
    { value: 'referred', label: 'Referred to other resources' },
    { value: 'inconclusive', label: 'Inconclusive' }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTagToggle = (tag) => {
    setSessionTags((prev) =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // In a real implementation, make API call to save the summary and feedback
      // await fetch(`/api/volunteers/chat/sessions/${session._id}/summary`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     summary,
      //     tags: sessionTags,
      //     rating,
      //     outcome
      //   })
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call the onSubmit prop with the data
      onSubmit({
        summary,
        tags: sessionTags,
        rating,
        outcome
      });

      onClose();
    } catch (error) {
      console.error("Error submitting session summary:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const isStepComplete = (step) => {
    switch(step) {
      case 0:
        return summary.length >= 10;
      case 1:
        return sessionTags.length > 0;
      case 2:
        return rating > 0 && outcome;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      disableEscapeKeyDown={activeStep === 3}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <AssignmentIcon sx={{ mr: 1 }} />
        Session Summary & Feedback
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Session Summary */}
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SummarizeIcon sx={{ mr: 1, fontSize: 20 }} />
                Session Summary
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please provide a brief summary of the chat session. This helps with record-keeping and
                will be valuable if the user returns for additional support.
              </Typography>
              <TextField
                label="Session Summary"
                multiline
                rows={4}
                fullWidth
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe the key points discussed, any resources shared, and the general outcome of the conversation."
                helperText={`${summary.length < 10 ? 'Please provide more detail (minimum 10 characters)' : `${summary.length} characters`}`}
                error={summary.length < 10}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  disabled={!isStepComplete(0)}
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Session Tags */}
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalLibraryIcon sx={{ mr: 1, fontSize: 20 }} />
                Session Topics
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select topics that were discussed in this session. This helps categorize the conversation
                and improves our ability to analyze volunteer support trends.
              </Typography>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Session Topics (select all that apply)</FormLabel>
                <FormGroup row sx={{ mt: 1 }}>
                  {tagOptions.map((tag) => (
                    <FormControlLabel
                      key={tag.value}
                      control={
                        <Checkbox
                          checked={sessionTags.includes(tag.value)}
                          onChange={() => handleTagToggle(tag.value)}
                        />
                      }
                      label={tag.label}
                      sx={{ width: '50%', mb: 1 }}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button
                  disabled={!isStepComplete(1)}
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Outcome and Rating */}
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FeedbackIcon sx={{ mr: 1, fontSize: 20 }} />
                Session Outcome & Rating
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please rate the effectiveness of the session and select the outcome that best describes
                the result of your conversation.
              </Typography>

              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend">Session Outcome</FormLabel>
                <RadioGroup
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                >
                  {outcomeOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Session Effectiveness Rating</FormLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Rating
                    value={rating}
                    onChange={(_, newValue) => {
                      setRating(newValue);
                    }}
                    precision={1}
                    size="large"
                  />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {rating === 0 && 'Select rating'}
                    {rating === 1 && 'Not effective'}
                    {rating === 2 && 'Somewhat effective'}
                    {rating === 3 && 'Moderately effective'}
                    {rating === 4 && 'Very effective'}
                    {rating === 5 && 'Extremely effective'}
                  </Typography>
                </Box>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack}>Back</Button>
                <Button
                  disabled={!isStepComplete(2)}
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Review & Submit */}
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 1, fontSize: 20 }} />
                Review & Submit
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please review your summary and feedback before submitting.
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2">Session Summary</Typography>
                <Typography variant="body2" sx={{ pl: 1, mb: 2 }}>
                  {summary}
                </Typography>

                <Typography variant="subtitle2">Topics Discussed</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, pl: 1 }}>
                  {sessionTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tagOptions.find(t => t.value === tag)?.label || tag}
                      size="small"
                    />
                  ))}
                </Box>

                <Typography variant="subtitle2">Session Outcome</Typography>
                <Typography variant="body2" sx={{ pl: 1, mb: 2 }}>
                  {outcomeOptions.find(o => o.value === outcome)?.label || outcome}
                </Typography>

                <Typography variant="subtitle2">Effectiveness Rating</Typography>
                <Box sx={{ pl: 1 }}>
                  <Rating value={rating} readOnly />
                </Box>
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>Back</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} /> : <CheckIcon />}
                >
                  {submitting ? 'Submitting...' : 'Submit Summary'}
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ContextualSuggestionsPanel component for message-contextual suggestions
 */
function ContextualSuggestionsPanel({ message, type, onItemSelect, anchorEl, onClose, onGenerateAI, aiLoading, aiResponse }) {
  // Sample responses based on message content
  const suggestedResponses = [
    "I understand how you feel. Would you like to talk more about that?",
    "That sounds challenging. Have you discussed this with your sponsor?",
    "Many people in recovery have similar experiences. You're not alone."
  ];

  // Sample resources based on message content
  const suggestedResources = [
    {
      title: "Acceptance Quote",
      content: "And acceptance is the answer to all my problems today.",
      source: "Big Book, p.417"
    },
    {
      title: "Finding Meetings",
      content: "Here's how to find local meetings in your area.",
      source: "AA Website"
    }
  ];

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Paper sx={{ p: 2, maxWidth: 400, minWidth: 300 }}>
        {type === 'response' && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Suggested Responses
            </Typography>
            <Stack spacing={1}>
              {suggestedResponses.map((response, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => {
                    onItemSelect(response);
                    onClose();
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2">{response}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="text"
                size="small"
                startIcon={<SmartToyIcon fontSize="small" />}
                onClick={() => onGenerateAI(message, 'response')}
                disabled={aiLoading}
              >
                {aiLoading ? 'Generating...' : 'Get AI Suggestions'}
              </Button>
            </Box>
          </>
        )}

        {type === 'resources' && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Relevant Resources
            </Typography>
            <Stack spacing={1}>
              {suggestedResources.map((resource, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => {
                    onItemSelect(`${resource.content} (${resource.source})`);
                    onClose();
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{resource.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{resource.content}</Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', mt: 0.5, display: 'block' }}>
                      {resource.source}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="text"
                size="small"
                startIcon={<MenuBookIcon fontSize="small" />}
                onClick={() => onGenerateAI(message, 'resources')}
                disabled={aiLoading}
              >
                {aiLoading ? 'Searching...' : 'Find More Resources'}
              </Button>
            </Box>
          </>
        )}

        {type === 'ai' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                AI Assistance
              </Typography>
              {aiLoading && <CircularProgress size={16} />}
            </Box>

            {!aiResponse && !aiLoading && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  What would you like AI help with for this message?
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ForumIcon />}
                    onClick={() => {
                      onGenerateAI(message, 'response');
                    }}
                    disabled={aiLoading}
                  >
                    Generate Response
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MenuBookIcon />}
                    onClick={() => {
                      onGenerateAI(message, 'resources');
                    }}
                    disabled={aiLoading}
                  >
                    Find Resources
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MoreHorizIcon />}
                    onClick={() => {
                      onGenerateAI(message, 'analysis');
                    }}
                    disabled={aiLoading}
                  >
                    Analyze Message
                  </Button>
                </Stack>
              </>
            )}

            {aiResponse && !aiLoading && (
              <>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'background.paper', maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {aiResponse}
                  </Typography>
                </Paper>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    onClick={() => onGenerateAI(message, null)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => {
                      onItemSelect(aiResponse);
                      onClose();
                    }}
                  >
                    Use This
                  </Button>
                </Box>
              </>
            )}

            {aiLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, flexDirection: 'column' }}>
                <CircularProgress size={28} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating AI response...
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Popover>
  );
}

/**
 * StreamlinedVolunteerChat component provides a redesigned chat interface focused on conversation flow
 */
export default function StreamlinedVolunteerChat({
  sessionId,
  onClose,
  initialMessages = [],
  initialSession = null
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatSession, setChatSession] = useState(initialSession);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);

  // Quick actions state
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const [activeQuickActionTab, setActiveQuickActionTab] = useState('responses');

  // Contextual actions state
  const [contextAnchorEl, setContextAnchorEl] = useState(null);
  const [contextMessage, setContextMessage] = useState(null);
  const [contextActionType, setContextActionType] = useState(null);

  // AI assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Chat metrics
  const [chatMetrics, setChatMetrics] = useState({
    duration: '0 min',
    messageCount: 0,
    volunteerResponseTime: '0 min'
  });

  // Current volunteer ID (in a real app, this would come from authentication context)
  const currentUserId = 'volunteer123';

  // Simulated mock data fetch
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);

        // IMPORTANT: Check if this is a real MongoDB ObjectId
        // This fixes the chat session isolation bug by preventing demo messages
        // from being shown in real chat sessions
        if (sessionId && /^[0-9a-fA-F]{24}$/.test(sessionId)) {
          // This is a real MongoDB ObjectId session - use the data passed from parent
          // and do NOT use any demo/mock data
          if (!chatSession && initialSession) {
            setChatSession(initialSession);
          }

          // Only use real messages from the API, not demo data
          if (messages.length === 0) {
            // If we were provided initial messages, use them
            if (initialMessages && initialMessages.length > 0) {
              setMessages(initialMessages);
              // Update metrics after loading real messages
              setTimeout(() => updateChatMetrics(), 100);
            } else {
              // Otherwise initialize with an empty array
              setMessages([]);
            }
          }
        } else {
          // This is a demo/testing session, use simulated data
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (!chatSession) {
            setChatSession({
              _id: sessionId || 'session123',
              user_id: 'user456',
              volunteer_id: currentUserId,
              status: 'active',
              start_time: new Date(Date.now() - 30 * 60000).toISOString(),
              topic: 'Dealing with stress in recovery',
              is_demo: true // Mark as demo session
            });
          }

          if (messages.length === 0) {
            setMessages([
              {
                _id: 'm1',
                session_id: sessionId || 'session123',
                sender_id: 'user456',
                sender_type: 'user',
                content: "Hi, I've been struggling with my recovery lately. Work has been really stressful and I'm finding it hard to make time for meetings.",
                created_at: new Date(Date.now() - 25 * 60000).toISOString(),
                status: 'read'
              },
              {
                _id: 'm2',
                session_id: sessionId || 'session123',
                sender_id: currentUserId,
                sender_type: 'volunteer',
                content: 'I hear you. Balancing recovery with other life demands can be challenging. How long have you been in recovery?',
                created_at: new Date(Date.now() - 24 * 60000).toISOString(),
                status: 'read'
              },
              {
                _id: 'm3',
                session_id: sessionId || 'session123',
                sender_id: 'user456',
                sender_type: 'user',
                content: 'About 8 months now. I was doing well, attending meetings regularly, but the last few weeks have been tough.',
                created_at: new Date(Date.now() - 23 * 60000).toISOString(),
                status: 'read'
              },
              {
                _id: 'm4',
                session_id: sessionId || 'session123',
                sender_id: currentUserId,
                sender_type: 'volunteer',
                content: "Eight months is a significant milestone. It's completely normal to go through periods where it feels harder. What specifically has been making it difficult to attend meetings?",
                created_at: new Date(Date.now() - 22 * 60000).toISOString(),
                status: 'read'
              },
              {
                _id: 'm5',
                session_id: sessionId || 'session123',
                sender_id: 'user456',
                sender_type: 'user',
                content: "My work schedule changed and now I'm working during the evening meetings I used to attend. There are morning meetings but I'm just so tired, and I don't know anyone at those meetings.",
                created_at: new Date(Date.now() - 15 * 60000).toISOString(),
                status: 'read'
              }
            ]);

            // Calculate and update chat metrics for demo data
            updateChatMetrics();
          }
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [sessionId, initialMessages, initialSession, chatSession, messages]);

  // Calculate chat metrics based on messages and session
  const updateChatMetrics = () => {
    if (!chatSession) return;

    // Calculate chat duration
    const startTime = new Date(chatSession.start_time);
    const now = new Date();
    const durationMinutes = Math.floor((now - startTime) / (1000 * 60));

    // Calculate volunteer average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const currentMsg = messages[i];
      const prevMsg = messages[i-1];

      if (
        currentMsg.sender_type === 'volunteer' &&
        prevMsg.sender_type === 'user'
      ) {
        const responseTime = new Date(currentMsg.created_at) - new Date(prevMsg.created_at);
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    const avgResponseSeconds = responseCount > 0 ?
      Math.floor(totalResponseTime / responseCount / 1000) : 0;

    const minutes = Math.floor(avgResponseSeconds / 60);
    const seconds = avgResponseSeconds % 60;

    // Format duration with proper handling of hours, minutes
    let formattedDuration;
    if (durationMinutes < 60) {
      formattedDuration = `${durationMinutes}m`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      formattedDuration = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    // Format response time with proper handling of minutes, seconds
    const formattedResponseTime = responseCount > 0 ?
      seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m` :
      `--`;

    setChatMetrics({
      duration: formattedDuration,
      messageCount: messages.length,
      volunteerResponseTime: formattedResponseTime
    });
  };

  // Handle message sending
  const handleSendMessage = async (e) => {
    e?.preventDefault();

    const messageContent = newMessage.trim();
    if (!messageContent) return;

    try {
      setIsSending(true);

      // CRITICAL: Clear the input first to prevent duplicate submissions
      setNewMessage('');

      console.log('Volunteer sending message to API:', {
        sessionId: chatSession._id,
        content: messageContent,
        session_key: chatSession.session_key || 'No session key found'
      });

      // Create a temporary message to show immediately in the UI
      const tempMsg = {
        _id: `temp-${Date.now()}`,
        session_id: chatSession._id,
        sender_id: currentUserId,
        sender_type: 'volunteer',
        content: messageContent,
        created_at: new Date().toISOString(),
        status: 'sending',
        isTemp: true // Mark as temporary
      };

      // Add temporary message to state for immediate feedback
      setMessages(msgs => [...msgs, tempMsg]);

      // Auto-scroll to show the sending message
      setTimeout(() => scrollToBottom(), 100);

      // Actually send the message to the API
      const response = await fetch('/api/volunteers/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: chatSession._id,
          content: messageContent,
          metadata: {
            client_timestamp: new Date(),
            client_message_id: `${chatSession._id}-${Date.now()}`
          }
        })
      });

      const data = await response.json();
      console.log('API response for volunteer message:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Replace the temporary message with the real one from the server
      const serverMsg = data.message;

      // If we got a real message from the server, replace the temp message
      if (serverMsg && serverMsg._id) {
        setMessages(msgs => msgs.map(m =>
          m._id === tempMsg._id ? serverMsg : m
        ));
      }

      // Auto-scroll to bottom again after replacing with real message
      setTimeout(() => scrollToBottom(), 100);

      // Update metrics
      updateChatMetrics();

      // Close quick actions if open
      setQuickActionsExpanded(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle ending the chat session
  const handleEndSession = async () => {
    try {
      setIsEnding(true);

      // Step 1: Send a notification to the user that the chat is ending
      const volunteerEndingMsg = {
        _id: `m${Date.now()}-ending`,
        session_id: chatSession._id,
        sender_id: currentUserId,
        sender_type: 'volunteer',
        content: "I'm ending our chat session now. Thank you for reaching out, and I hope our conversation was helpful.",
        created_at: new Date().toISOString(),
        status: 'sent'
      };

      setMessages([...messages, volunteerEndingMsg]);

      // Step 2: Make API call to notify the user that the session is ending
      // This will trigger a notification on the user's end
      try {
        await fetch(`/api/volunteers/chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: chatSession._id,
            content: "The volunteer has ended this chat session.",
            senderType: 'system',
            metadata: {
              endNotification: true,
              endedBy: currentUserId,
              endReason: 'volunteer_closed'
            }
          })
        });
      } catch (notifyError) {
        console.error('Error sending end notification:', notifyError);
        // Continue with ending the session even if notification fails
      }

      // Wait a moment to show the ending message before showing the system message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Update the session status in the database - mark as completed
      try {
        const response = await fetch(`/api/volunteers/chat/sessions/${chatSession._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete'
          })
        });

        if (!response.ok) {
          console.error('Failed to complete chat session:', await response.text());
        }
      } catch (error) {
        console.error('Error completing chat session:', error);
      }

      // For demo purposes, update local state with locked status
      setChatSession({
        ...chatSession,
        status: 'completed',
        end_time: new Date().toISOString(),
        ended_by: currentUserId,
        is_locked: true,
        lock_reason: 'volunteer_closed',
        lock_time: new Date().toISOString()
      });

      // Step 4: Add official system message about session ending
      const systemMsg = {
        _id: `system${Date.now()}`,
        session_id: chatSession._id,
        sender_id: 'system',
        sender_type: 'system',
        content: 'This chat session has officially ended and is now locked. The chat history will remain available to both participants. You can start a new session if needed.',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, systemMsg]);
      setEndDialogOpen(false);

      // Auto-scroll to bottom to show the system message
      setTimeout(() => scrollToBottom(), 100);

      // Step 5: Show session summary dialog
      setSummaryDialogOpen(true);
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end chat session. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle inserting content from panels
  const handleInsertContent = (content) => {
    setNewMessage((prev) => {
      // If there's already text, add a space
      const prefix = prev.trim() ? `${prev} ` : '';
      return `${prefix}${content}`;
    });

    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle showing contextual actions for a message
  const handleShowContextActions = (message, actionType) => {
    setContextMessage(message);
    setContextActionType(actionType);
    setContextAnchorEl(document.activeElement);
  };

  // Handle closing contextual actions
  const handleCloseContextActions = () => {
    setContextAnchorEl(null);
    setContextMessage(null);
    setContextActionType(null);
  };

  // Generate AI response based on context
  const handleGenerateAIResponse = async (messageContext, responseType) => {
    // If responseType is null, reset the AI response state
    if (responseType === null) {
      setAiResponse(null);
      return;
    }

    try {
      setAiLoading(true);

      // In a real implementation, this would call an actual AI service API
      // For now, we'll simulate a delay and return pre-defined responses based on type
      await new Promise(resolve => setTimeout(resolve, 1500));

      let response = '';
      const messageContent = messageContext?.content || '';

      switch (responseType) {
        case 'response':
          response = `Here's a suggested response to the user's message about ${messageContent.split(' ').slice(0, 5).join(' ')}...\n\nI understand what you're saying about your challenges with recovery. Many people find it difficult to adjust their schedules for meetings when work circumstances change. Have you considered trying some online meetings? They can be more flexible with different time slots and might be easier to fit into your schedule.`;
          break;
        case 'resources':
          response = `Based on the user's message about ${messageContent.split(' ').slice(0, 5).join(' ')}...\n\nHere are some relevant resources:\n\n1. "Living Sober" chapter on maintaining recovery during schedule changes\n2. The "Meeting Guide" app for finding meetings at various times\n3. "One Day at a Time" pamphlet for handling work stress while in recovery`;
          break;
        case 'analysis':
          response = `Analysis of user's message about ${messageContent.split(' ').slice(0, 5).join(' ')}...\n\nThe user appears to be struggling with balancing work and recovery commitments. They've been in recovery for about 8 months but recent schedule changes are creating barriers to meeting attendance. They specifically mention not knowing people at morning meetings, suggesting social anxiety might be a factor.`;
          break;
        default:
          response = `I've analyzed the conversation and have some suggestions for how you might respond to the user's concerns about balancing work and recovery.`;
      }

      setAiResponse(response);
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'Sorry, I was unable to generate a response at this time.';
    } finally {
      setAiLoading(false);
    }
  };

  // Determine if session is active and not locked
  const isSessionActive = (chatSession?.status === 'active' || chatSession?.status === 'in_progress') && !chatSession?.is_locked;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal header */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          borderRadius: 0
        }}
      >
        <IconButton size="small" onClick={onClose} edge="start" sx={{ mr: 1 }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.500', mr: 1 }}>
          <PersonIcon fontSize="small" />
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
            <Typography variant="body2" fontWeight="medium">
              Support Chat
            </Typography>
            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
              #{chatSession?.user_id?.substring(0, 6) || ''}
            </Typography>
          </Box>

          {chatSession?.topic && (
            <Typography variant="caption" color="text.secondary" noWrap>
              Topic: {chatSession.topic}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Session Duration">
            <Chip
              size="small"
              icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
              label={chatMetrics.duration}
              sx={{ height: 24 }}
              variant="outlined"
            />
          </Tooltip>

          <Chip
            size="small"
            icon={isSessionActive ?
              <CheckCircleIcon sx={{ fontSize: 14 }} /> :
              chatSession?.is_locked ?
                <LockIcon sx={{ fontSize: 14 }} /> :
                <WarningIcon sx={{ fontSize: 14 }} />
            }
            label={isSessionActive ? "Active" : chatSession?.is_locked ? "Locked" : "Ended"}
            color={isSessionActive ? "success" : chatSession?.is_locked ? "error" : "default"}
            sx={{ height: 24 }}
          />

          {isSessionActive && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => setEndDialogOpen(true)}
              sx={{ py: 0, minWidth: 0, height: 24 }}
            >
              End
            </Button>
          )}
        </Box>
      </Paper>

      {/* Error alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ m: 1 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Main messages area - full width */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            ref={messagesContainerRef}
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              py: 1
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message._id}
                  message={message}
                  currentUserId={currentUserId}
                  onShowContextActions={handleShowContextActions}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Quick actions panel - slides up from bottom */}
      <Box sx={{ position: 'relative' }}>
        <QuickActionsPanel
          activeTab={activeQuickActionTab}
          onTabChange={setActiveQuickActionTab}
          onItemSelect={handleInsertContent}
          isExpanded={quickActionsExpanded}
          handleGenerateAIResponse={handleGenerateAIResponse}
          aiLoading={aiLoading}
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
        />
      </Box>

      {/* Bottom action bar and message input */}
      {isSessionActive ? (
        <Box>
          {/* Quick action buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: 1.5,
              py: 0.5,
              borderTop: 1,
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<TextSnippetIcon />}
                variant={quickActionsExpanded && activeQuickActionTab === 'responses' ? 'contained' : 'text'}
                onClick={() => {
                  setQuickActionsExpanded(
                    !quickActionsExpanded || activeQuickActionTab !== 'responses'
                  );
                  setActiveQuickActionTab('responses');
                }}
              >
                Responses
              </Button>
              <Button
                size="small"
                startIcon={<MenuBookIcon />}
                variant={quickActionsExpanded && activeQuickActionTab === 'resources' ? 'contained' : 'text'}
                onClick={() => {
                  setQuickActionsExpanded(
                    !quickActionsExpanded || activeQuickActionTab !== 'resources'
                  );
                  setActiveQuickActionTab('resources');
                }}
              >
                Resources
              </Button>
              <Button
                size="small"
                startIcon={<SmartToyIcon />}
                variant={quickActionsExpanded && activeQuickActionTab === 'ai' ? 'contained' : 'text'}
                onClick={() => {
                  setQuickActionsExpanded(
                    !quickActionsExpanded || activeQuickActionTab !== 'ai'
                  );
                  setActiveQuickActionTab('ai');
                }}
              >
                AI Help
              </Button>
            </Box>

            <Tooltip title={`${chatMetrics.messageCount} messages with average volunteer response time of ${chatMetrics.volunteerResponseTime}`}>
              <Chip
                size="small"
                icon={<InfoOutlinedIcon sx={{ fontSize: 14 }} />}
                label={chatMetrics.messageCount > 0 ?
                  `${chatMetrics.messageCount} msgs • Avg: ${chatMetrics.volunteerResponseTime}` :
                  "No messages yet"
                }
                variant="outlined"
                sx={{ height: 24 }}
              />
            </Tooltip>
          </Box>

          {/* Message input */}
          <Paper
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              borderTop: 1,
              borderColor: 'divider',
              borderRadius: 0
            }}
          >
            <TextField
              inputRef={inputRef}
              placeholder="Type your message..."
              fullWidth
              multiline
              maxRows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              variant="outlined"
              size="small"
              sx={{
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              disabled={!newMessage.trim() || isSending}
              type="submit"
              sx={{ px: 2 }}
            >
              Send
            </Button>
          </Paper>
        </Box>
      ) : (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.paper'
          }}
        >
          {chatSession?.is_locked && (
            <Chip
              color="default"
              icon={<LockIcon />}
              label="Session Locked"
              sx={{ mb: 1.5, bgcolor: '#f5f5f5' }}
            />
          )}

          <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
            This chat session has ended
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {chatSession?.is_locked
              ? 'The conversation is now locked and no new messages can be sent.'
              : 'The conversation has been marked as completed.'}
          </Typography>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddCommentIcon />}
            onClick={() => {
              // Open the new session dialog
              setNewSessionDialogOpen(true);
            }}
          >
            Start New Session
          </Button>
        </Paper>
      )}

      {/* Contextual actions popover */}
      <ContextualSuggestionsPanel
        message={contextMessage}
        type={contextActionType}
        onItemSelect={handleInsertContent}
        anchorEl={contextAnchorEl}
        onClose={handleCloseContextActions}
        onGenerateAI={handleGenerateAIResponse}
        aiLoading={aiLoading}
        aiResponse={aiResponse}
      />

      {/* Session Summary Dialog */}
      <SessionSummaryDialog
        open={summaryDialogOpen}
        onClose={() => {
          setSummaryDialogOpen(false);
          // In a real app, we would redirect to the chat list or a summary page
          // For now, we'll just keep the user on the completed chat
        }}
        onSubmit={(summaryData) => {
          console.log("Session summary submitted:", summaryData);
          // In a real app, this would be saved to the database
        }}
      />

      {/* End Chat Session Confirmation Dialog - Enhanced with more information */}
      <Dialog
        open={endDialogOpen}
        onClose={() => setEndDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon color="error" sx={{ mr: 1 }} />
            End & Lock Chat Session
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end and lock this chat session? Here's what will happen:
          </DialogContentText>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', minWidth: '24px' }}>
                1.
              </Typography>
              <Typography variant="body2">
                The user will be notified that you've ended the chat session.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', minWidth: '24px' }}>
                2.
              </Typography>
              <Typography variant="body2">
                The chat will be <strong>locked</strong> - no further messages can be sent by either party.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', minWidth: '24px' }}>
                3.
              </Typography>
              <Typography variant="body2">
                Both you and the user will still have read access to the chat history.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', minWidth: '24px' }}>
                4.
              </Typography>
              <Typography variant="body2">
                You'll be prompted to provide a session summary and feedback.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', minWidth: '24px' }}>
                5.
              </Typography>
              <Typography variant="body2">
                The user will have the option to start a new chat session if needed.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, bgcolor: 'info.lighter', p: 1.5, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Before ending, consider asking if the user has any final questions or if they need additional resources. This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)} disabled={isEnding}>
            Cancel
          </Button>
          <Button
            onClick={handleEndSession}
            color="error"
            disabled={isEnding}
            startIcon={isEnding ? <CircularProgress size={16} /> : <LockIcon />}
            variant="contained"
          >
            End & Lock Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Session Dialog */}
      <Dialog
        open={newSessionDialogOpen}
        onClose={() => setNewSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddCommentIcon color="primary" sx={{ mr: 1 }} />
            Start New Chat Session
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a new chat session. The current session will remain accessible in your history.
          </DialogContentText>

          <TextField
            label="Session Topic (Optional)"
            fullWidth
            margin="normal"
            placeholder="E.g., Meeting support, Step work, Recovery challenges"
            helperText="Enter a brief topic to help categorize this chat session"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              label="Priority"
              defaultValue="normal"
            >
              <MenuItem value="urgent">Urgent - Immediate help needed</MenuItem>
              <MenuItem value="normal">Normal - Standard response time</MenuItem>
              <MenuItem value="follow-up">Follow-up - Continuation of previous conversation</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Initial Message"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            placeholder="Hello, how can I assist you with your recovery journey today?"
            helperText="This will be sent as your first message in the new chat session"
          />

          <Box sx={{ mt: 2, bgcolor: 'info.lighter', p: 1.5, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
              <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Starting a new session
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              The new session will be created with a fresh conversation. The current session history will remain available to both you and the user separately.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSessionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // In a real implementation, create a new chat session via API
              // For demo purposes, just close the dialog and show a message
              setNewSessionDialogOpen(false);
              alert('A new chat session would be created in a real implementation');
            }}
          >
            Create New Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}