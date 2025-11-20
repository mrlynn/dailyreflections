'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Container,
  useMediaQuery,
  Tooltip,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoIcon from '@mui/icons-material/Info';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import nav from './navConfig';
import UserMenu from '@/components/UserMenu';
import SobrietyBadge from '@/components/Sobriety/SobrietyBadge';
import DailyThoughtModal from '@/components/DailyThoughtModal';
import Footer from '@/components/Footer/Footer';
import GuestModeBanner from '@/components/GuestModeBanner';
import { useGuestSession } from '@/components/GuestSessionProvider';
import { useDailyThought } from '@/hooks/useDailyThought';

const drawerWidth = 260;

// Import our new NavSection component
import { default as FeatureFlagNavSection } from './NavSection';

// Keep the original NavSection for backward compatibility
function NavSection({ title, items, pathname, onNavigate }) {
  return (
    <FeatureFlagNavSection
      title={title}
      items={items}
      onItemClick={onNavigate}
    />
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.isAdmin === true;
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width:900px)');
  const isMobile = useMediaQuery('(max-width:767px)');
  const { isGuest } = useGuestSession();

  const requiresIdentity = (path) => {
    const protectedPrefixes = [
      '/journal',
      '/step4',
      '/step8',
      '/step9',
      '/sobriety',
      '/profile',
      '/settings',
      '/admin',
    ];

    return protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  };

  const showGuestBanner = isGuest && requiresIdentity(pathname || '/');

  // Use the daily thought hook with autoShow disabled to prevent auto-showing
  // We want to only show it on demand when the user clicks the icon
  const { showModal, openModal, closeModal } = useDailyThought({ autoShow: false });

  const handleToggle = () => setMobileOpen((prev) => !prev);
  const handleNavigate = () => setMobileOpen(false);
  const handleAuthNavigate = (href) => {
    handleNavigate();
    router.push(href);
  };

  const handleSignOut = async () => {
    handleNavigate();
    await signOut({ callbackUrl: '/' });
  };

  // Open the daily thought modal when the user clicks the lightbulb icon
  const handleOpenDailyThought = () => {
    openModal();
  };

  const drawerContent = (
    <Box role="navigation" sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      pt: isDesktop ? 0 : 1
    }}>
      {!isDesktop && (
        <>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Image
                src="/logo.png"
                alt="AA Companion Logo"
                width={28}
                height={28}
                style={{
                  objectFit: 'contain',
                }}
              />
              <Typography variant="h6" fontWeight={700}>AA Companion</Typography>
            </Box>
            <IconButton
              onClick={handleToggle}
              aria-label="Close Navigation"
              sx={{ color: 'text.primary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 1 }} />
        </>
      )}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        px: 1
      }}>
        {isMobile && session?.user && (
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'common.white',
                width: 40,
                height: 40,
              }}
            >
              {(session.user.displayName || session.user.name || session.user.email || 'U')
                .split(' ')
                .map((part) => part?.[0])
                .join('')
                .toUpperCase()
                .substring(0, 2)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {session.user.displayName || session.user.name || session.user.email || 'User'}
              </Typography>
              {session.user.email && (
                <Typography variant="caption" color="text.secondary">
                  {session.user.email}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {isMobile && session?.user && (
          <Box sx={{ px: 2, pb: 1 }}>
            <SobrietyBadge />
          </Box>
        )}
        <NavSection title="Explore" items={nav.primaryNav} pathname={pathname} onNavigate={handleNavigate} />
        <NavSection title="Tools" items={nav.toolsNav} pathname={pathname} onNavigate={handleNavigate} />
        <NavSection title="Resources" items={nav.resourcesNav} pathname={pathname} onNavigate={handleNavigate} />
        <NavSection title="Assistant" items={nav.assistantNav} pathname={pathname} onNavigate={handleNavigate} />
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <NavSection title="Admin" items={nav.adminNav} pathname={pathname} onNavigate={handleNavigate} />
          </>
        )}
        {!isMobile && (
          <Box sx={{ mt: 1 }} />
        )}
        {isMobile && (
          <>
            <Divider sx={{ my: 1 }} />
            <List dense disablePadding>
              <ListItemButton onClick={() => { handleNavigate(); handleOpenDailyThought(); }}>
                <ListItemIcon>
                  <LightbulbOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Today's Thought" />
              </ListItemButton>
              <ListItemButton onClick={() => handleAuthNavigate('/about')}>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="About" />
              </ListItemButton>
              {session?.user ? (
                <>
                  <ListItemButton onClick={() => handleAuthNavigate('/profile')}>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                  <ListItemButton onClick={() => handleAuthNavigate('/profile/connection')}>
                    <ListItemIcon>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M17 4L20 7M20 4L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary="Recovery Connection" />
                  </ListItemButton>
                  {/* Volunteer Dashboard Link - Only show if user has volunteer role */}
                  {session?.user?.roles?.includes('volunteer_listener') && (
                    <ListItemButton onClick={() => handleAuthNavigate('/volunteer')}>
                      <ListItemIcon>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.5 21C16.9183 21 20.5 17.4183 20.5 13C20.5 8.58172 16.9183 5 12.5 5" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M10 7L7 4M7 7L10 4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15 12C15 10.8954 14.1046 10 13 10C11.8954 10 11 10.8954 11 12C11 13.1046 11.8954 14 13 14V16M13 19V19.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Volunteer Dashboard" />
                    </ListItemButton>
                  )}
                  <ListItemButton onClick={handleSignOut}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sign Out"
                      primaryTypographyProps={{ color: 'error.main', fontWeight: 600 }}
                    />
                  </ListItemButton>
                </>
              ) : (
                <>
                  <ListItemButton onClick={() => handleAuthNavigate('/login')}>
                    <ListItemIcon>
                      <LoginIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sign In" />
                  </ListItemButton>
                  <ListItemButton onClick={() => handleAuthNavigate('/register')}>
                    <ListItemIcon>
                      <PersonAddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sign Up" />
                  </ListItemButton>
                </>
              )}
            </List>
          </>
        )}
      </Box>
      <Divider />
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} AA Companion</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      position: 'relative',
      width: '100%',
    }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: (theme) => theme.palette.primary.main,
          width: '100%',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {!isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleToggle}
              aria-label="Open Navigation"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Image
              src="/logo.png"
              alt="AA Companion Logo"
              width={32}
              height={32}
              style={{
                objectFit: 'contain',
              }}
              priority
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'common.white',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              AA Companion
            </Typography>
          </Box>

          {/* Only show sobriety badge when user is authenticated */}
          {!isMobile && session?.user && <SobrietyBadge />}

          {/* Lightbulb icon for daily thoughts */}
          {!isMobile && (
            <Tooltip title="Today's Thought">
              <IconButton
                onClick={handleOpenDailyThought}
                color="inherit"
                sx={{ ml: 1 }}
                aria-label="Show daily thought"
              >
                <LightbulbOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}

          {!isMobile && <UserMenu />}
        </Toolbar>
      </AppBar>

      {/* Daily Thought Modal */}
      <DailyThoughtModal
        open={showModal}
        onClose={closeModal}
        setCookieOnClose={false} // Don't set cookie when closing to allow repeated viewing
      />

      {/* Permanent drawer on desktop */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            position: 'fixed',
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: 'none',
              top: { xs: 56, sm: 64 },
              height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Temporary drawer on mobile */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: { xs: 0, md: `${drawerWidth}px` },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'visible',
          backgroundColor: '#F8F9FA',
          pt: { xs: '56px', sm: '64px' },
          pb: 0,
          px: 0,
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}>
          {showGuestBanner && <GuestModeBanner />}
          {children}
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}


