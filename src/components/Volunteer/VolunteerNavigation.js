'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';

export default function VolunteerNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Define primary navigation items
  const navItems = [
    { label: 'Dashboard', path: '/volunteer', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Chat', path: '/volunteer/chat', icon: <ChatIcon fontSize="small" /> },
    { label: 'History', path: '/volunteer/history', icon: <HistoryIcon fontSize="small" /> },
    { label: 'Settings', path: '/volunteer/settings', icon: <SettingsIcon fontSize="small" /> },
  ];

  // Define additional resources
  const resourceItems = [
    { label: 'Help & Guidelines', path: '/volunteer/help', icon: <HelpIcon fontSize="small" /> },
    { label: 'Notifications', path: '/volunteer/notifications', icon: <Badge badgeContent={0} color="primary"><NotificationsIcon fontSize="small" /></Badge> },
  ];

  // Determine which tab is active based on the current path
  const getActiveTabIndex = () => {
    // Handle both exact matches and sub-paths
    // For example, /volunteer/history/123 should highlight the History tab
    const exactMatch = navItems.findIndex(item => item.path === pathname);
    if (exactMatch !== -1) return exactMatch;

    // Check for sub-paths
    return navItems.findIndex(item =>
      pathname.startsWith(item.path) && item.path !== '/volunteer'
    );
  };

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    router.push(navItems[newValue].path);
  };

  // Handle resource item clicks
  const handleResourceItemClick = (path) => {
    router.push(path);
  };

  const activeTabIndex = getActiveTabIndex();

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        {/* Title and Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main' }}>
            Volunteer Dashboard
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Main Navigation Tabs */}
        <Tabs
          value={activeTabIndex >= 0 ? activeTabIndex : 0}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          aria-label="volunteer navigation tabs"
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              minHeight: '48px',
              p: isMobile ? '6px 12px' : '6px 16px',
              fontSize: '0.9rem',
            },
          }}
        >
          {navItems.map((item) => (
            <Tab
              key={item.path}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.icon}
                  <span>{item.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Optional: Quick Links Section for larger screens */}
        {!isSmallScreen && (
          <>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 1, mt: 1, mb: 1 }}>
              Resources
            </Typography>
            <List dense disablePadding>
              {resourceItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => handleResourceItemClick(item.path)}
                    selected={pathname === item.path}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Box>
  );
}