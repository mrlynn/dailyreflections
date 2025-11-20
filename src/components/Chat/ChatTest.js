'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useAbly } from '@/lib/ablyContext';
import { enhancedThrottledSend } from '@/utils/enhancedThrottling';

/**
 * Test component for Ably chat functionality
 * This component allows testing real-time communication between browser tabs
 */
export default function ChatTest() {
  const { data: session } = useSession();
  const { client, isConnected, connectionState } = useAbly();

  const [channelName, setChannelName] = useState('test-channel');
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [presenceMembers, setPresenceMembers] = useState([]);
  const [channelInstance, setChannelInstance] = useState(null);
  const [joinedPresence, setJoinedPresence] = useState(false);

  // Effect to subscribe to the channel when it changes
  useEffect(() => {
    if (!client || !isConnected || !channelName) return;

    try {
      // Clean up previous channel if any
      if (channelInstance) {
        channelInstance.unsubscribe();
        channelInstance.presence.unsubscribe();
      }

      console.log(`Subscribing to channel: ${channelName}`);
      const channel = client.channels.get(channelName);
      setChannelInstance(channel);

      // Subscribe to messages
      const messageListener = (msg) => {
        console.log('Received message:', msg);
        setReceivedMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            data: msg.data,
            clientId: msg.clientId
          }
        ]);
      };

      channel.subscribe(messageListener);

      // Subscribe to presence events
      channel.presence.subscribe('enter', (member) => {
        console.log('Member entered:', member);
        setPresenceMembers(prev => {
          if (prev.some(m => m.clientId === member.clientId)) return prev;
          return [...prev, member];
        });
      });

      channel.presence.subscribe('leave', (member) => {
        console.log('Member left:', member);
        setPresenceMembers(prev =>
          prev.filter(m => m.clientId !== member.clientId)
        );
      });

      // Get current presence members
      channel.presence.get((err, members) => {
        if (err) {
          console.error('Error getting presence members:', err);
          return;
        }
        console.log('Current presence members:', members);
        setPresenceMembers(members);
      });

      // Clean up on unmount or channel change
      return () => {
        console.log(`Unsubscribing from channel: ${channelName}`);
        channel.unsubscribe(messageListener);
        channel.presence.unsubscribe();
        if (joinedPresence) {
          channel.presence.leave()
            .catch(err => console.error('Error leaving presence:', err));
        }
      };
    } catch (error) {
      console.error('Error setting up channel:', error);
    }
  }, [client, isConnected, channelName]);

  // Join presence
  const handleJoinPresence = async () => {
    if (!channelInstance) return;

    try {
      // Use enhanced throttled send for presence updates with separate rate limit
      await enhancedThrottledSend(
        async (data) => {
          await channelInstance.presence.enter(data);
        },
        {
          status: 'active',
          name: session?.user?.name || 'Anonymous',
          timestamp: new Date().toISOString()
        },
        channelName + ':presence' // Use a different "channel" for presence
      );
      setJoinedPresence(true);
    } catch (err) {
      console.error('Error joining presence:', err);
    }
  };

  // Leave presence
  const handleLeavePresence = async () => {
    if (!channelInstance) return;

    try {
      // Use enhanced throttled send for presence updates with separate rate limit
      await enhancedThrottledSend(
        async () => {
          await channelInstance.presence.leave();
        },
        {},
        channelName + ':presence' // Use a different "channel" for presence
      );
      setJoinedPresence(false);
    } catch (err) {
      console.error('Error leaving presence:', err);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!channelInstance || !message.trim()) return;

    try {
      // Use enhanced throttled send function with channel-specific rate limiting
      await enhancedThrottledSend(
        async (data) => {
          await channelInstance.publish('chat-message', data);
        },
        message,
        channelName // Pass the channel name for per-channel rate limiting
      );
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Clear messages
  const handleClearMessages = () => {
    setReceivedMessages([]);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Ably Real-time Chat Test
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Alert severity={isConnected ? 'success' : 'warning'}>
          {isConnected
            ? `Connected to Ably as ${client?.auth?.clientId || 'Unknown'}`
            : `Connection state: ${connectionState}`}
        </Alert>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Channel</InputLabel>
          <Select
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            label="Channel"
          >
            <MenuItem value="test-channel">test-channel</MenuItem>
            <MenuItem value="chat:test">chat:test</MenuItem>
            <MenuItem value={`user:${session?.user?.id || 'unknown'}`}>Personal Channel</MenuItem>
          </Select>
        </FormControl>

        {joinedPresence ? (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLeavePresence}
          >
            Leave Presence
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleJoinPresence}
            disabled={!isConnected || !channelInstance}
          >
            Join Presence
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!message.trim() || !isConnected || !channelInstance}
        >
          Send
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Received Messages
        </Typography>
        <Button
          variant="text"
          color="secondary"
          onClick={handleClearMessages}
          disabled={receivedMessages.length === 0}
        >
          Clear
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          maxHeight: 300,
          overflowY: 'auto',
          bgcolor: 'grey.50'
        }}
      >
        {receivedMessages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No messages yet. Send a message or wait for others to send.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {receivedMessages.map((msg) => (
              <Paper
                key={msg.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: client?.auth?.clientId === msg.clientId ? 'primary.light' : 'background.paper',
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="text.secondary" component="div">
                  {msg.clientId} • {msg.timestamp}
                </Typography>
                <Typography variant="body2">
                  {msg.data}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Presence Members
        </Typography>
        {presenceMembers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No members in this channel. Join presence to see yourself here.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {presenceMembers.map((member, index) => (
              <Paper
                key={`${member.clientId}-${index}`}
                variant="outlined"
                sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}
              >
                <Typography variant="body2">
                  {member.clientId === client?.auth?.clientId ? 'You' : member.clientId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {member.data?.status || 'No status'}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            Testing Instructions
          </Typography>
          <Typography variant="body2">
            1. Open this page in multiple browser tabs<br />
            2. Join presence in each tab<br />
            3. Send messages from different tabs<br />
            4. Try different channels to test isolation<br />
            5. Close tabs to see presence updates
          </Typography>
        </Alert>
      </Box>
    </Paper>
  );
}