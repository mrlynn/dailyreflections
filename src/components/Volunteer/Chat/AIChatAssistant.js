'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Collapse,
  Alert,
  AlertTitle,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ChatIcon from '@mui/icons-material/Chat';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Sample suggestions for different AI assistance features
const ASSISTANCE_FEATURES = [
  {
    id: 'message-suggestions',
    title: 'Message Suggestions',
    description: 'Get AI-generated response suggestions based on the current chat context',
    icon: <ChatIcon />,
    color: 'primary.main',
    prompts: [
      'Suggest a helpful response to the user',
      'Help me draft a supportive message',
      'Create an encouraging response'
    ]
  },
  {
    id: 'resource-lookup',
    title: 'Resource Lookup',
    description: 'Find relevant AA resources and information to share with the user',
    icon: <LocalLibraryIcon />,
    color: 'secondary.main',
    prompts: [
      'Find Big Book passages about acceptance',
      'Get information about the 12 steps',
      'Find resources for newcomers'
    ]
  },
  {
    id: 'conversation-insights',
    title: 'Conversation Insights',
    description: 'Get insights about the current conversation to help you provide better support',
    icon: <LightbulbIcon />,
    color: 'success.main',
    prompts: [
      'Analyze the conversation sentiment',
      'Identify key topics the user has mentioned',
      'Suggest themes to explore with the user'
    ]
  }
];

// Sample AI response data
const SAMPLE_AI_RESPONSES = {
  'Suggest a helpful response to the user': {
    content: "It sounds like you're feeling overwhelmed with balancing recovery and daily responsibilities. Many people in recovery face similar challenges. Have you considered trying to build a routine that incorporates small recovery actions throughout your day? Sometimes integrating brief moments of reflection can be more sustainable than feeling pressured to dedicate large blocks of time.",
    suggestions: [
      "Would you like to talk about specific recovery practices that might fit into your schedule?",
      "What parts of your recovery program feel most challenging to maintain right now?",
      "Have you discussed this challenge with your sponsor or others in the program?"
    ]
  },
  'Help me draft a supportive message': {
    content: "Thank you for sharing your experience with the group yesterday. It takes courage to be vulnerable, especially when discussing difficult emotions. Many of us have faced similar struggles with resentment, and hearing how you're working through yours is inspiring. Remember that progress isn't always linear, and each day you choose recovery is a victory worth celebrating.",
    suggestions: [
      "Is there a particular aspect of resentment that you find most challenging?",
      "Would it be helpful to discuss some specific strategies from Step Work that address resentments?",
      "How are you taking care of yourself through this process?"
    ]
  },
  'Create an encouraging response': {
    content: "I hear that you're feeling discouraged after having a slip. First, I want to acknowledge your honesty in sharing this - that takes real courage and is itself a sign of your commitment to recovery. Slips can happen in recovery, but they don't erase the progress you've made. Each day is a new opportunity, and you're here now, which is what matters most. What would help you feel supported as you get back on track?",
    suggestions: [
      "Would it be helpful to review what led up to the slip?",
      "Have you been able to connect with your sponsor about this?",
      "What parts of your program have been most helpful to you in the past?"
    ]
  }
};

/**
 * AIMessage component for rendering individual AI assistant messages
 */
function AIMessage({ message, onUseResponse, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  const handleUseResponse = () => {
    if (onUseResponse) {
      onUseResponse(message.content);
    }
    handleMenuClose();
  };

  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SmartToyIcon />
          </Avatar>
        }
        title="AI Assistant"
        subheader={message.timestamp || new Date().toLocaleTimeString()}
        action={
          <IconButton aria-label="settings" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        }
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
      </CardContent>

      {message.suggestions && message.suggestions.length > 0 && (
        <>
          <Divider variant="middle" />
          <CardActions sx={{ justifyContent: 'space-between' }}>
            <Button
              size="small"
              onClick={handleExpandToggle}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {expanded ? 'Hide Suggestions' : 'Show Suggestions'}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleUseResponse}
              endIcon={<SendIcon fontSize="small" />}
            >
              Use Response
            </Button>
          </CardActions>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent sx={{ pt: 0, pb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Follow-up Suggestions:
              </Typography>
              <List dense>
                {message.suggestions.map((suggestion, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => onUseResponse && onUseResponse(suggestion)}
                    sx={{
                      borderLeft: '3px solid',
                      borderColor: 'primary.light',
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Collapse>
        </>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUseResponse}>
          <SendIcon fontSize="small" sx={{ mr: 1 }} />
          Use Response
        </MenuItem>
        <MenuItem onClick={handleCopyToClipboard}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy to Clipboard
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onReset && onReset(); handleMenuClose(); }}>
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          New Request
        </MenuItem>
      </Menu>
    </Card>
  );
}

/**
 * FeatureCard component for AI assistance feature selection
 */
function FeatureCard({ feature, onSelect }) {
  return (
    <Card
      elevation={1}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={() => onSelect(feature)}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: feature.color }}>
            {feature.icon}
          </Avatar>
        }
        title={feature.title}
      />
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {feature.description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" color="primary" endIcon={<AutoAwesomeIcon />}>
          Use Feature
        </Button>
      </CardActions>
    </Card>
  );
}

/**
 * AIChatAssistant component provides AI assistance to volunteers in the chat interface
 */
export default function AIChatAssistant({ onUseResponse, chatContext }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [promptHistory, setPromptHistory] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature);
  };

  const handlePromptSelect = (promptText) => {
    setPrompt(promptText);
  };

  const handlePromptSubmit = async (e) => {
    e?.preventDefault();

    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, this would be an API call to an AI service
      // For now, use the sample responses or simulate a response
      const simulateApiCall = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            // Check if we have a canned response for this prompt
            const exactMatch = SAMPLE_AI_RESPONSES[prompt];
            if (exactMatch) {
              resolve(exactMatch);
              return;
            }

            // Otherwise generate a generic response
            resolve({
              content: `This is a simulated AI response to your request: "${prompt}"\n\nIn a real implementation, this would use an actual AI model to generate helpful, contextual responses based on the chat history and recovery principles.`,
              suggestions: [
                "Would you like me to provide more specific guidance?",
                "Is there a particular aspect of the conversation you'd like help with?",
                "Would you like some resources related to this topic?"
              ]
            });
          }, 1500); // Simulate API delay
        });
      };

      const aiResponse = await simulateApiCall();

      // Add the response and update prompt history
      const newResponse = {
        id: Date.now(),
        prompt,
        content: aiResponse.content,
        suggestions: aiResponse.suggestions,
        timestamp: new Date().toLocaleTimeString()
      };

      setResponses([newResponse, ...responses]);
      setPromptHistory([prompt, ...promptHistory.filter(p => p !== prompt).slice(0, 9)]);
      setPrompt('');
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAIResponse = (content) => {
    if (onUseResponse) {
      onUseResponse(content);

      // Show notification
      setNotification({
        open: true,
        message: 'AI suggestion inserted into message',
        severity: 'success'
      });
    }
  };

  const handleReset = () => {
    setSelectedFeature(null);
    setPrompt('');
  };

  const renderFeatureSelection = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
        <AutoAwesomeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        How can I assist you?
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
        Select an AI assistance feature to help you in your conversation with the user.
      </Typography>

      {ASSISTANCE_FEATURES.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          onSelect={handleFeatureSelect}
        />
      ))}

      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>About AI Assistance</AlertTitle>
        This tool is designed to support volunteers, not replace human connection.
        All suggestions should be reviewed before sending to ensure they align with
        AA principles and are appropriate for the conversation.
      </Alert>
    </Box>
  );

  const renderPromptSuggestions = () => {
    if (!selectedFeature) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Suggested prompts:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedFeature.prompts.map((promptText, index) => (
            <Chip
              key={index}
              label={promptText}
              onClick={() => handlePromptSelect(promptText)}
              clickable
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    );
  };

  const renderPromptForm = () => (
    <Box component="form" onSubmit={handlePromptSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: selectedFeature?.color || 'primary.main', mr: 1 }}>
          {selectedFeature?.icon || <SmartToyIcon />}
        </Avatar>
        <Typography variant="h6">
          {selectedFeature?.title || 'AI Assistant'}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset">
            <IconButton onClick={handleReset}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {renderPromptSuggestions()}

      <TextField
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask for assistance or suggestions..."
        fullWidth
        multiline
        rows={2}
        variant="outlined"
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <Button
              variant="contained"
              color="primary"
              disabled={!prompt.trim() || isLoading}
              onClick={handlePromptSubmit}
              sx={{ ml: 1 }}
              endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            >
              {isLoading ? 'Generating...' : 'Get Help'}
            </Button>
          )
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {promptHistory.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Recent prompts:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {promptHistory.slice(0, 5).map((historyItem, index) => (
              <Chip
                key={index}
                label={historyItem.length > 30 ? `${historyItem.substring(0, 27)}...` : historyItem}
                onClick={() => setPrompt(historyItem)}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!selectedFeature ? renderFeatureSelection() : renderPromptForm()}

      {responses.length > 0 && selectedFeature && (
        <Box sx={{ mt: 2, overflow: 'auto', flex: 1 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            AI Responses:
          </Typography>
          {responses.map((response) => (
            <AIMessage
              key={response.id}
              message={response}
              onUseResponse={handleUseAIResponse}
              onReset={handleReset}
            />
          ))}
        </Box>
      )}

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <DialogTitle>AI Assistant Settings</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Configure how the AI assistant works to best support your volunteer work.
          </DialogContentText>

          <FormControlLabel
            control={
              <Switch
                checked={contextEnabled}
                onChange={(e) => setContextEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Include chat context in AI requests"
          />
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            When enabled, the AI can see the conversation history to provide more relevant suggestions.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Privacy Note
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No personally identifiable information is shared with AI systems. All data is processed
              according to our privacy policy. Chat messages are anonymized before being used for
              AI assistance.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}