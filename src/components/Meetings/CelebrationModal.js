'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Button,
  Stack,
  IconButton,
  Paper,
  Divider,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookIcon from '@mui/icons-material/Book';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import confetti from 'canvas-confetti';

export default function CelebrationModal({ open, onClose }) {
  const router = useRouter();
  const theme = useTheme();
  const confettiInitialized = useRef(false);

  useEffect(() => {
    if (open && !confettiInitialized.current) {
      confettiInitialized.current = true;
      
      // Create a confetti cannon effect
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Launch confetti from both sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Additional burst effects
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 2000
        });
      }, 1000);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          zIndex: 2000
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          zIndex: 2000
        });
      }, 2000);
    }

    return () => {
      if (!open) {
        confettiInitialized.current = false;
      }
    };
  }, [open]);

  const resourceLinks = [
    {
      title: '12 Steps',
      description: 'Continue your spiritual journey through the Twelve Steps',
      icon: <MenuBookIcon />,
      href: '/steps',
      color: 'primary'
    },
    {
      title: 'Big Book',
      description: 'Read and study the Big Book of Alcoholics Anonymous',
      icon: <AutoStoriesIcon />,
      href: '/big-book',
      color: 'secondary'
    },
    {
      title: 'Resources',
      description: 'Explore AA literature and recovery resources',
      icon: <BookmarksIcon />,
      href: '/resources',
      color: 'primary'
    },
    {
      title: 'Journal',
      description: 'Reflect on your journey with daily journaling',
      icon: <BookIcon />,
      href: '/journal',
      color: 'secondary'
    },
    {
      title: 'Meetings',
      description: 'Find and attend AA meetings in your area',
      icon: <AssignmentTurnedInIcon />,
      href: '/meetings',
      color: 'primary'
    }
  ];

  const handleResourceClick = (href) => {
    router.push(href);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'visible'
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          pt: 4,
          pb: 2,
          position: 'relative'
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary'
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2
          }}
        >
          <CelebrationIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 1
                },
                '50%': {
                  transform: 'scale(1.1)',
                  opacity: 0.8
                }
              }
            }}
          />
        </Box>
        
        <Typography
          variant="h3"
          component="h2"
          sx={{
            fontWeight: 700,
            background: theme => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Congratulations!
        </Typography>
        
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1
          }}
        >
          You've Completed Your 90 in 90 Challenge!
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            background: theme => theme.palette.mode === 'dark'
              ? 'rgba(102, 126, 234, 0.1)'
              : 'rgba(102, 126, 234, 0.05)',
            border: '1px solid',
            borderColor: theme => theme.palette.mode === 'dark'
              ? 'rgba(102, 126, 234, 0.3)'
              : 'rgba(102, 126, 234, 0.2)'
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'text.primary',
              mb: 2
            }}
          >
            You've shown incredible commitment and dedication to your recovery journey. 
            Completing 90 meetings in 90 days is a remarkable achievement that demonstrates 
            your willingness to change and grow.
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          >
            "The journey of a thousand miles begins with a single step." 
            You've taken 90 powerful steps. Now, let's continue building on this foundation.
          </Typography>
        </Paper>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 3,
            textAlign: 'center',
            color: 'text.primary'
          }}
        >
          Continue Your Recovery Journey
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 3,
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          Your 90 in 90 is complete, but your recovery journey continues. 
          Explore these resources to deepen your practice and maintain your momentum:
        </Typography>

        <Stack spacing={2}>
          {resourceLinks.map((resource, index) => (
            <Paper
              key={resource.href}
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => handleResourceClick(resource.href)}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${resource.color}.light`,
                    color: `${resource.color}.contrastText`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {resource.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      color: 'text.primary'
                    }}
                  >
                    {resource.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary'
                    }}
                  >
                    {resource.description}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={onClose}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 2
            }}
          >
            Continue Tracking
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

