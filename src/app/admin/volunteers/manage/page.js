'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
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
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stack,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import { formatDistance } from 'date-fns';

/**
 * Admin Volunteer Management Page
 */
export default function AdminVolunteerManagePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch volunteers data
  useEffect(() => {
    async function fetchVolunteers() {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', rowsPerPage.toString());

        if (filter !== 'all') {
          params.append('status', filter);
        }

        if (search) {
          params.append('search', search);
        }

        const response = await fetch(`/api/admin/volunteers?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Error fetching volunteers: ${response.status}`);
        }

        const data = await response.json();
        setVolunteers(data.volunteers || []);
        setTotalCount(data.pagination?.total || 0);
      } catch (error) {
        console.error('Failed to fetch volunteers:', error);
        setError('Failed to load volunteers. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchVolunteers();
    }
  }, [status, page, rowsPerPage, filter, search]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(0);
  };

  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  // Handle search input change
  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  // Handle search input key press
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  // Format date
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

  // Check if user is admin
  const isAdmin = session?.user?.isAdmin === true;

  // If not authenticated or not admin
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated' || !isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Alert>
        <Button
          component={Link}
          href="/admin"
          startIcon={<ArrowBackIcon />}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Count active and inactive volunteers
  const activeCount = volunteers.filter(v => v.isActive).length;
  const inactiveCount = volunteers.filter(v => !v.isActive).length;

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
            Volunteer Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage active volunteers and their availability
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/admin/volunteers/applications"
          variant="contained"
          color="primary"
        >
          Review Applications
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total Volunteers</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {volunteers.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="body2">Active</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {activeCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'text.disabled', color: 'background.paper' }}>
            <Typography variant="body2">Inactive</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {inactiveCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or email"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end" size="small">
                      <PersonOffIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={8} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="all">All Volunteers</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Volunteers Table */}
      <Paper sx={{ mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Sobriety Date</TableCell>
                <TableCell>Activated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : volunteers.length > 0 ? (
                volunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell>
                      <Chip
                        label={volunteer.isActive ? "Active" : "Inactive"}
                        color={volunteer.isActive ? "success" : "default"}
                        size="small"
                        icon={volunteer.isActive ? <CheckCircleIcon /> : <PersonOffIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {volunteer.image ? (
                          <Box
                            component="img"
                            src={volunteer.image}
                            alt={volunteer.name}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              mr: 1,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        )}
                        {volunteer.name}
                      </Box>
                    </TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>
                      {volunteer.sobrietyDate ? formatDate(volunteer.sobrietyDate) : 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={volunteer.activatedAt ? formatDate(volunteer.activatedAt) : 'Not activated'}>
                        <Typography variant="body2">
                          {volunteer.activatedAt ? formatTimeAgo(volunteer.activatedAt) : 'N/A'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          component={Link}
                          href={`/admin/volunteers/manage/${volunteer.id}`}
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
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No volunteers found.
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
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}