'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Grid,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Collapse,
  Fade,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InsightsIcon from '@mui/icons-material/Insights';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Import our new components
import ResourcesPanel from './ResourcesPanel';
import QuickResponses from './QuickResponses';
import AIChatAssistant from './AIChatAssistant';

/**
 * TabPanel component for organizing different assistant panels
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assistant-tabpanel-${index}`}
      aria-labelledby={`assistant-tab-${index}`}
      style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

/**
 * ChatMessage component renders an individual message in the chat
 */
function ChatMessage({ message, currentUserId }) {
  const isCurrentUser = message.sender_id === currentUserId ||
    message.sender_type === 'volunteer';
  const isSystem = message.sender_type === 'system';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, px: 2, width: '100%' }}>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            px: 3,
            backgroundColor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            maxWidth: '80%',
            borderRadius: 2
          }}
        >
          <Typography
            variant="body2"
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
        mb: 1.5,
        px: 2,
        maxWidth: '100%'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          flexDirection: isCurrentUser ? 'row-reverse' : 'row'
        }}
      >
        <Avatar
          sx={{
            width: 28,
            height: 28,
            fontSize: '0.9rem',
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
          color: isCurrentUser ? 'primary.contrastText' : 'text.primary'
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
      </Paper>
    </Box>
  );
}

/**
 * EnhancedVolunteerChat component provides a rich chat interface with resources and AI assistance
 */
export default function EnhancedVolunteerChat({
  sessionId,
  onClose,
  initialMessages = [],
  initialSession = null
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatSession, setChatSession] = useState(initialSession);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(!isMobile);
  const [assistantTab, setAssistantTab] = useState(0);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
        // In a real implementation, fetch from API
        // For demo purposes, simulate a delay and use static data
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!chatSession) {
          setChatSession({
            _id: sessionId || 'session123',
            user_id: 'user456',
            volunteer_id: currentUserId,
            status: 'active',
            start_time: new Date(Date.now() - 30 * 60000).toISOString(),
            topic: 'Dealing with stress in recovery'
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

          // Calculate and update chat metrics
          updateChatMetrics();
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

    setChatMetrics({
      duration: durationMinutes < 60 ?
        `${durationMinutes} min` :
        `${Math.floor(durationMinutes/60)}h ${durationMinutes%60}m`,
      messageCount: messages.length,
      volunteerResponseTime: `${Math.floor(avgResponseSeconds/60)} min ${avgResponseSeconds%60}s`
    });
  };

  // Handle message sending
  const handleSendMessage = async (e) => {
    e?.preventDefault();

    const messageContent = newMessage.trim();
    if (!messageContent) return;

    try {
      setIsSending(true);

      // In a real implementation, send to API
      // For demo purposes, just add to local state
      const newMsg = {
        _id: `m${Date.now()}`,
        session_id: chatSession._id,
        sender_id: currentUserId,
        sender_type: 'volunteer',
        content: messageContent,
        created_at: new Date().toISOString(),
        status: 'sent'
      };

      // Add message to state
      setMessages([...messages, newMsg]);
      setNewMessage('');

      // Auto-scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      // Update metrics
      updateChatMetrics();
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

      // In a real implementation, call API to end session
      // For demo purposes, just update local state
      setChatSession({
        ...chatSession,
        status: 'completed',
        end_time: new Date().toISOString()
      });

      // Add system message about session ending
      const systemMsg = {
        _id: `system${Date.now()}`,
        session_id: chatSession._id,
        sender_id: 'system',
        sender_type: 'system',
        content: 'Chat session has ended. Thank you for participating.',
        created_at: new Date().toISOString()
      };

      setMessages([...messages, systemMsg]);
      setEndDialogOpen(false);

      // In a real app, this might redirect to a session summary
      // or return to the sessions list
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

  // Handle assistant panel tab change
  const handleAssistantTabChange = (event, newValue) => {
    setAssistantTab(newValue);
  };

  // Handle inserting content from assistant panels
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

  // Determine if session is active
  const isSessionActive = chatSession?.status === 'active' || chatSession?.status === 'in_progress';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header - More compact */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ minHeight: '48px', py: 0.5 }}>
          <IconButton edge="start" color="inherit" onClick={onClose} sx={{ mr: 1 }} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.dark', mr: 1 }}>
              <PersonIcon sx={{ fontSize: 14 }} />
            </Avatar>
            <Box sx={{ lineHeight: 1.1 }}>
              <Typography variant="body2" component="div" sx={{ fontWeight: 'medium' }}>
                Support Chat
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  #{chatSession?.user_id?.substring(0, 6) || ''}
                </Typography>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              size="small"
              icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
              label={chatMetrics.duration}
              variant="outlined"
              sx={{ height: 24 }}
            />

            <Chip
              size="small"
              icon={isSessionActive ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <WarningIcon sx={{ fontSize: 14 }} />}
              label={isSessionActive ? "Active" : "Ended"}
              color={isSessionActive ? "success" : "default"}
              sx={{ height: 24 }}
            />

            <Tooltip title="Toggle assistant panel">
              <IconButton
                color="inherit"
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                size="small"
              >
                <Badge color="primary" variant="dot" invisible={!isAssistantOpen}>
                  <MenuIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content area with chat and assistant panels */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Chat messages panel */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Session info - More compact */}
          {chatSession && (
            <Paper elevation={0} sx={{ py: 0.5, px: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {chatSession.topic && (
                    <Chip
                      size="small"
                      label={`Topic: ${chatSession.topic}`}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  )}
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Messages:</span>&nbsp;{messages.length}
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 12 }} />
                    <span style={{ fontWeight: 500 }}>Avg Response:</span>&nbsp;{chatMetrics.volunteerResponseTime}
                  </Typography>
                </Box>

                <Box>
                  {isSessionActive ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setEndDialogOpen(true)}
                      startIcon={<CloseIcon fontSize="small" />}
                      sx={{ py: 0.25, minHeight: 0, minWidth: 0 }}
                    >
                      End Chat
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={onClose}
                      sx={{ py: 0.25, minHeight: 0, minWidth: 0 }}
                    >
                      View Summary
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          )}

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

          {/* Messages area */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              ref={messagesContainerRef}
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                py: 1,
                backgroundImage: 'linear-gradient(rgba(25, 118, 210, 0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {messages.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    No messages yet. Start the conversation!
                  </Typography>
                </Box>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message._id}
                    message={message}
                    currentUserId={currentUserId}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}

          {/* Message input - More compact */}
          {isSessionActive && (
            <Paper
              elevation={2}
              component="form"
              onSubmit={handleSendMessage}
              sx={{
                p: 1,
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                  sx={{ mr: 1 }}
                  InputProps={{
                    sx: {
                      borderRadius: 2
                    }
                  }}
                />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    endIcon={<SendIcon fontSize="small" />}
                    disabled={!newMessage.trim() || isSending}
                    type="submit"
                    sx={{ py: 0.5, px: 1.5 }}
                  >
                    Send
                  </Button>

                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    sx={{ display: { xs: 'none', md: 'flex' } }}
                  >
                    <Badge color="primary" variant="dot" invisible={!isAssistantOpen}>
                      <MoreVertIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Optimized assistant panel - shown as drawer on mobile, sidebar on desktop */}
        {isMobile ? (
          <Drawer
            anchor="right"
            open={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            sx={{
              width: 280,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 280,
              },
            }}
          >
            <AppBar position="static" color="default" elevation={0}>
              <Toolbar variant="dense" sx={{ minHeight: '40px', py: 0 }}>
                <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
                  Volunteer Tools
                </Typography>
                <IconButton onClick={() => setIsAssistantOpen(false)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Toolbar>
            </AppBar>

            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={assistantTab}
                onChange={handleAssistantTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '36px' }}
              >
                <Tab
                  icon={<FormatQuoteIcon fontSize="small" />}
                  label="Quick Responses"
                  sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
                />
                <Tab
                  icon={<LibraryBooksIcon fontSize="small" />}
                  label="Resources"
                  sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
                />
                <Tab
                  icon={<SmartToyIcon fontSize="small" />}
                  label="AI Help"
                  sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
                />
              </Tabs>

              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <TabPanel value={assistantTab} index={0}>
                  <QuickResponses onUseResponse={handleInsertContent} />
                </TabPanel>
                <TabPanel value={assistantTab} index={1}>
                  <ResourcesPanel onInsertMessage={handleInsertContent} chatContext={chatSession} />
                </TabPanel>
                <TabPanel value={assistantTab} index={2}>
                  <AIChatAssistant onUseResponse={handleInsertContent} chatContext={{ messages, chatSession }} />
                </TabPanel>
              </Box>
            </Box>
          </Drawer>
        ) : (
          <Collapse
            in={isAssistantOpen}
            orientation="horizontal"
            sx={{
              width: isAssistantOpen ? 280 : 0,
              transition: theme.transitions.create('width'),
              borderLeft: 1,
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={assistantTab}
                onChange={handleAssistantTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '36px' }}
              >
                <Tab
                  icon={<FormatQuoteIcon fontSize="small" />}
                  label="Responses"
                  sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
                />
                <Tab
                  icon={<LibraryBooksIcon fontSize="small" />}
                  label="Resources"
                  sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
                />
                <Tab
                  icon={<SmartToyIcon fontSize="small" />}
                  label="AI Help"
                  sx={{ minHeight: '36px', py: 0, fontSize: '0.8rem' }}
                />
              </Tabs>

              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <TabPanel value={assistantTab} index={0}>
                  <QuickResponses onUseResponse={handleInsertContent} />
                </TabPanel>
                <TabPanel value={assistantTab} index={1}>
                  <ResourcesPanel onInsertMessage={handleInsertContent} chatContext={chatSession} />
                </TabPanel>
                <TabPanel value={assistantTab} index={2}>
                  <AIChatAssistant onUseResponse={handleInsertContent} chatContext={{ messages, chatSession }} />
                </TabPanel>
              </Box>
            </Box>
          </Collapse>
        )}
      </Box>

      {/* End Chat Session Confirmation Dialog */}
      <Dialog
        open={endDialogOpen}
        onClose={() => setEndDialogOpen(false)}
      >
        <DialogTitle>End Chat Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end this chat session? This will close the conversation for the user.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)} disabled={isEnding}>
            Cancel
          </Button>
          <Button
            onClick={handleEndSession}
            color="error"
            disabled={isEnding}
            startIcon={isEnding ? <CircularProgress size={16} /> : null}
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}