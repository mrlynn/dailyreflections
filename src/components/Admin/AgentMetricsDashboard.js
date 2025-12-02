'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Agent Metrics Dashboard
 *
 * Comprehensive monitoring dashboard for the Volunteer Support Agent system
 *
 * Features:
 * - Agent execution statistics
 * - Performance metrics (processing times, success rates)
 * - Crisis detection tracking
 * - Resource usage monitoring
 * - Execution path analysis
 */
export default function AgentMetricsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agent-metrics?range=${timeRange}`);

      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error Loading Metrics</AlertTitle>
        {error}
      </Alert>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">Agent Metrics Dashboard</Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Time Range">
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{metrics?.totalExecutions || 0}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">{metrics?.crisisAlertsCount || 0}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Crisis Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">
                  {metrics?.avgProcessingTime ? `${metrics.avgProcessingTime}ms` : 'N/A'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Avg Processing Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">
                  {metrics?.successRate ? `${(metrics.successRate * 100).toFixed(1)}%` : 'N/A'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Execution Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Executions Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.executionTimeline || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="executions" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="crises" stroke="#ff4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Execution Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.agentDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(metrics?.agentDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Times by Agent */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Processing Time by Agent
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.processingTimesByAgent || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agentName" />
                  <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTime" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Analyses Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Agent Analyses
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Conversation ID</TableCell>
                  <TableCell>Execution Path</TableCell>
                  <TableCell>Processing Time</TableCell>
                  <TableCell>Crisis Detected</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(metrics?.recentAnalyses || []).map((analysis, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {new Date(analysis.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {analysis.conversationId.substring(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {analysis.agentExecutionPath.map((agent, i) => (
                          <Chip key={i} label={agent} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{analysis.processingTimeMs}ms</TableCell>
                    <TableCell>
                      {analysis.analysis?.crisisDetection?.isCrisis ? (
                        <Chip
                          label={analysis.analysis.crisisDetection.riskLevel}
                          size="small"
                          color="error"
                          icon={<WarningIcon />}
                        />
                      ) : (
                        <Chip label="No" size="small" color="success" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Crisis Alerts */}
      {metrics?.unresolvedCrises?.length > 0 && (
        <Card sx={{ mt: 3, borderColor: 'error.main', borderWidth: 2, borderStyle: 'solid' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6" color="error">
                Unresolved Crisis Alerts
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Detected At</TableCell>
                    <TableCell>Conversation ID</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Indicators</TableCell>
                    <TableCell>Recommended Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.unresolvedCrises.map((crisis, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {new Date(crisis.detectedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {crisis.conversationId.substring(0, 12)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={crisis.riskLevel}
                          size="small"
                          color={crisis.riskLevel === 'critical' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        {crisis.indicators.join(', ')}
                      </TableCell>
                      <TableCell>
                        {crisis.recommendedAction}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
