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
  Divider,
  Grid
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SyncIcon from '@mui/icons-material/Sync';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Link from 'next/link';
import { useSnackbar } from 'notistack';

// Import our components
import PageHeader from '@/components/PageHeader';
import Step9Header from '@/components/Step9/Step9Header';
import AmendsMakingForm from '@/components/Step9/AmendsMakingForm';
import AmendsList from '@/components/Step9/AmendsList';
import AmendsStats from '@/components/Step9/AmendsStats';
import Step9Guide from '@/components/Step9/Step9Guide';
import SyncAlert from '@/components/Step9/SyncAlert';
import useSyncSteps from '@/hooks/useSyncSteps';

export default function Step9Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { syncNeeded, syncStatus, updateStep8FromStep9 } = useSyncSteps();

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
      const response = await fetch('/api/step9');

      if (!response.ok) {
        throw new Error('Failed to load 9th Step inventory');
      }

      const data = await response.json();
      setInventory(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load your 9th Step inventory. Please try again.');
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
      const response = await fetch('/api/step9', {
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
  const completedCount = amendsEntries.filter(entry => entry.amendStatus === 'completed').length;
  const plannedCount = amendsEntries.filter(entry => entry.amendStatus === 'planned').length;
  const inProgressCount = amendsEntries.filter(entry => entry.amendStatus === 'in_progress').length;
  const deferredCount = amendsEntries.filter(entry => entry.amendStatus === 'deferred' || entry.amendStatus === 'not_possible').length;

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
        title="9th Step Making Amends"
        icon={<AssignmentIcon sx={{ fontSize: 'inherit' }} />}
        subtitle='"Made direct amends to such people wherever possible, except when to do so would injure them or others."'
        backgroundImage="/images/step9.png"
        backgroundOverlay="linear-gradient(135deg, rgba(253, 242, 233, 0.78) 0%, rgba(216, 229, 245, 0.62) 50%, rgba(26, 43, 52, 0.58) 100%)"
        backgroundImageStyles={{ filter: 'brightness(1.05)', transform: 'scale(1.035)' }}
        backgroundOverlayStyles={{ mixBlendMode: 'multiply' }}
        invertText
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Step9Header
              inventory={inventory}
              loading={loading}
              onStatusChange={handleStatusChange}
            />
          </Grid>

          <Grid item xs={12}>
            <SyncAlert />
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
                    aria-label="step 9 amends tracking tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab icon={<AddIcon />} label="Make Amends" id="tab-0" aria-controls="tabpanel-0" />
                    <Tab icon={<FormatListBulletedIcon />} label="Amends List" id="tab-1" aria-controls="tabpanel-1" />
                    <Tab icon={<BarChartIcon />} label="Progress" id="tab-2" aria-controls="tabpanel-2" />
                    <Tab icon={<HelpOutlineIcon />} label="Guide" id="tab-3" aria-controls="tabpanel-3" />
                  </Tabs>

                  <Box p={3}>
                    <Box role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0">
                      {tabIndex === 0 && (
                        <AmendsMakingForm
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
                          onSyncBack={(entryId) => {
                            updateStep8FromStep9(entryId).then(() => {
                              refreshData();
                              enqueueSnackbar('Successfully updated Step 8 with your changes', { variant: 'success' });
                            }).catch(err => {
                              console.error('Error syncing to Step 8:', err);
                              enqueueSnackbar('Failed to update Step 8', { variant: 'error' });
                            });
                          }}
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
                        <Step9Guide />
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
                          Total Amends
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="success.main" fontWeight={700}>
                          {completedCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="info.main" fontWeight={700}>
                          {plannedCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Scheduled
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="warning.main" fontWeight={700}>
                          {inProgressCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          In Motion
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {deferredCount > 0
                        ? `${deferredCount} amends are deferred or not possible right now. Review them with your sponsor before closing this step.`
                        : 'You have a clear runway. Keep checking in with your sponsor as you move through each amend.'}
                    </Typography>
                  </Paper>

                  <Paper elevation={1} sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Stay Connected to Step 8
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keeping your Step 8 list aligned with real-world amends ensures nothing falls through the cracks. Sync updates back anytime so both tools stay in harmony.
                    </Typography>
                    <Button
                      component={Link}
                      href="/step8"
                      variant="contained"
                      color="primary"
                      sx={{ alignSelf: 'flex-start', mt: 1 }}
                    >
                      Review Step 8 List
                    </Button>
                  </Paper>
                </Box>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                No 9th Step inventory found. Please refresh to create one.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
}