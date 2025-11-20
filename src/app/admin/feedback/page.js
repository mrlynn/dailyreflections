'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Paper,
  Divider,
  Tooltip,
  Collapse,
  IconButton,
  Tabs,
  Tab,
  Skeleton,
  Button,
  TextField,
} from '@mui/material';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FlagIcon from '@mui/icons-material/Flag';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsightsIcon from '@mui/icons-material/Insights';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';

const FEEDBACK_TYPE_OPTIONS = [
  { value: 'all', label: 'All feedback' },
  { value: 'thumbs_up', label: 'Positive only' },
  { value: 'thumbs_down', label: 'Needs attention' },
];

function formatPercentage(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

const TAG_LABELS = {
  accurate: 'Accurate',
  helpful: 'Helpful or relatable',
  calm: 'Calm, compassionate tone',
  confusing: 'Confusing',
  inaccurate: 'Inaccurate or misleading',
  not_compassionate: 'Not compassionate',
};

const SEVERITY_DETAILS = {
  critical: {
    label: 'Critical',
    color: 'error',
    icon: <ErrorOutlineIcon fontSize="small" />,
    description: 'Multiple issues reported within the last 72 hours.',
  },
  high: {
    label: 'High',
    color: 'error',
    icon: <WarningIcon fontSize="small" />,
    description: 'Recent negative feedback requires review.',
  },
  medium: {
    label: 'Medium',
    color: 'warning',
    icon: <FlagIcon fontSize="small" />,
    description: 'Monitor for emerging issues.',
  },
  none: {
    label: 'Info',
    color: 'default',
    icon: <InsightsIcon fontSize="small" />,
    description: 'No active issues detected.',
  },
  unknown: {
    label: 'Unknown',
    color: 'default',
    icon: <InsightsIcon fontSize="small" />,
    description: 'Severity not available.',
  },
};

function TrendAreaChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
        <Typography variant="body2" color="text.secondary">
          No feedback activity recorded in the selected window yet.
        </Typography>
      </Box>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#d32f2f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
        <XAxis dataKey="dateLabel" />
        <YAxis allowDecimals={false} />
        <RechartsTooltip
          formatter={(value, key) => [value, key === 'thumbsUp' ? 'Thumbs Up' : 'Thumbs Down']}
          labelFormatter={(label, payload) => {
            const toneScore = payload?.[0]?.payload?.averageToneScore;
            return toneScore
              ? `${label} (Avg tone: ${(toneScore * 100).toFixed(0)}%)`
              : label;
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="thumbsUp"
          stroke="#2e7d32"
          fill="url(#colorUp)"
          name="Thumbs Up"
        />
        <Area
          type="monotone"
          dataKey="thumbsDown"
          stroke="#d32f2f"
          fill="url(#colorDown)"
          name="Thumbs Down"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function FeedbackEntry({ entry }) {
  const [open, setOpen] = useState(false);

  const toneColor = entry.feedbackType === 'thumbs_up'
    ? 'success'
    : 'error';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) =>
          entry.feedbackType === 'thumbs_up'
            ? theme.palette.success.light + '15'
            : theme.palette.error.light + '12',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (theme) =>
                  entry.feedbackType === 'thumbs_up'
                    ? theme.palette.success.light
                    : theme.palette.error.light,
                color: (theme) =>
                  entry.feedbackType === 'thumbs_up'
                    ? theme.palette.success.dark
                    : theme.palette.error.dark,
              }}
            >
              {entry.feedbackType === 'thumbs_up' ? (
                <ThumbUpAltIcon fontSize="small" />
              ) : (
                <ThumbDownAltIcon fontSize="small" />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" color={`${toneColor}.main`}>
                {entry.feedbackType === 'thumbs_up' ? 'Positive feedback' : 'Needs review'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="inherit" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(entry.submittedAt)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Tooltip title={open ? 'Hide details' : 'Show details'}>
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Stack>

        {entry.comment && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Participant note
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              "{entry.comment}"
            </Typography>
          </Box>
        )}

        {entry.tags?.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {entry.tags.map(tag => (
              <Chip
                key={tag}
                label={TAG_LABELS[tag] ?? tag}
                size="small"
                color={entry.feedbackType === 'thumbs_up' ? 'success' : 'warning'}
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        <Collapse in={open}>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={2}>
            {entry.userMessage?.content && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  User question
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {entry.userMessage.content}
                </Typography>
              </Box>
            )}

            {entry.response?.content && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Assistant response
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {entry.response.content}
                </Typography>
              </Box>
            )}

            {entry.response?.citations?.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Citations ({entry.response.citations.length})
                </Typography>
                <Stack spacing={1} sx={{ mt: 0.5 }}>
                  {entry.response.citations.map((citation, index) => (
                    <Paper
                      key={`${entry.id}-citation-${index}`}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 1 }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {citation.reference}
                      </Typography>
                      {citation.text && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}
                        >
                          "{citation.text}"
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

function FlaggedResponseCard({ flag }) {
  const detail = SEVERITY_DETAILS[flag.severity] ?? SEVERITY_DETAILS.unknown;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => {
          if (flag.severity === 'critical') {
            return theme.palette.error.light + '12';
          }
          if (flag.severity === 'high') {
            return theme.palette.error.light + '08';
          }
          if (flag.severity === 'medium') {
            return theme.palette.warning.light + '08';
          }
          return theme.palette.background.paper;
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              icon={detail.icon}
              label={detail.label}
              color={detail.color === 'default' ? 'default' : detail.color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              {detail.description}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">
              Total feedback: <strong>{flag.totalFeedback}</strong>
            </Typography>
            <Typography variant="body2">
              Negative: <strong>{flag.negativeFeedback}</strong>
            </Typography>
            <Typography variant="body2">
              Recent (72h): <strong>{flag.recentFlagCount}</strong>
            </Typography>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.5}>
          {flag.lastComment && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Most recent participant note
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                "{flag.lastComment}"
              </Typography>
            </Box>
          )}

          {flag.responsePreview?.content && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Assistant response snapshot
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {flag.responsePreview.content}
              </Typography>
            </Box>
          )}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(flag.lastSignals ?? []).map((signal) => (
            <Chip
              key={signal}
              label={signal.replace(/_/g, ' ')}
              size="small"
              color="error"
              variant="outlined"
            />
          ))}
          {(flag.activeSignals ?? [])
            .filter((signal) => !(flag.lastSignals ?? []).includes(signal))
            .map((signal) => (
              <Chip
                key={`active-${signal}`}
                label={signal.replace(/_/g, ' ')}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
        </Stack>

        {flag.history?.length > 0 && (
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Recent reports
            </Typography>
            {flag.history.slice(-3).reverse().map((item) => (
              <Typography key={item.feedbackId?.toString()} variant="body2">
                {new Date(item.submittedAt).toLocaleString()} · {item.feedbackType.replace('_', ' ')} ·{' '}
                {item.signals.join(', ') || 'no signals'}
              </Typography>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function RecommendationCard({ recommendation, onAction, isProcessing }) {
  const [note, setNote] = useState('');

  const handleAction = (status) => {
    onAction?.(recommendation.id, status, note);
  };

  const targetDescription =
    recommendation.type === 'retrieval'
      ? recommendation.target?.reference || recommendation.target?.source || 'Unknown passage'
      : TAG_LABELS[recommendation.target?.tag] ?? recommendation.target?.tag ?? 'Prompt theme';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => (recommendation.status === 'pending'
          ? theme.palette.info.light + '12'
          : theme.palette.background.paper),
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ letterSpacing: 0.2 }}>
              {recommendation.type === 'retrieval' ? 'Retrieval Review' : 'Prompt Guidance'}
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {targetDescription}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {recommendation.summary}
            </Typography>
          </Stack>
          <Chip
            label={recommendation.status}
            color={
              recommendation.status === 'accepted'
                ? 'success'
                : recommendation.status === 'dismissed'
                  ? 'default'
                  : 'info'
            }
            variant={recommendation.status === 'pending' ? 'filled' : 'outlined'}
            sx={{ alignSelf: 'flex-start' }}
          />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(recommendation.signals ?? []).map((signal) => (
            <Chip key={signal} label={signal.replace(/_/g, ' ')} size="small" />
          ))}
        </Stack>

        {recommendation.metrics && (
          <Stack direction="row" spacing={3}>
            {recommendation.metrics.totalFeedback !== undefined && (
              <Typography variant="body2">
                Total feedback: <strong>{recommendation.metrics.totalFeedback}</strong>
              </Typography>
            )}
            {recommendation.metrics.negativeFeedback !== undefined && (
              <Typography variant="body2">
                Negative: <strong>{recommendation.metrics.negativeFeedback}</strong>
              </Typography>
            )}
            {recommendation.metrics.recentFlagCount !== undefined && (
              <Typography variant="body2">
                Recent flags: <strong>{recommendation.metrics.recentFlagCount}</strong>
              </Typography>
            )}
            {recommendation.metrics.occurrences !== undefined && (
              <Typography variant="body2">
                Occurrences: <strong>{recommendation.metrics.occurrences}</strong>
              </Typography>
            )}
          </Stack>
        )}

        {recommendation.evidence?.examples?.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Recent examples
            </Typography>
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              {recommendation.evidence.examples.map((example, index) => (
                <Paper
                  key={`${recommendation.id}-example-${index}`}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 1 }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {example.comment || '(no comment provided)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {example.submittedAt
                      ? new Date(example.submittedAt).toLocaleString()
                      : 'timestamp unavailable'}
                    {example.responseMessageId ? ` · ${example.responseMessageId}` : ''}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {recommendation.actionHistory?.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Action history
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {recommendation.actionHistory.slice(-3).reverse().map((action, index) => (
                <Typography key={`${recommendation.id}-action-${index}`} variant="body2">
                  {new Date(action.performedAt).toLocaleString()} · {action.status}
                  {action.note ? ` — ${action.note}` : ''}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        <Stack spacing={1}>
          <TextField
            size="small"
            label="Reviewer note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              disabled={isProcessing}
              onClick={() => handleAction('accepted')}
            >
              Mark as accepted
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isProcessing}
              onClick={() => handleAction('dismissed')}
            >
              Dismiss
            </Button>
            {recommendation.status !== 'pending' && (
              <Button
                variant="text"
                disabled={isProcessing}
                onClick={() => handleAction('pending')}
              >
                Reopen
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

function CrisisLogCard({ log }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: log.escalationFlag
          ? (theme) => theme.palette.error.light + '12'
          : 'inherit',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600}>
            {log.detectedIntent === 'suicidal_ideation' ? 'Suicidal Ideation' : 'Relapse Risk'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={log.responseTemplate || 'template'}
            size="small"
            variant="outlined"
          />
          {log.escalationFlag && (
            <Chip label="Escalation flag" size="small" color="error" variant="outlined" />
          )}
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Triggered by
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {(log.triggeredBy ?? []).map((reason) => (
              <Chip key={reason} label={reason.replace(/_/g, ' ')} size="small" />
            ))}
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Session fingerprint: <strong>{log.sessionHash?.slice(0, 12) ?? 'unknown'}</strong>
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function ChatbotFeedbackAdminPage() {
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [filters, setFilters] = useState({
    feedbackType: 'all',
    tag: 'all',
  });
  const [trendData, setTrendData] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [flaggedResponses, setFlaggedResponses] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [recommendationStatusFilter, setRecommendationStatusFilter] = useState('pending');
  const [recommendationTypeFilter, setRecommendationTypeFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [crisisLogs, setCrisisLogs] = useState([]);
  const [crisisLoading, setCrisisLoading] = useState(true);
  const [crisisError, setCrisisError] = useState(null);

  const flagSummary = useMemo(() => {
    if (!stats?.flags) {
      return {
        total: 0,
        recent: 0,
        critical: { total: 0, recent: 0 },
        high: { total: 0, recent: 0 },
        medium: { total: 0, recent: 0 },
      };
    }

    return {
      total: stats.flags.total ?? 0,
      recent: stats.flags.recent ?? 0,
      critical: stats.flags.critical ?? { total: 0, recent: 0 },
      high: stats.flags.high ?? { total: 0, recent: 0 },
      medium: stats.flags.medium ?? { total: 0, recent: 0 },
    };
  }, [stats]);

  const pendingRecommendationCount = useMemo(
    () => recommendations.filter((rec) => rec.status === 'pending').length,
    [recommendations]
  );

  const filteredRecommendations = useMemo(
    () =>
      recommendations.filter((rec) => {
        const statusMatch =
          recommendationStatusFilter === 'all' || rec.status === recommendationStatusFilter;
        const typeMatch =
          recommendationTypeFilter === 'all' || rec.type === recommendationTypeFilter;
        return statusMatch && typeMatch;
      }),
    [recommendations, recommendationStatusFilter, recommendationTypeFilter]
  );

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/feedback/stats');
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('You do not have permission to view feedback analytics.');
          }
          throw new Error(`Failed to load feedback stats (${response.status})`);
        }

        const data = await response.json();
        setStats(data);
        setTrendData(data.dailyTrend ?? []);
      } catch (statsError) {
        console.error('Failed to load feedback stats', statsError);
        setError(statsError.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const loadRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);

    try {
      const response = await fetch('/api/admin/feedback/recommendations?status=all');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You do not have permission to view recommendations.');
        }
        throw new Error(`Failed to load recommendations (${response.status})`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations ?? []);
    } catch (recommendationError) {
      console.error('Failed to load feedback recommendations', recommendationError);
      setRecommendationsError(recommendationError.message);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchFeedback() {
      setFeedbackLoading(true);
      setFeedbackError(null);

      try {
        const params = new URLSearchParams();
        if (filters.feedbackType !== 'all') {
          params.set('feedbackType', filters.feedbackType);
        }
        if (filters.tag !== 'all') {
          params.set('tag', filters.tag);
        }

        const queryString = params.toString();
        const response = await fetch(`/api/admin/feedback${queryString ? `?${queryString}` : ''}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('You do not have permission to view feedback records.');
          }
          throw new Error(`Failed to load feedback records (${response.status})`);
        }

        const data = await response.json();
        setFeedbackEntries(data.feedback ?? []);
      } catch (feedbackErr) {
        console.error('Failed to load feedback records', feedbackErr);
        setFeedbackError(feedbackErr.message);
      } finally {
        setFeedbackLoading(false);
      }
    }

    fetchFeedback();
  }, [filters]);

  useEffect(() => {
    async function fetchFlags() {
      setFlagsLoading(true);
      setFlagsError(null);
      try {
        const response = await fetch('/api/admin/feedback/flags');
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('You do not have permission to view flagged responses.');
          }
          throw new Error(`Failed to load flagged responses (${response.status})`);
        }
        const data = await response.json();
        setFlaggedResponses(data.flags ?? []);
      } catch (flagsErr) {
        console.error('Failed to load flagged responses', flagsErr);
        setFlagsError(flagsErr.message);
      } finally {
        setFlagsLoading(false);
      }
    }

    fetchFlags();
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    async function fetchCrisisLogs() {
      setCrisisLoading(true);
      setCrisisError(null);

      try {
        const response = await fetch('/api/admin/feedback/crisis');
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('You do not have permission to view crisis logs.');
          }
          throw new Error(`Failed to load crisis logs (${response.status})`);
        }

        const data = await response.json();
        setCrisisLogs(data.logs ?? []);
      } catch (crisisErr) {
        console.error('Failed to load crisis logs', crisisErr);
        setCrisisError(crisisErr.message);
      } finally {
        setCrisisLoading(false);
      }
    }

    fetchCrisisLogs();
  }, []);

  const handleRecommendationAction = useCallback(
    async (id, status, note = '') => {
      if (!id || !status) return;

      setActionLoadingId(id);

      try {
        const response = await fetch(`/api/admin/feedback/recommendations/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, note }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || `Failed to update recommendation (${response.status})`);
        }

        await loadRecommendations();
      } catch (actionError) {
        console.error('Failed to update recommendation', actionError);
        setRecommendationsError(actionError.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [loadRecommendations]
  );

  const availableTags = useMemo(() => {
    if (!stats?.tags) return [];
    return stats.tags.map(tag => ({
      value: tag.tag,
      label: TAG_LABELS[tag.tag] ?? tag.tag,
      count: tag.count,
    }));
  }, [stats]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
        Recovery Assistant Feedback
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor how the Recovery Assistant is serving the community, review low-rated answers, and spot emerging trends that need a human touch.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Total feedback
                </Typography>
                <AutoGraphIcon color="primary" />
              </Stack>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                {stats?.totals?.totalCount?.toLocaleString() ?? '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.totals?.thumbsDownCount || 0} flagged for review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Positive feedback rate
                </Typography>
                <ThumbUpAltIcon color="success" />
              </Stack>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, color: 'success.main' }}>
                {formatPercentage(stats?.totals?.positiveRate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.totals?.thumbsUpCount || 0} supportive responses logged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Needs review
                </Typography>
                <ThumbDownAltIcon color="error" />
              </Stack>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, color: 'error.main' }}>
                {stats?.totals?.thumbsDownCount?.toLocaleString() ?? '0'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Prioritize these for human-in-the-loop evaluation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              height: '100%',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                30-day feedback trend
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Positive rate: {formatPercentage(stats?.totals?.positiveRate)}
              </Typography>
            </Stack>
            {trendData.length === 0 ? (
              <Skeleton variant="rounded" height={260} />
            ) : (
              <TrendAreaChart data={trendData} />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              height: '100%',
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Flagged response summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {flagSummary.total} responses currently need review, {flagSummary.recent} surfaced in the last 7 days.
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Critical</Typography>
                  <Chip label={flagSummary.critical.total ?? 0} color="error" size="small" />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">High</Typography>
                  <Chip label={flagSummary.high.total ?? 0} color="error" variant="outlined" size="small" />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Medium</Typography>
                  <Chip label={flagSummary.medium.total ?? 0} color="warning" variant="outlined" size="small" />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            Filter feedback
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%" maxWidth={420}>
            <FormControl size="small" fullWidth>
              <InputLabel id="feedback-type-filter">Feedback type</InputLabel>
              <Select
                labelId="feedback-type-filter"
                label="Feedback type"
                value={filters.feedbackType}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, feedbackType: event.target.value }))
                }
              >
                {FEEDBACK_TYPE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="feedback-tag-filter">Tag</InputLabel>
              <Select
                labelId="feedback-tag-filter"
                label="Tag"
                value={filters.tag}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, tag: event.target.value }))
                }
              >
                <MenuItem value="all">All reasons</MenuItem>
                {availableTags.map(tag => (
                  <MenuItem key={tag.value} value={tag.value}>
                    {tag.label} ({tag.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {availableTags.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            {availableTags.map(tag => (
              <Chip
                key={tag.value}
                label={`${tag.label} (${tag.count})`}
                size="small"
                color="primary"
                variant={filters.tag === tag.value ? 'filled' : 'outlined'}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    tag: prev.tag === tag.value ? 'all' : tag.value,
                  }))
                }
              />
            ))}
          </Stack>
        )}
      </Paper>

      <Tabs
        value={activeView}
        onChange={(_event, value) => setActiveView(value)}
        sx={{ mb: 3 }}
      >
        <Tab value="all" label="All Feedback" />
        <Tab
          value="flagged"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Flagged Responses</span>
              <Chip label={flagSummary.total} size="small" color="error" />
            </Stack>
          }
        />
        <Tab
          value="recommendations"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Recommendations</span>
              <Chip label={pendingRecommendationCount} size="small" color="info" />
            </Stack>
          }
        />
        <Tab
          value="crisis"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Crisis Logs</span>
              <Chip label={crisisLogs.length} size="small" color="warning" />
            </Stack>
          }
        />
      </Tabs>

      {activeView === 'all' ? (
        feedbackLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress size={28} />
          </Box>
        ) : feedbackError ? (
          <Alert severity="error">{feedbackError}</Alert>
        ) : feedbackEntries.length === 0 ? (
          <Alert severity="info">
            No feedback entries match the selected filters yet.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            {feedbackEntries.map(entry => (
              <FeedbackEntry key={entry.id} entry={entry} />
            ))}
          </Stack>
        )
      ) : activeView === 'flagged' ? (
        flagsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress size={28} />
          </Box>
        ) : flagsError ? (
          <Alert severity="error">{flagsError}</Alert>
        ) : flaggedResponses.length === 0 ? (
          <Alert severity="info">
            No flagged responses right now. Great job!
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            {flaggedResponses.map(flag => (
              <FlaggedResponseCard key={flag.id} flag={flag} />
            ))}
          </Stack>
        )
      ) : activeView === 'crisis' ? (
        crisisLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress size={28} />
          </Box>
        ) : crisisError ? (
          <Alert severity="error">{crisisError}</Alert>
        ) : crisisLogs.length === 0 ? (
          <Alert severity="info">
            No crisis events recorded yet.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            {crisisLogs.map((log) => (
              <CrisisLogCard key={log.id} log={log} />
            ))}
          </Stack>
        )
      ) : recommendationsLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress size={28} />
        </Box>
      ) : recommendationsError ? (
        <Alert severity="error">{recommendationsError}</Alert>
      ) : (
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Recommendation filters
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%" maxWidth={520}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="recommendation-status-filter">Status</InputLabel>
                  <Select
                    labelId="recommendation-status-filter"
                    label="Status"
                    value={recommendationStatusFilter}
                    onChange={(event) => setRecommendationStatusFilter(event.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="dismissed">Dismissed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="recommendation-type-filter">Type</InputLabel>
                  <Select
                    labelId="recommendation-type-filter"
                    label="Type"
                    value={recommendationTypeFilter}
                    onChange={(event) => setRecommendationTypeFilter(event.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="retrieval">Retrieval</MenuItem>
                    <MenuItem value="prompt">Prompt</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>

          {filteredRecommendations.length === 0 ? (
            <Alert severity="info">
              No recommendations match the selected filters.
            </Alert>
          ) : (
            <Stack spacing={2.5}>
              {filteredRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onAction={handleRecommendationAction}
                  isProcessing={actionLoadingId === recommendation.id}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
}

