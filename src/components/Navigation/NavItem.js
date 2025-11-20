'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

/**
 * NavItem component that checks feature flags before rendering
 * If the associated feature is disabled, the item is not rendered
 *
 * @param {Object} props - Component props
 * @param {string} props.href - The link href
 * @param {string} props.label - The text label
 * @param {React.Component} props.icon - The icon component to render
 * @param {string} [props.featureFlag] - Optional feature flag key to check
 * @param {string} [props.subFeature] - Optional sub-feature key to check
 * @param {function} [props.onClick] - Optional onClick handler (e.g., for closing mobile menu)
 */
export default function NavItem({ href, label, icon: Icon, featureFlag, subFeature = 'ENABLED', onClick }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  // Map route paths to feature flags if not explicitly provided
  let flagToCheck = featureFlag;
  if (!flagToCheck && href !== '/') {
    const pathSegment = href.split('/')[1];
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

  // If no feature flag is associated or it's the home route, always render
  const isEnabled = !flagToCheck || useFeatureFlag(flagToCheck, subFeature);

  // Don't render if the feature is disabled
  if (!isEnabled) return null;

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={href}
        selected={isActive}
        onClick={onClick}
        sx={{
          borderRadius: 1,
          mb: 0.1, // Further reduced from 0.2 to 0.1 to tighten spacing between menu items
          py: 0.5,  // Reduce vertical padding inside each item (default is 8px/1)
          '&.Mui-selected': {
            backgroundColor: 'primary.lighter',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
          },
        }}
      >
        {Icon && (
          <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'inherit' }}>
            <Icon fontSize="small" />
          </ListItemIcon>
        )}
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: isActive ? 'bold' : 'normal',
            color: isActive ? 'primary.main' : 'inherit',
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}