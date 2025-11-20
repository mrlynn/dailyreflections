'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  FormHelperText,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { CHAT_CONFIG } from '@/lib/constants/configKeys';

// TabPanel component for tab content
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chatConfig, setChatConfig] = useState({
    [CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE]: '',
    [CHAT_CONFIG.USER_WAITING_MESSAGE]: '',
    [CHAT_CONFIG.SESSION_INACTIVITY_TIMEOUT]: 30,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch config data
  useEffect(() => {
    async function fetchConfigData() {
      try {
        const response = await fetch('/api/admin/config?category=chat');

        if (!response.ok) {
          throw new Error(`Failed to fetch configuration: ${response.status}`);
        }

        const data = await response.json();

        // Initialize config with fetched values
        const newChatConfig = { ...chatConfig };

        data.configs.forEach(config => {
          newChatConfig[config.key] = config.value;
        });

        setChatConfig(newChatConfig);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching configuration:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load configuration settings',
          severity: 'error'
        });
        setLoading(false);
      }
    }

    fetchConfigData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (key) => (event) => {
    setChatConfig({
      ...chatConfig,
      [key]: event.target.value
    });
  };

  const handleSaveConfig = async (key) => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value: chatConfig[key],
          category: 'chat'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }

      setSnackbar({
        open: true,
        message: 'Configuration saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save configuration',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && Object.values(chatConfig).every(v => !v)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
        System Configuration
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Configuration tabs">
          <Tab label="Chat Settings" />
          <Tab label="System Settings" />
          <Tab label="User Settings" />
        </Tabs>

        {/* Chat Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Volunteer Welcome Message */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Volunteer Welcome Message
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This message will automatically be sent when a volunteer joins a chat session.
                  </Typography>
                  <TextField
                    label="Welcome Message"
                    multiline
                    rows={4}
                    fullWidth
                    value={chatConfig[CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE] || ''}
                    onChange={handleInputChange(CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE)}
                    variant="outlined"
                    placeholder="Enter the standard welcome message for volunteers"
                    helperText="This message will be sent automatically when a volunteer joins a chat session"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    color="primary"
                    onClick={() => handleSaveConfig(CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE)}
                  >
                    Save Welcome Message
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* User Waiting Message */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    User Waiting Message
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This message will be shown to users while they wait for a volunteer.
                  </Typography>
                  <TextField
                    label="Waiting Message"
                    multiline
                    rows={4}
                    fullWidth
                    value={chatConfig[CHAT_CONFIG.USER_WAITING_MESSAGE] || ''}
                    onChange={handleInputChange(CHAT_CONFIG.USER_WAITING_MESSAGE)}
                    variant="outlined"
                    placeholder="Enter the message shown to users while waiting"
                    helperText="Displayed to users while waiting for a volunteer"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    color="primary"
                    onClick={() => handleSaveConfig(CHAT_CONFIG.USER_WAITING_MESSAGE)}
                  >
                    Save Waiting Message
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Session Timeout */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Session Inactivity Timeout
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Number of minutes after which an inactive chat session will be closed.
                  </Typography>
                  <TextField
                    label="Timeout (minutes)"
                    type="number"
                    fullWidth
                    value={chatConfig[CHAT_CONFIG.SESSION_INACTIVITY_TIMEOUT] || 30}
                    onChange={handleInputChange(CHAT_CONFIG.SESSION_INACTIVITY_TIMEOUT)}
                    variant="outlined"
                    inputProps={{ min: 5, max: 120 }}
                    helperText="Range: 5-120 minutes"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    color="primary"
                    onClick={() => handleSaveConfig(CHAT_CONFIG.SESSION_INACTIVITY_TIMEOUT)}
                  >
                    Save Timeout Setting
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            System Settings will be available in a future update
          </Typography>
        </TabPanel>

        {/* User Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            User Settings will be available in a future update
          </Typography>
        </TabPanel>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}