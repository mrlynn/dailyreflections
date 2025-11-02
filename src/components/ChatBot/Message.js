'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  Divider,
  LinearProgress,
  Link,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

/**
 * Message Component
 * Displays a single message in the chat, either from the user or the bot
 */
export default function Message({ role, content, citations = null, isLoading = false }) {
  const [showCitations, setShowCitations] = useState(false);

  const isBot = role === 'assistant';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: isBot ? 'flex-start' : 'flex-end',
        maxWidth: '85%',
        mb: 1.5,
      }}
    >
      {/* Message header with role icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          ml: isBot ? 0 : 'auto',
          mr: isBot ? 'auto' : 0,
        }}
      >
        {isBot ? (
          <SmartToyIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
        ) : (
          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        )}
        <Typography variant="caption" color="text.secondary">
          {isBot ? 'Recovery Assistant' : 'You'}
        </Typography>
      </Box>

      {/* Message content */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: isBot ? 'background.default' : 'primary.light',
          color: isBot ? 'text.primary' : 'primary.contrastText',
          borderRadius: isBot ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
          position: 'relative',
          minWidth: '120px',
        }}
      >
        {isLoading ? (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>Searching AA literature...</Typography>
            <LinearProgress sx={{ borderRadius: 1, height: 4 }} />
          </>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {content}
          </Typography>
        )}
      </Paper>

      {/* Citations section (only for bot messages) */}
      {isBot && citations && citations.length > 0 && (
        <Box sx={{ mt: 1, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              p: 0.5,
            }}
            onClick={() => setShowCitations(!showCitations)}
          >
            <Typography variant="caption" color="text.secondary">
              {showCitations ? 'Hide Sources' : `Sources (${citations.length})`}
            </Typography>
            <IconButton size="small">
              {showCitations ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>

          <Collapse in={showCitations}>
            {citations.map((citation, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  mt: 1,
                  p: 1.5,
                  backgroundColor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" fontWeight="bold">
                    {citation.reference}
                  </Typography>
                  <Tooltip title={`${Math.round(citation.score * 100)}% relevance score`}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: 4,
                        px: 1,
                        py: 0.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 50,
                          height: 5,
                          borderRadius: 2,
                          bgcolor: 'divider',
                          overflow: 'hidden',
                          mr: 0.5
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${Math.round(citation.score * 100)}%`,
                            bgcolor: citation.score > 0.8 ? 'success.main' : citation.score > 0.6 ? 'warning.main' : 'error.main',
                          }}
                        />
                      </Box>
                      <Typography variant="caption">
                        {Math.round(citation.score * 100)}%
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>

                <Typography variant="body2" sx={{
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  mt: 1
                }}>
                  "{citation.text}"
                </Typography>

                {citation.url && (
                  <Link
                    href={citation.url}
                    underline="hover"
                    sx={{ display: 'block', mt: 1, fontSize: '0.8rem' }}
                  >
                    View full content
                  </Link>
                )}
              </Paper>
            ))}
          </Collapse>
        </Box>
      )}
    </Box>
  );
}