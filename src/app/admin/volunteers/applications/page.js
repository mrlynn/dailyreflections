'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { formatDistance } from 'date-fns';

/**
 * Admin Volunteer Applications Page
 *
 * Dashboard for reviewing volunteer applications
 */
export default function AdminVolunteerApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch applications
  useEffect(() => {
    async function fetchApplications() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/volunteers/applications');

        if (!response.ok) {
          throw new Error(`Error fetching applications: ${response.status}`);
        }

        const data = await response.json();
        setApplications(data.applications || []);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        setError('Failed to load volunteer applications. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when changing tabs
  };

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter applications based on tab
  const filteredApplications = applications.filter(app => {
    if (tabValue === 0) return true; // All applications
    if (tabValue === 1) return app.status === 'pending'; // Pending
    if (tabValue === 2) return app.status === 'approved'; // Approved
    if (tabValue === 3) return app.status === 'rejected'; // Rejected
    return true;
  });

  // Paginate applications
  const paginatedApplications = filteredApplications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // Render status chip
  const renderStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip icon={<CheckCircleOutlineIcon />} label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Button
            component={Link}
            href="/admin"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 1 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Volunteer Applications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage volunteer applications
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {applications.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="body2">Pending</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {applications.filter(app => app.status === 'pending').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="body2">Approved</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {applications.filter(app => app.status === 'approved').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="body2">Rejected</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {applications.filter(app => app.status === 'rejected').length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Application Tabs and Table */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${applications.length})`} />
          <Tab label={`Pending (${applications.filter(app => app.status === 'pending').length})`} />
          <Tab label={`Approved (${applications.filter(app => app.status === 'approved').length})`} />
          <Tab label={`Rejected (${applications.filter(app => app.status === 'rejected').length})`} />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Sobriety Duration</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Code of Conduct</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>
                      {renderStatusChip(application.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {application._id.toString().substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {application.user_id.toString().substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{application.responses?.sobrietyDuration || 'N/A'}</TableCell>
                    <TableCell>
                      <Tooltip title={formatDate(application.created_at)}>
                        <Typography variant="body2">{formatTimeAgo(application.created_at)}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {application.code_of_conduct_accepted ? (
                        <Chip
                          label="Accepted"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Not Accepted"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Application Details">
                        <IconButton
                          component={Link}
                          href={`/admin/volunteers/applications/${application._id}`}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No applications found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredApplications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}