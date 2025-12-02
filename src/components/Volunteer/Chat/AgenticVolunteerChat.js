'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Collapse,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WarningIcon from '@mui/icons-material/Warning';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Agentic Volunteer Chat Component
 *
 * Enhanced chat interface with real-time AI assistance powered by
 * our multi-agent system (LangGraph).
 *
 * Features:
 * - Real-time crisis detection
 * - Intelligent resource suggestions
 * - Response quality coaching
 * - Conversation insights
 * - Live streaming updates
 */
export default function AgenticVolunteerChat({ conversationId }) {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [draftResponse, setDraftResponse] = useState('');
  const [sending, setSending] = useState(false);

  // Agent state
  const [agentAnalysis, setAgentAnalysis] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentProgress, setAgentProgress] = useState(null);

  // UI state
  const [showResources, setShowResources] = useState(true);
  const [showCoaching, setShowCoaching] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  const messagesEndRef = useRef(null);
  const analysisTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation messages
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const response = await fetch(`/api/volunteer/conversations/${conversationId}`);
      const data = await response.json();

      if (data.conversation) {
        setMessages(data.conversation.messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Analyze incoming user message with agents
  const analyzeMessage = useCallback(async (userMessage) => {
    setAgentLoading(true);
    setAgentProgress('Initializing AI agents...');

    try {
      const response = await fetch('/api/volunteer/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'analyze_message',
          userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Agent analysis failed');
      }

      const data = await response.json();
      setAgentAnalysis(data.analysis);

      // Show crisis alert immediately if detected
      if (data.analysis.crisisDetection?.isCrisis) {
        showCrisisNotification(data.analysis.crisisDetection);
      }

      setAgentProgress(null);
    } catch (error) {
      console.error('Agent analysis error:', error);
      setAgentProgress('Analysis failed');
    } finally {
      setAgentLoading(false);
    }
  }, [conversationId]);

  // Analyze volunteer's draft response (debounced)
  const analyzeDraft = useCallback(async (draft) => {
    if (!draft || draft.trim().length < 10) {
      return;
    }

    const latestUserMessage = messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content;

    if (!latestUserMessage) {
      return;
    }

    try {
      const response = await fetch('/api/volunteer/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'coach_response',
          volunteerDraft: draft,
          userMessage: latestUserMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAgentAnalysis(prev => ({
          ...prev,
          responseCoaching: data.analysis.responseCoaching,
        }));
      }
    } catch (error) {
      console.error('Draft analysis error:', error);
    }
  }, [conversationId, messages]);

  // Debounced draft analysis
  useEffect(() => {
    // Clear previous timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Set new timeout
    if (draftResponse) {
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeDraft(draftResponse);
      }, 2000); // Analyze 2 seconds after user stops typing
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [draftResponse, analyzeDraft]);

  // Handle new incoming message
  const handleNewUserMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
    analyzeMessage(message.content);
  }, [analyzeMessage]);

  // Send volunteer response
  const handleSendMessage = async () => {
    if (!draftResponse.trim()) return;

    setSending(true);

    try {
      // Send message via your existing API
      const response = await fetch(`/api/volunteer/conversations/${conversationId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draftResponse }),
      });

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'volunteer',
          content: draftResponse,
          timestamp: new Date(),
        }]);
        setDraftResponse('');
        setAgentAnalysis(prev => ({
          ...prev,
          responseCoaching: null, // Clear coaching after sending
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const showCrisisNotification = (crisisDetection) => {
    // Show browser notification for crisis (if permitted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Crisis Detected', {
        body: `Risk Level: ${crisisDetection.riskLevel.toUpperCase()}\n${crisisDetection.recommendedAction}`,
        icon: '/crisis-icon.png',
        requireInteraction: true,
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Chat Header */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Peer Support Conversation</Typography>
          <Typography variant="body2" color="text.secondary">
            Conversation ID: {conversationId}
          </Typography>
        </Paper>

        {/* Messages */}
        <Paper sx={{ flex: 1, p: 2, mb: 2, overflowY: 'auto' }}>
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 2,
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end',
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.role === 'user' ? 'grey.100' : 'primary.light',
                  color: msg.role === 'user' ? 'text.primary' : 'primary.contrastText',
                }}
              >
                <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                  {msg.role === 'user' ? 'User' : 'You'}
                </Typography>
                <Typography variant="body1">{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Paper>

        {/* Message Input */}
        <Paper sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your response..."
            value={draftResponse}
            onChange={(e) => setDraftResponse(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending}
          />
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Press Enter to send • Shift+Enter for new line
            </Typography>
            <Button
              variant="contained"
              endIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={handleSendMessage}
              disabled={sending || !draftResponse.trim()}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* AI Assistant Panel */}
      <Box
        sx={{
          width: 400,
          borderLeft: 1,
          borderColor: 'divider',
          p: 2,
          overflowY: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        {/* Panel Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">AI Assistant</Typography>
          {agentLoading && (
            <CircularProgress size={20} sx={{ ml: 'auto' }} />
          )}
        </Box>

        {agentProgress && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {agentProgress}
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Crisis Detection Alert */}
        {agentAnalysis?.crisisDetection?.isCrisis && (
          <Alert
            severity="error"
            icon={<WarningIcon />}
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" onClick={() => setAgentAnalysis(prev => ({
                ...prev,
                crisisDetection: null,
              }))}>
                ×
              </IconButton>
            }
          >
            <AlertTitle>
              🚨 Crisis Detected - {agentAnalysis.crisisDetection.riskLevel.toUpperCase()}
            </AlertTitle>
            <Typography variant="body2">
              {agentAnalysis.crisisDetection.recommendedAction}
            </Typography>
            {agentAnalysis.crisisDetection.indicators.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" fontWeight="bold">
                  Indicators:
                </Typography>
                <Typography variant="caption" display="block">
                  {agentAnalysis.crisisDetection.indicators.join(', ')}
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Resource Suggestions */}
        {agentAnalysis?.resourceSuggestions?.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', mb: 1, cursor: 'pointer' }}
                onClick={() => setShowResources(!showResources)}
              >
                <MenuBookIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  Suggested Resources
                </Typography>
                <Badge badgeContent={agentAnalysis.resourceSuggestions.length} color="secondary">
                  {showResources ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Badge>
              </Box>

              <Collapse in={showResources}>
                <Divider sx={{ mb: 1 }} />
                {agentAnalysis.resourceSuggestions.map((resource, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {resource.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
                      {resource.excerpt}
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Chip
                        label={resource.citation}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                      <Tooltip title="Copy to clipboard">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(resource.excerpt)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Response Coaching */}
        {agentAnalysis?.responseCoaching && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', mb: 1, cursor: 'pointer' }}
                onClick={() => setShowCoaching(!showCoaching)}
              >
                <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  Response Coaching
                </Typography>
                {showCoaching ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={showCoaching}>
                <Divider sx={{ mb: 1 }} />

                {/* Scores */}
                <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
                  <Chip
                    label={`Quality: ${agentAnalysis.responseCoaching.qualityScore}/10`}
                    size="small"
                    color={agentAnalysis.responseCoaching.qualityScore >= 7 ? 'success' : 'warning'}
                  />
                  <Chip
                    label={`Empathy: ${agentAnalysis.responseCoaching.empathyScore}/10`}
                    size="small"
                    color={agentAnalysis.responseCoaching.empathyScore >= 7 ? 'success' : 'warning'}
                  />
                </Box>

                {/* Strengths */}
                {agentAnalysis.responseCoaching.strengths?.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight="bold" color="success.main">
                      ✓ Strengths:
                    </Typography>
                    <List dense disablePadding>
                      {agentAnalysis.responseCoaching.strengths.map((strength, idx) => (
                        <ListItem key={idx} disablePadding>
                          <ListItemText
                            primary={strength}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Improvements */}
                {agentAnalysis.responseCoaching.improvements?.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight="bold" color="info.main">
                      💡 Suggestions:
                    </Typography>
                    <List dense disablePadding>
                      {agentAnalysis.responseCoaching.improvements.map((suggestion, idx) => (
                        <ListItem key={idx} disablePadding>
                          <ListItemText
                            primary={suggestion}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Conversation Insights */}
        {agentAnalysis?.conversationAnalysis && (
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', mb: 1, cursor: 'pointer' }}
                onClick={() => setShowInsights(!showInsights)}
              >
                <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  Conversation Insights
                </Typography>
                {showInsights ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={showInsights}>
                <Divider sx={{ mb: 1 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  <Chip
                    label={`Sentiment: ${agentAnalysis.conversationAnalysis.sentiment}`}
                    size="small"
                    color={
                      ['positive', 'hopeful'].includes(agentAnalysis.conversationAnalysis.sentiment)
                        ? 'success'
                        : agentAnalysis.conversationAnalysis.sentiment === 'distressed'
                        ? 'error'
                        : 'default'
                    }
                  />
                  <Chip
                    label={`Phase: ${agentAnalysis.conversationAnalysis.conversationPhase}`}
                    size="small"
                  />
                  {agentAnalysis.conversationAnalysis.conversationQuality && (
                    <Chip
                      label={`Quality: ${agentAnalysis.conversationAnalysis.conversationQuality}/10`}
                      size="small"
                      color={
                        agentAnalysis.conversationAnalysis.conversationQuality >= 7
                          ? 'success'
                          : 'default'
                      }
                    />
                  )}
                </Box>

                {agentAnalysis.conversationAnalysis.topics?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" fontWeight="bold">
                      Topics:
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {agentAnalysis.conversationAnalysis.topics.join(', ')}
                    </Typography>
                  </Box>
                )}

                {agentAnalysis.conversationAnalysis.userEmotionalState && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" fontWeight="bold">
                      User State:
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {agentAnalysis.conversationAnalysis.userEmotionalState}
                    </Typography>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* No Analysis Yet */}
        {!agentAnalysis && !agentLoading && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              AI assistance will appear here as you chat
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
