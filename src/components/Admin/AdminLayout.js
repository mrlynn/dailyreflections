'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Alert, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import { useEffect } from 'react';

const DRAWER_WIDTH = 240;

/**
 * AdminLayout - Layout wrapper for admin pages
 * Provides navigation sidebar and header
 */
export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  // Check if user is admin (check both 'role' field and legacy 'isAdmin' field)
  const isAdmin =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'superadmin' ||
    session?.user?.isAdmin === true;

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          You don't have permission to access the admin area.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Your user info: {JSON.stringify({
              email: session?.user?.email,
              role: session?.user?.role,
              isAdmin: session?.user?.isAdmin
            })}
          </Typography>
        </Box>
      </Container>
    );
  }

  const navigationItems = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: <DashboardIcon />, href: '/admin/course' },
        { label: 'Analytics', icon: <BarChartIcon />, href: '/admin/analytics' },
      ]
    },
    {
      label: 'Content Management',
      items: [
        { label: 'Courses', icon: <SchoolIcon />, href: '/admin/courses' },
        { label: 'All Lessons', icon: <ArticleIcon />, href: '/admin/lessons' },
      ]
    }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
            sx={{ mr: 2 }}
          >
            Back to Site
          </Button>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {session.user.email}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            AA Companion
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          {navigationItems.map((section, sectionIndex) => (
            <Box key={section.label} sx={{ mb: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {section.label}
              </Typography>
              <List sx={{ py: 0 }}>
                {section.items.map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <ListItemButton
                      selected={pathname === item.href}
                      onClick={() => router.push(item.href)}
                      sx={{
                        mx: 1,
                        borderRadius: 1,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: pathname === item.href ? 'white' : 'text.secondary',
                          minWidth: 40,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              {sectionIndex < navigationItems.length - 1 && (
                <Divider sx={{ mx: 2, my: 1 }} />
              )}
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
