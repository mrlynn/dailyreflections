'use client';

import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import MeetingForm from '@/components/Meetings/MeetingForm';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';

/**
 * Create Meeting Page
 */
export default function CreateMeetingPage() {
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/admin"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Admin
        </Link>
        <Link
          color="inherit"
          href="/admin/meetings"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <EventIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Meetings
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <AddIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Create
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
        Create New Meeting
      </Typography>

      <MeetingForm mode="create" />
    </Box>
  );
}