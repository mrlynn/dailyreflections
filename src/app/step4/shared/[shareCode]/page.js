'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  TextField,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { format, formatDistanceToNow } from 'date-fns';

export default function SharedInventoryPage() {
  const { shareCode } = useParams();
  const [inventory, setInventory] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordHint, setPasswordHint] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [feedbackDrafts, setFeedbackDrafts] = useState({
    resentments: '',
    fears: '',
    sexConduct: '',
    harmsDone: ''
  });
  const [feedbackStatus, setFeedbackStatus] = useState({
    resentments: 'idle',
    fears: 'idle',
    sexConduct: 'idle',
    harmsDone: 'idle'
  });
  const [feedbackErrors, setFeedbackErrors] = useState({
    resentments: '',
    fears: '',
    sexConduct: '',
    harmsDone: ''
  });
  const feedbackSuccessTimers = useRef({});

  const normalizeFeedback = (rawFeedback = {}) => ({
    resentments: Array.isArray(rawFeedback.resentments) ? rawFeedback.resentments : [],
    fears: Array.isArray(rawFeedback.fears) ? rawFeedback.fears : [],
    sexConduct: Array.isArray(rawFeedback.sexConduct) ? rawFeedback.sexConduct : [],
    harmsDone: Array.isArray(rawFeedback.harmsDone) ? rawFeedback.harmsDone : []
  });

  const formatInventory = (rawInventory) => {
    if (!rawInventory) {
      return null;
    }

    return {
      ...rawInventory,
      sponsorFeedback: normalizeFeedback(rawInventory.sponsorFeedback)
    };
  };

  useEffect(() => {
    if (shareCode) {
      console.log('Client Debug - shareCode from params:', shareCode);
      fetchInventory();
    }
  }, [shareCode]);

  useEffect(() => {
    return () => {
      Object.values(feedbackSuccessTimers.current || {}).forEach((timerId) => {
        if (timerId) {
          clearTimeout(timerId);
        }
      });
    };
  }, []);

  const fetchInventory = async (providedPassword = null) => {
    try {
      setLoading(true);
      setError(null);

      if (!shareCode) {
        setError('Share code is missing');
        setLoading(false);
        return;
      }

      // Construct URL with password if provided
      let url = `/api/step4/shared/${shareCode}`;
      console.log('Client Debug - Fetching URL:', url);

      if (providedPassword) {
        url += `?password=${encodeURIComponent(providedPassword)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        if (data.needsPassword) {
          setNeedsPassword(true);
          setPasswordHint(data.passwordHint || '');
          setInventory(null);
          setShareInfo(null);
        } else {
          setInventory(formatInventory(data.inventory));
          setShareInfo(data.shareInfo || null);
          setNeedsPassword(false);
        }
      } else {
        throw new Error(data.error || 'Failed to load inventory');
      }
    } catch (err) {
      console.error('Error fetching shared inventory:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setPasswordError('');
    await fetchInventory(password);
  };

  const handleFeedbackDraftChange = (section) => (event) => {
    const value = event.target.value;
    setFeedbackDrafts((prev) => ({
      ...prev,
      [section]: value
    }));
    setFeedbackErrors((prev) => ({
      ...prev,
      [section]: ''
    }));
    setFeedbackStatus((prev) => ({
      ...prev,
      [section]: prev[section] === 'error' ? 'idle' : prev[section]
    }));
  };

  const handleFeedbackSubmit = async (section) => {
    const draft = (feedbackDrafts[section] || '').trim();

    if (!draft) {
      setFeedbackErrors((prev) => ({
        ...prev,
        [section]: 'Add a note before sending your feedback.'
      }));
      return;
    }

    setFeedbackErrors((prev) => ({
      ...prev,
      [section]: ''
    }));

    setFeedbackStatus((prev) => ({
      ...prev,
      [section]: 'saving'
    }));

    try {
      const response = await fetch(`/api/step4/shared/${shareCode}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          section,
          comment: draft,
          authorName: sponsorName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }

      setInventory((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          sponsorFeedback: normalizeFeedback(data.sponsorFeedback)
        };
      });

      setFeedbackDrafts((prev) => ({
        ...prev,
        [section]: ''
      }));

      setFeedbackStatus((prev) => ({
        ...prev,
        [section]: 'success'
      }));

      if (feedbackSuccessTimers.current[section]) {
        clearTimeout(feedbackSuccessTimers.current[section]);
      }

      feedbackSuccessTimers.current[section] = setTimeout(() => {
        setFeedbackStatus((prev) => ({
          ...prev,
          [section]: 'idle'
        }));
      }, 4000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setFeedbackErrors((prev) => ({
        ...prev,
        [section]: err.message || 'Unable to send feedback right now.'
      }));
      setFeedbackStatus((prev) => ({
        ...prev,
        [section]: 'error'
      }));
    }
  };

  const renderFeedbackList = (section) => {
    const comments = inventory?.sponsorFeedback?.[section] || [];

    if (!comments.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No feedback yet.
        </Typography>
      );
    }

    return (
      <List dense disablePadding sx={{ mb: 2 }}>
        {comments.map((entry, index) => (
          <ListItem
            key={`${section}-${entry.createdAt || index}-${index}`}
            alignItems="flex-start"
            sx={{ px: 0, mb: 1 }}
          >
            <ListItemText
              primary={
                <Typography variant="subtitle2" component="div">
                  {entry.authorName || 'Sponsor'}
                  {entry.createdAt && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </Typography>
                  )}
                </Typography>
              }
              secondary={
                <Typography
                  variant="body2"
                  component="div"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {entry.body}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  // Password entry screen
  if (needsPassword) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Password Protected 4th Step Inventory
          </Typography>
          <Typography color="text.secondary" paragraph>
            This 4th Step inventory is password protected. Please enter the password to view it.
          </Typography>

          {passwordHint && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2">Password Hint:</Typography>
              {passwordHint}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access Inventory'}
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Unable to Load Inventory
          </Typography>
          <Typography color="text.secondary" paragraph>
            {error}
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  // No inventory state
  if (!inventory) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          No inventory data available. This link may be invalid or expired.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <PsychologyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            4th Step Inventory
            <Chip
              label="Shared View"
              color="primary"
              size="small"
              sx={{ ml: 2, verticalAlign: 'middle' }}
            />
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            Created on {format(new Date(inventory.startedAt), 'MMMM d, yyyy')}
          </Typography>
        </Box>

        {shareInfo && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              <Typography variant="body2">
                This shared link will expire {formatDistanceToNow(new Date(shareInfo.expiresAt), { addSuffix: true })}
              </Typography>
            </Alert>

            {shareInfo.note && (
              <Card sx={{ mt: 2, bgcolor: 'rgba(66, 66, 231, 0.05)' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Note from the inventory owner:
                  </Typography>
                  <Typography variant="body2">
                    {shareInfo.note}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Box>

      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Share Your Perspective
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Leave thoughtful notes for each section below. Your reflections will be shared directly with the person who
          invited you and saved with their inventory.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Your name (optional)"
              value={sponsorName}
              onChange={(event) => setSponsorName(event.target.value)}
              placeholder="How should we credit your feedback?"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Resentments Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Resentments</Typography>
        <Divider sx={{ mb: 3 }} />

        {inventory.resentments && inventory.resentments.length > 0 ? (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Who/What</strong></TableCell>
                  <TableCell><strong>Cause</strong></TableCell>
                  <TableCell><strong>Affects</strong></TableCell>
                  <TableCell><strong>My Part</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.resentments.map((resentment, index) => (
                  <TableRow key={index}>
                    <TableCell>{resentment.who || 'Not specified'}</TableCell>
                    <TableCell>{resentment.cause || 'Not specified'}</TableCell>
                    <TableCell>
                      <Box>
                        {Object.entries(resentment.affects || {})
                          .filter(([, value]) => value)
                          .map(([key]) => {
                            const labels = {
                              selfEsteem: 'Self-esteem',
                              security: 'Security',
                              ambitions: 'Ambitions',
                              personalRelations: 'Personal relations',
                              sexRelations: 'Sex relations'
                            };
                            return (
                              <Chip
                                key={key}
                                label={labels[key]}
                                size="small"
                                sx={{ m: 0.5 }}
                              />
                            );
                          })}
                      </Box>
                    </TableCell>
                    <TableCell>{resentment.myPart || 'Not specified'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">No resentments recorded.</Typography>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Leave sponsor feedback
          </Typography>
          {renderFeedbackList('resentments')}
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Share guidance or observations about these resentments"
            value={feedbackDrafts.resentments}
            onChange={handleFeedbackDraftChange('resentments')}
          />
          {feedbackErrors.resentments && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {feedbackErrors.resentments}
            </Typography>
          )}
          {feedbackStatus.resentments === 'success' && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Feedback sent.
            </Typography>
          )}
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => handleFeedbackSubmit('resentments')}
            disabled={feedbackStatus.resentments === 'saving'}
          >
            {feedbackStatus.resentments === 'saving' ? 'Sending...' : 'Send Feedback'}
          </Button>
        </Box>
      </Paper>

      {/* Fears Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Fears</Typography>
        <Divider sx={{ mb: 3 }} />

        {inventory.fears && inventory.fears.length > 0 ? (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Fear</strong></TableCell>
                  <TableCell><strong>Why</strong></TableCell>
                  <TableCell><strong>How It Affects Me</strong></TableCell>
                  <TableCell><strong>Is It Rational?</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.fears.map((fear, index) => (
                  <TableRow key={index}>
                    <TableCell>{fear.fear || 'Not specified'}</TableCell>
                    <TableCell>{fear.why || 'Not specified'}</TableCell>
                    <TableCell>{fear.affects || 'Not specified'}</TableCell>
                    <TableCell>{fear.isRational ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">No fears recorded.</Typography>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Leave sponsor feedback
          </Typography>
          {renderFeedbackList('fears')}
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Offer encouragement or perspective about these fears"
            value={feedbackDrafts.fears}
            onChange={handleFeedbackDraftChange('fears')}
          />
          {feedbackErrors.fears && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {feedbackErrors.fears}
            </Typography>
          )}
          {feedbackStatus.fears === 'success' && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Feedback sent.
            </Typography>
          )}
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => handleFeedbackSubmit('fears')}
            disabled={feedbackStatus.fears === 'saving'}
          >
            {feedbackStatus.fears === 'saving' ? 'Sending...' : 'Send Feedback'}
          </Button>
        </Box>
      </Paper>

      {/* Sex Conduct Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Sex Conduct</Typography>
        <Divider sx={{ mb: 3 }} />

        {inventory.sexConduct?.relationships && inventory.sexConduct.relationships.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom>Relationships</Typography>
            <TableContainer sx={{ mb: 4 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Person</strong></TableCell>
                    <TableCell><strong>Who Was Hurt</strong></TableCell>
                    <TableCell><strong>Caused Jealousy/Suspicion</strong></TableCell>
                    <TableCell><strong>Dishonesty</strong></TableCell>
                    <TableCell><strong>What Should Have Been Done</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.sexConduct.relationships.map((relationship, index) => (
                    <TableRow key={index}>
                      <TableCell>{relationship.person || 'Not specified'}</TableCell>
                      <TableCell>{relationship.whoHurt || 'Not specified'}</TableCell>
                      <TableCell>{relationship.causeJealousy || 'Not specified'}</TableCell>
                      <TableCell>{relationship.liedTo || 'Not specified'}</TableCell>
                      <TableCell>{relationship.whatShouldHaveDone || 'Not specified'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography color="text.secondary" gutterBottom>No relationships recorded.</Typography>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Pattern Recognition</Typography>
          {inventory.sexConduct?.patterns ? (
            <Typography paragraph>{inventory.sexConduct.patterns}</Typography>
          ) : (
            <Typography color="text.secondary">No patterns recorded.</Typography>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Ideal Behavior</Typography>
          {inventory.sexConduct?.idealBehavior ? (
            <Typography paragraph>{inventory.sexConduct.idealBehavior}</Typography>
          ) : (
            <Typography color="text.secondary">No ideal behavior recorded.</Typography>
          )}
        </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Leave sponsor feedback
        </Typography>
        {renderFeedbackList('sexConduct')}
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="Reflect on relationship patterns or suggest next steps"
          value={feedbackDrafts.sexConduct}
          onChange={handleFeedbackDraftChange('sexConduct')}
        />
        {feedbackErrors.sexConduct && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {feedbackErrors.sexConduct}
          </Typography>
        )}
        {feedbackStatus.sexConduct === 'success' && (
          <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
            Feedback sent.
          </Typography>
        )}
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => handleFeedbackSubmit('sexConduct')}
          disabled={feedbackStatus.sexConduct === 'saving'}
        >
          {feedbackStatus.sexConduct === 'saving' ? 'Sending...' : 'Send Feedback'}
        </Button>
      </Box>
      </Paper>

      {/* Harms Done Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Harms Done</Typography>
        <Divider sx={{ mb: 3 }} />

        {inventory.harmsDone && inventory.harmsDone.length > 0 ? (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Who</strong></TableCell>
                  <TableCell><strong>What I Did</strong></TableCell>
                  <TableCell><strong>How It Affected Them</strong></TableCell>
                  <TableCell><strong>My Motives</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.harmsDone.map((harm, index) => (
                  <TableRow key={index}>
                    <TableCell>{harm.who || 'Not specified'}</TableCell>
                    <TableCell>{harm.what || 'Not specified'}</TableCell>
                    <TableCell>{harm.affects || 'Not specified'}</TableCell>
                    <TableCell>{harm.motives || 'Not specified'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">No harms done recorded.</Typography>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Leave sponsor feedback
          </Typography>
          {renderFeedbackList('harmsDone')}
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Provide insight on amends or making things right"
            value={feedbackDrafts.harmsDone}
            onChange={handleFeedbackDraftChange('harmsDone')}
          />
          {feedbackErrors.harmsDone && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {feedbackErrors.harmsDone}
            </Typography>
          )}
          {feedbackStatus.harmsDone === 'success' && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Feedback sent.
            </Typography>
          )}
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => handleFeedbackSubmit('harmsDone')}
            disabled={feedbackStatus.harmsDone === 'saving'}
          >
            {feedbackStatus.harmsDone === 'saving' ? 'Sending...' : 'Send Feedback'}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mt: 4, mb: 8, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ display: 'inline-block', maxWidth: '800px' }}>
          <Typography variant="body2">
            This 4th Step inventory is private and confidential. Please respect the sharing of this personal information and maintain confidentiality.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}