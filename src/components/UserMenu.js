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
          startIcon={<LoginIcon />}
          onClick={handleLogin}
          sx={{ textTransform: 'none' }}
        >
          Sign In
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<PersonAddIcon />}
          onClick={handleRegister}
          sx={{ textTransform: 'none' }}
        >
          Sign Up
        </Button>
      </Box>
    );
  }

  // Authenticated - show user menu
  const user = session.user;
  const initials = user.name
    ? user.name
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
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: 'primary.main', fontSize: '0.875rem' }}>
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
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
          {user.name || user.email}
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
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {user.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <AccountCircleIcon sx={{ mr: 1, fontSize: 20 }} />
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
}

