'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar, PickersDay } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import TagIcon from '@mui/icons-material/Tag';
import InsightsIcon from '@mui/icons-material/Insights';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ChatIcon from '@mui/icons-material/Chat';
import Link from 'next/link';
import { format, isToday, isEqual, parseISO } from 'date-fns';
import { useGuestSession } from '@/components/GuestSessionProvider';
import PageHeader from '@/components/PageHeader';

// A component for rendering a custom day in the calendar
function CustomPickersDay(props) {
  const { day, outsideCurrentMonth, hasEntry, mood, ...other } = props;

  // Don't render mood indicator for days outside current month
  const showMood = !outsideCurrentMonth && mood !== undefined;

  // Determine the color based on mood (1-5 scale)
  let moodColor = '';
  if (showMood) {
    if (mood >= 4) moodColor = '#4caf50'; // Good mood
    else if (mood >= 3) moodColor = '#ff9800'; // Neutral mood
    else moodColor = '#f44336'; // Bad mood
  }

  const moodBackground = showMood ? alpha(moodColor, 0.18) : 'transparent';

  return (
    <Badge
      overlap="circular"
      variant="dot"
      invisible={!hasEntry}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: showMood ? moodColor : '#5DA6A7',
          boxShadow: '0 0 0 2px #fff',
          width: 8,
          height: 8
        }
      }}
    >
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          borderRadius: '50%',
          backgroundColor: moodBackground,
          ...(showMood && {
            boxShadow: `inset 0 0 0 1px ${alpha(moodColor, 0.45)}`,
            color: 'text.primary',
          }),
          ...(isToday(day) && {
            border: '1px solid',
            borderColor: 'primary.main',
          }),
        }}
      />
    </Badge>
  );
}

// Component to render a journal entry card
function JournalEntryCard({ entry, onEdit, onDelete, onView }) {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const openMenu = Boolean(menuAnchorEl);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(entry);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(entry);
  };

  const handleView = () => {
    handleMenuClose();
    onView(entry);
  };

  // Format the date for display - handle both Date objects and strings
  let formattedDate;
  try {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    if (isNaN(entryDate.getTime())) {
      formattedDate = 'Invalid date';
    } else {
      formattedDate = format(entryDate, 'MMMM d, yyyy');
    }
  } catch (error) {
    console.warn('Error formatting entry date:', error, entry);
    formattedDate = 'Invalid date';
  }

  // Determine card color based on mood
  const getMoodColor = (mood) => {
    if (mood >= 4) return '#e8f5e9'; // Light green for good mood
    if (mood >= 3) return '#fff3e0'; // Light orange for neutral mood
    return '#ffebee'; // Light red for bad mood
  };

  // Get emoji for mood
  const getMoodEmoji = (mood) => {
    if (mood >= 4) return '😊';
    if (mood >= 3) return '😐';
    return '😔';
  };

  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: getMoodColor(entry.mood),
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {formattedDate}
          </Typography>
          <Box display="flex" alignItems="center">
            <Chip
              size="small"
              label={`Mood: ${entry.mood}/5 ${getMoodEmoji(entry.mood)}`}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {entry.entryType === 'full' ? 'Full Inventory' :
               entry.entryType === 'quick' ? 'Quick Entry' : 'Check-in'}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="entry options"
              aria-controls={openMenu ? 'entry-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openMenu ? 'true' : undefined}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Entry excerpt */}
        <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic' }}>
          {entry.reflections ?
            (entry.reflections.length > 120 ? `${entry.reflections.substring(0, 120)}...` : entry.reflections)
            :
            'No reflections recorded'}
        </Typography>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
            {entry.tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}

        {/* Action menu */}
        <Menu
          id="entry-menu"
          anchorEl={menuAnchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'entry-options-button',
          }}
        >
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <FormatQuoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Entry</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [entries, setEntries] = useState([]);
  const [entryDates, setEntryDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Initialize selectedDate with today's date, ensuring it's valid
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Normalize to start of day (remove time component)
    today.setHours(0, 0, 0, 0);
    // Ensure the date is valid
    if (isNaN(today.getTime())) {
      // Fallback to a known good date if today is invalid (shouldn't happen)
      const fallback = new Date(2024, 0, 1);
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
    return today;
  });
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    entryType: 'all',
    dateRange: 'all',
    tag: null
  });

  const getEntryDate = (entry) => {
    if (!entry) return null;
    if (entry.date instanceof Date) {
      const dateCopy = new Date(entry.date.getTime());
      if (isNaN(dateCopy.getTime())) {
        return null;
      }
      dateCopy.setHours(0, 0, 0, 0);
      return dateCopy;
    }

    if (typeof entry.date === 'string') {
      try {
        const parsedDate = parseISO(entry.date);
        if (isNaN(parsedDate.getTime())) {
          return null;
        }
        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
      } catch (error) {
        console.warn('Unable to parse entry date:', entry.date);
        return null;
      }
    }
    return null;
  };

  const entriesWithDates = entries
    .map(entry => ({
      entry,
      date: getEntryDate(entry)
    }))
    .filter(item => item.date);

  const totalEntries = entries.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const entriesThisWeek = entriesWithDates.filter(({ date }) => date >= sevenDaysAgo && date <= today).length;
  const fullInventoriesCount = entries.filter(entry => entry.entryType === 'full').length;
  const quickEntriesCount = entries.filter(entry => entry.entryType === 'quick').length;

  const moodValues = entries
    .map(entry => (typeof entry.mood === 'number' ? entry.mood : null))
    .filter(value => value !== null && !Number.isNaN(value));
  const averageMood = moodValues.length
    ? (moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length).toFixed(1)
    : null;

  const mostRecentEntryDate = entriesWithDates.length > 0 ? entriesWithDates[0].date : null;

  // Filter menu state
  const openFilterMenu = Boolean(filterAnchorEl);

  const { storage, isGuest, isReady } = useGuestSession();
  const mode = isGuest ? 'guest' : 'authenticated';
  const sessionLoading = status === 'loading';
  const notReady = !storage || !isReady || (mode === 'authenticated' && sessionLoading);

  // Fetch entries when storage is ready or filters change
  useEffect(() => {
    if (!storage || !isReady) {
      return;
    }

    if (mode === 'guest' || status === 'authenticated') {
      fetchEntries();
    }
  }, [storage, mode, status, isReady, activeFilters]);

  // Update selected entries when date or entries change
  useEffect(() => {
    if (view === 'calendar' && selectedDate && entries.length > 0) {
      // Validate selectedDate before formatting
      if (!selectedDate || isNaN(new Date(selectedDate).getTime())) {
        setSelectedEntries([]);
        return;
      }
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const filteredEntries = entries.filter(entry => {
        // Handle both Date objects and ISO strings
        let entryDateStr;
        if (entry.date instanceof Date) {
          entryDateStr = format(entry.date, 'yyyy-MM-dd');
        } else if (typeof entry.date === 'string') {
          entryDateStr = entry.date.split('T')[0];
        } else {
          return false; // Skip invalid dates
        }
        return entryDateStr === formattedDate;
      });
      setSelectedEntries(filteredEntries);
    }
  }, [selectedDate, entries, view]);

  // Fetch journal entries
  const fetchEntries = async () => {
    if (!storage) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const filters = {};

      if (activeFilters.dateRange === 'week') {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        filters.startDate = sevenDaysAgo.toISOString().split('T')[0];
        filters.endDate = today.toISOString().split('T')[0];
      } else if (activeFilters.dateRange === 'month') {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        filters.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        filters.endDate = today.toISOString().split('T')[0];
      }

      if (activeFilters.tag) {
        filters.tag = activeFilters.tag;
      }

      filters.limit = '1000';

      let fetchedEntries = await storage.journal.getEntries(filters);
      fetchedEntries = fetchedEntries || [];

      // Filter by entry type if needed
      if (activeFilters.entryType !== 'all') {
        fetchedEntries = fetchedEntries.filter(entry => entry.entryType === activeFilters.entryType);
      }

      // Filter by search query if present
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        fetchedEntries = fetchedEntries.filter(entry =>
          (entry.reflections && entry.reflections.toLowerCase().includes(query)) ||
          (entry.inventory && entry.inventory.resentments && entry.inventory.resentments.toLowerCase().includes(query)) ||
          (entry.inventory && entry.inventory.fears && entry.inventory.fears.toLowerCase().includes(query)) ||
          (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }

      // Sort entries by date (newest first)
      fetchedEntries.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        // Handle invalid dates
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        return dateB - dateA;
      });

      setEntries(fetchedEntries);

      // Create a map of dates with entries for the calendar view
      const datesWithEntries = {};
      fetchedEntries.forEach(entry => {
        try {
          let dateKey;
          if (entry.date instanceof Date) {
            dateKey = format(entry.date, 'yyyy-MM-dd');
          } else if (typeof entry.date === 'string') {
            dateKey = entry.date.split('T')[0];
          } else {
            console.warn('Invalid entry date format:', entry.date);
            return; // Skip entries with invalid dates
          }
          if (!datesWithEntries[dateKey]) {
            datesWithEntries[dateKey] = { hasEntry: true, mood: entry.mood };
          }
        } catch (error) {
          console.warn('Error processing entry date:', error, entry);
        }
      });
      setEntryDates(datesWithEntries);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setError('Failed to load journal entries. Please try again.');
      setLoading(false);
    }
  };

  // Handle date selection in calendar
  const handleDateChange = (date) => {
    // Validate the date before setting it
    if (!date) {
      console.warn('No date provided to handleDateChange');
      return;
    }
    
    // Convert to Date object if it's not already
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Validate the date
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date selected:', date);
      return; // Keep current date if invalid
    }
    
    // Normalize to start of day (remove time component)
    dateObj.setHours(0, 0, 0, 0);
    setSelectedDate(dateObj);
  };

  // Handle view toggle between calendar and list
  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEntries();
  };

  // Filter menu handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Apply filter
  const handleFilterApply = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    handleFilterClose();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({ entryType: 'all', dateRange: 'all', tag: null });
    setSearchQuery('');
    handleFilterClose();
  };

  // Entry actions
  const handleViewEntry = (entry) => {
    router.push(`/journal/${entry._id}`);
  };

  const handleEditEntry = (entry) => {
    // In a real implementation, you would route to an edit page
    // For now, just view the entry
    router.push(`/journal/${entry._id}`);
  };

  const handleDeleteEntry = async (entry) => {
    if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      try {
        if (!storage) {
          throw new Error('Storage is not available.');
        }

        await storage.journal.deleteEntry(entry._id);

        // Remove the entry from state
        setEntries(entries.filter(e => e._id !== entry._id));

        // Update entry dates map
        const dateKey = entry.date ? entry.date.split('T')[0] : null;
        if (dateKey) {
          const newEntryDates = { ...entryDates };
          delete newEntryDates[dateKey];
          setEntryDates(newEntryDates);
        }

        // Update selected entries
        setSelectedEntries(selectedEntries.filter(e => e._id !== entry._id));
      } catch (error) {
        console.error('Error deleting journal entry:', error);
        alert('Failed to delete journal entry. Please try again.');
      }
    }
  };

  // Custom calendar day component that decorates days with entry metadata
  const CalendarDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;

    // Guard against invalid Date objects
    if (!(day instanceof Date) || isNaN(day.getTime())) {
      return <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />;
    }

    try {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dateInfo = entryDates[dateKey] || {};

      return (
        <CustomPickersDay
          {...other}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          hasEntry={Boolean(dateInfo.hasEntry)}
          mood={dateInfo.mood}
        />
      );
    } catch (error) {
      console.warn('Error rendering calendar day:', error, day);
      return <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />;
    }
  };

  if (notReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="10th Step Journal"
        icon={<EditNoteIcon sx={{ fontSize: 'inherit' }} />}
        subtitle='"Continued to take personal inventory and when we were wrong promptly admitted it."'
        backgroundImage="/images/step10.png"
        backgroundOverlay="linear-gradient(135deg, rgba(253, 242, 233, 0.78) 0%, rgba(216, 229, 245, 0.62) 50%, rgba(26, 43, 52, 0.58) 100%)"
        backgroundImageStyles={{ filter: 'brightness(1.05)', transform: 'scale(1.035)' }}
        backgroundOverlayStyles={{ mixBlendMode: 'multiply' }}
        invertText
        actions={
          <Button
            component={Link}
            href="/journal/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#5DA6A7',
              '&:hover': { backgroundColor: '#4A8F90' },
            }}
          >
            New Entry
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box component="form" onSubmit={handleSearchSubmit}>
                    <TextField
                      fullWidth
                      placeholder="Search journal entries..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      onClick={handleFilterClick}
                      sx={{ mr: 2 }}
                    >
                      Filters
                      {(activeFilters.entryType !== 'all' || activeFilters.dateRange !== 'all' || activeFilters.tag) && (
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            ml: 1,
                          }}
                        />
                      )}
                    </Button>

                    <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <IconButton
                        color={view === 'calendar' ? 'primary' : 'default'}
                        onClick={() => handleViewChange('calendar')}
                        sx={{ borderRadius: '4px 0 0 4px' }}
                      >
                        <CalendarMonthIcon />
                      </IconButton>
                      <IconButton
                        color={view === 'list' ? 'primary' : 'default'}
                        onClick={() => handleViewChange('list')}
                        sx={{ borderRadius: '0 4px 4px 0' }}
                      >
                        <ViewListIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Menu
                id="filter-menu"
                anchorEl={filterAnchorEl}
                open={openFilterMenu}
                onClose={handleFilterClose}
                PaperProps={{
                  sx: {
                    width: 240,
                    maxHeight: '80vh',
                  },
                }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2">Entry Type</Typography>
                </MenuItem>
                <MenuItem
                  selected={activeFilters.entryType === 'all'}
                  onClick={() => handleFilterApply('entryType', 'all')}
                >
                  All Types
                </MenuItem>
                <MenuItem
                  selected={activeFilters.entryType === 'full'}
                  onClick={() => handleFilterApply('entryType', 'full')}
                >
                  Full Inventory
                </MenuItem>
                <MenuItem
                  selected={activeFilters.entryType === 'quick'}
                  onClick={() => handleFilterApply('entryType', 'quick')}
                >
                  Quick Entry
                </MenuItem>
                <MenuItem
                  selected={activeFilters.entryType === 'check-in'}
                  onClick={() => handleFilterApply('entryType', 'check-in')}
                >
                  Simple Check-in
                </MenuItem>

                <Divider sx={{ my: 1 }} />

                <MenuItem disabled>
                  <Typography variant="subtitle2">Date Range</Typography>
                </MenuItem>
                <MenuItem
                  selected={activeFilters.dateRange === 'all'}
                  onClick={() => handleFilterApply('dateRange', 'all')}
                >
                  All Dates
                </MenuItem>
                <MenuItem
                  selected={activeFilters.dateRange === 'week'}
                  onClick={() => handleFilterApply('dateRange', 'week')}
                >
                  Last 7 Days
                </MenuItem>
                <MenuItem
                  selected={activeFilters.dateRange === 'month'}
                  onClick={() => handleFilterApply('dateRange', 'month')}
                >
                  Last 30 Days
                </MenuItem>

                <Divider sx={{ my: 1 }} />

                <MenuItem
                  onClick={handleClearFilters}
                  sx={{ color: 'primary.main' }}
                >
                  Clear All Filters
                </MenuItem>
              </Menu>

              {(activeFilters.entryType !== 'all' || activeFilters.dateRange !== 'all' || activeFilters.tag) && (
                <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                  {activeFilters.entryType !== 'all' && (
                    <Chip
                      label={`Type: ${activeFilters.entryType}`}
                      onDelete={() => handleFilterApply('entryType', 'all')}
                      size="small"
                    />
                  )}
                  {activeFilters.dateRange !== 'all' && (
                    <Chip
                      label={`Date: ${activeFilters.dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}`}
                      onDelete={() => handleFilterApply('dateRange', 'all')}
                      size="small"
                    />
                  )}
                  {activeFilters.tag && (
                    <Chip
                      label={`Tag: ${activeFilters.tag}`}
                      onDelete={() => handleFilterApply('tag', null)}
                      size="small"
                    />
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">
                {error}
              </Alert>
            </Grid>
          )}

          {loading ? (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : entries.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No journal entries found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {searchQuery || activeFilters.entryType !== 'all' || activeFilters.dateRange !== 'all' || activeFilters.tag
                    ? 'Try adjusting your filters or search query.'
                    : 'Start your 10th Step practice by creating a new journal entry.'}
                </Typography>
                <Button
                  component={Link}
                  href="/journal/new"
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Create Your First Entry
                </Button>
              </Paper>
            </Grid>
          ) : (
            <>
              <Grid item xs={12} lg={8}>
                {view === 'calendar' ? (
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          {(() => {
                            if (!selectedDate) {
                              return (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                  <Typography color="error">No date selected.</Typography>
                                  <Button
                                    onClick={() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      setSelectedDate(today);
                                    }}
                                    sx={{ mt: 2 }}
                                    variant="outlined"
                                  >
                                    Reset to Today
                                  </Button>
                                </Box>
                              );
                            }

                            const dateToCheck = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
                            if (isNaN(dateToCheck.getTime())) {
                              return (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                  <Typography color="error">Invalid date selected. Please refresh the page.</Typography>
                                  <Button
                                    onClick={() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      setSelectedDate(today);
                                    }}
                                    sx={{ mt: 2 }}
                                    variant="outlined"
                                  >
                                    Reset to Today
                                  </Button>
                                </Box>
                              );
                            }

                            return (
                              <DateCalendar
                                value={dateToCheck}
                                onChange={handleDateChange}
                                slots={{
                                  day: CalendarDay
                                }}
                                disableFuture
                              />
                            );
                          })()}
                        </LocalizationProvider>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          {selectedDate && !isNaN(new Date(selectedDate).getTime())
                            ? format(selectedDate, 'MMMM d, yyyy')
                            : 'Select a date'}
                        </Typography>
                        {selectedEntries.length > 0 ? (
                          selectedEntries.map(entry => (
                            <JournalEntryCard
                              key={entry._id}
                              entry={entry}
                              onView={handleViewEntry}
                              onEdit={handleEditEntry}
                              onDelete={handleDeleteEntry}
                            />
                          ))
                        ) : (
                          <Box textAlign="center" py={4}>
                            <Typography variant="body1" color="text.secondary" paragraph>
                              No entries for this date.
                            </Typography>
                            <Button
                              component={Link}
                              href={`/journal/new?date=${selectedDate && !isNaN(new Date(selectedDate).getTime()) ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}`}
                              variant="outlined"
                              startIcon={<AddIcon />}
                            >
                              Add Entry for This Day
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Paper sx={{ p: 3 }}>
                    {entries.length > 0 ? (
                      entries.map(entry => (
                        <JournalEntryCard
                          key={entry._id}
                          entry={entry}
                          onView={handleViewEntry}
                          onEdit={handleEditEntry}
                          onDelete={handleDeleteEntry}
                        />
                      ))
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Typography variant="body1" color="text.secondary">
                          No entries match your filters.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}
              </Grid>

              <Grid item xs={12} lg={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Journaling Snapshot
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))' },
                        gap: 2
                      }}
                    >
                      <Box>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>
                          {totalEntries}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Entries
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="success.main" fontWeight={700}>
                          {entriesThisWeek}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Logged This Week
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="info.main" fontWeight={700}>
                          {averageMood ?? '--'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Mood
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="warning.main" fontWeight={700}>
                          {fullInventoriesCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Deep Inventories
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {mostRecentEntryDate
                        ? `Last entry captured ${format(mostRecentEntryDate, 'MMMM d, yyyy')}.`
                        : 'Your latest entry will appear here once logged.'}
                    </Typography>
                  </Paper>

                  <Paper elevation={1} sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Keep the Momentum
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use insights and daily reflections to stay aligned with Step 10. Your quick entries ({quickEntriesCount}) are great for spot check-ins—pair them with deeper reviews when patterns emerge.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mt: 1 }}>
                      <Button
                        component={Link}
                        href="/journal/insights"
                        variant="outlined"
                        startIcon={<InsightsIcon />}
                        sx={{ flexGrow: 1 }}
                      >
                        View Insights
                      </Button>
                      <Button
                        component={Link}
                        href="/daily-reflection"
                        variant="outlined"
                        sx={{ flexGrow: 1 }}
                      >
                        Daily Reflection
                      </Button>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        component={Link}
                        href="/chat"
                        variant="contained"
                        startIcon={<ChatIcon />}
                        sx={{ width: '100%', backgroundColor: '#5DA6A7', '&:hover': { backgroundColor: '#4A8F90' } }}
                      >
                        Talk to a Volunteer
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    component={Link}
                    href="/journal/new"
                    startIcon={<AddIcon />}
                    variant="contained"
                  >
                    New Entry
                  </Button>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </>
  );
}