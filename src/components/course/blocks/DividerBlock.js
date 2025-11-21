'use client';

import { Divider } from '@mui/material';

/**
 * DividerBlock - Visual separation between conceptual units
 */
export default function DividerBlock() {
  return (
    <Divider
      sx={{
        my: 4,
        opacity: 0.3,
      }}
    />
  );
}
