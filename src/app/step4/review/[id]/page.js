'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Grid,
  Chip,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShareLinkGenerator from '@/components/Step4/ShareLinkGenerator';
import { format, formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function InventoryReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const normalizeFeedback = (feedback = {}) => ({
    resentments: Array.isArray(feedback.resentments) ? feedback.resentments : [],
    fears: Array.isArray(feedback.fears) ? feedback.fears : [],
    sexConduct: Array.isArray(feedback.sexConduct) ? feedback.sexConduct : [],
    harmsDone: Array.isArray(feedback.harmsDone) ? feedback.harmsDone : []
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

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/api/step4?id=${id}`);
          if (!response.ok) {
            throw new Error('Failed to load inventory');
          }

          const data = await response.json();
          setInventory(formatInventory(data.inventory));
        } catch (err) {
          console.error('Error loading inventory:', err);
          setError(err.message || 'Failed to load inventory');
        } finally {
          setLoading(false);
        }
      }
    };

    if (id && status !== 'loading') {
      loadInventory();
    }
  }, [id, status]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/step4/review/' + id);
    }
  }, [status, router, id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle print action
  const handlePrint = () => {
    window.print();
  };

  const renderSponsorFeedback = (section) => {
    const comments = inventory?.sponsorFeedback?.[section] || [];

    if (!comments.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No sponsor feedback yet.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2} sx={{ mt: 0 }}>
        {comments.map((comment, index) => (
          <Grid item xs={12} key={`${section}-feedback-${comment.createdAt || index}-${index}`}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" component="div">
                {comment.authorName || 'Sponsor'}
                {comment.createdAt && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </Typography>
                )}
              </Typography>
              <Typography
                variant="body2"
                component="div"
                color="text.secondary"
                sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
              >
                {comment.body}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Loading state
  if (status === 'loading' || loading) {
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Container>
    );
  }

  // No inventory state
  if (!inventory) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          Inventory not found or you don't have permission to view it.
        </Alert>
        <Button
          variant="outlined"
          component="a"
          href="/step4"
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          Back to 4th Step
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} className="inventory-review-page">
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              4th Step Inventory Review
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="subtitle1" color="text.secondary">
                Started {format(new Date(inventory.startedAt), 'MMMM d, yyyy')}
              </Typography>
              <Chip
                label={inventory.status.charAt(0).toUpperCase() + inventory.status.slice(1)}
                color={inventory.status === 'completed' ? 'success' : 'primary'}
                size="small"
                sx={{ ml: 2 }}
              />
              {inventory.isPasswordProtected && (
                <Tooltip title="Password Protected">
                  <Chip label="Protected" color="secondary" size="small" sx={{ ml: 1 }} />
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ShareLinkGenerator
              inventoryId={id}
              isPasswordProtected={inventory.isPasswordProtected}
            />
            <ButtonGroup variant="outlined" size="medium">
              <Tooltip title="Print">
                <Button onClick={handlePrint} startIcon={<PrintIcon />}>
                  Print
                </Button>
              </Tooltip>
              <Tooltip title="Download PDF">
                <Button startIcon={<PictureAsPdfIcon />}>
                  PDF
                </Button>
              </Tooltip>
              <Tooltip title="Export as Text">
                <Button startIcon={<DownloadIcon />}>
                  Text
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="inventory tabs">
            <Tab label="Resentments" />
            <Tab label="Fears" />
            <Tab label="Sex Conduct" />
            <Tab label="Harms Done" />
            <Tab label="5th Step" />
          </Tabs>
        </Box>

        {/* Resentments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Resentments</Typography>
            <Typography paragraph>
              These are the people, institutions, or principles that make you angry or that you hold a grudge against.
            </Typography>

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
              <Alert severity="info">No resentments recorded.</Alert>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sponsor feedback
              </Typography>
              {renderSponsorFeedback('resentments')}
            </Box>
          </Box>
        </TabPanel>

        {/* Fears Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Fears</Typography>
            <Typography paragraph>
              These are your fears - what you're afraid of and why.
            </Typography>

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
              <Alert severity="info">No fears recorded.</Alert>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sponsor feedback
              </Typography>
              {renderSponsorFeedback('fears')}
            </Box>
          </Box>
        </TabPanel>

        {/* Sex Conduct Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Sex Conduct</Typography>
            <Typography paragraph>
              Your review of past relationships and sexual conduct.
            </Typography>

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
              </>
            ) : (
              <Alert severity="info">No relationships recorded.</Alert>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sponsor feedback
              </Typography>
              {renderSponsorFeedback('sexConduct')}
            </Box>
          </Box>
        </TabPanel>

        {/* Harms Done Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Harms Done</Typography>
            <Typography paragraph>
              The harms you've done to others.
            </Typography>

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
              <Alert severity="info">No harms recorded.</Alert>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sponsor feedback
              </Typography>
              {renderSponsorFeedback('harmsDone')}
            </Box>
          </Box>
        </TabPanel>

        {/* 5th Step Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Complete Your 5th Step</Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                Step 5: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs."
              </Typography>
              <Typography variant="body2">
                Now that you've completed your inventory, the next step is to share it with another person (typically your sponsor).
              </Typography>
            </Alert>

            <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Share with Your Sponsor</Typography>
              <Typography paragraph>
                Use the "Share with Sponsor" button above to create a secure link to share your inventory with your sponsor.
                This link will allow them to review your inventory before meeting, or you can go through it together.
              </Typography>

              <ShareLinkGenerator
                inventoryId={id}
                isPasswordProtected={inventory.isPasswordProtected}
              />
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Mark as Completed</Typography>
              <Typography paragraph>
                After you've completed your 5th step by sharing your inventory with another person,
                you can mark it as complete below.
              </Typography>
              <Button variant="contained" color="success">
                Mark 5th Step as Complete
              </Button>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          href="/step4"
        >
          Back to 4th Step
        </Button>
      </Box>
    </Container>
  );
}