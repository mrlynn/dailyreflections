'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Divider,
  Badge,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageIcon from '@mui/icons-material/Message';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import AvailabilityToggle from '@/components/Volunteer/AvailabilityToggle';

/**
 * Chat management page for volunteers
 * Shows waiting and active chat sessions
 */
export default function VolunteerChatPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waitingChats, setWaitingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Fetch volunteer chat information
  const fetchChatData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch volunteer status
      const statusResponse = await fetch('/api/volunteers/status');
      if (!statusResponse.ok) {
        throw new Error('Failed to fetch volunteer status');
      }
      const statusData = await statusResponse.json();
      setIsActive(statusData.isActive);

      // Only fetch waiting/active chats if volunteer is active
      if (statusData.isActive) {
        // Fetch waiting chats
        const waitingResponse = await fetch('/api/volunteers/chat/sessions?type=waiting');
        if (!waitingResponse.ok) {
          throw new Error('Failed to fetch waiting chats');
        }
        const waitingData = await waitingResponse.json();
        setWaitingChats(waitingData.sessions || []);

        // Fetch active chats
        const activeResponse = await fetch('/api/volunteers/chat/sessions?type=active');
        if (!activeResponse.ok) {
          throw new Error('Failed to fetch active chats');
        }
        const activeData = await activeResponse.json();
        setActiveChats(activeData.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching chat data:', err);
      setError(err.message || 'Failed to fetch chat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();

    // Set up polling interval if volunteer is active
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        fetchChatData();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle availability toggle
  const handleAvailabilityToggle = (newStatus) => {
    setIsActive(newStatus);
  };

  // Handle picking up a chat
  const handlePickChat = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to pick up chat session');
      }

      // Redirect to chat session
      router.push(`/volunteer/chat/${sessionId}`);
    } catch (err) {
      console.error('Error picking up chat session:', err);
      setError(err.message || 'Failed to pick up chat session');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle continuing active chat
  const handleContinueChat = (sessionId) => {
    router.push(`/volunteer/chat/${sessionId}`);
  };

  // Format waiting time
  const formatWaitingTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - start) / (1000 * 60));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes === 1) {
      return '1 minute';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Format session time
  const formatSessionTime = (startTime) => {
    const start = new Date(startTime);
    return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If loading, show spinner
  if (isLoading && !waitingChats.length && !activeChats.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page title and availability toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Chat Management</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={fetchChatData} sx={{ mr: 1 }} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <AvailabilityToggle isActive={isActive} onChange={handleAvailabilityToggle} />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isActive ? (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            You're currently offline
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toggle your availability to "Online" to start helping people in recovery.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleAvailabilityToggle(true)}
          >
            Go Online Now
          </Button>
        </Paper>
      ) : (
        <Box>
          <Paper sx={{ width: '100%', mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab
                icon={
                  <Badge badgeContent={waitingChats.length} color="error">
                    <AccessTimeIcon />
                  </Badge>
                }
                label="Waiting"
                id="chat-tab-0"
              />
              <Tab
                icon={
                  <Badge badgeContent={activeChats.length} color="primary">
                    <ChatIcon />
                  </Badge>
                }
                label="Active"
                id="chat-tab-1"
              />
            </Tabs>

            <Box p={3} role="tabpanel" hidden={tabValue !== 0} id="chat-tabpanel-0">
              {tabValue === 0 && (
                <>
                  {waitingChats.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No users are currently waiting for help
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Check back soon or refresh the page
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {waitingChats.map((chat) => (
                        <Box key={chat._id}>
                          <ListItem
                            secondaryAction={
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckIcon />}
                                onClick={() => handlePickChat(chat._id)}
                              >
                                Pick Up
                              </Button>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <PersonIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography component="span" variant="body1" fontWeight="medium">
                                    User seeking help
                                  </Typography>
                                  <Chip
                                    label={`Waiting ${formatWaitingTime(chat.start_time)}`}
                                    color="error"
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    Request ID: {chat._id.substring(0, 8)}
                                  </Typography>
                                  {chat.topic && (
                                    <Typography component="div" variant="body2" color="text.secondary">
                                      Topic: {chat.topic}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </Box>
                      ))}
                    </List>
                  )}
                </>
              )}
            </Box>

            <Box p={3} role="tabpanel" hidden={tabValue !== 1} id="chat-tabpanel-1">
              {tabValue === 1 && (
                <>
                  {activeChats.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        You don't have any active chat sessions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Pick up a waiting chat to start helping
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {activeChats.map((chat) => (
                        <Box key={chat._id}>
                          <ListItemButton onClick={() => handleContinueChat(chat._id)}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <ChatIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography component="span" variant="body1" fontWeight="medium">
                                    Active conversation
                                  </Typography>
                                  <Chip
                                    label={`Started ${formatSessionTime(chat.start_time)}`}
                                    color="primary"
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <MessageIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      {chat.messages_count || 0} messages
                                    </Typography>
                                  </Box>
                                  {chat.topic && (
                                    <Typography component="div" variant="body2" color="text.secondary">
                                      Topic: {chat.topic}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItemButton>
                          <Divider variant="inset" component="li" />
                        </Box>
                      ))}
                    </List>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}