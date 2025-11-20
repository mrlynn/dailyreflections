'use client';

import { List, Typography, Box } from '@mui/material';
import NavItem from './NavItem';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * Navigation section that shows a group of related navigation items
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
  // Check if the entire section is enabled
  const isSectionEnabled = !featureFlag || useFeatureFlag(featureFlag, subFeature);

  // Don't render if the section is disabled or there are no items
  if (!isSectionEnabled || items.length === 0) return null;

  // Filter out items that will be hidden due to feature flags
  // to prevent rendering empty sections
  const hasVisibleItems = items.some(item => {
    // Map route paths to feature flags if not explicitly provided
    let flagToCheck = item.featureFlag;
    if (!flagToCheck && item.href !== '/') {
      const pathSegment = item.href.split('/')[1];
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
    return !flagToCheck || (flagToCheck === 'ADMIN' ? true : true); // Admin checking is done separately
  });

  // Don't render empty sections
  if (!hasVisibleItems) return null;

  return (
    <Box sx={{ mb: 0.5 }}>  {/* Further reduced from 1 to 0.5 to tighten spacing between sections */}
      {title && (
        <Typography
          variant="caption"
          sx={{
            px: 2,
            mb: 0.25, // Further reduced from 0.5 to 0.25 to tighten spacing
            mt: 0.25, // Further reduced from 0.5 to 0.25 to tighten spacing
            display: 'block',
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontWeight: 'bold',
          }}
        >
          {title}
        </Typography>
      )}

      <List
        disablePadding
        sx={{
          '& .MuiListItem-root': {
            py: 0.25 // Add reduced padding for list items
          }
        }}
      >
        {items.map((item) => (
          <NavItem
            key={item.label}
            href={item.href}
            label={item.label}
            icon={item.icon}
            featureFlag={item.featureFlag}
            subFeature={item.subFeature || 'ENABLED'}
            onClick={onItemClick}
          />
        ))}
      </List>
    </Box>
  );
}