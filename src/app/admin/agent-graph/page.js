'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AgentGraphVisualization from '@/components/Admin/AgentGraphVisualization';

/**
 * Admin page for visualizing the agentic AI system
 * Shows the graph structure and execution flow
 */
export default function AgentGraphPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('static'); // 'static' or 'demo'
  const [demoScenario, setDemoScenario] = useState('crisis');
  const [executionPath, setExecutionPath] = useState([]);
  const [streaming, setStreaming] = useState(false);

  // Demo execution paths for different scenarios
  const demoScenarios = {
    crisis: {
      name: 'Crisis Detection',
      description: 'User mentions suicidal thoughts - crisis agent detects and immediately completes',
      path: ['supervisor', 'crisis_check'],
    },
    resources: {
      name: 'Resource Search',
      description: 'User asks about Step 4 - system searches Big Book and provides resources',
      path: ['supervisor', 'crisis_check', 'supervisor', 'resource_search', 'supervisor'],
    },
    coaching: {
      name: 'Response Coaching',
      description: 'Volunteer writes draft response - system provides coaching feedback',
      path: ['supervisor', 'crisis_check', 'supervisor', 'coach_response', 'supervisor'],
    },
    analysis: {
      name: 'Conversation Analysis',
      description: 'Long conversation - system analyzes patterns and sentiment',
      path: ['supervisor', 'crisis_check', 'supervisor', 'analyze_conversation', 'supervisor'],
    },
    triage: {
      name: 'Complex Triage',
      description: 'New user with urgent need - system triages and recommends priority',
      path: ['supervisor', 'crisis_check', 'supervisor', 'triage', 'supervisor'],
    },
    full: {
      name: 'Full Execution',
      description: 'Complete flow through all agents',
      path: [
        'supervisor',
        'crisis_check',
        'supervisor',
        'resource_search',
        'supervisor',
        'coach_response',
        'supervisor',
        'analyze_conversation',
        'supervisor',
        'triage',
        'supervisor',
      ],
    },
  };

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check for admin role
    if (!session.user.roles?.includes('admin') && !session.user.isAdmin) {
      setError('Unauthorized - Admin role required');
      setTimeout(() => router.push('/'), 3000);
    }
  }, [session, status, router]);

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      if (newMode === 'static') {
        setExecutionPath([]);
        setStreaming(false);
      }
    }
  };

  // Handle demo scenario change
  const handleScenarioChange = (event) => {
    setDemoScenario(event.target.value);
    setExecutionPath([]);
    setStreaming(false);
  };

  // Run demo execution
  const runDemo = () => {
    const scenario = demoScenarios[demoScenario];
    if (!scenario) return;

    setExecutionPath([]);
    setStreaming(true);

    // Animate execution path step by step
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < scenario.path.length) {
        setExecutionPath((prev) => [...prev, scenario.path[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setStreaming(false);
      }
    }, 800); // 800ms between steps
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Agentic AI System Visualization
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Interactive visualization of the volunteer support agent system built with LangGraph.
          This shows all agent nodes, their connections, and execution flow.
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
          >
            <ToggleButton value="static" aria-label="static view">
              Static View
            </ToggleButton>
            <ToggleButton value="demo" aria-label="demo execution">
              Demo Execution
            </ToggleButton>
          </ToggleButtonGroup>

          {viewMode === 'demo' && (
            <>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="scenario-label">Scenario</InputLabel>
                <Select
                  labelId="scenario-label"
                  value={demoScenario}
                  label="Scenario"
                  onChange={handleScenarioChange}
                >
                  {Object.entries(demoScenarios).map(([key, scenario]) => (
                    <MenuItem key={key} value={key}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={runDemo}
                disabled={streaming}
              >
                Run Demo
              </Button>

              {demoScenarios[demoScenario] && (
                <Typography variant="body2" color="text.secondary" sx={{ flexBasis: '100%', mt: 1 }}>
                  {demoScenarios[demoScenario].description}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Paper>

      <Paper sx={{ height: 'calc(100vh - 300px)', minHeight: 600 }}>
        <AgentGraphVisualization
          executionPath={executionPath}
          streaming={streaming}
        />
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          About the System
        </Typography>
        <Typography variant="body2" paragraph>
          This agentic AI system uses a supervisor pattern with specialized agents:
        </Typography>
        <Box component="ul" sx={{ mt: 1 }}>
          <li>
            <strong>Supervisor:</strong> Central coordinator that analyzes state and routes to appropriate agents
          </li>
          <li>
            <strong>Crisis Detection:</strong> Always runs first to detect suicide risk or severe distress
          </li>
          <li>
            <strong>Resource Recommendation:</strong> Searches AA literature (Big Book, Daily Reflections) for relevant resources
          </li>
          <li>
            <strong>Response Coach:</strong> Analyzes volunteer draft responses and provides improvement suggestions
          </li>
          <li>
            <strong>Conversation Analyst:</strong> Extracts topics, analyzes sentiment, and summarizes conversations
          </li>
          <li>
            <strong>Triage:</strong> Calculates urgency scores and recommends priority levels
          </li>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          For detailed technical documentation, see{' '}
          <code>/docs/AGENTIC_AI_TECHNICAL_ARCHITECTURE.md</code>
        </Typography>
      </Paper>
    </Container>
  );
}
