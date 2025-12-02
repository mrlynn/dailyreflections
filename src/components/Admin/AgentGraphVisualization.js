'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Button,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';

/**
 * AgentGraphVisualization Component
 *
 * Interactive visualization of the LangGraph agent system using ReactFlow
 * Shows nodes (agents), edges (routing), tools, and real-time execution
 */
export default function AgentGraphVisualization({ executionPath = [], streaming = false }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Animate execution path
  useEffect(() => {
    if (!executionPath || executionPath.length === 0) {
      resetNodeStyles();
      return;
    }

    // Reset all nodes first
    resetNodeStyles();

    // Highlight nodes in execution path
    setNodes((nds) =>
      nds.map((node) => {
        const stepIndex = executionPath.indexOf(node.id);

        if (stepIndex !== -1) {
          return {
            ...node,
            data: {
              ...node.data,
              executed: true,
              executionOrder: stepIndex + 1,
            },
            style: {
              ...node.style,
              backgroundColor: getNodeColor(node.id, stepIndex, executionPath.length),
              border: stepIndex === currentStep ? '3px solid #ff6b35' : '2px solid #4ecdc4',
              boxShadow: stepIndex === currentStep ? '0 0 20px rgba(255, 107, 53, 0.5)' : 'none',
            },
          };
        }
        return node;
      })
    );

    // Highlight active edges
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceIndex = executionPath.indexOf(edge.source);
        const targetIndex = executionPath.indexOf(edge.target);

        // Edge is active if both source and target are in path and consecutive
        const isActive = sourceIndex !== -1 &&
                        targetIndex === sourceIndex + 1 &&
                        sourceIndex < currentStep;

        return {
          ...edge,
          animated: isActive,
          style: {
            ...edge.style,
            stroke: isActive ? '#4ecdc4' : '#b1b1b7',
            strokeWidth: isActive ? 3 : 2,
          },
        };
      })
    );
  }, [executionPath, currentStep, setNodes, setEdges]);

  // Auto-advance through execution steps when streaming
  useEffect(() => {
    if (streaming && executionPath.length > 0 && currentStep < executionPath.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000); // 1 second per step

      return () => clearTimeout(timer);
    }
  }, [streaming, executionPath, currentStep]);

  const resetNodeStyles = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          executed: false,
          executionOrder: null,
        },
        style: {
          ...node.style,
          backgroundColor: getDefaultNodeColor(node.id),
          border: '2px solid #ddd',
          boxShadow: 'none',
        },
      }))
    );

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          stroke: '#b1b1b7',
          strokeWidth: 2,
        },
      }))
    );
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const replayExecution = () => {
    setCurrentStep(0);
    setTimeout(() => {
      setCurrentStep(1);
    }, 100);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Main Graph Canvas */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.executed) return '#4ecdc4';
              return getDefaultNodeColor(node.id);
            }}
            nodeStrokeWidth={3}
          />
          <Background variant="dots" gap={12} size={1} />

          <Panel position="top-left">
            <Paper sx={{ p: 2, maxWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Volunteer Support Agent
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Multi-agent system with supervisor pattern
              </Typography>

              {executionPath.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Execution Progress: {currentStep + 1} / {executionPath.length}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayArrowIcon />}
                      onClick={replayExecution}
                    >
                      Replay
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Panel>

          <Panel position="top-right">
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Legend
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#7b68ee', border: '2px solid #ddd', borderRadius: 1 }} />
                  <Typography variant="caption">Supervisor</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#ff6b6b', border: '2px solid #ddd', borderRadius: 1 }} />
                  <Typography variant="caption">Crisis Detection</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#4ecdc4', border: '2px solid #ddd', borderRadius: 1 }} />
                  <Typography variant="caption">Resource Search</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#ffe66d', border: '2px solid #ddd', borderRadius: 1 }} />
                  <Typography variant="caption">Response Coach</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#a8e6cf', border: '2px solid #ddd', borderRadius: 1 }} />
                  <Typography variant="caption">Conversation Analyst</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#ffaaa5', border: '2px solid #ddd', borderRadius: 1 }} />
                  <Typography variant="caption">Triage</Typography>
                </Box>
              </Box>
            </Paper>
          </Panel>
        </ReactFlow>
      </Box>

      {/* Sidebar - Node Details */}
      <Box
        sx={{
          width: 350,
          borderLeft: 1,
          borderColor: 'divider',
          p: 2,
          overflowY: 'auto',
          backgroundColor: 'background.paper',
        }}
      >
        {selectedNode ? (
          <NodeDetails node={selectedNode} />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              Click on a node to see details
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * Node Details Panel
 */
function NodeDetails({ node }) {
  const agentInfo = getAgentInfo(node.id);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">{agentInfo.name}</Typography>
        </Box>

        {node.data?.executionOrder && (
          <Chip
            label={`Execution Order: #${node.data.executionOrder}`}
            size="small"
            color="primary"
            sx={{ mb: 2 }}
          />
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          {agentInfo.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          <BuildIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
          Tools Used:
        </Typography>
        <List dense>
          {agentInfo.tools.map((tool, idx) => (
            <ListItem key={idx} disablePadding>
              <ListItemText
                primary={tool.name}
                secondary={tool.description}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Routing Logic:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {agentInfo.routing}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Model Used:
        </Typography>
        <Chip label={agentInfo.model} size="small" />
      </CardContent>
    </Card>
  );
}

// Initial nodes configuration
const initialNodes = [
  {
    id: 'start',
    type: 'input',
    data: { label: 'START' },
    position: { x: 400, y: 0 },
    style: {
      backgroundColor: '#95e1d3',
      padding: 10,
      borderRadius: 8,
      border: '2px solid #ddd',
      fontWeight: 'bold',
    },
  },
  {
    id: 'supervisor',
    data: { label: 'Supervisor\n(Coordinator)' },
    position: { x: 350, y: 100 },
    style: {
      backgroundColor: '#7b68ee',
      color: 'white',
      padding: 15,
      borderRadius: 8,
      border: '2px solid #ddd',
      fontWeight: 'bold',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  },
  {
    id: 'crisis_check',
    data: { label: 'Crisis Detection\n(Safety First)' },
    position: { x: 50, y: 250 },
    style: {
      backgroundColor: '#ff6b6b',
      color: 'white',
      padding: 15,
      borderRadius: 8,
      border: '2px solid #ddd',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  },
  {
    id: 'resource_search',
    data: { label: 'Resource Search\n(AA Literature)' },
    position: { x: 200, y: 250 },
    style: {
      backgroundColor: '#4ecdc4',
      color: 'white',
      padding: 15,
      borderRadius: 8,
      border: '2px solid #ddd',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  },
  {
    id: 'coach_response',
    data: { label: 'Response Coach\n(Quality Check)' },
    position: { x: 350, y: 250 },
    style: {
      backgroundColor: '#ffe66d',
      color: '#333',
      padding: 15,
      borderRadius: 8,
      border: '2px solid #ddd',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  },
  {
    id: 'analyze_conversation',
    data: { label: 'Conversation Analyst\n(Insights)' },
    position: { x: 500, y: 250 },
    style: {
      backgroundColor: '#a8e6cf',
      color: '#333',
      padding: 15,
      borderRadius: 8,
      border: '2px solid #ddd',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  },
  {
    id: 'triage',
    data: { label: 'Triage\n(Priority)' },
    position: { x: 650, y: 250 },
    style: {
      backgroundColor: '#ffaaa5',
      color: '#333',
      padding: 15,
      borderRadius: 8,
      border: '2px solid #ddd',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  },
  {
    id: 'end',
    type: 'output',
    data: { label: 'END' },
    position: { x: 400, y: 400 },
    style: {
      backgroundColor: '#f38181',
      color: 'white',
      padding: 10,
      borderRadius: 8,
      border: '2px solid #ddd',
      fontWeight: 'bold',
    },
  },
];

// Initial edges configuration
const initialEdges = [
  // Start to supervisor
  {
    id: 'start-supervisor',
    source: 'start',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
  },

  // Supervisor to agents (conditional)
  {
    id: 'supervisor-crisis',
    source: 'supervisor',
    target: 'crisis_check',
    label: 'crisis_check',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'supervisor-resource',
    source: 'supervisor',
    target: 'resource_search',
    label: 'resource_search',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'supervisor-coach',
    source: 'supervisor',
    target: 'coach_response',
    label: 'coach_response',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'supervisor-analyze',
    source: 'supervisor',
    target: 'analyze_conversation',
    label: 'analyze_conversation',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'supervisor-triage',
    source: 'supervisor',
    target: 'triage',
    label: 'triage',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Agents back to supervisor
  {
    id: 'crisis-supervisor',
    source: 'crisis_check',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'resource-supervisor',
    source: 'resource_search',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'coach-supervisor',
    source: 'coach_response',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'analyze-supervisor',
    source: 'analyze_conversation',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'triage-supervisor',
    source: 'triage',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Supervisor to end
  {
    id: 'supervisor-end',
    source: 'supervisor',
    target: 'end',
    label: 'complete',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

// Helper functions
function getNodeColor(nodeId, stepIndex, totalSteps) {
  // Gradient from start (blue) to current (orange) to end (green)
  const progress = stepIndex / totalSteps;

  if (progress < 0.33) {
    return '#4ecdc4'; // Teal for early steps
  } else if (progress < 0.66) {
    return '#ffe66d'; // Yellow for middle steps
  } else {
    return '#95e1d3'; // Light green for final steps
  }
}

function getDefaultNodeColor(nodeId) {
  const colors = {
    start: '#95e1d3',
    supervisor: '#7b68ee',
    crisis_check: '#ff6b6b',
    resource_search: '#4ecdc4',
    coach_response: '#ffe66d',
    analyze_conversation: '#a8e6cf',
    triage: '#ffaaa5',
    end: '#f38181',
  };
  return colors[nodeId] || '#ddd';
}

function getAgentInfo(nodeId) {
  const agentData = {
    supervisor: {
      name: 'Supervisor Agent',
      description: 'Coordinates the multi-agent workflow by analyzing state and routing to appropriate specialized agents. Uses GPT-4o for decision making.',
      tools: [
        { name: 'State Analyzer', description: 'Analyzes current state to determine next action' },
        { name: 'Routing Validator', description: 'Enforces routing rules and safety constraints' },
      ],
      routing: 'Conditional routing based on state analysis. Always routes to crisis_check first if new message present.',
      model: 'GPT-4o',
    },
    crisis_check: {
      name: 'Crisis Detection Agent',
      description: 'Detects suicide risk, self-harm, and severe distress. ALWAYS runs first for safety. Uses deterministic LLM (temperature=0) for consistency.',
      tools: [
        { name: 'Crisis Assessment Tool', description: 'Analyzes messages for crisis indicators' },
        { name: 'Emergency Resources Tool', description: 'Provides crisis hotlines (988, etc.)' },
      ],
      routing: 'If critical/high risk detected → complete (immediate alert). Otherwise → resource_search.',
      model: 'GPT-4o',
    },
    resource_search: {
      name: 'Resource Recommendation Agent',
      description: 'Searches AA literature using semantic similarity to find relevant passages from the Big Book and Daily Reflections.',
      tools: [
        { name: 'Search Big Book Tool', description: 'Vector search in AA Big Book' },
        { name: 'Find Reflection Tool', description: 'Searches Daily Reflections by topic' },
        { name: 'Search Literature Tool', description: 'General AA literature search' },
      ],
      routing: 'If volunteer has draft → coach_response. Otherwise → analyze_conversation.',
      model: 'GPT-4o',
    },
    coach_response: {
      name: 'Response Coach Agent',
      description: 'Evaluates volunteer draft responses for empathy, quality, and alignment with AA principles. Provides constructive feedback.',
      tools: [
        { name: 'Analyze Response Quality Tool', description: 'Scores empathy (1-10) and quality (1-10)' },
      ],
      routing: 'Always routes to → analyze_conversation.',
      model: 'GPT-4o',
    },
    analyze_conversation: {
      name: 'Conversation Analyst Agent',
      description: 'Analyzes emotional sentiment, extracts topics, determines conversation phase. Uses GPT-4o-mini for cost optimization.',
      tools: [
        { name: 'Sentiment Analysis Tool', description: 'Detects emotional state' },
        { name: 'Topic Extraction Tool', description: 'Extracts key themes and concerns' },
        { name: 'Generate Summary Tool', description: 'Creates conversation summary' },
      ],
      routing: 'Always routes to → complete.',
      model: 'GPT-4o-mini',
    },
    triage: {
      name: 'Triage Agent',
      description: 'Prioritizes incoming support requests based on crisis indicators, wait time, and urgency keywords.',
      tools: [
        { name: 'Calculate Urgency Tool', description: 'Scores request urgency (urgent/high/medium/low)' },
      ],
      routing: 'Always routes to → complete.',
      model: 'GPT-4o-mini',
    },
    start: {
      name: 'START',
      description: 'Entry point for the agent workflow. Initial state is created here.',
      tools: [],
      routing: 'Always routes to → supervisor.',
      model: 'N/A',
    },
    end: {
      name: 'END',
      description: 'Exit point for the agent workflow. Final state with all agent results is returned.',
      tools: [],
      routing: 'No routing - workflow complete.',
      model: 'N/A',
    },
  };

  return agentData[nodeId] || {
    name: 'Unknown Node',
    description: 'No description available',
    tools: [],
    routing: 'Unknown',
    model: 'Unknown',
  };
}
