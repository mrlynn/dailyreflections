'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

/**
 * QR code scanner component for scanning connection profile codes
 */
export default function QRScanner({ onScan }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const openDialog = () => {
    setIsDialogOpen(true);
    setErrorMessage(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsScanning(false);
  };

  const startScanner = async () => {
    // Reset any previous errors
    setErrorMessage(null);
    setIsScanning(true);

    try {
      // Dynamically import the QR scanner library
      let QrScanner;
      try {
        const module = await import('qr-scanner');
        QrScanner = module.default;
      } catch (importError) {
        console.error('Failed to import qr-scanner module:', importError);
        throw new Error('QR scanning functionality is not available. The required module could not be loaded.');
      }

      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser');
      }

      // Get video element
      const videoElement = document.getElementById('qr-video');
      if (!videoElement) {
        throw new Error('Scanner initialization failed');
      }

      // Initialize scanner
      const qrScanner = new QrScanner(
        videoElement,
        (result) => {
          handleScanResult(result.data);
          qrScanner.stop();
          qrScanner.destroy();
          setIsScanning(false);
          closeDialog();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );

      // Start scanning
      await qrScanner.start();

      // Clean up on dialog close
      const cleanup = () => {
        if (qrScanner) {
          qrScanner.stop();
          qrScanner.destroy();
        }
      };

      // Ensure cleanup when dialog closes
      return cleanup;
    } catch (error) {
      console.error('QR Scanner error:', error);
      setIsScanning(false);
      setIsCameraAvailable(false);
      setErrorMessage(
        error.message === 'Camera access is not supported by this browser'
          ? 'Your browser does not support camera access'
          : 'Could not access camera. Please check your permissions.'
      );
    }
  };

  const handleScanResult = (data) => {
    try {
      // Check if URL is from our app
      if (data.includes('/connect/')) {
        // Extract slug from URL
        const slug = data.split('/connect/')[1].split('?')[0];

        // Call onScan with the slug
        if (slug && onScan) {
          onScan(slug);
        }
      } else {
        // If it's not a connection QR code
        setErrorMessage('This QR code is not a valid connection profile');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setErrorMessage('Invalid QR code format');
    }
  };

  // Start scanning when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      const cleanup = startScanner();
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [isDialogOpen]);

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={openDialog}
        startIcon={<QrCodeScannerIcon />}
      >
        Scan QR Code
      </Button>

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Scan Connection QR Code
          <IconButton
            aria-label="close"
            onClick={closeDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {isCameraAvailable ? (
            <>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 300,
                  bgcolor: 'black',
                  borderRadius: 1,
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <video
                  id="qr-video"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                ></video>

                {isScanning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                )}
              </Box>

              {errorMessage && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
                  <Typography color="error.dark">{errorMessage}</Typography>
                </Paper>
              )}

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Point your camera at a connection profile QR code to scan it
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Note: You may need to allow camera permissions when prompted
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" paragraph>
                {errorMessage || 'Camera access error'}
              </Typography>
              <Typography variant="body2">
                Please make sure you have given camera permission to this website or try scanning the QR code with your phone's camera app.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          {!isScanning && isCameraAvailable && (
            <Button onClick={startScanner} variant="contained">
              Retry Scan
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}