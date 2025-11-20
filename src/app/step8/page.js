'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Grid,
  Divider
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import Link from 'next/link';

// Import our components
import PageHeader from '@/components/PageHeader';
import Step8Header from '@/components/Step8/Step8Header';
import AmendsForm from '@/components/Step8/AmendsForm';
import AmendsList from '@/components/Step8/AmendsList';
import AmendsStats from '@/components/Step8/AmendsStats';
import Step8Guide from '@/components/Step8/Step8Guide';

export default function Step8Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  // Load inventory data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchInventory();
    }
  }, [status, refreshTrigger]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/step8');

      if (!response.ok) {
        throw new Error('Failed to load 8th Step inventory');
      }

      const data = await response.json();
      setInventory(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load your 8th Step inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle inventory status change
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch('/api/step8', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      refreshData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update inventory status. Please try again.');
    }
  };

  const amendsEntries = Array.isArray(inventory?.amendsEntries) ? inventory.amendsEntries : [];
  const totalEntries = amendsEntries.length;
  const completedCount = amendsEntries.filter(entry => entry.willingnessStatus === 'completed').length;
  const willingCount = amendsEntries.filter(entry => entry.willingnessStatus === 'willing').length;
  const hesitantCount = amendsEntries.filter(entry => entry.willingnessStatus === 'hesitant').length;

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="8th Step Amends List"
        icon={<ListAltIcon sx={{ fontSize: 'inherit' }} />}
        subtitle='"Made a list of all persons we had harmed, and became willing to make amends to them all."'
        backgroundImage="/images/step8.png"
        backgroundOverlay="linear-gradient(135deg, rgba(253, 242, 233, 0.78) 0%, rgba(216, 229, 245, 0.62) 50%, rgba(26, 43, 52, 0.58) 100%)"
        backgroundImageStyles={{ filter: 'brightness(1.05)', transform: 'scale(1.035)' }}
        backgroundOverlayStyles={{ mixBlendMode: 'multiply' }}
        invertText
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Step8Header
              inventory={inventory}
              loading={loading}
              onStatusChange={handleStatusChange}
            />
          </Grid>

          {loading ? (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : error ? (
            <Grid item xs={12}>
              <Alert severity="error">
                {error}
              </Alert>
            </Grid>
          ) : inventory ? (
            <>
              <Grid item xs={12} lg={8}>
                <Paper elevation={1}>
                  <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant={isMobile ? 'scrollable' : 'fullWidth'}
                    scrollButtons="auto"
                    aria-label="step 8 amends list tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab icon={<AddIcon />} label="Add Person" id="tab-0" aria-controls="tabpanel-0" />
                    <Tab icon={<FormatListBulletedIcon />} label="Amends List" id="tab-1" aria-controls="tabpanel-1" />
                    <Tab icon={<BarChartIcon />} label="Progress" id="tab-2" aria-controls="tabpanel-2" />
                    <Tab icon={<HelpOutlineIcon />} label="Guide" id="tab-3" aria-controls="tabpanel-3" />
                  </Tabs>

                  <Box p={3}>
                    <Box role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0">
                      {tabIndex === 0 && (
                        <AmendsForm
                          inventoryId={inventory._id}
                          onEntryAdded={refreshData}
                        />
                      )}
                    </Box>

                    <Box role="tabpanel" hidden={tabIndex !== 1} id="tabpanel-1" aria-labelledby="tab-1">
                      {tabIndex === 1 && (
                        <AmendsList
                          entries={inventory.amendsEntries || []}
                          onEntryUpdated={refreshData}
                          onEntryDeleted={refreshData}
                        />
                      )}
                    </Box>

                    <Box role="tabpanel" hidden={tabIndex !== 2} id="tabpanel-2" aria-labelledby="tab-2">
                      {tabIndex === 2 && (
                        <AmendsStats inventoryId={inventory._id} />
                      )}
                    </Box>

                    <Box role="tabpanel" hidden={tabIndex !== 3} id="tabpanel-3" aria-labelledby="tab-3">
                      {tabIndex === 3 && (
                        <Step8Guide />
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Amends Snapshot
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                      <Box>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>
                          {totalEntries}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          People Listed
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="success.main" fontWeight={700}>
                          {completedCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Amends Completed
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="info.main" fontWeight={700}>
                          {willingCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Willing Today
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="warning.main" fontWeight={700}>
                          {hesitantCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Need Prayer & Pause
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper elevation={1} sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Preparing for Step 9
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your willingness inventory sets the stage for making direct amends. When you feel ready, review your Step 8 list with a sponsor and move into Step 9 planning together.
                    </Typography>
                    <Button
                      component={Link}
                      href="/step9"
                      variant="contained"
                      color="primary"
                      sx={{ alignSelf: 'flex-start', mt: 1 }}
                    >
                      Explore Step 9 Tool
                    </Button>
                  </Paper>
                </Box>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                No 8th Step inventory found. Please refresh to create one.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
}