'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageIcon from '@mui/icons-material/Message';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import VolunteerPageHeader from '@/components/Volunteer/VolunteerPageHeader';

/**
 * Session detail page for viewing history of a specific chat session
 */
export default function SessionDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);

  // Fetch session details and messages
  const fetchSessionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch chat session details
      const sessionResponse = await fetch(`/api/volunteers/chat/sessions/${sessionId}`);
      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session details');
      }
      const sessionData = await sessionResponse.json();
      setChatSession(sessionData.session);

      // Fetch chat messages
      const messagesResponse = await fetch(`/api/volunteers/chat/sessions/${sessionId}/messages`);
      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch session messages');
      }
      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages || []);
    } catch (err) {
      console.error('Error fetching session details:', err);
      setError(err.message || 'Failed to fetch session details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate session duration
  const getSessionDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    if (durationMinutes < 1) return '< 1 min';
    if (durationMinutes < 60) return `${durationMinutes} min`;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        <Button sx={{ ml: 2 }} variant="outlined" size="small" onClick={() => router.push('/volunteer/history')}>
          Back to History
        </Button>
      </Alert>
    );
  }

  // If no chat session found
  if (!chatSession) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Session not found or you don't have access to view it.
        <Button sx={{ ml: 2 }} variant="outlined" size="small" onClick={() => router.push('/volunteer/history')}>
          Back to History
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <VolunteerPageHeader
        title="Session Details"
        showBackButton={true}
        backPath="/volunteer/history"
        breadcrumbs={[
          { label: 'Volunteer', path: '/volunteer' },
          { label: 'History', path: '/volunteer/history' },
          { label: 'Session Details', path: '' },
        ]}
        status={{
          color: chatSession.status === 'completed' ? 'success' : 'default',
          icon: <CheckCircleIcon fontSize="small" />,
          label: chatSession.status === 'completed' ? 'Completed' : chatSession.status
        }}
      />

      {/* Session info card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Session Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Session ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {chatSession._id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(chatSession.start_time)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {getSessionDuration(chatSession.start_time, chatSession.end_time)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Messages
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {chatSession.messages_count || messages.length || 0}
                </Typography>
              </Grid>
              {chatSession.topic && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Topic
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {chatSession.topic}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Feedback
                </Typography>
                {chatSession.feedback ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: chatSession.feedback.rating === 'positive' ? 'success.main' : 'error.main', mr: 1 }}>
                        {chatSession.feedback.rating === 'positive' ? <ThumbUpIcon /> : <ThumbDownIcon />}
                      </Avatar>
                      <Typography variant="body1">
                        {chatSession.feedback.rating === 'positive' ? 'Positive' : 'Negative'} Rating
                      </Typography>
                    </Box>
                    {chatSession.feedback.comment && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          User Comment:
                        </Typography>
                        <Typography variant="body2" sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          "{chatSession.feedback.comment}"
                        </Typography>
                      </>
                    )}
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No feedback was provided for this session
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {chatSession.flagged && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FlagIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" color="error.dark">
                This session was flagged
              </Typography>
            </Box>
            {chatSession.flag_reason && (
              <Typography variant="body2" color="error.dark" sx={{ mt: 0.5 }}>
                Reason: {chatSession.flag_reason}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Chat messages */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Conversation History
        </Typography>
        {messages.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No messages found for this session
            </Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message, index) => {
              const isVolunteer = message.sender_type === 'volunteer';
              const showAvatar = index === 0 || messages[index - 1].sender_type !== message.sender_type;

              return (
                <ListItem
                  key={message._id || index}
                  alignItems="flex-start"
                  sx={{
                    flexDirection: 'column',
                    alignItems: isVolunteer ? 'flex-end' : 'flex-start',
                    px: 1,
                    py: 0.5
                  }}
                >
                  {showAvatar && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isVolunteer ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        mb: 0.5,
                        width: '100%'
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: isVolunteer ? 'primary.main' : 'grey.400',
                          width: 24,
                          height: 24,
                          ml: isVolunteer ? 1 : 0,
                          mr: isVolunteer ? 0 : 1
                        }}
                      >
                        {isVolunteer ? 'V' : 'U'}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {isVolunteer ? 'Volunteer' : 'User'}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isVolunteer ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      maxWidth: '85%'
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        bgcolor: isVolunteer ? 'primary.light' : 'grey.100',
                        borderRadius: 2,
                        borderTopLeftRadius: isVolunteer ? 2 : 0,
                        borderTopRightRadius: isVolunteer ? 0 : 2,
                        maxWidth: '100%',
                        wordBreak: 'break-word'
                      }}
                    >
                      <Typography variant="body1">
                        {message.content}
                      </Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mx: 1,
                        alignSelf: 'flex-end'
                      }}
                    >
                      {formatMessageTime(message.timestamp)}
                    </Typography>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Back button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/volunteer/history')}
        >
          Back to Session History
        </Button>
      </Box>
    </Box>
  );
}