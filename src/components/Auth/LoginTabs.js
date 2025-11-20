'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

/**
 * Custom TabPanel component for login methods
 */
function TabPanel({ children, value, index, ...props }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...props}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/**
 * Login Tabs Component
 *
 * Provides a tabbed interface for switching between different login methods
 */
export default function LoginTabs({
  emailLoginComponent,
  smsLoginComponent
}) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="login method tabs"
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Tab
          icon={<EmailIcon />}
          iconPosition="start"
          label="Email"
          id="login-tab-0"
          aria-controls="login-tabpanel-0"
        />
        <Tab
          icon={<PhoneIcon />}
          iconPosition="start"
          label="SMS"
          id="login-tab-1"
          aria-controls="login-tabpanel-1"
        />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
        {emailLoginComponent}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {smsLoginComponent}
      </TabPanel>
    </Box>
  );
}