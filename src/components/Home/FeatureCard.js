'use client';

import Link from 'next/link';
import { Paper, Box, Typography, Button } from '@mui/material';

export default function FeatureCard({ title, description, href, icon: Icon, action = 'Open', color = 'primary' }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          transition: 'all .15s ease',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          {Icon && <Icon color={color} />}
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Button variant="contained" color={color} size="small">
          {action}
        </Button>
      </Paper>
    </Link>
  );
}


