'use client';

import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Typography, Box, Paper, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Admin Course Dashboard
 * Landing page for course management
 */
export default function AdminCoursePage() {
  const router = useRouter();

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Course Management
        </Typography>

        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Welcome to the Admin Panel
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Edit course content, manage lessons, and update modules.
          </Typography>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.push('/admin/lessons')}
            size="large"
          >
            View All Lessons
          </Button>
        </Paper>
      </Box>
    </AdminLayout>
  );
}
