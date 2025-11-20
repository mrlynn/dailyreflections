'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSession } from 'next-auth/react';
import { useAbly } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Import our chat components
import ChatContainer from '@/components/Chat/ChatContainer';
import SessionSummaryDialog from '@/components/Chat/SessionSummaryDialog';

/**
 * Realtime Volunteer Chat component using Ably
 * @param {Object} props
 * @param {string} props.sessionId - Chat session ID
 * @param {Function} props.onClose - Callback when chat is closed
 * @param {Array} props.initialMessages - Initial messages to display
 * @param {Object} props.initialSession - Initial session data
 */
export default function RealtimeVolunteerChat({
  sessionId,
  onClose,
  initialMessages = [],
  initialSession = null
}) {
  const { data: session } = useSession();
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  const { isConnected } = useAbly();

  // State variables
  const [chatSession, setChatSession] = useState(initialSession);
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [chatMetrics, setChatMetrics] = useState({
    duration: '0 min',
    messageCount: 0,
    volunteerResponseTime: '0 min'
  });

  // Current volunteer ID
  const currentUserId = session?.user?.id;

  // Show error if feature is disabled
  useEffect(() => {
    if (!isRealtimeChatEnabled) {
      setError('Realtime chat feature is not enabled');
      setIsLoading(false);
    }
  }, [isRealtimeChatEnabled]);

  // Effect to fetch chat session and initial messages
  useEffect(() => {
    // Don't fetch if feature is disabled
    if (!isRealtimeChatEnabled) {
      return;
    }

    const fetchChatData = async () => {
      try {
        setIsLoading(true);

        // Fetch session if not provided
        if (!chatSession && sessionId) {
          const sessionResponse = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (!sessionResponse.ok) {
            throw new Error('Failed to fetch chat session');
          }

          const sessionData = await sessionResponse.json();
          setChatSession(sessionData.session);
        }

        // Fetch messages if not provided
        if (messages.length === 0 && sessionId) {
          const messagesResponse = await fetch(`/api/volunteers/chat/messages?sessionId=${sessionId}`, {
            method: 'GET'
          });

          if (!messagesResponse.ok) {
            throw new Error('Failed to fetch chat messages');
          }

          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
        }

        // Update chat metrics
        setTimeout(() => updateChatMetrics(), 100);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();

    // Set up periodic session status check
    const statusPolling = setInterval(async () => {
      if (sessionId) {
        try {
          const response = await fetch(`/api/volunteers/chat/sessions/${sessionId}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setChatSession(data.session);
          }
        } catch (error) {
          console.error('Error checking session status:', error);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(statusPolling);
    };
  }, [sessionId, initialSession, initialMessages]);

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

  // Handle new message (from Ably)
  const handleNewMessage = (newMessage) => {
    setMessages(prev => {
      // Skip if we already have this message (prevent duplicates)
      if (prev.some(m => m._id === newMessage._id)) {
        return prev;
      }
      return [...prev, newMessage];
    });

    // Update metrics whenever a new message comes in
    setTimeout(() => updateChatMetrics(), 100);
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

      // Update local state with locked status
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

      // Step 5: Show session summary dialog
      setSummaryDialogOpen(true);
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end chat session. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  // If still loading, show loading screen
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
        p={3}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Determine if session is active and not locked
  const isSessionActive = (chatSession?.status === 'active' || chatSession?.status === 'in_progress')
    && !chatSession?.is_locked;

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
          <Chip
            size="small"
            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
            label={chatMetrics.duration}
            sx={{ height: 24 }}
            variant="outlined"
          />

          <Chip
            size="small"
            icon={isSessionActive ?
              <CheckCircleIcon sx={{ fontSize: 14 }} /> :
              <LockIcon sx={{ fontSize: 14 }} />
            }
            label={isSessionActive ? "Active" : "Locked"}
            color={isSessionActive ? "success" : "error"}
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

      {/* Connection status */}
      {!isConnected && (
        <Alert severity="warning" sx={{ m: 1 }}>
          Reconnecting to chat... Some messages may be delayed.
        </Alert>
      )}

      {/* Main chat area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatContainer
          sessionId={sessionId}
          initialMessages={messages}
          chatSession={chatSession}
          isVolunteer={true}
          onNewMessage={handleNewMessage}
        />
      </Box>

      {/* Session Summary Dialog */}
      <SessionSummaryDialog
        open={summaryDialogOpen}
        onClose={() => {
          setSummaryDialogOpen(false);
        }}
        onSubmit={(summaryData) => {
          console.log("Session summary submitted:", summaryData);
          // In a real app, this would be saved to the database
          setSummaryDialogOpen(false);
        }}
      />

      {/* End Chat Session Confirmation Dialog */}
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
    </Box>
  );
}