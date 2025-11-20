'use client';

import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  ListItem,
  ListItemText,
  Tooltip,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import { VISIBILITY } from '@/lib/connection-profiles/constants';

/**
 * Contact field component with visibility indicator
 */
export default function ContactField({
  field,
  onEdit,
  onDelete,
  readOnly = false
}) {
  const getVisibilityInfo = (visibility) => {
    switch (visibility) {
      case VISIBILITY.PUBLIC:
        return {
          icon: <PublicIcon fontSize="small" />,
          color: 'error',
          label: 'Public',
          description: 'Visible to anyone with your link'
        };
      case VISIBILITY.AUTHENTICATED:
        return {
          icon: <PersonIcon fontSize="small" />,
          color: 'warning',
          label: 'App Users',
          description: 'Visible to logged-in users'
        };
      case VISIBILITY.CONNECTIONS:
        return {
          icon: <PeopleIcon fontSize="small" />,
          color: 'success',
          label: 'Connections',
          description: 'Visible to approved connections only'
        };
      case VISIBILITY.PRIVATE:
      default:
        return {
          icon: <LockIcon fontSize="small" />,
          color: 'default',
          label: 'Private',
          description: 'Only visible to you'
        };
    }
  };

  const visibilityInfo = getVisibilityInfo(field.visibility);

  // Get icon for contact field type
  const getTypeIcon = (type) => {
    // You can add more icons based on field types
    return null;
  };

  return (
    <ListItem
      divider
      secondaryAction={
        !readOnly && (
          <Box>
            <Tooltip title="Edit">
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => onEdit(field)}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onDelete(field)}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    >
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            {getTypeIcon(field.type)}
            <Typography variant="body1">
              {field.label || field.type}
            </Typography>
            <Tooltip title={visibilityInfo.description}>
              <Chip
                size="small"
                label={visibilityInfo.label}
                color={visibilityInfo.color}
                icon={visibilityInfo.icon}
                variant="outlined"
              />
            </Tooltip>
          </Box>
        }
        secondary={field.value}
      />
    </ListItem>
  );
}