'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import BrushIcon from '@mui/icons-material/Brush';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/**
 * Modal component that explains how the daily reflection images are created using AI
 */
export default function ImageInfoModal({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6" component="div" fontWeight={600}>
            About These Reflection Images
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Each daily reflection is accompanied by a unique piece of AI-generated artwork specifically created to visually represent the themes and emotions of that day's reflection.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BrushIcon fontSize="small" color="primary" /> Unique Visual Interpretations
          </Typography>
          <Typography variant="body1" paragraph>
            These images are not random stock photos, but rather unique digital artwork created using advanced AI image generation technology. Each image is designed to evoke the emotional essence and key themes found in the reflection text.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon fontSize="small" color="primary" /> Creation Process
          </Typography>
          <Typography variant="body1" paragraph>
            The creation process begins by analyzing the reflection's content, identifying key themes, emotions, and symbolic elements. These insights are then used to generate a custom prompt for an AI image generation model that produces artwork specifically tailored to that reflection.
          </Typography>

          <Typography variant="body1" paragraph>
            The result is a visual companion to each daily reading that enhances the contemplative experience by providing a visual focus that complements the written message.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'center' }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}