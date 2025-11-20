'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Breadcrumbs,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

/**
 * Consistent header component for volunteer pages
 *
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {boolean} props.showBackButton - Whether to show the back button
 * @param {string} props.backPath - Path to navigate to when back button is clicked (defaults to /volunteer)
 * @param {React.ReactNode} props.action - Optional action button/component to display on the right
 * @param {Object} props.breadcrumbs - Optional breadcrumbs configuration
 * @param {Object} props.status - Optional status chip configuration
 */
export default function VolunteerPageHeader({
  title,
  showBackButton = false,
  backPath = '/volunteer',
  action,
  breadcrumbs,
  status
}) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleBack = () => {
    router.push(backPath);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {showBackButton && (
            <IconButton
              color="inherit"
              sx={{ mr: 1 }}
              onClick={handleBack}
              aria-label="Go back"
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Box>
            {breadcrumbs ? (
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 0.5 }}>
                {breadcrumbs.map((crumb, index) => (
                  <Link
                    key={index}
                    href={crumb.path}
                    style={{
                      color: index === breadcrumbs.length - 1 ? 'inherit' : theme.palette.primary.main,
                      textDecoration: 'none',
                      fontSize: '0.75rem'
                    }}
                    passHref
                  >
                    {crumb.label}
                  </Link>
                ))}
              </Breadcrumbs>
            ) : null}

            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h1"
              sx={{ fontWeight: 600 }}
            >
              {title}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {status && (
            <Chip
              label={status.label}
              color={status.color || "default"}
              icon={status.icon}
              size="small"
            />
          )}

          {action}
        </Box>
      </Paper>
    </Box>
  );
}