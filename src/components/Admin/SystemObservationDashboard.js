'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import ObservationAgentVisualization from './ObservationAgentVisualization';

/**
 * System Observation Dashboard
 *
 * Displays insights and metrics from the System Observation Agent
 */
export default function SystemObservationDashboard() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [observation, setObservation] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Load latest observation on mount
  useEffect(() => {
    loadLatestObservation();
  }, []);

  async function loadLatestObservation() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/agents/observation?latest=true');

      if (!response.ok) {
        throw new Error(`Failed to load observation: ${response.status}`);
      }

      const data = await response.json();
      setObservation(data.observation);
    } catch (err) {
      console.error('Error loading observation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runNewObservation() {
    try {
      setRunning(true);
      setError(null);

      const response = await fetch('/api/admin/agents/observation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observationType: 'on-demand',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to run observation: ${response.status}`);
      }

      const data = await response.json();

      // Reload to show new observation
      await loadLatestObservation();
    } catch (err) {
      console.error('Error running observation:', err);
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!observation) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          No observations yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Run your first platform observation to get insights
        </Typography>
        <Button
          variant="contained"
          startIcon={running ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={runNewObservation}
          disabled={running}
        >
          {running ? 'Running Observation...' : 'Run First Observation'}
        </Button>
      </Box>
    );
  }

  const insights = observation.insights || [];
  const alerts = observation.alerts || [];
  const metrics = observation.volunteer_metrics || {};
  const meetingData = observation.meeting_attendance || {};
  const journeyData = observation.journey_analytics || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            System Observation Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last run: {new Date(observation.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={running ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={runNewObservation}
          disabled={running}
        >
          {running ? 'Running...' : 'Run New Observation'}
        </Button>
      </Box>

      {/* Agent Architecture Visualization */}
      <ObservationAgentVisualization />

      {/* Alert Banner */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>{alerts.filter(a => !a.acknowledged).length} unacknowledged alerts</strong>
          {' '}require your attention
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Active Volunteers"
            value={metrics.total_active_volunteers || 0}
            subtitle={`${metrics.volunteers_online_now || 0} online now`}
            icon={<CheckCircleIcon fontSize="large" color="success" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Avg Response Time"
            value={`${(metrics.average_response_time_minutes || 0).toFixed(1)}m`}
            subtitle="volunteer response"
            icon={<TrendingUpIcon fontSize="large" color="primary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Daily Active Users"
            value={journeyData.engagement_trends?.daily_active_users || 0}
            subtitle="engaged today"
            icon={<InsightsIcon fontSize="large" color="info" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Meeting Hotspots"
            value={meetingData.hotspots?.length || 0}
            subtitle="need facilitators"
            icon={<WarningIcon fontSize="large" color="warning" />}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Insights" />
          <Tab label="Alerts" />
          <Tab label="Metrics" />
          <Tab label="Report" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && <InsightsTab insights={insights} />}
      {tabValue === 1 && <AlertsTab alerts={alerts} />}
      {tabValue === 2 && <MetricsTab observation={observation} />}
      {tabValue === 3 && <ReportTab observation={observation} />}
    </Box>
  );
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Insights Tab
function InsightsTab({ insights }) {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedInsights = [...insights].sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <Grid container spacing={2}>
      {sortedInsights.map((insight, index) => (
        <Grid item xs={12} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip
                      label={insight.priority}
                      size="small"
                      color={
                        insight.priority === 'urgent' ? 'error' :
                        insight.priority === 'high' ? 'warning' :
                        insight.priority === 'medium' ? 'info' : 'default'
                      }
                    />
                    <Chip
                      label={insight.insight_type}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={insight.category}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {insight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {insight.description}
                  </Typography>
                  {insight.suggested_actions && insight.suggested_actions.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Recommended Actions:
                      </Typography>
                      <List dense>
                        {insight.suggested_actions.map((action, i) => (
                          <ListItem key={i}>
                            <ListItemText primary={`• ${action}`} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {insights.length === 0 && (
        <Grid item xs={12}>
          <Alert severity="info">No insights generated yet</Alert>
        </Grid>
      )}
    </Grid>
  );
}

// Alerts Tab
function AlertsTab({ alerts }) {
  return (
    <List>
      {alerts.map((alert, index) => (
        <Paper key={index} sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip
                  label={alert.severity}
                  size="small"
                  color={
                    alert.severity === 'critical' ? 'error' :
                    alert.severity === 'high' ? 'warning' : 'default'
                  }
                />
                {alert.acknowledged && (
                  <Chip label="Acknowledged" size="small" color="success" />
                )}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {alert.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recommended: {alert.recommended_action}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
      {alerts.length === 0 && (
        <Alert severity="success">No alerts - system is healthy!</Alert>
      )}
    </List>
  );
}

// Metrics Tab
function MetricsTab({ observation }) {
  const { volunteer_metrics, meeting_attendance, support_hotspots, journey_analytics } = observation;

  return (
    <Grid container spacing={3}>
      {/* Volunteer Metrics */}
      {volunteer_metrics && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Volunteer Program</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Load Distribution</Typography>
                {volunteer_metrics.load_distribution && (
                  <Box sx={{ mt: 1 }}>
                    <MetricBar label="Optimal" value={volunteer_metrics.load_distribution.optimal} color="success" />
                    <MetricBar label="Underutilized" value={volunteer_metrics.load_distribution.underutilized} color="info" />
                    <MetricBar label="High" value={volunteer_metrics.load_distribution.high} color="warning" />
                    <MetricBar label="Critical" value={volunteer_metrics.load_distribution.critical} color="error" />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Busiest Hours</Typography>
                {volunteer_metrics.busiest_hours?.slice(0, 5).map((hour, i) => (
                  <Typography key={i} variant="body2">
                    {hour.hour}:00 - {hour.average_conversations} conversations
                  </Typography>
                ))}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}

      {/* Meeting Data */}
      {meeting_attendance && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Meeting Program</Typography>
            <Typography variant="body2">
              {meeting_attendance.total_meetings_scheduled} meetings scheduled,
              {meeting_attendance.hotspots?.length || 0} hotspots identified
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}

function MetricBar({ label, value, color }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="caption">{value.toFixed(1)}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={value} color={color} />
    </Box>
  );
}

// Report Tab
function ReportTab({ observation }) {
  if (!observation.summary_report) {
    return <Alert severity="info">No summary report available</Alert>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }}>
        {observation.summary_report}
      </pre>
    </Paper>
  );
}
