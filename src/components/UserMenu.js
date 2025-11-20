'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoIcon from '@mui/icons-material/Info';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await signOut({ callbackUrl: '/' });
  };

  const handleProfile = () => {
    handleClose();
    router.push('/profile');
  };

  const handleAbout = () => {
    handleClose();
    router.push('/about');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <Button color="inherit" disabled>
        Loading...
      </Button>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <Box display="flex" gap={1}>
        <Button
          color="inherit"
          startIcon={<InfoIcon fontSize="small" />}
          onClick={() => router.push('/about')}
          sx={{
            textTransform: 'none',
            color: 'white',
            borderRadius: '8px',
            px: 1.5,
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            '& .MuiSvgIcon-root': {
              color: 'white',
              fontSize: '1rem',
            },
          }}
        >
          About
        </Button>
        <Button
          color="inherit"
          startIcon={<LoginIcon fontSize="small" />}
          onClick={handleLogin}
          sx={{
            textTransform: 'none',
            color: 'white',
            borderRadius: '8px',
            px: 1.5,
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            '& .MuiSvgIcon-root': {
              color: 'white',
              fontSize: '1rem',
            },
          }}
        >
          Sign In
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PersonAddIcon fontSize="small" />}
          onClick={handleRegister}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            px: 1.5,
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          }}
        >
          Sign Up
        </Button>
      </Box>
    );
  }

  // Authenticated - show user menu
  const user = session.user;
  const displayName = user.displayName || user.name || user.email || 'User';
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : user.email?.[0].toUpperCase() || 'U';

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'white',
              color: 'primary.main',
              fontSize: '0.875rem',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {user.image ? (
              <img src={user.image} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              initials
            )}
          </Avatar>
        }
        sx={{
          color: 'white',
          textTransform: 'none',
          borderRadius: '20px',
          py: 0.5,
          px: { xs: 0.5, sm: 1.5 },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            ml: 0.5,
            display: { xs: 'none', sm: 'block' },
            fontWeight: 500,
          }}
        >
          {displayName}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: '8px',
              overflow: 'visible',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleProfile} sx={{ py: 1.5, px: 2 }}>
          <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20, color: 'primary.main' }} />
          <Typography variant="body2">Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); router.push('/profile/connection'); }} sx={{ py: 1.5, px: 2 }}>
          <Box component="span" sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12" stroke="#5d88a6" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17 4L20 7M20 4L17 7" stroke="#5d88a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V12L14 14" stroke="#5d88a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Box>
          <Typography variant="body2">Recovery Connection</Typography>
        </MenuItem>
        <MenuItem onClick={handleAbout} sx={{ py: 1.5, px: 2 }}>
          <InfoIcon sx={{ mr: 1.5, fontSize: 20, color: 'info.main' }} />
          <Typography variant="body2">About</Typography>
        </MenuItem>
        {/* Volunteer Dashboard Link - Only show if user has volunteer_listener role */}
        {user.roles?.includes('volunteer_listener') && (
          <MenuItem
            onClick={() => { handleClose(); router.push('/volunteer'); }}
            sx={{ py: 1.5, px: 2 }}
          >
            <VolunteerActivismIcon sx={{ mr: 1.5, fontSize: 20, color: 'success.main' }} />
            <Typography variant="body2">Volunteer Dashboard</Typography>
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2 }}>
          <LogoutIcon sx={{ mr: 1.5, fontSize: 20, color: 'error.main' }} />
          <Typography variant="body2" color="error.main" fontWeight={500}>Sign Out</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

