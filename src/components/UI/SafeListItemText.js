'use client';

import { ListItemText, Typography } from '@mui/material';

/**
 * A wrapper for MUI ListItemText that avoids hydration errors
 * when using complex secondary content
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.primary - Primary text
 * @param {string|React.ReactNode} props.secondary - Secondary text/content
 * @param {Object} props.primaryTypographyProps - Props for primary Typography
 * @param {Object} props.secondaryTypographyProps - Props for secondary Typography
 * @param {Object} props.sx - Additional styles
 */
export default function SafeListItemText({
  primary,
  secondary,
  primaryTypographyProps,
  secondaryTypographyProps,
  sx,
  ...rest
}) {
  // If secondary is a string, use the ListItemText normally
  if (typeof secondary === 'string' || !secondary) {
    return (
      <ListItemText
        primary={primary}
        secondary={secondary}
        primaryTypographyProps={primaryTypographyProps}
        secondaryTypographyProps={secondaryTypographyProps}
        sx={sx}
        {...rest}
      />
    );
  }

  // For complex content in secondary, use div components to avoid nesting <p> tags
  return (
    <ListItemText
      primary={primary}
      primaryTypographyProps={primaryTypographyProps}
      secondaryTypographyProps={{
        component: 'div', // Use div instead of p for the secondary typography
        ...secondaryTypographyProps
      }}
      secondary={
        <Typography component="div" variant="body2" color="text.secondary" {...secondaryTypographyProps}>
          {secondary}
        </Typography>
      }
      sx={sx}
      {...rest}
    />
  );
}