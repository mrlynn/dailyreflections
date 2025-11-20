'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * ShareLinkGenerator Component
 *
 * Provides UI for generating and managing shareable links for 4th Step inventories
 *
 * @param {Object} props Component properties
 * @param {string} props.inventoryId The ID of the inventory to share
 * @param {boolean} props.isPasswordProtected Whether the inventory is password protected
 * @param {Object} props.buttonProps Additional props for the button
 * @param {string} props.buttonText Custom text for the share button (default: "Share with Sponsor")
 * @param {string} props.variant Button variant (default: "outlined")
 */
export default function ShareLinkGenerator({
  inventoryId,
  isPasswordProtected,
  buttonProps = {},
  buttonText = "Share with Sponsor",
  variant = "outlined"
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [note, setNote] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const generateShareLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/step4/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryId,
          expiresInDays,
          note
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate share link');
      }

      setShareLink(data);
    } catch (err) {
      console.error('Error generating share link:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareLink?.shareUrl) return;

    navigator.clipboard.writeText(shareLink.shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  const handleReset = () => {
    setShareLink(null);
    setError(null);
    setNote('');
  };

  return (
    <>
      <Button
        variant={variant}
        startIcon={<ShareIcon />}
        onClick={handleOpen}
        color="primary"
        {...buttonProps}
      >
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Share Your 4th Step Inventory
        </DialogTitle>

        <DialogContent>
          {shareLink ? (
            // Share link generated view
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Share link generated successfully!
              </Alert>

              <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Share this link with your sponsor:
                </Typography>

                <TextField
                  fullWidth
                  variant="outlined"
                  value={shareLink.shareUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={copyToClipboard} edge="end" aria-label="copy">
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <Box display="flex" alignItems="center">
                  <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    This link will expire on {new Date(shareLink.expiresAt).toLocaleDateString()} at {new Date(shareLink.expiresAt).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Paper>

              {isPasswordProtected && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Password Required
                  </Typography>
                  <Typography variant="body2">
                    Your inventory is password-protected. Your sponsor will need to enter the password to view your inventory.
                  </Typography>
                </Alert>
              )}

              <Box display="flex" justifyContent="space-between">
                <Button onClick={handleReset} color="primary">
                  Create Another Link
                </Button>
                <Button onClick={handleClose} variant="contained">
                  Done
                </Button>
              </Box>
            </Box>
          ) : (
            // Generate link form view
            <Box>
              <DialogContentText paragraph>
                This will create a secure link that you can share with your sponsor for reviewing your 4th Step inventory together. The link will expire after the selected time period.
              </DialogContentText>

              {isPasswordProtected && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Box display="flex" alignItems="center">
                    <LockIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Your inventory is password protected. Whoever you share this with will need to know the password.
                    </Typography>
                  </Box>
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" noValidate sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="expires-in-label">Link Expires After</InputLabel>
                  <Select
                    labelId="expires-in-label"
                    value={expiresInDays}
                    label="Link Expires After"
                    onChange={(e) => setExpiresInDays(e.target.value)}
                  >
                    <MenuItem value={1}>1 day</MenuItem>
                    <MenuItem value={3}>3 days</MenuItem>
                    <MenuItem value={7}>1 week</MenuItem>
                    <MenuItem value={14}>2 weeks</MenuItem>
                    <MenuItem value={30}>30 days</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Add a note to your sponsor (optional)"
                  multiline
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Example: This is my 4th step inventory that I'd like to go through with you this Saturday."
                  sx={{ mb: 3 }}
                />

                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={generateShareLink}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <ShareIcon />}
                  >
                    {loading ? 'Generating...' : 'Generate Share Link'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        {!shareLink && (
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        message="Link copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}