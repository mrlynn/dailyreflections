'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Chip,
  Tooltip,
  Avatar,
  InputAdornment,
  FormControlLabel,
  Switch,
  Grid,
  Pagination,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [page, activeTab, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    // In a real implementation, this would call an API
    // For now, we'll simulate with mock data
    setTimeout(() => {
      const mockUsers = Array(10).fill().map((_, index) => ({
        id: `user-${index + (page - 1) * 10}`,
        name: `User ${index + (page - 1) * 10}`,
        email: `user${index + (page - 1) * 10}@example.com`,
        displayName: `Display Name ${index + (page - 1) * 10}`,
        createdAt: new Date(2023, 0, index + 1).toISOString(),
        lastLogin: new Date(2023, 11, index + 15).toISOString(),
        commentsCount: Math.floor(Math.random() * 50),
        isActive: Math.random() > 0.2,
        isAdmin: index === 0 || (index % 10 === 0),
        avatar: null,
      }));

      // Filter by tab
      let filtered = [...mockUsers];
      if (activeTab === 1) {
        filtered = filtered.filter(user => user.isAdmin);
      } else if (activeTab === 2) {
        filtered = filtered.filter(user => !user.isActive);
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.displayName.toLowerCase().includes(query)
        );
      }

      setUsers(filtered);
      setTotalPages(5); // In a real implementation, this would be calculated
      setLoading(false);
    }, 1000);
  };

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    setCurrentUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleMakeAdmin = (userId, isAdmin) => {
    // In a real implementation, this would call an API
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isAdmin } : user
    ));
  };

  const handleToggleActive = (userId, isActive) => {
    // In a real implementation, this would call an API
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isActive } : user
    ));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontFamily: 'var(--font-poppins)' }}>
          User Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="All Users" />
            <Tab label="Administrators" />
            <Tab label="Inactive Users" />
          </Tabs>
        </Box>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search users by name or email"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Role</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="center">Comments</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar src={user.avatar} sx={{ mr: 1 }}>
                          {user.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {user.displayName || user.name}
                          </Typography>
                          {user.displayName && (
                            <Typography variant="caption" color="text.secondary">
                              {user.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.isAdmin ? "Admin" : "User"}
                        color={user.isAdmin ? "primary" : "default"}
                        icon={user.isAdmin ? <AdminPanelSettingsIcon fontSize="small" /> : undefined}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.isActive ? "Active" : "Inactive"}
                        color={user.isActive ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell align="center">{user.commentsCount}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit User">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit', user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {user.isAdmin ? (
                        <Tooltip title="Remove Admin">
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => handleMakeAdmin(user.id, false)}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Make Admin">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleMakeAdmin(user.id, true)}
                          >
                            <AdminPanelSettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user.isActive ? (
                        <Tooltip title="Deactivate User">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleToggleActive(user.id, false)}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Activate User">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleToggleActive(user.id, true)}
                          >
                            <PersonAddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDialog('delete', user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

      {/* User Dialog - Add/Edit/Delete */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' && 'Add New User'}
          {dialogMode === 'edit' && 'Edit User'}
          {dialogMode === 'password' && 'Reset Password'}
          {dialogMode === 'delete' && 'Delete User'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'delete' ? (
            <DialogContentText>
              Are you sure you want to delete the user "{currentUser?.displayName || currentUser?.name}"? This action cannot be undone.
            </DialogContentText>
          ) : dialogMode === 'password' ? (
            <Box sx={{ pt: 1 }}>
              <DialogContentText sx={{ mb: 2 }}>
                Reset password for user "{currentUser?.displayName || currentUser?.name}". A new password will be generated and sent to their email.
              </DialogContentText>
              <TextField
                fullWidth
                label="Confirm user email"
                variant="outlined"
                value={currentUser?.email}
                disabled
              />
            </Box>
          ) : (
            <Box component="form" noValidate sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    defaultValue={currentUser?.name || ''}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    name="displayName"
                    defaultValue={currentUser?.displayName || ''}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={currentUser?.email || ''}
                    required
                  />
                </Grid>
                {dialogMode === 'add' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      required
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={currentUser ? currentUser.isActive : true}
                        name="isActive"
                      />
                    }
                    label="Active"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={currentUser ? currentUser.isAdmin : false}
                        name="isAdmin"
                      />
                    }
                    label="Administrator"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={dialogMode === 'delete' ? 'error' : 'primary'}
            onClick={handleCloseDialog}
          >
            {dialogMode === 'add' && 'Add User'}
            {dialogMode === 'edit' && 'Save Changes'}
            {dialogMode === 'password' && 'Reset Password'}
            {dialogMode === 'delete' && 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}