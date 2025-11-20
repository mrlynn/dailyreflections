'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Snackbar,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShareIcon from '@mui/icons-material/Share';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useGuestSession } from '@/components/GuestSessionProvider';

// Import password protection components
import ShareLinkGenerator from '@/components/Step4/ShareLinkGenerator';
import PasswordProtectionForm from '@/components/Step4/PasswordProtectionForm';
import PasswordPromptDialog from '@/components/Step4/PasswordPromptDialog';

// Import the form components
import ResentmentForm from '@/components/Step4/ResentmentForm';
import FearForm from '@/components/Step4/FearForm';
import SexConductForm from '@/components/Step4/SexConductForm';
import HarmsForm from '@/components/Step4/HarmsForm';

export default function FourthStepInventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { storage, isGuest, isReady } = useGuestSession();
  const mode = isGuest ? 'guest' : 'authenticated';
  const sessionLoading = status === 'loading';
  const notReady = !storage || !isReady || (mode === 'authenticated' && sessionLoading);

  // Get the inventory ID from the URL, if present
  const [inventoryId, setInventoryId] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        setInventoryId(id);
      }
    }
  }, []);

  const [activeStep, setActiveStep] = useState(0);
  const [inventory, setInventory] = useState({
    resentments: [],
    fears: [],
    sexConduct: {
      relationships: [],
      patterns: '',
      idealBehavior: ''
    },
    harmsDone: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordHint, setPasswordHint] = useState('');
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [isInventoryLocked, setIsInventoryLocked] = useState(false);
  const [inventoryProgress, setInventoryProgress] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Load inventory data
  useEffect(() => {
    const loadInventory = async (password = null) => {
      if (!storage || !isReady) {
        return;
      }

      if (mode === 'authenticated') {
        try {
          setIsLoading(true);

          // Construct URL with password if provided
          let url = '/api/step4';
          const params = new URLSearchParams();

          if (password) {
            params.set('password', password);
          }

          // If inventory ID is provided, include it in the request
          if (inventoryId) {
            params.set('id', inventoryId);
          }

          // Add params to URL if there are any
          if (params.toString()) {
            url += `?${params.toString()}`;
          }

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to load inventory');
          }

          const data = await response.json();

          // Check if inventory is password protected
          if (data.needsPassword) {
            setIsPasswordProtected(true);
            setPasswordHint(data.passwordHint || '');
            setIsInventoryLocked(true);
            setPasswordPromptOpen(true);
            setIsLoading(false);

            // Store inventory ID if provided by the server
            if (data.inventoryId && !inventoryId) {
              setInventoryId(data.inventoryId);
            }

            return;
          }

          // If there's inventory data, use it
          if (data.inventory) {
            // Store inventory ID if not already set
            if (data.inventory._id && !inventoryId) {
              setInventoryId(data.inventory._id);
            }

            // Update password protection state
            setIsPasswordProtected(!!data.inventory.isPasswordProtected);
            setPasswordHint(data.inventory.passwordHint || '');
            setIsInventoryLocked(false);

            // If we have progress data, use it to set the active step
            if (data.inventory.progress) {
              setInventoryProgress(data.inventory.progress);
              if (data.inventory.progress.currentStep !== undefined) {
                setActiveStep(data.inventory.progress.currentStep);
              }
            }

            // Set inventory data
            setInventory({
              resentments: data.inventory.resentments || [],
              fears: data.inventory.fears || [],
              sexConduct: data.inventory.sexConduct || {
                relationships: [],
                patterns: '',
                idealBehavior: ''
              },
              harmsDone: data.inventory.harmsDone || []
            });
          }
        } catch (error) {
          console.error('Error loading inventory:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load inventory data',
            severity: 'error'
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        try {
          setIsLoading(true);
          const data = await storage.step4.getInventory();
          if (data) {
            setInventory(data.inventory || {
              resentments: [],
              fears: [],
              sexConduct: { relationships: [], patterns: '', idealBehavior: '' },
              harmsDone: [],
            });
            if (data.activeStep !== undefined) {
              setActiveStep(data.activeStep);
            }
            setInventoryProgress(data.progress || null);
            setInventoryId('guest-inventory');
            setIsPasswordProtected(false);
            setPasswordHint('');
            setIsInventoryLocked(false);
          }
        } catch (error) {
          console.error('Error loading guest inventory:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load inventory data',
            severity: 'error',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (mode === 'authenticated' && status !== 'authenticated') {
      return;
    }

    loadInventory();

    // Cleanup function to reset state if component unmounts
    return () => {
      setPasswordPromptOpen(false);
      setIsInventoryLocked(false);
    };
  }, [status, inventoryId, mode, storage, isReady]);

  // Handle password submission
  const handlePasswordSubmit = async (password) => {
    try {
      await loadInventory(password);
      setPasswordPromptOpen(false);
    } catch (error) {
      throw new Error('Incorrect password. Please try again.');
    }
  };

  // Function to reload inventory data
  const loadInventory = async (password = null) => {
    try {
      setIsLoading(true);

      // Construct URL with password if provided
      let url = '/api/step4';
      if (password) {
        url += `?password=${encodeURIComponent(password)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load inventory');
      }

      const data = await response.json();

      // Check if inventory is password protected
      if (data.needsPassword) {
        setIsPasswordProtected(true);
        setPasswordHint(data.passwordHint || '');
        setIsInventoryLocked(true);
        return data;
      }

      // If there's inventory data, use it
      if (data.inventory) {
        // Update password protection state
        setIsPasswordProtected(!!data.inventory.isPasswordProtected);
        setPasswordHint(data.inventory.passwordHint || '');
        setIsInventoryLocked(false);

        // Set inventory data
        setInventory({
          resentments: data.inventory.resentments || [],
          fears: data.inventory.fears || [],
          sexConduct: data.inventory.sexConduct || {
            relationships: [],
            patterns: '',
            idealBehavior: ''
          },
          harmsDone: data.inventory.harmsDone || []
        });

        return data;
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load inventory data',
        severity: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to create a clean, serializable copy of an object
   * Removes circular references and non-serializable values
   */
  const createSerializableCopy = (obj) => {
    // First, handle non-object cases
    if (typeof obj !== 'object' || obj === null) return obj;

    // Handle special cases
    if (obj instanceof Node || // DOM nodes
        obj instanceof Window || // Window object
        obj instanceof globalThis.constructor) { // Global object
      return null; // Replace with null
    }

    try {
      // For inventory data or other data, create a safe structure
      // Special case for inventory structure we expect
      if (obj.resentments || obj.fears || obj.sexConduct || obj.harmsDone) {
        const safeObj = {};

        // Safely copy resentments array
        if (Array.isArray(obj.resentments)) {
          safeObj.resentments = obj.resentments.map(item => ({
            who: typeof item.who === 'string' ? item.who : '',
            cause: typeof item.cause === 'string' ? item.cause : '',
            affects: {
              selfEsteem: !!item.affects?.selfEsteem,
              security: !!item.affects?.security,
              ambitions: !!item.affects?.ambitions,
              personalRelations: !!item.affects?.personalRelations,
              sexRelations: !!item.affects?.sexRelations
            },
            myPart: typeof item.myPart === 'string' ? item.myPart : ''
          }));
        } else {
          safeObj.resentments = [];
        }

        // Safely copy fears array
        if (Array.isArray(obj.fears)) {
          safeObj.fears = obj.fears.map(item => ({
            fear: typeof item.fear === 'string' ? item.fear : '',
            why: typeof item.why === 'string' ? item.why : '',
            affects: typeof item.affects === 'string' ? item.affects : '',
            isRational: !!item.isRational
          }));
        } else {
          safeObj.fears = [];
        }

        // Safely copy sexConduct object
        safeObj.sexConduct = {
          relationships: Array.isArray(obj.sexConduct?.relationships)
            ? obj.sexConduct.relationships.map(item => ({
                person: typeof item.person === 'string' ? item.person : '',
                whoHurt: typeof item.whoHurt === 'string' ? item.whoHurt : '',
                causeJealousy: typeof item.causeJealousy === 'string' ? item.causeJealousy : '',
                liedTo: typeof item.liedTo === 'string' ? item.liedTo : '',
                whatShouldHaveDone: typeof item.whatShouldHaveDone === 'string' ? item.whatShouldHaveDone : ''
              }))
            : [],
          patterns: typeof obj.sexConduct?.patterns === 'string' ? obj.sexConduct.patterns : '',
          idealBehavior: typeof obj.sexConduct?.idealBehavior === 'string' ? obj.sexConduct.idealBehavior : ''
        };

        // Safely copy harmsDone array
        if (Array.isArray(obj.harmsDone)) {
          safeObj.harmsDone = obj.harmsDone.map(item => ({
            who: typeof item.who === 'string' ? item.who : '',
            what: typeof item.what === 'string' ? item.what : '',
            affects: typeof item.affects === 'string' ? item.affects : '',
            motives: typeof item.motives === 'string' ? item.motives : ''
          }));
        } else {
          safeObj.harmsDone = [];
        }

        return safeObj;
      }

      // For other objects, use a more generic approach
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => createSerializableCopy(item));
      }

      // Handle regular objects
      const safeObj = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          try {
            // Skip functions, symbols, and other non-serializable types
            const value = obj[key];

            if (value === null || value === undefined) {
              safeObj[key] = value;
            } else if (typeof value === 'function' || typeof value === 'symbol') {
              continue; // Skip functions and symbols
            } else if (typeof value === 'object') {
              // Check if it's a DOM element or has special toString
              if (value instanceof Node ||
                  value.window === value ||
                  Object.prototype.toString.call(value) === '[object Window]' ||
                  Object.prototype.toString.call(value) === '[object HTMLDocument]' ||
                  Object.prototype.toString.call(value) === '[object SVGSVGElement]' ||
                  // Check specifically for SVG element (the cause of our current error)
                  (typeof value.nodeName === 'string' && value.nodeName.toLowerCase() === 'svg')) {
                continue; // Skip DOM elements
              } else {
                // Recursively process nested objects
                safeObj[key] = createSerializableCopy(value);
              }
            } else {
              // Primitives are safe
              safeObj[key] = value;
            }
          } catch (e) {
            // If anything goes wrong with a property, skip it
            console.warn(`Skipping property ${key} due to serialization error`);
          }
        }
      }
      return safeObj;
    } catch (e) {
      console.error('Error creating serializable copy:', e);
      // Return a minimal safe object as fallback
      if (obj.resentments || obj.fears || obj.sexConduct || obj.harmsDone) {
        return {
          resentments: [],
          fears: [],
          sexConduct: { relationships: [], patterns: '', idealBehavior: '' },
          harmsDone: []
        };
      }
      // For other objects, return a basic safe version
      return {};
    }
  };

  // Save inventory data
  const saveInventory = async (passwordData = null) => {
    setIsSaving(true);
    try {
      if (mode === 'authenticated') {
        const cleanInventory = createSerializableCopy(inventory);
        const dataToSave = passwordData ? { ...cleanInventory, ...passwordData } : cleanInventory;

        const payload = {
          ...dataToSave,
          activeStep,
          markAsComplete: true,
          inventoryId,
        };

        const safePayload = createSerializableCopy(payload);

        const response = await fetch('/api/step4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(safePayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save inventory');
        }

        if (passwordData) {
          setIsPasswordProtected(!!passwordData.password);
          setPasswordHint(passwordData.passwordHint || '');
          setPasswordDialogOpen(false);
        }

        setSnackbar({
          open: true,
          message: 'Inventory saved successfully',
          severity: 'success',
        });

        await loadInventory(passwordData?.password);
      } else {
        const payload = {
          inventory: createSerializableCopy(inventory),
          activeStep,
          progress: inventoryProgress,
          updatedAt: new Date().toISOString(),
        };

        await storage.step4.saveInventory(payload);
        setInventoryProgress(payload.progress);

        setSnackbar({
          open: true,
          message: 'Inventory saved locally',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save inventory',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password protection save
  const handlePasswordSave = async (passwordData) => {
    if (mode !== 'authenticated') {
      return;
    }
    await saveInventory(passwordData);
  };

  // Handle inventory updates
  const handleResentmentUpdate = (resentments) => {
    setInventory(prev => ({ ...prev, resentments }));
  };

  const handleFearUpdate = (fears) => {
    setInventory(prev => ({ ...prev, fears }));
  };

  const handleSexConductUpdate = (sexConduct) => {
    setInventory(prev => ({ ...prev, sexConduct }));
  };

  const handleHarmUpdate = (harmsDone) => {
    setInventory(prev => ({ ...prev, harmsDone }));
  };

  // Handle step navigation
  const handleNext = async () => {
    const newStep = activeStep + 1;
    setActiveStep(newStep);

    // Save the step progress (without completion)
    try {
      if (mode === 'authenticated') {
        const cleanInventory = createSerializableCopy(inventory);
        const payload = {
          ...cleanInventory,
          activeStep: newStep,
          markAsComplete: false,
          inventoryId,
        };

        const safePayload = createSerializableCopy(payload);

        await fetch('/api/step4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(safePayload),
        });
      } else {
        const payload = {
          inventory: createSerializableCopy(inventory),
          activeStep: newStep,
          progress: inventoryProgress,
          updatedAt: new Date().toISOString(),
        };
        await storage.step4.saveInventory(payload);
      }
    } catch (error) {
      console.error('Error saving step progress:', error);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Security menu handlers
  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleSecurityClick = () => {
    handleMenuClose();
    setPasswordDialogOpen(true);
  };

  const handleShareClick = () => {
    handleMenuClose();
    setShareDialogOpen(true);
  };

  // If not authenticated or loading, show loading spinner
  if (notReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Define the steps content
  const steps = [
    {
      label: 'Introduction to the 4th Step',
      description: (
        <>
          <Typography variant="body1" paragraph>
            The 4th Step in AA is "Made a searching and fearless moral inventory of ourselves."
            This step is about self-examination and recognizing patterns in your thoughts and behaviors.
          </Typography>
          <Typography variant="body1" paragraph>
            This tool will guide you through creating a thorough 4th Step inventory. You'll examine:
          </Typography>
          <ul>
            <li><Typography variant="body1">Resentments - people, institutions, or principles that make you angry</Typography></li>
            <li><Typography variant="body1">Fears - what you're afraid of and why</Typography></li>
            <li><Typography variant="body1">Sex conduct - review of your past relationships</Typography></li>
            <li><Typography variant="body1">Harms done to others - where you have caused harm</Typography></li>
          </ul>
          <Alert severity="info" sx={{ mt: 2 }}>
            This is a personal inventory. Take your time and be honest with yourself.
            All information remains private and confidential.
          </Alert>
        </>
      ),
    },
    {
      label: 'Resentments',
      description: (
        <>
          <Typography variant="body1" paragraph>
            In this section, you'll list your resentments - the people, institutions, or principles that make you angry or that you hold a grudge against.
          </Typography>
          <Typography variant="body1" paragraph>
            For each resentment, you'll identify:
          </Typography>
          <ul>
            <li><Typography variant="body1">Who or what you resent</Typography></li>
            <li><Typography variant="body1">The cause of the resentment</Typography></li>
            <li><Typography variant="body1">How it affects your self-esteem, security, ambitions, personal and sex relations</Typography></li>
            <li><Typography variant="body1">Your part in each resentment</Typography></li>
          </ul>
          <ResentmentForm resentments={inventory.resentments} onSave={handleResentmentUpdate} />
        </>
      ),
    },
    {
      label: 'Fears',
      description: (
        <>
          <Typography variant="body1" paragraph>
            In this section, you'll examine your fears - what you're afraid of and why.
          </Typography>
          <Typography variant="body1" paragraph>
            For each fear, you'll identify:
          </Typography>
          <ul>
            <li><Typography variant="body1">The specific fear</Typography></li>
            <li><Typography variant="body1">Why you have this fear</Typography></li>
            <li><Typography variant="body1">How it affects your life</Typography></li>
            <li><Typography variant="body1">Whether the fear is rational or not</Typography></li>
          </ul>
          <FearForm fears={inventory.fears} onSave={handleFearUpdate} />
        </>
      ),
    },
    {
      label: 'Sex Conduct',
      description: (
        <>
          <Typography variant="body1" paragraph>
            In this section, you'll review your past relationships and sexual conduct.
          </Typography>
          <Typography variant="body1" paragraph>
            You'll examine:
          </Typography>
          <ul>
            <li><Typography variant="body1">Where you have been selfish</Typography></li>
            <li><Typography variant="body1">Where you have been dishonest</Typography></li>
            <li><Typography variant="body1">Where you have been inconsiderate</Typography></li>
            <li><Typography variant="body1">Who you have hurt</Typography></li>
            <li><Typography variant="body1">Whether you've unjustifiably aroused jealousy, suspicion, or bitterness</Typography></li>
          </ul>
          <SexConductForm sexConduct={inventory.sexConduct} onSave={handleSexConductUpdate} />
        </>
      ),
    },
    {
      label: 'Harms Done',
      description: (
        <>
          <Typography variant="body1" paragraph>
            In this section, you'll list the harms you've done to others.
          </Typography>
          <Typography variant="body1" paragraph>
            For each harm, you'll identify:
          </Typography>
          <ul>
            <li><Typography variant="body1">Who you harmed</Typography></li>
            <li><Typography variant="body1">What you did</Typography></li>
            <li><Typography variant="body1">How it affected them</Typography></li>
            <li><Typography variant="body1">What your motives were</Typography></li>
          </ul>
          <HarmsForm harms={inventory.harmsDone} onSave={handleHarmUpdate} />
        </>
      ),
    },
    {
      label: 'Next Steps',
      description: (
        <>
          <Typography variant="body1" paragraph>
            Congratulations on working on your 4th Step inventory! The next steps in the recovery process are:
          </Typography>
          <Typography variant="body1" paragraph>
            5. Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.
          </Typography>
          <Typography variant="body1" paragraph>
            After completing your inventory, you'll work with a sponsor or trusted mentor to go through the 5th Step.
            This involves sharing what you've learned about yourself in this inventory.
          </Typography>
          <Alert severity="success" sx={{ mt: 2 }}>
            Remember: Progress, not perfection. Each step you take in your recovery journey is valuable.
          </Alert>
          <Box sx={{ mt: 4, border: '1px solid', borderColor: 'divider', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Inventory Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {inventory.resentments.length}
                  </Typography>
                  <Typography variant="body2">Resentments</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {inventory.fears.length}
                  </Typography>
                  <Typography variant="body2">Fears</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {inventory.sexConduct.relationships.length}
                  </Typography>
                  <Typography variant="body2">Relationships</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {inventory.harmsDone.length}
                  </Typography>
                  <Typography variant="body2">Harms Done</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Typography variant="body1" sx={{ mt: 3 }}>
              This inventory is private to you. When you're ready to work on your 5th Step,
              consider printing or exporting this inventory to share with your sponsor or trusted mentor.
            </Typography>
          </Box>
        </>
      ),
    },
  ];

  if (!storage || !isReady || (mode === 'authenticated' && sessionLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="4th Step Inventory"
        icon={<PsychologyIcon sx={{ fontSize: 'inherit' }} />}
        subtitle='"Made a searching and fearless moral inventory of ourselves."'
        backgroundImage="/images/step4.png"
        backgroundOverlay="linear-gradient(135deg, rgba(253, 242, 233, 0.78) 0%, rgba(216, 229, 245, 0.62) 50%, rgba(26, 43, 52, 0.58) 100%)"
        backgroundImageStyles={{ filter: 'brightness(1.05)', transform: 'scale(1.035)' }}
        backgroundOverlayStyles={{ mixBlendMode: 'multiply' }}
        invertText
        actions={
          <>
            {mode === 'authenticated' && isPasswordProtected && (
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={handleSecurityClick}
              >
                Protected
              </Button>
            )}
            <Button
              onClick={saveInventory}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={isSaving || isInventoryLocked}
              sx={{
                backgroundColor: '#5DA6A7',
                '&:hover': { backgroundColor: '#4A8F90' },
              }}
            >
              {isSaving ? 'Saving...' : 'Save Progress'}
            </Button>
            {mode === 'authenticated' && (
              <IconButton
                onClick={handleMenuClick}
                color="primary"
                aria-label="more options"
                aria-controls="security-menu"
                aria-haspopup="true"
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {mode === 'authenticated' && (
          <Menu
            id="security-menu"
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleSecurityClick}>
              <ListItemIcon>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {isPasswordProtected ? 'Manage Password Protection' : 'Add Password Protection'}
              </ListItemText>
            </MenuItem>
            <MenuItem component={Link} href="/step4/manage">
              <ListItemIcon>
                <InventoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                Manage Inventories
              </ListItemText>
            </MenuItem>
            {inventoryId && (
              <MenuItem onClick={handleShareClick}>
                <ListItemIcon>
                  <ShareIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  Share Inventory with Sponsor
                </ListItemText>
              </MenuItem>
            )}
          </Menu>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 2,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { md: 'center' },
                gap: 3,
                background: 'linear-gradient(135deg, rgba(93,166,167,0.08), rgba(74,143,144,0.12))'
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Learn More About Step 4
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Explore the Step 4 overview in our 12 Step Explorer to understand the spiritual principles,
                  suggested actions, and supporting resources that accompany this inventory work.
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/steps/4"
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  minWidth: { xs: '100%', md: 220 },
                  backgroundColor: '#5DA6A7',
                  '&:hover': { backgroundColor: '#4A8F90' }
                }}
              >
                Open Step 4 Explorer
              </Button>
            </Paper>
          </Grid>

          {mode === 'guest' && (
            <Grid item xs={12}>
              <Alert severity="info">
                You&apos;re working in Guest Mode. Your 4th Step inventory is saved locally on this device.
                Create an account to back up your progress, enable password protection, and share with your sponsor.
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} lg={8}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Paper elevation={2} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, height: '100%' }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  4th Step - Searching and Fearless Moral Inventory
                </Typography>

                <Typography variant="body1" paragraph>
                  "Made a searching and fearless moral inventory of ourselves."
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {step.label}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Box sx={{ mb: 2 }}>
                          {step.description}
                          <Box sx={{ mt: 3 }}>
                            <div>
                              <Button
                                disabled={index === 0}
                                onClick={handleBack}
                                sx={{ mt: 1, mr: 1 }}
                              >
                                Back
                              </Button>
                              <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{ mt: 1, mr: 1 }}
                              >
                                {index === steps.length - 1 ? 'Finish' : 'Continue'}
                              </Button>
                              {index !== 0 && index !== steps.length - 1 && (
                                <Button
                                  variant="outlined"
                                  onClick={saveInventory}
                                  startIcon={<SaveIcon />}
                                  disabled={isSaving}
                                  sx={{ mt: 1 }}
                                >
                                  Save
                                </Button>
                              )}
                            </div>
                          </Box>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  About the 4th Step
                </Typography>
                <Typography variant="body2" paragraph>
                  The 4th Step is about self-examination. It&apos;s not about punishing yourself for past mistakes,
                  but about understanding the patterns in your thoughts and behaviors so you can change them.
                </Typography>
                <Typography variant="body2">
                  This tool is designed to help you work through the process. It&apos;s recommended to work on this
                  step with the guidance of a sponsor or mentor in recovery.
                </Typography>
              </Alert>
            </Box>
          </Grid>
        </Grid>

        {/* Floating save button for mobile */}
        {isMobile && activeStep > 0 && activeStep < steps.length - 1 && (
          <Fab
            color="primary"
            aria-label="save"
            onClick={saveInventory}
            disabled={isSaving}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <SaveIcon />
          </Fab>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            '& .MuiSnackbarContent-root': {
              bgcolor: snackbar.severity === 'success' ? 'success.main' : 'error.main'
            }
          }}
        />

        {mode === 'authenticated' && (
          <>
            <Dialog
              open={passwordDialogOpen}
              onClose={() => setPasswordDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                Password Protection Settings
              </DialogTitle>
              <DialogContent>
                <PasswordProtectionForm
                  isPasswordProtected={isPasswordProtected}
                  passwordHint={passwordHint}
                  onSave={handlePasswordSave}
                  onCancel={() => setPasswordDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <PasswordPromptDialog
              open={passwordPromptOpen}
              onClose={() => {
                setPasswordPromptOpen(false);
                router.push('/');
              }}
              onSubmit={handlePasswordSubmit}
              passwordHint={passwordHint}
            />

            <Dialog
              open={shareDialogOpen}
              onClose={() => setShareDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Share Your 4th Step Inventory</DialogTitle>
              <DialogContent>
                {inventoryId && (
                  <Box sx={{ py: 2 }}>
                    <Typography paragraph>
                      Sharing your inventory allows your sponsor or trusted mentor to view your 4th Step work,
                      which can be helpful as you prepare for your 5th Step.
                    </Typography>
                    <Typography paragraph>
                      You can share your inventory even if it's not complete yet. This lets your sponsor provide
                      guidance or feedback on your progress.
                    </Typography>
                    <ShareLinkGenerator
                      inventoryId={inventoryId}
                      isPasswordProtected={isPasswordProtected}
                      buttonText="Generate Share Link"
                      variant="contained"
                      buttonProps={{ fullWidth: true }}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShareDialogOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </>
  );
}