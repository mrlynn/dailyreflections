'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography } from '@mui/material';

/**
 * System Observation Agent Visualization
 *
 * Interactive visualization of the observation agent's architecture using ReactFlow.
 * Shows the supervisor pattern, data collection nodes, and insights generation flow.
 */

// Define the nodes for the observation agent graph
const initialNodes = [
  // Entry point
  {
    id: 'start',
    type: 'input',
    data: { label: '🚀 START\nObservation Run' },
    position: { x: 400, y: 50 },
    style: {
      background: '#4CAF50',
      color: 'white',
      border: '2px solid #2E7D32',
      borderRadius: 8,
      padding: 10,
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  },

  // Supervisor (central hub)
  {
    id: 'supervisor',
    data: {
      label: '🎯 SUPERVISOR\nOrchestration & Routing\n\nDecides which data to collect next\nTracks completion status',
    },
    position: { x: 350, y: 180 },
    style: {
      background: '#2196F3',
      color: 'white',
      border: '3px solid #1565C0',
      borderRadius: 12,
      padding: 15,
      fontSize: 11,
      fontWeight: 'bold',
      width: 200,
      textAlign: 'center',
    },
  },

  // Data collection nodes
  {
    id: 'collect_volunteer_metrics',
    data: {
      label: '👥 Volunteer Metrics\n\n• Active volunteers\n• Response times\n• Load distribution\n• Capacity alerts',
    },
    position: { x: 50, y: 380 },
    style: {
      background: '#FF9800',
      color: 'white',
      border: '2px solid #E65100',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  {
    id: 'collect_meeting_data',
    data: {
      label: '📅 Meeting Data\n\n• Scheduled meetings\n• Attendance trends\n• Hotspot identification\n• Peak times',
    },
    position: { x: 250, y: 380 },
    style: {
      background: '#FF9800',
      color: 'white',
      border: '2px solid #E65100',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  {
    id: 'collect_support_data',
    data: {
      label: '🔥 Support Hotspots\n\n• Coverage gaps\n• High-demand topics\n• Time-based demand\n• Recommendations',
    },
    position: { x: 450, y: 380 },
    style: {
      background: '#FF9800',
      color: 'white',
      border: '2px solid #E65100',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  {
    id: 'collect_journey_data',
    data: {
      label: '🌱 Journey Analytics\n\n• User engagement\n• Feature usage\n• Retention metrics\n• Milestones',
    },
    position: { x: 650, y: 380 },
    style: {
      background: '#FF9800',
      color: 'white',
      border: '2px solid #E65100',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  // Insights generation
  {
    id: 'generate_insights',
    data: {
      label: '🧠 INSIGHTS GENERATOR\n(GPT-4 Powered)\n\n• Analyzes all metrics\n• Identifies patterns\n• Generates recommendations\n• Creates alerts\n• Produces markdown report',
    },
    position: { x: 300, y: 580 },
    style: {
      background: '#9C27B0',
      color: 'white',
      border: '3px solid #6A1B9A',
      borderRadius: 12,
      padding: 15,
      fontSize: 11,
      fontWeight: 'bold',
      width: 250,
      textAlign: 'center',
    },
  },

  // Output
  {
    id: 'complete',
    type: 'output',
    data: {
      label: '✅ COMPLETE\n\nSaved to MongoDB\nReady for admin review',
    },
    position: { x: 370, y: 760 },
    style: {
      background: '#4CAF50',
      color: 'white',
      border: '2px solid #2E7D32',
      borderRadius: 8,
      padding: 12,
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  },

  // MongoDB Storage
  {
    id: 'mongodb',
    data: {
      label: '🗄️ MongoDB\nSystemObservation Collection\n\nStores:\n• All metrics\n• Insights & alerts\n• Execution path\n• Timestamps',
    },
    position: { x: 700, y: 700 },
    style: {
      background: '#00897B',
      color: 'white',
      border: '2px solid #00695C',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 180,
    },
  },
];

// Define the edges (connections between nodes)
const initialEdges = [
  // Start to supervisor
  {
    id: 'e-start-supervisor',
    source: 'start',
    target: 'supervisor',
    animated: true,
    style: { stroke: '#4CAF50', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4CAF50' },
  },

  // Supervisor to data collectors
  {
    id: 'e-supervisor-volunteer',
    source: 'supervisor',
    target: 'collect_volunteer_metrics',
    label: '1️⃣ First',
    animated: true,
    style: { stroke: '#2196F3', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2196F3' },
  },
  {
    id: 'e-supervisor-meeting',
    source: 'supervisor',
    target: 'collect_meeting_data',
    label: '2️⃣',
    animated: true,
    style: { stroke: '#2196F3', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2196F3' },
  },
  {
    id: 'e-supervisor-support',
    source: 'supervisor',
    target: 'collect_support_data',
    label: '3️⃣',
    animated: true,
    style: { stroke: '#2196F3', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2196F3' },
  },
  {
    id: 'e-supervisor-journey',
    source: 'supervisor',
    target: 'collect_journey_data',
    label: '4️⃣',
    animated: true,
    style: { stroke: '#2196F3', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2196F3' },
  },

  // Data collectors back to supervisor (feedback loop)
  {
    id: 'e-volunteer-supervisor',
    source: 'collect_volunteer_metrics',
    target: 'supervisor',
    sourceHandle: 'right',
    targetHandle: 'left',
    animated: true,
    style: { stroke: '#FF9800', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },
  {
    id: 'e-meeting-supervisor',
    source: 'collect_meeting_data',
    target: 'supervisor',
    animated: true,
    style: { stroke: '#FF9800', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },
  {
    id: 'e-support-supervisor',
    source: 'collect_support_data',
    target: 'supervisor',
    sourceHandle: 'left',
    targetHandle: 'right',
    animated: true,
    style: { stroke: '#FF9800', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },
  {
    id: 'e-journey-supervisor',
    source: 'collect_journey_data',
    target: 'supervisor',
    sourceHandle: 'left',
    targetHandle: 'right',
    animated: true,
    style: { stroke: '#FF9800', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },

  // Supervisor to insights generator (after all data collected)
  {
    id: 'e-supervisor-insights',
    source: 'supervisor',
    target: 'generate_insights',
    label: '5️⃣ All data ready',
    animated: true,
    style: { stroke: '#9C27B0', strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9C27B0' },
  },

  // Insights back to supervisor
  {
    id: 'e-insights-supervisor',
    source: 'generate_insights',
    target: 'supervisor',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    animated: true,
    style: { stroke: '#9C27B0', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },

  // Supervisor to complete
  {
    id: 'e-supervisor-complete',
    source: 'supervisor',
    target: 'complete',
    label: '6️⃣ Done',
    animated: true,
    style: { stroke: '#4CAF50', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4CAF50' },
  },

  // Complete to MongoDB
  {
    id: 'e-complete-mongodb',
    source: 'complete',
    target: 'mongodb',
    label: 'persist',
    animated: true,
    style: { stroke: '#00897B', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00897B' },
  },
];

export default function ObservationAgentVisualization() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        System Observation Agent Architecture
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Interactive visualization of the scheduled observation agent. This agent runs on-demand or via cron
        to analyze platform health and generate strategic insights for administrators.
      </Typography>

      <Box sx={{ height: 900, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.id === 'supervisor') return '#2196F3';
              if (node.id === 'generate_insights') return '#9C27B0';
              if (node.id.startsWith('collect_')) return '#FF9800';
              if (node.id === 'mongodb') return '#00897B';
              return '#4CAF50';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Key Concepts
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2196F3' }}>
              🎯 Supervisor Pattern
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Central orchestrator that routes to specialized data collectors based on what's been collected.
              Tracks completion status and ensures all metrics are gathered before analysis.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FF9800' }}>
              📊 Data Collectors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Specialized nodes that query MongoDB for specific metrics (volunteers, meetings, support, engagement).
              Each returns to supervisor after collecting its data.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#9C27B0' }}>
              🧠 GPT-4 Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              After all data is collected, GPT-4 analyzes patterns and generates strategic insights,
              recommendations, and alerts for administrators.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#00897B' }}>
              🗄️ MongoDB Persistence
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Results are stored in the SystemObservation collection for historical tracking,
              trend analysis, and administrative review.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Execution Flow
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            1. <strong>START</strong> → Supervisor initializes observation
            <br />
            2. <strong>Supervisor</strong> → Routes to first data collector (Volunteer Metrics)
            <br />
            3. <strong>Data Collector</strong> → Queries MongoDB, returns to Supervisor
            <br />
            4. <strong>Supervisor</strong> → Routes to next collector (repeats for all 4 collectors)
            <br />
            5. <strong>Supervisor</strong> → Once all data collected, routes to Insights Generator
            <br />
            6. <strong>GPT-4</strong> → Analyzes metrics, generates insights/alerts/report
            <br />
            7. <strong>Supervisor</strong> → Marks as complete
            <br />
            8. <strong>COMPLETE</strong> → Saves full result to MongoDB
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
