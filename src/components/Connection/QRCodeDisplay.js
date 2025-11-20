'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { getConnectionUrl } from '@/lib/connection-profiles/qrcode-client';

/**
 * QR Code Display Component
 *
 * @param {Object} props
 * @param {string} props.urlSlug - URL slug for the connection profile
 * @param {string} [props.primaryColor] - Primary color for the QR code
 * @param {string} [props.staticUrl] - Optional pre-generated QR code URL
 * @param {number} [props.size] - Size of the QR code
 */
export default function QRCodeDisplay({
  urlSlug,
  primaryColor = '#5d88a6',
  staticUrl = null,
  size = 200
}) {
  const [isLoading, setIsLoading] = useState(!staticUrl);
  const [qrUrl, setQrUrl] = useState(staticUrl);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const connectionUrl = urlSlug ? getConnectionUrl(urlSlug) : '';

  useEffect(() => {
    if (!staticUrl && urlSlug) {
      fetchQrCode();
    }
  }, [staticUrl, urlSlug]);

  const fetchQrCode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/user/qrcode?size=${size}`, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrUrl(data.qrDataUrl);
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;

    // Create a temporary anchor element to download the QR code
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `recovery-connection-${urlSlug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({
      open: true,
      message: 'QR code downloaded successfully',
      severity: 'success'
    });
  };

  const handleShare = async () => {
    if (!connectionUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Recovery Connection',
          text: 'Connect with me on AA Companion',
          url: connectionUrl
        });

        setSnackbar({
          open: true,
          message: 'Shared successfully',
          severity: 'success'
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          setSnackbar({
            open: true,
            message: 'Failed to share',
            severity: 'error'
          });
        }
      }
    } else {
      // Fall back to copying to clipboard
      navigator.clipboard.writeText(connectionUrl)
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Connection link copied to clipboard',
            severity: 'success'
          });
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          setSnackbar({
            open: true,
            message: 'Failed to copy link',
            severity: 'error'
          });
        });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Card variant="outlined" sx={{ maxWidth: 350, mx: 'auto', textAlign: 'center' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scan to Connect
          </Typography>

          <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
            {isLoading ? (
              <CircularProgress />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : qrUrl ? (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1
                }}
              >
                <QRCodeSVG
                  value={connectionUrl}
                  size={size}
                  fgColor={primaryColor}
                  level="M" // QR code error correction level
                  includeMargin={true}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: size,
                  height: size
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No QR code available
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {connectionUrl || 'Create your connection profile to get a shareable link'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={isLoading || !qrUrl}
            >
              Save QR
            </Button>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              disabled={isLoading || !connectionUrl}
            >
              Share
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}