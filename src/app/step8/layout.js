import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

export const metadata = {
  title: '8th Step Amends List | Daily Reflections',
  description: 'Make a list of all persons you have harmed, and become willing to make amends to them all.',
};

export default function Step8Layout({ children }) {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    }>
      {children}
    </Suspense>
  );
}