'use client';

import React from 'react';
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
 * Ghibli Art Director Agent Visualization
 *
 * Interactive visualization of the art generation agent's architecture using ReactFlow.
 * Shows the supervisor pattern, art generation nodes, and DALL-E integration.
 */

const initialNodes = [
  // Entry point
  {
    id: 'start',
    type: 'input',
    data: { label: '🎨 START\nArt Generation Request' },
    position: { x: 400, y: 50 },
    style: {
      background: '#E91E63',
      color: 'white',
      border: '2px solid #C2185B',
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
      label: '🎯 SUPERVISOR\nOrchestration & Routing\n\nTracks progress\nRoutes to generators\nIterates through items',
    },
    position: { x: 350, y: 180 },
    style: {
      background: '#673AB7',
      color: 'white',
      border: '3px solid #512DA8',
      borderRadius: 12,
      padding: 15,
      fontSize: 11,
      fontWeight: 'bold',
      width: 200,
      textAlign: 'center',
    },
  },

  // Art generation nodes
  {
    id: 'generate_daily_reflection',
    data: {
      label: '📅 Daily Reflection\nDALL-E 3\n\n• Ghibli style prompts\n• Peaceful scenes\n• Hope & serenity\n• 1024x1024',
    },
    position: { x: 50, y: 380 },
    style: {
      background: '#00BCD4',
      color: 'white',
      border: '2px solid #0097A7',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  {
    id: 'generate_step_illustration',
    data: {
      label: '👣 Step Illustration\nDALL-E 3\n\n• Symbolic metaphors\n• Transformative themes\n• Spiritual depth\n• 1024x1024',
    },
    position: { x: 250, y: 380 },
    style: {
      background: '#00BCD4',
      color: 'white',
      border: '2px solid #0097A7',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  {
    id: 'generate_milestone_badge',
    data: {
      label: '🏆 Milestone Badge\nDALL-E 3\n\n• Achievement emblems\n• Celebratory mood\n• Growth symbols\n• 1024x1024',
    },
    position: { x: 450, y: 380 },
    style: {
      background: '#00BCD4',
      color: 'white',
      border: '2px solid #0097A7',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  {
    id: 'generate_seasonal_graphic',
    data: {
      label: '🌸 Seasonal Graphic\nDALL-E 3\n\n• Landscape scenes\n• Seasonal themes\n• Natural beauty\n• 1792x1024 (wide)',
    },
    position: { x: 650, y: 380 },
    style: {
      background: '#00BCD4',
      color: 'white',
      border: '2px solid #0097A7',
      borderRadius: 8,
      padding: 12,
      fontSize: 10,
      width: 160,
    },
  },

  // DALL-E API
  {
    id: 'dalle_api',
    data: {
      label: '🤖 DALL-E 3 API\nOpenAI\n\n• Ghibli style enhancement\n• Image generation\n• Quality control\n• Cost tracking',
    },
    position: { x: 350, y: 580 },
    style: {
      background: '#FF5722',
      color: 'white',
      border: '3px solid #E64A19',
      borderRadius: 12,
      padding: 15,
      fontSize: 11,
      fontWeight: 'bold',
      width: 200,
      textAlign: 'center',
    },
  },

  // MongoDB Storage
  {
    id: 'mongodb',
    data: {
      label: '🗄️ MongoDB\nGeneratedArt Collection\n\nStores:\n• Image URLs\n• Prompts & metadata\n• Style characteristics\n• Costs & timestamps',
    },
    position: { x: 700, y: 650 },
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

  // History tracking
  {
    id: 'history',
    data: {
      label: '📊 ArtGenerationHistory\n\n• Request tracking\n• Success/failure rates\n• Cost analytics\n• Batch processing logs',
    },
    position: { x: 50, y: 650 },
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

  // Output
  {
    id: 'complete',
    type: 'output',
    data: {
      label: '✅ COMPLETE\n\nAll items generated\nSaved to database\nReady for use',
    },
    position: { x: 370, y: 800 },
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
];

const initialEdges = [
  // Start to supervisor
  {
    id: 'e-start-supervisor',
    source: 'start',
    target: 'supervisor',
    animated: true,
    style: { stroke: '#E91E63', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#E91E63' },
  },

  // Supervisor to generators
  {
    id: 'e-supervisor-daily',
    source: 'supervisor',
    target: 'generate_daily_reflection',
    label: 'Route',
    animated: true,
    style: { stroke: '#673AB7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#673AB7' },
  },
  {
    id: 'e-supervisor-step',
    source: 'supervisor',
    target: 'generate_step_illustration',
    label: 'Route',
    animated: true,
    style: { stroke: '#673AB7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#673AB7' },
  },
  {
    id: 'e-supervisor-milestone',
    source: 'supervisor',
    target: 'generate_milestone_badge',
    label: 'Route',
    animated: true,
    style: { stroke: '#673AB7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#673AB7' },
  },
  {
    id: 'e-supervisor-seasonal',
    source: 'supervisor',
    target: 'generate_seasonal_graphic',
    label: 'Route',
    animated: true,
    style: { stroke: '#673AB7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#673AB7' },
  },

  // Generators to DALL-E API
  {
    id: 'e-daily-dalle',
    source: 'generate_daily_reflection',
    target: 'dalle_api',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00BCD4' },
  },
  {
    id: 'e-step-dalle',
    source: 'generate_step_illustration',
    target: 'dalle_api',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00BCD4' },
  },
  {
    id: 'e-milestone-dalle',
    source: 'generate_milestone_badge',
    target: 'dalle_api',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00BCD4' },
  },
  {
    id: 'e-seasonal-dalle',
    source: 'generate_seasonal_graphic',
    target: 'dalle_api',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00BCD4' },
  },

  // DALL-E to MongoDB
  {
    id: 'e-dalle-mongodb',
    source: 'dalle_api',
    target: 'mongodb',
    label: 'Save art',
    animated: true,
    style: { stroke: '#FF5722', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#FF5722' },
  },

  // Generators back to supervisor (feedback loop)
  {
    id: 'e-daily-supervisor',
    source: 'generate_daily_reflection',
    target: 'supervisor',
    sourceHandle: 'top',
    targetHandle: 'left',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },
  {
    id: 'e-step-supervisor',
    source: 'generate_step_illustration',
    target: 'supervisor',
    sourceHandle: 'top',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },
  {
    id: 'e-milestone-supervisor',
    source: 'generate_milestone_badge',
    target: 'supervisor',
    sourceHandle: 'top',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },
  {
    id: 'e-seasonal-supervisor',
    source: 'generate_seasonal_graphic',
    target: 'supervisor',
    sourceHandle: 'top',
    targetHandle: 'right',
    animated: true,
    style: { stroke: '#00BCD4', strokeWidth: 1, strokeDasharray: '5,5' },
    label: 'return',
  },

  // Supervisor to complete
  {
    id: 'e-supervisor-complete',
    source: 'supervisor',
    target: 'complete',
    label: 'All done',
    animated: true,
    style: { stroke: '#4CAF50', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4CAF50' },
  },

  // Complete to history (no source handle needed)
  {
    id: 'e-complete-history',
    source: 'complete',
    target: 'history',
    label: 'Log results',
    animated: true,
    style: { stroke: '#00897B', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00897B' },
  },
];

export default function ArtDirectorVisualization() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Brand Art Director Agent Architecture
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Interactive visualization of the art generation agent. This agent creates brandstyle
        artwork using DALL-E 3 for daily reflections, step illustrations, milestone badges, and seasonal graphics.
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
              if (node.id === 'supervisor') return '#673AB7';
              if (node.id === 'dalle_api') return '#FF5722';
              if (node.id.startsWith('generate_')) return '#00BCD4';
              if (node.id === 'mongodb' || node.id === 'history') return '#00897B';
              if (node.id === 'complete') return '#4CAF50';
              return '#E91E63';
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
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#673AB7' }}>
              🎯 Supervisor Pattern
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Central orchestrator that iterates through generation items and routes to the appropriate
              generator based on art type. Tracks progress and ensures all items are processed.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#00BCD4' }}>
              🎨 Specialized Generators
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Four specialized nodes for different art types: daily reflections (peaceful scenes),
              step illustrations (symbolic), milestone badges (celebratory), and seasonal graphics (landscapes).
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FF5722' }}>
              🤖 DALL-E 3 Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All generators use DALL-E 3 with Ghibli-style prompt enhancement. Prompts are enriched
              with watercolor aesthetics, natural lighting, atmospheric depth, and peaceful mood.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#00897B' }}>
              🗄️ Dual Storage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generated art is stored in GeneratedArt collection with full metadata. Generation requests
              are tracked in ArtGenerationHistory for analytics and cost management.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Execution Flow
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            1. <strong>START</strong> → Supervisor initializes with generation request
            <br />
            2. <strong>Supervisor</strong> → Routes to appropriate generator based on art type
            <br />
            3. <strong>Generator</strong> → Enhances prompt with Ghibli style characteristics
            <br />
            4. <strong>DALL-E 3</strong> → Generates image from enhanced prompt
            <br />
            5. <strong>MongoDB</strong> → Saves artwork with metadata, prompts, costs
            <br />
            6. <strong>Generator</strong> → Returns to Supervisor with results
            <br />
            7. <strong>Supervisor</strong> → Moves to next item (repeat 2-6 for each item)
            <br />
            8. <strong>COMPLETE</strong> → All items processed, saves to ArtGenerationHistory
          </Typography>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#E65100' }}>
            ✨ Brand Style Enhancement
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each prompt is automatically enhanced with Studio Ghibli characteristics including:
            watercolor textures, soft natural lighting, atmospheric perspective, whimsical yet grounded
            elements, peaceful mood, intricate natural details, and color palettes of soft pastels
            with warm earth tones.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
