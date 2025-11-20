'use client';

import { Box, ButtonGroup, IconButton, Paper, Slider, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useState } from 'react';

/**
 * A floating zoom control for the Big Book reader
 *
 * @param {object} props
 * @param {number} props.zoomLevel - Current zoom level (1 = 100%)
 * @param {function} props.onZoomChange - Callback when zoom level changes
 * @param {number} props.minZoom - Minimum zoom level (default: 0.5)
 * @param {number} props.maxZoom - Maximum zoom level (default: 3.0)
 * @param {number} props.step - Zoom step (default: 0.1)
 */
export default function ZoomControl({
  zoomLevel = 1,
  onZoomChange,
  minZoom = 0.5,
  maxZoom = 3.0,
  step = 0.1,
}) {
  // Track whether slider is visible
  const [expanded, setExpanded] = useState(false);

  // Format zoom level as percentage
  const formatZoom = (value) => `${Math.round(value * 100)}%`;

  // Handle zoom in button
  const handleZoomIn = () => {
    if (zoomLevel < maxZoom) {
      onZoomChange(Math.min(zoomLevel + step, maxZoom));
    }
  };

  // Handle zoom out button
  const handleZoomOut = () => {
    if (zoomLevel > minZoom) {
      onZoomChange(Math.max(zoomLevel - step, minZoom));
    }
  };

  // Handle reset to 100%
  const handleReset = () => {
    onZoomChange(1);
  };

  // Handle slider change
  const handleSliderChange = (event, newValue) => {
    onZoomChange(newValue);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 1000,
        borderRadius: 2,
        opacity: 0.9,
        '&:hover': {
          opacity: 1,
        },
        transition: 'opacity 0.2s, width 0.3s',
        padding: 0.5,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ButtonGroup size="small">
          <Tooltip title="Zoom Out">
            <IconButton
              onClick={handleZoomOut}
              disabled={zoomLevel <= minZoom}
              size="small"
              onMouseOver={() => setExpanded(true)}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset to 100%">
            <IconButton
              onClick={handleReset}
              size="small"
              onMouseOver={() => setExpanded(true)}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                minWidth: 46,
                borderRadius: 0,
              }}
            >
              {formatZoom(zoomLevel)}
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom In">
            <IconButton
              onClick={handleZoomIn}
              disabled={zoomLevel >= maxZoom}
              size="small"
              onMouseOver={() => setExpanded(true)}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Box
          sx={{
            width: expanded ? 100 : 0,
            overflow: 'hidden',
            transition: 'width 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            px: expanded ? 2 : 0,
          }}
          onMouseLeave={() => setExpanded(false)}
        >
          <Slider
            size="small"
            min={minZoom}
            max={maxZoom}
            step={step}
            value={zoomLevel}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            valueLabelFormat={formatZoom}
            sx={{ opacity: expanded ? 1 : 0 }}
          />
        </Box>
      </Box>
    </Paper>
  );
}