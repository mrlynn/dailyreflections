'use client';

import { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  Fade,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Looks3Icon from '@mui/icons-material/Looks3'; // Using this for "0"
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

/**
 * Component that displays keyboard shortcuts for the Big Book reader
 */
export default function KeyboardHints({ zoomEnabled = true }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Keyboard shortcuts">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            bgcolor: 'background.paper',
            opacity: 0.8,
            '&:hover': { opacity: 1, bgcolor: 'background.paper' },
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
        >
          <KeyboardIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popper open={open} anchorEl={anchorEl} transition placement="bottom-start">
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <ClickAwayListener onClickAway={handleClose}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  mt: 1,
                  width: 280,
                  maxWidth: '90vw',
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Keyboard Shortcuts
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Typography variant="body2">Page Navigation:</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Previous page">
                      <KeyboardArrowLeftIcon fontSize="small" />
                    </Tooltip>
                    <Tooltip title="Next page">
                      <KeyboardArrowRightIcon fontSize="small" />
                    </Tooltip>
                  </Box>

                  {zoomEnabled && (
                    <>
                      <Typography variant="body2">Zoom Controls:</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Zoom in">
                          <AddIcon fontSize="small" />
                        </Tooltip>
                        <Tooltip title="Zoom out">
                          <RemoveIcon fontSize="small" />
                        </Tooltip>
                        <Tooltip title="Reset zoom (press 0)">
                          <Looks3Icon fontSize="small" />
                        </Tooltip>
                      </Box>

                      <Typography variant="body2">Pan When Zoomed:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Pan up (W key)">
                          <KeyboardArrowUpIcon fontSize="small" />
                        </Tooltip>
                        <Tooltip title="Pan down (S key)">
                          <KeyboardArrowDownIcon fontSize="small" />
                        </Tooltip>
                        <Tooltip title="Pan left (A key)">
                          <KeyboardArrowLeftIcon fontSize="small" />
                        </Tooltip>
                        <Tooltip title="Pan right (D key)">
                          <KeyboardArrowRightIcon fontSize="small" />
                        </Tooltip>
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            </ClickAwayListener>
          </Fade>
        )}
      </Popper>
    </>
  );
}