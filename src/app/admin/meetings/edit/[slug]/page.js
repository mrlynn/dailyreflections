'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Breadcrumbs, Link, CircularProgress, Alert } from '@mui/material';
import MeetingForm from '@/components/Meetings/MeetingForm';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import EditIcon from '@mui/icons-material/Edit';

/**
 * Edit Meeting Page
 */
export default function EditMeetingPage({ params }) {
  const { slug } = params;
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch meeting data by slug
  useEffect(() => {
    async function fetchMeeting() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/meetings/${slug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch meeting');
        }

        const data = await response.json();
        setMeeting(data);
        setError(null);
      } catch (err) {
        console.error(`Error fetching meeting ${slug}:`, err);
        setError('Error loading meeting data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchMeeting();
    }
  }, [slug]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
          Edit Meeting
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
          <EditIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Edit
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
        Edit Meeting: {meeting?.name}
      </Typography>

      <MeetingForm mode="edit" initialData={meeting} />
    </Box>
  );
}