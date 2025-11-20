'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  useTheme
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

/**
 * Feature Card Component for Feature Discovery
 *
 * @param {Object} props
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 * @param {string} props.imageUrl - URL to the feature image
 * @param {string} props.actionText - Text for the call-to-action button
 * @param {string} props.actionUrl - URL for the call-to-action button
 * @param {string} props.accentColor - Accent color for the card (hex code)
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.tag - Optional tag to display (e.g. "New")
 */
const FeatureCard = ({
  title,
  description,
  imageUrl,
  actionText = 'Learn More',
  actionUrl,
  accentColor = '#5D88A6',
  icon,
  tag
}) => {
  const theme = useTheme();

  // Default accent color if none provided
  const cardAccentColor = accentColor || theme.palette.primary.main;

  // Lighten accent color for background
  const lightAccentColor = `${cardAccentColor}15`; // 15% opacity

  return (
    <Card
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        borderLeft: `4px solid ${cardAccentColor}`,
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 24px ${cardAccentColor}25`,
          '& .feature-icon': {
            transform: 'scale(1.1) rotate(5deg)',
          },
        },
      }}
    >
      {/* Feature Image */}
      {imageUrl && (
        <CardMedia
          component="img"
          height="160"
          image={imageUrl}
          alt={title}
          sx={{
            objectFit: 'cover',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      )}

      {/* Header with Icon */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${cardAccentColor} 0%, ${cardAccentColor}DD 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {icon && (
            <Box
              className="feature-icon"
              sx={{
                color: 'white',
                mr: 1.5,
                display: 'flex',
                transition: 'all 0.3s ease',
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>

        {/* Optional Tag */}
        {tag && (
          <Box
            sx={{
              backgroundColor: 'white',
              color: cardAccentColor,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {tag}
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          p: 3,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: lightAccentColor
        }}
      >
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            flexGrow: 1,
            color: theme.palette.text.primary,
            lineHeight: 1.7
          }}
        >
          {description}
        </Typography>

        <Button
          variant="contained"
          component={Link}
          href={actionUrl}
          endIcon={<ArrowForwardIcon />}
          sx={{
            mt: 'auto',
            backgroundColor: cardAccentColor,
            color: '#ffffff',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: `${cardAccentColor}DD`,
              transform: 'translateX(4px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {actionText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;