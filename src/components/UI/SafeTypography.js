'use client';

import { Typography } from '@mui/material';

/**
 * A wrapper for MUI Typography that avoids hydration errors
 * when containing block elements like div, p, etc.
 *
 * Uses div as the default component to safely nest other elements.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content
 * @param {string} props.variant - Typography variant
 * @param {string} props.component - HTML element to use (defaults to "div")
 * @param {Object} props.sx - Additional styles
 */
export default function SafeTypography({
  children,
  variant = 'body1',
  component = 'div', // Default to div instead of p
  sx,
  ...rest
}) {
  return (
    <Typography
      variant={variant}
      component={component}
      sx={sx}
      {...rest}
    >
      {children}
    </Typography>
  );
}