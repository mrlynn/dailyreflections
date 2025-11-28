'use client';

import { useState } from 'react';
import { List, Typography, Box, Collapse, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import NavItem from './NavItem';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * Navigation section that shows a group of related navigation items
 * Supports nested/collapsible items for multi-level navigation
 * Respects feature flags for both individual items and the entire section
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {Array} props.items - Navigation items to render
 * @param {string} [props.featureFlag] - Optional feature flag for the entire section
 * @param {string} [props.subFeature] - Optional sub-feature for the section
 * @param {function} [props.onItemClick] - Optional click handler for items
 */
export default function NavSection({ title, items = [], featureFlag, subFeature = 'ENABLED', onItemClick }) {
  // Track which parent items are expanded
  const [expandedItems, setExpandedItems] = useState({});

  // Check if the entire section is enabled
  const isSectionEnabled = !featureFlag || useFeatureFlag(featureFlag, subFeature);

  // Don't render if the section is disabled or there are no items
  if (!isSectionEnabled || items.length === 0) return null;

  // Toggle expand/collapse for parent items
  const handleToggle = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Filter out items that will be hidden due to feature flags
  const hasVisibleItems = items.some(item => {
    let flagToCheck = item.featureFlag;
    if (!flagToCheck && item.href !== '/') {
      const pathSegment = item.href?.split('/')[1];
      if (pathSegment) {
        const routeToFeatureMap = {
          'blog': 'BLOG',
          'journal': 'JOURNAL',
          'step4': 'STEP4',
          'sobriety': 'SOBRIETY',
          'today': 'TODAY',
          'profile': 'AUTH',
          'admin': 'ADMIN',
        };
        flagToCheck = routeToFeatureMap[pathSegment];
      }
    }
    return !flagToCheck || true;
  });

  // Don't render empty sections
  if (!hasVisibleItems) return null;

  return (
    <Box sx={{ mb: 0.5 }}>
      {title && (
        <Typography
          variant="caption"
          sx={{
            px: 2,
            mb: 0.25,
            mt: 0.25,
            display: 'block',
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            fontSize: '0.7rem',
          }}
        >
          {title}
        </Typography>
      )}

      <List
        disablePadding
        sx={{
          '& .MuiListItem-root': {
            py: 0.25
          }
        }}
      >
        {items.map((item) => {
          // If item has children, render as collapsible parent
          if (item.children && item.children.length > 0) {
            const isExpanded = expandedItems[item.label] ?? false;
            const Icon = item.icon;

            return (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() => handleToggle(item.label)}
                  sx={{
                    pl: 2,
                    pr: 1,
                    py: 0.75,
                    minHeight: 40,
                    borderRadius: 1,
                    mx: 1,
                    my: 0.25,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {Icon && <Icon fontSize="small" sx={{ color: 'text.secondary' }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                  {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </ListItemButton>
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <NavItem
                        key={child.label}
                        href={child.href}
                        label={child.label}
                        icon={child.icon}
                        featureFlag={child.featureFlag}
                        subFeature={child.subFeature || 'ENABLED'}
                        onClick={onItemClick}
                        nested={true}
                      />
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Regular nav item without children
          return (
            <NavItem
              key={item.label}
              href={item.href}
              label={item.label}
              icon={item.icon}
              featureFlag={item.featureFlag}
              subFeature={item.subFeature || 'ENABLED'}
              onClick={onItemClick}
            />
          );
        })}
      </List>
    </Box>
  );
}
