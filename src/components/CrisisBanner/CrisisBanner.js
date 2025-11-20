'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Collapse,
  IconButton,
  Link as MuiLink,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Link from 'next/link';

const CRISIS_BANNER_STORAGE_KEY = 'crisisBannerDismissed';
const CRISIS_BANNER_COLLAPSED_KEY = 'crisisBannerCollapsed';

export default function CrisisBanner() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const dismissedState = localStorage.getItem(CRISIS_BANNER_STORAGE_KEY);
    const collapsedState = localStorage.getItem(CRISIS_BANNER_COLLAPSED_KEY);
    
    if (dismissedState === 'true') {
      setDismissed(true);
    }
    
    if (collapsedState === 'true') {
      setCollapsed(true);
    }

    // Handle scroll to collapse banner
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(CRISIS_BANNER_STORAGE_KEY, 'true');
  };

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded) {
      setCollapsed(false);
      localStorage.removeItem(CRISIS_BANNER_COLLAPSED_KEY);
    }
  };

  const handleCollapse = () => {
    setCollapsed(true);
    setExpanded(false);
    localStorage.setItem(CRISIS_BANNER_COLLAPSED_KEY, 'true');
  };

  // Don't render if dismissed
  if (dismissed) {
    return null;
  }

  // Collapsed state (small floating button)
  if (collapsed || (scrolled && !expanded)) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
        }}
      >
        <Button
          onClick={handleToggle}
          variant="contained"
          startIcon={<FavoriteIcon />}
          sx={{
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '24px',
            px: 2,
            py: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: '#45a049',
            },
            textTransform: 'none',
            fontSize: '0.875rem',
          }}
        >
          Need Help?
        </Button>
      </Box>
    );
  }

  // Expanded state (full banner)
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        px: { xs: 1, sm: 2 },
        pb: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        elevation={4}
        sx={{
          backgroundColor: '#E8F5E9',
          borderTop: '3px solid #4CAF50',
          borderRadius: '8px 8px 0 0',
          p: { xs: 1.5, sm: 2 },
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: expanded ? 1.5 : 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FavoriteIcon sx={{ color: '#4CAF50', fontSize: { xs: 20, sm: 24 } }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#2E7D32',
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              💚 Need immediate help?
            </Typography>
            <Button
              onClick={handleToggle}
              size="small"
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                color: '#2E7D32',
                textTransform: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: 'auto',
                px: 1,
              }}
            >
              {expanded ? 'Show less' : 'Get support now →'}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleCollapse}
              sx={{ color: '#2E7D32' }}
              aria-label="Collapse banner"
            >
              <ExpandMoreIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ color: '#2E7D32' }}
              aria-label="Dismiss banner"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2, borderColor: '#A5D6A7' }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                maxHeight: '60vh',
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#A5D6A7',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#81C784',
                  },
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#1B5E20',
                  mb: 0.5,
                }}
              >
                Emergency Resources:
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1.5 }}>
                  <strong>If you're in danger, call 911</strong> (U.S.) or your local emergency number, or go to your nearest emergency room.
                </Typography>
                
                <Box sx={{ color: '#2E7D32', mb: 1.5 }}>
                  <Typography variant="body2" component="div" sx={{ color: '#2E7D32', mb: 0.5 }}>
                    <strong>988 Suicide & Crisis Lifeline:</strong> 24/7 support for mental health, substance use, and suicide crisis.
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <MuiLink
                      href="tel:988"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Call 988
                    </MuiLink>
                    <span>•</span>
                    <MuiLink
                      href="tel:988"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Text 988
                    </MuiLink>
                    <span>•</span>
                    <MuiLink
                      href="https://988lifeline.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Chat online
                    </MuiLink>
                  </Box>
                </Box>
                
                <Box sx={{ color: '#2E7D32', mb: 1.5 }}>
                  <Typography variant="body2" component="div" sx={{ color: '#2E7D32', mb: 0.5 }}>
                    <strong>SAMHSA National Helpline:</strong> Free, confidential, 24/7 treatment referral.
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <MuiLink
                      href="tel:18006624357"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Call 1-800-662-HELP (4357)
                    </MuiLink>
                    <span>•</span>
                    <MuiLink
                      href="tel:18004874889"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      TTY: 1-800-487-4889
                    </MuiLink>
                    <span>•</span>
                    <span>Text ZIP to: <strong>435748</strong></span>
                  </Box>
                  <Box sx={{ mt: 0.5 }}>
                    <MuiLink
                      href="https://www.findtreatment.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      FindTreatment.gov →
                    </MuiLink>
                  </Box>
                </Box>
                
                <Box sx={{ color: '#2E7D32', mb: 1.5 }}>
                  <Typography variant="body2" component="div" sx={{ color: '#2E7D32', mb: 0.5 }}>
                    <strong>Disaster Distress Helpline:</strong> 24/7 crisis counseling for disaster-related distress.
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <MuiLink
                      href="tel:18009855990"
                      sx={{ color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Call or text: 1-800-985-5990
                    </MuiLink>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 1, borderColor: '#A5D6A7' }} />

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#1B5E20',
                  mb: 0.5,
                }}
              >
                International Resources:
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1 }}>
                  <strong>U.K.:</strong> Samaritans - 
                  <MuiLink
                    href="tel:116123"
                    sx={{ ml: 1, color: '#1B5E20', textDecoration: 'underline' }}
                  >
                    116 123
                  </MuiLink>
                </Typography>
                
                <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1 }}>
                  <strong>Canada:</strong> Talk Suicide Canada - 
                  <MuiLink
                    href="tel:18334564566"
                    sx={{ ml: 1, color: '#1B5E20', textDecoration: 'underline' }}
                  >
                    1-833-456-4566
                  </MuiLink>
                </Typography>
              </Box>

              <Divider sx={{ my: 1, borderColor: '#A5D6A7' }} />

              <Box>
                <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1 }}>
                  <strong>Additional Resources:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
                  <Button
                    component={Link}
                    href="/resources/meetings"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#4CAF50',
                      color: '#2E7D32',
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        borderColor: '#45a049',
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      },
                    }}
                  >
                    Find Local AA Meetings →
                  </Button>
                  <Button
                    component="a"
                    href="https://www.findtreatment.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#4CAF50',
                      color: '#2E7D32',
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        borderColor: '#45a049',
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      },
                    }}
                  >
                    Find Treatment Facilities (SAMHSA) →
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 1, borderColor: '#A5D6A7' }} />

              <Box>
                <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1, fontWeight: 600 }}>
                  Ayuda en Español:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1, fontSize: '0.875rem' }}>
                    <strong>988:</strong> Llama o textea al 988 •{' '}
                    <MuiLink
                      href="https://988lifeline.org/chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: '#1B5E20', textDecoration: 'underline' }}
                    >
                      Chatea en línea
                    </MuiLink>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2E7D32', mb: 1, fontSize: '0.875rem' }}>
                    <strong>SAMHSA:</strong>{' '}
                    <MuiLink
                      href="tel:18006624357"
                      sx={{ color: '#1B5E20', textDecoration: 'underline' }}
                    >
                      1-800-662-4357
                    </MuiLink>
                    {' '}•{' '}
                    <MuiLink
                      href="https://www.findtreatment.gov/es"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: '#1B5E20', textDecoration: 'underline' }}
                    >
                      FindTreatment.gov/es
                    </MuiLink>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}

