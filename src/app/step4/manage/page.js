'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InventoryIcon from '@mui/icons-material/Inventory';
import Link from 'next/link';
import InventoryManager from '@/components/Step4/InventoryManager';

/**
 * Step4 Inventory Management Page
 *
 * Allows users to:
 * - View all their inventories
 * - Continue an existing inventory
 * - Start a new inventory
 * - Archive old inventories
 */
export default function ManageInventoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/step4/manage');
    }
  }, [status, router]);

  // Handle selecting an inventory to work on
  const handleSelectInventory = (inventory) => {
    if (inventory && inventory._id) {
      // Navigate to the step4 page with the selected inventory ID
      router.push(`/step4?id=${inventory._id}`);
    }
  };

  // Handle starting a new inventory
  const handleStartNew = (inventory) => {
    if (inventory && inventory._id) {
      // Navigate to the step4 page with the new inventory ID
      router.push(`/step4?id=${inventory._id}`);
    }
  };

  // If not authenticated, show loading
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(79,70,229,0.02) 100%)',
          py: { xs: 4, md: 5 },
          pt: { xs: 6, md: 7 },
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
        }}
      >
        <Container maxWidth="lg">
          {/* Navigation and Breadcrumbs */}
          <Box sx={{ mb: 1 }}>
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink component={Link} href="/" color="inherit" underline="hover">
                Home
              </MuiLink>
              <MuiLink component={Link} href="/step4" color="inherit" underline="hover">
                4th Step Inventory
              </MuiLink>
              <Typography color="text.primary">Manage Inventories</Typography>
            </Breadcrumbs>
          </Box>

          {/* Page Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                fontFamily: 'var(--font-poppins)',
                color: '#2C3E50',
              }}
            >
              Manage 4th Step Inventories
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            component={Link}
            href="/step4"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to Inventory
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Your 4th Step Inventories
          </Typography>

          <Typography variant="body1" paragraph>
            Working on the 4th Step can be a long process. Here you can manage all your inventories,
            continue working on existing ones, or start fresh with a new inventory.
          </Typography>

          <Box sx={{ mt: 4 }}>
            <InventoryManager
              onSelectInventory={handleSelectInventory}
              onStartNew={handleStartNew}
            />
          </Box>
        </Paper>
      </Container>
    </>
  );
}