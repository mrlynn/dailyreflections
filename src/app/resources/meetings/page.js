"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import LinkIcon from '@mui/icons-material/Link';
import EventIcon from '@mui/icons-material/Event';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import PageHeader from '@/components/PageHeader';

export default function MeetingsResourcePage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch meetings from the Meeting Guide API
  useEffect(() => {
    async function fetchMeetings() {
      try {
        setLoading(true);
        const response = await fetch('/api/meeting-guide');

        if (!response.ok) {
          throw new Error('Failed to fetch meetings');
        }

        const data = await response.json();
        setMeetings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Error loading meetings. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchMeetings();
  }, []);

  // Format days array or single day for display
  const formatDays = (day) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (Array.isArray(day)) {
      return day.map(d => dayNames[d]).join(', ');
    }

    return dayNames[day];
  };

  // Determine meeting type (in-person, online, hybrid)
  const getMeetingType = (meeting) => {
    const isOnline = meeting.conference_url || meeting.conference_phone;
    const isInPerson = meeting.address && !meeting.formatted_address?.includes('Online');

    if (isOnline && isInPerson) {
      return "Hybrid Meeting";
    } else if (isOnline) {
      return "Online Meeting";
    } else if (isInPerson) {
      return "In-Person Meeting";
    }

    return "Meeting";
  };

  // Filter meetings based on search term
  const filteredMeetings = meetings.filter(meeting =>
    meeting.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meeting.types && meeting.types.some(type => type.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <>
      <PageHeader
        title="AA Meeting Directory"
        icon={<GroupIcon sx={{ fontSize: 'inherit' }} />}
        subtitle={
          <>
            Find Alcoholics Anonymous meetings in your area. You can also use our{' '}
            <Link href="/meetings" style={{ color: 'inherit', textDecoration: 'underline' }}>
              interactive meeting finder
            </Link>
            {' '}for more advanced filtering options.
          </>
        }
        breadcrumbs={[
          { label: 'Resources', href: '/resources' }
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <TextField
          label="Search Meetings"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, location, group, or type..."
          sx={{ mb: 4 }}
        />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredMeetings.slice(0, 20).map((meeting, index) => {
              const meetingType = getMeetingType(meeting);
              const isOnline = meeting.conference_url || meeting.conference_phone;

              return (
                <Grid item xs={12} md={6} key={`${meeting.slug}-${index}`}>
                  <Card elevation={2}>
                    <CardHeader
                      title={meeting.name}
                      subheader={meeting.group || getMeetingType(meeting)}
                      action={
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          {isOnline ? (
                            <OnlinePredictionIcon color="primary" />
                          ) : (
                            <LocationOnIcon color="success" />
                          )}
                        </Box>
                      }
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <AccessTimeIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={formatDays(meeting.day)}
                            secondary={`${meeting.time}${meeting.end_time ? ` - ${meeting.end_time}` : ''}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocationOnIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={meeting.location || (isOnline ? 'Online' : 'In-person')}
                            secondary={meeting.address || meeting.formatted_address || meeting.city}
                          />
                        </ListItem>
                        {meeting.conference_url && (
                          <ListItem>
                            <ListItemIcon>
                              <LinkIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary="Online Link"
                              secondary={
                                <Button
                                  href={meeting.conference_url}
                                  target="_blank"
                                  rel="noopener"
                                  size="small"
                                  variant="outlined"
                                >
                                  Join Meeting
                                </Button>
                              }
                            />
                          </ListItem>
                        )}
                        {meeting.notes && (
                          <ListItem>
                            <ListItemIcon>
                              <GroupIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary="Notes"
                              secondary={meeting.notes}
                            />
                          </ListItem>
                        )}
                      </List>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          component={Link}
                          href={`/meetings/${meeting.slug}`}
                          endIcon={<EventIcon />}
                          variant="text"
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {filteredMeetings.length > 20 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Showing 20 of {filteredMeetings.length} meetings
              </Typography>
              <Button
                component={Link}
                href="/meetings"
                variant="contained"
                color="primary"
                endIcon={<EventIcon />}
              >
                View All Meetings
              </Button>
            </Box>
          )}

          {filteredMeetings.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No meetings found matching your search criteria.
              </Typography>
            </Box>
          )}
        </>
      )}
      </Container>
    </>
  );
}